from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from datetime import datetime

class OrderItemInput(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_id: int
    status: str
    items: list[OrderItemInput]

class OrderStatusUpdate(BaseModel):
    status: str

class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str

class ProductSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    image_url: str

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductSummary

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    status: str
    total: Decimal
    created_at: datetime
    customer: CustomerSummary

class OrderDetailResponse(OrderResponse):
    items: list[OrderItemResponse]