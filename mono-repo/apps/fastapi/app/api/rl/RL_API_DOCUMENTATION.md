# 🎯 RL (Reinforcement Learning) Train Scheduling API

## 📋 Overview

The RL API provides train fleet scheduling using Reinforcement Learning algorithm. It analyzes multiple train parameters to generate optimal scheduling assignments for operational decision-making.

## 🚀 Base URL
```
http://localhost:8000/api/v1/rl
```

---

## 📌 API Endpoints

### 1. **`POST /schedule`** - Universal Train Scheduling Endpoint

**Description:** Schedule train fleet using RL algorithm with flexible response formats.

#### **Request**

**URL:** `POST /api/v1/rl/schedule`

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | File | ✅ Yes | - | CSV file containing train fleet data |
| `format` | String | ❌ No | `json` | Response format: `json`, `csv`, or `simple` |
| `service_quota` | Integer | ❌ No | `13` | Number of trains that can be scheduled for service per day |
| `episode_days` | Integer | ❌ No | `7` | Number of days to simulate |
| `daily_mileage_if_in_service` | Float | ❌ No | `400.0` | Daily mileage if train is in service |
| `daily_exposure_hours` | Float | ❌ No | `16.0` | Daily exposure hours if train is branded |
| `jobcard_reduction_if_maintenance` | Integer | ❌ No | `2` | Jobcard reduction if train is under maintenance |
| `jobcard_new_per_day_lambda` | Float | ❌ No | `0.1` | Lambda for new jobcard generation |

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
--boundary--
```

#### **CSV Input File Format**

**Required Columns:**
- `TrainID` (String) - Unique train identifier

**Optional Columns (used in scheduling):**
- `RollingStockFitnessStatus` (Boolean/String) - Rolling stock fitness certificate status
- `SignallingFitnessStatus` (Boolean/String) - Signalling fitness certificate status  
- `TelecomFitnessStatus` (Boolean/String) - Telecom fitness certificate status
- `JobCardStatus` (String) - Job card status ("open"/"close")
- `OpenJobCards` (Integer) - Number of open job cards
- `BrandingActive` (Boolean/String) - Whether branding campaign is active
- `TotalMileageKM` (Float) - Total mileage in kilometers
- `MileageSinceLastServiceKM` (Float) - Mileage since last service
- `BrakepadWear%` (Float) - Brakepad wear percentage (0-100)
- `HVACWear%` (Float) - HVAC wear percentage (0-100)
- `CleaningRequired` (Boolean/String) - Whether cleaning is required
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
  "message": "RL scheduling completed successfully",
  "total_trains": 150,
  "episode_days": 7,
  "day_index": 7,
  "total_shunting_cost": 25.5,
  "final_reward": 1234.5,
  "assignments": [
    {
      "TrainID": "TRAIN_001",
      "OperationalStatus": "In_Service",
      "Day": 1,
      "Reward": 20.5
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

**Response:** CSV file download with all original columns plus `OperationalStatus` and `Day` fields.

**Sample CSV Output:**
```csv
TrainID,RollingStockFitnessStatus,SignallingFitnessStatus,TelecomFitnessStatus,JobCardStatus,OpenJobCards,BrandingActive,TotalMileageKM,MileageSinceLastServiceKM,BrakepadWear%,HVACWear%,CleaningRequired,OperationalStatus,Day
TRAIN_001,TRUE,TRUE,TRUE,close,0,FALSE,45000,2500,25.5,15.3,FALSE,In_Service,1
TRAIN_002,TRUE,FALSE,TRUE,open,2,TRUE,67000,8500,45.2,30.1,TRUE,Under_Maintenance,2
TRAIN_003,FALSE,TRUE,TRUE,close,0,FALSE,23000,1200,10.8,5.2,FALSE,Standby,3
```

### **Format: `simple`**

**Content-Type:** `application/json`

**Response Structure:**
```json
[
  {
    "TrainID": "TRAIN_001",
    "OperationalStatus": "In_Service",
    "Day": 1
  },
  {
    "TrainID": "TRAIN_003", 
    "OperationalStatus": "Standby",
    "Day": 3
  }
]
```

---

### 2. **`GET /info`** - Service Information

**Description:** Get comprehensive RL service information

#### **Request**
```
GET /api/v1/rl/info
```

#### **Response**
```json
{
  "service": "rl",
  "status": "healthy",
  "message": "Reinforcement Learning service is operational",
  "algorithm": "PPO (Proximal Policy Optimization)",
  "version": "1.0.0",
  "endpoints": {
    "/schedule": "Universal scheduling endpoint with multiple response formats",
    "/info": "Service information and algorithm details"
  },
  "default_config": {
    "service_quota": 13,
    "episode_days": 7,
    "daily_mileage_if_in_service": 400.0,
    "daily_exposure_hours": 16.0,
    "jobcard_reduction_if_maintenance": 2,
    "jobcard_new_per_day_lambda": 0.1
  },
  "response_formats": {
    "json": "Complete JSON response with detailed train metrics",
    "csv": "Downloadable CSV file with assignments",
    "simple": "Lightweight JSON with only Train ID and Operational Status"
  },
  "scoring_criteria": {
    "fitness": "If expired, train can't be scheduled for service",
    "jobcards": "Reward for closed jobcards, penalty for open ones",
    "mileage": "Reward for staying within mileage limits",
    "branding": "Reward for active campaigns",
    "cleaning": "Penalty if cleaning is required",
    "shunting": "Penalty for shunting moves required"
  },
  "action_space": {
    "In_Service": 0,
    "Standby": 1,
    "Under_Maintenance": 2
  }
}
```

---

## 🔗 Usage Examples

### **cURL Examples**

#### **1. Get JSON Response (Default)**
```bash
curl -X POST "http://localhost:8000/api/v1/rl/schedule" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv"
```

#### **2. Download CSV File**
```bash
curl -X POST "http://localhost:8000/api/v1/rl/schedule?format=csv" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv" \
  --output rl_schedule.csv
```

#### **3. Get Simple Schedule**
```bash
curl -X POST "http://localhost:8000/api/v1/rl/schedule?format=simple" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv"
```

#### **4. Custom Scheduling Parameters**
```bash
curl -X POST "http://localhost:8000/api/v1/rl/schedule?format=json&service_quota=15&episode_days=10" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@train_data.csv"
```

### **Python Requests Example**
```python
import requests

// Upload file and get JSON response
with open('train_data.csv', 'rb') as file:
    response = requests.post(
        'http://localhost:8000/api/v1/rl/schedule',
        files={'file': file},
        params={
            'format': 'json',
            'service_quota': 15,
            'episode_days': 10
        }
    )
    
if response.status_code == 200:
    scheduling_data = response.json()
    print(f"Total trains: {scheduling_data['total_trains']}")
    print(f"Top 5 assignments: {scheduling_data['assignments'][:5]}")
```

### **JavaScript/Node.js Example**
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('train_data.csv'));

axios.post('http://localhost:8000/api/v1/rl/schedule?format=simple', form, {
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
  "detail": "Internal server error during RL scheduling: [error details]"
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
3. ✅ Send POST request to `/api/v1/rl/schedule`
4. ✅ Process the scheduling results

**Need more info?** Visit the interactive API docs at: `http://localhost:8000/docs`