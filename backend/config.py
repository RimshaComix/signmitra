import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

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
    
    BASE_DIR: Path = BASE_DIR
    ROOT_DIR: Path = ROOT_DIR

    # Storage
    DATA_DIR: Path = BASE_DIR / "data"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'signmitra.db'}"
    
    # Multi-Provider AI Configuration
    AI_PROVIDER: Optional[str] = os.getenv("AI_PROVIDER", None)
    AI_MODEL: Optional[str] = os.getenv("AI_MODEL", None)
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)

    # Provider-specific keys
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    CEREBRAS_API_KEY: Optional[str] = os.getenv("CEREBRAS_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Places Search Provider Configuration
    GOOGLE_PLACES_API_KEY: Optional[str] = os.getenv("GOOGLE_PLACES_API_KEY", None)
    GOOGLE_MAPS_API_KEY: Optional[str] = os.getenv("GOOGLE_MAPS_API_KEY", None)
    PLACES_PROVIDER: str = os.getenv("PLACES_PROVIDER", "google")

    # ISL Recognition API URL
    ISL_PYTHON_API: str = os.getenv("ISL_PYTHON_API", "http://127.0.0.1:8000")

    REQUEST_TIMEOUT_SECONDS: int = 30

    model_config = {
        "env_file": str(ROOT_DIR / ".env"),
        "extra": "ignore"
    }

settings = Settings()

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
