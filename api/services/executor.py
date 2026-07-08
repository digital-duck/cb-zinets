"""Stream spl3 run as a subprocess, yielding SSE-ready dicts.

Run the backend inside the spl123 conda env so that `spl3` is on PATH:
    conda activate spl123
    pip install -r requirements-api.txt
    uvicorn api.app:app --port 8000 --reload
"""
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import unquote

from api.config import settings

_REPO_ROOT = Path(__file__).parent.parent.parent
_SPL_DIR = _REPO_ROOT / "spl"

# Maps short model names (used in folder paths and UI) to spl3 --llm strings.
# gemma3 is the default: runs locally via Ollama without GPU, zero cost.
_MODEL_TO_LLM: dict[str, str] = {
    "gemma3":  "ollama:gemma3",
    "gemma4":  "ollama:gemma4",
    "sonnet":  "claude_cli:claude-sonnet-4-6",
    "haiku":   "claude_cli:claude-haiku-4-5-20251001",
    "opus":    "claude_cli:claude-opus-4-8",
}


def _get_output_dir(domain_id: str, level: str, language: str, model: str) -> Path:
    return settings.public_domains / domain_id / "output" / f"{level}.{language}" / model / "html"


def _get_shared_concepts_dir(level: str, language: str, model: str) -> Path:
    return settings.public_domains.parent / "concepts" / f"{level}.{language}" / model


def _build_spl_cmd(
    domain_id: str,
    target: str,
    level: str,
    language: str,
    model: str,
    output_dir: Path,
    skip_cache: bool = False,
) -> tuple[list[str], dict[str, str]]:
    llm = _MODEL_TO_LLM.get(model, settings.llm)
    shared_concepts_dir = _get_shared_concepts_dir(level, language, model)

    if settings.use_concept_cache:
        spl_file = _SPL_DIR / "build_concept_book_cache.spl"
        cache_params = ["--param", f"db_path={settings.db_path}"]
    else:
        spl_file = _SPL_DIR / "build_concept_book.spl"
        cache_params = []

    cmd = [
        "spl3", "run", str(spl_file),
        "--tools", str(_SPL_DIR / "tools.py"),
        "--llm", llm,
        "--llm-max-output-tokens", str(settings.spl_max_tokens),
        "--param", f"domain_yaml={domain_id}_graph.yaml",
        "--param", f"target={target}",
        "--param", f"lvl={level}",
        "--param", f"language={language}",
        "--param", f"output_dir={output_dir}",
        "--param", f"shared_concepts_dir={shared_concepts_dir}",
        "--param", f"skip_cache={'yes' if skip_cache else 'no'}",
        "--param", f"llm={llm}",
        *cache_params,
    ]

    spl_env = {
        **os.environ,
        "SPL_WHILE_MAX_ITER": str(settings.spl_while_max_iter),
        "SPL_MAX_LLM_CALLS": str(settings.spl_max_llm_calls),
    }

    return cmd, spl_env


def _build_spl_cmd_concept(
    concept: str,
    level: str,
    language: str,
    model: str,
    skip_cache: bool = False,
) -> tuple[list[str], dict[str, str]]:
    """Build the spl3 command for a standalone primitive concept (kind='concept').

    No domain.yaml, no book — writes concept_{concept}.html straight to the
    shared canonical directory. See spl/build_concept_only.spl.
    """
    llm = _MODEL_TO_LLM.get(model, settings.llm)
    output_dir = _get_shared_concepts_dir(level, language, model)

    cmd = [
        "spl3", "run", str(_SPL_DIR / "build_concept_only.spl"),
        "--tools", str(_SPL_DIR / "tools.py"),
        "--llm", llm,
        "--llm-max-output-tokens", str(settings.spl_max_tokens),
        "--param", f"concept={concept}",
        "--param", f"lvl={level}",
        "--param", f"language={language}",
        "--param", f"output_dir={output_dir}",
        "--param", f"skip_cache={'yes' if skip_cache else 'no'}",
        "--param", f"llm={llm}",
        "--param", f"db_path={settings.db_path}",
    ]

    spl_env = {
        **os.environ,
        "SPL_WHILE_MAX_ITER": str(settings.spl_while_max_iter),
        "SPL_MAX_LLM_CALLS": str(settings.spl_max_llm_calls),
    }

    return cmd, spl_env


async def stream_generate(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
    skip_cache: bool = False,
):
    """Direct SSE generator — kept for backward compatibility with GET /api/generate."""
    domain_id = unquote(domain_id)
    output_dir = _get_output_dir(domain_id, level, language, model)
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd, spl_env = _build_spl_cmd(domain_id, target, level, language, model, output_dir, skip_cache)

    yield {"event": "started", "data": json.dumps({"domain": domain_id, "target": target, "model": model})}

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(_SPL_DIR),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=spl_env,
    )

    assert proc.stdout is not None
    async for raw in proc.stdout:
        line = raw.decode(errors="replace").rstrip()
        if line:
            yield {"event": "log", "data": json.dumps({"message": line})}

    await proc.wait()

    if proc.returncode == 0:
        from api.services.catalog_svc import mark_book_generated
        mark_book_generated(domain_id, target, level, language, model)
        yield {"event": "done", "data": json.dumps({"domain": domain_id, "target": target, "model": model})}
    else:
        yield {
            "event": "gen_error",
            "data": json.dumps({"message": f"spl3 exited {proc.returncode}"}),
        }
