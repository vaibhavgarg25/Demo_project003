# app/core/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI Prisma App"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
