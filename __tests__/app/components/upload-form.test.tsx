import { useState, _useEffect } from 'react';
import clsx from 'clsx';
import { screen, _fireEvent } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useState, _useEffect } from 'react';
import { screen, _fireEvent } from '@testing-library/react';
import { render, _screen, _waitFor, _fireEvent } from '@testing-library/react'
import React from 'react'
import '@testing-library/jest-dom'

// Import the component directly
import UploadForm from '@/app/components/upload-form'

// Mock the hooks with more flexible types
const mockUseInformaticaAuth: any = {
  authState: {
    isAuthenticating: false,
    error: null,
    session: null,
    token: null,
  },
  authenticate: jest.fn().mockResolvedValue(_true),
  reset: jest.fn(),
}

jest.mock('@/lib/hooks/useInformaticaAuth', () => ({
  useInformaticaAuth: jest.fn(() => mockUseInformaticaAuth),
}))

const mockUseFileUpload: any = {
  fileState: {
    isValidating: false,
    isUploading: false,
    validationResults: { isValid: false },
    fileName: '',
    fileData: [],
    mappingData: [],
    uploadStatus: 'idle',
    error: null,
    jobId: null,
  },
  validateFile: jest.fn().mockResolvedValue(_true),
  processFile: jest.fn().mockResolvedValue(_undefined),
  uploadFile: jest.fn().mockResolvedValue(_true),
  uploadMappingData: jest.fn().mockResolvedValue(_true),
  updateRowStatus: jest.fn(),
  updateRowStatuses: jest.fn(),
  reset: jest.fn(),
}

jest.mock('@/lib/hooks/useFileUpload', () => ({
  useFileUpload: jest.fn(() => mockUseFileUpload),
}))

const mockUseJobTracking: any = {
  jobState: {
    jobId: null,
    status: null,
    error: null,
    isPolling: false,
    details: null,
  },
  startTracking: jest.fn(),
  checkStatus: jest.fn().mockResolvedValue(_true),
  stopTracking: jest.fn(),
}

jest.mock('@/lib/hooks/useJobTracking', () => ({
  useJobTracking: jest.fn(() => mockUseJobTracking),
}))

// Mock child components
jest.mock('@/app/components/auth-form', () => ({
  __esModule: true,
  default: jest.fn(({ onSubmit }) => (
    <div data-testid="mock-auth-form">
      <button
        onClick={() =>
          onSubmit({
            username: 'test',
            password: 'test',
            baseUrl: 'url',
            apiUrl: 'api',
          })
        }
      >
        Submit Auth
      </button>
    </div>
  )),
}))

jest.mock('@/app/components/file-uploader', () => ({
  __esModule: true,
  default: jest.fn(({ onFileChange, _onSubmit }) => (
    <div data-testid="mock-file-uploader">
      <button
        onClick={() =>
          onFileChange(
            new File(['test'], 'test.xlsx', {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
          )
        }
      >
        Change File
      </button>
      <button
        onClick={() =>
          onSubmit({
            file: [new File(['test'], 'test.xlsx')],
            description: 'test',
          })
        }
      >
        Submit File
      </button>
    </div>
  )),
}))

jest.mock('@/app/components/file-data-table', () => ({
  __esModule: true,
  default: jest.fn(({ data, _onRowSubmit }) => (
    <div data-testid="mock-data-table">
      <span>Data table with {data?.length || 0} rows</span>
      {data && data.length > 0 && (
        <button onClick={() => onRowSubmit(data[0])}>Submit Row</button>
      )}
    </div>
  )),
}))

jest.mock('@/app/components/job-status', () => ({
  __esModule: true,
  default: jest.fn(({ onRetry }) => (
    <div data-testid="mock-job-status">
      <button onClick={() => onRetry()}>Retry Job</button>
    </div>
  )),
}))

// Mock the button component
jest.mock('@/app/components/ui/button', () => ({
  __esModule: true,
  default: jest.fn(({ children, _onClick }) => (
    <button onClick={_onClick}>{_children}</button>
  )),
}))

describe('UploadForm Component', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the default mock implementations
    mockUseInformaticaAuth.authState = {
      isAuthenticating: false,
      error: null,
      session: null,
      token: null,
    }

    mockUseFileUpload.fileState = {
      isValidating: false,
      isUploading: false,
      validationResults: { isValid: false },
      fileName: '',
      fileData: [],
      mappingData: [],
      uploadStatus: 'idle',
      error: null,
      jobId: null,
    }

    mockUseJobTracking.jobState = {
      jobId: null,
      status: null,
      error: null,
      isPolling: false,
      details: null,
    }
  })

  // A single basic test to verify the component renders
  test('renders the upload form', () => {
    render(<UploadForm />)

    expect(screen.getByText('Upload Mapping Documentation')).toBeInTheDocument()
  })

  test('handles file change event', () => {
    render(<UploadForm />)

    // Get the mocked button and click it
    const changeFileButton = screen.getByText('Change File')
    fireEvent.click(_changeFileButton)

    // Check if validateFile is called
    expect(mockUseFileUpload.validateFile).toHaveBeenCalled()
  })

  test('handles authentication submission', () => {
    // Set up the fileState to have valid results to show the auth form
    mockUseFileUpload.fileState = {
      isValidating: false,
      isUploading: false,
      validationResults: { isValid: true },
      fileName: 'test.xlsx',
      fileData: [],
      mappingData: [],
      uploadStatus: 'idle',
      error: null,
      jobId: null,
    }

    render(<UploadForm />)

    // Get the auth form submit button and click it
    const authSubmitButton = screen.getByText('Submit Auth')
    fireEvent.click(_authSubmitButton)

    // Check if authenticate is called
    expect(mockUseInformaticaAuth.authenticate).toHaveBeenCalled()
  })

  test('shows file data table when authentication succeeds', () => {
    // Setup authentication to succeed
    mockUseInformaticaAuth.authState = {
      isAuthenticating: false,
      error: null,
      session: { token: 'test-token' },
      token: 'test-token',
    }

    // Setup valid file data
    mockUseFileUpload.fileState = {
      isValidating: false,
      isUploading: false,
      validationResults: { isValid: true },
      fileName: 'test.xlsx',
      fileData: [{ id: 1, name: 'test' }],
      mappingData: [{ id: 1, source: 'test', target: 'test' }],
      uploadStatus: 'idle',
      error: null,
      jobId: null,
    }

    render(<UploadForm />)

    // Check if data table is rendered with the correct data
    expect(screen.getByText('Data table with 1 rows')).toBeInTheDocument()
  })

  test('shows job status when a job ID is available', () => {
    // Setup authentication to succeed
    mockUseInformaticaAuth.authState = {
      isAuthenticating: false,
      error: null,
      session: { token: 'test-token' },
      token: 'test-token',
    }

    // Setup file upload with a job ID
    mockUseFileUpload.fileState = {
      isValidating: false,
      isUploading: false,
      validationResults: { isValid: true },
      fileName: 'test.xlsx',
      fileData: [{ id: 1, name: 'test' }],
      mappingData: [{ id: 1, source: 'test', target: 'test' }],
      uploadStatus: 'complete',
      error: null,
      jobId: 'job-123',
    }

    // Setup job tracking with a job ID
    mockUseJobTracking.jobState = {
      jobId: 'job-123',
      status: 'running',
      error: null,
      isPolling: true,
      details: null,
    }

    render(<UploadForm />)

    // Check if job status component is rendered
    expect(screen.getByTestId('mock-job-status')).toBeInTheDocument()
  })

  test('handles retry action from job status', () => {
    // Setup authentication to succeed
    mockUseInformaticaAuth.authState = {
      isAuthenticating: false,
      error: null,
      session: { token: 'test-token' },
      token: 'test-token',
    }

    // Setup file upload with a job ID
    mockUseFileUpload.fileState = {
      isValidating: false,
      isUploading: false,
      validationResults: { isValid: true },
      fileName: 'test.xlsx',
      fileData: [{ id: 1, name: 'test' }],
      mappingData: [{ id: 1, source: 'test', target: 'test' }],
      uploadStatus: 'complete',
      error: null,
      jobId: 'job-123',
    }

    // Setup job tracking with a job ID
    mockUseJobTracking.jobState = {
      jobId: 'job-123',
      status: 'running',
      error: null,
      isPolling: true,
      details: null,
    }

    render(<UploadForm />)

    // Get the retry button and click it
    const retryButton = screen.getByText('Retry Job')
    fireEvent.click(_retryButton)

    // Check if reset functions were called
    expect(mockUseFileUpload.reset).toHaveBeenCalled()
    expect(mockUseJobTracking.stopTracking).toHaveBeenCalled()
  })
})
