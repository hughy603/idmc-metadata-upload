'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import FileDataTable, { FileDataRow } from './file-data-table'
import AuthForm from './auth-form'
import FileUploader, { FileUploaderValues } from './file-uploader'
import JobStatus from './job-status'
import { useInformaticaAuth } from '@/lib/hooks/useInformaticaAuth'
import { useFileUpload } from '@/lib/hooks/useFileUpload'
import { useJobTracking } from '@/lib/hooks/useJobTracking'
import { InformaticaAuthCredentials } from '@/lib/services/informatica-mapping-service'

export default function UploadForm() {
  const [showTable, setShowTable] = useState(false)
  const [autoProcessingMessage, setAutoProcessingMessage] = useState<string | null>(null)

  // Use our custom hooks
  const { authState, authenticate, reset: resetAuth } = useInformaticaAuth()
  const {
    fileState,
    validateFile,
    processFile,
    uploadFile,
    uploadMappingData,
    updateRowStatus,
    updateRowStatuses,
    reset: resetFileUpload
  } = useFileUpload()
  const {
    jobState,
    startTracking,
    checkStatus,
    stopTracking
  } = useJobTracking()

  // Check for OAuth authentication success on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const params = new URLSearchParams(window.location.search)
      const authSuccess = params.get('auth') === 'success'
      const authError = params.get('error')

      if (authSuccess) {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Fetch token status from API
        try {
          const response = await fetch('/api/auth/status')
          if (response.ok) {
            const data = await response.json()
            if (data.authenticated) {
              // User is authenticated via OAuth
              // You may want to update the authentication state here
              setShowTable(true)
            }
          }
        } catch (error) {
          console.error('Error checking auth status:', error)
        }
      } else if (authError) {
        // Clean up URL and show error
        window.history.replaceState({}, document.title, window.location.pathname)
        // Handle auth error
      }
    }

    checkAuthStatus()
  }, [])

  // Handler for authentication form submission
  const handleAuthenticate = async (credentials: InformaticaAuthCredentials) => {
    const success = await authenticate(credentials)
    if (success && fileState.fileData.length > 0) {
      setShowTable(true)
    }
  }

  // Handler for OAuth authentication
  const handleOAuthLogin = async () => {
    // Redirect to the OAuth initialization endpoint
    window.location.href = '/api/auth/sso?region=US'
  }

  // Handler for file upload form submission
  const handleFileUpload = async (values: FileUploaderValues) => {
    if (!authState.session && !authState.token) {
      return
    }

    try {
      // Process the file based on its format
      const result = await processFile(values.file)

      if (result.success) {
        setShowTable(true)

        // If auto-processing is enabled, automatically start processing the data
        if (values.autoProcess) {
          setAutoProcessingMessage('Starting automatic processing of all rows...')
          // Process all rows in batches
          const batchSize = 5 // Process 5 rows at a time
          const rows = [...fileState.fileData]

          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize)
            const statuses: Record<string, FileDataRow['status']> = {}

            batch.forEach(row => {
              statuses[row.id] = 'processing'
            })

            updateRowStatuses(statuses)

            await Promise.all(
              batch.map(async (row) => {
                try {
                  // Submit the row to Informatica
                  await uploadMappingData(row)
                  updateRowStatus(row.id, 'success')
                } catch (error) {
                  updateRowStatus(row.id, 'error', error instanceof Error ? error.message : 'Submission failed')
                }
              })
            )

            // Update status message
            setAutoProcessingMessage(`Processed ${Math.min(i + batchSize, rows.length)} of ${rows.length} rows...`)
          }

          setAutoProcessingMessage(null)
        }
      }
    } catch (error) {
      console.error('File processing error:', error)
    }
  }

  const handleFileChange = async (file: File) => {
    try {
      // Validate the file format
      const result = await validateFile(file)

      if (!result.success) {
        // File validation failed
        console.error('File validation failed:', result.error)
      }
    } catch (error) {
      console.error('File validation error:', error)
    }
  }

  const handleRowSubmit = async (row: FileDataRow) => {
    // Update status to processing
    updateRowStatus(row.id, 'processing')

    try {
      // Submit the row to Informatica
      const submissionResult = await uploadMappingData(row)

      if (submissionResult.jobId) {
        // Start tracking the job
        await startTracking(submissionResult.jobId)
        // Check status immediately
        await checkStatus()
      }

      // Update status to success
      updateRowStatus(row.id, 'success')
    } catch (error) {
      // Update status to error
      updateRowStatus(
        row.id,
        'error',
        error instanceof Error ? error.message : 'Submission failed'
      )
    }
  }

  const handleRetryJob = async () => {
    if (jobState.jobId) {
      // Restart status tracking
      await startTracking(jobState.jobId)
      await checkStatus()
    }
  }

  const handleReset = () => {
    resetAuth()
    resetFileUpload()
    stopTracking()
    setShowTable(false)
    setAutoProcessingMessage(null)
  }

  // Render loading state
  if (authState.isAuthenticating || fileState.isProcessing) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          {authState.isAuthenticating ? 'Authenticating...' : 'Processing file...'}
        </span>
      </div>
    )
  }

  // Render job status if needed
  if (jobState.jobId && (jobState.isProcessing || jobState.isCompleted || jobState.hasFailed)) {
    return (
      <JobStatus
        jobState={jobState}
        onRetry={handleRetryJob}
        onReset={handleReset}
      />
    )
  }

  return (
    <div>
      {/* Step 1: Authentication */}
      {!authState.token && !authState.session && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Step 1: Authenticate</h3>
          <AuthForm
            isLoading={authState.isAuthenticating}
            error={authState.error}
            onSubmit={handleAuthenticate}
            onOAuthLogin={handleOAuthLogin}
          />
        </div>
      )}

      {/* Step 2: File Upload */}
      {(authState.token || authState.session) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {!showTable ? 'Step 2: Upload Mapping File' : 'File Upload Details'}
          </h3>
          <FileUploader
            isUploading={fileState.isProcessing}
            error={fileState.error}
            onSubmit={handleFileUpload}
            onFileChange={handleFileChange}
            fileName={fileState.fileName}
          />
        </div>
      )}

      {/* Auto processing message */}
      {autoProcessingMessage && (
        <div className="mt-4 mb-4 p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-md dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
          <div className="flex items-center">
            <div className="animate-spin mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            </div>
            {autoProcessingMessage}
          </div>
        </div>
      )}

      {/* Step 3: Data Table */}
      {showTable && fileState.fileData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">File Data</h3>
          <FileDataTable
            data={fileState.fileData}
            onRowSubmit={handleRowSubmit}
          />

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Reset Form
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
