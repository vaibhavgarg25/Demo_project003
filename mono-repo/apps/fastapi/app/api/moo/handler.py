import io
import pandas as pd
from typing import List
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
import httpx  # 👈 added for webhook call

from app.api.moo.models import MooConfig, MooResponse, TrainRankingResult, MooRankingOnly
from app.api.moo.service import MooService
from app.core.storage import StorageManager
from app.core.config import settings


class MooHandler:
    """Handler class for MOO (Multi-Objective Optimization) API operations"""

    WEBHOOK_URL = settings.WEBHOOK_MOO_URL

    @staticmethod
    async def rank_from_file_path(
        file_path: str,
        config: MooConfig,
        runId: str
    ) -> dict:
        """
        Start MOO ranking from file path for pipeline integration.
        Saves results to shared storage and sends webhook notification.
        """
        try:
            # Step 1: Load CSV from storage
            df = await StorageManager.read_csv_from_path(file_path)
            
            # Step 2: Run MOO ranking
            moo_service = MooService(config)
            ranked_df = moo_service.rank_trains(df)
            
            print("=== MOO Train Ranking Results (Pipeline) ===")
            for _, row in ranked_df.iterrows():
                print(f"Train {row['TrainID']} | Score: {row['Score']} | Rank: {row['Rank']}")
            
            # Step 3: Save results to storage
            result_file_path = await StorageManager.save_moo_result(runId, ranked_df)
            
            # Step 4: Send webhook notification
            await MooHandler._send_webhook(runId, result_file_path)
            
            return {
                "success": True,
                "message": "MOO ranking completed successfully",
                "runId": runId,
                "result_file_path": result_file_path,
                "total_trains": len(df),
                "config_used": config.dict()
            }
            
        except Exception as e:
            error_msg = f"MOO ranking failed: {str(e)}"
            print(f"[MOO Error] {error_msg}")
            # Still try to send webhook with error info
            try:
                await MooHandler._send_webhook(runId, None, error_msg)
            except:
                pass  # Don't fail if webhook fails
            raise HTTPException(status_code=500, detail=error_msg)

    @staticmethod
    async def process_csv_file(file: UploadFile) -> pd.DataFrame:
        """Process uploaded CSV file and return DataFrame"""
        try:
            if not file.filename.endswith('.csv'):
                raise HTTPException(status_code=400, detail="Only CSV files are supported")

            contents = await file.read()
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

            if df.empty:
                raise HTTPException(status_code=400, detail="CSV file is empty")

            required_columns = ['TrainID']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_columns}")

            return df

        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file. Please ensure it's UTF-8 encoded.")
        except pd.errors.EmptyDataError:
            raise HTTPException(status_code=400, detail="CSV file contains no data")
        except pd.errors.ParserError as e:
            raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

    @staticmethod
    def create_csv_response(ranked_df: pd.DataFrame, filename: str = "moo_ranked_trains.csv") -> StreamingResponse:
        """Create CSV response for ranked train data"""
        cols = list(ranked_df.columns)
        if "Score" in cols and "Rank" in cols:
            cols.remove("Score")
            cols.remove("Rank")
            cols = cols + ["Score", "Rank"]
            ranked_df = ranked_df[cols]

        output = io.StringIO()
        ranked_df.to_csv(output, index=False)
        output.seek(0)

        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )

    @staticmethod
    async def _send_webhook(run_id: str, file_path: str, error_message: str = None):
        """Send webhook notification to backend"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {
                    "runId": run_id, 
                    "filePath": file_path,
                    "success": file_path is not None,
                    "error": error_message
                }
                resp = await client.post(MooHandler.WEBHOOK_URL, json=payload, timeout=10)
                resp.raise_for_status()
                print(f"[MOO] Webhook sent successfully → {payload}")
            except Exception as e:
                print(f"[MOO] Failed to send webhook: {e}")

    @staticmethod
    async def rank_train_fleet(
        file: UploadFile,
        config: MooConfig,
        return_csv: bool = False,
        run_id: str = None  # 👈 added runId for pipeline tracking
    ) -> any:
        """Main MOO ranking handler method"""
        try:
            df = await MooHandler.process_csv_file(file)
            moo_service = MooService(config)
            ranked_df = moo_service.rank_trains(df)

            print("=== MOO Train Ranking Results ===")
            for _, row in ranked_df.iterrows():
                print(f"Train {row['TrainID']} | Score: {row['Score']} | Rank: {row['Rank']}")

            # Save ranked file locally (for pipeline)
            output_path = f"/tmp/moo_result_{run_id or 'manual'}.csv"
            ranked_df.to_csv(output_path, index=False)

            # 🔔 Fire webhook after MOO completion
            if run_id:
                await MooHandler._send_webhook(run_id, output_path, None)

            if return_csv:
                return MooHandler.create_csv_response(ranked_df)
            else:
                ranking_results = moo_service.convert_to_ranking_results(ranked_df)
                response = MooResponse(
                    success=True,
                    message="Train ranking completed successfully using Multi-Objective Optimization",
                    total_trains=len(df),
                    config_used=config,
                    rankings=ranking_results
                )
                return response

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal server error during MOO ranking: {str(e)}")

    @staticmethod
    async def get_simple_ranking(
        file: UploadFile,
        config: MooConfig,
        run_id: str = None  # 👈 added runId for pipeline tracking
    ) -> List[MooRankingOnly]:
        """Get simplified ranking with only train ID, score, and rank"""
        try:
            df = await MooHandler.process_csv_file(file)
            moo_service = MooService(config)
            ranked_df = moo_service.rank_trains(df)

            output_path = f"/tmp/moo_result_{run_id or 'manual'}_simple.csv"
            ranked_df.to_csv(output_path, index=False)

            # 🔔 Fire webhook
            if run_id:
                await MooHandler._send_webhook(run_id, output_path, None)

            simple_results = []
            for _, row in ranked_df.iterrows():
                simple_results.append(MooRankingOnly(
                    train_id=str(row["TrainID"]),
                    score=float(row["Score"]),
                    rank=int(row["Rank"])
                ))

            return simple_results

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal server error during simplified ranking: {str(e)}")