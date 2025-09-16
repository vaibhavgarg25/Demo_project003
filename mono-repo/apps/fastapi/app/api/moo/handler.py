import io
import pandas as pd
from typing import List
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.api.moo.models import MooConfig, MooResponse, TrainRankingResult, MooRankingOnly
from app.api.moo.service import MooService

class MooHandler:
    """Handler class for MOO (Multi-Objective Optimization) API operations"""
    
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
            
            # Validate required columns exist
            required_columns = ['TrainID']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {missing_columns}"
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
    def create_csv_response(ranked_df: pd.DataFrame, filename: str = "moo_ranked_trains.csv") -> StreamingResponse:
        """Create CSV response for ranked train data"""
        # Reorder columns to match MOO.py output (Score and Rank at the end)
        cols = list(ranked_df.columns)
        if "Score" in cols and "Rank" in cols:
            # Move Score and Rank to end
            cols.remove("Score")
            cols.remove("Rank")
            cols = cols + ["Score", "Rank"]
            ranked_df = ranked_df[cols]
        
        # Create CSV output
        output = io.StringIO()
        ranked_df.to_csv(output, index=False)
        output.seek(0)
        
        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    
    @staticmethod
    async def rank_train_fleet(
        file: UploadFile,
        config: MooConfig,
        return_csv: bool = False
    ) -> any:
        """Main MOO ranking handler method"""
        try:
            # Process uploaded file
            df = await MooHandler.process_csv_file(file)
            
            # Initialize MOO service
            moo_service = MooService(config)
            
            # Rank trains using MOO algorithm
            ranked_df = moo_service.rank_trains(df)
            
            # Print ranking results (as in original MOO.py)
            print("=== MOO Train Ranking Results ===")
            for _, row in ranked_df.iterrows():
                print(f"Train {row['TrainID']} | Score: {row['Score']} | Rank: {row['Rank']}")
            
            if return_csv:
                # Return CSV file
                return MooHandler.create_csv_response(ranked_df)
            else:
                # Return JSON response
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
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Catch any other unexpected errors
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error during MOO ranking: {str(e)}"
            )
    
    @staticmethod
    async def get_simple_ranking(
        file: UploadFile,
        config: MooConfig
    ) -> List[MooRankingOnly]:
        """Get simplified ranking with only train ID, score, and rank"""
        try:
            # Process uploaded file
            df = await MooHandler.process_csv_file(file)
            
            # Initialize MOO service
            moo_service = MooService(config)
            
            # Rank trains using MOO algorithm
            ranked_df = moo_service.rank_trains(df)
            
            # Return simplified results
            simple_results = []
            for _, row in ranked_df.iterrows():
                simple_results.append(MooRankingOnly(
                    train_id=str(row["TrainID"]),
                    score=float(row["Score"]),
                    rank=int(row["Rank"])
                ))
            
            return simple_results
                
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Catch any other unexpected errors
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error during simplified ranking: {str(e)}"
            )