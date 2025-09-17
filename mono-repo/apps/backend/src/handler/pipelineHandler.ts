import { type Request, type Response } from 'express';
import { startSimulationRun, startSimulationRunWithFile, getRun, listRuns } from '../services/pipelineService.js';
import { StorageManager } from '../utils/storageManager.js';

// Types for train data
interface TrainData {
  trainId: string;
  route: string;
  capacity: number;
  currentLoad: number;
  speed: number;
  location: string;
  status: string;
}

interface PipelineRequest extends Request {
  body: {
    trains: TrainData[];
    days_to_simulate?: number;
  };
}

export const startPipelineWithJSON = async (req: PipelineRequest, res: Response) => {
  try {
    const { trains, days_to_simulate = 1 } = req.body;

    if (!trains || !Array.isArray(trains) || trains.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: trains array is required and must contain at least one train' 
      });
    }

    // Validate train data structure
    for (const train of trains) {
      if (!train.trainId || !train.status) {
        return res.status(400).json({ 
          error: 'Invalid train data: trainId and status are required fields' 
        });
      }
    }

    // Generate a unique run ID
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Convert trains to CSV format for storage
    const csvData = convertTrainsToCSV(trains);

    // Save to shared storage
    const filePath = await StorageManager.saveUserUpload(runId, csvData);

    // Start the pipeline
    await startSimulationRun();

    res.json({
      success: true,
      message: 'Pipeline started successfully',
      runId,
      filePath,
      trainsProcessed: trains.length,
      metadata: {
        days_to_simulate,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Pipeline start error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start pipeline',
      details: (error as Error).message
    });
  }
};

export const startPipelineWithCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No CSV file uploaded. Please attach a CSV file.' 
      });
    }

    const { days_to_simulate = 1 } = req.body;

    // Generate a unique run ID
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Convert buffer to string to count lines/trains
    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    const trainsCount = Math.max(0, lines.length - 1); // Subtract header line

    // Save uploaded CSV to shared storage
    const filePath = await StorageManager.saveUserUpload(runId, csvContent);

    // Start the pipeline with CSV data directly
    await startSimulationRunWithFile(runId, filePath);

    res.json({
      success: true,
      message: 'Pipeline started successfully with CSV data',
      runId,
      filePath,
      trainsProcessed: trainsCount,
      metadata: {
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        days_to_simulate,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('CSV Pipeline start error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start pipeline with CSV',
      details: (error as Error).message
    });
  }
};

export const getPipelineStatus = (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    if (!runId) {
      return res.status(400).json({ error: 'runId parameter is required' });
    }

    const run = getRun(runId);

    if (!run) {
      return res.status(404).json({ error: 'Pipeline run not found' });
    }

    res.json({
      success: true,
      runId,
      status: run.status,
      startedAt: run.startedAt,
      details: run.details
    });

  } catch (error) {
    console.error('Get pipeline status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get pipeline status',
      details: (error as Error).message
    });
  }
};

export const listPipelineRuns = (req: Request, res: Response) => {
  try {
    const runs = listRuns();

    res.json({
      success: true,
      runs: runs.map(run => ({
        runId: run.runId,
        status: run.status,
        startedAt: run.startedAt,
        details: run.details
      })),
      totalRuns: runs.length
    });

  } catch (error) {
    console.error('List pipeline runs error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to list pipeline runs',
      details: (error as Error).message
    });
  }
};

// Helper function to convert JSON train data to CSV format
const convertTrainsToCSV = (trains: TrainData[]): string => {
  if (trains.length === 0) return '';
  
  // CSV headers for simplified model
  const headers = ['trainId', 'route', 'capacity', 'currentLoad', 'speed', 'location', 'status'];
  
  // Create CSV header row
  const csvRows = [headers.join(',')];
  
  // Add data rows
  trains.forEach(train => {
    const row = headers.map(header => {
      const value = (train as any)[header];
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '';
      }
      // Handle strings with commas (escape them)
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};