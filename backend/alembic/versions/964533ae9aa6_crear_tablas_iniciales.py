"""crear tablas iniciales

Revision ID: 964533ae9aa6
Revises: 
Create Date: 2026-07-12 20:50:13.094859

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '964533ae9aa6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name='id_pk'),
        sa.UniqueConstraint('username', name='username_unique'),
        sa.UniqueConstraint('email', name='email_unique'),
    )

    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.Text(), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False),
        sa.Column('replaced_by_token_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='refresh_tokens_users_fk', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['replaced_by_token_id'], ['refresh_tokens.id'], name='refresh_tokens_refresh_tokens_fk', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name='id_refresh_tokens_pk'),
        sa.UniqueConstraint('token_hash', name='refresh_tokens_token_hash_idx'),
    )
    op.create_index('refresh_tokens_user_id_idx', 'refresh_tokens', ['user_id'])


def downgrade() -> None:
    op.drop_table('refresh_tokens')
    op.drop_table('users')