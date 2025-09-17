from fastapi import APIRouter, File, UploadFile, Query
from fastapi.responses import StreamingResponse
from typing import Union, List, Any
from enum import Enum
from pydantic import BaseModel

from app.api.moo.models import MooConfig, MooResponse, MooRankingOnly
from app.api.moo.handler import MooHandler
from app.core.storage import StorageManager

router = APIRouter(prefix="/moo", tags=["Multi-Objective Optimization"])

# Pydantic models for file path requests
class MooFilePathRequest(BaseModel):
    file_path: str
    runId: str
    mileage_limit_before_service: int = 10000

class ResponseFormat(str, Enum):
    """Response format options"""
    json = "json"          # Full JSON response with all details
    csv = "csv"            # CSV file download 
    simple = "simple"      # Simple JSON with only ID, Score, Rank

@router.post(
    "/start-from-file",
    summary="Start MOO Ranking from File Path (Pipeline Mode)",
    description="""
    🚀 **Pipeline MOO Ranking from File Path**
    
    Start MOO ranking using a file path to simulation results instead of uploading a file.
    This endpoint is designed for pipeline integration where the simulation data
    is already saved to shared storage.
    
    **Input:**
    - file_path: Path to simulation result CSV file in shared storage
    - runId: Pipeline run identifier for tracking
    - mileage_limit_before_service: Mileage limit threshold (default: 10000 km)
    
    **Output:**
    - Success/failure status
    - MOO ranking result will be saved to shared storage
    - Webhook notification sent to backend upon completion
    
    **MOO Scoring Algorithm:**
    Same comprehensive scoring as the main `/rank` endpoint with fitness certificates,
    job cards, branding, mileage, wear & tear, cleaning, and operational status.
    """
)
async def start_moo_ranking_from_file(
    request: MooFilePathRequest
) -> dict:
    """
    Start MOO ranking from file path for pipeline integration.
    Results are saved to shared storage and webhook is sent to backend.
    """
    config = MooConfig(mileage_limit_before_service=request.mileage_limit_before_service)
    result = await MooHandler.rank_from_file_path(
        request.file_path,
        config,
        request.runId
    )
    return result

@router.post(
    "/rank-from-file",
    summary="Rank Train Fleet from File Path (Legacy Pipeline Mode)",
    description="""
    🚀 **Pipeline MOO Ranking from File Path (Legacy)**
    
    Legacy endpoint - use /start-from-file instead for new implementations.
    """
)
async def rank_train_fleet_from_file(
    request: MooFilePathRequest
) -> dict:
    """
    Legacy endpoint - redirects to start_moo_ranking_from_file
    """
    # For backward compatibility, redirect to the new endpoint logic
    return await start_moo_ranking_from_file(request)

@router.post(
    "/rank",
    response_model=None,
    summary="Rank Train Fleet using Multi-Objective Optimization",
    description="""
    🚀 **Universal MOO Train Ranking API** - All functionality in one endpoint!
    
    **Input:**
    - CSV file containing train fleet data
    - Response format: `json` (default), `csv`, or `simple`
    - Mileage limit before service (optional, default: 10000 km)
    
    **Response Formats:**
    - **`json`**: Complete JSON response with detailed train metrics and rankings
    - **`csv`**: Downloadable CSV file (replicates original MOO.py exactly)
    - **`simple`**: Lightweight JSON with only Train ID, Score, and Rank
    
    **MOO Scoring Algorithm:**
    - **Fitness Certificates** (Critical): Rolling Stock (15pts), Signalling (10pts), Telecom (10pts)
    - **Job Cards**: Closed status bonus, penalty for open cards
    - **Branding**: Active campaigns with completion tracking
    - **Mileage**: Service intervals and total mileage considerations
    - **Wear & Tear**: Brakepad and HVAC wear percentages
    - **Cleaning Status**: Cleaning requirements impact
    - **Operational Status**: In-service trains preferred
    - **Shunting**: Penalty for required moves
    
    **Tie-Breaking (5 levels):**
    1. Job card priority (fewer open cards)
    2. Branding completion ratio (lower preferred)
    3. Mileage balance variance (lower preferred) 
    4. Cleaning priority (not required preferred)
    5. Shunting priority (fewer moves preferred)
    
    **Examples:**
    ```
    # Get full JSON response
    POST /api/v1/moo/rank?format=json
    
    # Download CSV file (MOO.py equivalent)
    POST /api/v1/moo/rank?format=csv
    
    # Get simple rankings only
    POST /api/v1/moo/rank?format=simple
    ```
    """
)
async def rank_train_fleet(
    file: UploadFile = File(..., description="CSV file containing train fleet data"),
    format: ResponseFormat = Query(default=ResponseFormat.json, description="Response format: json, csv, or simple"),
    mileage_limit_before_service: int = Query(default=10000, ge=1, description="Mileage limit before service required")
) -> Any:
    """
    🎯 **One API to rule them all!** 
    
    Universal MOO ranking endpoint that handles all response formats:
    - JSON: Complete response with all train details
    - CSV: Downloadable file (exact MOO.py replica)
    - Simple: Minimal JSON with ID, Score, Rank only
    """
    # Create configuration
    config = MooConfig(mileage_limit_before_service=mileage_limit_before_service)
    
    # Route to appropriate handler based on format
    if format == ResponseFormat.csv:
        return await MooHandler.rank_train_fleet(file, config, return_csv=True)
    elif format == ResponseFormat.simple:
        return await MooHandler.get_simple_ranking(file, config)
    else:  # json format (default)
        return await MooHandler.rank_train_fleet(file, config, return_csv=False)

@router.get(
    "/info",
    summary="MOO Service Information",
    description="Get complete information about the MOO service including configuration, health, and scoring criteria"
)
async def get_moo_info():
    """Get comprehensive MOO service information"""
    return {
        "service": "moo",
        "status": "healthy",
        "message": "Multi-Objective Optimization service is operational",
        "algorithm": "Train Fleet Ranking using MOO scoring system",
        "version": "1.0.0",
        "endpoints": {
            "/rank": "Universal ranking endpoint with multiple response formats",
            "/info": "Service information and scoring criteria"
        },
        "default_config": MooConfig().dict(),
        "response_formats": {
            "json": "Complete JSON response with detailed train metrics",
            "csv": "Downloadable CSV file (MOO.py equivalent)", 
            "simple": "Lightweight JSON with ID, Score, Rank only"
        },

        "scoring_criteria": {
            "fitness_certificates": {
                "rolling_stock": {"points": 15, "critical": True, "description": "If FALSE, total score = 0"},
                "signalling": {"points": 10, "critical": True, "description": "If FALSE, total score = 0"},
                "telecom": {"points": 10, "critical": True, "description": "If FALSE, total score = 0"}
            },
            "job_cards": {
                "closed_status": {"points": 5, "description": "Bonus for closed job cards"},
                "open_count": {"points": "5 - (open_count * 2)", "description": "Penalty for open job cards"}
            },
            "branding": {
                "active_bonus": {"points": 3, "description": "Bonus for active branding campaigns"},
                "completion_bonus": {"points": "7 * (1 - completion_ratio)", "description": "Bonus based on incomplete campaigns"}
            },
            "mileage": {
                "total_mileage": {
                    "under_50k": {"points": 5},
                    "50k_to_150k": {"points": 2.5},
                    "over_150k": {"points": 0}
                },
                "service_interval": {"formula": "5 - (mileage_since_service / 10000)", "description": "Penalty for overdue service"},
                "balance_variance": {"formula": "5 - (abs(variance) / 1000)", "description": "Penalty for mileage imbalance"}
            },
            "wear_and_tear": {
                "brakepad": {"formula": "10 - (wear_percent / 10)", "max_points": 10},
                "hvac": {"formula": "5 - (wear_percent / 10)", "max_points": 5}
            },
            "cleaning": {
                "not_required": {"points": 10, "description": "Bonus for clean trains"}
            },
            "operational": {
                "in_service": {"points": 2, "description": "Bonus for trains in service"}
            },
            "shunting": {
                "formula": "3 - (moves_required * 3)",
                "description": "Penalty for shunting moves required"
            }
        },
        "tie_breaking_order": [
            "Primary Score (higher is better)",
            "Job Card Priority (fewer open cards)", 
            "Branding Completion Ratio (lower completion preferred)",
            "Mileage Balance Variance (lower variance preferred)",
            "Cleaning Priority (not required preferred)",
            "Shunting Priority (fewer moves preferred)"
        ]
    }