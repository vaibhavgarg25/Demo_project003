from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    PROJECT_NAME: str = "FastAPI Prisma App"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI application with Prisma ORM and Train Fleet Simulation"
    
    # Database
    DATABASE_URL: str
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS Settings
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Simulation Settings (optional overrides)
    SIMULATION_MAX_DAYS: int = 365
    SIMULATION_DEFAULT_DAYS: int = 1
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()