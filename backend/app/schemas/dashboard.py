from pydantic import BaseModel
from decimal import Decimal

class DashboardMetrics(BaseModel):
    total_customers: int
    customers_growth_pct: float
    total_orders: int
    orders_growth_pct: float

class MonthlySalesPoint(BaseModel):
    month: str
    total_sales: Decimal
    order_count: int

class MonthlyTargetData(BaseModel):
    target: Decimal
    current_month_revenue: Decimal
    progress_pct: float

class RecentOrder(BaseModel):
    id: int
    product_name: str
    category_name: str
    product_image: str
    price: Decimal
    status: str

class CustomersByCountry(BaseModel):
    country: str
    customer_count: int

class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    monthly_sales: list[MonthlySalesPoint]
    monthly_target: MonthlyTargetData
    recent_orders: list[RecentOrder]
    customers_by_country: list[CustomersByCountry]