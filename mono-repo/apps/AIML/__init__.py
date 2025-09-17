"""AIML module initialization"""

// Add the AIML directory to Python path if needed
import sys
from pathlib import Path
import os

// Get the directory of this file
AIML_DIR = Path(__file__).parent
sys.path.append(str(AIML_DIR))

// Set environment variables for RL model
os.environ["RL_CSV_PATH"] = str(AIML_DIR / "final1output.csv")
os.environ["RL_MODEL_PATH"] = str(AIML_DIR / "kmrl_multiday_ppo")