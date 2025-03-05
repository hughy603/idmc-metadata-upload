# IDMC Metadata Upload

User Interface for validating & submitting data mapping documentation containing source to target lineage & business terms to Informatica Cloud's Data Catalog.

## Overview

The IDMC Metadata Upload tool is a web application that allows users to:

1. Upload Excel or CSV files containing data mapping documentation
2. Validate the uploaded files for correct format and content
3. Submit the validated mappings to Informatica Cloud's Data Catalog API
4. Track the status of submitted mapping information

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- File upload with validation
- Authentication with Informatica Cloud
- Region selection for different Informatica Cloud instances
- Real-time feedback during validation and upload processes
- Display of mapping documentation before submission
- Tracking of job status after submission

## Mapping File Format

The tool expects Excel (.xlsx) or CSV (.csv) files with the following columns:

### Required Columns:
- **SourceSystem**: The name of the source system
- **SourceTable**: The name of the source table/object
- **SourceColumn**: The name of the source column/field
- **TargetSystem**: The name of the target system
- **TargetTable**: The name of the target table/object
- **TargetColumn**: The name of the target column/field

### Optional Columns:
- **TransformationLogic**: The transformation logic applied to the source data
- **BusinessTerm**: Associated business term(s)
- **Description**: Additional description or notes

## Technology Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **API Integration**: Custom services for Informatica Cloud APIs
- **File Parsing**: xlsx library for Excel and CSV parsing
- **Testing**: Jest and React Testing Library

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Access to Informatica Cloud Data Catalog

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/idmc-metadata-upload.git
   cd idmc-metadata-upload
   ```

2. Install the dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Prepare your mapping documentation file with the required columns
2. Enter your Informatica Cloud credentials
3. Select your Informatica Cloud region
4. Upload your mapping file
5. Review the mapping information and ensure it is correct
6. Click "Upload to Informatica" to submit the data
7. The UI will display the job ID and status upon successful submission

## Authentication

The tool requires authentication with Informatica Cloud's REST API:

1. Username: Your Informatica Cloud username
2. Password: Your Informatica Cloud password
3. Region: Select the appropriate region for your Informatica Cloud instance

## API Integration

The application integrates with the following Informatica Cloud Data Catalog APIs:

- Authentication API for obtaining session tokens
- Import APIs for submitting mapping documentation
- Job monitoring APIs for tracking submission status

## Testing

The project uses Jest and React Testing Library for testing. Tests are organized to cover:

- API services for Informatica Cloud
- File parsing utilities
- UI components and interactions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

See [Testing Documentation](docs/TESTING.md) for more details on our testing approach.

## Project Structure

```
idmc-metadata-upload/
├── app/
│   ├── components/
│   │   ├── upload-form.tsx     # Main form component
│   │   ├── file-data-table.tsx # Table display component
│   │   └── header.tsx          # Header component
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── lib/
│   ├── services/
│   │   └── informatica-mapping-service.ts # API integration service
│   └── utils/
│       └── mapping-file-parser.ts         # File parsing utility
├── __tests__/                  # Test files
│   ├── app/
│   ├── lib/
│   └── mocks/
├── public/                     # Static assets
├── docs/                       # Documentation
├── jest.config.js              # Jest configuration
├── package.json                # Dependencies
└── README.md                   # Project documentation
```

## Development Guidelines

When contributing to this project, please follow these guidelines:

1. Follow consistent code style using TypeScript and React best practices
2. Write clean, maintainable, and tested code
3. Document new features and API changes
4. Use meaningful commit messages
5. Create pull requests with appropriate descriptions
6. Ensure tests pass and maintain code coverage above 80%

## Troubleshooting

Common issues and their solutions:

1. **Authentication failures**: Ensure your username and password are correct and that you have selected the right region.
2. **File parsing errors**: Verify your file has the required columns with the correct names.
3. **API errors**: Check the error messages returned from the Informatica Cloud API for specific details.

## License

This project is proprietary and confidential.

## Contact

For questions or support, please contact your organization's administrator.
