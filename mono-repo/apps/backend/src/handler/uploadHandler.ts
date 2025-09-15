import { type Request, type Response } from 'express';
import { processCSV } from '../services/csvService.js';

interface UploadStatus {
  [key: string]: {
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    message?: string;
    results?: any;
  };
}

const uploadStatusMap: UploadStatus = {};

export const uploadCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const jobId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize job status
    uploadStatusMap[jobId] = {
      status: 'processing',
      progress: 0,
      message: 'Starting CSV processing...'
    };

    processCSV(req.file.buffer, jobId, uploadStatusMap)
      .catch(error => {
        uploadStatusMap[jobId] = {
          status: 'failed',
          message: error.message
        };
      });

    res.json({
      message: 'CSV upload started',
      jobId,
      statusUrl: `/api/upload/upload-status/${jobId}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process CSV upload' });
  }
};

export const getUploadStatus = (req: Request, res: Response) => {
  const { jobId } = req.params;
  const status = uploadStatusMap[jobId as string];

  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(status);
};