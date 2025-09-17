# KochiMetro Pipeline System - API Documentation

## Overview
This document provides complete API documentation for the KochiMetro train management system with file-based pipeline communication.

## System Architecture
- **Backend Service**: Node.js/Express (Port: 3000)
- **FastAPI Service**: Python FastAPI (Port: 8000)
- **Communication**: File path-based via shared storage
- **Storage**: `/shared/storage/` with subdirectories: `input/`, `output/`, `temp/`

## API Purpose & Usage

### **Why JSON vs CSV?**

#### **JSON Endpoint (`/api/pipeline/start`):**
- **Purpose**: For **simplified, real-time** train data
- **Use Case**: When frontend applications need to send **transformed/filtered** data
- **Data Source**: Typically from live tracking systems, mobile apps, or dashboards
- **Structure**: Simplified model (7 fields) for basic simulation

#### **CSV Endpoint (`/api/pipeline/start-csv`) - RECOMMENDED:**
- **Purpose**: For **comprehensive maintenance data** like your `FINAL_DATA_1.csv`
- **Use Case**: When you have **complete operational reports** with 30+ data points
- **Data Source**: Maintenance systems, depot management, comprehensive reports
- **Structure**: Full data model (30+ fields) for advanced analytics

### **Your Data Analysis:**
Your `FINAL_DATA_1.csv` contains **rich maintenance and operational data**:
- ✅ **25 trains** (T01-T25) with names (Krishna, Tapti, Nila, etc.)
- ✅ **Fitness status** for Rolling Stock, Signalling, Telecom systems
- ✅ **Maintenance data**: Brake wear, HVAC wear, mileage tracking
- ✅ **Operational status**: In_Service, Under_Maintenance, Standby
- ✅ **Branding campaigns**: Active campaigns with exposure tracking
- ✅ **Bay management**: Cleaning schedules, bay positions

**Recommendation**: Use `/api/pipeline/start-csv` for your comprehensive dataset!

## Base URLs
- Backend: `http://localhost:3000`
- FastAPI: `http://localhost:8000`
- FastAPI Interactive Docs: `http://localhost:8000/docs`

---

## Backend API Endpoints (Node.js)

### 1. Start Pipeline (JSON)
**POST** `/api/pipeline/start`

Initiates the pipeline with simplified train data structure (legacy endpoint).

**Request Body:**
```json
{
  "trains": [
    {
      "trainId": "string",
      "route": "string",
      "capacity": "number",
      "currentLoad": "number",
      "speed": "number",
      "location": "string",
      "status": "string"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/pipeline/start \
  -H "Content-Type: application/json" \
  -d '{
    "trains": [
      {
        "trainId": "T01",
        "route": "Aluva-Pettah",
        "capacity": 300,
        "currentLoad": 150,
        "speed": 45.5,
        "location": "Edapally",
        "status": "In_Service"
      }
    ]
  }'
```

### 2. Start Pipeline (CSV Upload) - **RECOMMENDED**
**POST** `/api/pipeline/start-csv`

Initiates the pipeline by uploading your actual FINAL_DATA_1.csv file directly.

**Request Body:** `multipart/form-data`
- `file`: CSV file (your FINAL_DATA_1.csv)
- `days_to_simulate`: number (optional, default: 1)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/pipeline/start-csv \
  -F "file=@FINAL_DATA_1.csv" \
  -F "days_to_simulate=3"
```

**CSV Structure Expected:**
```csv
Trainname,TrainID,CURRENT_DATE,RollingStockFitnessStatus,SignallingFitnessStatus,TelecomFitnessStatus,RollingStockFitnessExpiryDate,SignallingFitnessExpiryDate,TelecomFitnessExpiryDate,JobCardStatus,OpenJobCards,ClosedJobCards,LastJobCardUpdate,BrandingActive,BrandCampaignID,ExposureHoursAccrued,ExposureHoursTarget,ExposureDailyQuota,TotalMileageKM,MileageSinceLastServiceKM,MileageBalanceVariance,BrakepadWear%,HVACWear%,CleaningRequired,CleaningSlotStatus,BayOccupancyIDC,LastCleanedDate,BayPositionID,ShuntingMovesRequired,StablingSequenceOrder,OperationalStatus
Krishna,T01,15-09-2025,FALSE,TRUE,FALSE,12-08-2025,01-03-2026,10-07-2025,open,3,7,17-03-2023,TRUE,KMM-RLJ-WRP-25-01,288,320,16,4759,2339,7661,40,59,TRUE,booked,BAY_08,05-08-2023,15,0,1,Under_Maintenance
```

**Response:**
```json
{
  "success": true,
  "message": "Pipeline started successfully with CSV data",
  "runId": "run_1726567890123",
  "filePath": "/shared/storage/input/user_upload_run_1726567890123.csv",
  "trainsProcessed": 25,
  "metadata": {
    "originalFilename": "FINAL_DATA_1.csv",
    "uploadedAt": "2024-09-17T10:30:00Z"
  }
}
```

### 2. Webhook Handlers

#### Simulation Complete Webhook
**POST** `/api/webhook/simulation-complete`

Receives notification when simulation service completes processing.

**Request Body:**
```json
{
  "runId": "string",
  "status": "success" | "error",
  "outputFilePath": "string",
  "error": "string (optional)",
  "metadata": {
    "processedAt": "ISO date string",
    "simulationDuration": "number (seconds)"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/webhook/simulation-complete \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "run_1726567890123",
    "status": "success",
    "outputFilePath": "/shared/storage/output/simulation_results_run_1726567890123.csv",
    "metadata": {
      "processedAt": "2024-09-17T10:30:00Z",
      "simulationDuration": 45.2
    }
  }'
```

#### MOO Complete Webhook
**POST** `/api/webhook/moo-complete`

**Request Body:** (Same structure as simulation webhook)
```json
{
  "runId": "string",
  "status": "success" | "error", 
  "outputFilePath": "string",
  "error": "string (optional)",
  "metadata": {
    "processedAt": "ISO date string",
    "optimizationIterations": "number"
  }
}
```

#### RL Complete Webhook
**POST** `/api/webhook/rl-complete`

**Request Body:** (Same structure as other webhooks)
```json
{
  "runId": "string",
  "status": "success" | "error",
  "outputFilePath": "string", 
  "error": "string (optional)",
  "metadata": {
    "processedAt": "ISO date string",
    "trainingEpisodes": "number"
  }
}
```

---

## FastAPI Endpoints (Python)

### Simulation Service

#### 1. Start Simulation (JSON)
**POST** `/simulation/start`

**Request Body:**
```json
{
  "trains": [
    {
      "trainId": "string",
      "route": "string", 
      "capacity": "number",
      "currentLoad": "number",
      "speed": "number",
      "location": "string",
      "status": "string"
    }
  ],
  "days_to_simulate": "number (optional, default: 1)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "trains": [
      {
        "trainId": "T001",
        "route": "Aluva-Pettah", 
        "capacity": 300,
        "currentLoad": 150,
        "speed": 45.5,
        "location": "Edapally",
        "status": "running"
      }
    ],
    "days_to_simulate": 2
  }'
```

#### 2. Start Simulation from File Path
**POST** `/simulation/start-from-file`

**Request Body:**
```json
{
  "file_path": "string",
  "runId": "string",
  "days_to_simulate": "number (optional, default: 1)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/simulation/start-from-file \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/shared/storage/input/user_upload_run_1726567890123.csv",
    "runId": "run_1726567890123",
    "days_to_simulate": 1
  }'
```

#### 3. Start Simulation (CSV Upload)
**POST** `/simulation/start-csv`

**Request Body:** `multipart/form-data`
- `file`: CSV file
- `days_to_simulate`: number (optional)

**Example Request:**
```bash
curl -X POST http://localhost:8000/simulation/start-csv \
  -F "file=@train_data.csv" \
  -F "days_to_simulate=3"
```

#### 4. Simple Simulation Start
**POST** `/simulation/simple-start`

**Request Body:**
```json
{
  "message": "string (optional)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/simulation/simple-start \
  -H "Content-Type: application/json" \
  -d '{"message": "Start basic simulation"}'
```

### MOO (Multi-Objective Optimization) Service

#### 1. Start MOO Optimization
**POST** `/moo/start`

**Request Body:** (Same as simulation start)
```json
{
  "trains": [
    {
      "trainId": "string",
      "route": "string",
      "capacity": "number", 
      "currentLoad": "number",
      "speed": "number",
      "location": "string",
      "status": "string"
    }
  ]
}
```

#### 2. Start MOO from File Path
**POST** `/moo/start-from-file`

**Request Body:**
```json
{
  "file_path": "string",
  "runId": "string"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/moo/start-from-file \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/shared/storage/output/simulation_results_run_1726567890123.csv",
    "runId": "run_1726567890123"
  }'
```

#### 3. Start MOO (CSV Upload)
**POST** `/moo/start-csv`

**Request Body:** `multipart/form-data`
- `file`: CSV file

**Example Request:**
```bash
curl -X POST http://localhost:8000/moo/start-csv \
  -F "file=@simulation_results.csv"
```

### RL (Reinforcement Learning) Service

#### 1. Start RL Training
**POST** `/rl/start`

**Request Body:** (Same structure as other services)
```json
{
  "trains": [
    {
      "trainId": "string",
      "route": "string",
      "capacity": "number",
      "currentLoad": "number", 
      "speed": "number",
      "location": "string",
      "status": "string"
    }
  ]
}
```

#### 2. Start RL from File Path
**POST** `/rl/start-from-file`

**Request Body:**
```json
{
  "file_path": "string",
  "runId": "string"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/rl/start-from-file \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/shared/storage/output/moo_results_run_1726567890123.csv",
    "runId": "run_1726567890123"
  }'
```

#### 3. Start RL (CSV Upload)
**POST** `/rl/start-csv`

**Request Body:** `multipart/form-data`
- `file`: CSV file

**Example Request:**
```bash
curl -X POST http://localhost:8000/rl/start-csv \
  -F "file=@moo_results.csv"
```

---

## CSV File Formats

### Input Train Data CSV (Simplified - Legacy)
Required columns for JSON endpoint:
```csv
trainId,route,capacity,currentLoad,speed,location,status
T001,Aluva-Pettah,300,150,45.5,Edapally,running
T002,Pettah-Aluva,300,200,50.0,MG Road,running
```

### Input Train Data CSV (Full Structure - RECOMMENDED)
Your actual FINAL_DATA_1.csv structure:
```csv
Trainname,TrainID,CURRENT_DATE,RollingStockFitnessStatus,SignallingFitnessStatus,TelecomFitnessStatus,RollingStockFitnessExpiryDate,SignallingFitnessExpiryDate,TelecomFitnessExpiryDate,JobCardStatus,OpenJobCards,ClosedJobCards,LastJobCardUpdate,BrandingActive,BrandCampaignID,ExposureHoursAccrued,ExposureHoursTarget,ExposureDailyQuota,TotalMileageKM,MileageSinceLastServiceKM,MileageBalanceVariance,BrakepadWear%,HVACWear%,CleaningRequired,CleaningSlotStatus,BayOccupancyIDC,LastCleanedDate,BayPositionID,ShuntingMovesRequired,StablingSequenceOrder,OperationalStatus
Krishna,T01,15-09-2025,FALSE,TRUE,FALSE,12-08-2025,01-03-2026,10-07-2025,open,3,7,17-03-2023,TRUE,KMM-RLJ-WRP-25-01,288,320,16,4759,2339,7661,40,59,TRUE,booked,BAY_08,05-08-2023,15,0,1,Under_Maintenance
Tapti,T02,15-09-2025,TRUE,TRUE,TRUE,14-05-2026,22-04-2026,17-03-2026,close,0,0,01-02-2025,TRUE,KMM-RLJ-WRP-25-02,305,320,16,15033,1489,8511,11,17,FALSE,free,NULL,20-01-2023,1,0,1,In_Service
```

**Key Columns Explanation:**
- `TrainID`: T01-T25 (matches your data)
- `OperationalStatus`: In_Service, Under_Maintenance, Standby
- `TotalMileageKM`: Total distance traveled
- `BrakepadWear%`: Maintenance indicator (0-100%)
- `HVACWear%`: HVAC system wear indicator
- `BrandingActive`: TRUE/FALSE for advertising campaigns
- `CleaningRequired`: TRUE/FALSE maintenance flag

### Simulation Results CSV
Expected output columns:
```csv
trainId,route,simulatedCapacity,averageLoad,efficiency,delayMinutes,fuelConsumption
T001,Aluva-Pettah,300,175,0.85,2.5,45.2
T002,Pettah-Aluva,300,225,0.90,1.2,42.8
```

### MOO Results CSV
Expected output columns:
```csv
trainId,route,optimizedCapacity,recommendedLoad,efficiencyScore,costOptimization,energyOptimization
T001,Aluva-Pettah,300,180,0.92,0.78,0.85
T002,Pettah-Aluva,300,220,0.88,0.82,0.79
```

### RL Results CSV
Expected output columns:
```csv
trainId,route,rlOptimizedSchedule,predictedLoad,rewardScore,actionRecommendation
T001,Aluva-Pettah,"08:00-20:00",185,0.94,increase_frequency
T002,Pettah-Aluva,"06:00-22:00",210,0.91,maintain_schedule
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "runId": "run_1726567890123",
  "outputFilePath": "/shared/storage/output/results_run_1726567890123.csv",
  "metadata": {
    "processedAt": "2024-09-17T10:30:00Z",
    "processingTime": 45.2
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "details": "Additional error details",
  "runId": "run_1726567890123 (if applicable)"
}
```

---

## Complete Pipeline Flow Example

1. **Start Pipeline:**
```bash
curl -X POST http://localhost:3000/api/pipeline/start \
  -H "Content-Type: application/json" \
  -d '{"trains": [{"trainId": "T001", "route": "Aluva-Pettah", "capacity": 300, "currentLoad": 150, "speed": 45.5, "location": "Edapally", "status": "running"}]}'
```

2. **Backend automatically triggers FastAPI simulation:**
```bash
# This happens automatically
curl -X POST http://localhost:8000/simulation/start-from-file \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/shared/storage/input/user_upload_run_1726567890123.csv", "runId": "run_1726567890123", "days_to_simulate": 1}'
```

3. **Simulation completes and sends webhook:**
```bash
# This happens automatically
curl -X POST http://localhost:3000/api/webhook/simulation-complete \
  -H "Content-Type: application/json" \
  -d '{"runId": "run_1726567890123", "status": "success", "outputFilePath": "/shared/storage/output/simulation_results_run_1726567890123.csv"}'
```

4. **Process continues through MOO and RL services...**

---

## Testing the APIs

### Using FastAPI Interactive Documentation
Visit `http://localhost:8000/docs` for interactive API testing with Swagger UI.

### Using Postman
Import the endpoints using the base URLs and request examples provided above.

### Using curl
All examples above can be run directly in your terminal.

---

## Environment Variables

### Backend (.env)
```env
PORT=3000
FAST_API_BASE_URI=http://localhost:8000
SHARED_STORAGE_PATH=/shared/storage
NODE_ENV=development
```

### FastAPI (.env)
```env
SHARED_STORAGE_PATH=/shared/storage
BACKEND_WEBHOOK_BASE_URL=http://localhost:3000/api/webhook
ALLOWED_HOSTS=localhost,127.0.0.1
DEBUG=true
```

---

## Error Codes

- **400**: Bad Request - Invalid request body or parameters
- **404**: Not Found - Endpoint or file not found
- **422**: Validation Error - Request body validation failed
- **500**: Internal Server Error - Processing error

For detailed error information, check the response body and server logs.