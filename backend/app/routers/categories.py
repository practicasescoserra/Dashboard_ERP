from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.product import CategoryResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])

# Listar categorias
@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Category))
    return result.scalars().all()