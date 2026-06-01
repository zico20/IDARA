from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories import user_repo

logger = logging.getLogger("idara.auth")


async def register_user(
    db: AsyncSession, *, email: str, password: str, name: str
) -> tuple[User, str]:
    existing = await user_repo.get_by_email(db, email)
    if existing is not None:
        raise ConflictError(
            "An account with that email already exists.", code="email_taken"
        )
    user = await user_repo.create(
        db, email=email, password_hash=hash_password(password), name=name
    )
    token = create_access_token(user.id)
    return user, token


async def authenticate_user(
    db: AsyncSession, *, email: str, password: str
) -> tuple[User, str]:
    user = await user_repo.get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError(
            "Incorrect email or password.", code="invalid_credentials"
        )
    token = create_access_token(user.id)
    return user, token


async def request_password_reset(db: AsyncSession, *, email: str) -> None:
    """Generate a reset token and 'send' it.

    TODO(email): Wire up a real transactional email provider (Resend/SES/Postmark)
    to deliver the reset link. For now we log the token so the flow is testable.
    """
    user = await user_repo.get_by_email(db, email)
    # Do not reveal whether the email exists — always behave the same.
    if user is None:
        logger.info("Password reset requested for unknown email=%s (no-op)", email)
        return
    token = create_password_reset_token(user.id)
    reset_link = f"/reset-password?token={token}"
    logger.info(
        "Password reset for user_id=%s email=%s -> link=%s", user.id, email, reset_link
    )


async def confirm_password_reset(
    db: AsyncSession, *, token: str, new_password: str
) -> None:
    payload = decode_token(token, expected_type="password_reset")
    if payload is None or "sub" not in payload:
        raise UnauthorizedError("Invalid or expired reset token.", code="invalid_token")
    user = await user_repo.get_by_id(db, int(payload["sub"]))
    if user is None:
        raise UnauthorizedError("Invalid or expired reset token.", code="invalid_token")
    user.password_hash = hash_password(new_password)
    db.add(user)
    await db.flush()
