import { useState } from 'react'
import { FileDataRow } from '@/app/components/file-data-table'
import { 
  MappingDocumentationData, 
  SessionInfo, 
  AuthTokenInfo,
  uploadMappingFile,
  importMappingDocumentation
} from '../services/informatica-mapping-service'
import { parseMappingFile, validateMappingFile } from '../utils/mapping-file-parser'

export interface FileUploadState {
  isValidating: boolean
  isUploading: boolean
  validationResults: { isValid: boolean; errors?: string[] }
  fileName: string
  fileData: FileDataRow[]
  mappingData: MappingDocumentationData[]
  uploadStatus: 'idle' | 'validating' | 'validated' | 'authenticating' | 'uploading' | 'success' | 'error'
  error: string | null
  jobId: string | null
}

export interface UseFileUploadReturn {
  fileState: FileUploadState
  validateFile: (file: File) => Promise<boolean>
  processFile: (file: File) => Promise<void>
  uploadFile: (auth: { session: SessionInfo; token: AuthTokenInfo }, file: File, description?: string) => Promise<boolean>
  uploadMappingData: (auth: { session: SessionInfo; token: AuthTokenInfo }) => Promise<boolean>
  updateRowStatus: (rowId: string, newStatus: FileDataRow['status'], error?: string) => void
  updateRowStatuses: (newStatus: FileDataRow['status'], error?: string) => void
  reset: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [fileState, setFileState] = useState<FileUploadState>({
    isValidating: false,
    isUploading: false,
    validationResults: { isValid: false },
    fileName: '',
    fileData: [],
    mappingData: [],
    uploadStatus: 'idle',
    error: null,
    jobId: null
  })

  const validateFile = async (file: File): Promise<boolean> => {
    setFileState(prev => ({ 
      ...prev, 
      isValidating: true, 
      uploadStatus: 'validating',
      fileName: file.name
    }))

    try {
      const result = await validateMappingFile(file)
      
      setFileState(prev => ({ 
        ...prev, 
        isValidating: false,
        validationResults: result,
        uploadStatus: result.isValid ? 'validated' : 'error',
        error: result.isValid ? null : (result.errors?.join(', ') || 'Unknown validation error')
      }))
      
      return result.isValid
    } catch (error) {
      setFileState(prev => ({ 
        ...prev, 
        isValidating: false,
        validationResults: { 
          isValid: false, 
          errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
        },
        uploadStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }))
      
      return false
    }
  }

  const processFile = async (file: File): Promise<void> => {
    try {
      const mappingData = await parseMappingFile(file)
      
      // Convert mapping data to table rows
      const tableData: FileDataRow[] = mappingData.map((item, index) => ({
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
          description: item.description || ''
        },
        status: 'pending'
      }))
      
      setFileState(prev => ({
        ...prev,
        fileData: tableData,
        mappingData
      }))
    } catch (error) {
      setFileState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error processing file'
      }))
    }
  }

  const uploadFile = async (
    auth: { session: SessionInfo; token: AuthTokenInfo }, 
    file: File, 
    description?: string
  ): Promise<boolean> => {
    setFileState(prev => ({ 
      ...prev, 
      isUploading: true, 
      uploadStatus: 'uploading',
      error: null
    }))
    
    try {
      const result = await uploadMappingFile(auth, file, description)
      
      setFileState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadStatus: result.success ? 'success' : 'error',
        error: result.success ? null : (result.error || 'Upload failed'),
        jobId: result.jobId || null
      }))
      
      return result.success
    } catch (error) {
      setFileState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadStatus: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
      
      return false
    }
  }

  const uploadMappingData = async (
    auth: { session: SessionInfo; token: AuthTokenInfo }
  ): Promise<boolean> => {
    setFileState(prev => ({ 
      ...prev, 
      isUploading: true, 
      uploadStatus: 'uploading',
      error: null
    }))
    
    try {
      const result = await importMappingDocumentation(auth, fileState.mappingData)
      
      setFileState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadStatus: result.success ? 'success' : 'error',
        error: result.success ? null : (result.error || 'Upload failed'),
        jobId: result.jobId || null
      }))
      
      return result.success
    } catch (error) {
      setFileState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadStatus: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
      
      return false
    }
  }

  const updateRowStatuses = (newStatus: FileDataRow['status'], error?: string) => {
    setFileState(prev => ({
      ...prev,
      fileData: prev.fileData.map(row => ({
        ...row,
        status: newStatus,
        error: error
      }))
    }))
  }

  const updateRowStatus = (rowId: string, newStatus: FileDataRow['status'], error?: string) => {
    setFileState(prev => ({
      ...prev,
      fileData: prev.fileData.map(row => 
        row.id === rowId 
          ? { ...row, status: newStatus, error: error }
          : row
      )
    }))
  }

  const reset = () => {
    setFileState({
      isValidating: false,
      isUploading: false,
      validationResults: { isValid: false },
      fileName: '',
      fileData: [],
      mappingData: [],
      uploadStatus: 'idle',
      error: null,
      jobId: null
    })
  }

  return {
    fileState,
    validateFile,
    processFile,
    uploadFile,
    uploadMappingData,
    updateRowStatus,
    updateRowStatuses,
    reset
  }
} 