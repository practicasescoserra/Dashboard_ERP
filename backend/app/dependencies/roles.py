from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.dependencies.auth import get_current_user

def required_role(*allowed_roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta accion"
            )
        return current_user
    return role_checker