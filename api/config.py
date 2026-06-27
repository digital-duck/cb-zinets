from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    spl_dir: Path = Path.home() / "projects/digital-duck/SPL.py"
    public_domains: Path = Path(__file__).parent.parent / "public" / "domains"
    spl_file: str = "build_concept_book.spl"
    llm: str = "claude_cli:claude-sonnet-4-6"
    default_model: str = "gemma4"

    model_config = {"env_prefix": "CB_", "env_file": ".env"}


settings = Settings()
