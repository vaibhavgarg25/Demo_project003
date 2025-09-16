import pandas as pd

# ----------------------------
# PARAMETERS / CONSTANTS
# ----------------------------
MILEAGE_LIMIT_BEFORE_SERVICE = 10000  # as per metro standard

# ----------------------------
# SCORING FUNCTION
# ----------------------------
def calculate_score(row):
    score = 0
    
    # ✅ Rolling stock / signalling / telecom fitness
    if row["RollingStockFitnessStatus"]==True:
        score += 15
    else:
        score=0
        return score

    if row["SignallingFitnessStatus"]==True:
        score += 10
    else:
        score=0
        return score
    if row["TelecomFitnessStatus"]==True:
        score += 10
    else:
        score=0
        return score
    
    # ✅ Job Card Status (close = healthy)
    if isinstance(row["JobCardStatus"], str):
        score += 5 if row["JobCardStatus"].strip().lower() == "close" else 0
    
    # ✅ Open Job Cards (fewer is better, negative impact)
    if row["OpenJobCards"] >= 0:
        score += max(0, 5 - (row["OpenJobCards"]*2))
    
    # ✅ Branding Priority
    if row["BrandingActive"]:
        if row["BrandingActive"]=='TRUE':
            score +=3
            if row["ExposureHoursTarget"] > 0:
                completion_ratio = row["ExposureHoursAccrued"] / row["ExposureHoursTarget"]
                branding_points = 7 * (1 - completion_ratio)
                score += max(0, branding_points)

    if row["TotalMileageKM"]:
        if row["TotalMileageKM"]<50000:
            score+=5
        elif row["TotalMileageKM"]>=50000 and row["TotalMileageKM"]<150000:
            score+=2.5

    # ✅ Mileage since last service (lower = better)
    if row["MileageSinceLastServiceKM"] >= 0:
        mileage_penalty = row["MileageSinceLastServiceKM"] / MILEAGE_LIMIT_BEFORE_SERVICE
        mileage_points = max(0, int(5 - (mileage_penalty /10000)))
        score += mileage_points
    
    if row["MileageBalanceVariance"]:
        milagebalance = row["MileageBalanceVariance"]
        mbv = max(0,5 - (abs(milagebalance)/1000))
        score+=mbv


    # ✅ Wear and Tear
    score += max(0, 10 - int(row["BrakepadWear%"] / 10))  # 0–100%
    score += max(0, 5 - int(row["HVACWear%"] / 10))      # 0–100%
    
    # ✅ Cleaning Required
    score += 10 if not row["CleaningRequired"] else 0
    
    if row["ShuntingMovesRequired"]:
        smr = row["ShuntingMovesRequired"]
        smrscore = max(0,3 - (smr*3))
        score+=smrscore

    # ✅ Operational Status
    if isinstance(row["OperationalStatus"], str):
        status = row["OperationalStatus"].strip().lower()
        if status == "in service":
            score += 2
        # under maintenance = 0
    
    score = (score)
    return round(score,2)

# ----------------------------
# MAIN FUNCTION
# ----------------------------
def rank_trains(input_csv):
    df = pd.read_csv(input_csv)
    
    # Calculate scores
    df["Score"] = df.apply(calculate_score, axis=1)
    
    df["JobCardPriority"] = df.apply(
    lambda r: (r["OpenJobCards"] if r["JobCardStatus"].strip().lower() == "open" else 0), axis=1
)

    df["BrandingCompletionRatio"] = df.apply(
        lambda r: (r["ExposureHoursAccrued"] / r["ExposureHoursTarget"]) 
                if r["BrandingActive"] and r["ExposureHoursTarget"] > 0 else 1,
        axis=1
    )

    df["MileageBalanceAbs"] = df["MileageBalanceVariance"].abs()

    df["CleaningPriority"] = df["CleaningRequired"].apply(lambda x: 1 if x else 0)

    df["ShuntingPriority"] = df["ShuntingMovesRequired"]

    # ----------------------------
    # Final Ranking with Tie-Break
    # ----------------------------
    df = df.sort_values(
        by=[
            "Score",                 # Primary score
            "JobCardPriority",       # 1. Job cards (lower = better)
            "BrandingCompletionRatio", # 2. Branding ratio (lower = better)
            "MileageBalanceAbs",     # 3. Mileage balancing (lower variance = better)
            "CleaningPriority",      # 4. Cleaning required (0 better than 1)
            "ShuntingPriority"       # 5. Shunting moves (fewer = better)
        ],
        ascending=[False, True, True, True, True, True]
    )

    # Assign unique ranks
    df["Rank"] = range(1, len(df) + 1)
    
    # Print ranked output
    for _, row in df.iterrows():
        print(f"Train {row['TrainID']} | Score: {row['Score']} | Rank: {row['Rank']}")
    
    return df

# ----------------------------
# RUN SCRIPT
# ----------------------------
if __name__ == "__main__":
    ranked_df = rank_trains(r"D:\User\Desktop\GT\VSC\KMRL\mono-repo\apps\AIML\FINAL_DATA_1.csv")
    cols = list(ranked_df.columns)
    if "Score" in cols and "Rank" in cols:
        # Move Score and Rank to front
        cols.remove("Score")
        cols.remove("Rank")
        cols = cols + ["Score", "Rank"]
        ranked_df = ranked_df[cols]
    
    # Save with scores & ranks
    ranked_df.to_csv("final1output.csv", index=False)
