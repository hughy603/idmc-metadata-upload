# Pre-commit Validations and Code Quality Tools

This project uses pre-commit hooks to maintain code quality and ensure that code meets our standards before being committed.

## Setup

The pre-commit hooks are automatically installed when you run `npm install` due to the `prepare` script in `package.json`. If you need to manually set up the hooks, run:

```bash
npm run prepare
```

## Code Quality Tools

### Pre-commit Hook

The pre-commit hook runs the following validations:

1. **Lint-staged**: Runs ESLint and Prettier on staged files
2. **TypeScript Type Checking**: Verifies all type definitions are correct
3. **Environment File Check**: Warns if you're trying to commit `.env` files that may contain secrets

### Commit Message Hook

The commit-msg hook enforces the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Valid types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Post-merge Hook

After merging changes, this hook checks if there were changes to the package dependencies and automatically runs `npm install` if needed.

## Available NPM Scripts

- `npm run lint`: Runs ESLint on all files
- `npm run lint:fix`: Runs ESLint with auto-fix on all files
- `npm run format`: Formats all files using Prettier
- `npm run format:check`: Checks if files are properly formatted
- `npm run typecheck`: Runs TypeScript's type checker

## Tools Used

- **ESLint**: JavaScript and TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks management
- **lint-staged**: Run linters on staged files
- **jest**: Testing framework
- **pre-commit**: Additional pre-commit validation

## VS Code Integration

We've included VS Code settings that automatically:

- Format code on save
- Fix ESLint issues on save
- Set the correct tab size and line endings
- Configure the TypeScript server

## Bypassing Hooks

In case of emergency, you can bypass the pre-commit hooks using the `--no-verify` flag:

```bash
git commit -m "commit message" --no-verify
```

**Note**: This should be used sparingly as it bypasses all validations.

## Troubleshooting

If you encounter issues with the pre-commit hooks:

1. Try running the individual scripts manually:

   ```bash
   npm run lint
   npm run format
   npm run typecheck
   ```

2. Check if husky is properly installed:

   ```bash
   ls -la .git/hooks
   ```

3. Reinstall husky if needed:
   ```bash
   npx husky install
   ```
