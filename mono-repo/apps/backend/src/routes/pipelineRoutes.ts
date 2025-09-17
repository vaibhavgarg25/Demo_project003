import express from 'express';
import multer from 'multer';
import { startPipelineWithJSON, startPipelineWithCSV, getPipelineStatus, listPipelineRuns } from '../handler/pipelineHandler.js';

const router = express.Router();

// Configure multer for CSV file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      const error = new Error('Only CSV files are allowed') as any;
      cb(error, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Routes

// 1. Start pipeline with JSON data (simplified train data)
router.post('/start', startPipelineWithJSON);

// 2. Start pipeline with CSV upload (comprehensive train data like FINAL_DATA_1.csv)
router.post('/start-csv', upload.single('file'), startPipelineWithCSV);

// 3. Get pipeline run status
router.get('/status/:runId', getPipelineStatus);

// 4. List all pipeline runs
router.get('/runs', listPipelineRuns);

export default router;