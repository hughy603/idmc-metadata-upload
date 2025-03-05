# Testing Best Practices

This document outlines the testing strategy and best practices for the project.

## Testing Philosophy

- Tests should provide confidence in the correctness of the code
- Tests should act as documentation for how the code is intended to be used
- Tests should be maintainable and not brittle
- Tests should run quickly to provide fast feedback
- Tests should be deterministic and not flaky

## Testing Pyramid

We follow the testing pyramid approach:

1. **Unit Tests**: The foundation of our testing strategy. These tests are fast, focused, and test individual units of code in isolation.
2. **Integration Tests**: Test how different units work together.
3. **End-to-End Tests**: Test the application as a whole, simulating user interactions.

## Unit Testing Guidelines

### General Principles

- Test behavior, not implementation details
- Each test should have a single assertion or closely related assertions
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert (AAA) pattern
- Keep tests independent and isolated
- Mock external dependencies

### React Component Testing

We use React Testing Library for testing React components:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with the correct text', () => {
    // Arrange
    render(<Button>Click me</Button>);

    // Act & Assert
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('calls the onClick handler when clicked', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

For testing custom hooks, use `@testing-library/react-hooks`:

```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    // Arrange
    const { result } = renderHook(() => useCounter());

    // Act
    act(() => {
      result.current.increment();
    });

    // Assert
    expect(result.current.count).toBe(1);
  });
});
```

### Testing Utilities and Services

For utilities and services, use Jest:

```tsx
import { formatDate } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a date in the expected format', () => {
      // Arrange
      const date = new Date('2023-01-01');

      // Act
      const result = formatDate(date, 'MM/DD/YYYY');

      // Assert
      expect(result).toBe('01/01/2023');
    });
  });
});
```

## Integration Testing

Integration tests verify that different parts of the application work together correctly:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoList } from './TodoList';
import { TodoProvider } from '../context/TodoContext';

describe('TodoList Integration', () => {
  it('adds a new todo when the form is submitted', () => {
    // Arrange
    render(
      <TodoProvider>
        <TodoList />
      </TodoProvider>
    );

    // Act
    fireEvent.change(screen.getByLabelText(/add todo/i), {
      target: { value: 'Buy milk' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    // Assert
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });
});
```

## Mocking

### API Mocking

We use MSW (Mock Service Worker) for API mocking:

```tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/todos', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, text: 'Buy milk', completed: false },
        { id: 2, text: 'Write tests', completed: true },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Mocking

Mock child components when testing parent components:

```tsx
jest.mock('../components/TodoItem', () => ({
  TodoItem: ({ text }) => <div data-testid="mocked-todo-item">{text}</div>,
}));
```

## Test Coverage

We aim for at least 80% code coverage across the codebase:

- 100% coverage for critical business logic
- 80% coverage for UI components
- 90% coverage for utilities and services

Run coverage reports with:

```bash
npm run test:coverage
```

## Continuous Integration

All tests are run in the CI pipeline:

1. Unit tests run on every commit
2. Integration tests run on every PR
3. End-to-end tests run before deployment

## Best Practices

1. Write tests before fixing bugs to prevent regression
2. Keep test files close to the code they test
3. Use data-testid attributes sparingly, prefer accessible queries
4. Test edge cases and error scenarios
5. Avoid testing implementation details
6. Keep tests simple and readable
7. Use snapshots judiciously
8. Test accessibility concerns
