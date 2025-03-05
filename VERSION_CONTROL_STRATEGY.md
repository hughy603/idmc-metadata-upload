# Version Control Strategy

This document outlines the version control workflow, branching strategy, and commit message standards for the project.

## Branching Strategy

We use a modified version of the Git Flow branching model:

### Main Branches

- `main`: The production-ready code. All releases are deployed from this branch.
- `develop`: The integration branch for features in development.

### Supporting Branches

- `feature/*`: Used for developing new features (branched from `develop`).
- `bugfix/*`: Used for fixing bugs (branched from `develop`).
- `hotfix/*`: Used for critical fixes in production (branched from `main`).
- `release/*`: Used for preparing releases (branched from `develop`).

## Branch Naming Convention

Branches should be named according to the following convention:

- `feature/ISSUE_ID-short-description`
- `bugfix/ISSUE_ID-short-description`
- `hotfix/ISSUE_ID-short-description`
- `release/vX.Y.Z`

Example: `feature/42-add-metadata-validation`

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for structured commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process, tools, or dependencies
- `ci`: Changes to CI configuration files and scripts

### Scope

The scope is optional and refers to the section of the codebase affected (e.g., component, service, module).

### Examples

```
feat(upload): add drag-and-drop file upload
fix(validation): resolve issue with date format validation
docs(readme): update installation instructions
```

## Pull Request Process

1. Create a branch from `develop` (or `main` for hotfixes).
2. Implement your changes with appropriate tests.
3. Ensure all tests pass and the code meets quality standards.
4. Open a Pull Request against the original branch.
5. Request a review from at least one team member.
6. Address any feedback or requests for changes.
7. Once approved, the PR will be merged by a maintainer.

## Release Process

1. Create a `release/vX.Y.Z` branch from `develop`.
2. Update version numbers and prepare release notes.
3. Fix any last-minute issues or bugs in the release branch.
4. Create a PR from the release branch to `main`.
5. After approval, merge the PR into `main`.
6. Tag the merge commit in `main` with the version number.
7. Merge the release branch back into `develop`.

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X): Incompatible API changes
- **MINOR** version (Y): Backwards-compatible functionality
- **PATCH** version (Z): Backwards-compatible bug fixes

## Automated Tools

We use several automated tools to maintain code quality:

- **Commitizen**: For standardized commit messages
- **Husky**: For Git hooks that run checks before commits/pushes
- **GitHub Actions**: For CI/CD workflows
- **ESLint/Prettier**: For code quality and style

## Best Practices

1. Keep commits small and focused on a single task.
2. Write meaningful commit messages that clearly describe changes.
3. Pull the latest changes from the parent branch before creating a PR.
4. Always create a new branch for new features or bug fixes.
5. Delete branches after they've been merged.
6. Keep the `main` branch always deployable.
7. Ensure all tests pass before submitting a PR.
8. Document significant changes in the PR description.
