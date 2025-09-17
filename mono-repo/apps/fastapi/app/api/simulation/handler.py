import io
import zipfile
import pandas as pd
import httpx  # Async HTTP client
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from app.api.simulation.models import SimulationConfig
from app.api.simulation.service import TrainSimulationService

class SimulationHandler:
    WEBHOOK_URL = "http://backend:8000/api/webhook/simulation-finished"  # Use env variable in production

    @staticmethod
    async def _send_webhook(runId: str, filePath: str):
        """Send async webhook call to backend after simulation completes"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {"runId": runId, "filePath": filePath}
                response = await client.post(SimulationHandler.WEBHOOK_URL, json=payload, timeout=10)
                response.raise_for_status()
                print(f"[Simulation] Webhook sent successfully → {payload}")
            except Exception as e:
                print(f"[Simulation] Failed to send webhook: {str(e)}")

    @staticmethod
    async def simulate_train_fleet(
        file: UploadFile,
        config: SimulationConfig,
        runId: str  # Accept runId argument
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

                # Save result locally
                output_path = f"/tmp/simulation_result_{runId}.csv"
                simulated_df.to_csv(output_path, index=False)

                # Fire webhook
                await SimulationHandler._send_webhook(runId, output_path)

                return SimulationHandler.create_csv_response(simulated_df, f'day-{day_num}.csv')

            else:
                daily_results = simulator.simulate_multiple_days(df, config.days_to_simulate)

                # Save results to ZIP for webhook
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
                await SimulationHandler._send_webhook(runId, output_path)

                return SimulationHandler.create_zip_response(daily_results, config.days_to_simulate)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error during simulation: {str(e)}")