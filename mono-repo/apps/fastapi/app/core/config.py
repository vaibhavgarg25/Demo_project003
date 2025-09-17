from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    PROJECT_NAME: str = "FastAPI Prisma App"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI application with Prisma ORM and Train Fleet Simulation"
    
    # Database
    DATABASE_URL: str = "sqlite:///./test.db"  # Default for development
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS Settings - Handle as string and convert to list
    ALLOWED_HOSTS_STR: str = "*"
    
    # Simulation Settings (optional overrides)
    SIMULATION_MAX_DAYS: int = 365
    SIMULATION_DEFAULT_DAYS: int = 1
    
    # Shared Storage Configuration
    SHARED_STORAGE_PATH: str = "/shared/storage"
    
    # Backend Communication URLs
    BACKEND_BASE_URL: str = "http://backend:8000"
    WEBHOOK_SIMULATION_URL: str = "http://backend:8000/api/webhook/simulation-finished"
    WEBHOOK_MOO_URL: str = "http://backend:8000/api/webhook/moo-finished"
    WEBHOOK_RL_URL: str = "http://backend:8000/api/webhook/rl-finished"
    
    @property
    def ALLOWED_HOSTS(self) -> List[str]:
        """Convert ALLOWED_HOSTS_STR to list"""
        if self.ALLOWED_HOSTS_STR == "*":
            return ["*"]
        return [host.strip() for host in self.ALLOWED_HOSTS_STR.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        # Allow extra fields in case we have environment variables we don't use
        extra = "ignore"

settings = Settings()