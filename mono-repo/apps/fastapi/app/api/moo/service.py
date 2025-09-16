import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from app.api.moo.models import MooConfig, TrainRankingResult

class MooService:
    """Service class for Multi-Objective Optimization (MOO) train ranking logic"""
    
    def __init__(self, config: MooConfig):
        self.config = config
        self.mileage_limit_before_service = config.mileage_limit_before_service
    
    def calculate_score(self, row: pd.Series) -> float:
        """
        Calculate MOO score for a single train based on multiple objectives
        Replicates the exact scoring logic from MOO.py
        """
        score = 0
        
        # ✅ Rolling stock / signalling / telecom fitness (Critical - if any is False, score = 0)
        rolling_stock_status = self._convert_to_bool(row.get("RollingStockFitnessStatus", True))
        if rolling_stock_status:
            score += 15
        else:
            score = 0
            return score

        signalling_status = self._convert_to_bool(row.get("SignallingFitnessStatus", True))
        if signalling_status:
            score += 10
        else:
            score = 0
            return score
            
        telecom_status = self._convert_to_bool(row.get("TelecomFitnessStatus", True))
        if telecom_status:
            score += 10
        else:
            score = 0
            return score
        
        # ✅ Job Card Status (close = healthy)
        job_card_status = str(row.get("JobCardStatus", "")).strip().lower()
        if job_card_status == "close":
            score += 5
        
        # ✅ Open Job Cards (fewer is better, negative impact)
        open_job_cards = int(row.get("OpenJobCards", 0))
        if open_job_cards >= 0:
            score += max(0, 5 - (open_job_cards * 2))
        
        # ✅ Branding Priority
        branding_active = self._convert_to_bool(row.get("BrandingActive", False))
        if branding_active:
            score += 3
            exposure_target = float(row.get("ExposureHoursTarget", 0))
            exposure_accrued = float(row.get("ExposureHoursAccrued", 0))
            
            if exposure_target > 0:
                completion_ratio = exposure_accrued / exposure_target
                branding_points = 7 * (1 - completion_ratio)
                score += max(0, branding_points)

        # ✅ Total Mileage consideration
        total_mileage = float(row.get("TotalMileageKM", 0))
        if total_mileage < 50000:
            score += 5
        elif 50000 <= total_mileage < 150000:
            score += 2.5

        # ✅ Mileage since last service (lower = better)
        mileage_since_service = float(row.get("MileageSinceLastServiceKM", 0))
        if mileage_since_service >= 0:
            mileage_penalty = mileage_since_service / self.mileage_limit_before_service
            mileage_points = max(0, int(5 - (mileage_penalty / 10000)))
            score += mileage_points
        
        # ✅ Mileage Balance Variance
        mileage_balance_variance = float(row.get("MileageBalanceVariance", 0))
        mbv = max(0, 5 - (abs(mileage_balance_variance) / 1000))
        score += mbv

        # ✅ Wear and Tear
        brakepad_wear = float(row.get("BrakepadWear%", 0))
        hvac_wear = float(row.get("HVACWear%", 0))
        
        score += max(0, 10 - int(brakepad_wear / 10))  # 0–100%
        score += max(0, 5 - int(hvac_wear / 10))       # 0–100%
        
        # ✅ Cleaning Required
        cleaning_required = self._convert_to_bool(row.get("CleaningRequired", False))
        score += 10 if not cleaning_required else 0
        
        # ✅ Shunting Moves Required
        shunting_moves = int(row.get("ShuntingMovesRequired", 0))
        smr_score = max(0, 3 - (shunting_moves * 3))
        score += smr_score

        # ✅ Operational Status
        operational_status = str(row.get("OperationalStatus", "")).strip().lower()
        if operational_status == "in service":
            score += 2
        # under maintenance = 0
        
        return round(score, 2)
    
    def _convert_to_bool(self, value: Any) -> bool:
        """Convert various boolean representations to actual boolean"""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.upper() in ['TRUE', '1', 'YES', 'Y']
        if isinstance(value, (int, float)):
            return bool(value)
        return False
    
    def calculate_tie_break_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate tie-breaking metrics for ranking"""
        df_copy = df.copy()
        
        # Job Card Priority (lower = better)
        df_copy["JobCardPriority"] = df_copy.apply(
            lambda r: (r["OpenJobCards"] if str(r["JobCardStatus"]).strip().lower() == "open" else 0), 
            axis=1
        )

        # Branding Completion Ratio (lower = better)
        df_copy["BrandingCompletionRatio"] = df_copy.apply(
            lambda r: (
                r["ExposureHoursAccrued"] / r["ExposureHoursTarget"] 
                if self._convert_to_bool(r["BrandingActive"]) and r["ExposureHoursTarget"] > 0 
                else 1
            ),
            axis=1
        )

        # Mileage Balance Absolute (lower variance = better)
        df_copy["MileageBalanceAbs"] = df_copy["MileageBalanceVariance"].abs()

        # Cleaning Priority (0 better than 1)
        df_copy["CleaningPriority"] = df_copy["CleaningRequired"].apply(
            lambda x: 1 if self._convert_to_bool(x) else 0
        )

        # Shunting Priority (fewer = better)
        df_copy["ShuntingPriority"] = df_copy["ShuntingMovesRequired"]
        
        return df_copy
    
    def rank_trains(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Rank trains using MOO algorithm
        Replicates the exact ranking logic from MOO.py
        """
        df_work = df.copy()
        
        # Calculate scores for all trains
        df_work["Score"] = df_work.apply(self.calculate_score, axis=1)
        
        # Calculate tie-breaking metrics
        df_work = self.calculate_tie_break_metrics(df_work)
        
        # Final Ranking with Tie-Break (exactly as in MOO.py)
        df_work = df_work.sort_values(
            by=[
                "Score",                    # Primary score (higher = better)
                "JobCardPriority",          # 1. Job cards (lower = better)
                "BrandingCompletionRatio",  # 2. Branding ratio (lower = better)
                "MileageBalanceAbs",        # 3. Mileage balancing (lower variance = better)
                "CleaningPriority",         # 4. Cleaning required (0 better than 1)
                "ShuntingPriority"          # 5. Shunting moves (fewer = better)
            ],
            ascending=[False, True, True, True, True, True]
        )

        # Assign unique ranks
        df_work["Rank"] = range(1, len(df_work) + 1)
        
        return df_work
    
    def convert_to_ranking_results(self, ranked_df: pd.DataFrame) -> List[TrainRankingResult]:
        """Convert DataFrame to list of TrainRankingResult objects"""
        results = []
        
        for _, row in ranked_df.iterrows():
            result = TrainRankingResult(
                train_id=str(row["TrainID"]),
                score=float(row["Score"]),
                rank=int(row["Rank"]),
                rolling_stock_fitness=self._convert_to_bool(row.get("RollingStockFitnessStatus", True)),
                signalling_fitness=self._convert_to_bool(row.get("SignallingFitnessStatus", True)),
                telecom_fitness=self._convert_to_bool(row.get("TelecomFitnessStatus", True)),
                job_card_status=str(row.get("JobCardStatus", "")),
                open_job_cards=int(row.get("OpenJobCards", 0)),
                branding_active=self._convert_to_bool(row.get("BrandingActive", False)),
                total_mileage_km=float(row.get("TotalMileageKM", 0)),
                mileage_since_service_km=float(row.get("MileageSinceLastServiceKM", 0)),
                mileage_balance_variance=float(row.get("MileageBalanceVariance", 0)),
                brakepad_wear_percent=float(row.get("BrakepadWear%", 0)),
                hvac_wear_percent=float(row.get("HVACWear%", 0)),
                cleaning_required=self._convert_to_bool(row.get("CleaningRequired", False)),
                shunting_moves_required=int(row.get("ShuntingMovesRequired", 0)),
                operational_status=str(row.get("OperationalStatus", ""))
            )
            results.append(result)
        
        return results