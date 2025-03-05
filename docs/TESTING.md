# Testing Documentation

This document outlines the testing approach for the Informatica Mapping Documentation Upload solution. Our testing strategy aims to achieve at least 80% code coverage, focusing on key functionalities and potential error scenarios.

## Table of Contents

1. [Testing Framework](#testing-framework)
2. [Test Coverage](#test-coverage)
3. [Testing Approach](#testing-approach)
4. [Running Tests](#running-tests)
5. [Mocking Strategy](#mocking-strategy)
6. [Continuous Integration](#continuous-integration)

## Testing Framework

We use the following tools for testing:

- **Jest**: Primary testing framework
- **Testing Library React**: For testing React components
- **Jest DOM**: For DOM-specific assertions
- **User Event**: For simulating user interactions
- **MSW (Mock Service Worker)**: For mocking API requests

## Test Coverage

Our test coverage target is 80% across the codebase. The coverage is measured for:

- **Lines**: Percentage of code lines executed during tests
- **Functions**: Percentage of functions called during tests
- **Branches**: Percentage of code branches (if/else, switch cases) covered
- **Statements**: Percentage of statements covered

### Key Areas Under Test

1. **API Services (`lib/services/`)**

   - Authentication with Informatica Cloud
   - Mapping documentation import
   - File upload
   - Job status monitoring

2. **Utilities (`lib/utils/`)**

   - File parsing (Excel/CSV)
   - Validation
   - Template generation

3. **UI Components (`app/components/`)**
   - Upload form
   - File data table
   - Error handling

## Testing Approach

### 1. Unit Tests

Unit tests focus on testing individual functions, methods, and components in isolation:

- **Services**: Testing API calls with mocked responses
- **Utils**: Testing utility functions with various inputs
- **Components**: Testing rendering and interactions in isolation

### 2. Integration Tests

Integration tests verify that different parts of the application work together correctly:

- Form submission flow
- File processing and validation flow
- Error handling across components

### 3. Snapshot Tests

Snapshot tests are used sparingly to capture and verify the structure of complex UI components.

## Running Tests

To run the tests, use the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

The coverage report is generated in the `coverage/` directory and can be viewed by opening `coverage/lcov-report/index.html` in a browser.

## Mocking Strategy

### API Mocks

API calls are mocked to avoid making actual network requests during tests:

```typescript
// Example of mocking an API call
jest.mock('@/lib/services/informatica-mapping-service', () => ({
  authenticateWithInformatica: jest.fn().mockResolvedValue({
    token: 'mock-token',
    baseUrl: 'https://mock-base-url.com',
    apiUrl: 'https://mock-api-url.com/api',
  }),
}))
```

### File Mocks

File handling operations are mocked to avoid actual file system interactions:

```typescript
// Example of mocking file operations
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}))
```

### Component Mocks

Child components are mocked when testing parent components to focus on the parent's behavior:

```typescript
// Example of mocking a child component
jest.mock('@/app/components/file-data-table', () => ({
  __esModule: true,
  default: ({ data }) => (
    <div data-testid="mock-data-table">
      Data table with {data.length} rows
    </div>
  )
}));
```

## Example Tests

### Testing Services

```typescript
describe('authenticateWithInformatica', () => {
  it('should authenticate successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'mock-token' }),
    })

    const result = await authenticateWithInformatica({
      username: 'testuser',
      password: 'testpass',
      baseUrl: 'https://test-url.com',
      apiUrl: 'https://test-api-url.com',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.token).toBe('mock-token')
  })
})
```

### Testing Components

```typescript
describe('UploadForm', () => {
  it('validates a file successfully', async () => {
    validateMappingFile.mockResolvedValue({
      isValid: true,
      mappingData: [/* mock data */]
    });

    render(<UploadForm />);

    const fileInput = screen.getByLabelText(/Choose a file/i);
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
      userEvent.upload(fileInput, file);
    });

    await waitFor(() => {
      expect(screen.getByText(/File validated successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Continuous Integration

Tests are automatically run in our CI pipeline on each pull request and push to the main branch. The pipeline ensures:

1. All tests pass
2. Code coverage meets the 80% threshold
3. No regressions are introduced

## Best Practices

1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **One assertion per test**: Each test should verify one specific behavior
3. **Use descriptive test names**: Test names should clearly describe what is being tested
4. **Arrange, Act, Assert**: Structure tests in three distinct phases
5. **Isolate tests**: Tests should not depend on each other
6. **Mock external dependencies**: External services and APIs should be mocked
7. **Test edge cases**: Include tests for error conditions and boundary cases
