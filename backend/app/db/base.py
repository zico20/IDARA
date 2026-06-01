"""SQLAlchemy declarative base and shared column types."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Declarative base for all models."""


class TimestampMixin:
    """Adds created_at / updated_at columns.

    Timestamps are populated Python-side (default/onupdate=utcnow) rather than via
    server defaults. This keeps the values immediately available on the ORM object
    after flush/commit without a lazy DB round-trip (which would fail during async
    serialization), and keeps behaviour identical across SQLite and PostgreSQL.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
