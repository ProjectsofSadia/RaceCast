from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://racecast:racecast@localhost:5432/racecast"
    REDIS_URL: str = "redis://localhost:6379"
    # Stored as a raw string so pydantic never tries to JSON-decode it.
    # Use the `cors_origins` property to get the parsed list.
    CORS_ORIGINS: str = "http://localhost:3000"
    SECRET_KEY: str = "dev-secret-key"
    OPENF1_BASE_URL: str = "https://api.openf1.org/v1"

    @property
    def cors_origins(self) -> List[str]:
        """Parse the comma-separated CORS_ORIGINS env var into a clean list."""
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
