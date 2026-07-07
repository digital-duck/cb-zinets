"""LLM provider API keys — stored in a gitignored .env at the repo root and
mirrored into this process's environment, so spl3 subprocess calls (which
inherit os.environ, see executor.py._build_spl_cmd) pick them up without a
server restart.

Never returns a raw key once saved — only a masked preview. The env var
names match the SPL.py framework's own adapter conventions (see
~/projects/digital-duck/SPL.py/example.env) so a key entered here works
immediately with the corresponding spl3 adapter.
"""
from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
ENV_PATH = REPO_ROOT / ".env"

# provider id (used by the API/UI) -> env var name (used by spl3 adapters)
PROVIDERS: dict[str, str] = {
    "anthropic": "ANTHROPIC_API_KEY",
    "gemini": "GOOGLE_API_KEY",
    "openai": "OPENAI_API_KEY",
    "qwen": "DASHSCOPE_API_KEY",
    "z": "ZHIPUAI_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
}


def _read_env() -> dict[str, str]:
    if not ENV_PATH.exists():
        return {}
    out: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip()
    return out


def _write_env(env_vars: dict[str, str]) -> None:
    import tempfile
    lines = [f"{k}={v}" for k, v in sorted(env_vars.items())]
    text = "\n".join(lines) + ("\n" if lines else "")
    fd, tmp = tempfile.mkstemp(dir=str(ENV_PATH.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
        os.replace(tmp, ENV_PATH)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def load_into_environ() -> None:
    """Call once at API startup. Existing os.environ values win (real env
    vars override the .env file, matching common dotenv semantics)."""
    for key, val in _read_env().items():
        os.environ.setdefault(key, val)


def _mask(value: str) -> str:
    if len(value) <= 8:
        return "••••"
    return f"{value[:4]}…{value[-4:]}"


def get_status() -> dict[str, dict]:
    """{provider: {configured, masked}} — never the raw key."""
    return {
        provider: (
            {"configured": True, "masked": _mask(val)}
            if (val := os.environ.get(env_var))
            else {"configured": False, "masked": None}
        )
        for provider, env_var in PROVIDERS.items()
    }


def set_key(provider: str, api_key: str) -> dict:
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider}")
    env_var = PROVIDERS[provider]
    api_key = api_key.strip()
    if not api_key:
        raise ValueError("API key cannot be empty")

    os.environ[env_var] = api_key
    env_vars = _read_env()
    env_vars[env_var] = api_key
    _write_env(env_vars)
    return {"configured": True, "masked": _mask(api_key)}


def clear_key(provider: str) -> None:
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider}")
    env_var = PROVIDERS[provider]
    os.environ.pop(env_var, None)
    env_vars = _read_env()
    if env_var in env_vars:
        del env_vars[env_var]
        _write_env(env_vars)
