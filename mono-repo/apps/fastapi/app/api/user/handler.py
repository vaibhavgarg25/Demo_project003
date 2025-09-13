from app.core.database import db
from app.models.user import UserCreate

async def create_user(user: UserCreate):
    return await db.user.create(
        data={"email": user.email, "name": user.name}
    )

async def list_users():
    return await db.user.find_many()
