import { useState } from 'react';

import type { FileDataRow } from '@/app/components/file-data-table';
import { apiRateLimiter } from '@/lib/services/api-rate-limiter';
import type { MappingDocumentationData } from '@/lib/services/informatica-mapping-service';
import { mappingService } from '@/lib/services/informatica-mapping-service';

// Extend parseMappingFile to include raw data parsing
interface ParsedMappingResult {
  mappingData: MappingDocumentationData[];
  parsedData: Record<string, string | number>[];
}

// Import and augment the parseMappingFile function
import { parseMappingFile as originalParseMappingFile } from '@/lib/utils/mapping-file-parser';

// Wrapper function to return both parsed data and mapping data
async function parseMappingFile(file: File): Promise<ParsedMappingResult> {
  const mappingData = await originalParseMappingFile(file);

  // Create a reader for raw data parsing
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error('No data found in file'));
            return;
          }

          // We'll use a simplified approach to extract raw data
          // This would be expanded in a real implementation to match the actual parser
          const rawData = mappingData.map(item => ({
            sourceSystem: item.sourceSystem,
            sourceTable: item.sourceTable,
            sourceColumn: item.sourceColumn,
            targetSystem: item.targetSystem,
            targetTable: item.targetTable,
            targetColumn: item.targetColumn,
            transformationLogic: item.transformationLogic || '',
            businessTerm: item.businessTerm || '',
            description: item.description || '',
          }));

          resolve({
            mappingData,
            parsedData: rawData
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      reject(error);
    }
  });
}

export interface FileUploadState {
  isValidating: boolean;
  isUploading: boolean;
  isProcessing: boolean;
  validationResults: { isValid: boolean; errors?: string[] };
  fileName: string;
  fileData: FileDataRow[];
  mappingData: MappingDocumentationData[];
  uploadStatus:
    | 'idle'
    | 'validating'
    | 'validated'
    | 'uploading'
    | 'processing'
    | 'success'
    | 'error';
  error: string | null;
  catalogId: string | null;
  jobId: string | null;
  batchProgress?: {
    total: number;
    completed: number;
    success: number;
    failed: number;
  };
  processProgress?: {
    total: number;
    processed: number;
    percentage: number;
  };
}

export interface UseFileUploadReturn {
  fileState: FileUploadState;
  validateFile: (file: File) => Promise<boolean>;
  processFile: (file: File) => Promise<void>;
  uploadFile: (
    file: File,
    catalogName: string,
    description?: string
  ) => Promise<boolean>;
  processCatalog: (catalogId: string) => Promise<string | null>;
  uploadMappingRow: (row: FileDataRow) => Promise<boolean>;
  uploadMappingBatch: (rows: FileDataRow[]) => Promise<void>;
  updateRowStatus: (
    rowId: string,
    newStatus: FileDataRow['status'],
    error?: string
  ) => void;
  updateRowStatuses: (newStatus: FileDataRow['status'], error?: string) => void;
  getRateLimitStatus: () => {
    callsInLastMinute: number;
    maxCallsPerMinute: number;
    queueLength: number;
  };
  reset: () => void;
}

// Configuration for chunked processing
const CHUNK_SIZE = 1000; // Number of rows to process in a single chunk
const CHUNK_PROCESSING_DELAY = 10; // Delay between chunks in milliseconds

/**
 * Custom hook for managing file uploads and processing
 */
export function useFileUpload(): UseFileUploadReturn {
  const [fileState, setFileState] = useState<FileUploadState>({
    isValidating: false,
    isUploading: false,
    isProcessing: false,
    validationResults: { isValid: false },
    fileName: '',
    fileData: [],
    mappingData: [],
    uploadStatus: 'idle',
    error: null,
    catalogId: null,
    jobId: null,
  });

  /**
   * Validates a file before processing
   */
  const validateFile = async (file: File): Promise<boolean> => {
    setFileState(prev => ({
      ...prev,
      isValidating: true,
      fileName: file.name,
      uploadStatus: 'validating',
      error: null,
    }));

    try {
      // Check file type
      const fileType = file.name.split('.').pop()?.toLowerCase();
      const isValidType = ['csv', 'xlsx', 'xls'].includes(fileType || '');

      if (!isValidType) {
        setFileState(prev => ({
          ...prev,
          isValidating: false,
          validationResults: {
            isValid: false,
            errors: ['Invalid file type. Please upload a CSV or Excel file.'],
          },
          uploadStatus: 'error',
          error: 'Invalid file type. Please upload a CSV or Excel file.',
        }));
        return false;
      }

      // Check file size
      const maxSizeInBytes = 100 * 1024 * 1024; // 100MB max size
      if (file.size > maxSizeInBytes) {
        setFileState(prev => ({
          ...prev,
          isValidating: false,
          validationResults: {
            isValid: false,
            errors: ['File is too large. Maximum size is 100MB.'],
          },
          uploadStatus: 'error',
          error: 'File is too large. Maximum size is 100MB.',
        }));
        return false;
      }

      // More validation could be added here

      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationResults: { isValid: true },
        uploadStatus: 'validated',
      }));
      return true;
    } catch (error) {
      console.error('Error validating file:', error);
      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationResults: {
          isValid: false,
          errors: [
            error instanceof Error
              ? error.message
              : 'An unknown error occurred during validation.',
          ],
        },
        uploadStatus: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during validation.',
      }));
      return false;
    }
  };

  /**
   * Process file in chunks to avoid browser freezing with large files
   */
  const processFile = async (file: File): Promise<void> => {
    setFileState(prev => ({
      ...prev,
      isProcessing: true,
      uploadStatus: 'processing',
      error: null,
      processProgress: {
        total: 0,
        processed: 0,
        percentage: 0,
      },
    }));

    try {
      // Parse file to get row data
      const { parsedData, mappingData } = await parseMappingFile(file);

      // Initialize process tracking
      setFileState(prev => ({
        ...prev,
        processProgress: {
          total: parsedData.length,
          processed: 0,
          percentage: 0,
        },
      }));

      // Process in chunks for large files
      if (parsedData.length > CHUNK_SIZE) {
        await processInChunks(parsedData, mappingData);
      } else {
        // For smaller files, process all at once
        const formattedRows = formatFileData(parsedData);
        setFileState(prev => ({
          ...prev,
          isProcessing: false,
          fileData: formattedRows,
          mappingData,
          uploadStatus: 'validated',
          processProgress: {
            total: parsedData.length,
            processed: parsedData.length,
            percentage: 100,
          },
        }));
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during processing.',
        uploadStatus: 'error',
      }));
    }
  };

  /**
   * Process large datasets in chunks to avoid UI freezing
   */
  const processInChunks = async (
    parsedData: Record<string, string | number>[],
    mappingData: MappingDocumentationData[]
  ): Promise<void> => {
    let formattedRows: FileDataRow[] = [];
    const totalChunks = Math.ceil(parsedData.length / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Extract chunk
      const startIndex = chunkIndex * CHUNK_SIZE;
      const endIndex = Math.min(startIndex + CHUNK_SIZE, parsedData.length);
      const chunk = parsedData.slice(startIndex, endIndex);

      // Process chunk
      const chunkFormattedRows = formatFileData(chunk);
      formattedRows = [...formattedRows, ...chunkFormattedRows];

      // Update progress
      const processed = endIndex;
      const percentage = Math.round((processed / parsedData.length) * 100);

      setFileState(prev => ({
        ...prev,
        fileData: formattedRows,
        processProgress: {
          total: parsedData.length,
          processed,
          percentage,
        },
      }));

      // Small delay to allow UI to update and prevent freezing
      if (chunkIndex < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_PROCESSING_DELAY));
      }
    }

    // Processing complete
    setFileState(prev => ({
      ...prev,
      isProcessing: false,
      fileData: formattedRows,
      mappingData,
      uploadStatus: 'validated',
      processProgress: {
        total: parsedData.length,
        processed: parsedData.length,
        percentage: 100,
      },
    }));
  };

  /**
   * Format parsed data into FileDataRow format
   */
  const formatFileData = (parsedData: Record<string, string | number>[]): FileDataRow[] => {
    return parsedData.map((item, index) => {
      // Create a properly typed FileDataRow object
      const row: FileDataRow = {
        id: `row-${index}`,
        data: item,
        status: 'pending',
        // These properties are optional in the FileDataRow interface
        error: undefined,
        jobId: null,
      };
      return row;
    });
  };

  /**
   * Upload file to server
   */
  const uploadFile = async (
    file: File,
    catalogName: string,
    description?: string
  ): Promise<boolean> => {
    setFileState(prev => ({
      ...prev,
      isUploading: true,
      uploadStatus: 'uploading',
      error: null,
    }));

    try {
      // Upload the file and create a catalog
      const result = await mappingService.uploadFile(file, catalogName, description);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create catalog');
      }

      setFileState(prev => ({
        ...prev,
        isUploading: false,
        catalogId: result.catalogId || null,
        uploadStatus: 'success',
      }));

      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileState(prev => ({
        ...prev,
        isUploading: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during upload.',
        uploadStatus: 'error',
      }));
      return false;
    }
  };

  /**
   * Processes a catalog to start mapping job
   */
  const processCatalog = async (catalogId: string): Promise<string | null> => {
    setFileState(prev => ({
      ...prev,
      isProcessing: true,
      uploadStatus: 'processing',
      error: null,
    }));

    try {
      const result = await mappingService.processCatalog(catalogId);

      if (result.jobId) {
        setFileState(prev => ({
          ...prev,
          isProcessing: false,
          uploadStatus: 'success',
          jobId: result.jobId,
        }));
        return result.jobId;
      } else {
        setFileState(prev => ({
          ...prev,
          isProcessing: false,
          uploadStatus: 'error',
          error: 'Failed to start processing job',
        }));
        return null;
      }
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        uploadStatus: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown processing error',
      }));
      return null;
    }
  };

  /**
   * Uploads a single mapping row
   */
  const uploadMappingRow = async (row: FileDataRow): Promise<boolean> => {
    if (!fileState.catalogId) {
      throw new Error('No catalog ID available for row upload');
    }

    // Update row status to processing
    updateRowStatus(row.id, 'processing');

    try {
      const result = await mappingService.uploadMappingRow(
        row,
        fileState.catalogId
      );

      if (result.success) {
        updateRowStatus(row.id, 'success');
        return true;
      } else {
        updateRowStatus(row.id, 'error', result.error);
        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during row upload';
      updateRowStatus(row.id, 'error', errorMessage);
      return false;
    }
  };

  /**
   * Uploads multiple mapping rows with rate limiting
   */
  const uploadMappingBatch = async (rows: FileDataRow[]): Promise<void> => {
    if (!fileState.catalogId || rows.length === 0) {
      return;
    }

    // Initialize batch progress tracking
    const batchProgress = {
      total: rows.length,
      completed: 0,
      success: 0,
      failed: 0,
    };

    // Update state to show batch progress
    setFileState(prev => ({
      ...prev,
      batchProgress,
    }));

    // Update all selected rows to processing status
    rows.forEach(row => {
      updateRowStatus(row.id, 'processing');
    });

    // Process each row
    for (const row of rows) {
      try {
        // Enqueue the API call to be processed with rate limiting
        const result = await apiRateLimiter.enqueue(() =>
          mappingService.uploadMappingRow(row, fileState.catalogId!)
        );

        // Update progress and row status
        batchProgress.completed++;

        if (result.success) {
          batchProgress.success++;
          updateRowStatus(row.id, 'success');
        } else {
          batchProgress.failed++;
          updateRowStatus(row.id, 'error', result.error);
        }

        // Update batch progress in state
        setFileState(prev => ({
          ...prev,
          batchProgress: { ...batchProgress },
        }));
      } catch (error) {
        // Handle error and update progress
        batchProgress.completed++;
        batchProgress.failed++;
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown error during row upload';
        updateRowStatus(row.id, 'error', errorMessage);

        // Update batch progress in state
        setFileState(prev => ({
          ...prev,
          batchProgress: { ...batchProgress },
        }));
      }
    }

    // Clear batch progress when done
    setTimeout(() => {
      setFileState(prev => {
        const { batchProgress: _, ...rest } = prev;
        return rest;
      });
    }, 3000);
  };

  /**
   * Updates the status of all rows
   */
  const updateRowStatuses = (
    newStatus: FileDataRow['status'],
    error?: string
  ): void => {
    setFileState(prev => ({
      ...prev,
      fileData: prev.fileData.map(row => ({
        ...row,
        status: newStatus,
        error: error || row.error,
      })) as FileDataRow[],
    }));
  };

  /**
   * Updates the status of a single row
   */
  const updateRowStatus = (
    rowId: string,
    newStatus: FileDataRow['status'],
    error?: string
  ): void => {
    setFileState(prev => ({
      ...prev,
      fileData: prev.fileData.map(row =>
        row.id === rowId
          ? { ...row, status: newStatus, error: error || row.error }
          : row
      ),
    }));
  };

  /**
   * Get current rate limit status
   */
  const getRateLimitStatus = () => {
    return apiRateLimiter.getRateLimitStatus();
  };

  /**
   * Resets the file upload state
   */
  const reset = (): void => {
    setFileState({
      isValidating: false,
      isUploading: false,
      isProcessing: false,
      validationResults: { isValid: false },
      fileName: '',
      fileData: [],
      mappingData: [],
      uploadStatus: 'idle',
      error: null,
      catalogId: null,
      jobId: null,
    });
  };

  return {
    fileState,
    validateFile,
    processFile,
    uploadFile,
    processCatalog,
    uploadMappingRow,
    uploadMappingBatch,
    updateRowStatus,
    updateRowStatuses,
    getRateLimitStatus,
    reset,
  };
}
