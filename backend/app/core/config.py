"""Application configuration loaded from environment variables.

All secrets and tunables live here. Never hardcode secrets elsewhere in the
codebase — read them from this settings object so they can be overridden per
environment via .env files or real environment variables.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    PROJECT_NAME: str = "IDARA"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    # --- Database ---
    # Default to a local SQLite file so the app runs without Docker/Postgres.
    # In Docker / production set DATABASE_URL to a postgresql+asyncpg:// URL.
    DATABASE_URL: str = "sqlite+aiosqlite:///./idara.db"

    # --- Security / JWT ---
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_use_a_long_random_string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # Cookie settings for the httpOnly JWT cookie.
    COOKIE_NAME: str = "idara_access_token"
    COOKIE_SECURE: bool = False  # set True in production (HTTPS only)
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    COOKIE_DOMAIN: str | None = None

    # --- Redis (reserved for WebSocket Pub/Sub scaling — not used in v1) ---
    # TODO(scaling): when broadcasting moves to Redis Pub/Sub, the manager will
    # connect to this URL. See app/websockets/manager.py.
    REDIS_URL: str | None = None

    # --- CORS ---
    # Comma-separated list of allowed origins for the frontend.
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # --- Rate limiting (slowapi) ---
    AUTH_RATE_LIMIT: str = "10/minute"

    @field_validator("BACKEND_CORS_ORIGINS")
    @classmethod
    def _strip_cors(cls, v: str) -> str:
        return v.strip()

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
