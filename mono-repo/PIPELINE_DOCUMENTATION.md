# File Path-Based Pipeline Implementation

## Overview

This document describes the implementation of a file path-based pipeline system for the KochiMetro train management application. The system has been updated to use shared storage with file paths instead of sending full payloads between services.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Backend     │    │  Shared Storage  │    │    FastAPI      │
│   (Node.js)     │    │   File System    │    │   Services      │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │  ┌────────────┐  │    │  ┌───────────┐  │
│  │Pipeline   │◄─┼────┼─►│   /input   │◄─┼────┼─►│Simulation │  │
│  │Service    │  │    │  │   /output  │  │    │  │   MOO     │  │
│  │           │  │    │  │   /temp    │  │    │  │   RL      │  │
│  └───────────┘  │    │  └────────────┘  │    │  └───────────┘  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Storage Structure

### Directory Layout
```
/shared/storage/
├── input/                    # Initial train data uploads
│   └── user_upload_*.csv    # Train data files from backend
├── output/                   # Processing results
│   ├── simulation_result_*.csv
│   ├── moo_result_*.csv
│   └── rl_final_*.csv
└── temp/                     # Temporary processing files
    └── *.tmp
```

### File Naming Conventions
- **User Uploads**: `user_upload_{runId}.csv`
- **Simulation Results**: `simulation_result_{runId}.csv`
- **MOO Results**: `moo_result_{runId}.csv`
- **RL Final Results**: `rl_final_{runId}.csv`

## Pipeline Flow

### 1. Initial User Upload

**Traditional Flow (Still Supported)**:
- User uploads CSV → Backend processes and stores in database
- Manual pipeline trigger uses database data

**New File-Based Flow**:
- User uploads CSV → Backend saves to `/shared/storage/input/user_upload_{uploadId}.csv`
- Pipeline can reference this file for future processing

### 2. Daily Automated Pipeline (24 hrs)

#### Step 1: Backend Triggers Simulation
```typescript
// Backend: pipelineService.ts
const runId = generateRunId();
const csvData = convertTrainsToCSV(trains);
const filePath = await StorageManager.saveUserUpload(runId, csvData);

// Call FastAPI simulation with file path
POST http://fastapi:8000/api/v1/simulation/start-from-file
{
  "file_path": "/shared/storage/input/user_upload_run123.csv",
  "runId": "run123",
  "days_to_simulate": 1
}
```

#### Step 2: Simulation Processing
```python
# FastAPI: simulation/handler.py
df = await StorageManager.read_csv_from_path(file_path)
simulated_df = simulator.simulate_multiple_days(df, days)
result_file_path = await StorageManager.save_simulation_result(runId, simulated_df)

# Send webhook to backend
POST http://backend:8000/api/webhook/simulation-finished
{
  "runId": "run123",
  "filePath": "/shared/storage/output/simulation_result_run123.csv",
  "success": true
}
```

#### Step 3: MOO Ranking
```typescript
// Backend receives webhook, triggers MOO
POST http://fastapi:8000/api/v1/moo/rank-from-file
{
  "simulation_result_file_path": "/shared/storage/output/simulation_result_run123.csv",
  "runId": "run123",
  "mileage_limit_before_service": 10000
}
```

```python
# FastAPI: moo/handler.py
df = await StorageManager.read_csv_from_path(simulation_result_file_path)
ranked_df = moo_service.rank_trains(df)
result_file_path = await StorageManager.save_moo_result(runId, ranked_df)

# Send webhook to backend
POST http://backend:8000/api/webhook/moo-finished
{
  "runId": "run123",
  "filePath": "/shared/storage/output/moo_result_run123.csv",
  "success": true
}
```

#### Step 4: RL Scheduling
```typescript
// Backend receives webhook, triggers RL
POST http://fastapi:8000/api/v1/rl/schedule-from-file
{
  "moo_result_file_path": "/shared/storage/output/moo_result_run123.csv",
  "runId": "run123",
  "service_quota": 13,
  "episode_days": 7
}
```

```python
# FastAPI: rl/handler.py
df = await StorageManager.read_csv_from_path(moo_result_file_path)
# Run RL scheduling...
result_df = apply_rl_scheduling(df)
result_file_path = await StorageManager.save_rl_result(runId, result_df)

# Send webhook to backend
POST http://backend:8000/api/webhook/rl-finished
{
  "runId": "run123",
  "filePath": "/shared/storage/output/rl_final_run123.csv",
  "success": true
}
```

#### Step 5: Final Data Update
```typescript
// Backend receives final webhook
const buffer = await StorageManager.readFileBuffer(filePath);
await processCSV(buffer, jobId, uploadStatusMap);
await prisma.train.updateMany({ data: { updatedAt: new Date() } });
notifyClients("new_data_ready");
```

## Configuration

### Environment Variables

#### Backend (.env)
```bash
# Shared Storage Configuration
SHARED_STORAGE_PATH="/shared/storage"

# FastAPI Communication
FAST_API_BASE_URI="http://fastapi:8000/api/v1"

# Database
DATABASE_URL="your_database_url"
```

#### FastAPI (.env)
```bash
# Shared Storage Configuration  
SHARED_STORAGE_PATH="/shared/storage"

# Backend Communication
BACKEND_BASE_URL="http://backend:8000"
WEBHOOK_SIMULATION_URL="http://backend:8000/api/webhook/simulation-finished"
WEBHOOK_MOO_URL="http://backend:8000/api/webhook/moo-finished"
WEBHOOK_RL_URL="http://backend:8000/api/webhook/rl-finished"
```

### Docker Compose Configuration
```yaml
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

## API Endpoints

### New File-Based Endpoints

#### Simulation Service
- `POST /api/v1/simulation/start-from-file` - Start simulation from file path
- `POST /api/v1/simulation/` - Upload file simulation (existing)

#### MOO Service  
- `POST /api/v1/moo/rank-from-file` - Rank trains from file path
- `POST /api/v1/moo/rank` - Upload file ranking (existing)

#### RL Service
- `POST /api/v1/rl/schedule-from-file` - Schedule trains from file path  
- `POST /api/v1/rl/schedule` - Upload file scheduling (existing)

#### Backend Webhooks
- `POST /api/webhook/simulation-finished` - Simulation completion notification
- `POST /api/webhook/moo-finished` - MOO completion notification
- `POST /api/webhook/rl-finished` - RL completion notification

## Storage Management

### Backend (Node.js)
```typescript
import { StorageManager } from "./utils/storageManager.js";

// Initialize storage
await StorageManager.initializeStorage();

// Save train data
const filePath = await StorageManager.saveUserUpload(runId, csvData);

// Read final results
const buffer = await StorageManager.readFileBuffer(filePath);
```

### FastAPI (Python)
```python
from app.core.storage import StorageManager

# Initialize storage
await StorageManager.initialize_storage()

# Read input file
df = await StorageManager.read_csv_from_path(file_path)

# Save results
result_path = await StorageManager.save_simulation_result(runId, df)
```

## Error Handling

### File Access Errors
- Both services check file existence before processing
- Graceful fallback to error webhooks if files are missing
- Automatic retry mechanisms for transient storage issues

### Webhook Failures
- Non-blocking webhook calls with timeout (10 seconds)
- Error webhooks include failure details
- Pipeline continues even if webhooks fail

### Storage Cleanup
- Automatic cleanup of temporary files older than 24 hours
- Configurable retention policies for input/output files
- Storage usage monitoring and alerts

## Monitoring and Debugging

### Logging
- All file operations are logged with full paths
- Pipeline progress tracked via runId across all services
- Storage statistics available via API endpoints

### Health Checks
- Storage accessibility verification on startup
- File system space monitoring
- Service connectivity validation

## Migration from Payload-Based System

### Backward Compatibility
- Original upload endpoints still function
- Existing API contracts maintained
- Gradual migration path available

### Performance Benefits
- Reduced memory usage (no large payloads in HTTP requests)
- Better error recovery (files persist through service restarts)
- Improved scalability (file-based queuing)
- Easier debugging (intermediate results accessible)

## Security Considerations

### File Access Control
- Shared storage accessible only to authorized services
- Path validation prevents directory traversal attacks
- File permission restrictions in production

### Data Privacy
- Temporary files cleaned up automatically
- Sensitive data encrypted at rest (if required)
- Audit trail for all file operations

## Deployment

### Local Development
```bash
# Create shared storage directory
mkdir -p /tmp/shared_storage

# Set environment variables
export SHARED_STORAGE_PATH="/tmp/shared_storage"

# Start services
npm run dev  # Backend
python -m uvicorn app.main:app --reload  # FastAPI
```

### Production Deployment
- Use persistent volume for shared storage
- Configure backup and disaster recovery
- Monitor storage usage and performance
- Implement file retention policies

## Troubleshooting

### Common Issues

1. **Storage Permission Errors**
   - Verify both services have read/write access to shared storage
   - Check file system permissions and ownership

2. **File Not Found Errors**
   - Verify file paths match exactly between services
   - Check storage initialization on service startup

3. **Webhook Timeouts**
   - Monitor service connectivity
   - Verify webhook URL configuration
   - Check for network issues between services

4. **Storage Full Errors**
   - Implement file cleanup policies
   - Monitor disk usage
   - Configure alerts for low storage space

### Debug Commands
```bash
# Check storage structure
ls -la /shared/storage/

# Monitor file operations
tail -f backend.log | grep "Storage"
tail -f fastapi.log | grep "Storage"

# Verify webhooks
curl -X POST http://backend:8000/api/webhook/test
```

This file-based pipeline implementation provides a robust, scalable, and maintainable solution for the train management system while maintaining backward compatibility and improving performance.