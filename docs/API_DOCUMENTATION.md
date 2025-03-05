# API Documentation

This document provides detailed information about the IDMC Metadata Upload project's APIs, services, and utility functions.

## Table of Contents

- [Services](#services)
  - [API Rate Limiter](#api-rate-limiter)
  - [Informatica Mapping Service](#informatica-mapping-service)
- [Hooks](#hooks)
  - [useFileUpload](#usefileupload)
  - [useInformaticaAuth](#useinformaticaauth)
  - [useJobTracking](#usejobtracking)
- [Utilities](#utilities)
  - [Mapping File Parser](#mapping-file-parser)
  - [Authentication](#authentication)

## Services

### API Rate Limiter

The API Rate Limiter service ensures we don't exceed Informatica Cloud's API rate limits (120 calls per minute).

#### Usage

```typescript
import { apiRateLimiter } from '@/lib/services/api-rate-limiter';

// Enqueueing a single API call
apiRateLimiter.enqueue(
  async () => {
    // API call here
    return await fetch('https://api.example.com/data');
  },
  { priority: 1 } // Optional priority
);

// Batch enqueueing multiple API calls
const calls = [
  () => fetch('https://api.example.com/data/1'),
  () => fetch('https://api.example.com/data/2'),
  () => fetch('https://api.example.com/data/3'),
];

apiRateLimiter.batchEnqueue(calls, {
  onProgress: (completed, total, results) => {
    console.log(`Completed ${completed} of ${total}`);
  },
});

// Getting rate limit status
const status = apiRateLimiter.getRateLimitStatus();
console.log(
  `${status.callsInLastMinute} calls made, ${status.remaining} remaining`
);
```

#### API Reference

##### `enqueue<T>(apiCall, options)`

Enqueues a single API call to be executed with rate limiting.

- **Parameters**:
  - `apiCall`: `() => Promise<T>` - Function that executes the API call
  - `options`: `{ priority?: number, metadata?: Record<string, any> }` - Optional configuration
- **Returns**: `Promise<T>` - Promise that resolves with the API call result

##### `batchEnqueue<T>(apiCalls, options)`

Batch enqueues multiple API calls with automatic rate limiting.

- **Parameters**:
  - `apiCalls`: `Array<() => Promise<T>>` - Array of functions that execute API calls
  - `options`: `{ onProgress?: (completed, total, results) => void, priority?: number }` - Optional configuration
- **Returns**: `Promise<(T | Error)[]>` - Promise that resolves when all calls are complete

##### `getRateLimitStatus()`

Gets the current rate limit status.

- **Returns**:
  ```typescript
  {
    callsInLastMinute: number;
    maxCallsPerMinute: number;
    queueLength: number;
    remaining: number;
    limit: number;
    resetAt: number;
  }
  ```

##### `pause()`

Pauses processing the queue temporarily.

##### `resume()`

Resumes processing the queue if paused.

##### `clearQueue()`

Clears all items from the queue.

### Informatica Mapping Service

The Informatica Mapping Service handles communication with the Informatica Cloud API for submitting mapping documentation.

#### Usage

```typescript
import { InformaticaMappingService } from '@/lib/services/informatica-mapping-service';

// Initialize service
const service = new InformaticaMappingService(authState);

// Upload mapping
const result = await service.uploadMapping({
  sourceSystem: 'CRM',
  sourceTable: 'Customers',
  sourceColumn: 'CustomerID',
  targetSystem: 'DataWarehouse',
  targetTable: 'DimCustomer',
  targetColumn: 'CustomerKey',
});

// Check job status
const status = await service.getJobStatus(jobId);
```

## Hooks

### useFileUpload

The `useFileUpload` hook manages file upload state and actions.

#### Usage

```typescript
import { useFileUpload } from '@/lib/hooks/useFileUpload';

function UploadComponent() {
  const {
    fileState,
    validateFile,
    processFile,
    uploadFile,
    uploadMappingRow,
    uploadMappingBatch,
    reset,
  } = useFileUpload();

  const handleFileChange = async file => {
    await validateFile(file);
    if (fileState.validationResults.isValid) {
      await processFile(file);
    }
  };

  // ...
}
```

#### API Reference

##### `fileState`

Object containing the current state of the file upload process.

```typescript
{
  fileName: string | null;
  isValidating: boolean;
  isProcessing: boolean;
  isUploading: boolean;
  error: string | null;
  fileData: FileDataRow[];
  validationResults: {
    isValid: boolean;
    errors: string[];
  };
  catalogId: string | null;
  batchProgress: {
    completed: number;
    total: number;
    success: number;
    failed: number;
  } | null;
}
```

##### `validateFile(file)`

Validates the file format and structure.

- **Parameters**:
  - `file`: `File` - The file to validate
- **Returns**: `Promise<void>`

##### `processFile(file)`

Processes the file and extracts the mapping data.

- **Parameters**:
  - `file`: `File` - The file to process
- **Returns**: `Promise<void>`

##### `uploadFile(file, catalogName, description)`

Uploads the file to Informatica Cloud.

- **Parameters**:
  - `file`: `File` - The file to upload
  - `catalogName`: `string` - The name of the catalog
  - `description`: `string` - Description of the upload
- **Returns**: `Promise<void>`

##### `uploadMappingRow(row)`

Uploads a single mapping row to Informatica Cloud.

- **Parameters**:
  - `row`: `FileDataRow` - The row to upload
- **Returns**: `Promise<void>`

##### `uploadMappingBatch(rows)`

Uploads multiple mapping rows to Informatica Cloud.

- **Parameters**:
  - `rows`: `FileDataRow[]` - The rows to upload
- **Returns**: `Promise<void>`

##### `reset()`

Resets the file upload state.

### useInformaticaAuth

The `useInformaticaAuth` hook manages authentication state and actions for Informatica Cloud.

#### Usage

```typescript
import { useInformaticaAuth } from '@/lib/hooks/useInformaticaAuth';

function AuthComponent() {
  const { authState, authenticate, logout } = useInformaticaAuth();

  const handleLogin = async credentials => {
    await authenticate(credentials);
  };

  // ...
}
```

### useJobTracking

The `useJobTracking` hook manages job tracking state and actions.

#### Usage

```typescript
import { useJobTracking } from '@/lib/hooks/useJobTracking';

function JobTrackingComponent() {
  const { jobState, startTracking, stopTracking } = useJobTracking();

  // ...
}
```

## Utilities

### Mapping File Parser

The Mapping File Parser utility provides functions for parsing Excel and CSV mapping files.

#### Usage

```typescript
import { parseExcelFile, parseCsvFile } from '@/lib/utils/mapping-file-parser';

// Parse Excel file
const excelData = await parseExcelFile(file);

// Parse CSV file
const csvData = await parseCsvFile(file);
```

### Authentication

The Authentication utility provides functions for handling authentication with Informatica Cloud.

#### Usage

```typescript
import { authenticate, refreshToken } from '@/lib/utils/auth';

// Authenticate
const authResult = await authenticate({
  username: 'user@example.com',
  password: 'password',
  region: 'us',
});

// Refresh token
const refreshResult = await refreshToken(authState);
```
