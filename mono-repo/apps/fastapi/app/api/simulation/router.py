from fastapi import APIRouter, File, UploadFile, Depends
from fastapi.responses import StreamingResponse

from app.api.simulation.models import SimulationConfig
from app.api.simulation.handler import SimulationHandler

router = APIRouter(prefix="/simulation", tags=["simulation"])

def create_simulation_config(
    days_to_simulate: int = 1
) -> SimulationConfig:
    """Create simulation configuration from query parameters"""
    return SimulationConfig(
        days_to_simulate=days_to_simulate
    )

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
    config: SimulationConfig = Depends(create_simulation_config)
) -> StreamingResponse:
    """
    Main endpoint for train fleet simulation.
    
    Upload a CSV file with train data and get back simulated datasets.
    For single day simulation, returns a CSV file.
    For multiple days, returns a ZIP file with individual CSV files for each day.
    """
    return await SimulationHandler.simulate_train_fleet(file, config)

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