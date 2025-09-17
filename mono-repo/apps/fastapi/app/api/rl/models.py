from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RLRequest(BaseModel):
    """Request model for RL endpoint"""
    csv_path: str
    service_quota: Optional[int] = 13
    episode_days: Optional[int] = 7
    daily_mileage_if_in_service: Optional[float] = 400.0
    daily_exposure_hours: Optional[float] = 16.0
    jobcard_reduction_if_maintenance: Optional[int] = 2
    jobcard_new_per_day_lambda: Optional[float] = 0.1
    today: Optional[str] = None
    seed: Optional[int] = None
    format: Optional[str] = "json"

    class Config:
        json_schema_extra = {
            "example": {
                "csv_path": "data.csv",
                "service_quota": 13,
                "episode_days": 7,
                "daily_mileage_if_in_service": 400.0,
                "daily_exposure_hours": 16.0,
                "jobcard_reduction_if_maintenance": 2,
                "jobcard_new_per_day_lambda": 0.1
            }
        }

class RLResponse(BaseModel):
    """Response model for RL endpoint"""
    success: bool
    message: str
    total_trains: int
    episode_days: int
    day_index: int
    total_shunting_cost: float
    assignments: List[Dict[str, Any]]
    final_reward: float

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "RL scheduling completed successfully",
                "total_trains": 150,
                "episode_days": 7,
                "day_index": 7,
                "total_shunting_cost": 25.5,
                "final_reward": 1234.5,
                "assignments": [
                    {
                        "TrainID": "TRAIN_001",
                        "OperationalStatus": "In_Service",
                        "Day": 1,
                        "Reward": 20.5
                    }
                ]
            }
        }

class RLConfig:
    """Configuration for RL endpoint"""
    SEED: int = 42