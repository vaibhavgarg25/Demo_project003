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
        
        # Cleaning system - Only 10 trains can be in cleaning at any time
        # 3 in_progress bays (BAY_01, BAY_02, BAY_03)
        # 7 booked bays (BAY_04 to BAY_10)
        self.cleaning_bays = {"BAY_01": None, "BAY_02": None, "BAY_03": None}  # in_progress bays
        self.booking_bays = {f"BAY_{i:02d}": None for i in range(4, 11)}  # booked bays (BAY_04 to BAY_10)
        self.cleaning_queue = []  # Not used - only 10 trains max in cleaning system
        
        # Job card tracking for maintenance duration
        self.maintenance_schedule = {}  # train_id: {"type": "brakepad", "days_remaining": 1}
        
        # Fitness certificate tracking
        self.fitness_failures = {}  # train_id: {"rolling_stock": days_since_failure, etc.}
        
    def get_current_date(self) -> datetime:
        """Get current simulation date"""
        return (self.simulation_start_date + timedelta(days=self.current_day + 1))  # +1 to start from next day
        
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
        
        # Initialize maintenance schedule from open job cards and wear conditions
        for _, row in df.iterrows():
            train_id = row['TrainID']
            if int(row['OpenJobCards']) > 0:
                # Check what type of maintenance is needed
                if float(row.get('BrakepadWear%', 0)) >= 80:
                    self.maintenance_schedule[train_id] = {"type": "brakepad", "days_remaining": 1}
                elif float(row.get('HVACWear%', 0)) >= 90:
                    self.maintenance_schedule[train_id] = {"type": "hvac", "days_remaining": 3}
                elif int(row.get('MileageSinceLastServiceKM', 0)) >= 10000:
                    self.maintenance_schedule[train_id] = {"type": "service", "days_remaining": 2}
                else:
                    self.maintenance_schedule[train_id] = {"type": "general", "days_remaining": 1}
        
        # Initialize fitness failure tracking
        for _, row in df.iterrows():
            train_id = row['TrainID']
            failures = {}
            
            # Convert string to boolean if needed
            rolling_status = row.get('RollingStockFitnessStatus', True)
            if isinstance(rolling_status, str):
                rolling_status = rolling_status.upper() == 'TRUE'
            
            signalling_status = row.get('SignallingFitnessStatus', True)
            if isinstance(signalling_status, str):
                signalling_status = signalling_status.upper() == 'TRUE'
                
            telecom_status = row.get('TelecomFitnessStatus', True)
            if isinstance(telecom_status, str):
                telecom_status = telecom_status.upper() == 'TRUE'
            
            if not rolling_status:
                failures['rolling_stock'] = 0
            if not signalling_status:
                failures['signalling'] = 0
            if not telecom_status:
                failures['telecom'] = 0
                
            if failures:
                self.fitness_failures[train_id] = failures
        
        # Initialize bay occupancy from current data - ONLY for trains already in cleaning
        for _, row in df.iterrows():
            train_id = row['TrainID']
            bay_id = row.get('BayOccupancyIDC')
            cleaning_status = row.get('CleaningSlotStatus', 'free')
            
            # Only initialize if train is actually in cleaning system
            if cleaning_status == 'in_progress' and bay_id in self.cleaning_bays:
                self.cleaning_bays[bay_id] = train_id
            elif cleaning_status == 'booked' and bay_id in self.booking_bays:
                self.booking_bays[bay_id] = train_id
    
    
    # FITNESS CERTIFICATE MANAGEMENT
    def simulate_fitness_certificates(self, row: pd.Series) -> Dict[str, Any]:
        """Simulate fitness certificates according to specifications"""
        train_id = row['TrainID']
        current_date = self.get_current_date()
        
        # Get current status (convert string to boolean if needed)
        rolling_status = row.get('RollingStockFitnessStatus', True)
        if isinstance(rolling_status, str):
            rolling_status = rolling_status.upper() == 'TRUE'
            
        signalling_status = row.get('SignallingFitnessStatus', True)
        if isinstance(signalling_status, str):
            signalling_status = signalling_status.upper() == 'TRUE'
            
        telecom_status = row.get('TelecomFitnessStatus', True)
        if isinstance(telecom_status, str):
            telecom_status = telecom_status.upper() == 'TRUE'
        
        results = {
            'RollingStockFitnessStatus': rolling_status,
            'SignallingFitnessStatus': signalling_status,
            'TelecomFitnessStatus': telecom_status,
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
        
        # Rolling Stock Fitness - Renewed after 4 days, valid for 2 years
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
        
        # Signalling Fitness - Renewed after 5 days, valid for 5 years
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
        
        # Telecom Fitness - Renewed after 5 days, valid for 4 years
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
        
        # STEP 1: Add new job cards from various sources (before reducing existing ones)
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
            if isinstance(row.get('CleaningRequired'), str):
                if row.get('CleaningRequired').upper() == 'TRUE':
                    new_jobs += 1
            elif row.get('CleaningRequired'):
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
            # Active campaign - only increment if train is In_Service
            if operational_status == "In_Service":
                # Add daily exposure hours based on quota (16-hour operation)
                exposure_hours += daily_quota
            # If not In_Service, no increment (train under maintenance/standby doesn't count)
            
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
            # Campaign starts every 45 days randomly to trains with BrandingActive = False
            if (self.current_day % 45 == 0) and (self.current_day > 0):  # Every 45 days
                if random.random() < 0.1:  # 10% chance per train per 45-day cycle
                    # Start new campaign
                    branding_active = True
                    campaign_id = self.generate_unique_campaign_id()
                    exposure_hours = 0
                    target_hours = random.choice([280, 300, 320, 340])  # Random target
                    daily_quota = random.choice([14, 15, 16])  # Random daily quota
        
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
        total_mileage = float(row.get('TotalMileageKM', 0))
        mileage_since_service = float(row.get('MileageSinceLastServiceKM', 0))
        
        # Increment daily by 436.96 km (exactly as specified)
        daily_increment = 436.96
        total_mileage += daily_increment
        mileage_since_service += daily_increment
        
        # Handle service completion - reset mileage when service maintenance is completed
        if train_id in self.maintenance_schedule:
            maintenance = self.maintenance_schedule[train_id]
            if (maintenance.get('type') == 'service' and 
                maintenance.get('days_remaining', 0) <= 0):
                # Service completed - reset mileage since last service
                mileage_since_service = 0
                del self.maintenance_schedule[train_id]
        
        # Calculate balance variance (10,000 - MileageSinceLastService)
        mileage_balance = 10000 - mileage_since_service
        
        return {
            'TotalMileageKM': int(total_mileage),  # Convert to int as in original data
            'MileageSinceLastServiceKM': int(mileage_since_service),
            'MileageBalanceVariance': int(mileage_balance)
        }
    
    
    # BRAKEPAD AND HVAC WEAR MANAGEMENT
    def simulate_wear_and_maintenance(self, row: pd.Series) -> Dict[str, Any]:
        """Simulate brakepad and HVAC wear according to specifications"""
        train_id = row['TrainID']
        brakepad_wear = float(row.get('BrakepadWear%', 0))
        hvac_wear = float(row.get('HVACWear%', 0))
        
        # Process maintenance schedule and decrement remaining days
        if train_id in self.maintenance_schedule:
            maintenance = self.maintenance_schedule[train_id]
            maintenance['days_remaining'] -= 1
            
            # Check if maintenance is completed
            if maintenance['days_remaining'] <= 0:
                # Maintenance completed - reset wear accordingly
                if maintenance['type'] == 'brakepad':
                    brakepad_wear = 0  # Reset brakepad wear to 0
                elif maintenance['type'] == 'hvac':
                    hvac_wear = 0  # Reset HVAC wear to 0
                # Note: Service maintenance doesn't reset wear, only mileage
                
                # Only remove from schedule if maintenance is actually complete
                if maintenance['days_remaining'] <= 0:
                    del self.maintenance_schedule[train_id]
        
        # Increase wear daily (only if not being reset by maintenance)
        if train_id not in self.maintenance_schedule or self.maintenance_schedule[train_id]['type'] not in ['brakepad', 'hvac']:
            brakepad_wear += 0.27  # Increase by 0.27% per day
            hvac_wear += 0.16      # Increase by 0.16% per day
        
        # Cap at 100%
        brakepad_wear = min(100, brakepad_wear)
        hvac_wear = min(100, hvac_wear)
        
        return {
            'BrakepadWear%': round(brakepad_wear, 2),
            'HVACWear%': round(hvac_wear, 2)
        }
    
    
    # CLEANING MANAGEMENT
    def simulate_cleaning(self, row: pd.Series) -> Dict[str, Any]:
        """Simulate cleaning process with EXACTLY 10-train limit (3 in_progress + 7 booked)"""
        train_id = row['TrainID']
        last_cleaned = self.parse_date(row.get('LastCleanedDate'))
        current_date = self.get_current_date()
        
        cleaning_required = row.get('CleaningRequired', False)
        if isinstance(cleaning_required, str):
            cleaning_required = cleaning_required.upper() == 'TRUE'
            
        cleaning_slot_status = row.get('CleaningSlotStatus', 'free')
        bay_occupancy = row.get('BayOccupancyIDC', 'NULL')
        
        # STEP 1: Process trains currently in_progress (complete cleaning after 1 day)
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
        
        # STEP 2: Process trains currently booked (may move to in_progress)
        elif cleaning_slot_status == 'booked':
            # Check if can move to in_progress (if there's an available cleaning bay)
            available_cleaning_bay = None
            for bay, occupant in self.cleaning_bays.items():
                if occupant is None:
                    available_cleaning_bay = bay
                    break
            
            if available_cleaning_bay:
                # Move to in_progress
                cleaning_slot_status = 'in_progress'
                bay_occupancy = available_cleaning_bay
                self.cleaning_bays[available_cleaning_bay] = train_id
                
                # Remove from booking bay
                for bay, occupant in self.booking_bays.items():
                    if occupant == train_id:
                        self.booking_bays[bay] = None
                        break
        
        # STEP 3: Handle new cleaning requirements - BUT ENFORCE EXACT 10-TRAIN LIMIT
        elif cleaning_slot_status == 'free':
            # Check if this train actually needs cleaning (after 7 days)
            days_since_cleaning = (current_date - last_cleaned).days
            train_needs_cleaning = days_since_cleaning > 7
            
            # Count current trains in cleaning system
            total_in_cleaning = sum(1 for occupant in self.cleaning_bays.values() if occupant is not None)
            total_booked = sum(1 for occupant in self.booking_bays.values() if occupant is not None)
            total_in_system = total_in_cleaning + total_booked
            
            # STRICT ENFORCEMENT: Only allow EXACTLY 10 trains in cleaning system
            if train_needs_cleaning and total_in_system < 10:
                # First try to assign to in_progress bay
                available_cleaning_bay = None
                for bay, occupant in self.cleaning_bays.items():
                    if occupant is None:
                        available_cleaning_bay = bay
                        break
                
                if available_cleaning_bay:
                    # Start cleaning immediately
                    cleaning_required = True
                    cleaning_slot_status = 'in_progress'
                    bay_occupancy = available_cleaning_bay
                    self.cleaning_bays[available_cleaning_bay] = train_id
                else:
                    # Try to assign to booking bay
                    available_booking_bay = None
                    for bay, occupant in self.booking_bays.items():
                        if occupant is None:
                            available_booking_bay = bay
                            break
                    
                    if available_booking_bay:
                        # Book for cleaning
                        cleaning_required = True
                        cleaning_slot_status = 'booked'
                        bay_occupancy = available_booking_bay
                        self.booking_bays[available_booking_bay] = train_id
            else:
                # Either train doesn't need cleaning OR system is at capacity
                # Force CleaningRequired = False for trains not in the cleaning system
                cleaning_required = False
                cleaning_slot_status = 'free'
                bay_occupancy = 'NULL'
        
        return {
            'CleaningRequired': cleaning_required,
            'CleaningSlotStatus': cleaning_slot_status,
            'BayOccupancyIDC': bay_occupancy,
            'LastCleanedDate': last_cleaned if cleaning_slot_status in ['booked', 'in_progress'] else self.format_date(current_date) if cleaning_slot_status == 'free' and not cleaning_required else row.get('LastCleanedDate')
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
    def determine_operational_status(self, row: pd.Series, fitness_results: Dict, job_results: Dict, wear_results: Dict, cleaning_results: Dict) -> str:
        """Determine operational status based on priority rules"""
        train_id = row['TrainID']
        
        # Priority 1: If one of the fitness certificates is FALSE → Standby
        # This takes precedence over everything else
        if (not fitness_results['RollingStockFitnessStatus'] or 
            not fitness_results['SignallingFitnessStatus'] or 
            not fitness_results['TelecomFitnessStatus']):
            return "Standby"
        
        # Priority 2: If cleaning is in_progress → Under_Maintenance
        if cleaning_results.get('CleaningSlotStatus') == 'in_progress':
            return "Under_Maintenance"
        
        # Priority 3: If brakepad wear >= 80% → Under_Maintenance (standby for 1 day)
        if wear_results['BrakepadWear%'] >= 80:
            return "Under_Maintenance"
        
        # Priority 4: If HVAC >= 90% → Under_Maintenance (standby for 3 days)
        if wear_results['HVACWear%'] >= 90:
            return "Under_Maintenance"
        
        # Priority 5: Check maintenance schedule for other maintenance
        if train_id in self.maintenance_schedule:
            return "Under_Maintenance"
        
        # Default: In_Service (when all fitness certificates are TRUE and no maintenance)
        return "In_Service"
    
    def enforce_exact_cleaning_limit(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enforce exactly 10 trains in cleaning system (3 in_progress + 7 booked)"""
        df_copy = df.copy()
        
        # Convert CleaningRequired to boolean
        df_copy['CleaningRequired_bool'] = df_copy['CleaningRequired'].apply(
            lambda x: x == 'TRUE' if isinstance(x, str) else bool(x)
        )
        
        # Count current cleaning system usage
        in_progress_trains = df_copy[df_copy['CleaningSlotStatus'] == 'in_progress']
        booked_trains = df_copy[df_copy['CleaningSlotStatus'] == 'booked']
        
        current_in_progress = len(in_progress_trains)
        current_booked = len(booked_trains)
        current_total = current_in_progress + current_booked
        
        print(f"🧼 Enforcing cleaning limits - Current: {current_in_progress} in_progress, {current_booked} booked, {current_total} total")
        
        # If we have more than 10 trains in cleaning system, reduce to exactly 10
        if current_total > 10:
            excess = current_total - 10
            print(f"⚠️  Reducing {excess} excess trains from cleaning system")
            
            # First, reduce from booked trains if we have more than 7
            if current_booked > 7:
                booked_excess = min(current_booked - 7, excess)
                booked_to_free = booked_trains.head(booked_excess)
                for idx in booked_to_free.index:
                    df_copy.loc[idx, 'CleaningRequired'] = False
                    df_copy.loc[idx, 'CleaningSlotStatus'] = 'free'
                    df_copy.loc[idx, 'BayOccupancyIDC'] = 'NULL'
                excess -= booked_excess
            
            # Then reduce from in_progress if needed (but keep at least some)
            if excess > 0 and current_in_progress > 3:
                in_progress_excess = min(current_in_progress - 3, excess)
                in_progress_to_free = in_progress_trains.head(in_progress_excess)
                for idx in in_progress_to_free.index:
                    df_copy.loc[idx, 'CleaningRequired'] = False
                    df_copy.loc[idx, 'CleaningSlotStatus'] = 'free'
                    df_copy.loc[idx, 'BayOccupancyIDC'] = 'NULL'
                excess -= in_progress_excess
        
        # If we have fewer than 10 trains in cleaning system, add more
        elif current_total < 10:
            needed = 10 - current_total
            print(f"📈 Adding {needed} trains to cleaning system")
            
            # Find trains that could need cleaning (oldest last cleaned dates)
            free_trains = df_copy[
                (df_copy['CleaningSlotStatus'] == 'free') & 
                (df_copy['CleaningRequired_bool'] == False)
            ].copy()
            
            if len(free_trains) >= needed:
                # Convert LastCleanedDate to datetime for sorting
                free_trains['LastCleanedDate_dt'] = pd.to_datetime(
                    free_trains['LastCleanedDate'], format='%d-%m-%Y', errors='coerce'
                )
                
                # Sort by oldest cleaning date
                oldest_trains = free_trains.nsmallest(needed, 'LastCleanedDate_dt')
                
                # Add to cleaning system
                for idx in oldest_trains.index:
                    df_copy.loc[idx, 'CleaningRequired'] = True
                    
                    # Assign to appropriate slot
                    if current_in_progress < 3:
                        df_copy.loc[idx, 'CleaningSlotStatus'] = 'in_progress'
                        df_copy.loc[idx, 'BayOccupancyIDC'] = f'BAY_{current_in_progress + 1:02d}'
                        current_in_progress += 1
                    else:
                        df_copy.loc[idx, 'CleaningSlotStatus'] = 'booked'
                        df_copy.loc[idx, 'BayOccupancyIDC'] = f'BAY_{current_booked + 4:02d}'
                        current_booked += 1
        
        # Final cleanup: ensure CleaningRequired matches cleaning slot status
        for idx, row in df_copy.iterrows():
            if row['CleaningSlotStatus'] in ['in_progress', 'booked']:
                df_copy.loc[idx, 'CleaningRequired'] = True
            elif row['CleaningSlotStatus'] == 'free':
                df_copy.loc[idx, 'CleaningRequired'] = False
                df_copy.loc[idx, 'BayOccupancyIDC'] = 'NULL'
        
        # Convert boolean back to string format
        df_copy['CleaningRequired'] = df_copy['CleaningRequired'].apply(
            lambda x: 'TRUE' if x else 'FALSE'
        )
        
        # Drop the helper column
        df_copy = df_copy.drop(['CleaningRequired_bool'], axis=1)
        
        # Verify the result
        final_in_progress = len(df_copy[df_copy['CleaningSlotStatus'] == 'in_progress'])
        final_booked = len(df_copy[df_copy['CleaningSlotStatus'] == 'booked'])
        final_cleaning_required = len(df_copy[df_copy['CleaningRequired'] == 'TRUE'])
        
        print(f"✅ Final result: {final_in_progress} in_progress, {final_booked} booked, {final_cleaning_required} CleaningRequired=True")
        
        return df_copy
    
    def ensure_minimum_in_service_trains(self, df: pd.DataFrame, min_required: int = 13) -> pd.DataFrame:
        """Ensure at least the minimum number of trains are In_Service"""
        in_service_count = len(df[df['OperationalStatus'] == 'In_Service'])
        
        if in_service_count < min_required:
            needed = min_required - in_service_count
            
            # Priority 1: Find Standby trains that can be made In_Service
            # (But ignore fitness certificate requirements for minimum service)
            standby_candidates = df[
                (df['OperationalStatus'] == 'Standby') &
                (df['CleaningSlotStatus'] != 'in_progress') &
                (df['BrakepadWear%'] < 80) &
                (df['HVACWear%'] < 90)
            ]
            
            # Priority 2: Find Under_Maintenance trains that can be made In_Service
            maintenance_candidates = df[
                (df['OperationalStatus'] == 'Under_Maintenance') &
                (df['CleaningSlotStatus'] != 'in_progress') &
                (df['BrakepadWear%'] < 80) &
                (df['HVACWear%'] < 90) &
                (df['OpenJobCards'] == 0)  # Only trains without open job cards
            ]
            
            # Combine candidates and take what we need
            all_candidates = pd.concat([standby_candidates, maintenance_candidates])
            selected_candidates = all_candidates.head(needed)
            
            # Update their status to In_Service
            for idx in selected_candidates.index:
                df.loc[idx, 'OperationalStatus'] = 'In_Service'
                
            actual_moved = len(selected_candidates)
            if actual_moved > 0:
                print(f"Moved {actual_moved} trains to In_Service to meet minimum requirement")
            else:
                print(f"Could not find suitable candidates to move to In_Service")
        
        return df
        """Ensure at least the minimum number of trains are In_Service"""
        in_service_count = len(df[df['OperationalStatus'] == 'In_Service'])
        
        if in_service_count < min_required:
            needed = min_required - in_service_count
            
            # Priority 1: Find Standby trains that can be made In_Service
            # (But ignore fitness certificate requirements for minimum service)
            standby_candidates = df[
                (df['OperationalStatus'] == 'Standby') &
                (df['CleaningSlotStatus'] != 'in_progress') &
                (df['BrakepadWear%'] < 80) &
                (df['HVACWear%'] < 90)
            ]
            
            # Priority 2: Find Under_Maintenance trains that can be made In_Service
            maintenance_candidates = df[
                (df['OperationalStatus'] == 'Under_Maintenance') &
                (df['CleaningSlotStatus'] != 'in_progress') &
                (df['BrakepadWear%'] < 80) &
                (df['HVACWear%'] < 90) &
                (df['OpenJobCards'] == 0)  # Only trains without open job cards
            ]
            
            # Combine candidates and take what we need
            all_candidates = pd.concat([standby_candidates, maintenance_candidates])
            selected_candidates = all_candidates.head(needed)
            
            # Update their status to In_Service
            for idx in selected_candidates.index:
                df.loc[idx, 'OperationalStatus'] = 'In_Service'
                
            actual_moved = len(selected_candidates)
            if actual_moved > 0:
                print(f"Moved {actual_moved} trains to In_Service to meet minimum requirement")
            else:
                print(f"Could not find suitable candidates to move to In_Service")
        
        return df
    
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
            
            # 5. Simulate cleaning
            cleaning_results = self.simulate_cleaning(row)
            
            # 6. Determine operational status (now using cleaning_results)
            operational_status = self.determine_operational_status(row, fitness_results, job_results, wear_results, cleaning_results)
            
            # 7. Simulate branding campaign
            branding_results = self.simulate_branding_campaign(row, operational_status)
            
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
        
        # Convert to DataFrame
        result_df = pd.DataFrame(simulated_data)
        
        # ENFORCE EXACT CLEANING REQUIREMENTS: 10 trains total (3 in_progress + 7 booked)
        result_df = self.enforce_exact_cleaning_limit(result_df)
        
        # Ensure at least 13 trains are In_Service
        result_df = self.ensure_minimum_in_service_trains(result_df, min_required=13)
        
        return result_df
    
    
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