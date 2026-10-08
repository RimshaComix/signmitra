from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "SignMitra AI Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    HOST: str = "127.0.0.1"
    PORT: int = 8000

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

    # -----------------------------------------------------------------
    # Paths
    # -----------------------------------------------------------------

    BASE_DIR: Path = BASE_DIR
    ROOT_DIR: Path = ROOT_DIR

    # -----------------------------------------------------------------
    # Storage
    # -----------------------------------------------------------------

    DATA_DIR: Path = BASE_DIR / "data"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'signmitra.db'}"

    # -----------------------------------------------------------------
    # Multi-Provider AI Configuration
    # -----------------------------------------------------------------

    # Leave AI_PROVIDER empty in .env for automatic provider selection,
    # or explicitly set it to: groq / gemini / cerebras / openai / ollama
    AI_PROVIDER: Optional[str] = None

    # Optional model override.
    # If empty, each provider uses its adapter's default model.
    AI_MODEL: Optional[str] = None

    # Optional generic API key fallback.
    AI_API_KEY: Optional[str] = None

    # -----------------------------------------------------------------
    # Provider-specific AI keys
    # -----------------------------------------------------------------

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    GROQ_API_KEY: Optional[str] = None

    CEREBRAS_API_KEY: Optional[str] = None

    OPENAI_API_KEY: Optional[str] = None

    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # -----------------------------------------------------------------
    # Places Search Provider Configuration
    # -----------------------------------------------------------------

    GOOGLE_PLACES_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    PLACES_PROVIDER: str = "google"

    # -----------------------------------------------------------------
    # ISL Recognition API
    # -----------------------------------------------------------------

    ISL_PYTHON_API: str = "http://127.0.0.1:8000"

    # -----------------------------------------------------------------
    # General
    # -----------------------------------------------------------------

    REQUEST_TIMEOUT_SECONDS: int = 30

    # -----------------------------------------------------------------
    # Pydantic Settings Configuration
    # -----------------------------------------------------------------

    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)