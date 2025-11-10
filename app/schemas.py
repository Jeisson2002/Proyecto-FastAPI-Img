# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=50)
    correo: EmailStr
    edad: Optional[int] = Field(None, ge=0, le=120)

class UserCreate(UserBase):
    contraseña: str = Field(..., min_length=6, max_length=100)

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True