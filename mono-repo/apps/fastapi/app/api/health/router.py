from fastapi import APIRouter
from .handler import get_health

router = APIRouter()

@router.get("/health")
async def health_check():
    return await get_health()
