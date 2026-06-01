"""add assignee_id and type to tasks

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-01 12:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: str | None = 'a1b2c3d4e5f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


task_type_enum = sa.Enum('task', 'feature', 'improvement', name='task_type')


def upgrade() -> None:
    bind = op.get_bind()
    # Create the enum type up front on backends that need it (Postgres). On
    # SQLite this is a no-op; the column gets a CHECK constraint instead.
    task_type_enum.create(bind, checkfirst=True)

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'type',
                task_type_enum,
                nullable=False,
                server_default='task',
            )
        )
        batch_op.add_column(
            sa.Column('assignee_id', sa.Integer(), nullable=True)
        )
        batch_op.create_index(
            batch_op.f('ix_tasks_assignee_id'), ['assignee_id'], unique=False
        )
        batch_op.create_foreign_key(
            'fk_tasks_assignee_id_users',
            'users',
            ['assignee_id'],
            ['id'],
            ondelete='SET NULL',
        )


def downgrade() -> None:
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_constraint('fk_tasks_assignee_id_users', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_tasks_assignee_id'))
        batch_op.drop_column('assignee_id')
        batch_op.drop_column('type')

    task_type_enum.drop(op.get_bind(), checkfirst=True)
