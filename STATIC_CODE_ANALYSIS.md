# Static Code Analysis Configuration

This project uses a robust set of static code analysis tools to ensure code quality and consistency. The configuration has been optimized to follow industry best practices while preventing unnecessary noise from linting issues.

## Configuration Files

- `.eslintrc.js` - ESLint configuration for JavaScript/TypeScript linting
- `.prettierrc` - Prettier configuration for code formatting
- `.stylelintrc.json` - Stylelint configuration for CSS/SCSS linting
- `.pre-commit-config.yaml` - Pre-commit hooks configuration
- `.czrc` - Commitizen configuration for conventional commits
- `.typos.toml` - Typos spell checker configuration
- `.eslintignore` - Files to be ignored by ESLint
- `tsconfig.json` - TypeScript compiler configuration

## Linting Rules Customization

### ESLint Configuration

Our ESLint configuration extends several recommended configurations and adds custom rules:

- `eslint:recommended`
- `plugin:@typescript-eslint/recommended`
- `plugin:@typescript-eslint/recommended-requiring-type-checking`
- `plugin:react/recommended`
- `plugin:react-hooks/recommended`
- `plugin:import/errors`, `plugin:import/warnings`, `plugin:import/typescript`
- `plugin:jsx-a11y/recommended`
- `next/core-web-vitals`

Unnecessary TypeScript linting issues have been disabled to reduce noise:

- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-call`
- And others that are overly strict for practical development

### Prettier Configuration

Prettier is configured with:

- No semicolons
- Single quotes
- Tab width of 2 spaces
- ES5 trailing commas
- Print width of 80 characters
- Integration with Tailwind CSS

### Pre-commit Hooks

We use several pre-commit hooks to ensure code quality:

1. **Code Quality Checks**

   - ESLint (with --max-warnings=20 to allow for some warnings)
   - Prettier formatting
   - TypeScript type checking
   - Stylelint for CSS styles

2. **Security Checks**

   - Gitleaks for detecting secrets
   - npm audit for security vulnerabilities
   - Hadolint for Dockerfile linting

3. **Accessibility and Best Practices**

   - Accessibility testing with axe-core
   - Typos spell checking
   - Code duplication detection with jscpd

4. **Conventional Commits**
   - Commitizen for standardized commit messages

## Usage

### Regular Development

Linting and formatting are automatically applied when committing code thanks to pre-commit hooks.

### Manual Commands

- `npm run lint` - Run ESLint on the codebase
- `npm run lint:fix` - Fix ESLint issues automatically where possible
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if files are properly formatted
- `npm run typecheck` - Run TypeScript type checking
- `npm run axe-lint` - Run accessibility checks
- `npm run spell-check` - Run spell checking
- `npm run duplicate-check` - Check for code duplication

### Conventional Commits

For standardized commit messages, use:

```
npx cz
```

This will prompt you for commit information and format your commit message according to conventional commits standards.

## Customization

To modify the linting rules:

1. Edit `.eslintrc.js` to adjust JavaScript/TypeScript linting rules
2. Edit `.stylelintrc.json` to adjust CSS linting rules
3. Edit `.prettierrc` to adjust code formatting rules
4. Edit `.pre-commit-config.yaml` to adjust pre-commit hooks

## Performance Optimization

Several caching mechanisms are enabled to improve performance:

- `.eslintcache` - Caches ESLint results
- `.stylelintcache` - Caches Stylelint results
- `.prettiercache` - Caches Prettier results
- TypeScript incremental compilation
