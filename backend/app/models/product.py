# Tabla de productos

from typing import TYPE_CHECKING
from sqlalchemy import String, Text, text, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.category import Category

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, unique=True)
    price: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)

    categories: Mapped["Category"] = relationship(back_populates="products")