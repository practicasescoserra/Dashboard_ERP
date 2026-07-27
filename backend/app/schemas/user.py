from pydantic import BaseModel, EmailStr, ConfigDict

# Lo que espera para registar nuevo usuario, si falta un campo o es del tipo incorrecto FastAPI responde 422 por si solo
class UserCreate(BaseModel):
    username: str
    email: EmailStr # Valida que tenga formato de email
    password: str
    full_name: str | None = None # None indica que el campo es opcional en el JSON de entrada
    role: str

# Lo que el endpoint envia por HTTP (esta separado del modelo para no enviar el hash de la contraseña)
class UserResponse(BaseModel):
    # Permite que Pydantic acepte leer los datos desde el atributo de un objeto y no solo desde un dict de python
    model_config = ConfigDict(from_attributes=True)  

    id: int
    username: str
    email: str
    full_name: str | None = None
    role: str
