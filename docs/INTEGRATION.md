# Informatica Mapping Documentation Integration Guide

This guide explains how to integrate and use the Informatica Mapping Documentation services in various contexts.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Mapping Documentation Upload](#mapping-documentation-upload)
4. [Job Status Monitoring](#job-status-monitoring)
5. [File Parsing Utilities](#file-parsing-utilities)
6. [UI Integration](#ui-integration)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

The Informatica Mapping Documentation service allows you to submit source-to-target mapping documentation to Informatica Cloud's Data Catalog. This documentation helps maintain lineage information and business term associations in your data catalog.

The solution includes:

- Authentication with Informatica Cloud
- Mapping documentation submission via API
- File parsing utilities for Excel and CSV files
- Job status monitoring
- UI integration components

## Authentication

Authentication is required before any operations with Informatica Cloud's API.

```typescript
import { authenticateWithInformatica } from '@/lib/services/informatica-mapping-service';

// Authentication
async function authenticate() {
  const sessionInfo = await authenticateWithInformatica({
    username: 'your-username',
    password: 'your-password',
    baseUrl: 'https://dm-us.informaticacloud.com', // US region
    apiUrl: 'https://na1.dm-us.informaticacloud.com/ma/api'
  });

  // Store the session info for later use
  return sessionInfo;
}
```

**Important Notes:**

- The JWT token expires after 30 minutes
- Choose the appropriate region URL based on your Informatica Cloud instance:
  - US: `https://dm-us.informaticacloud.com`
  - EMEA: `https://dm-em.informaticacloud.com`
  - APJ: `https://dm-ap.informaticacloud.com`

## Mapping Documentation Upload

There are two main ways to upload mapping documentation:

### Method 1: Programmatic Submission

Submit mapping data programmatically:

```typescript
import { 
  authenticateWithInformatica, 
  importMappingDocumentation 
} from '@/lib/services/informatica-mapping-service';

async function submitMapping() {
  // First authenticate
  const sessionInfo = await authenticateWithInformatica({
    username: 'your-username',
    password: 'your-password',
    baseUrl: 'https://dm-us.informaticacloud.com',
    apiUrl: 'https://na1.dm-us.informaticacloud.com/ma/api'
  });

  // Prepare mapping data
  const mappingData = [
    {
      sourceSystem: 'SourceSystem1',
      sourceTable: 'SourceTable1',
      sourceColumn: 'SourceColumn1',
      targetSystem: 'TargetSystem1',
      targetTable: 'TargetTable1',
      targetColumn: 'TargetColumn1',
      transformationLogic: 'TRIM(SourceColumn1)',
      businessTerm: 'CustomerID',
      description: 'Primary customer identifier'
    },
    // Add more mapping entries as needed
  ];

  // Submit the mapping documentation
  const result = await importMappingDocumentation({
    mappingData: mappingData,
    sessionInfo: sessionInfo,
    description: 'Monthly ETL mapping documentation'
  });

  console.log(`Job ID: ${result.jobId}`);
  return result;
}
```

### Method 2: File Upload

Upload an Excel or CSV file containing mapping documentation:

```typescript
import { 
  authenticateWithInformatica, 
  uploadMappingFile 
} from '@/lib/services/informatica-mapping-service';
import { validateMappingFile } from '@/lib/utils/mapping-file-parser';

async function uploadMappingFromFile(file: File) {
  // First validate the file
  const validationResult = await validateMappingFile(file);
  
  if (!validationResult.isValid) {
    console.error('Validation errors:', validationResult.errors);
    return;
  }
  
  // Authenticate
  const sessionInfo = await authenticateWithInformatica({
    username: 'your-username',
    password: 'your-password',
    baseUrl: 'https://dm-us.informaticacloud.com',
    apiUrl: 'https://na1.dm-us.informaticacloud.com/ma/api'
  });
  
  // Upload the file
  const result = await uploadMappingFile({
    file: file,
    sessionInfo: sessionInfo,
    description: 'Mapping upload from file'
  });
  
  console.log(`Job ID: ${result.jobId}`);
  return result;
}
```

## Job Status Monitoring

After submitting a mapping job, you can monitor its status:

```typescript
import { checkImportJobStatus } from '@/lib/services/informatica-mapping-service';

async function monitorJobStatus(jobId: string, sessionInfo: AuthTokenInfo) {
  let status = 'RUNNING';
  let attempts = 0;
  const maxAttempts = 30; // Maximum attempts to check status
  
  while (status === 'RUNNING' && attempts < maxAttempts) {
    const statusResult = await checkImportJobStatus({ 
      jobId, 
      sessionInfo 
    });
    
    status = statusResult.status;
    console.log(`Job ${jobId} status: ${status}`);
    
    if (status === 'RUNNING') {
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
  }
  
  return status;
}
```

## File Parsing Utilities

The solution includes utilities to parse Excel and CSV files:

```typescript
import { 
  parseMappingFile, 
  validateMappingFile, 
  generateMappingTemplate 
} from '@/lib/utils/mapping-file-parser';

// Parse a mapping file
async function parseFile(file: File) {
  try {
    const mappingData = await parseMappingFile(file);
    console.log('Parsed mapping data:', mappingData);
    return mappingData;
  } catch (error) {
    console.error('Error parsing file:', error);
  }
}

// Validate a mapping file
async function validateFile(file: File) {
  const result = await validateMappingFile(file);
  
  if (result.isValid) {
    console.log('File is valid. Mapping data:', result.mappingData);
  } else {
    console.error('Validation errors:', result.errors);
  }
  
  return result;
}

// Generate a template file
function downloadTemplate() {
  const template = generateMappingTemplate();
  const blob = new Blob([template], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mapping_template.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

### File Format Requirements

The mapping file (Excel or CSV) must include the following column headers:

- **Required**:
  - `SourceSystem`
  - `SourceTable`
  - `SourceColumn`
  - `TargetSystem`
  - `TargetTable`
  - `TargetColumn`

- **Optional**:
  - `TransformationLogic`
  - `BusinessTerm`
  - `Description`

## UI Integration

The solution includes a React component for integrating with your UI:

```tsx
// In your React component
import { useState } from 'react';
import { authenticateWithInformatica, uploadMappingFile } from '@/lib/services/informatica-mapping-service';
import { validateMappingFile } from '@/lib/utils/mapping-file-parser';
import FileDataTable from '@/app/components/file-data-table';

function MappingUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  // ... more state variables

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    await validateFile(selectedFile);
  };

  const validateFile = async (fileToValidate: File) => {
    setIsValidating(true);
    try {
      const result = await validateMappingFile(fileToValidate);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (credentials: { username: string; password: string; region: string }) => {
    // Process based on your UI flow
    // 1. Authenticate
    // 2. Upload the file
    // 3. Check job status
  };

  return (
    <div>
      {/* Your UI components here */}
    </div>
  );
}
```

## Error Handling

Common errors and how to handle them:

### Authentication Errors

- Invalid credentials: Ensure username and password are correct
- Network errors: Check connectivity to Informatica Cloud
- Region errors: Verify the correct base URL and API URL for your region

### File Validation Errors

- Missing required columns: Ensure all required columns are present
- Format errors: Verify the file is a valid Excel or CSV format
- Empty file: The file must contain data rows

### API Errors

- Token expiration: Re-authenticate if the token has expired (after 30 minutes)
- Permission errors: Ensure the user has appropriate permissions in Informatica Cloud
- Rate limits: Handle potential rate limiting from the API

## Best Practices

1. **Authentication**:
   - Implement secure credential storage
   - Re-authenticate when the token expires
   - Don't hardcode credentials in your code

2. **File Handling**:
   - Validate files before submission
   - Provide clear error messages to users
   - Limit file size to improve performance

3. **Error Handling**:
   - Implement comprehensive error handling
   - Provide meaningful error messages to users
   - Log detailed errors for troubleshooting

4. **Performance**:
   - Process large files in chunks if necessary
   - Implement pagination for displaying large datasets
   - Consider background processing for time-consuming operations

5. **Security**:
   - Never expose credentials in client-side code
   - Implement proper authentication and authorization
   - Validate all user inputs

---

For more information, refer to the [Informatica Cloud REST API documentation](https://network.informatica.com/docs/DOC-18245). 