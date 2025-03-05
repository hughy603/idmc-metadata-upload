# IDMC Metadata Upload Architecture

This document outlines the architecture of the IDMC Metadata Upload application, including component relationships, data flow, and system interactions.

## System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Web UI]
        FC[File Component]
        TC[Table Component]
        VS[Validation Service]
    end

    subgraph "Backend Layer"
        API[Next.js API Routes]
        PS[Processing Service]
        FS[File Service]
    end

    subgraph "External Services"
        IC[Informatica Cloud]
        DC[Data Catalog]
    end

    UI --> FC
    UI --> TC
    FC --> VS
    VS --> API
    API --> PS
    PS --> FS
    PS --> IC
    IC --> DC
```

## Component Architecture

```mermaid
classDiagram
    class FileUploadComponent {
        +handleFileSelect()
        +validateFile()
        +processFile()
    }

    class FileDataTable {
        +displayData()
        +handleRowSelection()
        +updateStatus()
        +retryProcessing()
    }

    class ValidationService {
        +validateColumns()
        +validateDataTypes()
        +validateRules()
    }

    class ProcessingService {
        +processRows()
        +batchProcess()
        +handleErrors()
    }

    FileUploadComponent --> ValidationService
    FileUploadComponent --> FileDataTable
    FileDataTable --> ProcessingService
    ProcessingService --> ValidationService
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Web UI
    participant VS as Validation Service
    participant PS as Processing Service
    participant IC as Informatica Cloud

    User->>UI: Upload File
    UI->>VS: Validate File
    VS-->>UI: Validation Results
    UI->>PS: Process Valid Data
    PS->>IC: Submit Mapping Data
    IC-->>PS: Processing Status
    PS-->>UI: Update Status
    UI-->>User: Display Results
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> FileSelected: Select File
    FileSelected --> Validating: Validate
    Validating --> ValidationError: Invalid
    Validating --> Ready: Valid
    ValidationError --> FileSelected: Retry
    Ready --> Processing: Submit
    Processing --> Complete: Success
    Processing --> Error: Fail
    Error --> Ready: Retry
    Complete --> [*]
```

## Directory Structure

```mermaid
graph TD
    A[Root] --> B[app]
    A --> C[docs]
    A --> D[lib]
    A --> E[public]

    B --> F[components]
    B --> G[api]
    B --> H[styles]

    F --> I[FileUpload.tsx]
    F --> J[FileDataTable.tsx]
    F --> K[ValidationDisplay.tsx]

    D --> L[services]
    D --> M[utils]

    L --> N[informatica.ts]
    L --> O[validation.ts]

    M --> P[file-processing.ts]
    M --> Q[data-validation.ts]
```

## Security Architecture

```mermaid
flowchart TB
    subgraph "Security Layers"
        A[Authentication] --> B[Authorization]
        B --> C[Data Validation]
        C --> D[API Security]
        D --> E[External Service Security]
    end

    subgraph "Security Features"
        F[JWT Tokens]
        G[Role-Based Access]
        H[Input Sanitization]
        I[API Rate Limiting]
        J[Secure Credentials]
    end

    A --- F
    B --- G
    C --- H
    D --- I
    E --- J
```

## Error Handling Flow

```mermaid
flowchart LR
    A[Error Occurs] --> B{Error Type}
    B -->|Validation| C[Display in UI]
    B -->|Processing| D[Retry Option]
    B -->|Network| E[Auto-Retry]
    B -->|System| F[Admin Alert]

    C --> G[User Action]
    D --> G
    E --> G
    F --> G

    G --> H[Resolution]
```

## Deployment Architecture

```mermaid
flowchart TB
    subgraph "Development"
        A[Local Dev]
        B[Testing]
        C[Staging]
    end

    subgraph "Production"
        D[Load Balancer]
        E[App Servers]
        F[API Servers]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
```

## Performance Monitoring

```mermaid
graph LR
    A[Metrics Collection] --> B[Performance Analysis]
    B --> C[Alerting]
    C --> D[Auto-Scaling]
    D --> E[Resource Optimization]
    E --> A
```

## Integration Points

The application integrates with several external systems and services:

1. **Informatica Cloud API**
   - Authentication
   - Data Catalog operations
   - Job monitoring

2. **File Processing**
   - Excel file parsing
   - CSV processing
   - Data validation

3. **User Management**
   - Authentication
   - Authorization
   - Session management

## Performance Considerations

- File size limits: 10MB
- Batch processing: 100 rows recommended
- API rate limiting: 100 requests per minute
- Auto-retry logic for failed operations
- Caching for frequently accessed data

## Security Measures

1. **Authentication**
   - JWT-based authentication
   - Session management
   - Secure credential storage

2. **Authorization**
   - Role-based access control
   - Feature-based permissions
   - API endpoint protection

3. **Data Security**
   - Input validation
   - Data sanitization
   - Secure transmission

## Monitoring and Logging

The application implements comprehensive monitoring and logging:

1. **Application Metrics**
   - Request/response times
   - Error rates
   - Processing success rates

2. **System Metrics**
   - CPU usage
   - Memory utilization
   - Network performance

3. **Business Metrics**
   - File processing volumes
   - Success/failure rates
   - User activity

## Scaling Strategy

The application is designed to scale horizontally:

1. **Application Layer**
   - Multiple app instances
   - Load balancing
   - Session management

2. **Processing Layer**
   - Batch processing
   - Queue management
   - Resource allocation

3. **Storage Layer**
   - Distributed caching
   - File storage optimization
   - Database scaling
