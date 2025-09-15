from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, disconnect_db
from app.core.config import settings
from app.api.health.router import router as health_router
from app.api.user.router import router as user_router
from app.api.simulation.router import router as simulation_router

def create_application() -> FastAPI:
    """Create FastAPI application with all configurations"""
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include existing routers
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(user_router, prefix="/api/v1")
    
    # Include new simulation router
    app.include_router(simulation_router, prefix="/api/v1")
    
    return app

app = create_application()

@app.on_event("startup")
async def startup():
    """Application startup event"""
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    """Application shutdown event"""
    await disconnect_db()

@app.get("/")
async def root():
    """API Information"""
    return {
        "message": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": settings.DESCRIPTION,
        "features": [
            "User Management",
            "Health Monitoring", 
            "Train Fleet Simulation"
        ],
        "endpoints": {
            "/api/v1/health": "Application health checks",
            "/api/v1/user": "User management operations",
            "/api/v1/simulation": "Train fleet simulation operations",
            "/docs": "Interactive API documentation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )