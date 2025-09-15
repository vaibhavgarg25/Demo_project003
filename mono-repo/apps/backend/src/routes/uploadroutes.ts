import express from 'express';
import multer from 'multer';
import { uploadCSV, getUploadStatus } from '../handler/uploadHandler.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads with more permissive settings
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept any file, we'll validate later
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Create a more permissive upload handler
const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).any();

// Helpers
const ensureMultipart = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.is('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
  }
  next();
};

// Routes
// Accept both multipart/form-data (via multer) and raw/binary uploads
router.post('/upload', (req, res, next) => {
  // If not multipart, treat as raw upload (e.g., Postman 'binary')
  if (!req.is('multipart/form-data')) {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (!buffer.length) {
        return res.status(400).json({ error: 'No file data received' });
      }
      (req as any).file = {
        buffer,
        fieldname: 'file',
        originalname: 'upload.csv',
        encoding: '7bit',
        mimetype: req.headers['content-type'] || 'text/csv',
        size: buffer.length,
        destination: undefined,
        filename: undefined,
        path: undefined,
        stream: undefined
      } as unknown as Express.Multer.File;
      return uploadCSV(req, res);
    });
    req.on('error', (err) => next(err));
  } else {
    next();
  }
}, (req, res, next) => {
  // Run multer with explicit error handling to avoid 500s on malformed multipart
  uploadHandler(req as any, res as any, (err: any) => {
    if (err) {
      const message = (err && err.message) || 'Upload error';
      if (message.includes('Field name missing')) {
        return res.status(400).json({
          error: 'Field name missing. In Postman, choose Body → form-data and add a File field (e.g., csvFile) with your CSV. Or use Body → binary.',
        });
      }
      return next(err);
    }
    next();
  });
}, (req, res) => {
  // Handle files from upload.any()
  const files = (req as any).files as Express.Multer.File[] | undefined;
  
  if (!files || files.length === 0) {
    return res.status(400).json({ 
      error: 'No file uploaded. Please select a file in Postman with any field name.' 
    });
  }
  
  // Use the first file uploaded (regardless of field name)
  (req as any).file = files[0];
  
  // Validate it's a CSV file
  const file = files[0];
  if (!file) {
    return res.status(400).json({ error: 'No file data received' });
  }
  
  if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
    return res.status(400).json({ error: 'Please upload a CSV file' });
  }
  
  uploadCSV(req, res);
});
router.get('/upload-status/:jobId', getUploadStatus);

export default router;