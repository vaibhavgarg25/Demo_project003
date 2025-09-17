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

class RLConfig(BaseModel):
    """Configuration for RL endpoint"""
    SEED: int = 42
    SERVICE_QUOTA: int = 13
    EPISODE_DAYS: int = 7
    DAILY_MILEAGE_IF_IN_SERVICE: float = 400.0
    DAILY_EXPOSURE_HOURS: float = 16.0
    JOBCARD_REDUCTION_IF_MAINTENANCE: int = 2
    JOBCARD_NEW_PER_DAY_LAMBDA: float = 0.1
    
    def dict(self):
        return {
            "seed": self.SEED,
            "service_quota": self.SERVICE_QUOTA,
            "episode_days": self.EPISODE_DAYS,
            "daily_mileage_if_in_service": self.DAILY_MILEAGE_IF_IN_SERVICE,
            "daily_exposure_hours": self.DAILY_EXPOSURE_HOURS,
            "jobcard_reduction_if_maintenance": self.JOBCARD_REDUCTION_IF_MAINTENANCE,
            "jobcard_new_per_day_lambda": self.JOBCARD_NEW_PER_DAY_LAMBDA
        }