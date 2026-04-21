from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-5"
    jwt_secret: str = "change-me"
    database_url: str = "sqlite:///./data/finpilot.db"
    frontend_origin: str = "http://localhost:5173"
    frontend_origins: str = "http://localhost:5173,https://avinmittal.github.io"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]
        if self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        return origins

settings = Settings()
