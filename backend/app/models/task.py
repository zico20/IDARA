from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.checklist_item import ChecklistItem
    from app.models.column import Column
    from app.models.comment import Comment
    from app.models.label import Label
    from app.models.user import User


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskType(str, enum.Enum):
    task = "task"
    feature = "feature"
    improvement = "improvement"


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    column_id: Mapped[int] = mapped_column(
        ForeignKey("columns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, name="task_priority"),
        default=TaskPriority.medium,
        nullable=False,
    )
    type: Mapped[TaskType] = mapped_column(
        SAEnum(TaskType, name="task_type"),
        default=TaskType.task,
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Optional assignee — one of the board's members. SET NULL on user removal so
    # the task survives a member leaving / an account being deleted (FR-007).
    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )

    column: Mapped[Column] = relationship(back_populates="tasks")
    assignee: Mapped[User | None] = relationship(lazy="selectin")
    labels: Mapped[list[Label]] = relationship(
        secondary="task_labels", back_populates="tasks"
    )
    checklist_items: Mapped[list[ChecklistItem]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="ChecklistItem.position, ChecklistItem.id",
    )
    comments: Mapped[list[Comment]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Comment.created_at, Comment.id",
    )
