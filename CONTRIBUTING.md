# Contributing Guide

Thank you for your interest in contributing to the IDMC Metadata Upload project! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We expect all contributors to adhere to professional standards of communication and collaboration.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies with `npm install`
4. Create a new branch for your changes
5. Make your changes
6. Run tests to ensure your changes don't break anything
7. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

Refer to the [Project Structure Documentation](docs/PROJECT_STRUCTURE.md) for a comprehensive overview of the project's architecture and components.

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Define proper interfaces and types for all data structures
- Use descriptive types rather than `any`
- Provide return types for functions

### React Components

- Use functional components with hooks
- Follow the React component naming convention (PascalCase)
- Keep components small and focused on a single responsibility
- Use proper JSDoc comments for components and props

### Styling

- Use Tailwind CSS for styling
- Follow the design system and use consistent spacing and colors
- Use semantic HTML elements

### File Structure

- Place components in the appropriate directories based on their purpose
- Use kebab-case for file names
- Group related files together

## Git Workflow

1. Create a branch for your feature or bugfix
2. Make commits with clear and descriptive messages
3. Push your changes to your fork
4. Create a pull request

### Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. Each commit message should have the following structure:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process or tooling changes

Example:

```
feat(upload): add batch processing support

- Add UI for selecting multiple rows
- Implement batch upload functionality
- Add progress tracking for batch operations
```

## Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting a pull request
- Maintain or improve test coverage

## Documentation

- Document all public APIs and components
- Update documentation when making changes
- Include JSDoc comments for functions and components

## Code Review Process

1. All pull requests require at least one review
2. Reviewers will check for:
   - Code quality and adherence to coding standards
   - Test coverage
   - Documentation
   - Performance considerations
3. Address all review comments before your PR can be merged

## Release Process

1. We use semantic versioning for releases
2. Release notes will be generated from commit messages
3. Releases are tagged in Git and published to npm

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.

Thank you for your contributions!
