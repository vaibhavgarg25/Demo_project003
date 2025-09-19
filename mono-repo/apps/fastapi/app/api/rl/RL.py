"""
COMMANDS FOR RUNNING ( IN ORDER ):
1) python RL.py --mode infer --csv final1output.csv --out next_day_plan_heuristic.csv
2) python RL.py --mode train --csv final1output.csv --timesteps 100000 --model kmrl_ppo_model
3) python RL.py --mode infer --csv final1output.csv --model kmrl_ppo_model --out next_day_plan_rl.csv
"""

import os
import argparse
import copy
import json
import math
import random
import datetime
from typing import Dict, Any, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# try importing stable-baselines3 only if available
try:
    from stable_baselines3 import PPO
    from stable_baselines3.common.vec_env import DummyVecEnv
    from stable_baselines3.common.callbacks import EvalCallback, CheckpointCallback
    import gymnasium as gym
    from gymnasium import spaces
    SB3_AVAILABLE = True
except Exception:
    SB3_AVAILABLE = False
    print("Warning: stable-baselines3 not available")

# ----------------------- CONFIG -----------------------
DEFAULT_CONFIG = {
    "service_quota": 13,
    "daily_mileage": 436.96,
    "daily_mileage_noise_sigma": 20.0,
    "jobcard_close_rate": 1,
    "brake_wear_daily": 0.27,
    "hvac_wear_daily": 0.16,
    "brake_threshold": 80.0,
    "hvac_threshold": 90.0,
    "mileage_service_threshold": 10000.0,
    "mileage_reset_close_days": 2,
    "brake_maintenance_days": 1,
    "hvac_maintenance_days": 3,
    "fitness_escalation_days": {"RollingStock": 4, "Signalling": 5, "Telecom": 5},
    "fitness_validity_days": {"RollingStock": 365*2, "Signalling": 365*5, "Telecom": 365*4},
    "cleaning_bays": 3,
    "stabling_bays": 15,
    "per_day_operating_hours": 16,
    "brand_campaign_every_n_days": 45,
    "brand_campaigns_each_time": 3,
    "brand_targets": [280, 300, 320, 340],
    "brand_quota_choices": [14, 15, 16],
    "rw": {
        "fit_safe": 10.0,  # Reduced from 20
        "fit_violation": -100.0,  # Reduced from -200
        "quota_hit": 100.0,  # Increased from 50
        "quota_miss": -50.0,  # Increased penalty
        "maint_for_high_priority": 20.0,  # Reduced from 30
        "inservice_jobcard_penalty_per_job": -2.0,  # Reduced from -5
        "mileage_balance_coeff": -0.01,  # Reduced
        "brand_progress_per_hour": 0.5,
        "brand_completion_bonus": 40.0,  # Reduced from 80
        "cleaning_done": 5.0,  # Reduced from 10
        "shunt_penalty_per_move": -0.2,  # Reduced from -0.5
        "jobcard_unresolved_daily_penalty": -2.0,  # Reduced from -5
        "standby_penalty": -5.0,  # New: penalty for excessive standby
        "maintenance_when_needed": 15.0  # New: reward for maintenance when actually needed
    }
}

# ---------------------- Helpers -----------------------

def parse_date(d):
    if pd.isna(d) or d is None or str(d).strip() == "":
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.datetime.strptime(str(d).strip(), fmt).date()
        except Exception:
            pass
    try:
        return pd.to_datetime(d).date()
    except Exception:
        return None

def days_until(date_obj, ref_date):
    if date_obj is None:
        return 0
    return (date_obj - ref_date).days

# ---------------- Environment -------------------------
if SB3_AVAILABLE:
    class KMrlOneNightEnv(gym.Env):
        """
        Gym environment: one episode = assign OperationalStatus for every train (sequentially).
        """
        metadata = {"render_modes": []}
        
        def __init__(self, csv_path: str, config: Dict[str, Any] = None, seed: int = 42, normalize: bool = True):
            super().__init__()
            self.csv_path = csv_path
            self.config = copy.deepcopy(DEFAULT_CONFIG)
            if config is not None:
                self.config.update(config)
            self.seed_val = seed
            self.rng = np.random.RandomState(seed)
            
            # Load CSV and preprocess
            self.df_raw = pd.read_csv(csv_path, dtype=str).fillna("")
            self.df_raw.columns = [c.strip() for c in self.df_raw.columns]
            self.today = parse_date(self.df_raw.at[0, "CURRENT_DATE"]) if len(self.df_raw) > 0 and "CURRENT_DATE" in self.df_raw.columns else datetime.date.today()
            self._preprocess()

            # Feature list
            self.feature_names = [
                "Score", "Rank",
                "RollingStockFitnessExpiry_days", "SignallingFitnessExpiry_days",
                "OpenJobCards", "JobCardStatus_enc", "JobCardPriority",
                "ExposureHoursAccrued", "ExposureHoursTarget",
                "TotalMileageKM", "MileageSinceLastServiceKM", "BrakepadWear%", "HVACWear%"
            ]
            
            for f in self.feature_names:
                if f not in self.work_df.columns:
                    self.work_df[f] = 0

            # scaler
            self.normalize = normalize
            if self.normalize:
                self._fit_scaler()

            # action & observation space
            self.action_space = spaces.Discrete(3)  # 0=in_service, 1=standby, 2=under_maintenance
            obs_len = len(self.feature_names) + 3  # features + 3 extra
            self.observation_space = spaces.Box(low=-10, high=10, shape=(obs_len,), dtype=np.float32)

        def _preprocess(self):
            df = self.df_raw.copy()
            # numeric conversion
            numeric_cols = [
                "OpenJobCards", "ClosedJobCards", "ExposureHoursAccrued", "ExposureHoursTarget", "ExposureDailyQuota",
                "TotalMileageKM", "MileageSinceLastServiceKM", "MileageBalanceVariance", "BrakepadWear%", "HVACWear%",
                "BayPositionID", "ShuntingMovesRequired", "StablingSequenceOrder", "JobCardPriority",
                "BrandingCompletionRatio", "MileageBalanceAbs", "CleaningPriority", "ShuntingPriority", "Score", "Rank"
            ]
            for c in numeric_cols:
                if c in df.columns:
                    df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)
                else:
                    df[c] = 0.0

            df["BrandingActive_flag"] = df.get("BrandingActive", "").astype(str).str.lower().apply(lambda x: 1 if x in ["1", "true", "y", "yes", "t"] else 0)
            df["CleaningRequired_flag"] = df.get("CleaningRequired", "").astype(str).str.lower().apply(lambda x: 1 if x in ["1", "true", "y", "yes", "t"] else 0)
            df["JobCardStatus_enc"] = df.get("JobCardStatus", "").astype(str).str.lower().apply(lambda x: 1 if "open" in str(x).lower() else 0)

            # parse expiry dates into days until expiry
            for col, out in [("RollingStockFitnessExpiryDate", "RollingStockFitnessExpiry_days"),
                             ("SignallingFitnessExpiryDate", "SignallingFitnessExpiry_days"),
                             ("TelecomFitnessExpiryDate", "TelecomFitnessExpiry_days")]:
                if col in df.columns:
                    parsed = df[col].apply(parse_date)
                    df[out] = parsed.apply(lambda d: days_until(d, self.today) if d is not None else 0)
                else:
                    df[out] = 0

            self.work_df = df.reset_index(drop=True)

        def _fit_scaler(self):
            mat = self.work_df[self.feature_names].astype(float).values
            self.scaler = MinMaxScaler((-1, 1))  # Scale to [-1, 1] for better training
            self.scaler.fit(mat)

        def reset(self, seed=None, options=None):
            """Reset environment - returns (observation, info) tuple"""
            if seed is not None:
                self.rng = np.random.RandomState(seed)
            
            self._build_workcopy()
            self.step_idx = 0
            self.assigned = np.full(self.n_trains, -1, dtype=int)
            self.remaining_service = int(self.config["service_quota"])
            self.total_shunting_cost = 0.0
            self.jobcard_age = np.zeros(self.n_trains, dtype=int)
            self.today_sim = self.today
            
            obs = self._get_obs()
            info = {}
            return obs, info

        def _build_workcopy(self):
            self.df = self.work_df.copy().reset_index(drop=True)
            self.n_trains = len(self.df)

        def _get_obs(self):
            if self.step_idx >= self.n_trains:
                return np.zeros(self.observation_space.shape, dtype=np.float32)
                
            idx = self.step_idx
            feat = self.df.loc[idx, self.feature_names].astype(float).values
            if self.normalize:
                feat = self.scaler.transform(feat.reshape(1, -1)).reshape(-1,)
            
            # Additional context features
            rem = np.array([self.remaining_service / max(1, int(self.config["service_quota"]))], dtype=np.float32)
            sh = np.array([min(self.total_shunting_cost / 100.0, 1.0)], dtype=np.float32)  # Normalize shunting
            frac = np.array([self.step_idx / max(1, self.n_trains)], dtype=np.float32)
            
            return np.concatenate([feat.astype(np.float32), rem, sh, frac])

        def step(self, action):
            """Execute action and return (obs, reward, terminated, truncated, info)"""
            assert self.action_space.contains(action)
            
            if self.step_idx >= self.n_trains:
                # Episode already done
                obs = np.zeros(self.observation_space.shape, dtype=np.float32)
                return obs, 0.0, True, False, {}
            
            idx = self.step_idx
            row = self.df.loc[idx]
            info = {"train_idx": idx, "TrainID": row.get("TrainID", "")}
            reward = 0.0
            breakdown = {}

            chosen = int(action)
            
            # Check fitness constraints
            fitness_expired = any([
                float(row.get("RollingStockFitnessExpiry_days", 0)) <= 0,
                float(row.get("SignallingFitnessExpiry_days", 0)) <= 0,
                float(row.get("TelecomFitnessExpiry_days", 0)) <= 0
            ])
            
            # Override if trying to put expired fitness train in service
            if chosen == 0 and fitness_expired:
                chosen = 1  # Force to standby
                reward += self.config["rw"]["fit_violation"]
                breakdown["fit_violation"] = self.config["rw"]["fit_violation"]
                info["override"] = "fitness_expired"

            # Check quota constraint
            if chosen == 0 and self.remaining_service <= 0:
                chosen = 1  # Force to standby
                reward += self.config["rw"]["quota_miss"] * 0.5
                breakdown["quota_overflow_penalty"] = self.config["rw"]["quota_miss"] * 0.5
                info["override"] = info.get("override", "") + ";quota_exhausted"

            # === REWARD SHAPING ===
            
            # Fitness safety bonus
            if chosen == 0 and not fitness_expired:
                reward += self.config["rw"]["fit_safe"]
                breakdown["fit_safe"] = self.config["rw"]["fit_safe"]

            # Jobcards handling
            open_jobs = int(row.get("OpenJobCards", 0))
            brake_wear = float(row.get("BrakepadWear%", 0))
            hvac_wear = float(row.get("HVACWear%", 0))
            
            if chosen == 0:  # In service
                # Penalty for running with open jobs
                if open_jobs > 0:
                    penalty = self.config["rw"]["inservice_jobcard_penalty_per_job"] * open_jobs
                    reward += penalty
                    breakdown["inservice_jobcard_penalty"] = penalty
                else:
                    # Bonus for clean train in service
                    reward += 3.0
                    breakdown["no_open_job_bonus"] = 3.0
                    
            elif chosen == 2:  # Under maintenance
                # Reward maintenance when actually needed
                needs_maintenance = (open_jobs >= 2 or 
                                    brake_wear >= self.config["brake_threshold"] or 
                                    hvac_wear >= self.config["hvac_threshold"])
                if needs_maintenance:
                    reward += self.config["rw"]["maintenance_when_needed"]
                    breakdown["maint_when_needed"] = self.config["rw"]["maintenance_when_needed"]
                else:
                    # Small penalty for unnecessary maintenance
                    reward -= 5.0
                    breakdown["unnecessary_maint"] = -5.0
                    
            elif chosen == 1:  # Standby
                # Small penalty for standby to encourage using trains
                if not fitness_expired and open_jobs < 2:
                    reward += self.config["rw"]["standby_penalty"]
                    breakdown["standby_penalty"] = self.config["rw"]["standby_penalty"]

            # Mileage considerations
            m_since = float(row.get("MileageSinceLastServiceKM", 0.0))
            if chosen == 0:
                if m_since >= float(self.config["mileage_service_threshold"]):
                    reward -= 15.0
                    breakdown["mileage_over_threshold"] = -15.0
                else:
                    reward += 2.0
                    breakdown["mileage_ok"] = 2.0

            # Branding
            if int(row.get("BrandingActive_flag", 0)) == 1:
                if chosen == 0:
                    reward += 8.0
                    breakdown["brand_selected"] = 8.0
                else:
                    reward -= 3.0
                    breakdown["brand_missed"] = -3.0

        
            cleaning_slot = row.get("CleaningSlotStatus", 0)
            cleaning_required = int(row.get("CleaningRequired_flag", 0))
            if cleaning_slot == 'in_progress' and chosen == 0:
                reward -= 10.0
                breakdown["clean_inprogress_penalty"] = -10.0
            elif cleaning_required == 1 and chosen != 2:
                reward -= 2.0
                breakdown["cleaning_needed_penalty"] = -2.0

            # Shunting penalty
            shunts = float(row.get("ShuntingMovesRequired", 0.0))
            if chosen == 0 and shunts > 0:
                penalty = self.config["rw"]["shunt_penalty_per_move"] * shunts
                reward += penalty
                breakdown["shunt_penalty"] = penalty

            # Commit action
            self.assigned[idx] = chosen
            if chosen == 0:
                self.remaining_service -= 1
                self.total_shunting_cost += shunts

            self.step_idx += 1
            
            # Check if episode is done
            terminated = (self.step_idx >= self.n_trains)
            truncated = False

            if terminated:
                # End of episode rewards
                service_selected = int((self.assigned == 0).sum())
                
                # Quota achievement
                if service_selected < int(self.config["service_quota"]):
                    miss = int(self.config["service_quota"]) - service_selected
                    penalty = self.config["rw"]["quota_miss"] * miss
                    reward += penalty
                    breakdown["quota_miss_penalty"] = penalty
                elif service_selected == int(self.config["service_quota"]):
                    reward += self.config["rw"]["quota_hit"]
                    breakdown["quota_hit"] = self.config["rw"]["quota_hit"]
                else:
                    # Over quota
                    over = service_selected - int(self.config["service_quota"])
                    penalty = -10.0 * over
                    reward += penalty
                    breakdown["quota_over_penalty"] = penalty

                # Simulate next day for additional rewards
                sim_out = self._simulate_next_day()
                for k, v in sim_out.get("rewards", {}).items():
                    reward += v
                    breakdown[k] = breakdown.get(k, 0.0) + v

                # Log for debugging
                if self.step_idx % 100 == 0:  # Log occasionally
                    out_df = self._build_output_df()
                    out_df["AssignedAction"] = self.assigned
                    out_df["AssignedAction_str"] = out_df["AssignedAction"].map({
                        0: "in_service", 1: "standby", 2: "under_maintenance"
                    })
                    os.makedirs("./kmrl_logs", exist_ok=True)
                    out_df.to_csv(f"./kmrl_logs/train_episode_{self.rng.randint(10000)}.csv", index=False)

            obs = self._get_obs()
            info["breakdown"] = breakdown
            
            return obs, float(reward), terminated, truncated, info

        def _simulate_next_day(self):
            """Simulate next day operations"""
            cfg = self.config
            rw = cfg["rw"]
            rewards = {}
            
            # Count action distribution for balance reward
            n_service = (self.assigned == 0).sum()
            n_standby = (self.assigned == 1).sum()
            n_maint = (self.assigned == 2).sum()
            
            # Encourage balanced distribution
            if n_standby > self.n_trains * 0.5:
                rewards["too_many_standby"] = -20.0
            
            # Simulate maintenance effects
            for i in range(self.n_trains):
                if self.assigned[i] == 2:  # maintenance
                    # Reduce jobcards
                    oc = int(self.df.at[i, "OpenJobCards"])
                    if oc > 0:
                        rewards[f"maint_jobcard_{i}"] = 5.0
            
            return {"rewards": rewards}

        def _build_output_df(self):
            return self.df.copy()

        def render(self, mode="human"):
            print(f"Step {self.step_idx}/{self.n_trains}. Remaining service: {self.remaining_service}")

else:
    KMrlOneNightEnv = None

# ------------------ Training & Inference Utilities ------------------

def train_ppo(csv_path: str, model_out: str = "kmrl_ppo.zip", timesteps: int = 100000, seed: int = 42):
    """Train PPO model with proper configuration"""
    if not SB3_AVAILABLE:
        raise RuntimeError("stable-baselines3 not installed")
    
    print("Creating environment...")
    # Create vectorized environment
    env = DummyVecEnv([lambda: KMrlOneNightEnv(csv_path, seed=seed)])
    
    print("Initializing PPO model...")
    # PPO with tuned hyperparameters for this environment
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=3e-4,
        n_steps=512,  # Reduced for faster updates
        batch_size=64,
        n_epochs=10,
        gamma=0.95,  # Slightly lower discount for immediate rewards
        gae_lambda=0.9,
        clip_range=0.2,
        ent_coef=0.01,  # Encourage exploration
        vf_coef=0.5,
        max_grad_norm=0.5,
        policy_kwargs=dict(
            net_arch=[dict(pi=[128, 128], vf=[128, 128])]  # Deeper networks
        ),
        verbose=1,
        seed=seed
    )
    
    print(f"Training for {timesteps} timesteps...")
    
    # Training with periodic evaluation
    eval_env = DummyVecEnv([lambda: KMrlOneNightEnv(csv_path, seed=seed+1)])
    
    # Callbacks for better training monitoring
    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path="./kmrl_models/",
        log_path="./kmrl_logs/",
        eval_freq=5000,
        deterministic=True,
        render=False,
        n_eval_episodes=5
    )
    
    checkpoint_callback = CheckpointCallback(
        save_freq=10000,
        save_path="./kmrl_checkpoints/",
        name_prefix="kmrl_model"
    )
    
    # Train the model
    model.learn(
        total_timesteps=timesteps,
        callback=[eval_callback, checkpoint_callback],
        progress_bar=True
    )
    
    # Save final model
    model.save(model_out)
    print(f"Model saved to {model_out}")
    
    # Test the model
    print("\nTesting trained model...")
    test_env = KMrlOneNightEnv(csv_path, seed=seed+100)
    obs, _ = test_env.reset()
    
    action_counts = {0: 0, 1: 0, 2: 0}
    for _ in range(test_env.n_trains):
        action, _ = model.predict(obs, deterministic=True)
        obs, reward, terminated, truncated, info = test_env.step(action)
        action_counts[int(action)] += 1
        if terminated:
            break
    
    print(f"Action distribution: in_service={action_counts[0]}, standby={action_counts[1]}, maintenance={action_counts[2]}")
    
    return model_out

def infer_policy(csv_path: str, model_path: str = None, out_csv: str = "next_day_plan_rl.csv", heuristic_fallback: bool = True):
    """Run inference with trained model or heuristic"""
    df = pd.read_csv(csv_path, dtype=str).fillna("")
    df.columns = [c.strip() for c in df.columns]
    # Numeric conversion
    numeric_cols = [
        "OpenJobCards", "ClosedJobCards", "ExposureHoursAccrued", "ExposureHoursTarget",
        "TotalMileageKM", "MileageSinceLastServiceKM", "BrakepadWear%", "HVACWear%",
        "ShuntingMovesRequired", "JobCardPriority",
        "Score", "Rank"
    ]
    for c in numeric_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)

    # Parse dates and flags
    df["BrandingActive_flag"] = df.get("BrandingActive", "").astype(str).str.lower().apply(
        lambda x: 1 if x in ["1", "true", "y", "yes", "t"] else 0
    )
    df["CleaningRequired_flag"] = df.get("CleaningRequired", "").astype(str).str.lower().apply(
        lambda x: 1 if x in ["1", "true", "y", "yes", "t"] else 0
    )
    
    def _days_until_col(col):
        if col not in df.columns:
            return np.zeros(len(df), dtype=int)
        parsed = df[col].apply(parse_date)
        base = parse_date(df.at[0, "CURRENT_DATE"]) if "CURRENT_DATE" in df.columns else datetime.date.today()
        return parsed.apply(lambda d: days_until(d, base) if d is not None else 0)

    df["RollingStockFitnessExpiry_days"] = _days_until_col("RollingStockFitnessExpiryDate")
    df["SignallingFitnessExpiry_days"] = _days_until_col("SignallingFitnessExpiryDate")
    df["TelecomFitnessExpiry_days"] = _days_until_col("TelecomFitnessExpiryDate")

    # Use RL model if available
    if model_path and SB3_AVAILABLE and os.path.exists(model_path):
        print(f"Using trained model from {model_path}")
        model = PPO.load(model_path)
        env = KMrlOneNightEnv(csv_path)
        obs, _ = env.reset()
        
        actions = []
        for i in range(env.n_trains):
            action, _ = model.predict(obs, deterministic=True)
            actions.append(int(action))
            obs, reward, terminated, truncated, info = env.step(action)
            if terminated:
                break
        
        status_map = {0: "in_service", 1: "standby", 2: "under_maintenance"}
        df["NextDayOperationalStatus"] = [status_map[a] for a in actions]
        
        # Add XAI explanations
        explanations = []
        for i, action in enumerate(actions):
            row = df.iloc[i]
            reasons = []
            if action == 0:
                reasons.append(f"Score={row['Score']:.1f}")
                if row["BrandingActive_flag"] == 1:
                    reasons.append("branding_active")
            elif action == 1:
                if row["OpenJobCards"] > 0:
                    reasons.append(f"jobs={int(row['OpenJobCards'])}")
            else:  # maintenance
                if row["OpenJobCards"] >= 2:
                    reasons.append(f"high_jobs={int(row['OpenJobCards'])}")
                if row["BrakepadWear%"] >= DEFAULT_CONFIG["brake_threshold"]:
                    reasons.append("brake_wear_high")
            explanations.append(", ".join(reasons) if reasons else "balanced_decision")
        
        df["ReasonForStatus"] = explanations
        
    else:
        # Heuristic fallback
        print("Using heuristic fallback")
        df["eligible"] = (
            (df["RollingStockFitnessExpiry_days"] > 0) & 
            (df["SignallingFitnessExpiry_days"] > 0) & 
            (df["TelecomFitnessExpiry_days"] > 0)
        ).astype(int)
        
        # Priority scoring
        df["RL_priority"] = (
            df["Score"] * 1.0 + 
            df["eligible"] * 100.0 - 
            df["OpenJobCards"] * 5.0 - 
            df["ShuntingMovesRequired"] * 2.0 + 
            df["BrandingActive_flag"] * 10.0
        )
        
        df_sorted = df.sort_values(["eligible", "RL_priority"], ascending=[False, False]).reset_index()
        
        assignments = []
        remaining_quota = int(DEFAULT_CONFIG["service_quota"])
        
        for idx, row in df_sorted.iterrows():
            orig_idx = int(row["index"])
            
            # Check constraints
            if row["eligible"] == 0:
                assignments.append((orig_idx, "standby", "fitness_expired"))
            elif row["BrakepadWear%"] >= DEFAULT_CONFIG["brake_threshold"]:
                assignments.append((orig_idx, "under_maintenance", "brake_maintenance"))
            elif row["HVACWear%"] >= DEFAULT_CONFIG["hvac_threshold"]:
                assignments.append((orig_idx, "under_maintenance", "hvac_maintenance"))
            elif row["OpenJobCards"] >= 3:
                assignments.append((orig_idx, "under_maintenance", "high_jobcards"))
            elif remaining_quota > 0:
                assignments.append((orig_idx, "in_service", "selected"))
                remaining_quota -= 1
            else:
                assignments.append((orig_idx, "standby", "quota_exhausted"))
        
        # Sort back to original order
        assignments.sort(key=lambda x: x[0])
        df["NextDayOperationalStatus"] = [a[1] for a in assignments]
        df["ReasonForStatus"] = [a[2] for a in assignments]
    
    df["OperationalStatus"] = df["NextDayOperationalStatus"]
    df = df.drop(columns=["NextDayOperationalStatus"])
# Ensure XAI_explanation exists
    if "ReasonForStatus" not in df.columns:
        df["ReasonForStatus"] = ""

    # Save **all** columns with added/updated columns
    df.to_csv(out_csv, index=False)
    print(f"Saved assignments to {out_csv}")
    return out_csv

# ---------------------- CLI ---------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["train", "infer"], required=True)
    parser.add_argument("--csv", required=True, help="Path to MOO CSV (today)")
    parser.add_argument("--model", help="Path to saved model for inference (optional)")
    parser.add_argument("--out", default="next_day_plan_rl.csv", help="Output CSV path")
    parser.add_argument("--timesteps", type=int, default=10000, help="Timesteps for quick training")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if args.mode == "train":
        if not SB3_AVAILABLE:
            raise RuntimeError("stable-baselines3 or gym not installed in this Python environment. Install first.")
        model_path = args.model if args.model else "kmrl_ppo_model.zip"
        print(f"Training PPO on {args.csv} for {args.timesteps} timesteps...")
        train_ppo(args.csv, model_out=model_path, timesteps=args.timesteps, seed=args.seed)
        print("Training finished. Run inference with --mode infer --model <model_path>")

    elif args.mode == "infer":
        infer_policy(args.csv, model_path=args.model, out_csv=args.out)
