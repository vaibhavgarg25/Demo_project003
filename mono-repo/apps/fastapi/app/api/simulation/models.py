from pydantic import BaseModel, Field
from typing import Optional

class SimulationConfig(BaseModel):
    """Configuration model for simulation parameters"""
    
    days_to_simulate: int = Field(default=30, ge=1, le=365, description="Number of days to simulate")
    # Removed unnecessary parameters since simulation follows exact specifications
    
    class Config:
        json_schema_extra = {
            "example": {
                "days_to_simulate": 7
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
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Simulation completed successfully",
                "days_simulated": 7,
                "total_trains": 150,
                "file_type": "zip"
            }
        }