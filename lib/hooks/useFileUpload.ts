import { useState } from 'react';

import type { FileDataRow } from '@/app/components/file-data-table';
import type { MappingDocumentationData } from '@/lib/services/informatica-mapping-service';
import { mappingService } from '@/lib/services/informatica-mapping-service';
import { parseMappingFile } from '@/lib/utils/mapping-file-parser';

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
}

export interface UseFileUploadReturn {
  fileState: FileUploadState;
  validateFile: (file: File) => Promise<boolean>;
  processFile: (file: File) => Promise<void>;
  uploadFile: (file: File, catalogName: string, description?: string) => Promise<boolean>;
  processCatalog: (catalogId: string) => Promise<string | null>;
  uploadMappingRow: (row: FileDataRow) => Promise<boolean>;
  updateRowStatus: (rowId: string, newStatus: FileDataRow['status'], error?: string) => void;
  updateRowStatuses: (newStatus: FileDataRow['status'], error?: string) => void;
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
      uploadStatus: 'validating',
      fileName: file.name,
    }));

    try {
      const result = await mappingService.validateFile(file);

      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationResults: result,
        uploadStatus: result.isValid ? 'validated' : 'error',
        error: result.isValid
          ? null
          : result.errors?.join(', ') || 'Unknown validation error',
      }));

      return result.isValid;
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationResults: {
          isValid: false,
          errors: [
            error instanceof Error ? error.message : 'Unknown validation error',
          ],
        },
        uploadStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown validation error',
      }));

      return false;
    }
  };

  /**
   * Processes a file to extract mapping data
   */
  const processFile = async (file: File): Promise<void> => {
    try {
      // Parse the file to extract mapping data
      const mappingData = await parseMappingFile(file);

      // Transform mapping data to file data rows for the table
      const fileData: FileDataRow[] = mappingData.map((item, index) => ({
        id: `row-${index}`,
        data: {
          sourceSystem: item.sourceSystem,
          sourceTable: item.sourceTable,
          sourceColumn: item.sourceColumn,
          targetSystem: item.targetSystem,
          targetTable: item.targetTable,
          targetColumn: item.targetColumn,
          transformationLogic: item.transformationLogic || '',
          businessTerm: item.businessTerm || '',
          description: item.description || '',
        },
        status: 'pending',
      }));

      setFileState(prev => ({
        ...prev,
        mappingData,
        fileData,
      }));
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        uploadStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown processing error',
      }));
    }
  };

  /**
   * Uploads a file to create a new catalog
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
      const result = await mappingService.uploadFile(file, catalogName, description);

      if (result.success && result.catalogId) {
        setFileState(prev => ({
          ...prev,
          isUploading: false,
          uploadStatus: 'success',
          catalogId: result.catalogId || null,
        }));
        return true;
      } else {
        setFileState(prev => ({
          ...prev,
          isUploading: false,
          uploadStatus: 'error',
          error: result.error || 'Unknown upload error',
        }));
        return false;
      }
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        isUploading: false,
        uploadStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown upload error',
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
        error: error instanceof Error ? error.message : 'Unknown processing error',
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
      const result = await mappingService.uploadMappingRow(row, fileState.catalogId);

      if (result.success) {
        updateRowStatus(row.id, 'success');
        return true;
      } else {
        updateRowStatus(row.id, 'error', result.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during row upload';
      updateRowStatus(row.id, 'error', errorMessage);
      return false;
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
      })),
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
    updateRowStatus,
    updateRowStatuses,
    reset,
  };
}
