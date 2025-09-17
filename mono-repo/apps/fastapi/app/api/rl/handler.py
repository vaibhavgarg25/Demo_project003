import os
import io
import csv
import json
import sys
import tempfile
from pathlib import Path
import pandas as pd
from typing import List, Dict, Any, Optional, Union
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse

# Add the project root directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

# Add the AIML directory to the Python path
AIML_DIR = PROJECT_ROOT / "apps" / "AIML"
sys.path.append(str(AIML_DIR))

from app.api.rl.models import RLRequest, RLResponse, RLConfig

# Import the RL module from the same directory since it's copied there
try:
    from app.api.rl.RL import TrainSchedulingEnvMultiDay, SEED
except ImportError:
    # Fallback to direct import
    from RL import TrainSchedulingEnvMultiDay, SEED


class RLHandler:
    """Handler class for RL API operations"""

    @staticmethod
    async def process_csv_file(file: UploadFile) -> pd.DataFrame:
        """Process uploaded CSV file and return DataFrame"""
        try:
            # Validate file type
            if not file.filename.endswith('.csv'):
                raise HTTPException(
                    status_code=400, 
                    detail="Only CSV files are supported"
                )
            
            # Read file content
            contents = await file.read()
            
            # Parse CSV
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            
            # Validate DataFrame is not empty
            if df.empty:
                raise HTTPException(
                    status_code=400,
                    detail="CSV file is empty"
                )
            
            return df
            
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Unable to decode CSV file. Please ensure it's UTF-8 encoded."
            )
        except pd.errors.EmptyDataError:
            raise HTTPException(
                status_code=400,
                detail="CSV file contains no data"
            )
        except pd.errors.ParserError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error parsing CSV file: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error processing file: {str(e)}"
            )

    @staticmethod
    def create_csv_response(df: pd.DataFrame, filename: str = "rl_schedule.csv") -> StreamingResponse:
        """Create CSV response for RL assignments"""
        # Convert boolean columns
        processed_df = df.copy()
        
        # Create CSV output
        output = io.StringIO()
        processed_df.to_csv(output, index=False)
        output.seek(0)
        
        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )

    @staticmethod
    async def schedule_and_return_json(file: UploadFile, config: RLRequest) -> RLResponse:
        """Main RL scheduling handler method that returns JSON response"""
        temp_path = None
        try:
            # Process uploaded file
            df = await RLHandler.process_csv_file(file)
            
            # Save the file temporarily
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as temp_file:
                temp_path = temp_file.name
                df.to_csv(temp_file, index=False)
            
            # Update config with the temp path
            config.csv_path = temp_path
            
            # Load model if not already loaded
            if not hasattr(TrainSchedulingEnvMultiDay, 'model') or TrainSchedulingEnvMultiDay.model is None:
                TrainSchedulingEnvMultiDay.load_model()
            
            # Initialize RL model
            env = TrainSchedulingEnvMultiDay(
                csv_path=config.csv_path,
                service_quota=config.service_quota,
                episode_days=config.episode_days,
                daily_mileage_if_in_service=config.daily_mileage_if_in_service,
                daily_exposure_hours=config.daily_exposure_hours,
                jobcard_reduction_if_maintenance=config.jobcard_reduction_if_maintenance,
                jobcard_new_per_day_lambda=config.jobcard_new_per_day_lambda,
                today=config.today,
                seed=config.seed if config.seed else SEED
            )
            
            # Reset environment
            obs, _ = env.reset(seed=SEED)
            
            # Run the environment until completion
            terminated = truncated = False
            total_reward = 0.0
            
            while not terminated and not truncated:
                action, _states = env.model.predict(obs, deterministic=False)
                obs, reward, terminated, truncated, info = env.step(int(action))
                total_reward += reward
            
            # Get assignments from environment
            assignments = []
            for day_idx, day_assignments in enumerate(env.assigned_actions_history):
                for train_idx, action in enumerate(day_assignments):
                    train_id = df.iloc[train_idx].get("TrainID", f"TRAIN_{train_idx:03d}")
                    action_map = {0: "In_Service", 1: "Standby", 2: "Under_Maintenance"}
                    assignments.append({
                        "TrainID": train_id,
                        "OperationalStatus": action_map.get(int(action), "Unknown"),
                        "Day": day_idx + 1,
                        "Reward": reward
                    })
            
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Create response
            response = RLResponse(
                success=True,
                message="RL scheduling completed successfully",
                total_trains=len(df),
                episode_days=config.episode_days,
                day_index=env.day_index,
                total_shunting_cost=env.total_shunting_cost,
                final_reward=total_reward,
                assignments=assignments
            )
            
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Catch any other unexpected errors
            # Clean up temporary file if it exists
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error during RL scheduling: {str(e)}"
            )
    
    @staticmethod
    async def schedule_and_return_csv(file: UploadFile, config: RLRequest) -> StreamingResponse:
        """RL scheduling handler that returns CSV response"""
        temp_path = None
        try:
            # Process uploaded file
            df = await RLHandler.process_csv_file(file)
            
            # Save the file temporarily
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as temp_file:
                temp_path = temp_file.name
                df.to_csv(temp_file, index=False)
            
            # Update config with the temp path
            config.csv_path = temp_path
            
            # Load model if not already loaded
            if not hasattr(TrainSchedulingEnvMultiDay, 'model') or TrainSchedulingEnvMultiDay.model is None:
                TrainSchedulingEnvMultiDay.load_model()
            
            # Initialize RL model
            env = TrainSchedulingEnvMultiDay(
                csv_path=config.csv_path,
                service_quota=config.service_quota,
                episode_days=config.episode_days,
                daily_mileage_if_in_service=config.daily_mileage_if_in_service,
                daily_exposure_hours=config.daily_exposure_hours,
                jobcard_reduction_if_maintenance=config.jobcard_reduction_if_maintenance,
                jobcard_new_per_day_lambda=config.jobcard_new_per_day_lambda,
                today=config.today,
                seed=config.seed if config.seed else SEED
            )
            
            # Reset environment
            obs, _ = env.reset(seed=SEED)
            
            # Run the environment until completion
            terminated = truncated = False
            
            while not terminated and not truncated:
                action, _states = env.model.predict(obs, deterministic=False)
                obs, reward, terminated, truncated, info = env.step(int(action))
            
            # Create output dataframe with assignments
            result_df = df.copy()
            
            # Get the final day assignments (last day in history)
            if env.assigned_actions_history:
                final_assignments = env.assigned_actions_history[-1]
                action_map = {0: "In_Service", 1: "Standby", 2: "Under_Maintenance"}
                result_df["OperationalStatus"] = [action_map.get(int(action), "Unknown") for action in final_assignments]
            else:
                result_df["OperationalStatus"] = "Unknown"
            
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Return CSV response
            return RLHandler.create_csv_response(result_df, "rl_schedule.csv")
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Clean up temporary file if it exists
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error during RL scheduling: {str(e)}"
            )
    
    @staticmethod
    async def get_simple_schedule(file: UploadFile, config: RLRequest) -> Dict[str, Any]:
        """RL scheduling handler that returns simple JSON response"""
        temp_path = None
        try:
            # Process uploaded file
            df = await RLHandler.process_csv_file(file)
            
            # Save the file temporarily
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as temp_file:
                temp_path = temp_file.name
                df.to_csv(temp_file, index=False)
            
            # Update config with the temp path
            config.csv_path = temp_path
            
            # Load model if not already loaded
            if not hasattr(TrainSchedulingEnvMultiDay, 'model') or TrainSchedulingEnvMultiDay.model is None:
                TrainSchedulingEnvMultiDay.load_model()
            
            # Initialize RL model
            env = TrainSchedulingEnvMultiDay(
                csv_path=config.csv_path,
                service_quota=config.service_quota,
                episode_days=config.episode_days,
                daily_mileage_if_in_service=config.daily_mileage_if_in_service,
                daily_exposure_hours=config.daily_exposure_hours,
                jobcard_reduction_if_maintenance=config.jobcard_reduction_if_maintenance,
                jobcard_new_per_day_lambda=config.jobcard_new_per_day_lambda,
                today=config.today,
                seed=config.seed if config.seed else SEED
            )
            
            # Reset environment
            obs, _ = env.reset(seed=SEED)
            
            # Run the environment until completion
            terminated = truncated = False
            
            while not terminated and not truncated:
                action, _states = env.model.predict(obs, deterministic=False)
                obs, reward, terminated, truncated, info = env.step(int(action))
            
            # Get simple assignments from final day
            assignments = []
            if env.assigned_actions_history:
                final_assignments = env.assigned_actions_history[-1]
                action_map = {0: "In_Service", 1: "Standby", 2: "Under_Maintenance"}
                for train_idx, action in enumerate(final_assignments):
                    train_id = df.iloc[train_idx].get("TrainID", f"TRAIN_{train_idx:03d}")
                    assignments.append({
                        "TrainID": train_id,
                        "OperationalStatus": action_map.get(int(action), "Unknown")
                    })
            
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Return simple response
            return {
                "success": True,
                "message": "RL scheduling completed successfully",
                "total_trains": len(df),
                "assignments": assignments
            }
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Clean up temporary file if it exists
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error during RL scheduling: {str(e)}"
            )