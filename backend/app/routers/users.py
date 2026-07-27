from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate
from app.dependencies.auth import get_current_user
from app.dependencies.roles import required_role
from app.services.security import hash_password

router = APIRouter(prefix="/users", tags=["users"]) # Prefijo para el router

# Prueba de endpoint para obtener el usuario actual (para probar la autenticación)
@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(required_role("admin")),
):
    result = await db.execute(
        select(User).where(or_(User.username == data.username, User.email == data.email))
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario o email ya esta registrado")

    new_user = User(
        username = data.username,
        email = data.email,
        password_hash = hash_password(data.password),
        full_name = data.full_name,
        role = data.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user