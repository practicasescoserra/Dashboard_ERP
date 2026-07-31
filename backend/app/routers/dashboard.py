from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.order_item import Order_Item
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.dashboard import DashboardResponse
from app.dependencies.roles import required_role

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

MONTHLY_TARGET = 7500

def growth_pct(current: int, previous: int,) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)

@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    now = datetime.utcnow()
    current_month_start = datetime(now.year, now.month, 1)
    if now.month == 1:
        prev_month_start = datetime(now.year - 1, 12, 1)
    else:
        prev_month_start = datetime(now.year, now.month -1, 1)
    prev_month_end = current_month_start

    # --- Métricas de tarjetas (customers, orders) con comparación al mes anterior ---
    current_customers = (await db.execute(
        select(func.count(Customer.id)).where(Customer.created_at >= current_month_start)
    )).scalar_one()
    prev_customers = (await db.execute(
        select(func.count(Customer.id)).where(Customer.created_at.between(prev_month_start, prev_month_end))
    )).scalar_one()

    current_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= current_month_start)
    )).scalar_one()
    prev_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.created_at.between(prev_month_start, prev_month_end))
    )).scalar_one()

    metrics = {
        "total_customers": current_customers,
        "customers_growth_pct": growth_pct(current_customers, prev_customers),
        "total_orders": current_orders,
        "orders_growth_pct": growth_pct(current_orders, prev_orders),
    }

    # Ventas mensuales en los ultimos 12 meses
    twelve_months_ago = current_month_start - timedelta(days=365)
    period = func.date_trunc("month", Order.created_at)
    sales_result = await db.execute(
        select(period.label("month"), func.sum(Order.total), func.count(Order.id))
        .where(Order.created_at >= twelve_months_ago)
        .group_by(period)
        .order_by(period)
    )
    monthly_sales = [
        {"month": row.month.strftime("%Y-%m-%d"), "total_sales": row[1], "order_count": row[2]}
        for row in sales_result.all()
    ]

    # Meta de ventas mensuales
    current_month_revenue = (await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.created_at >= current_month_start)
    )).scalar_one()
    progress = min(round(float(current_month_revenue) / MONTHLY_TARGET * 100, 1), 999.9)
    monthly_target = {
        "target": MONTHLY_TARGET,
        "current_month_revenue": current_month_revenue,
        "progress_pct": progress,
    }

    # Pedidos recientes
    recent_result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(Order_Item.product).selectinload(Product.category))
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_orders = []
    for order in recent_result.scalars().all():
        if order.items:
            first_item = order.items[0]
            recent_orders.append({
                "id": order.id,
                "product_name": first_item.product.name,
                "category_name": first_item.product.category.name,
                "product_image": first_item.product.image_url,
                "price": first_item.unit_price,
                "status": order.status,
            })

    # Clientes por pais (top 5)
    country_result = await db.execute(
        select(Customer.country, func.count(Customer.id))
        .group_by(Customer.country)
        .order_by(func.count(Customer.id).desc())
        .limit(5)
    )
    customers_by_country = [
        {"country": row[0], "customer_count": row[1]} for row in country_result.all()
    ]

    return DashboardResponse(
        metrics=metrics,
        monthly_sales=monthly_sales,
        monthly_target=monthly_target,
        recent_orders=recent_orders,
        customers_by_country=customers_by_country,
    )