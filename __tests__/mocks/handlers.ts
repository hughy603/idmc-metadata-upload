// Mock responses for Informatica API tests

export const mockAuthResponse = {
  sessionId: 'mock-session-id',
  orgId: 'mock-org-id',
  token: 'mock-token',
  expiresAt: Date.now() + 3600000,
};

export const mockFailedAuthResponse = {
  error: 'Invalid credentials',
  status: 401,
  statusText: 'Unauthorized',
};

export const mockJobResponse = {
  jobId: 'mock-job-id',
  status: 'CREATED',
};

export const mockFailedJobResponse = {
  error: 'Invalid data format',
  status: 400,
  statusText: 'Bad Request',
};

export const mockJobStatusResponse = {
  status: 'COMPLETED',
  details: {
    processedRows: 10,
    successfulRows: 10,
    failedRows: 0,
  },
};

export const mockRunningJobStatusResponse = {
  status: 'RUNNING',
  details: {
    processedRows: 5,
    successfulRows: 5,
    failedRows: 0,
  },
};

export const mockFailedJobStatusResponse = {
  status: 'FAILED',
  error: 'Import job failed',
  details: {
    processedRows: 10,
    successfulRows: 8,
    failedRows: 2,
    errors: [
      {
        row: 3,
        message: 'Invalid data in row',
      },
      {
        row: 7,
        message: 'Missing required field',
      },
    ],
  },
};
