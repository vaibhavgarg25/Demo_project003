import os
import sys
from pathlib import Path
import pandas as pd
from typing import List, Dict, Any

# Add the project root directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

# Add the AIML directory to the Python path
AIML_DIR = PROJECT_ROOT / "apps" / "AIML"
sys.path.append(str(AIML_DIR))

# Now try to import RL module
try:
    from app.api.rl.RL import TrainSchedulingEnvMultiDay
except ImportError:
    from RL import TrainSchedulingEnvMultiDay

from app.api.rl.models import RLRequest, RLResponse


class RLService:
    """Service class for Reinforcement Learning train scheduling"""
    
    @staticmethod
    def validate_input_data(df: pd.DataFrame) -> bool:
        """Validate input data for RL scheduling"""
        try:
            # Basic validation
            required_columns = ['TrainID']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            return True
            
        except Exception as e:
            raise ValueError(f"Input data validation failed: {str(e)}")
    
    @staticmethod
    def run_rl_scheduling(config: RLRequest) -> RLResponse:
        """Run RL scheduling with given configuration"""
        try:
            // Load model if not already loaded
            if not hasattr(TrainSchedulingEnvMultiDay, 'model'):
                TrainSchedulingEnvMultiDay.load_model()
            
            // Create environment
            env = TrainSchedulingEnvMultiDay(
                csv_path=config.csv_path,
                service_quota=config.service_quota,
                episode_days=config.episode_days,
                daily_mileage_if_in_service=config.daily_mileage_if_in_service,
                daily_exposure_hours=config.daily_exposure_hours,
                jobcard_reduction_if_maintenance=config.jobcard_reduction_if_maintenance,
                jobcard_new_per_day_lambda=config.jobcard_new_per_day_lambda,
                today=config.today,
                seed=config.seed
            )
            
            // Run the environment
            obs, _ = env.reset(seed=config.seed if config.seed else None)
            terminated = False
            total_reward = 0.0
            
            while not terminated:
                action, _states = env.model.predict(obs, deterministic=False)
                obs, reward, terminated, truncated, info = env.step(int(action))
                total_reward += reward
            
            // Process results
            assignments = []
            for day_idx, day_assignments in enumerate(env.assigned_actions_history):
                for train_idx, action in enumerate(day_assignments):
                    train_id = df.iloc[train_idx].get("TrainID", f"TRAIN_{train_idx:03d}")
                    action_map = {0: "In_Service", 1: "Standby", 2: "Under_Maintenance"}
                    assignments.append({
                        "TrainID": train_id,
                        "OperationalStatus": action_map.get(int(action), "Unknown"),
                        "Day": day_idx + 1
                    })
            
            // Create response
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
            
        except Exception as e:
            raise RuntimeError(f"Error running RL scheduling: {str(e)}")