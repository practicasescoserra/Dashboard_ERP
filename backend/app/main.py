from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.routers import auth, users, products, categories

app = FastAPI(title="Mi App Login") # Crea instancia de la app para usarla con uvicorn

# Middleware de CORS (Intercepta peticiones, agregando headers para poder comunicarse con el frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins = [settings.frontend_url],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Para que la app sepa de la existencia de los endpoints /auth/login, /auth/register, etc
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(categories.router)
# Verificacion rapida que el servidor esta corriendo
@app.get("/")
async def root():
    return {"message": "API funcionando"}