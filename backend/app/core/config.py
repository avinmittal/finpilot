import logging
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-5"
    jwt_secret: str  # Required — set JWT_SECRET in your .env file
    database_url: str = "sqlite:///./data/finpilot.db"
    frontend_origin: str = "http://localhost:5173"
    frontend_origins: str = "http://localhost:5173,https://avinmittal.github.io"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if not self.openai_api_key:
            logger.warning("OPENAI_API_KEY not set; AI responses will use regex fallback only")
        return self

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]
        if self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        return origins

settings = Settings()
