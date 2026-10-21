import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "SilentNeed AI — Detecting Invisible Community Problems"
    API_V1_STR: str = "/api/v1"
    
    # Database: Supports PostgreSQL via DATABASE_URL; falls back to SQLite automatically
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./silentneed.db"
    )
    
    # Model configuration
    ML_MODEL_VERSION: str = "v1.2.0-RF-Ensemble"
    DEFAULT_CONFIDENCE_THRESHOLD: float = 0.70
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
