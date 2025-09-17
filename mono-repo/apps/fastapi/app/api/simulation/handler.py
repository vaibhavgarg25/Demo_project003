import io
import zipfile
import pandas as pd
import httpx  # Async HTTP client
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from typing import Optional, List, Tuple
from app.api.simulation.models import SimulationConfig
from app.api.simulation.service import TrainSimulationService
from app.core.storage import StorageManager
from app.core.config import settings

class SimulationHandler:
    WEBHOOK_URL = settings.WEBHOOK_SIMULATION_URL  # Force reload config

    @staticmethod
    async def simulate_from_file_path(
        file_path: str,
        config: SimulationConfig,
        runId: str
    ) -> dict:
        """
        Start simulation from file path for pipeline integration.
        Saves results to shared storage and sends webhook notification.
        """
        try:
            # Step 1: Load CSV from storage
            df = await StorageManager.read_csv_from_path(file_path)
            
            # Step 2: Run simulation
            simulator = TrainSimulationService(config)
            daily_results = simulator.simulate_multiple_days(df, config.days_to_simulate)
            
            # Step 3: Save results to storage
            if config.days_to_simulate == 1:
                day_num, simulated_df = daily_results[0]
                result_file_path = await StorageManager.save_simulation_result(runId, simulated_df)
            else:
                # For multi-day, create a combined result or save first day result
                # You can modify this based on your requirements
                day_num, simulated_df = daily_results[0]
                result_file_path = await StorageManager.save_simulation_result(runId, simulated_df)
            
            # Step 4: Send webhook notification
            await SimulationHandler._send_webhook(runId, result_file_path)
            
            return {
                "success": True,
                "message": f"Simulation completed for {config.days_to_simulate} day(s)",
                "runId": runId,
                "result_file_path": result_file_path,
                "total_trains": len(df)
            }
            
        except Exception as e:
            error_msg = f"Simulation failed: {str(e)}"
            print(f"[Simulation Error] {error_msg}")
            # Still try to send webhook with error info
            try:
                await SimulationHandler._send_webhook(runId, None, error_msg)
            except:
                pass  # Don't fail if webhook fails
            raise HTTPException(status_code=500, detail=error_msg)

    @staticmethod
    async def _send_webhook(runId: str, filePath: Optional[str], error_message: Optional[str] = None):
        """Send async webhook call to backend after simulation completes"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                payload = {
                    "runId": runId, 
                    "status": "success" if filePath else "failed",
                    "outputFilePath": filePath,
                    "error": error_message
                }
                print(f"[Simulation] Attempting to send webhook to {SimulationHandler.WEBHOOK_URL}")
                print(f"[Simulation] Webhook payload: {payload}")
                
                response = await client.post(SimulationHandler.WEBHOOK_URL, json=payload, timeout=30.0)
                response.raise_for_status()
                print(f"[Simulation] Webhook sent successfully → {payload}")
                print(f"[Simulation] Response status: {response.status_code}")
                print(f"[Simulation] Response text: {response.text}")
            except httpx.TimeoutException as e:
                print(f"[Simulation] Webhook timeout error: {str(e)}")
            except httpx.ConnectError as e:
                print(f"[Simulation] Webhook connection error: {str(e)}")
            except Exception as e:
                print(f"[Simulation] Failed to send webhook: {str(e)}")
                print(f"[Simulation] Error type: {type(e).__name__}")

    @staticmethod
    async def simulate_train_fleet(
        file: UploadFile,
        config: SimulationConfig,
        runId: Optional[str] = None  # Accept optional runId argument
    ) -> StreamingResponse:
        """Main simulation handler with webhook notification"""
        try:
            # Step 1: Process CSV input
            df = await SimulationHandler.process_csv_file(file)

            # Step 2: Run simulation
            simulator = TrainSimulationService(config)

            if config.days_to_simulate == 1:
                daily_results = simulator.simulate_multiple_days(df, 1)
                day_num, simulated_df = daily_results[0]

                # Save result locally and fire webhook if runId provided (pipeline mode)
                if runId:
                    output_path = f"/tmp/simulation_result_{runId}.csv"
                    simulated_df.to_csv(output_path, index=False)
                    # Fire webhook
                    await SimulationHandler._send_webhook(runId, output_path, None)

                return SimulationHandler.create_csv_response(simulated_df, f'day-{day_num}.csv')

            else:
                daily_results = simulator.simulate_multiple_days(df, config.days_to_simulate)

                # Save results to ZIP for webhook if runId provided (pipeline mode)
                if runId:
                    output_path = f"/tmp/simulation_result_{runId}.zip"
                    zip_buffer = io.BytesIO()
                    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                        for day_num, simulated_df in daily_results:
                            csv_buffer = io.StringIO()
                            simulated_df.to_csv(csv_buffer, index=False)
                            zip_file.writestr(f'day-{day_num}.csv', csv_buffer.getvalue())

                    zip_buffer.seek(0)
                    with open(output_path, "wb") as f:
                        f.write(zip_buffer.getvalue())

                    # Fire webhook
                    await SimulationHandler._send_webhook(runId, output_path, None)

                return SimulationHandler.create_zip_response(daily_results, config.days_to_simulate)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error during simulation: {str(e)}")

    @staticmethod
    async def process_csv_file(file: UploadFile) -> pd.DataFrame:
        """Process uploaded CSV file and return DataFrame"""
        try:
            content = await file.read()
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            return df
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing CSV file: {str(e)}")
    
    @staticmethod
    def create_csv_response(df: pd.DataFrame, filename: str) -> StreamingResponse:
        """Create CSV response for single day simulation"""
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    @staticmethod
    def create_zip_response(daily_results: List[Tuple[int, pd.DataFrame]], days: int) -> StreamingResponse:
        """Create ZIP response for multi-day simulation"""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for day_num, simulated_df in daily_results:
                csv_buffer = io.StringIO()
                simulated_df.to_csv(csv_buffer, index=False)
                zip_file.writestr(f'day-{day_num}.csv', csv_buffer.getvalue())
        
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=simulation_{days}_days.zip"}
        )