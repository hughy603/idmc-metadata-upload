'use client'

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
import type { InformaticaAuthCredentials } from '@/lib/utils/auth';

import AuthForm from './auth-form';
import type { FileDataRow } from './file-data-table';
import FileDataTable from './file-data-table';
import type { FileUploaderValues } from './file-uploader';
import FileUploader from './file-uploader';
import JobStatus from './job-status';

export default function UploadForm(): JSX.Element {
  const [showTable, setShowTable] = useState(false);
  const [autoProcessingMessage, _setAutoProcessingMessage] = useState<string | null>(null);

  const {
    authState,
    reset: _resetAuth,
    authenticate,
  } = useInformaticaAuth();

  const {
    jobState,
    startTracking,
    checkStatus: _checkStatus,
    stopTracking,
  } = useJobTracking();

  const {
    fileState,
    validateFile,
    processFile,
    uploadFile: _uploadFile,
    uploadMappingRow,
    updateRowStatus,
    reset: resetFileUpload,
  } = useFileUpload();

  useEffect(() => {
    const checkAuth = async () => {
      if (authState.isAuthenticated) {
        setShowTable(false);
        resetFileUpload();
      }
    };
    void checkAuth();
  }, [authState.isAuthenticated, resetFileUpload]);

  const handleFileChange = async (file: File) => {
    try {
      const isValid = await validateFile(file);
      if (isValid) {
        await processFile(file);
      }
    } catch (error) {
      console.error('File processing failed:', error);
    }
  };

  const handleSubmit = async (values: FileUploaderValues) => {
    if (!values.file) return;

    try {
      const isValid = await validateFile(values.file);
      if (isValid) {
        await processFile(values.file);
        setShowTable(true);
      }
    } catch (error) {
      console.error('File processing failed:', error);
    }
  };

  const handleRowSubmit = async (row: FileDataRow) => {
    try {
      updateRowStatus(row.id, 'processing');
      const uploadSuccess = await uploadMappingRow(row);

      if (uploadSuccess && fileState.catalogId) {
        const auth = {
          session: {
            sessionId: localStorage.getItem('informatica_session_id') || '',
            orgId: localStorage.getItem('informatica_org_id') || '',
            expiresAt: localStorage.getItem('informatica_session_expires') || ''
          },
          token: {
            token: localStorage.getItem('informatica_token') || '',
            expiresAt: Number(localStorage.getItem('informatica_token_expires') || '0')
          }
        };
        startTracking(auth, fileState.catalogId);
      }
    } catch (error) {
      updateRowStatus(row.id, 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleAuthenticate = async (credentials: InformaticaAuthCredentials) => {
    await authenticate(credentials);
  };

  const handleOAuthLogin = async () => {
    try {
      await authenticate({
        type: 'oauth',
        username: '',
        password: '',
      } as InformaticaAuthCredentials);
    } catch (error) {
      console.error('OAuth login failed:', error);
    }
  };

  const handleReset = () => {
    stopTracking();
    setShowTable(false);
    resetFileUpload();
  };

  // Render loading state
  if (authState.isAuthenticating || fileState.isUploading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          {authState.isAuthenticating ? 'Authenticating...' : 'Processing file...'}
        </span>
      </div>
    );
  }

  // Render job status if needed
  if (jobState.jobId && (jobState.isPolling || jobState.status === 'COMPLETED' || jobState.status === 'FAILED')) {
    return (
      <JobStatus
        jobId={jobState.jobId}
        status={jobState.status}
        error={jobState.error}
        isPolling={jobState.isPolling}
        onRetry={async () => {
          if (jobState.jobId) {
            const auth = {
              session: {
                sessionId: localStorage.getItem('informatica_session_id') || '',
                orgId: localStorage.getItem('informatica_org_id') || '',
                expiresAt: localStorage.getItem('informatica_session_expires') || ''
              },
              token: {
                token: localStorage.getItem('informatica_token') || '',
                expiresAt: Number(localStorage.getItem('informatica_token_expires') || '0')
              }
            };
            startTracking(auth, jobState.jobId);
          }
        }}
        onReset={handleReset}
      />
    );
  }

  return (
    <div>
      {/* Step 1: Authentication */}
      {!authState.isAuthenticated && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 1: Authenticate
          </h3>
          <AuthForm
            isLoading={authState.isAuthenticating}
            error={authState.error}
            onSubmit={handleAuthenticate}
            onOAuthLogin={handleOAuthLogin}
          />
        </div>
      )}

      {/* Step 2: File Upload */}
      {authState.isAuthenticated && !showTable && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 2: Upload Mapping File
          </h3>
          <FileUploader
            isValidating={fileState.isValidating}
            isUploading={fileState.isUploading}
            fileName={fileState.fileName}
            validationError={fileState.error}
            isFileValid={!fileState.error && fileState.fileName !== null}
            onSubmit={handleSubmit}
            onFileChange={handleFileChange}
          />
        </div>
      )}

      {/* Auto processing message */}
      {autoProcessingMessage && (
        <div className="mb-4 mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          <div className="flex items-center">
            <div className="mr-2 animate-spin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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

      {/* Step 3: Review and Process */}
      {showTable && fileState.fileData && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 3: Review and Process
          </h3>
          <FileDataTable
            data={fileState.fileData}
            onRowSubmit={handleRowSubmit}
          />
        </div>
      )}
    </div>
  );
}
