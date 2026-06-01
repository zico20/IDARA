from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.task import TaskPriority, TaskType
from app.schemas.auth import UserPublic
from app.schemas.label import LabelPublic


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    due_date: datetime | None = None
    priority: TaskPriority = TaskPriority.medium
    type: TaskType = TaskType.task
    assignee_id: int | None = None
    label_ids: list[int] = []


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    due_date: datetime | None = None
    priority: TaskPriority | None = None
    type: TaskType | None = None
    assignee_id: int | None = None
    label_ids: list[int] | None = None


class TaskMove(BaseModel):
    """Move a task to a target column at a target index (0-based)."""

    column_id: int
    position: int = Field(ge=0)


class TaskPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    column_id: int
    title: str
    description: str | None
    due_date: datetime | None
    priority: TaskPriority
    type: TaskType
    position: int
    created_at: datetime
    updated_at: datetime
    labels: list[LabelPublic] = []
    assignee_id: int | None = None
    assignee: UserPublic | None = None
    # Checklist progress summary for the board card (derived, not stored).
    checklist_done: int = 0
    checklist_total: int = 0

    @model_validator(mode="before")
    @classmethod
    def _summarize_checklist(cls, data: Any) -> Any:
        """When validating from an ORM Task whose checklist_items are already
        loaded, derive the done/total counts for the board card. Never triggers a
        lazy load: if the relationship isn't loaded, counts default to 0 and the
        card simply shows no progress indicator until the snapshot provides them."""
        from sqlalchemy import inspect as sa_inspect

        if not isinstance(data, dict) and hasattr(data, "__mapper__"):
            state = sa_inspect(data)
            if "checklist_items" in state.unloaded:
                return data  # leave counts at their 0 defaults; don't lazy-load
            items = data.checklist_items
            done = sum(1 for i in items if i.is_done)
            return {
                "id": data.id,
                "column_id": data.column_id,
                "title": data.title,
                "description": data.description,
                "due_date": data.due_date,
                "priority": data.priority,
                "type": data.type,
                "position": data.position,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
                "labels": list(data.labels),
                "assignee_id": data.assignee_id,
                "assignee": data.assignee,
                "checklist_done": done,
                "checklist_total": len(items),
            }
        return data


class ColumnWithTasks(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    name: str
    position: int
    tasks: list[TaskPublic] = []


class BoardSnapshot(BaseModel):
    """Full board state: columns with their ordered tasks. Used for initial load."""

    board_id: int
    columns: list[ColumnWithTasks]
