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

// Constants for file processing
const CHUNK_SIZE = 500; // Number of rows to process at once
const CHUNK_PROCESSING_DELAY = 10; // Milliseconds between chunk processing
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size

// Wrapper function to return both parsed data and mapping data
async function parseMappingFile(file: File): Promise<ParsedMappingResult> {
  try {
    // Ensure we're working with a valid File object
    if (!(file instanceof File)) {
      console.error('parseMappingFile wrapper received invalid file:', file);
      throw new Error('Input not instance of File');
    }

    console.log('parseMappingFile wrapper processing file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Only read the file once through the original parser
    const mappingData = await originalParseMappingFile(file);

    // Transform the mapping data to the raw format without reading the file again
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

    console.log(`Successfully processed ${rawData.length} rows of data`);

    return {
      mappingData,
      parsedData: rawData
    };
  } catch (error) {
    console.error('Error in parseMappingFile wrapper:', error);
    throw error;
  }
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
      validationResults: { isValid: false },
      uploadStatus: 'validating',
      error: null,
    }));

    try {
      // Ensure we're working with a valid File object
      if (!(file instanceof File)) {
        throw new Error('Input not instance of File');
      }

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
      if (file.size > MAX_FILE_SIZE) {
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
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unknown error occurred during validation.';

      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationResults: {
          isValid: false,
          errors: [errorMessage],
        },
        uploadStatus: 'error',
        error: errorMessage,
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
      fileData: [], // Clear previous file data
      processProgress: {
        total: 0,
        processed: 0,
        percentage: 0,
      },
    }));

    try {
      // Ensure we're working with a valid File object
      if (!(file instanceof File)) {
        console.error('processFile received invalid file:', file);
        throw new Error('Input not instance of File');
      }

      // Store the file name
      setFileState(prev => ({
        ...prev,
        fileName: file.name,
      }));

      console.log('Starting file processing for:', file.name);

      // Parse file to get row data
      const { parsedData, mappingData } = await parseMappingFile(file);
      console.log(`Processing ${parsedData.length} rows of data`);

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
        console.log(`Large file detected, processing in chunks of ${CHUNK_SIZE}`);
        await processInChunks(parsedData, mappingData);
      } else {
        // For smaller files, process all at once
        console.log('Small file, processing all at once');
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

      console.log('File processing completed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during processing.';

      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        uploadStatus: 'error',
        validationResults: {
          isValid: false,
          errors: [errorMessage]
        }
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
    try {
      let formattedRows: FileDataRow[] = [];
      const totalChunks = Math.ceil(parsedData.length / CHUNK_SIZE);

      console.log(`Starting chunk processing: ${totalChunks} chunks total`);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Extract chunk
        const startIndex = chunkIndex * CHUNK_SIZE;
        const endIndex = Math.min(startIndex + CHUNK_SIZE, parsedData.length);
        const chunk = parsedData.slice(startIndex, endIndex);

        console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}: rows ${startIndex}-${endIndex}`);

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
      console.log(`Chunk processing complete: ${formattedRows.length} total rows processed`);

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
    } catch (error) {
      console.error('Error in chunk processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during chunk processing';

      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        uploadStatus: 'error',
      }));

      throw error; // Re-throw to be caught by the caller
    }
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
      // Ensure we're working with a valid File object
      if (!(file instanceof File)) {
        throw new Error('Input not instance of File');
      }

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
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unknown error occurred during upload.';

      setFileState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
        uploadStatus: 'error',
        validationResults: {
          ...prev.validationResults,
          errors: [...(prev.validationResults.errors || []), errorMessage]
        }
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
   * Upload a single mapping row
   */
  const uploadMappingRow = async (row: FileDataRow): Promise<boolean> => {
    try {
      if (!fileState.catalogId) {
        throw new Error('No catalog ID available');
      }

      updateRowStatus(row.id, 'processing');

      // Call the mapping service to upload the row
      const result = await mappingService.uploadMappingRow(row, fileState.catalogId);

      if (!result.success) {
        updateRowStatus(row.id, 'error', result.error || 'Failed to upload mapping');
        return false;
      }

      // Don't mark as success until we confirm with Thoughtspot
      // Keep as processing until job tracking confirms success
      return true;
    } catch (error) {
      console.error('Error uploading mapping row:', error);
      updateRowStatus(
        row.id,
        'error',
        error instanceof Error ? error.message : 'Failed to upload mapping'
      );
      return false;
    }
  };

  /**
   * Upload multiple mapping rows as a batch
   */
  const uploadMappingBatch = async (rows: FileDataRow[]): Promise<void> => {
    if (rows.length === 0) return;

    setFileState(prev => ({
      ...prev,
      isUploading: true,
      batchProgress: {
        total: rows.length,
        completed: 0,
        success: 0,
        failed: 0,
      },
    }));

    try {
      // Process rows in chunks to avoid overwhelming the API
      const chunks = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        chunks.push(rows.slice(i, i + CHUNK_SIZE));
      }

      let completedCount = 0;
      let successCount = 0;
      let failedCount = 0;

      // Process each chunk
      for (const chunk of chunks) {
        // Mark rows as processing
        chunk.forEach(row => {
          updateRowStatus(row.id, 'processing');
        });

        // Process the chunk
        const results = await Promise.all(
          chunk.map(row => uploadMappingRow(row))
        );

        // Update counts
        results.forEach((success, index) => {
          completedCount++;
          if (success) {
            successCount++;
          } else {
            failedCount++;
          }
        });

        // Update batch progress
        setFileState(prev => ({
          ...prev,
          batchProgress: {
            total: rows.length,
            completed: completedCount,
            success: successCount,
            failed: failedCount,
          },
        }));

        // Add a small delay between chunks to avoid rate limiting
        if (chunks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, CHUNK_PROCESSING_DELAY));
        }
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Batch processing failed';

      // Mark all remaining rows as error
      rows.forEach(row => {
        if (row.status === 'processing') {
          updateRowStatus(row.id, 'error', errorMessage);
        }
      });
    } finally {
      setFileState(prev => ({
        ...prev,
        isUploading: false,
      }));
    }
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
