from fastapi import HTTPException, Depends, APIRouter, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.order_item import Order_Item
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, OrderDetailResponse
from app.dependencies.roles import required_role

router = APIRouter(prefix="/orders", tags=["orders"])

VALID_STATUSES = {"Delivered", "Pending", "Canceled"}

# Listar todos los pedidos
@router.get("/", response_model=list[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "vendedor")),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.customer)).order_by(Order.id.asc())
    )
    return result.scalars().all()

# Obtener detalles de un pedido
@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order_detail(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "vendedor")),
):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(Order_Item.product),
        )
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    return order

# Crear pedido
@router.post("/", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "vendedor")),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Estado invalido")

    if not data.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El pedido debe tener al menos un producto")

    products_ids = [item.product_id for item in data.items]
    result = await db.execute(select(Product).where(Product.id.in_(products_ids)))
    products_by_id = {p.id: p for p in result.scalars().all()}

    if len(products_by_id) != len(set(products_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uno o mas productos no existen")

    for item in data.items:
        product = products_by_id[item.product_id]
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock insuficiente para '{product.name}' (disponible: {product.stock})",
                )

    new_order = Order(
        customer_id = data.customer_id,
        status = data.status,
        total = 0,
        created_at = datetime.utcnow(),
    )
    db.add(new_order)
    await db.flush()

    order_total = 0
    for item in data.items:
        product = products_by_id[item.product_id]
        subtotal = product.price * item.quantity
        order_total += subtotal
        product.stock -= item.quantity
        db.add(Order_Item(
            order_id = new_order.id,
            product_id = item.product_id,
            quantity = item.quantity,
            unit_price = product.price, 
        ))

    new_order.total = order_total
    await db.commit()

    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(Order_Item.product),
        )
        .where(Order.id == new_order.id)
    )
    return result.scalar_one()

# Actualizar estado de un pedido
@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "vendedor")),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Estado de pedido invalido")

    result = await db.execute(select(Order).options(selectinload(Order.customer)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    order.status = data.status
    await db.commit()
    await db.refresh(order, attribute_names=["customer"])
    return order

# Eliminar un pedido (Devuelve stock de los productos dentro del pedido)
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "vendedor")),
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    for item in order.items:
        product_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = product_result.scalar_one_or_none()
        if product is not None:
            product.stock += item.quantity

    await db.delete(order)
    await db.commit()