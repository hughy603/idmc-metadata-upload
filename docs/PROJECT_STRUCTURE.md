# Project Structure Documentation

This document provides an overview of the IDMC Metadata Upload project's structure, architecture, and key components to help developers understand and work with the codebase more effectively.

## Overview

The IDMC Metadata Upload tool is a web application built with Next.js that allows users to upload, validate, and submit metadata mapping documentation to Informatica Cloud. The application follows a modern architecture with clear separation of concerns and utilizes React's component-based approach.

## Directory Structure

```
idmc-metadata-upload/
├── app/                  # Next.js application code
│   ├── components/       # React components
│   ├── api/              # API routes
│   ├── styles/           # Stylesheets
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/                  # Utility libraries and services
│   ├── services/         # Service layer for external APIs
│   ├── utils/            # Utility functions
│   ├── hooks/            # React hooks
│   └── providers/        # React context providers
├── __tests__/            # Test files
├── docs/                 # Documentation
├── public/               # Static assets
└── .github/              # GitHub Actions workflows
```

## Key Components

### Application Components (`app/components/`)

- **`upload-form.tsx`**: The main form component that orchestrates file selection, validation, and upload.
- **`file-data-table.tsx`**: Table component that displays file data with batch selection and processing capabilities.
- **`file-uploader.tsx`**: Component for handling file selection and initial validation.
- **`auth-form.tsx`**: Form for authenticating with Informatica Cloud.
- **`job-status.tsx`**: Component for displaying job tracking information.

### Services (`lib/services/`)

- **`api-rate-limiter.ts`**: Service that manages API call rate limiting for Informatica Cloud's API limits.
- **`informatica-mapping-service.ts`**: Service for interacting with Informatica Cloud APIs.

### Utilities (`lib/utils/`)

- **`auth.ts`**: Authentication utilities for Informatica Cloud.
- **`mapping-file-parser.ts`**: Utilities for parsing Excel and CSV mapping files.

### Hooks (`lib/hooks/`)

- **`useFileUpload.ts`**: Hook for managing file upload state and actions.
- **`useInformaticaAuth.ts`**: Hook for managing authentication state and actions.
- **`useJobTracking.ts`**: Hook for tracking job status.

## Data Flow

1. **Authentication**: Users authenticate with Informatica Cloud credentials
2. **File Upload**: Users select and upload mapping files
3. **Validation**: The application validates file format and content
4. **Display**: The mapping data is displayed in a table
5. **Submission**: Users can submit individual rows or batches of rows
6. **Tracking**: The application tracks the status of submitted jobs

## API Rate Limiting

The application includes a sophisticated API rate limiter to ensure we don't exceed Informatica Cloud's limit of 120 API calls per minute. The rate limiter:

- Queues API calls when limits are approached
- Prioritizes calls based on importance
- Provides status information about current rate limits
- Supports batch processing of multiple API calls

## Testing Strategy

- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test interactions between components
- **Mock Services**: Use mock services for testing API integrations

## Development Workflow

1. Use TypeScript for all code
2. Follow the provided coding style guidelines
3. Write tests for new features
4. Document complex logic and components
5. Use the pre-commit hooks for linting and formatting

## Performance Considerations

- Use batch processing for large uploads
- Implement proper error handling and retries
- Monitor API rate limits
- Optimize UI for responsiveness

## Security Considerations

- Store authentication tokens securely
- Validate all user inputs
- Use HTTPS for all connections
- Implement proper error handling to avoid leaking sensitive information
