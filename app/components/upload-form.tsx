'use client';

/**
 * TODO: Fix the following issues:
 * 1. Ensure proper types for FileUploaderValues (add catalogName and autoProcess properties)
 * 2. Fix startTracking and checkStatus calls to include all required parameters
 * 3. Update row status types to include 'completed' if needed
 * 4. Fix AuthState type to include token and session properties
 * 5. Fix MappingDocumentationData type to include id property
 */

import { useEffect, useState } from 'react';

import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { useInformaticaAuth } from '@/lib/hooks/useInformaticaAuth';
import { useJobTracking } from '@/lib/hooks/useJobTracking';
import { apiRateLimiter } from '@/lib/services/api-rate-limiter';
import type { InformaticaAuthCredentials } from '@/lib/utils/auth';

import AuthForm from './auth-form';
import type { FileDataRow } from './file-data-table';
import FileDataTable from './file-data-table';
import type { FileUploaderValues } from './file-uploader';
import FileUploader from './file-uploader';
import JobStatus from './job-status';

/**
 * Interface for FileUploaderValues with added properties
 */
interface ExtendedFileUploaderValues extends FileUploaderValues {
  /** Name of the catalog to upload to */
  catalogName?: string;
  /** Whether to automatically process the file after upload */
  autoProcess?: boolean;
}

/**
 * Interface for auth information from local storage
 */
interface StoredAuthInfo {
  session: {
    sessionId: string;
    orgId: string;
    expiresAt: string;
  };
  token: {
    token: string;
    expiresAt: number;
  };
}

/**
 * Main form component for file upload and processing
 */
export default function UploadForm(): JSX.Element {
  const [showFileData, setShowFileData] = useState(false);
  const [autoProcess, _setAutoProcess] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState(
    apiRateLimiter.getRateLimitStatus()
  );

  // Update rate limit status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStatus(apiRateLimiter.getRateLimitStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { authState, authenticate, logout } = useInformaticaAuth();

  const {
    fileState,
    validateFile,
    processFile,
    uploadFile,
    uploadMappingRow,
    uploadMappingBatch,
    reset: resetFileUpload,
  } = useFileUpload();

  const { jobState, startTracking, stopTracking } = useJobTracking();

  /**
   * Handle form submission with file upload
   */
  const handleSubmit = async (
    values: ExtendedFileUploaderValues
  ): Promise<void> => {
    if (!values.file) return;

    await validateFile(values.file);
    await processFile(values.file);
    setShowFileData(true);

    if (autoProcess && fileState.fileData.length > 0) {
      await uploadFile(
        values.file,
        values.catalogName || 'Default Catalog',
        'Imported mappings'
      );
    }
  };

  /**
   * Get auth info from local storage
   */
  const getAuthFromLocalStorage = (): StoredAuthInfo => {
    return {
      session: {
        sessionId: localStorage.getItem('informatica_session_id') || '',
        orgId: localStorage.getItem('informatica_org_id') || '',
        expiresAt: localStorage.getItem('informatica_session_expires') || '',
      },
      token: {
        token: localStorage.getItem('informatica_token') || '',
        expiresAt: Number(
          localStorage.getItem('informatica_token_expires') || '0'
        ),
      },
    };
  };

  /**
   * Handle single row submission
   */
  const handleRowSubmit = async (row: FileDataRow): Promise<void> => {
    if (!authState.isAuthenticated) return;

    try {
      const auth = getAuthFromLocalStorage();

      await uploadMappingRow(row);

      if (fileState.catalogId) {
        startTracking(auth, fileState.catalogId);
      }
    } catch (err) {
      console.error('Failed to submit row:', err);
    }
  };

  /**
   * Handle batch submission of multiple rows
   */
  const handleBatchSubmit = async (rows: FileDataRow[]): Promise<void> => {
    if (!authState.isAuthenticated || rows.length === 0) return;

    try {
      const auth = getAuthFromLocalStorage();

      await uploadMappingBatch(rows);

      if (fileState.catalogId) {
        startTracking(auth, fileState.catalogId);
      }
    } catch (err) {
      console.error('Failed to submit batch:', err);
    }
  };

  /**
   * Reset all form state
   */
  const _handleReset = (): void => {
    resetFileUpload();
    stopTracking();
    setShowFileData(false);
  };

  /**
   * Handle login form submission
   */
  const handleLogin = async (
    credentials: InformaticaAuthCredentials
  ): Promise<void> => {
    await authenticate(credentials);
  };

  /**
   * Handle retry for job tracking
   */
  const handleRetry = async (): Promise<void> => {
    if (jobState.jobId) {
      const auth = getAuthFromLocalStorage();
      startTracking(auth, jobState.jobId);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="overflow-hidden rounded-lg bg-gray-50 shadow dark:bg-gray-900">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            IDMC Metadata Upload
          </h2>
          <div className="mt-4">
            {!authState.isAuthenticated && (
              <AuthForm
                isLoading={authState.isAuthenticating}
                error={authState.error}
                onSubmit={handleLogin}
              />
            )}

            {authState.isAuthenticated && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Excel File
                  </h3>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-md bg-red-100 px-2.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                  >
                    Logout
                  </button>
                </div>

                <FileUploader
                  isValidating={fileState.isValidating}
                  isUploading={fileState.isUploading}
                  fileName={fileState.fileName}
                  validationError={fileState.error}
                  isFileValid={fileState.validationResults.isValid}
                  onFileChange={async (file: File) => {
                    await validateFile(file);
                  }}
                  onSubmit={handleSubmit}
                />

                {/* Display validation errors if any */}
                {fileState.validationResults.errors &&
                  fileState.validationResults.errors.length > 0 && (
                    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Validation Errors
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <ul className="list-disc space-y-1 pl-5">
                              {fileState.validationResults.errors.map(
                                (err, idx) => (
                                  <li key={idx}>{err}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Display general error if any */}
                {fileState.error && (
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          {fileState.error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display upload progress */}
                {fileState.isUploading && (
                  <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900">
                    <div className="flex">
                      <div className="ml-3 w-full">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {fileState.batchProgress
                            ? 'Processing Batch Upload'
                            : 'Processing File'}
                        </h3>
                        {fileState.batchProgress ? (
                          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <p>
                              Processing {fileState.batchProgress.completed} of{' '}
                              {fileState.batchProgress.total} rows
                            </p>
                            <div className="mt-1 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-700">
                              <div
                                className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                                style={{
                                  width: `${(fileState.batchProgress.completed / fileState.batchProgress.total) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <div className="mt-1 flex justify-between text-xs">
                              <span>
                                Success: {fileState.batchProgress.success}
                              </span>
                              <span>
                                Failed: {fileState.batchProgress.failed}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <p>Upload progress: {0}%</p>
                            <div className="mt-1 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-700">
                              <div
                                className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                                style={{ width: `0%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Display API rate limit status */}
                <div className="rounded-md bg-gray-100 p-4 dark:bg-gray-800">
                  <div className="flex flex-wrap items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Rate Limits
                    </h3>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="mr-4">
                        Calls: {rateLimitStatus.callsInLastMinute}/
                        {rateLimitStatus.limit}
                      </span>
                      <span>Queue: {rateLimitStatus.queueLength}</span>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-1.5 rounded-full ${
                        rateLimitStatus.callsInLastMinute >
                        rateLimitStatus.limit * 0.8
                          ? 'bg-amber-500 dark:bg-amber-500'
                          : 'bg-green-500 dark:bg-green-500'
                      }`}
                      style={{
                        width: `${(rateLimitStatus.callsInLastMinute / rateLimitStatus.limit) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Display job status if available */}
                {jobState.jobId && !jobState.error && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Job Status
                    </h3>
                    <JobStatus
                      jobId={jobState.jobId}
                      status={jobState.status || 'PENDING'}
                      error={jobState.error}
                      isPolling={jobState.isPolling}
                      onRetry={async () => {
                        if (jobState.jobId) {
                          await handleRetry();
                        }
                      }}
                      onReset={() => stopTracking()}
                    />
                  </div>
                )}

                {/* Display file data table if available */}
                {showFileData && fileState.fileData.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      File Data
                    </h3>

                    {/* Show progress indicator when processing large files */}
                    {fileState.isProcessing && fileState.processProgress && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                          Processing file data: {fileState.processProgress.processed} of {fileState.processProgress.total} rows ({fileState.processProgress.percentage}%)
                        </p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-in-out dark:bg-blue-500"
                            style={{ width: `${fileState.processProgress.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <FileDataTable
                      data={fileState.fileData}
                      onRowSubmit={handleRowSubmit}
                      onBatchSubmit={handleBatchSubmit}
                      initialPageSize={25}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
