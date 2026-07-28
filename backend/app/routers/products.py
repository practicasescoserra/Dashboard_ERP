from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import  AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.dependencies.roles import required_role

router = APIRouter(prefix="/products", tags=["products"])

# Listar productos
@router.get("/", response_model=list[ProductResponse])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "proveedor")),
):
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).order_by(Product.id)
    )
    return result.scalars().all()

# Crear Producto
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "proveedor")),
):
    new_product = Product(**data.model_dump())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product, attribute_names=["category"])
    return new_product

# Actualizar producto
@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "proveedor")),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT, detail="Producto no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product, attribute_names=["category"])
    return product

# Eliminar producto
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "proveedor")),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    await db.delete(product)
    await db.commit()
    