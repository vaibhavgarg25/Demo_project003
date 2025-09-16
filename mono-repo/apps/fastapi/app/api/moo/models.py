from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

class MooConfig(BaseModel):
    """Configuration model for MOO (Multi-Objective Optimization) parameters"""
    
    mileage_limit_before_service: int = Field(
        default=10000, 
        ge=1, 
        description="Mileage limit before service required"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "mileage_limit_before_service": 10000
            }
        }

class TrainRankingResult(BaseModel):
    """Individual train ranking result"""
    
    train_id: str
    score: float
    rank: int
    rolling_stock_fitness: bool
    signalling_fitness: bool
    telecom_fitness: bool
    job_card_status: str
    open_job_cards: int
    branding_active: bool
    total_mileage_km: float
    mileage_since_service_km: float
    mileage_balance_variance: float
    brakepad_wear_percent: float
    hvac_wear_percent: float
    cleaning_required: bool
    shunting_moves_required: int
    operational_status: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "train_id": "TRAIN_001",
                "score": 45.67,
                "rank": 1,
                "rolling_stock_fitness": True,
                "signalling_fitness": True,
                "telecom_fitness": True,
                "job_card_status": "close",
                "open_job_cards": 0,
                "branding_active": True,
                "total_mileage_km": 45000.0,
                "mileage_since_service_km": 2500.0,
                "mileage_balance_variance": 7500.0,
                "brakepad_wear_percent": 25.5,
                "hvac_wear_percent": 15.3,
                "cleaning_required": False,
                "shunting_moves_required": 2,
                "operational_status": "in service"
            }
        }

class MooResponse(BaseModel):
    """Response model for MOO ranking results"""
    
    success: bool
    message: str
    total_trains: int
    config_used: MooConfig
    rankings: List[TrainRankingResult]
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Train ranking completed successfully",
                "total_trains": 150,
                "config_used": {
                    "mileage_limit_before_service": 10000
                },
                "rankings": [
                    {
                        "train_id": "TRAIN_001",
                        "score": 45.67,
                        "rank": 1,
                        "rolling_stock_fitness": True,
                        "signalling_fitness": True,
                        "telecom_fitness": True,
                        "job_card_status": "close",
                        "open_job_cards": 0,
                        "branding_active": True,
                        "total_mileage_km": 45000.0,
                        "mileage_since_service_km": 2500.0,
                        "mileage_balance_variance": 7500.0,
                        "brakepad_wear_percent": 25.5,
                        "hvac_wear_percent": 15.3,
                        "cleaning_required": False,
                        "shunting_moves_required": 2,
                        "operational_status": "in service"
                    }
                ]
            }
        }

class MooRankingOnly(BaseModel):
    """Simplified response with only train rankings"""
    
    train_id: str
    score: float
    rank: int