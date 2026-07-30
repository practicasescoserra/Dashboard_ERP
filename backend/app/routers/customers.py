from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate, CustomerOption
from app.dependencies.roles import required_role


router = APIRouter(prefix="/customers", tags=["customers"])

# Endpoint para que vendedor pueda acceder limitadamente a los clientes
@router.get("/options", response_model=list[CustomerOption])
async def list_customer_options(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "vendedor"))
):
    result = await db.execute(select(Customer))
    return result.scalars().all()

# Listar clientes
@router.get("/", response_model=list[CustomerResponse])
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    result = await db.execute(select(Customer))
    return result.scalars().all()

# Crear cliente
@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista"))
):
    result = await db.execute(select(Customer).where(Customer.email == data.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un cliente con ese email")

    new_customer = Customer(**data.model_dump())
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    return new_customer

# Editar cliente
@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)
    return customer

# Eliminar cliente
@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(required_role("admin", "analista")),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    await db.delete(customer)
    await db.commit()