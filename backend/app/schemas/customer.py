from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    country: str
    phone: str

class CustomerUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    country: str | None = None
    phone: str | None = None

class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    country: str
    phone: str | None
    created_at: datetime

class CustomerOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str