from pydantic import BaseModel, Field
from typing import Optional

class SimulationConfig(BaseModel):
    """Configuration model for simulation parameters"""
    
    days_to_simulate: int = Field(default=30, ge=1, le=365, description="Number of days to simulate")
    daily_run_km_min: int = Field(default=200, ge=0, description="Minimum daily running kilometers")
    daily_run_km_max: int = Field(default=400, ge=0, description="Maximum daily running kilometers")
    service_interval_km: int = Field(default=8000, ge=1000, description="Service interval in kilometers")
    brakepad_lifespan_km: int = Field(default=20000, ge=5000, description="Brakepad lifespan in kilometers")
    hvac_lifespan_hours: int = Field(default=8760, ge=1000, description="HVAC system lifespan in hours")
    cleaning_threshold_days: int = Field(default=5, ge=1, description="Days before cleaning is required")
    fitness_check_threshold_days: int = Field(default=90, ge=30, description="Days between fitness checks")
    signalling_failure_chance: float = Field(default=0.02, ge=0.0, le=1.0, description="Daily signalling failure probability")
    telecom_failure_chance: float = Field(default=0.015, ge=0.0, le=1.0, description="Daily telecom failure probability")
    dirt_accumulation_chance: float = Field(default=0.05, ge=0.0, le=1.0, description="Daily dirt accumulation probability")

    class Config:
        schema_extra = {
            "example": {
                "days_to_simulate": 7,
                "daily_run_km_min": 250,
                "daily_run_km_max": 450,
                "service_interval_km": 10000,
                "brakepad_lifespan_km": 25000,
                "hvac_lifespan_hours": 8760,
                "cleaning_threshold_days": 4,
                "fitness_check_threshold_days": 90,
                "signalling_failure_chance": 0.015,
                "telecom_failure_chance": 0.01,
                "dirt_accumulation_chance": 0.06
            }
        }

class SimulationResponse(BaseModel):
    """Response model for simulation results"""
    
    success: bool
    message: str
    days_simulated: int
    total_trains: int
    file_type: str  # 'csv' or 'zip'
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Simulation completed successfully",
                "days_simulated": 7,
                "total_trains": 150,
                "file_type": "zip"
            }
        }