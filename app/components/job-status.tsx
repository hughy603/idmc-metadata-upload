'use client'

import { useEffect } from 'react'

interface JobStatusProps {
  jobId: string | null
  status: string | null
  error: string | null
  isPolling: boolean
  onRetry: () => Promise<void>
}

export default function JobStatus({ 
  jobId, 
  status, 
  error, 
  isPolling,
  onRetry
}: JobStatusProps) {
  if (!jobId) {
    return null
  }

  const getStatusBadge = () => {
    if (error) {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
          Error
        </div>
      )
    }

    switch (status) {
      case 'PENDING':
      case 'SUBMITTED':
      case 'QUEUED':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            Pending
          </div>
        )
      case 'RUNNING':
      case 'IMPORTING':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
            Running
          </div>
        )
      case 'COMPLETED':
      case 'SUCCESS':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            Completed
          </div>
        )
      case 'FAILED':
      case 'ABORTED':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            Failed
          </div>
        )
      default:
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status || 'Unknown'}
          </div>
        )
    }
  }

  return (
    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-md shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Import Job Status</h3>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Job ID:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{jobId}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
          {getStatusBadge()}
        </div>
        
        {isPolling && (
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Checking job status...</span>
          </div>
        )}
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
            {error}
            <button 
              className="ml-3 underline font-medium" 
              onClick={() => onRetry()}
            >
              Retry
            </button>
          </div>
        )}
        
        {status === 'COMPLETED' && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">
            Import job completed successfully
          </div>
        )}
        
        {(status === 'FAILED' || status === 'ABORTED') && !error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
            Import job failed
            <button 
              className="ml-3 underline font-medium" 
              onClick={() => onRetry()}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 