"""
Shared storage manager for FastAPI services
Provides centralized file handling for the pipeline system
"""

import os
import time
from pathlib import Path
from typing import Optional, Dict, Any
import pandas as pd
from app.core.config import settings

class StorageManager:
    """Storage utility class for managing pipeline files in FastAPI services"""
    
    # Storage configuration
    BASE_STORAGE_PATH = settings.SHARED_STORAGE_PATH
    
    # Directory structure - organized by service
    PATHS = {
        "INPUT": "input",
        "OUTPUT": "output",
        "SIMULATION_OUTPUT": "output/simulation",
        "MOO_OUTPUT": "output/moo", 
        "RL_OUTPUT": "output/rl",
        "TEMP": "temp",
        "LOGS": "logs"
    }
    
    # File naming patterns
    FILE_PATTERNS = {
        "USER_UPLOAD": lambda upload_id: f"user_upload_{upload_id}.csv",
        "SIMULATION_RESULT": lambda run_id: f"simulation_result_{run_id}.csv",
        "MOO_RESULT": lambda run_id: f"moo_result_{run_id}.csv",
        "RL_FINAL": lambda run_id: f"rl_final_{run_id}.csv"
    }
    
    @classmethod
    async def initialize_storage(cls) -> None:
        """Initialize storage directories if they don't exist"""
        try:
            directories = [
                cls.get_storage_path("INPUT"),
                cls.get_storage_path("OUTPUT"),
                cls.get_storage_path("SIMULATION_OUTPUT"),
                cls.get_storage_path("MOO_OUTPUT"),
                cls.get_storage_path("RL_OUTPUT"),
                cls.get_storage_path("TEMP"),
                cls.get_storage_path("LOGS")
            ]
            
            for directory in directories:
                Path(directory).mkdir(parents=True, exist_ok=True)
                print(f"[Storage] Directory ensured: {directory}")
                
        except Exception as e:
            print(f"[Storage] Failed to initialize directories: {e}")
            raise
    
    @classmethod
    def get_storage_path(cls, sub_path: str) -> str:
        """Get full path for a storage subdirectory"""
        return os.path.join(cls.BASE_STORAGE_PATH, cls.PATHS[sub_path])
    
    @classmethod
    def get_file_path(cls, directory: str, filename: str) -> str:
        """Get full file path in a specific storage directory"""
        return os.path.join(cls.get_storage_path(directory), filename)
    
    @classmethod
    async def read_csv_from_path(cls, file_path: str) -> pd.DataFrame:
        """Read CSV file from storage path and return DataFrame"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
                
            df = pd.read_csv(file_path)
            print(f"[Storage] CSV loaded from: {file_path} ({len(df)} rows)")
            return df
            
        except Exception as e:
            print(f"[Storage] Failed to read CSV from {file_path}: {e}")
            raise
    
    @classmethod
    async def save_csv_to_storage(cls, df: pd.DataFrame, directory: str, filename: str) -> str:
        """Save DataFrame as CSV to storage and return file path"""
        try:
            file_path = cls.get_file_path(directory, filename)
            
            # Ensure directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Save CSV
            df.to_csv(file_path, index=False)
            print(f"[Storage] CSV saved to: {file_path} ({len(df)} rows)")
            
            return file_path
            
        except Exception as e:
            print(f"[Storage] Failed to save CSV: {e}")
            raise
    
    @classmethod
    async def save_simulation_result(cls, run_id: str, df: pd.DataFrame) -> str:
        """Save simulation results to organized simulation output folder"""
        filename = cls.FILE_PATTERNS["SIMULATION_RESULT"](run_id)
        return await cls.save_csv_to_storage(df, "SIMULATION_OUTPUT", filename)
    
    @classmethod
    async def save_moo_result(cls, run_id: str, df: pd.DataFrame) -> str:
        """Save MOO ranking results to organized MOO output folder"""
        filename = cls.FILE_PATTERNS["MOO_RESULT"](run_id)
        return await cls.save_csv_to_storage(df, "MOO_OUTPUT", filename)
    
    @classmethod
    async def save_rl_result(cls, run_id: str, df: pd.DataFrame) -> str:
        """Save RL scheduling results to organized RL output folder"""
        filename = cls.FILE_PATTERNS["RL_FINAL"](run_id)
        return await cls.save_csv_to_storage(df, "RL_OUTPUT", filename)
    
    @classmethod
    async def save_pipeline_log(cls, run_id: str, stage: str, log_data: dict) -> str:
        """Save pipeline stage logs for UI monitoring"""
        import json
        from datetime import datetime
        
        log_filename = f"pipeline_{run_id}_{stage}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        log_path = cls.get_file_path("LOGS", log_filename)
        
        # Ensure directory exists
        Path(log_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Add timestamp to log data
        log_data["timestamp"] = datetime.now().isoformat()
        log_data["run_id"] = run_id
        log_data["stage"] = stage
        
        # Save JSON log
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
            
        print(f"[Storage] Pipeline log saved: {log_path}")
        return log_path
    
    @classmethod
    async def file_exists(cls, file_path: str) -> bool:
        """Check if file exists"""
        return os.path.exists(file_path)
    
    @classmethod
    async def delete_file(cls, file_path: str) -> None:
        """Delete file from storage"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"[Storage] File deleted: {file_path}")
        except Exception as e:
            print(f"[Storage] Failed to delete file {file_path}: {e}")
            raise
    
    @classmethod
    async def cleanup_temp_files(cls, hours_old: int = 24) -> None:
        """Clean up old temporary files"""
        try:
            temp_dir = cls.get_storage_path("TEMP")
            if not os.path.exists(temp_dir):
                return
                
            cutoff_time = time.time() - (hours_old * 3600)
            
            for filename in os.listdir(temp_dir):
                file_path = os.path.join(temp_dir, filename)
                if os.path.isfile(file_path) and os.path.getmtime(file_path) < cutoff_time:
                    await cls.delete_file(file_path)
                    print(f"[Storage] Cleaned up old temp file: {file_path}")
                    
        except Exception as e:
            print(f"[Storage] Failed to cleanup temp files: {e}")
    
    @classmethod
    async def get_storage_stats(cls) -> Dict[str, int]:
        """Get storage usage statistics"""
        try:
            stats = {}
            for name, path in cls.PATHS.items():
                directory = cls.get_storage_path(name)
                if os.path.exists(directory):
                    file_count = len([f for f in os.listdir(directory) 
                                    if os.path.isfile(os.path.join(directory, f))])
                    stats[f"{name.lower()}_files"] = file_count
                else:
                    stats[f"{name.lower()}_files"] = 0
            
            return stats
            
        except Exception as e:
            print(f"[Storage] Failed to get storage stats: {e}")
            return {"input_files": 0, "output_files": 0, "temp_files": 0}


# Utility functions for pipeline integration
async def extract_run_id_from_path(file_path: str, pattern_type: str) -> Optional[str]:
    """Extract run ID from file path based on naming pattern"""
    try:
        filename = os.path.basename(file_path)
        
        # Remove .csv extension
        name_without_ext = filename.replace('.csv', '')
        
        # Extract run ID based on pattern
        if pattern_type == "simulation":
            prefix = "simulation_result_"
        elif pattern_type == "moo":
            prefix = "moo_result_"
        elif pattern_type == "rl":
            prefix = "rl_final_"
        elif pattern_type == "user_upload":
            prefix = "user_upload_"
        else:
            return None
            
        if name_without_ext.startswith(prefix):
            return name_without_ext[len(prefix):]
            
        return None
        
    except Exception:
        return None


async def create_shared_storage_config() -> Dict[str, Any]:
    """Create storage configuration for FastAPI services"""
    await StorageManager.initialize_storage()
    
    return {
        "storage_base_path": StorageManager.BASE_STORAGE_PATH,
        "storage_paths": StorageManager.PATHS,
        "file_patterns": {
            name: pattern("example") for name, pattern in StorageManager.FILE_PATTERNS.items()
        },
        "initialized": True
    }