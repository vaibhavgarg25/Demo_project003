import fs from "fs/promises";
import path from "path";
import { logger } from "../config/logger.js";

/**
 * Centralized storage manager for handling file-based pipeline operations
 * Creates a shared storage structure between backend and FastAPI services
 */

// Storage directory structure
export const STORAGE_PATHS = {
  ROOT: process.env.SHARED_STORAGE_PATH || "/shared/storage",
  INPUT: "input",
  OUTPUT: "output",
  TEMP: "temp"
} as const;

// File naming conventions for pipeline
export const FILE_PATTERNS = {
  USER_UPLOAD: (uploadId: string) => `user_upload_${uploadId}.csv`,
  SIMULATION_RESULT: (runId: string) => `simulation_result_${runId}.csv`,
  MOO_RESULT: (runId: string) => `moo_result_${runId}.csv`,
  RL_FINAL: (runId: string) => `rl_final_${runId}.csv`
} as const;

/**
 * Storage utility class for managing pipeline files
 */
export class StorageManager {
  private static readonly baseStoragePath = STORAGE_PATHS.ROOT;

  /**
   * Initialize storage directories if they don't exist
   */
  static async initializeStorage(): Promise<void> {
    try {
      const directories = [
        this.getStoragePath("input"),
        this.getStoragePath("output"),
        this.getStoragePath("temp")
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Storage directory ensured: ${dir}`);
      }
    } catch (error) {
      logger.error("Failed to initialize storage directories", error);
      throw error;
    }
  }

  /**
   * Get full path for a storage subdirectory
   */
  static getStoragePath(subPath: string): string {
    return path.join(this.baseStoragePath, subPath);
  }

  /**
   * Get full file path in a specific storage directory
   */
  static getFilePath(directory: keyof typeof STORAGE_PATHS, filename: string): string {
    const subPath = directory === "ROOT" ? "" : STORAGE_PATHS[directory];
    return path.join(this.baseStoragePath, subPath, filename);
  }

  /**
   * Save initial train data for pipeline processing
   */
  static async saveUserUpload(uploadId: string, csvData: string): Promise<string> {
    const filename = FILE_PATTERNS.USER_UPLOAD(uploadId);
    const filePath = this.getFilePath("INPUT", filename);
    
    try {
      await fs.writeFile(filePath, csvData, "utf-8");
      logger.info(`User upload saved: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to save user upload: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Save simulation results
   */
  static async saveSimulationResult(runId: string, csvData: string): Promise<string> {
    const filename = FILE_PATTERNS.SIMULATION_RESULT(runId);
    const filePath = this.getFilePath("OUTPUT", filename);
    
    try {
      await fs.writeFile(filePath, csvData, "utf-8");
      logger.info(`Simulation result saved: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to save simulation result: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Save MOO ranking results
   */
  static async saveMooResult(runId: string, csvData: string): Promise<string> {
    const filename = FILE_PATTERNS.MOO_RESULT(runId);
    const filePath = this.getFilePath("OUTPUT", filename);
    
    try {
      await fs.writeFile(filePath, csvData, "utf-8");
      logger.info(`MOO result saved: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to save MOO result: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Save final RL scheduling results
   */
  static async saveRlFinalResult(runId: string, csvData: string): Promise<string> {
    const filename = FILE_PATTERNS.RL_FINAL(runId);
    const filePath = this.getFilePath("OUTPUT", filename);
    
    try {
      await fs.writeFile(filePath, csvData, "utf-8");
      logger.info(`RL final result saved: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to save RL final result: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Read file content as string
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      logger.info(`File read successfully: ${filePath}`);
      return content;
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Read file content as buffer
   */
  static async readFileBuffer(filePath: string): Promise<Buffer> {
    try {
      const buffer = await fs.readFile(filePath);
      logger.info(`File buffer read successfully: ${filePath}`);
      return buffer;
    } catch (error) {
      logger.error(`Failed to read file buffer: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Clean up old temporary files (older than specified hours)
   */
  static async cleanupTempFiles(hoursOld: number = 24): Promise<void> {
    try {
      const tempDir = this.getStoragePath(STORAGE_PATHS.TEMP);
      const files = await fs.readdir(tempDir);
      const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await this.deleteFile(filePath);
          logger.info(`Cleaned up old temp file: ${filePath}`);
        }
      }
    } catch (error) {
      logger.error("Failed to cleanup temporary files", error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    inputFiles: number;
    outputFiles: number;
    tempFiles: number;
  }> {
    try {
      const inputDir = this.getStoragePath(STORAGE_PATHS.INPUT);
      const outputDir = this.getStoragePath(STORAGE_PATHS.OUTPUT);
      const tempDir = this.getStoragePath(STORAGE_PATHS.TEMP);

      const [inputFiles, outputFiles, tempFiles] = await Promise.all([
        fs.readdir(inputDir).then(files => files.length).catch(() => 0),
        fs.readdir(outputDir).then(files => files.length).catch(() => 0),
        fs.readdir(tempDir).then(files => files.length).catch(() => 0)
      ]);

      return { inputFiles, outputFiles, tempFiles };
    } catch (error) {
      logger.error("Failed to get storage stats", error);
      return { inputFiles: 0, outputFiles: 0, tempFiles: 0 };
    }
  }
}