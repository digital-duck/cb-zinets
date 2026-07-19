import sys
from pathlib import Path
from pydantic_settings import BaseSettings

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from cb_config import DB_PATH as _CFG_DB_PATH  # noqa: E402


class Settings(BaseSettings):
    spl_dir: Path = Path.home() / "projects/digital-duck/SPL.py"
    public_domains: Path = Path(__file__).parent.parent / "public" / "domains"
    llm: str = "claude_cli:claude-sonnet-4-6"
    default_model: str = "gemma4"
    compare_cache_ttl: int = 86400  # seconds; 0 = never expire
    spl_while_max_iter: int = 50
    spl_max_llm_calls: int = 50
    spl_max_tokens: int = 4000
    task_max_concurrent: int = 2
    use_concept_cache: bool = True
    db_path: Path = _CFG_DB_PATH  # from config.yaml (database.path); CB_DB_PATH overrides
    admin_password: str | None = None  # CB_ADMIN_PASSWORD; unset → random, logged once at seed time

    # Google OAuth (CB_GOOGLE_*) — same OAuth client as zinets_vis; unset → button hidden, endpoints 503
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    frontend_url: str = "http://localhost:5173/cb-zinets/"  # where the OAuth callback sends the browser back
    session_secret: str | None = None  # CB_SESSION_SECRET; signs the OAuth state cookie (unset → random per boot)

    model_config = {"env_prefix": "CB_", "env_file": ".env"}


settings = Settings()
