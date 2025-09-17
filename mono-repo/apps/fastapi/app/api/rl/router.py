from fastapi import APIRouter, File, UploadFile, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Union, List, Any, Optional
from enum import Enum

from app.api.rl.models import RLRequest, RLResponse, RLConfig
from app.api.rl.handler import RLHandler

router = APIRouter(prefix="/rl", tags=["Reinforcement Learning"])

class ResponseFormat(str, Enum):
    """Response format options"""
    json = "json"          # Full JSON response with all details
    csv = "csv"            # CSV file download 
    simple = "simple"      # Lightweight JSON with ID, Score, Rank only

@router.post(
    "/schedule",
    response_model=None,
    summary="Schedule Train Fleet using Reinforcement Learning",
    description="""
    🚀 **Universal RL Train Scheduling API** - All functionality in one endpoint!
    
    **Input:**
    - CSV file containing train fleet data
    - Response format: `json` (default), `csv`, or `simple`
    - Scheduling parameters (optional)
    
    **Response Formats:**
    - **`json`**: Complete JSON response with detailed train metrics
    - **`csv`**: Downloadable CSV file (RL.py equivalent)
    - **`simple`**: Lightweight JSON with only Train ID and Operational Status
    
    **Examples:**
    ```
    # Get full JSON response
    POST /api/v1/rl/schedule?format=json
    
    # Download CSV file
    POST /api/v1/rl/schedule?format=csv
    
    # Get simple schedule only
    POST /api/v1/rl/schedule?format=simple
    ```
    """
)
async def schedule_train_fleet(
    file: UploadFile = File(..., description="CSV file containing train fleet data"),
    format: ResponseFormat = Query(default=ResponseFormat.json, description="Response format: json, csv, or simple"),
    service_quota: Optional[int] = Query(default=13, description="Number of trains that can be scheduled for service per day"),
    episode_days: Optional[int] = Query(default=7, description="Number of days to simulate"),
    daily_mileage_if_in_service: Optional[float] = Query(default=400.0, description="Daily mileage if train is in service"),
    daily_exposure_hours: Optional[float] = Query(default=16.0, description="Daily exposure hours if train is branded"),
    jobcard_reduction_if_maintenance: Optional[int] = Query(default=2, description="Jobcard reduction if train is under maintenance"),
    jobcard_new_per_day_lambda: Optional[float] = Query(default=0.1, description="Lambda for new jobcard generation"),
    today: Optional[str] = Query(default=None, description="Current date for simulation")
) -> Any:
    """
    🎯 One API to rule them all! 
    
    Universal RL scheduling endpoint that handles all response formats:
    - JSON: Complete response with all train details
    - CSV: Downloadable file (RL.py equivalent)
    - Simple: Minimal JSON with only Train ID and Operational Status
    """
    # Create configuration
    config = RLRequest(
        csv_path="",  # Will be set from uploaded file
        service_quota=service_quota,
        episode_days=episode_days,
        daily_mileage_if_in_service=daily_mileage_if_in_service,
        daily_exposure_hours=daily_exposure_hours,
        jobcard_reduction_if_maintenance=jobcard_reduction_if_maintenance,
        jobcard_new_per_day_lambda=jobcard_new_per_day_lambda,
        today=today
    )
    
    # Route to appropriate handler based on format
    if format == ResponseFormat.csv:
        return await RLHandler.schedule_and_return_csv(file, config)
    elif format == ResponseFormat.simple:
        return await RLHandler.get_simple_schedule(file, config)
    else:  # json format (default)
        return await RLHandler.schedule_and_return_json(file, config)

@router.get(
    "/info",
    summary="RL Service Information",
    description="Get complete information about the RL service including configuration and algorithm"
)
async def get_rl_info():
    """Get comprehensive RL service information"""
    return {
        "service": "rl",
        "status": "healthy",
        "message": "Reinforcement Learning service is operational",
        "algorithm": "PPO (Proximal Policy Optimization)",
        "version": "1.0.0",
        "endpoints": {
            "/schedule": "Universal scheduling endpoint with multiple response formats",
            "/info": "Service information and algorithm details"
        },
        "default_config": RLConfig().dict(),
        "response_formats": {
            "json": "Complete JSON response with detailed train metrics",
            "csv": "Downloadable CSV file with assignments", 
            "simple": "Lightweight JSON with train assignments only"
        },
        "scoring_criteria": {
            "fitness": "If expired, train can't be scheduled for service",
            "jobcards": "Reward for closed jobcards, penalty for open ones",
            "mileage": "Reward for staying within mileage limits",
            "branding": "Reward for active branding campaigns",
            "cleaning": "Penalty if cleaning is required",
            "stabling": "Reward for optimal stabling position",
            "shunting": "Small penalty for shunting moves"
        },
        "action_space": {
            "In_Service": 0,
            "Standby": 1,
            "Under_Maintenance": 2
        }
    }