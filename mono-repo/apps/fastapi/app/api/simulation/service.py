import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any, Set
from app.api.simulation.models import SimulationConfig

class TrainSimulationService:
    """Service class for train fleet simulation logic"""
    
    def __init__(self, config: SimulationConfig):
        self.config = config
        self.simulation_start_date = datetime(2025, 9, 15).date()
        self.current_day = 0
        self.used_campaign_ids: Set[str] = set()
        self.campaign_counter = 1
        self.last_campaign_assignment_day = 0
        
        # Stabling bay tracking (15 bays, max 3 trains per bay)
        self.bay_occupancy = {i: [] for i in range(1, 16)}  # bay_id: [train_ids]
        
        # Cleaning bay tracking (3 cleaning bays)
        self.cleaning_bays = {"BAY_01": None, "BAY_02": None, "BAY_03": None}
        self.cleaning_queue = []  # Trains waiting for cleaning
        
        # Job card tracking for maintenance duration
        self.maintenance_schedule = {}  # train_id: {"type": "brakepad", "days_remaining": 1}
        
        # Fitness certificate tracking
        self.fitness_failures = {}  # train_id: {"rolling_stock": days_since_failure, etc.}
        
    def get_current_date(self) -> datetime:
        """Get current simulation date"""
        return (self.simulation_start_date + timedelta(days=self.current_day))
        
    def parse_date(self, date_str: str) -> datetime:
        """Parse date string in DD-MM-YYYY format"""
        if pd.isna(date_str) or date_str == "NULL":
            return self.get_current_date()
        try:
            return datetime.strptime(str(date_str), '%d-%m-%Y').date()
        except:
            try:
                return datetime.strptime(str(date_str), '%Y-%m-%d').date()
            except:
                return self.get_current_date()
    
    def format_date(self, date_obj: datetime) -> str:
        """Format date to DD-MM-YYYY string"""
        return date_obj.strftime('%d-%m-%Y')
    
    def initialize_tracking_from_data(self, df: pd.DataFrame):
        """Initialize tracking structures from CSV data"""
        # Extract existing campaign IDs
        for _, row in df.iterrows():
            campaign_id = row.get('BrandCampaignID')
            if pd.notna(campaign_id) and campaign_id != "NULL":
                self.used_campaign_ids.add(campaign_id)
                # Extract counter from campaign ID
                try:
                    parts = campaign_id.split('-')
                    if len(parts) >= 4:
                        counter = int(parts[-1])
                        self.campaign_counter = max(self.campaign_counter, counter + 1)
                except:
                    pass
        
        # Initialize maintenance schedule from open job cards
        for _, row in df.iterrows():
            train_id = row['TrainID']
            if int(row['OpenJobCards']) > 0:
                # Initialize with general maintenance
                self.maintenance_schedule[train_id] = {"type": "general", "days_remaining": 1}
        
        # Initialize fitness failure tracking
        for _, row in df.iterrows():
            train_id = row['TrainID']
            failures = {}
            if not row.get('RollingStockFitnessStatus', True):
                failures['rolling_stock'] = 0
            if not row.get('SignallingFitnessStatus', True):
                failures['signalling'] = 0
            if not row.get('TelecomFitnessStatus', True):
                failures['telecom'] = 0
            if failures:
                self.fitness_failures[train_id] = failures
    
    
    # FITNESS CERTIFICATE MANAGEMENT
    def simulate_fitness_certificates(self, row: pd.Series) -> Dict[str, Any]:
        """Simulate fitness certificates according to specifications"""
        train_id = row['TrainID']
        current_date = self.get_current_date()
        
        results = {
            'RollingStockFitnessStatus': row.get('RollingStockFitnessStatus', True),
            'SignallingFitnessStatus': row.get('SignallingFitnessStatus', True),
            'TelecomFitnessStatus': row.get('TelecomFitnessStatus', True),
            'RollingStockFitnessExpiryDate': row.get('RollingStockFitnessExpiryDate'),
            'SignallingFitnessExpiryDate': row.get('SignallingFitnessExpiryDate'),
            'TelecomFitnessExpiryDate': row.get('TelecomFitnessExpiryDate')
        }
        
        # Check expiry dates and set FALSE if expired
        if self.parse_date(results['RollingStockFitnessExpiryDate']) < current_date:
            results['RollingStockFitnessStatus'] = False
        if self.parse_date(results['SignallingFitnessExpiryDate']) < current_date:
            results['SignallingFitnessStatus'] = False
        if self.parse_date(results['TelecomFitnessExpiryDate']) < current_date:
            results['TelecomFitnessStatus'] = False
        
        # Track fitness failures and renewals
        if train_id not in self.fitness_failures:
            self.fitness_failures[train_id] = {}
        
        # Rolling Stock Fitness
        if not results['RollingStockFitnessStatus']:
            if 'rolling_stock' not in self.fitness_failures[train_id]:
                self.fitness_failures[train_id]['rolling_stock'] = 0
            else:
                self.fitness_failures[train_id]['rolling_stock'] += 1
                
            # Renew after 4 days
            if self.fitness_failures[train_id]['rolling_stock'] >= 4:
                results['RollingStockFitnessStatus'] = True
                results['RollingStockFitnessExpiryDate'] = self.format_date(
                    current_date + timedelta(days=730)  # 2 years
                )
                del self.fitness_failures[train_id]['rolling_stock']
        
        # Signalling Fitness
        if not results['SignallingFitnessStatus']:
            if 'signalling' not in self.fitness_failures[train_id]:
                self.fitness_failures[train_id]['signalling'] = 0
            else:
                self.fitness_failures[train_id]['signalling'] += 1
                
            # Renew after 5 days
            if self.fitness_failures[train_id]['signalling'] >= 5:
                results['SignallingFitnessStatus'] = True
                results['SignallingFitnessExpiryDate'] = self.format_date(
                    current_date + timedelta(days=1825)  # 5 years
                )
                del self.fitness_failures[train_id]['signalling']
        
        # Telecom Fitness
        if not results['TelecomFitnessStatus']:
            if 'telecom' not in self.fitness_failures[train_id]:
                self.fitness_failures[train_id]['telecom'] = 0
            else:
                self.fitness_failures[train_id]['telecom'] += 1
                
            # Renew after 5 days
            if self.fitness_failures[train_id]['telecom'] >= 5:
                results['TelecomFitnessStatus'] = True
                results['TelecomFitnessExpiryDate'] = self.format_date(
                    current_date + timedelta(days=1460)  # 4 years
                )
                del self.fitness_failures[train_id]['telecom']
        
        return results
    
    
    # JOB CARD MANAGEMENT
    def simulate_job_cards(self, row: pd.Series, fitness_results: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate job card management according to specifications"""
        train_id = row['TrainID']
        open_jobs = int(row.get('OpenJobCards', 0))
        closed_jobs = int(row.get('ClosedJobCards', 0))
        last_update = row.get('LastJobCardUpdate')
        
        # STEP 1: Add new job cards from various sources
        new_jobs = 0
        
        # 1. Fitness certificate failures (one job card for each FALSE status)
        if not fitness_results['RollingStockFitnessStatus']:
            new_jobs += 1
        if not fitness_results['SignallingFitnessStatus']:
            new_jobs += 1
        if not fitness_results['TelecomFitnessStatus']:
            new_jobs += 1
        
        # 2. Brakepad wear > 80% → add a job card for replacement
        if float(row.get('BrakepadWear%', 0)) > 80:
            new_jobs += 1
            # Schedule brakepad maintenance (1 day)
            self.maintenance_schedule[train_id] = {"type": "brakepad", "days_remaining": 1}
        
        # 3. HVAC wear > 90% → add a job card for repair
        if float(row.get('HVACWear%', 0)) > 90:
            new_jobs += 1
            # Schedule HVAC maintenance (3 days)
            self.maintenance_schedule[train_id] = {"type": "hvac", "days_remaining": 3}
        
        # 4. Mileage since last service exceeds 10,000 km → one job card
        if int(row.get('MileageSinceLastServiceKM', 0)) >= 10000:
            new_jobs += 1
            # Schedule service maintenance (2 days)
            self.maintenance_schedule[train_id] = {"type": "service", "days_remaining": 2}
        
        # 5. Cleaning required is True → one job card
        if row.get('CleaningRequired', False):
            new_jobs += 1
        
        # Add new job cards to open jobs
        open_jobs += new_jobs
        
        # STEP 2: Process job completion (reduce by 1 each day until it reaches 0)
        jobs_completed = 0
        if open_jobs > 0:
            jobs_completed = 1  # Reduce by 1 each day
            open_jobs = max(0, open_jobs - 1)
            
        # STEP 3: Increase ClosedJobCards by the same amount reduced from OpenJobCards
        closed_jobs += jobs_completed
        
        # STEP 4: Update JobCardStatus
        # If OpenJobCards > 0 → Status = "open"
        # If OpenJobCards = 0 → Status = "close"
        job_card_status = 'open' if open_jobs > 0 else 'close'
        
        # STEP 5: Update LastJobCardUpdate after OpenJobCards becomes 0
        if open_jobs == 0 and jobs_completed > 0:
            last_update = self.format_date(self.get_current_date())
        
        return {
            'OpenJobCards': open_jobs,
            'ClosedJobCards': closed_jobs,
            'JobCardStatus': job_card_status,
            'LastJobCardUpdate': last_update
        }
    
    
    # BRANDING CAMPAIGN MANAGEMENT
    def simulate_branding_campaign(self, row: pd.Series, operational_status: str) -> Dict[str, Any]:
        """Simulate branding campaign according to specifications"""
        train_id = row['TrainID']
        branding_active = row.get('BrandingActive', False)
        campaign_id = row.get('BrandCampaignID', 'NULL')
        exposure_hours = int(row.get('ExposureHoursAccrued', 0))
        target_hours = int(row.get('ExposureHoursTarget', 0))
        daily_quota = int(row.get('ExposureDailyQuota', 0))
        
        # Convert boolean strings to actual booleans
        if isinstance(branding_active, str):
            branding_active = branding_active.upper() == 'TRUE'
        
        if branding_active and campaign_id != 'NULL':
            # Active campaign
            if operational_status == "In_Service":
                # Add daily exposure hours (16-hour operation)
                exposure_hours += daily_quota
            
            # Check if campaign is complete
            if exposure_hours >= target_hours:
                # Campaign finished - reset all values
                branding_active = False
                campaign_id = 'NULL'
                exposure_hours = 0
                target_hours = 0
                daily_quota = 0
        else:
            # No active campaign - check if new campaign should start
            # Campaign starts every 45 days randomly
            if (self.current_day - self.last_campaign_assignment_day) >= 45:
                if random.random() < 0.1:  # 10% chance per train
                    # Start new campaign
                    branding_active = True
                    campaign_id = self.generate_unique_campaign_id()
                    exposure_hours = 0
                    target_hours = random.choice([280, 300, 320, 340])
                    daily_quota = random.choice([14, 15, 16])
                    self.last_campaign_assignment_day = self.current_day
        
        return {
            'BrandingActive': branding_active,
            'BrandCampaignID': campaign_id,
            'ExposureHoursAccrued': exposure_hours,
            'ExposureHoursTarget': target_hours,
            'ExposureDailyQuota': daily_quota
        }
    
    def generate_unique_campaign_id(self) -> str:
        """Generate unique campaign ID"""
        while True:
            campaign_id = f"KMM-RLJ-WRP-25-{self.campaign_counter:02d}"
            if campaign_id not in self.used_campaign_ids:
                self.used_campaign_ids.add(campaign_id)
                self.campaign_counter += 1
                return campaign_id
            self.campaign_counter += 1
    
    
    # MILEAGE MANAGEMENT
    def simulate_mileage(self, row: pd.Series, operational_status: str) -> Dict[str, Any]:
        """Simulate mileage according to specifications"""
        train_id = row['TrainID']
        total_mileage = int(row.get('TotalMileageKM', 0))
        mileage_since_service = int(row.get('MileageSinceLastServiceKM', 0))
        
        # Increment daily by 436.96 km
        daily_increment = 436.96
        total_mileage += daily_increment
        mileage_since_service += daily_increment
        
        # Check if service is needed (10,000 km threshold)
        if mileage_since_service >= 10000:
            # Service will be completed after maintenance
            if train_id in self.maintenance_schedule:
                if (self.maintenance_schedule[train_id].get('type') == 'service' and 
                    self.maintenance_schedule[train_id].get('days_remaining', 0) <= 0):
                    # Service completed - reset mileage
                    mileage_since_service = 0
                    del self.maintenance_schedule[train_id]
        
        # Calculate balance variance
        mileage_balance = 10000 - mileage_since_service
        
        return {
            'TotalMileageKM': int(total_mileage),
            'MileageSinceLastServiceKM': int(mileage_since_service),
            'MileageBalanceVariance': int(mileage_balance)
        }
    
    
    # BRAKEPAD AND HVAC WEAR MANAGEMENT
    def simulate_wear_and_maintenance(self, row: pd.Series) -> Dict[str, Any]:
        """Simulate brakepad and HVAC wear according to specifications"""
        train_id = row['TrainID']
        brakepad_wear = float(row.get('BrakepadWear%', 0))
        hvac_wear = float(row.get('HVACWear%', 0))
        
        # Process maintenance schedule
        if train_id in self.maintenance_schedule:
            maintenance = self.maintenance_schedule[train_id]
            maintenance['days_remaining'] -= 1
            
            if maintenance['days_remaining'] <= 0:
                # Maintenance completed
                if maintenance['type'] == 'brakepad':
                    brakepad_wear = 0  # Reset wear
                elif maintenance['type'] == 'hvac':
                    hvac_wear = 0  # Reset wear
                # Service maintenance handled in mileage function
                
                if maintenance['days_remaining'] <= 0:
                    del self.maintenance_schedule[train_id]
        
        # Increase wear daily
        brakepad_wear += 0.27  # 0.27% per day
        hvac_wear += 0.16      # 0.16% per day
        
        # Cap at 100%
        brakepad_wear = min(100, brakepad_wear)
        hvac_wear = min(100, hvac_wear)
        
        return {
            'BrakepadWear%': round(brakepad_wear, 2),
            'HVACWear%': round(hvac_wear, 2)
        }
    
    
    # CLEANING MANAGEMENT
    def simulate_cleaning(self, row: pd.Series) -> Dict[str, Any]:
        """Simulate cleaning process according to specifications"""
        train_id = row['TrainID']
        last_cleaned = self.parse_date(row.get('LastCleanedDate'))
        current_date = self.get_current_date()
        
        cleaning_required = False
        cleaning_slot_status = row.get('CleaningSlotStatus', 'free')
        bay_occupancy = row.get('BayOccupancyIDC', 'NULL')
        
        # Check if cleaning is required (after 3 trains are done)
        days_since_cleaning = (current_date - last_cleaned).days
        if days_since_cleaning > 7:  # Check based on last cleaned date
            cleaning_required = True
        
        # Process current cleaning status
        if cleaning_slot_status == 'in_progress':
            # Cleaning takes 1 day, so complete it
            cleaning_required = False
            cleaning_slot_status = 'free'
            bay_occupancy = 'NULL'
            last_cleaned = self.format_date(current_date)
            
            # Remove from cleaning bays
            for bay, occupant in self.cleaning_bays.items():
                if occupant == train_id:
                    self.cleaning_bays[bay] = None
                    break
        
        elif cleaning_required:
            # Check for available cleaning bay
            available_bay = None
            for bay, occupant in self.cleaning_bays.items():
                if occupant is None:
                    available_bay = bay
                    break
            
            if available_bay:
                # Start cleaning
                cleaning_slot_status = 'in_progress'
                bay_occupancy = available_bay
                self.cleaning_bays[available_bay] = train_id
            else:
                # Queue for cleaning
                cleaning_slot_status = 'booked'
                if train_id not in self.cleaning_queue:
                    self.cleaning_queue.append(train_id)
                
                # Assign to highest available bay (4-10)
                bay_occupancy = f"BAY_{random.randint(4, 10):02d}"
        
        # Process cleaning queue
        if cleaning_slot_status == 'booked':
            # Check if can move to in_progress
            available_bay = None
            for bay, occupant in self.cleaning_bays.items():
                if occupant is None:
                    available_bay = bay
                    break
            
            if available_bay and train_id in self.cleaning_queue:
                # Move oldest booked train to in_progress
                if self.cleaning_queue[0] == train_id:
                    cleaning_slot_status = 'in_progress'
                    bay_occupancy = available_bay
                    self.cleaning_bays[available_bay] = train_id
                    self.cleaning_queue.remove(train_id)
        
        return {
            'CleaningRequired': cleaning_required,
            'CleaningSlotStatus': cleaning_slot_status,
            'BayOccupancyIDC': bay_occupancy,
            'LastCleanedDate': row.get('LastCleanedDate') if cleaning_slot_status != 'free' else last_cleaned
        }
    
    
    # STABLING GEOMETRY MANAGEMENT
    def simulate_stabling(self, row: pd.Series, total_trains: int) -> Dict[str, Any]:
        """Simulate stabling geometry according to specifications"""
        train_id = row['TrainID']
        
        # Ensure train is assigned to a bay
        current_bay = int(row.get('BayPositionID', 1))
        current_sequence = int(row.get('StablingSequenceOrder', 1))
        
        # Randomize bay position (1-15 bays)
        bay_position = random.randint(1, 15)
        
        # Ensure max 3 trains per bay by managing sequence order
        stabling_sequence = random.randint(1, 3)  # Max 3 trains per bay
        
        # Calculate shunting moves
        shunting_moves = max(0, stabling_sequence - 1)
        
        return {
            'BayPositionID': bay_position,
            'StablingSequenceOrder': stabling_sequence,
            'ShuntingMovesRequired': shunting_moves
        }
    
    # OPERATIONAL STATUS DETERMINATION
    def determine_operational_status(self, row: pd.Series, fitness_results: Dict, job_results: Dict, wear_results: Dict) -> str:
        """Determine operational status based on priority rules"""
        train_id = row['TrainID']
        
        # Priority 1: If one of the fitness certificates is FALSE -> Standby
        if (not fitness_results['RollingStockFitnessStatus'] or 
            not fitness_results['SignallingFitnessStatus'] or 
            not fitness_results['TelecomFitnessStatus']):
            return "Standby"
        
        # Priority 2: If cleaning is in_progress -> Under_Maintenance
        if row.get('CleaningSlotStatus') == 'in_progress':
            return "Under_Maintenance"
        
        # Priority 3: Check maintenance schedule
        if train_id in self.maintenance_schedule:
            maintenance = self.maintenance_schedule[train_id]
            if maintenance['type'] == 'brakepad':
                return "Under_Maintenance"  # 1 day for brakepad
            elif maintenance['type'] == 'hvac':
                return "Under_Maintenance"  # 3 days for HVAC
            elif maintenance['type'] == 'service':
                return "Under_Maintenance"  # 2 days for service
        
        # Priority 4: If brakepad wear >= 80% -> Standby for 1 day then Under_Maintenance
        if wear_results['BrakepadWear%'] >= 80:
            return "Under_Maintenance"
        
        # Priority 5: If HVAC >= 90% -> Standby for 3 days then Under_Maintenance
        if wear_results['HVACWear%'] >= 90:
            return "Under_Maintenance"
        
        # Default
        return "In_Service"
    
    def simulate_single_day(self, df: pd.DataFrame) -> pd.DataFrame:
        """Simulate one day for all trains according to specifications"""
        current_date = self.get_current_date()
        simulated_data = []
        
        for _, row in df.iterrows():
            train_id = row['TrainID']
            
            # Convert boolean strings to actual booleans for processing
            for bool_col in ['RollingStockFitnessStatus', 'SignallingFitnessStatus', 
                           'TelecomFitnessStatus', 'BrandingActive', 'CleaningRequired']:
                if bool_col in row and isinstance(row[bool_col], str):
                    row[bool_col] = row[bool_col].upper() == 'TRUE'
            
            # Update CURRENT_DATE
            row['CURRENT_DATE'] = self.format_date(current_date)
            
            # 1. Simulate fitness certificates
            fitness_results = self.simulate_fitness_certificates(row)
            
            # 2. Simulate job cards
            job_results = self.simulate_job_cards(row, fitness_results)
            
            # 3. Simulate mileage
            mileage_results = self.simulate_mileage(row, row.get('OperationalStatus', 'In_Service'))
            
            # 4. Simulate brakepad and HVAC wear
            wear_results = self.simulate_wear_and_maintenance(row)
            
            # 5. Determine operational status
            operational_status = self.determine_operational_status(row, fitness_results, job_results, wear_results)
            
            # 6. Simulate branding campaign
            branding_results = self.simulate_branding_campaign(row, operational_status)
            
            # 7. Simulate cleaning
            cleaning_results = self.simulate_cleaning(row)
            
            # 8. Simulate stabling geometry
            stabling_results = self.simulate_stabling(row, len(df))
            
            # Update row with all results
            row.update(fitness_results)
            row.update(job_results)
            row.update(mileage_results)
            row.update(wear_results)
            row.update(branding_results)
            row.update(cleaning_results)
            row.update(stabling_results)
            row['OperationalStatus'] = operational_status
            
            simulated_data.append(row.to_dict())
        
        return pd.DataFrame(simulated_data)
    
    
    def simulate_multiple_days(self, df: pd.DataFrame, days: int) -> List[Tuple[int, pd.DataFrame]]:
        """Simulate multiple days and return list of (day_number, dataframe) tuples"""
        # Initialize tracking from the input data
        self.initialize_tracking_from_data(df)
        
        current_df = df.copy()
        results = []
        
        for day in range(days):
            self.current_day = day
            current_df = self.simulate_single_day(current_df)
            results.append((day + 1, current_df.copy()))
        
        return results