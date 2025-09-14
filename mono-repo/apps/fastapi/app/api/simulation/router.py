from fastapi import APIRouter, File, UploadFile, Depends
from fastapi.responses import StreamingResponse

from app.api.simulation.models import SimulationConfig
from app.api.simulation.handler import SimulationHandler

router = APIRouter(prefix="/simulation", tags=["simulation"])

def create_simulation_config(
    days_to_simulate: int = 1,
    daily_run_km_min: int = 250,
    daily_run_km_max: int = 450,
    service_interval_km: int = 10000,
    brakepad_lifespan_km: int = 25000,
    hvac_lifespan_hours: int = 8760,
    cleaning_threshold_days: int = 4,
    fitness_check_threshold_days: int = 90,
    signalling_failure_chance: float = 0.015,
    telecom_failure_chance: float = 0.01,
    dirt_accumulation_chance: float = 0.06
) -> SimulationConfig:
    """Create simulation configuration from query parameters"""
    return SimulationConfig(
        days_to_simulate=days_to_simulate,
        daily_run_km_min=daily_run_km_min,
        daily_run_km_max=daily_run_km_max,
        service_interval_km=service_interval_km,
        brakepad_lifespan_km=brakepad_lifespan_km,
        hvac_lifespan_hours=hvac_lifespan_hours,
        cleaning_threshold_days=cleaning_threshold_days,
        fitness_check_threshold_days=fitness_check_threshold_days,
        signalling_failure_chance=signalling_failure_chance,
        telecom_failure_chance=telecom_failure_chance,
        dirt_accumulation_chance=dirt_accumulation_chance
    )

@router.post(
    "/",
    response_class=StreamingResponse,
    summary="Simulate Train Fleet Operations",
    description="""
    Simulate train fleet operations for a specified number of days.
    
    **Input:**
    - CSV file containing train data
    - Simulation parameters (optional, with defaults)
    
    **Output:**
    - Single day: CSV file (day-1.csv)
    - Multiple days: ZIP file containing CSV files for each day (day-1.csv, day-2.csv, etc.)
    
    **Simulation Parameters:**
    - `days_to_simulate`: Number of days to simulate (1-365, default: 1)
    - `daily_run_km_min/max`: Daily mileage range for active trains
    - `service_interval_km`: Kilometers between service intervals
    - `brakepad_lifespan_km`: Brakepad replacement threshold
    - `hvac_lifespan_hours`: HVAC system lifespan
    - `cleaning_threshold_days`: Days before cleaning required
    - `fitness_check_threshold_days`: Days between fitness checks
    - `signalling_failure_chance`: Daily probability of signalling failure (0-1)
    - `telecom_failure_chance`: Daily probability of telecom failure (0-1)
    - `dirt_accumulation_chance`: Daily probability of dirt accumulation (0-1)
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