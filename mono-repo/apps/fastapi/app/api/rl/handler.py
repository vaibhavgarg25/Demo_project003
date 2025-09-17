import os
import io
import csv
import json
import sys
import tempfile
from pathlib import Path
import pandas as pd
import httpx  # 👈 Async HTTP client
from typing import List, Dict, Any
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from app.api.rl.models import RLRequest, RLResponse, RLConfig
from app.api.rl.RL import TrainSchedulingEnvMultiDay, SEED


class RLHandler:
    WEBHOOK_URL = "http://backend:8000/api/webhook/rl-finished"  # Adjust accordingly

    @staticmethod
    async def _send_webhook(runId: str, filePath: str):
        """Send async webhook call to backend after RL scheduling completes"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {"runId": runId, "filePath": filePath}
                response = await client.post(RLHandler.WEBHOOK_URL, json=payload, timeout=10)
                response.raise_for_status()
                print(f"[RL] Webhook sent successfully → {payload}")
            except Exception as e:
                print(f"[RL] Failed to send webhook: {str(e)}")

    @staticmethod
    async def schedule_and_return_csv(
        file: UploadFile,
        config: RLRequest,
        runId: str  # 👈 Accept runId argument for tracking
    ) -> StreamingResponse:
        """RL scheduling handler with webhook notification, returns CSV response"""
        temp_path = None
        try:
            # Step 1: Process uploaded file
            df = await RLHandler.process_csv_file(file)

            # Step 2: Save file temporarily
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as temp_file:
                temp_path = temp_file.name
                df.to_csv(temp_file, index=False)

            config.csv_path = temp_path

            # Step 3: Load model if not already loaded
            if not hasattr(TrainSchedulingEnvMultiDay, 'model') or TrainSchedulingEnvMultiDay.model is None:
                TrainSchedulingEnvMultiDay.load_model()

            # Step 4: Initialize environment
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

            # Step 5: Run environment until completion
            obs, _ = env.reset(seed=SEED)
            terminated = truncated = False

            while not terminated and not truncated:
                action, _states = env.model.predict(obs, deterministic=False)
                obs, reward, terminated, truncated, info = env.step(int(action))

            # Step 6: Prepare result DataFrame
            result_df = df.copy()
            if env.assigned_actions_history:
                final_assignments = env.assigned_actions_history[-1]
                action_map = {0: "In_Service", 1: "Standby", 2: "Under_Maintenance"}
                result_df["OperationalStatus"] = [action_map.get(int(a), "Unknown") for a in final_assignments]
            else:
                result_df["OperationalStatus"] = "Unknown"

            # Step 7: Save result as file for webhook
            output_path = f"/tmp/rl_schedule_result_{runId}.csv"
            result_df.to_csv(output_path, index=False)

            # Step 8: Fire webhook
            await RLHandler._send_webhook(runId, output_path)

            # Step 9: Return CSV Response
            return RLHandler.create_csv_response(result_df, "rl_schedule.csv")

        except HTTPException:
            raise
        except Exception as e:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=500, detail=f"Internal error during RL scheduling: {str(e)}")