# Tabla users

from sqlalchemy import String, Boolean, TIMESTAMP, text, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime

from app.models.refresh_token import RefreshToken

class User(Base):
    __tablename__ = "users" # Tiene que coincidir exacto con la tabla real en la BD

    id: Mapped[int] = mapped_column(primary_key=True)
    role: Mapped[str] = mapped_column(String(20), default="admin", nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=text("now()"), nullable=False)

    # Permite obtener la lista de tokens sin escribir una consulta SQL manual para cada caso
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")    