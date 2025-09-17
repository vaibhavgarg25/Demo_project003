from fastapi import APIRouter, File, UploadFile, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel

from app.api.simulation.models import SimulationConfig
from app.api.simulation.handler import SimulationHandler
from app.core.storage import StorageManager

# Pydantic models for file path requests
class SimulationFilePathRequest(BaseModel):
    file_path: str
    runId: str
    days_to_simulate: int = 1

router = APIRouter(prefix="/simulation", tags=["simulation"])

def create_simulation_config(
    days_to_simulate: int = 1,
    runId: Optional[str] = Query(None, description="Pipeline run ID for webhook notification")
) -> tuple[SimulationConfig, Optional[str]]:
    """Create simulation configuration from query parameters"""
    return SimulationConfig(
        days_to_simulate=days_to_simulate
    ), runId

@router.post(
    "/start-from-file",
    summary="Start Simulation from File Path (Pipeline Mode)",
    description="""
    Start simulation using a file path instead of uploading a file.
    This endpoint is designed for pipeline integration where the train data
    is already saved to shared storage.
    
    **Input:**
    - file_path: Path to CSV file in shared storage
    - runId: Pipeline run identifier for tracking
    - days_to_simulate: Number of days to simulate (default: 1)
    
    **Output:**
    - Success/failure status
    - Simulation result will be saved to shared storage
    - Webhook notification sent to backend upon completion
    """
)
async def start_simulation_from_file(
    request: SimulationFilePathRequest
) -> dict:
    """
    Start simulation from file path for pipeline integration.
    Results are saved to shared storage and webhook is sent to backend.
    """
    config = SimulationConfig(days_to_simulate=request.days_to_simulate)
    result = await SimulationHandler.simulate_from_file_path(
        request.file_path, 
        config, 
        request.runId
    )
    return result

@router.post(
    "/test-webhook",
    summary="Test Webhook Configuration",
    description="Test webhook URL and connection to backend"
)
async def test_webhook():
    """Test webhook configuration and connection"""
    from app.api.simulation.handler import SimulationHandler
    from app.core.config import settings
    
    try:
        # Test webhook URL configuration
        webhook_url = SimulationHandler.WEBHOOK_URL
        
        # Test sending a webhook
        await SimulationHandler._send_webhook("test_run_123", "test/path.csv", None)
        
        return {
            "success": True,
            "webhook_url": webhook_url,
            "backend_url": settings.BACKEND_BASE_URL,
            "message": "Webhook test completed - check logs for details"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "webhook_url": getattr(SimulationHandler, 'WEBHOOK_URL', 'Not set'),
            "backend_url": settings.BACKEND_BASE_URL
        }

@router.post(
    "/",
    response_class=StreamingResponse,
    summary="Simulate Train Fleet Operations",
    description="""
    Simulate train fleet operations for a specified number of days.
    
    **Input:**
    - CSV file containing train data
    - Number of days to simulate (optional, default: 1)
    
    **Output:**
    - Single day: CSV file (day-1.csv)
    - Multiple days: ZIP file containing CSV files for each day (day-1.csv, day-2.csv, etc.)
    
    **Simulation Features:**
    - Fitness certificate management (Rolling Stock: 4 days renewal, 2 years validity)
    - Job card system (reduce by 1 per day, automatic creation for failures)
    - Branding campaigns (16-hour operation, fixed exposure targets)
    - Mileage tracking (436.96 km daily increment, 10,000 km service intervals)
    - Wear simulation (Brakepad: 0.27%/day, HVAC: 0.16%/day)
    - Cleaning management (3-bay system, 1-day cleaning cycle)
    - Stabling geometry (15 bays, max 3 trains per bay)
    - Operational status determination based on priority rules
    """
)
async def simulate_train_fleet(
    file: UploadFile = File(..., description="CSV file containing train fleet data"),
    config_and_runid: tuple[SimulationConfig, Optional[str]] = Depends(create_simulation_config)
) -> StreamingResponse:
    """
    Main endpoint for train fleet simulation.
    
    Upload a CSV file with train data and get back simulated datasets.
    For single day simulation, returns a CSV file.
    For multiple days, returns a ZIP file with individual CSV files for each day.
    """
    config, runId = config_and_runid
    return await SimulationHandler.simulate_train_fleet(file, config, runId)

@router.get(
    "/config/default",
    response_model=SimulationConfig,
    summary="Get Default Simulation Configuration",
    description="Returns the default configuration parameters used for simulation"
)
async def get_default_config() -> SimulationConfig:
    """Get default simulation configuration"""
    return SimulationConfig()

@router.get(
    "/health",
    summary="Simulation Service Health Check",
    description="Check if the simulation service is operational"
)
async def simulation_health_check():
    """Health check for simulation service"""
    return {
        "service": "simulation",
        "status": "healthy",
        "message": "Simulation service is operational"
    }