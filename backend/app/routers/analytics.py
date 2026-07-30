import io
from datetime import datetime
from typing import Literal

import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.order_item import Order_Item
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.analytics import SummaryResponse, SalesPoint, TopProduct, NewCustomersPoint
from app.dependencies.roles import required_role

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Lista de parametros aceptados
Granularity = Literal["day", "month", "year"]

# Convertir las fechas de string a datetime
def parse_dates(start: str, end: str) -> tuple[datetime, datetime]:
    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d")
        end_dt = datetime.strptime(end, "%Y-%m-%d").replace (hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de fecha invalido (Usa YYYY-MM-DD)")
    if start_dt > end_dt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La fecha de inicio no puede ser mayor a la fecha fin")
    return start_dt, end_dt

# Reporte de total de ingresos, pedidos, clientes nuevos y promedio por venta
@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    start: str = Query(...),
    end: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User =Depends(required_role("admin", "analista")),
):
    start_dt, end_dt = parse_dates(start, end)

    orders_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0), func.count(Order.id)).where(Order.created_at.between(start_dt, end_dt))
    )
    total_revenue, total_orders = orders_result.one()

    customers_result = await db.execute(
        select(func.count(Customer.id)).where(Customer.created_at.between(start_dt, end_dt))
    )

    new_customers = customers_result.scalar_one()

    average_order_value = round((total_revenue / total_orders), 2) if total_orders > 0 else 0

    return SummaryResponse(
        total_revenue = total_revenue,
        total_orders = total_orders,
        average_order_value = average_order_value,
        new_customers = new_customers,
    )

# Reporte de ventas dividido por dia/mes/año
@router.get("/sales-timeseries", response_model=list[SalesPoint])
async def get_sales_timeseries(
    start: str = Query(...),
    end: str = Query(...),
    granularity: Granularity = Query("day"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    start_dt, end_dt = parse_dates(start, end)
    period = func.date_trunc(cast(granularity, String), Order.created_at)

    result = await db.execute(
        select(period.label("period"), func.sum(Order.total), func.count(Order.id))
        .where(Order.created_at.between(start_dt, end_dt))
        .group_by(period)
        .order_by(period)
    )

    return [
        SalesPoint(period=row.period.strftime("%Y-%m-%d"), total_sales=row[1], order_count=row[2])
        for row in result.all()
    ]

# Productos mas vendidos
@router.get("/top-products", response_model=list[TopProduct])
async def get_top_products(
    start: str = Query(...),
    end: str = Query(...),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    start_dt, end_dt = parse_dates(start, end)

    result = await db.execute(
        select(
            Product.id,
            Product.name,
            func.sum(Order_Item.quantity).label("ventas"),
            func.sum(Order_Item.quantity * Order_Item.unit_price).label("ingresos"),
        )
        .join(Order_Item, Order_Item.product_id == Product.id)
        .join(Order, Order.id == Order_Item.order_id)
        .where(Order.created_at.between(start_dt, end_dt))
        .group_by(Product.id, Product.name)
        .order_by(func.sum(Order_Item.quantity * Order_Item.unit_price).desc())
        .limit(limit)
    )

    return [
        TopProduct(product_id=row.id, name=row.name, quantity_sold=row.ventas, revenue=row.ingresos)
        for row in result.all()
    ]

# Clientes nuevos
@router.get("/new-customers", response_model=list[NewCustomersPoint])
async def get_new_customers(
    start: str = Query(...),
    end: str = Query(...),
    granularity: Granularity = Query("day"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    start_dt, end_dt = parse_dates(start, end)
    period = func.date_trunc(cast(granularity, String), Customer.created_at)

    result = await db.execute(
        select(period.label("period"), func.count(Customer.id))
        .where(Customer.created_at.between(start_dt, end_dt))
        .group_by(period)
        .order_by(period)
    )

    return [
        NewCustomersPoint(period=row.period.strftime("%Y-%m-%d"), new_customers=row[1])
        for row in result.all()
    ]

# Exportar reporte
@router.get("/export")
async def export_data(
    start: str = Query(...),
    end: str = Query(...),
    report_type: Literal["orders", "summary"] = Query(..., alias="type"),
    file_format: Literal["csv", "xlsx"] = Query(..., alias="format"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    start_dt, end_dt = parse_dates(start, end)

    if report_type == "orders":
        result = await db.execute(
            select(
                Order.id, Order.status, Order.total, Order.created_at,
                Customer.full_name, Customer.email, Customer.country,
            )
            .join(Customer, Customer.id == Order.customer_id)
            .where(Order.created_at.between(start_dt, end_dt))
            .order_by(Order.created_at)
        )
        rows = result.all()
        df = pd.DataFrame(rows , columns=["ID Pedido", "Estado", "Total", "Fecha", "Cliente", "Email", "Pais"])
        filename_base = "pedidos"
    else:
        orders_result = await db.execute(
            select(func.coalesce(func.sum(Order.total), 0), func.count(Order.id))
            .where(Order.created_at.between(start_dt, end_dt))
        )
        total_revenue, total_orders = orders_result.one()
        customers_result = await db.execute(
            select(func.count(Customer.id)).where(Customer.created_at.between(start_dt, end_dt))
        )
        new_customers = customers_result.scalar_one()
        avg_order = round((total_revenue / total_orders), 2) if total_orders > 0 else 0

        df = pd.DataFrame([{
            "Periodo": f"{start} a {end}",
            "Ingresos totales": float(total_revenue),
            "Pedidos totales": total_orders,
            "Pedido promedio ($)": float(avg_order),
            "Clientes nuevos": new_customers,
        }])
        filename_base = "resumen"

    buffer = io.BytesIO()
    if file_format == "csv":
        df.to_csv(buffer, index=False)
        media_type = "text/csv"
        filename = f"{filename_base}.csv"
    else:
        df.to_excel(buffer, index=False, engine="openpyxl")
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{filename_base}.xlsx"

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )