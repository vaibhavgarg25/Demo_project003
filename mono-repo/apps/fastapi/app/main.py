from fastapi import FastAPI
from app.core.database import connect_db, disconnect_db
from app.api.health.router import router as health_router
from app.api.user.router import router as user_router

app = FastAPI(title="FastAPI Prisma App")

app.include_router(health_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
