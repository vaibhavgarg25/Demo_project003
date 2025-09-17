# 🎯 MOO (Multi-Objective Optimization) Train Ranking API Documentation

## 📋 Overview

The MOO API provides train fleet ranking using Multi-Objective Optimization algorithm. It analyzes multiple train parameters to generate prioritized rankings for operational decision-making.

## 🚀 Base URL
```
http://localhost:8000/api/v1/moo
```

---

## 📌 API Endpoints

### 1. **`POST /rank`** - Universal Train Ranking Endpoint

**Description:** Rank train fleet using MOO algorithm with flexible response formats.

#### **Request**

**URL:** `POST /api/v1/moo/rank`

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | File | ✅ Yes | - | CSV file containing train fleet data |
| `format` | String | ❌ No | `json` | Response format: `json`, `csv`, or `simple` |
| `mileage_limit_before_service` | Integer | ❌ No | `10000` | Mileage limit before service required (≥1) |

**Request Body Structure:**
```
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="train_data.csv"
Content-Type: text/csv

[CSV file content]
--boundary
Content-Disposition: form-data; name="format"

json
--boundary
Content-Disposition: form-data; name="mileage_limit_before_service"

10000
--boundary--
```

#### **CSV Input File Format**

**Required Columns:**
- `TrainID` (String) - Unique train identifier

**Optional Columns (used in scoring):**
- `RollingStockFitnessStatus` (Boolean/String) - Rolling stock fitness certificate status
- `SignallingFitnessStatus` (Boolean/String) - Signalling fitness certificate status  
- `TelecomFitnessStatus` (Boolean/String) - Telecom fitness certificate status
- `JobCardStatus` (String) - Job card status ("open"/"close")
- `OpenJobCards` (Integer) - Number of open job cards
- `ClosedJobCards` (Integer) - Number of closed job cards
- `BrandingActive` (Boolean/String) - Whether branding campaign is active
- `ExposureHoursTarget` (Float) - Target exposure hours for branding
- `ExposureHoursAccrued` (Float) - Accrued exposure hours
- `TotalMileageKM` (Float) - Total mileage in kilometers
- `MileageSinceLastServiceKM` (Float) - Mileage since last service
- `MileageBalanceVariance` (Float) - Mileage balance variance
- `BrakepadWear%` (Float) - Brakepad wear percentage (0-100)
- `HVACWear%` (Float) - HVAC wear percentage (0-100)
- `CleaningRequired` (Boolean/String) - Whether cleaning is required
- `ShuntingMovesRequired` (Integer) - Number of shunting moves required
- `OperationalStatus` (String) - Current operational status

**Sample CSV Input:**
```csv
TrainID,RollingStockFitnessStatus,SignallingFitnessStatus,TelecomFitnessStatus,JobCardStatus,OpenJobCards,BrandingActive,TotalMileageKM,MileageSinceLastServiceKM,BrakepadWear%,HVACWear%,CleaningRequired,OperationalStatus
TRAIN_001,TRUE,TRUE,TRUE,close,0,FALSE,45000,2500,25.5,15.3,FALSE,In_Service
TRAIN_002,TRUE,FALSE,TRUE,open,2,TRUE,67000,8500,45.2,30.1,TRUE,Under_Maintenance
TRAIN_003,FALSE,TRUE,TRUE,close,0,FALSE,23000,1200,10.8,5.2,FALSE,Standby
```

#### **Responses**

### **Format: `json` (Default)**

**Content-Type:** `application/json`

**Response Structure:**
```json
{
  "success": true,
  "message": "Train ranking completed successfully using Multi-Objective Optimization",
  "total_trains": 150,
  "config_used": {
    "mileage_limit_before_service": 10000
  },
  "rankings": [
    {
      "train_id": "TRAIN_001",
      "score": 45.67,
      "rank": 1,
      "rolling_stock_fitness": true,
      "signalling_fitness": true,
      "telecom_fitness": true,
      "job_card_status": "close",
      "open_job_cards": 0,
      "branding_active": false,
      "total_mileage_km": 45000.0,
      "mileage_since_service_km": 2500.0,
      "mileage_balance_variance": 7500.0,
      "brakepad_wear_percent": 25.5,
      "hvac_wear_percent": 15.3,
      "cleaning_required": false,
      "shunting_moves_required": 0,
      "operational_status": "In_Service"
    }
  ]
}
```

### **Format: `csv`**

**Content-Type:** `text/csv`

**Headers:**
```
Content-Disposition: attachment; filename=moo_ranked_trains.csv
```

**Response:** CSV file download with all original columns plus `Score` and `Rank` columns at the end.

**Sample CSV Output:**
```csv
TrainID,RollingStockFitnessStatus,SignallingFitnessStatus,TelecomFitnessStatus,JobCardStatus,OpenJobCards,BrandingActive,TotalMileageKM,MileageSinceLastServiceKM,BrakepadWear%,HVACWear%,CleaningRequired,OperationalStatus,Score,Rank
TRAIN_001,TRUE,TRUE,TRUE,close,0,FALSE,45000,2500,25.5,15.3,FALSE,In_Service,45.67,1
TRAIN_002,TRUE,FALSE,TRUE,open,2,TRUE,67000,8500,45.2,30.1,TRUE,Under_Maintenance,0.0,150
TRAIN_003,FALSE,TRUE,TRUE,close,0,FALSE,23000,1200,10.8,5.2,FALSE,Standby,0.0,149
```

### **Format: `simple`**

**Content-Type:** `application/json`

**Response Structure:**
```json
[
  {
    "train_id": "TRAIN_001",
    "score": 45.67,
    "rank": 1
  },
  {
    "train_id": "TRAIN_003", 
    "score": 35.20,
    "rank": 2
  },
  {
    "train_id": "TRAIN_002",
    "score": 0.0,
    "rank": 3
  }
]
```

---

### 2. **`GET /info`** - Service Information

**Description:** Get comprehensive MOO service information including configuration and scoring criteria.

#### **Request**
```
GET /api/v1/moo/info
```

#### **Response**
```json
{
  "service": "moo",
  "status": "healthy",
  "message": "Multi-Objective Optimization service is operational",
  "algorithm": "Train Fleet Ranking using MOO scoring system",
  "version": "1.0.0",
  "endpoints": {
    "/rank": "Universal ranking endpoint with multiple response formats",
    "/info": "Service information and scoring criteria"
  },
  "default_config": {
    "mileage_limit_before_service": 10000
  },
  "response_formats": {
    "json": "Complete JSON response with detailed train metrics",
    "csv": "Downloadable CSV file (MOO.py equivalent)",
    "simple": "Lightweight JSON with ID, Score, Rank only"
  },
  "scoring_criteria": {
    "fitness_certificates": {
      "rolling_stock": {
        "points": 15,
        "critical": true,
        "description": "If FALSE, total score = 0"
      },
      "signalling": {
        "points": 10,
        "critical": true,
        "description": "If FALSE, total score = 0"
      },
      "telecom": {
        "points": 10,
        "critical": true,
        "description": "If FALSE, total score = 0"
      }
    },
    "job_cards": {
      "closed_status": {
        "points": 5,
        "description": "Bonus for closed job cards"
      },
      "open_count": {
        "points": "5 - (open_count * 2)",
        "description": "Penalty for open job cards"
      }
    },
    "branding": {
      "active_bonus": {
        "points": 3,
        "description": "Bonus for active branding campaigns"
      },
      "completion_bonus": {
        "points": "7 * (1 - completion_ratio)",
        "description": "Bonus based on incomplete campaigns"
      }
    },
    "mileage": {
      "total_mileage": {
        "under_50k": {"points": 5},
        "50k_to_150k": {"points": 2.5},
        "over_150k": {"points": 0}
      },
      "service_interval": {
        "formula": "5 - (mileage_since_service / 10000)",
        "description": "Penalty for overdue service"
      },
      "balance_variance": {
        "formula": "5 - (abs(variance) / 1000)",
        "description": "Penalty for mileage imbalance"
      }
    },
    "wear_and_tear": {
      "brakepad": {
        "formula": "10 - (wear_percent / 10)",
        "max_points": 10
      },
      "hvac": {
        "formula": "5 - (wear_percent / 10)",
        "max_points": 5
      }
    },
    "cleaning": {
      "not_required": {
        "points": 10,
        "description": "Bonus for clean trains"
      }
    },
    "operational": {
      "in_service": {
        "points": 2,
        "description": "Bonus for trains in service"
      }
    },
    "shunting": {
      "formula": "3 - (moves_required * 3)",
      "description": "Penalty for shunting moves required"
    }
  },
  "tie_breaking_order": [
    "Primary Score (higher is better)",
    "Job Card Priority (fewer open cards)",
    "Branding Completion Ratio (lower completion preferred)",
    "Mileage Balance Variance (lower variance preferred)",
    "Cleaning Priority (not required preferred)",
    "Shunting Priority (fewer moves preferred)"
  ]
}
```

---

## 🧮 Scoring Algorithm Details

### **Critical Fitness Certificates (35 points max)**
- **Rolling Stock Fitness:** 15 points (❌ If FALSE → Total Score = 0)
- **Signalling Fitness:** 10 points (❌ If FALSE → Total Score = 0)  
- **Telecom Fitness:** 10 points (❌ If FALSE → Total Score = 0)

### **Job Card Management (10 points max)**
- **Closed Status:** +5 points
- **Open Job Cards:** 5 - (open_count × 2) points

### **Branding Campaigns (10 points max)**
- **Active Campaign:** +3 points
- **Completion Bonus:** 7 × (1 - completion_ratio) points

### **Mileage Management (15 points max)**
- **Total Mileage:** 
  - < 50,000 km: +5 points
  - 50,000-150,000 km: +2.5 points
  - > 150,000 km: 0 points
- **Service Interval:** 5 - (mileage_since_service ÷ 10,000) points
- **Balance Variance:** 5 - (|variance| ÷ 1,000) points

### **Wear & Tear (15 points max)**
- **Brakepad Wear:** 10 - (wear% ÷ 10) points
- **HVAC Wear:** 5 - (wear% ÷ 10) points

### **Operations (15 points max)**
- **Cleaning Not Required:** +10 points
- **In Service Status:** +2 points
- **Shunting Moves:** 3 - (moves × 3) points

---

## 🔗 Usage Examples

### **cURL Examples**

#### **1. Get JSON Response (Default)**
```bash
curl -X POST "http://localhost:8000/api/v1/moo/rank" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv"
```

#### **2. Download CSV File**
```bash
curl -X POST "http://localhost:8000/api/v1/moo/rank?format=csv" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv" \
  --output ranked_trains.csv
```

#### **3. Get Simple Rankings**
```bash
curl -X POST "http://localhost:8000/api/v1/moo/rank?format=simple" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv"
```

#### **4. Custom Mileage Limit**
```bash
curl -X POST "http://localhost:8000/api/v1/moo/rank?format=json&mileage_limit_before_service=15000" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv"
```

### **Python Requests Example**
```python
import requests

# Upload file and get JSON response
with open('train_data.csv', 'rb') as file:
    response = requests.post(
        'http://localhost:8000/api/v1/moo/rank',
        files={'file': file},
        params={
            'format': 'json',
            'mileage_limit_before_service': 10000
        }
    )
    
if response.status_code == 200:
    ranking_data = response.json()
    print(f"Total trains: {ranking_data['total_trains']}")
    print(f"Top ranked train: {ranking_data['rankings'][0]['train_id']}")
```

### **JavaScript/Node.js Example**
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('train_data.csv'));

axios.post('http://localhost:8000/api/v1/moo/rank?format=simple', form, {
    headers: form.getHeaders()
})
.then(response => {
    console.log('Top 5 trains:', response.data.slice(0, 5));
})
.catch(error => {
    console.error('Error:', error.response.data);
});
```

---

## ❌ Error Responses

### **400 Bad Request**
```json
{
  "detail": "Only CSV files are supported"
}
```

### **400 Bad Request - Missing Columns**
```json
{
  "detail": "Missing required columns: ['TrainID']"
}
```

### **400 Bad Request - Empty File**
```json
{
  "detail": "CSV file is empty"
}
```

### **500 Internal Server Error**
```json
{
  "detail": "Internal server error during MOO ranking: [error details]"
}
```

---

## 📊 Performance Notes

- **Processing Time:** ~1-3 seconds for 150 trains
- **File Size Limit:** Recommended < 10MB
- **Memory Usage:** ~50MB for 1000 trains
- **Concurrent Requests:** Supported (stateless operations)

---

## 🎯 Quick Start Checklist

1. ✅ Prepare CSV file with `TrainID` column
2. ✅ Choose response format (`json`, `csv`, or `simple`)
3. ✅ Send POST request to `/api/v1/moo/rank`
4. ✅ Process the ranked results

**Need more info?** Visit the interactive API docs at: `http://localhost:8000/docs`