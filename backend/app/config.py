"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/uapa"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/uapa"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # App
    PROJECT_NAME: str = "UAPA API"
    DEBUG: bool = True
    
    # Auth
    SECRET_KEY: str = "supersecretkey"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
