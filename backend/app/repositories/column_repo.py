from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.column import Column
from app.models.task import Task

# Default columns created with every new board.
DEFAULT_COLUMNS = ("To Do", "In Progress", "Done")
POSITION_STEP = 1000  # gapped positions so reordering rarely needs a full rewrite


async def get_by_id(db: AsyncSession, column_id: int) -> Column | None:
    return await db.get(Column, column_id)


async def list_for_board(db: AsyncSession, board_id: int) -> list[Column]:
    result = await db.execute(
        select(Column)
        .where(Column.board_id == board_id)
        .order_by(Column.position, Column.id)
    )
    return list(result.scalars().all())


async def list_for_board_with_tasks(db: AsyncSession, board_id: int) -> list[Column]:
    result = await db.execute(
        select(Column)
        .where(Column.board_id == board_id)
        .options(
            selectinload(Column.tasks).selectinload(Task.labels),
            # Eager-load checklist items so each task's progress summary
            # (done/total) is computed without a per-task lazy load (no N+1).
            selectinload(Column.tasks).selectinload(Task.checklist_items),
            # Eager-load the assignee for the card avatar (no N+1).
            selectinload(Column.tasks).selectinload(Task.assignee),
        )
        .order_by(Column.position, Column.id)
    )
    return list(result.scalars().unique().all())


async def next_position(db: AsyncSession, board_id: int) -> int:
    cols = await list_for_board(db, board_id)
    if not cols:
        return POSITION_STEP
    return cols[-1].position + POSITION_STEP


async def create(db: AsyncSession, *, board_id: int, name: str, position: int) -> Column:
    column = Column(board_id=board_id, name=name, position=position)
    db.add(column)
    await db.flush()
    await db.refresh(column)
    return column


async def create_defaults(db: AsyncSession, board_id: int) -> list[Column]:
    cols = []
    for i, name in enumerate(DEFAULT_COLUMNS):
        cols.append(
            Column(board_id=board_id, name=name, position=(i + 1) * POSITION_STEP)
        )
    db.add_all(cols)
    await db.flush()
    return cols


async def delete(db: AsyncSession, column: Column) -> None:
    await db.delete(column)
    await db.flush()
