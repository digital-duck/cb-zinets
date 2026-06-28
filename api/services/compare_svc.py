"""Stream a concept comparison via spl3 run compare_concepts.spl."""
import asyncio
import hashlib
import json
import re
import tempfile
import time
from pathlib import Path

from api.config import settings

_REPO_ROOT = Path(__file__).parent.parent.parent
_SPL_DIR = _REPO_ROOT / "spl"

_MODEL_TO_LLM: dict[str, str] = {
    "gemma3": "ollama:gemma3",
    "gemma4": "ollama:gemma4",
    "sonnet": "claude_cli:claude-sonnet-4-6",
    "haiku":  "claude_cli:claude-haiku-4-5-20251001",
    "opus":   "claude_cli:claude-opus-4-8",
}


def _extract_text(html: str) -> str:
    """Extract readable text from a concept HTML page's <main> element."""
    m = re.search(r'<main>(.*?)</main>', html, re.DOTALL)
    content = m.group(1) if m else html
    text = re.sub(r'<[^>]+>', ' ', content)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text.strip())
    return text


def _cache_path(domain_id: str, concept: str, level_a: str, lang_a: str, model_a: str,
                level_b: str, lang_b: str, model_b: str) -> Path:
    # Sort the two pane specs so (A vs B) and (B vs A) share the same cache entry.
    spec_a = (level_a, lang_a, model_a or 'default')
    spec_b = (level_b, lang_b, model_b or 'default')
    pane1, pane2 = sorted([spec_a, spec_b])
    key = f"{domain_id}:{concept}:{':'.join(pane1)}:{':'.join(pane2)}"
    h = hashlib.sha256(key.encode()).hexdigest()[:16]
    return Path(f"/tmp/cb_compare_{h}.md")


def _concept_file(domain_id: str, concept: str, level: str, lang: str, model: str) -> Path:
    base = settings.public_domains / domain_id / "output" / f"{level}.{lang}"
    if model:
        return base / model / "html" / f"concept_{concept}.html"
    return base / "html" / f"concept_{concept}.html"


async def stream_compare(
    domain_id: str,
    concept: str,
    level_a: str,
    lang_a: str,
    model_a: str,
    level_b: str,
    lang_b: str,
    model_b: str,
    skip_cache: bool = False,
):
    cache_file = _cache_path(domain_id, concept, level_a, lang_a, model_a, level_b, lang_b, model_b)
    ttl = settings.compare_cache_ttl
    if not skip_cache and cache_file.exists():
        age = time.time() - cache_file.stat().st_mtime
        if ttl == 0 or age < ttl:
            comparison = cache_file.read_text(encoding='utf-8')
            yield {"event": "compare_done", "data": json.dumps({"comparison": comparison, "from_cache": True})}
            return

    llm = _MODEL_TO_LLM.get(model_a, _MODEL_TO_LLM.get(model_b, settings.llm))

    file_a = _concept_file(domain_id, concept, level_a, lang_a, model_a)
    file_b = _concept_file(domain_id, concept, level_b, lang_b, model_b)

    if not file_a.exists():
        yield {"event": "compare_error", "data": json.dumps({"message": f"Section A not found: {file_a.name}"})}
        return
    if not file_b.exists():
        yield {"event": "compare_error", "data": json.dumps({"message": f"Section B not found: {file_b.name}"})}
        return

    text_a = _extract_text(file_a.read_text(encoding='utf-8'))
    text_b = _extract_text(file_b.read_text(encoding='utf-8'))

    domain_name = domain_id.replace('_', ' ').title()
    concept_label = concept.replace('_', ' ').title()
    model_a_label = model_a or 'default'
    model_b_label = model_b or 'default'

    tmp_a = tmp_b = tmp_result = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='_a.txt', delete=False, encoding='utf-8') as f:
            f.write(text_a)
            tmp_a = f.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='_b.txt', delete=False, encoding='utf-8') as f:
            f.write(text_b)
            tmp_b = f.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='_result.txt', delete=False, encoding='utf-8') as f:
            tmp_result = f.name

        cmd = [
            "spl3", "run", str(_SPL_DIR / "compare_concepts.spl"),
            "--tools", str(_SPL_DIR / "tools.py"),
            "--llm", llm,
            "--param", f"section_a_file={tmp_a}",
            "--param", f"section_b_file={tmp_b}",
            "--param", f"output_file={tmp_result}",
            "--param", f"domain={domain_name}",
            "--param", f"concept={concept_label}",
            "--param", f"level_a={level_a}",
            "--param", f"level_b={level_b}",
            "--param", f"lang_a={lang_a}",
            "--param", f"lang_b={lang_b}",
            "--param", f"model_a={model_a_label}",
            "--param", f"model_b={model_b_label}",
            "--param", f"llm={llm}",
        ]

        yield {"event": "compare_started", "data": json.dumps({
            "domain": domain_id, "concept": concept,
            "model_a": model_a_label, "model_b": model_b_label,
        })}

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(_SPL_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        assert proc.stdout is not None
        async for raw in proc.stdout:
            line = raw.decode(errors="replace").rstrip()
            if line:
                yield {"event": "log", "data": json.dumps({"message": line})}

        await proc.wait()

        if proc.returncode == 0:
            result_path = Path(tmp_result)
            comparison = result_path.read_text(encoding='utf-8') if result_path.exists() else ""
            cache_file.write_text(comparison, encoding='utf-8')
            yield {"event": "compare_done", "data": json.dumps({"comparison": comparison, "from_cache": False})}
        else:
            yield {"event": "compare_error", "data": json.dumps({"message": f"spl3 exited {proc.returncode}"})}

    finally:
        for p in [tmp_a, tmp_b, tmp_result]:
            if p:
                Path(p).unlink(missing_ok=True)
