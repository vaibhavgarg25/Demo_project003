export interface CSVUploadResponse {
    message: string;
    jobId: string;
    statusUrl: string;
  }
  
  export interface UploadStatusResponse {
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    message?: string;
    results?: {
      trains: number;
      fitness: number;
      jobCards: number;
      branding: number;
      mileage: number;
      cleaning: number;
      stabling: number;
      operations: number;
      errors: string[];
    };
  }