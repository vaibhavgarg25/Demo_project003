import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any
from app.api.simulation.models import SimulationConfig

class TrainSimulationService:
    """Service class for train fleet simulation logic"""
    
    def __init__(self, config: SimulationConfig):
        self.config = config
        self.today = datetime.now().date()
        
    def parse_date(self, date_str: str) -> datetime:
        """Parse date string in DD-MM-YYYY format"""
        try:
            return datetime.strptime(str(date_str), '%d-%m-%Y').date()
        except:
            try:
                return datetime.strptime(str(date_str), '%Y-%m-%d').date()
            except:
                return self.today
    
    def format_date(self, date_obj: datetime) -> str:
        """Format date to DD-MM-YYYY string"""
        return date_obj.strftime('%d-%m-%Y')
    
    def simulate_rolling_stock_fitness(self, row: pd.Series) -> str:
        """Simulate RollingStockFitnessStatus based on fitness_expiry_date"""
        expiry_date = self.parse_date(row['fitness_expiry_date'])
        last_check = self.parse_date(row['last_fitness_check_date'])
        
        if self.today > expiry_date:
            return "Expired"
        elif (self.today - last_check).days > self.config.fitness_check_threshold_days:
            return "Due"
        else:
            return "Fit"
    
    def simulate_signalling_fitness(self, current_status: str) -> str:
        """Simulate SignallingFitnessStatus with random degradation"""
        if current_status == "Issue Reported":
            # 30% chance to fix per day
            return "OK" if random.random() < 0.3 else "Issue Reported"
        else:
            # Small chance of failure
            return "Issue Reported" if random.random() < self.config.signalling_failure_chance else "OK"
    
    def simulate_telecom_fitness(self, current_status: str, job_card_status: str) -> str:
        """Simulate TelecomFitnessStatus with random failures"""
        if job_card_status == "close" and current_status == "Issue Reported":
            return "OK"  # Reset when job card closed
        
        if current_status == "Issue Reported":
            return "Issue Reported" if random.random() > 0.25 else "OK"
        else:
            return "Issue Reported" if random.random() < self.config.telecom_failure_chance else "OK"
    
    def update_fitness_expiry(self, current_expiry: str, rolling_stock_status: str) -> str:
        """Update fitness expiry date if inspection done"""
        current_date = self.parse_date(current_expiry)
        if rolling_stock_status == "Fit":
            # Extend expiry by 180 days if recently checked
            return self.format_date(current_date + timedelta(days=180))
        return current_expiry
    
    def calculate_job_card_status(self, open_jobs: int) -> str:
        """Calculate JobCardStatus based on open job cards"""
        return "open" if open_jobs > 0 else "close"
    
    def simulate_open_job_cards(self, row: pd.Series) -> Tuple[int, int]:
        """Simulate open job cards based on various failure conditions"""
        open_jobs = int(row['OpenJobCards'])
        
        # Add jobs for failures
        if row['SignallingFitnessStatus'] == "Issue Reported":
            open_jobs += 1
        if row['TelecomFitnessStatus'] == "Issue Reported":
            open_jobs += 1
        if row['CleaningRequired'] == True:
            open_jobs += 1
        if float(row['BrakepadWear%']) > 85:
            open_jobs += 1
        if float(row['HVACWear%']) > 90:
            open_jobs += 1
            
        # Random job completion (20% chance per day per job)
        jobs_completed = sum(1 for _ in range(open_jobs) if random.random() < 0.2)
        open_jobs = max(0, open_jobs - jobs_completed)
        
        return open_jobs, jobs_completed
    
    def determine_operational_status(self, row: pd.Series) -> str:
        """Determine operational status based on priority rules"""
        # Priority 1: Fitness Failures
        if (row['RollingStockFitnessStatus'] in ["Expired", "Failed"] or
            row['SignallingFitnessStatus'] in ["Expired", "Failed"] or
            row['TelecomFitnessStatus'] in ["Expired", "Failed"]):
            return "Out_of_Service"
        
        # Priority 2: Job Cards
        if row['OpenJobCards'] > 0 and row['JobCardStatus'] == "open":
            return "Under_Maintenance"
        
        # Priority 3: Cleaning
        if row['CleaningRequired'] and row['CleaningSlotStatus'] in ["booked", "in_progress"]:
            return "Standby"
        
        # Priority 4: Stabling
        if row['ShuntingMovesRequired'] > 0:
            return "Stabled"
        
        # Default
        return "In_Service"
    
    def simulate_cleaning_required(self, row: pd.Series) -> bool:
        """Simulate cleaning requirement"""
        last_cleaned = self.parse_date(row['LastCleanedDate'])
        days_since_cleaning = (self.today - last_cleaned).days
        
        if days_since_cleaning > self.config.cleaning_threshold_days:
            return True
        else:
            return random.random() < self.config.dirt_accumulation_chance
    
    def simulate_cleaning_slot_status(self, cleaning_required: bool, current_status: str) -> str:
        """Simulate cleaning slot status"""
        if cleaning_required:
            if current_status == "free":
                return random.choice(["booked", "in_progress"])
            return current_status
        else:
            return "free"
    
    def simulate_bay_occupancy(self, cleaning_slot_status: str, current_bay: str) -> str:
        """Simulate bay occupancy"""
        if cleaning_slot_status in ["booked", "in_progress"]:
            if current_bay == "NULL" or pd.isna(current_bay):
                return f"BAY_{random.randint(1, 10):02d}"
            return current_bay
        else:
            return "NULL"
    
    def simulate_bay_position(self, shunting_moves: int, current_position: int) -> int:
        """Simulate bay position changes"""
        if shunting_moves > 0:
            return random.randint(1, 20)  # Random new position
        return current_position
    
    def update_stabling_sequence(self, current_order: int, total_trains: int) -> int:
        """Update stabling sequence order"""
        return random.randint(1, min(total_trains, 50))
    
    def simulate_daily_mileage(self, operational_status: str) -> int:
        """Calculate daily mileage based on operational status"""
        if operational_status == "In_Service":
            return random.randint(self.config.daily_run_km_min, self.config.daily_run_km_max)
        elif operational_status in ["Under_Maintenance", "Standby"]:
            return random.randint(50, 150)  # Limited movement
        else:
            return 0  # No movement
    
    def update_mileage_metrics(self, row: pd.Series, daily_km: int) -> Tuple[int, int, int]:
        """Update all mileage-related metrics"""
        total_mileage = int(row['TotalMileageKM']) + daily_km
        mileage_since_service = int(row['MileageSinceLastServiceKM']) + daily_km
        
        # Reset mileage if service performed
        if mileage_since_service >= self.config.service_interval_km:
            mileage_since_service = 0
        
        mileage_balance = self.config.service_interval_km - mileage_since_service
        
        return total_mileage, mileage_since_service, mileage_balance
    
    def calculate_brakepad_wear(self, mileage_since_service: int) -> float:
        """Calculate brakepad wear percentage"""
        wear_percent = (mileage_since_service / self.config.brakepad_lifespan_km) * 100
        return min(100, wear_percent)
    
    def calculate_hvac_wear(self, current_wear: float, operational_status: str) -> float:
        """Calculate HVAC wear percentage"""
        if operational_status == "In_Service":
            daily_hours = random.randint(8, 12)
        elif operational_status in ["Under_Maintenance", "Standby"]:
            daily_hours = random.randint(2, 6)
        else:
            daily_hours = 0
        
        additional_wear = (daily_hours / self.config.hvac_lifespan_hours) * 100
        return min(100, current_wear + additional_wear)
    
    def simulate_branding_campaign(self, row: pd.Series) -> Tuple[bool, str, int, int, int]:
        """Simulate branding campaign status"""
        campaign_id = row['BrandCampaignID']
        if pd.isna(campaign_id) or campaign_id == "NULL":
            # 10% chance to start new campaign
            if random.random() < 0.1:
                new_campaign = f"KMM-RLJ-WRP-{random.randint(25, 26)}-{random.randint(1, 12):02d}"
                return True, new_campaign, 0, 320, 16  # Reset exposure metrics
            return False, "NULL", 0, 0, 0
        else:
            # Continue existing campaign
            exposure_hours = int(row['ExposureHoursAccrued'])
            target_hours = int(row['ExposureHoursTarget'])
            
            if exposure_hours >= target_hours:
                # Campaign complete, 50% chance to end
                if random.random() < 0.5:
                    return False, "NULL", 0, 0, 0
            
            # Add daily exposure hours
            daily_quota = int(row['ExposureDailyQuota'])
            if row['OperationalStatus'] == "In_Service":
                daily_exposure = random.randint(8, daily_quota)
            else:
                daily_exposure = 0
            
            new_exposure = min(target_hours, exposure_hours + daily_exposure)
            return True, campaign_id, new_exposure, target_hours, daily_quota
    
    def simulate_shunting_moves(self, stabling_order: int) -> int:
        """Calculate shunting moves required"""
        return max(0, int(stabling_order) - 1)
    
    def assign_cleaning_crew(self, cleaning_required: bool) -> str:
        """Assign cleaning crew if cleaning required"""
        if cleaning_required:
            crews = ["CREW_A", "CREW_B", "CREW_C", "CREW_D"]
            return random.choice(crews)
        return "NONE"
    
    def update_last_fitness_check_date(self, fitness_status: str, current_date: str) -> str:
        """Update last fitness check date if check performed"""
        if fitness_status == "Fit":
            return self.format_date(self.today)
        return current_date
    
    def simulate_single_day(self, df: pd.DataFrame) -> pd.DataFrame:
        """Simulate one day for all trains"""
        simulated_data = []
        
        for _, row in df.iterrows():
            # Convert boolean strings to actual booleans
            boolean_columns = ['RollingStockFitnessStatus', 'SignallingFitnessStatus', 
                             'TelecomFitnessStatus', 'BrandingActive', 'CleaningRequired']
            
            for bool_col in boolean_columns:
                if bool_col in row and isinstance(row[bool_col], str):
                    row[bool_col] = row[bool_col].upper() == 'TRUE'
            
            # Simulate fitness statuses
            rolling_stock_fitness = self.simulate_rolling_stock_fitness(row)
            signalling_fitness = self.simulate_signalling_fitness(
                "OK" if row.get('SignallingFitnessStatus', False) else "Issue Reported"
            )
            telecom_fitness = self.simulate_telecom_fitness(
                "OK" if row.get('TelecomFitnessStatus', False) else "Issue Reported",
                row.get('JobCardStatus', 'close')
            )
            
            # Convert fitness status to boolean
            row['RollingStockFitnessStatus'] = rolling_stock_fitness == "OK"
            row['SignallingFitnessStatus'] = signalling_fitness == "OK"
            row['TelecomFitnessStatus'] = telecom_fitness == "OK"
            
            # Simulate job cards
            open_jobs, jobs_completed = self.simulate_open_job_cards(row)
            row['OpenJobCards'] = open_jobs
            row['ClosedJobCards'] = int(row.get('ClosedJobCards', 0)) + jobs_completed
            row['JobCardStatus'] = self.calculate_job_card_status(open_jobs)
            
            # Simulate cleaning
            cleaning_required = self.simulate_cleaning_required(row)
            row['CleaningRequired'] = cleaning_required
            row['CleaningSlotStatus'] = self.simulate_cleaning_slot_status(
                cleaning_required, row.get('CleaningSlotStatus', 'free')
            )
            row['BayOccupancyIDC'] = self.simulate_bay_occupancy(
                row['CleaningSlotStatus'], row.get('BayOccupancyIDC', 'NULL')
            )
            
            # Update cleaning date if needed
            if row['CleaningSlotStatus'] == "in_progress" and random.random() < 0.3:
                row['LastCleanedDate'] = self.format_date(self.today)
                row['CleaningRequired'] = False
                row['CleaningSlotStatus'] = "free"
                row['BayOccupancyIDC'] = "NULL"
            
            # Calculate shunting moves and positions
            row['ShuntingMovesRequired'] = self.simulate_shunting_moves(
                row.get('StablingSequenceOrder', 1)
            )
            row['BayPositionID'] = self.simulate_bay_position(
                row['ShuntingMovesRequired'], 
                row.get('BayPositionID', 1)
            )
            row['StablingSequenceOrder'] = self.update_stabling_sequence(
                row.get('StablingSequenceOrder', 1), 
                len(df)
            )
            
            # Determine operational status
            row['OperationalStatus'] = self.determine_operational_status(row)
            
            # Calculate daily mileage and update mileage metrics
            daily_km = self.simulate_daily_mileage(row['OperationalStatus'])
            total_mileage, mileage_since_service, mileage_balance = self.update_mileage_metrics(row, daily_km)
            
            row['TotalMileageKM'] = total_mileage
            row['MileageSinceLastServiceKM'] = mileage_since_service
            row['MileageBalanceVariance'] = mileage_balance
            
            # Calculate wear percentages
            row['BrakepadWear%'] = round(self.calculate_brakepad_wear(mileage_since_service), 0)
            row['HVACWear%'] = round(self.calculate_hvac_wear(
                float(row.get('HVACWear%', 0)), row['OperationalStatus']
            ), 0)
            
            # Simulate branding campaign
            branding_active, campaign_id, exposure_hours, target_hours, daily_quota = self.simulate_branding_campaign(row)
            row['BrandingActive'] = branding_active
            row['BrandCampaignID'] = campaign_id if branding_active else "NULL"
            row['ExposureHoursAccrued'] = exposure_hours
            row['ExposureHoursTarget'] = target_hours
            row['ExposureDailyQuota'] = daily_quota
            
            # Cleaning crew assignment
            row['CleaningCrewAssigned'] = self.assign_cleaning_crew(row['CleaningRequired'])
            
            # Update dates if needed
            if jobs_completed > 0:
                row['LastJobCardUpdate'] = self.format_date(self.today)
            
            # Update fitness dates
            row['fitness_expiry_date'] = self.update_fitness_expiry(
                row.get('fitness_expiry_date', self.format_date(self.today)), 
                rolling_stock_fitness
            )
            row['last_fitness_check_date'] = self.update_last_fitness_check_date(
                rolling_stock_fitness, 
                row.get('last_fitness_check_date', self.format_date(self.today))
            )
            
            simulated_data.append(row.to_dict())
        
        return pd.DataFrame(simulated_data)
    
    def simulate_multiple_days(self, df: pd.DataFrame, days: int) -> List[Tuple[int, pd.DataFrame]]:
        """Simulate multiple days and return list of (day_number, dataframe) tuples"""
        current_df = df.copy()
        results = []
        
        for day in range(days):
            self.today = (datetime.now() + timedelta(days=day)).date()
            current_df = self.simulate_single_day(current_df)
            results.append((day + 1, current_df.copy()))
        
        return results