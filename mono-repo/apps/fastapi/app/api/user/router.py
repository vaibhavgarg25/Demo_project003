from fastapi import APIRouter
from typing import List
from .handler import create_user, list_users
from app.models.user import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserOut)
async def add_user(user: UserCreate):
    return await create_user(user)

@router.get("/", response_model=List[UserOut])
async def get_users():
    return await list_users()
