from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class ProductCreate(BaseModel):
    name: str
    category_id: int
    price: Decimal
    stock: int
    image_url: str

class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    price: Decimal | None = None
    stock: int | None = None
    image_url: str | None = None

class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category_id: int
    price: Decimal
    stock: int
    image_url: str
    category: CategoryResponse