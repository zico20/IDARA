"""IDARA FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes import ws as ws_routes
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.rate_limit import limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("idara")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For local dev with SQLite we create tables on startup so `docker-compose up`
    # or `uvicorn` just works. In production, use Alembic migrations instead.
    if settings.is_sqlite:
        import app.models  # noqa: F401  (register models on metadata)
        from app.db.base import Base
        from app.db.session import engine

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite tables ensured (dev mode).")
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="Real-time collaborative kanban task manager.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Rate limiting (slowapi) — limits are enforced via the auth_rate_limit
    # dependency; the handler below renders 429s in our standard error shape.
    app.state.limiter = limiter

    # CORS — must allow credentials so the httpOnly cookie is sent.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Dev safety net (SQLite only): if the local .db file gets deleted while the
    # server is running, recreate the tables on the next request instead of
    # failing every call with "no such table". No-op in production (Postgres).
    if settings.is_sqlite:

        @app.middleware("http")
        async def _ensure_sqlite_tables(request, call_next):
            from sqlalchemy import inspect

            import app.models  # noqa: F401
            from app.db.base import Base
            from app.db.session import engine

            async with engine.begin() as conn:
                has_users = await conn.run_sync(
                    lambda sync_conn: inspect(sync_conn).has_table("users")
                )
                if not has_users:
                    await conn.run_sync(Base.metadata.create_all)
                    logger.warning("SQLite tables were missing — recreated them.")
            return await call_next(request)

    register_exception_handlers(app)

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    app.include_router(ws_routes.router)  # WS not under /api prefix

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.PROJECT_NAME}

    return app


app = create_app()
