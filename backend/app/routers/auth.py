from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import TokenResponse, LoginRequest
from app.services.security import (
    hash_password, verify_password,
    create_access_token, 
    generate_refresh_token, hash_refresh_token,
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"]) # Prefijo para el router (No tener que escribir /auth en cada endpoint)
REFRESH_COOKIE_NAME = "refresh_token"  # Nombre de la cookie para el token de actualización


# Login de usuario
@router.post("/login", response_model = TokenResponse) # Devuelve un TokenResponse con el access_token y token_type
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):

    # Busca si ya existe un usuario con el mismo nombre de usuario o correo electrónico
    result = await db.execute(
        select(User).where(or_(User.username == data.identifier, User.email == data.identifier))
    )
    user = result.scalar_one_or_none()

    # Compara la contraseña ingresada contra la contraseña ya hasheda en la BD
    if user is None or not verify_password(data.password, user.password_hash): 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    
    access_token = create_access_token(user.id) # Se crea el access token desde la funcion de security.py

    # Genera un refresh token
    raw_refresh_token = generate_refresh_token()
    refresh_expires = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    # Guarda el refresh token en la base de datos
    new_refresh = RefreshToken(
        user_id = user.id,
        token_hash = hash_refresh_token(raw_refresh_token),
        expires_at = refresh_expires,
    )
    db.add(new_refresh)
    await db.commit()

    # Manda la cookie con el refresh token
    response.set_cookie(
        key = REFRESH_COOKIE_NAME,
        value = raw_refresh_token,
        httponly = True,
        secure = False,  # Cambiar a True al subirlo con https
        samesite = "strict",
        path = "/auth",
        max_age = settings.refresh_token_expire_days * 24 * 60 * 60
    )

    return TokenResponse(access_token = access_token)


# Refresh Token
@router.post("/refresh", response_model = TokenResponse)
async def refresh(response: Response, db: AsyncSession = Depends(get_db), 
                  refresh_token: str | None = Cookie(default = None)):
    # Verifica si el refresh token existe en la cookie
    if refresh_token is None:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "La sesion expiro, por favor inicia sesion nuevamente",
        )
    
    token_hash = hash_refresh_token(refresh_token) # Hashea el refresh token para buscarlo en la base de datos
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    stored_token = result.scalar_one_or_none() # Obtiene el token de la base de datos (o None si no existe)

    # Verifica si el token es válido (no revocado y no expirado)
    now = datetime.utcnow()
    if stored_token is None or stored_token.revoked or stored_token.expires_at < now:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "La sesion expiro, por favor inicia sesion nuevamente",
        )
    
    stored_token.revoked = True # Marca el token viejo como revocado para que no pueda ser usado nuevamente

    # Crea un nuevo refresh token
    new_raw_token = generate_refresh_token()
    new_refresh_expires = now + timedelta(days = settings.refresh_token_expire_days)
    new_refresh = RefreshToken(
        user_id = stored_token.user_id,
        token_hash = hash_refresh_token(new_raw_token),
        expires_at = new_refresh_expires,
    )
    db.add(new_refresh)
    await db.flush() # Se usa flush en lugar de commit para que se pueda usar el ID del nuevo token antes de hacer commit

    # Actualiza el token viejo para que apunte al token nuevo(para poder invalidar toda la cadena de tokens si se revoca uno)
    stored_token.replaced_by_token_id = new_refresh.id
    await db.commit()

    new_access_token = create_access_token(stored_token.user_id) # Crea un nuevo access token 

    # Manda la cookie con el refresh token
    response.set_cookie(
        key = REFRESH_COOKIE_NAME,
        value = new_raw_token,
        httponly = True,
        secure = False,  # Cambiar a True al subirlo con https
        samesite = "strict",
        path = "/auth",
        max_age = settings.refresh_token_expire_days * 24 * 60 * 60
    )

    return TokenResponse(access_token = new_access_token) # Devuelve el nuevo access token


# Logout
@router.post("/logout")
async def logout(response: Response, db: AsyncSession = Depends(get_db),
                  refresh_token: str | None = Cookie(default = None)):
    
    # Busca el refresh token en la base de datos y lo revoca si existe
    if refresh_token is not None:
        token_hash = hash_refresh_token(refresh_token)
        result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        stored_token = result.scalar_one_or_none()
        if stored_token is not None:
            stored_token.revoked = True
            await db.commit()

    # Elimina la cookie del refresh token aunque no exista en la base de datos (para que el cliente no lo pueda usar nuevamente)
    response.delete_cookie(key = REFRESH_COOKIE_NAME, path = "/auth")
    return {"detail": "Sesión cerrada"}
    