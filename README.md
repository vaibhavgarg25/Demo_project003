# Quick Setup Guide - File Path-Based Pipeline

## Prerequisites
- Node.js (Backend)
- Python 3.8+ (FastAPI)
- Shared storage accessible by both services

## Setup Steps

### 1. Environment Configuration

#### Create Backend .env file
```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```bash
DATABASE_URL="your_database_url_here"
FAST_API_BASE_URI="http://localhost:8000/api/v1"
SHARED_STORAGE_PATH="/tmp/shared_storage"  # Local development
```

#### Create FastAPI .env file
```bash
cp apps/fastapi/.env.example apps/fastapi/.env
```

Edit `apps/fastapi/.env`:
```bash
DATABASE_URL="your_database_url_here"
SHARED_STORAGE_PATH="/tmp/shared_storage"  # Must match backend
BACKEND_BASE_URL="http://localhost:3000"
```

### 2. Create Shared Storage Directory

#### Local Development (Unix/Mac)
```bash
mkdir -p /tmp/shared_storage
chmod 755 /tmp/shared_storage
```

#### Local Development (Windows)
```cmd
mkdir C:\shared_storage
```
Update .env files to use `C:/shared_storage`

#### Docker Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    volumes:
      - shared_storage:/shared/storage
    environment:
      - SHARED_STORAGE_PATH=/shared/storage
  
  fastapi:
    volumes:
      - shared_storage:/shared/storage
    environment:
      - SHARED_STORAGE_PATH=/shared/storage

volumes:
  shared_storage:
```

### 3. Install Dependencies

#### Backend
```bash
cd apps/backend
npm install
```

#### FastAPI
```bash
cd apps/fastapi
pip install -r requirements.txt
```

### 4. Start Services

#### Terminal 1 - Backend
```bash
cd apps/backend
npm run dev
```

#### Terminal 2 - FastAPI
```bash
cd apps/fastapi
python -m uvicorn app.main:app --reload --port 8000
```

### 5. Verify Setup

#### Check Storage Initialization
Both services should log storage directory creation on startup:
```
[Storage] Directory ensured: /tmp/shared_storage/input
[Storage] Directory ensured: /tmp/shared_storage/output
[Storage] Directory ensured: /tmp/shared_storage/temp
```

#### Test Pipeline
```bash
# Trigger manual pipeline run
curl -X POST http://localhost:3000/api/webhook/start

# Check pipeline status via logs or SSE events
curl http://localhost:3000/api/events
```

## API Testing

### Test File-Based Endpoints

#### 1. Create test CSV file
```bash
echo "TrainID,trainname,operationalStatus
T001,Train A,In_Service
T002,Train B,Standby" > test_train_data.csv
```

#### 2. Save to shared storage
```bash
cp test_train_data.csv /tmp/shared_storage/input/user_upload_test.csv
```

#### 3. Test Simulation
```bash
curl -X POST http://localhost:8000/api/v1/simulation/start-from-file \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/tmp/shared_storage/input/user_upload_test.csv",
    "runId": "test123",
    "days_to_simulate": 1
  }'
```

#### 4. Test MOO
```bash
curl -X POST http://localhost:8000/api/v1/moo/rank-from-file \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_result_file_path": "/tmp/shared_storage/output/simulation_result_test123.csv",
    "runId": "test123"
  }'
```

#### 5. Test RL
```bash
curl -X POST http://localhost:8000/api/v1/rl/schedule-from-file \
  -H "Content-Type: application/json" \
  -d '{
    "moo_result_file_path": "/tmp/shared_storage/output/moo_result_test123.csv",
    "runId": "test123"
  }'
```

## Troubleshooting

### Common Issues

#### Storage Permission Errors
```bash
# Fix permissions (Unix/Mac)
sudo chmod -R 755 /tmp/shared_storage
sudo chown -R $USER:$USER /tmp/shared_storage
```

#### Service Communication Errors
- Verify services are running on correct ports
- Check firewall settings
- Verify environment variables match

#### File Not Found Errors
```bash
# Check file existence
ls -la /tmp/shared_storage/input/
ls -la /tmp/shared_storage/output/

# Check service logs
tail -f apps/backend/logs/app.log
tail -f apps/fastapi/logs/app.log
```

### Monitoring

#### Check Storage Stats
```bash
# Backend
curl http://localhost:3000/api/storage/stats

# FastAPI  
curl http://localhost:8000/api/v1/storage/stats
```

#### View Pipeline Status
```bash
# Get running pipelines
curl http://localhost:3000/api/webhook/runs

# Get specific run
curl http://localhost:3000/api/webhook/runs/{runId}
```

## Production Deployment

### 1. Use Persistent Storage
```yaml
# kubernetes
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-storage-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
```

### 2. Configure Backup
```bash
# Daily backup script
#!/bin/bash
rsync -av /shared/storage/ /backup/$(date +%Y%m%d)/
```

### 3. Monitor Disk Usage
```bash
# Add monitoring
df -h /shared/storage
du -sh /shared/storage/*
```

### 4. Security
```bash
# Restrict access
chmod 750 /shared/storage
chown backend:backend /shared/storage
```

## File Path Patterns

### Input Files
- User uploads: `user_upload_{uploadId}.csv`
- Manual data: `manual_data_{timestamp}.csv`

### Output Files
- Simulation: `simulation_result_{runId}.csv`
- MOO ranking: `moo_result_{runId}.csv`
- RL scheduling: `rl_final_{runId}.csv`

### Temporary Files
- Processing: `temp_{runId}_{service}.csv`
- Backups: `backup_{timestamp}.csv`

## Migration from Payload System

### Phase 1: Parallel Operation
- Both file-based and payload systems active
- Gradual migration of endpoints

### Phase 2: File-First
- New features use file-based only
- Legacy endpoints deprecated

### Phase 3: Full Migration
- Remove payload-based endpoints
- Cleanup legacy code

## Performance Optimization

### File Operations
- Use async I/O for large files
- Implement file streaming for large datasets
- Cache frequently accessed files

### Storage Management
- Implement file retention policies
- Compress old files
- Use SSD for active storage

### Network
- Minimize webhook payload sizes
- Implement retry logic with exponential backoff
- Use connection pooling

This setup guide provides everything needed to implement and deploy the file path-based pipeline system.
