'use client'


interface JobStatusProps {
  jobId: string | null
  status: string | null
  error: string | null
  isPolling: boolean
  onRetry: () => Promise<void>
  onReset: () => void
}

export default function JobStatus({
  jobId,
  status,
  error,
  isPolling,
  onRetry,
  onReset,
}: JobStatusProps): JSX.Element {
  if (!jobId) {
    return null
  }

  const getStatusBadge = () => {
    if (error) {
      return (
        <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-100">
          Error
        </div>
      )
    }

    switch (status) {
      case 'PENDING':
      case 'SUBMITTED':
      case 'QUEUED':
        return (
          <div className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            Pending
          </div>
        )
      case 'RUNNING':
      case 'IMPORTING':
        return (
          <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-100">
            Running
          </div>
        )
      case 'COMPLETED':
      case 'SUCCESS':
        return (
          <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-100">
            Completed
          </div>
        )
      case 'FAILED':
      case 'ABORTED':
        return (
          <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-100">
            Failed
          </div>
        )
      default:
        return (
          <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status || 'Unknown'}
          </div>
        )
    }
  }

  return (
    <div className="mt-6 rounded-md bg-white p-4 shadow dark:bg-gray-800">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Import Job Status
      </h3>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Job ID:
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {jobId}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Status:
          </span>
          {getStatusBadge()}
        </div>

        {isPolling && (
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Checking job status...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-200 dark:text-red-800">
            {error}
            <button
              className="ml-3 font-medium underline"
              onClick={() => onRetry()}
            >
              Retry
            </button>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="rounded-lg bg-green-100 p-3 text-sm text-green-700 dark:bg-green-200 dark:text-green-800">
            Import job completed successfully
          </div>
        )}

        {(status === 'FAILED' || status === 'ABORTED') && !error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-200 dark:text-red-800">
            Import job failed
            <button
              className="ml-3 font-medium underline"
              onClick={() => onRetry()}
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  )
}
