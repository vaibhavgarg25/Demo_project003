# kmrl_rl_env_multiday.py
# Multi-day simulator environment (gymnasium) that extends the single-night env.
# - Each episode runs for episode_days (e.g., 7).
# - After each night (after RL decides for all 25 trains), env advances the world:
#     * mileage, exposure, cleaning, jobcards, fitness days->days-1
# - A simple MOO surrogate recomputes a Score each day (you can replace with your real MOO)
# - Per-assignment reward uses your previously shaped rewards.
#
# Usage: put your daily CSV path in CSV_PATH and run. For SB3 we wrap with DummyVecEnv.
#
# NOTE: tune the simulation parameters (daily mileage, exposure hours) to fit KMRL reality.

import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pandas as pd
import datetime
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv
import copy
import os

# --- helper functions (same as before) ---
def parse_date(d):
    if pd.isna(d) or str(d).strip() == "":
        return None
    for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.datetime.strptime(str(d).strip(), fmt).date()
        except Exception:
            pass
    return None

def days_until(date_obj, ref_date=None):
    if date_obj is None:
        return 9999
    if ref_date is None:
        ref_date = datetime.date.today()
    return (date_obj - ref_date).days

def safe_div(a, b, eps=1e-6):
    return a / (b + eps)

# --- MOO surrogate (simple weighted linear score) ---
def compute_moo_score(df_row):
    """
    Surrogate scoring function to mimic MOO ranking. Replace with real MOO later.
    Higher score = more desirable to be In_Service.
    Weights are heuristic; tune as needed or replace by your MOO output.
    """
    # weights (you can customize)
    w = {
        "fitness_days": 0.35,
        "open_jobcards": -0.25,
        "mileage_abs": -0.15,
        "branding": 0.25,
        "cleaning_required": -0.1,
        "shunting": -0.05
    }

    # extract safe values
    signalling_days = float(df_row.get("SignallingFitnessExpiryDate_days", 9999))
    telecom_days = float(df_row.get("TelecomFitnessExpiryDate_days", 9999))
    min_days = min(signalling_days, telecom_days)
    fitness_score = safe_div(min_days, 365.0)  # normalize to roughly 0..1

    open_jobcards = float(df_row.get("OpenJobCards", 0.0))
    open_job_score = -safe_div(open_jobcards, 10.0)

    mileage_abs = float(df_row.get("MileageBalanceAbs", 0.0)) if "MileageBalanceAbs" in df_row else float(df_row.get("MileageBalanceVariance", 0.0))
    mileage_score = -safe_div(mileage_abs, max(1.0, float(df_row.get("TotalMileageKM", 1.0))))

    branding_flag = float(df_row.get("BrandingActive_flag", 0.0))
    cleaning_flag = float(df_row.get("CleaningRequired_flag", 0.0))
    shunting = float(df_row.get("ShuntingMovesRequired", 0.0))
    shunt_score = -safe_div(shunting, 10.0)

    score = (w["fitness_days"] * fitness_score +
             w["open_jobcards"] * open_job_score +
             w["mileage_abs"] * mileage_score +
             w["branding"] * branding_flag +
             w["cleaning_required"] * (-cleaning_flag) +
             w["shunting"] * shunt_score)

    # scale into 0..100
    scaled = 50.0 + 50.0 * score
    return scaled

# --- main env ---
class TrainSchedulingEnvMultiDay(gym.Env):
    """
    Multi-day train scheduling environment.
    Each 'step' corresponds to *one train assignment* within the current day.
    After all trains are assigned for the day, env advances the world by one day.
    Episode terminates after episode_days days.
    """
    metadata = {"render.modes": ["human"]}

    def __init__(self, csv_path,
                 service_quota=13,
                 episode_days=7,
                 daily_mileage_if_in_service=400.0,
                 daily_exposure_hours=16.0,
                 jobcard_reduction_if_maintenance=2,
                 jobcard_new_per_day_lambda=0.1,
                 today=None,
                 seed=None):
        super().__init__()

        # load CSV, similar preproc as before
        self.csv_path = csv_path
        self.df_orig = pd.read_csv(csv_path, dtype=str).fillna("")
        self.df = self.df_orig.copy()
        self.df.columns = [c.strip() for c in self.df.columns]

        # keep a working copy (we'll mutate this during multi-day episodes)
        self.df_input = self.df.copy()
        # drop operational status/score/rank for inputs
        self.df_input = self.df_input.drop(columns=["OperationalStatus", "Score", "Rank"], errors="ignore")

        # convert numeric columns
        numeric_cols = [
            "OpenJobCards", "ClosedJobCards", "ExposureHoursAccrued", "ExposureHoursTarget",
            "ExposureDailyQuota", "TotalMileageKM", "MileageSinceLastServiceKM",
            "MileageBalanceVariance", "BrakepadWear%", "HVACWear%",
            "BayPositionID", "ShuntingMovesRequired", "StablingSequenceOrder",
            "JobCardPriority", "MileageBalanceAbs", "CleaningPriority", "ShuntingPriority"
        ]
        for col in numeric_cols:
            if col in self.df_input.columns:
                self.df_input[col] = pd.to_numeric(self.df_input[col], errors="coerce").fillna(0)

        # parse dates to days fields
        date_cols = ["SignallingFitnessExpiryDate", "TelecomFitnessExpiryDate", "RollingStockFitnessExpiryDate",
                     "LastJobCardUpdate", "LastCleanedDate"]
        self.today = today if today is not None else datetime.date.today()
        for c in date_cols:
            if c in self.df_input.columns:
                parsed = self.df_input[c].apply(parse_date)
                self.df_input[c + "_days"] = parsed.apply(lambda d: days_until(d, self.today))

        # flags
        if "CleaningRequired" in self.df_input.columns:
            self.df_input["CleaningRequired_flag"] = self.df_input["CleaningRequired"].astype(str).str.lower().apply(lambda x: 1 if x in ["true","1","yes","y","t"] else 0)
        else:
            self.df_input["CleaningRequired_flag"] = 0

        if "BrandingActive" in self.df_input.columns:
            self.df_input["BrandingActive_flag"] = self.df_input["BrandingActive"].astype(str).str.lower().apply(lambda x: 1 if x in ["true","1","yes","y","t"] else 0)
        else:
            self.df_input["BrandingActive_flag"] = 0

        # cleaning slot mapping
        if "CleaningSlotStatus" in self.df_input.columns:
            def map_clean_slot(x):
                x = str(x).strip().lower()
                if x in ["free","f","0","available","empty","open"]:
                    return 0
                if x in ["assigned","a","1"]:
                    return 1
                if x in ["in_progress","in progress","progress"]:
                    return 2
                if x in ["unavailable","na"]:
                    return 3
                return 0
            self.df_input["CleaningSlotStatus"] = self.df_input["CleaningSlotStatus"].apply(map_clean_slot)
        else:
            self.df_input["CleaningSlotStatus"] = 0

        # prepare per-train feature list (same as before)
        self.per_train_feature_names = [
            "SignallingFitnessExpiryDate_days", "TelecomFitnessExpiryDate_days", "RollingStockFitnessExpiryDate_days",
            "JobCardStatus", "OpenJobCards", "ClosedJobCards", "LastJobCardUpdate_days",
            "BrandingActive_flag", "ExposureHoursAccrued", "ExposureHoursTarget", "ExposureDailyQuota",
            "TotalMileageKM", "MileageSinceLastServiceKM", "MileageBalanceVariance", "MileageBalanceAbs",
            "BrakepadWear%", "HVACWear%", "CleaningRequired_flag", "CleaningSlotStatus", "BayPositionID",
            "ShuntingMovesRequired", "StablingSequenceOrder", "JobCardPriority"
        ]
        for name in self.per_train_feature_names:
            if name not in self.df_input.columns:
                self.df_input[name] = 0

        # encode jobcard status
        if "JobCardStatus" in self.df_input.columns:
            self.df_input["JobCardStatus_enc"] = self.df_input["JobCardStatus"].astype(str).str.lower().apply(lambda x: 1 if x.startswith("open") else 0)
        else:
            self.df_input["JobCardStatus_enc"] = 0
        self.per_train_feature_names = [("JobCardStatus_enc" if n=="JobCardStatus" else n) for n in self.per_train_feature_names]

        # finalize
        self.n_trains = len(self.df_input)
        if self.n_trains == 0:
            raise ValueError("CSV empty or not loaded properly")
        self._build_feature_matrix()

        # action/obs spaces
        self.action_space = spaces.Discrete(3)
        self.observation_space = spaces.Box(low=-1e9, high=1e9, shape=(self.n_features+3,), dtype=np.float32)

        # quotas and sim params
        self.service_quota = service_quota
        self.remaining_service = service_quota
        self.episode_days = episode_days
        self.day_index = 0
        self.daily_mileage_if_in_service = daily_mileage_if_in_service
        self.daily_exposure_hours = daily_exposure_hours
        self.jobcard_reduction_if_maintenance = jobcard_reduction_if_maintenance
        self.jobcard_new_per_day_lambda = jobcard_new_per_day_lambda

        # internal state
        self.reset(seed=seed)

        # logging folder
        self.log_dir = "./kmrl_sim_logs"
        os.makedirs(self.log_dir, exist_ok=True)


    def _build_feature_matrix(self):
        features = []
        for idx in range(self.n_trains):
            row = self.df_input.iloc[idx]
            vec = []
            for name in self.per_train_feature_names:
                val = row.get(name, 0)
                try:
                    vec.append(float(val))
                except Exception:
                    vec.append(0.0)
            features.append(vec)
        self.feature_matrix = np.array(features, dtype=np.float32)
        self.n_features = self.feature_matrix.shape[1]


    def reset(self, *, seed=None, options=None):
        if seed is not None:
            np.random.seed(seed)
        # reset multi-day episode
        self.day_index = 0
        # working copy of df_input for simulation (deep copy)
        self.work_df = self.df_input.copy().reset_index(drop=True)
        # for day 0 compute initial surrogate scores (MOO)
        self._compute_and_attach_moo_scores(self.work_df)
        self.order = np.arange(self.n_trains)
        # you can randomize self.order if desired each day
        self.step_idx = 0
        self.assigned_actions_day = np.full(self.n_trains, -1, dtype=np.int8)  # per-day assigned actions
        self.assigned_actions_history = []  # list per day
        self.total_shunting_cost = 0.0
        self.remaining_service = self.service_quota
        self.done = False
        # observation is for first train of day 0
        obs = self._get_obs()
        return obs, {}

    def _get_obs(self):
        cur_feat = self._row_to_feature_vec(self.work_df.iloc[self.order[self.step_idx]])
        remaining_norm = float(self.remaining_service) / max(1, self.service_quota)
        shunt_norm = float(self.total_shunting_cost)
        step_norm = float(self.step_idx) / max(1, self.n_trains)
        return np.concatenate([cur_feat, np.array([remaining_norm, shunt_norm, step_norm], dtype=np.float32)])

    def _row_to_feature_vec(self, row):
        vec = []
        for name in self.per_train_feature_names:
            val = row.get(name, 0)
            try:
                vec.append(float(val))
            except Exception:
                vec.append(0.0)
        return np.array(vec, dtype=np.float32)

    def _compute_and_attach_moo_scores(self, df):
        # compute a Score column and Rank column in-place
        scores = []
        for i in range(len(df)):
            scores.append(compute_moo_score(df.iloc[i]))
        df["Score"] = scores
        df["Rank"] = pd.Series(scores).rank(method="min", ascending=False).astype(int)

    def _train_has_expired_fitness(self, idx):
        r = self.work_df.iloc[idx]
        s = float(r.get("SignallingFitnessExpiryDate_days", 9999))
        t = float(r.get("TelecomFitnessExpiryDate_days", 9999))
        rsk = float(r.get("RollingStockFitnessExpiryDate_days", 9999))
        return (s <= 0) or (t <= 0) or (rsk <= 0)

    def step(self, action):
        # same per-train reward shaping as before (exact user rules)
        assert self.action_space.contains(int(action)), "Invalid action"
        cur_idx = self.order[self.step_idx]
        info = {"raw_action": int(action), "day": self.day_index}
        reward = 0.0

        # Hard constraint
        fitness_expired = self._train_has_expired_fitness(cur_idx)
        if int(action) == 0 and fitness_expired:
            action = 1
            reward += -100.0
            info["overridden_due_to_fitness"] = True

        if int(action) == 0 and self.remaining_service <= 0:
            action = 1
            reward += -20.0
            info["overridden_due_to_quota"] = True

        row = self.work_df.iloc[cur_idx]

        # 1) fitness
        signalling_days = float(row.get("SignallingFitnessExpiryDate_days", 9999))
        telecom_days = float(row.get("TelecomFitnessExpiryDate_days", 9999))
        rolling_days = float(row.get("RollingStockFitnessExpiryDate_days", 9999))
        any_expired = (signalling_days <= 0) or (telecom_days <= 0) or (rolling_days <= 0)
        if int(action) == 0 and not any_expired:
            reward += 20.0

        # 2) jobcards
        open_jobs = int(row.get("OpenJobCards", 0))
        job_priority = float(row.get("JobCardPriority", 0.0))
        if int(action) == 0:
            reward -= 5.0 * float(open_jobs)
            if open_jobs == 0:
                reward += 15.0
            elif open_jobs <= 2:
                reward += 10.0
        if int(action) == 2 and job_priority >= 10.0:
            reward += 15.0

        # 3) mileage
        m_since = float(row.get("MileageSinceLastServiceKM", 0.0))
        if int(action) == 0:
            if m_since >= 10000.0:
                reward -= 30.0
            else:
                reward += 10.0
        else:
            if int(action) == 2 and m_since >= 10000.0:
                reward += 5.0

        # 4) branding
        brand_active = int(row.get("BrandingActive_flag", 0))
        if brand_active == 1:
            if int(action) == 0:
                reward += 15.0
            else:
                reward -= 5.0

        # 5) cleaning
        cleaning_slot = int(row.get("CleaningSlotStatus", 0))
        cleaning_required = int(row.get("CleaningRequired_flag", 0))
        if cleaning_slot == 2:
            if int(action) == 0:
                reward -= 20.0
            elif int(action) == 2:
                reward += 10.0
        elif cleaning_required == 1 and cleaning_slot == 0 and int(action) == 0:
            reward += 10.0

        # 6) stabling proxy
        stabling_order = float(row.get("StablingSequenceOrder", 9999))
        if int(action) == 0:
            if stabling_order <= 3:
                reward += 10.0
            else:
                reward -= 20.0

        # shunting small penalty
        shunts = float(row.get("ShuntingMovesRequired", 0.0))
        reward -= 0.5 * shunts

        # update per-day assigned actions
        self.assigned_actions_day[cur_idx] = int(action)
        if int(action) == 0:
            self.remaining_service -= 1
            self.total_shunting_cost += shunts

        # advance to next train
        self.step_idx += 1
        terminated = False
        truncated = False

        # if day complete (all trains assigned) -> apply day transition
        if self.step_idx >= self.n_trains:
            # compute day-level bonuses/penalties
            assigned_service = int((self.assigned_actions_day == 0).sum())
            if assigned_service < self.service_quota:
                reward += -50.0 * float(self.service_quota - assigned_service)
            if assigned_service == self.service_quota:
                reward += 50.0
            # brand completion approx
            if "BrandingActive_flag" in self.work_df.columns:
                brand_total = max(1, int(self.work_df["BrandingActive_flag"].sum()))
                brand_selected = int(((self.assigned_actions_day == 0) & (self.work_df["BrandingActive_flag"].astype(int).values == 1)).sum())
                reward += 10.0 * safe_div(brand_selected, brand_total)

            # log the day's assignments
            day_log = self.work_df.copy()
            day_log["AssignedAction"] = self.assigned_actions_day
            day_log["DayIndex"] = self.day_index
            fname = f"{self.log_dir}/assignments_day{self.day_index}.csv"
            day_log.to_csv(fname, index=False)

            # advance the world by one day
            self._advance_one_day()

            # append day_history and reset day variables for next day
            self.assigned_actions_history.append(self.assigned_actions_day.copy())
            # prepare for next day
            self.day_index += 1
            if self.day_index >= self.episode_days:
                terminated = True
                self.done = True
            else:
                # reset per-day trackers for new day
                self.step_idx = 0
                self.assigned_actions_day = np.full(self.n_trains, -1, dtype=np.int8)
                self.remaining_service = self.service_quota
                # recompute MOO surrogate scores for new day
                self._compute_and_attach_moo_scores(self.work_df)

        obs = self._get_obs() if not terminated else np.zeros(self.n_features + 3, dtype=np.float32)
        return obs, float(reward), bool(terminated), bool(truncated), info

    def _advance_one_day(self):
        """
        Apply the effects of today's assignments to work_df to produce next day's state.
        - In_Service -> increase mileage, exposure, update last cleaned date if applicable
        - Under_Maintenance -> reduce open jobcards
        - Randomly create new jobcards (Poisson) to simulate wear
        - Decrement fitness expiry days by 1
        - Update CleaningSlotStatus, CleaningRequired_flag in a simple way
        """
        # for reproducibility use numpy random
        for i in range(self.n_trains):
            assignment = int(self.assigned_actions_day[i])
            # update mileage
            if assignment == 0:
                # in service: add daily mileage
                self.work_df.at[i, "TotalMileageKM"] = float(self.work_df.at[i, "TotalMileageKM"]) + self.daily_mileage_if_in_service
                # mileage since last service increases
                self.work_df.at[i, "MileageSinceLastServiceKM"] = float(self.work_df.at[i, "MileageSinceLastServiceKM"]) + self.daily_mileage_if_in_service
                # exposure accrues if branded
                if int(self.work_df.at[i, "BrandingActive_flag"]) == 1:
                    self.work_df.at[i, "ExposureHoursAccrued"] = float(self.work_df.at[i, "ExposureHoursAccrued"]) + self.daily_exposure_hours
                # cleaning: if slot free, consider cleaned and reset flag
                if int(self.work_df.at[i, "CleaningSlotStatus"]) == 0:
                    self.work_df.at[i, "CleaningRequired_flag"] = 0
                    # last cleaned date -> reset days to large positive (we don't store actual dates here)
                    self.work_df.at[i, "LastCleanedDate_days"] = 30
                else:
                    # if cleaning not free, maybe cleaning remains required
                    pass
            elif assignment == 2:
                # maintenance day: reduce open jobcards
                oj = int(self.work_df.at[i, "OpenJobCards"])
                self.work_df.at[i, "OpenJobCards"] = max(0, oj - self.jobcard_reduction_if_maintenance)
                # maintenance often resets mileage_since_last_service
                self.work_df.at[i, "MileageSinceLastServiceKM"] = 0.0
                # cleaning may be completed during maintenance
                self.work_df.at[i, "CleaningRequired_flag"] = 0
            else:
                # Standby: small increase in jobcards probability
                pass

            # random new jobcards (Poisson with small lambda)
            if np.random.rand() < self.jobcard_new_per_day_lambda:
                self.work_df.at[i, "OpenJobCards"] = int(self.work_df.at[i, "OpenJobCards"]) + 1

            # decrement days to expiry for fitness certificates
            for col in ["SignallingFitnessExpiryDate_days", "TelecomFitnessExpiryDate_days", "RollingStockFitnessExpiryDate_days"]:
                if col in self.work_df.columns:
                    v = float(self.work_df.at[i, col])
                    self.work_df.at[i, col] = v - 1.0

        # recompute mileage variance/abs after updates (proxy)
        # simple recomputation: MileageBalanceVariance = var(TotalMileageKM)
        if "TotalMileageKM" in self.work_df.columns:
            try:
                var = float(self.work_df["TotalMileageKM"].astype(float).var())
                # set the same variance value for all rows (used by reward proxies)
                self.work_df["MileageBalanceVariance"] = var
                # compute simple abs diff to mean for each train
                mean_m = float(self.work_df["TotalMileageKM"].astype(float).mean())
                self.work_df["MileageBalanceAbs"] = (self.work_df["TotalMileageKM"].astype(float) - mean_m).abs()
            except Exception:
                pass

        # simple cleaning slot dynamics: free slots rotate randomly (this is arbitrary - replace with real schedule)
        for i in range(self.n_trains):
            if int(self.work_df.at[i, "CleaningSlotStatus"]) == 1:
                # assigned -> becomes in_progress next day with prob 0.7
                if np.random.rand() < 0.7:
                    self.work_df.at[i, "CleaningSlotStatus"] = 2
            elif int(self.work_df.at[i, "CleaningSlotStatus"]) == 2:
                # in_progress -> free next day with prob 0.8
                if np.random.rand() < 0.8:
                    self.work_df.at[i, "CleaningSlotStatus"] = 0

        # recompute any other derived fields if required

    def render(self, mode="human"):
        if self.done:
            print(f"Episode finished after {self.day_index} days. Assignment history:")
            for d, arr in enumerate(self.assigned_actions_history):
                labels = ["In_Service" if a==0 else ("Standby" if a==1 else "Under_Maintenance") for a in arr]
                print(f"Day {d}: {labels}")
        else:
            print(f"Day {self.day_index} step {self.step_idx}/{self.n_trains}. Remaining service: {self.remaining_service}")


# --- quick training usage example ---
if __name__ == "__main__":
    CSV_PATH = r"D:\User\Desktop\GT\VSC\KMRL\mono-repo\apps\AIML\final1output.csv"
    env = TrainSchedulingEnvMultiDay(CSV_PATH,
                                    service_quota=13,
                                    episode_days=7,
                                    daily_mileage_if_in_service=400.0,
                                    daily_exposure_hours=16.0,
                                    jobcard_reduction_if_maintenance=2,
                                    jobcard_new_per_day_lambda=0.05,
                                    today=None)
    venv = DummyVecEnv([lambda: env])
    model = PPO("MlpPolicy", venv, verbose=1, tensorboard_log="./kmrl_tb_multiday/")
    model.learn(total_timesteps=100000)  # increase as needed
    model.save("kmrl_multiday_ppo")
    obs, _ = env.reset()
    total_r = 0.0
    terminated = False
    while not terminated:
        action, _ = model.predict(obs, deterministic=False)
        obs, r, terminated, truncated, info = env.step(int(action))
        total_r += r
    print("Episode reward:", total_r)
    env.render()
    next_day_assignments = env.assigned_actions_day[0]  # first day only

    action_map = {0: "In_service", 1: "Standby", 2: "Under_maintenance"}
    next_day_assignments_str = [action_map[a] for a in next_day_assignments]

    # Load original CSV
    df = pd.read_csv(CSV_PATH)

    # Update OperationalStatus column
    df["OperationalStatus"] = next_day_assignments_str

    # Save CSV for next day
    df.to_csv("updated_trains_next_day.csv", index=False)
    print("✅ Saved updated_trains_next_day.csv with string OperationalStatus.")
