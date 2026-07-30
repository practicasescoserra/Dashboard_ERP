from pydantic import BaseModel
from decimal import Decimal

class SummaryResponse(BaseModel):
    total_revenue: Decimal
    total_orders: int
    average_order_value: Decimal
    new_customers: int

class SalesPoint(BaseModel):
    period: str
    total_sales: Decimal
    order_count: int

class TopProduct(BaseModel):
    product_id: int
    name: str
    quantity_sold: int
    revenue: Decimal

class NewCustomersPoint(BaseModel):
    period: str
    new_customers: int