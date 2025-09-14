import io
import zipfile
import pandas as pd
from typing import Union, BinaryIO
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.api.simulation.models import SimulationConfig
from app.api.simulation.service import TrainSimulationService

class SimulationHandler:
    """Handler class for simulation API operations"""
    
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
    def convert_boolean_columns_for_output(df: pd.DataFrame) -> pd.DataFrame:
        """Convert boolean columns back to string format for CSV output"""
        df_copy = df.copy()
        boolean_columns = [
            'RollingStockFitnessStatus', 
            'SignallingFitnessStatus', 
            'TelecomFitnessStatus', 
            'BrandingActive', 
            'CleaningRequired'
        ]
        
        for col in boolean_columns:
            if col in df_copy.columns:
                df_copy[col] = df_copy[col].map({True: 'TRUE', False: 'FALSE'})
        
        return df_copy
    
    @staticmethod
    def create_csv_response(df: pd.DataFrame, filename: str) -> StreamingResponse:
        """Create CSV response for single day simulation"""
        # Convert boolean columns
        processed_df = SimulationHandler.convert_boolean_columns_for_output(df)
        
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
    def create_zip_response(daily_results: list, days: int) -> StreamingResponse:
        """Create ZIP response for multiple day simulation"""
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for day_num, simulated_df in daily_results:
                # Convert boolean columns
                processed_df = SimulationHandler.convert_boolean_columns_for_output(simulated_df)
                
                # Create CSV for this day
                csv_buffer = io.StringIO()
                processed_df.to_csv(csv_buffer, index=False)
                csv_content = csv_buffer.getvalue()
                
                # Add to ZIP file
                zip_file.writestr(f'day-{day_num}.csv', csv_content)
        
        zip_buffer.seek(0)
        
        # Return ZIP file
        return StreamingResponse(
            io.BytesIO(zip_buffer.getvalue()),
            media_type='application/zip',
            headers={'Content-Disposition': f'attachment; filename=simulation_{days}days.zip'}
        )
    
    @staticmethod
    async def simulate_train_fleet(
        file: UploadFile,
        config: SimulationConfig
    ) -> StreamingResponse:
        """Main simulation handler method"""
        try:
            # Process uploaded file
            df = await SimulationHandler.process_csv_file(file)
            
            # Initialize simulation service
            simulator = TrainSimulationService(config)
            
            # Run simulation
            if config.days_to_simulate == 1:
                # Single day simulation
                daily_results = simulator.simulate_multiple_days(df, 1)
                day_num, simulated_df = daily_results[0]
                
                return SimulationHandler.create_csv_response(
                    simulated_df, 
                    f'day-{day_num}.csv'
                )
            else:
                # Multiple days simulation
                daily_results = simulator.simulate_multiple_days(df, config.days_to_simulate)
                
                return SimulationHandler.create_zip_response(
                    daily_results, 
                    config.days_to_simulate
                )
                
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Catch any other unexpected errors
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error during simulation: {str(e)}"
            )