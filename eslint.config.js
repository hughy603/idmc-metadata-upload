// @ts-check

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const next = require('@next/eslint-plugin-next');
const prettier = require('eslint-config-prettier');

// Create TypeScript parser with project settings
const typescriptParser = tseslint.parser;

// Define globals for all environments
/** @type {Record<string, 'readonly' | 'writable' | 'off'>} */
const globals = {
  // React
  React: 'readonly',
  // Browser globals
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  // Node.js globals
  process: 'readonly',
  __dirname: 'readonly',
  require: 'readonly',
  module: 'readonly',
  exports: 'readonly',
  global: 'readonly',
  // Jest globals
  jest: 'readonly',
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  // TypeScript globals
  NodeJS: 'readonly',
  // Test-specific globals
  _name: 'readonly',
  _isExcel: 'readonly',
  _true: 'readonly',
  _false: 'readonly',
  _isCsv: 'readonly',
  _fileSizeKB: 'readonly',
  _file: 'readonly',
  _objectUrl: 'readonly',
  _isValidExcel: 'readonly',
  _isValidText: 'readonly',
  _mockValidJson: 'readonly',
  _result: 'readonly',
  _mockInvalidJson: 'readonly',
  validateMappingFile: 'readonly',
  _Uint8Array: 'readonly',
  _mockWorkbook: 'readonly',
  generateMappingTemplate: 'readonly',
  _undefined: 'readonly',
  _global: 'readonly',
  _formattedDate: 'readonly',
  _diffInSeconds: 'readonly',
  _data: 'readonly',
  _obj: 'readonly',
  _header: 'readonly',
  _jsonData: 'readonly',
  _outputPath: 'readonly',
  _children: 'readonly',
  RenderOptions: 'readonly',
  _ui: 'readonly',
  _scriptsDir: 'readonly',
  _line: 'readonly',
  _files: 'readonly',
  _fixed: 'readonly',
  _fixedFiles: 'readonly',
  _shouldFixCookies: 'readonly',
  _cookieFiles: 'readonly',
  _shouldFixUploadForm: 'readonly',
  _status: 'readonly',
  _statusText: 'readonly',
  _Number: 'readonly',
  importMappingDocumentation: 'readonly',
  uploadMappingFile: 'readonly',
  checkImportJobStatus: 'readonly',
  _changeFileButton: 'readonly',
  _authSubmitButton: 'readonly',
  _retryButton: 'readonly',
  onSubmit: 'readonly',
  onRowSubmit: 'readonly',
};

module.exports = tseslint.config(
  {
    // Ignore patterns (migrated from .eslintignore)
    ignores: [
      // Build outputs
      '.next/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',

      // Dependencies
      'node_modules/**',

      // Developer tools
      '.cursor/**',
      '.vscode/**',
      '.git/**',

      // Configuration files
      'eslint.config.js',
      '*rc.js',
      '*.d.ts',

      // Generated files
      'public/**',
      '*.min.js',

      // Example files (just warnings, but keep errors)
      'lib/examples/**',

      // Environment files
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',

      // Editor directories
      '.idea/**',

      // Cache files
      '.eslintcache',
      '.stylelintcache',
      '*.tsbuildinfo',

      // Misc
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.DS_Store',

      // Config files - prevent unnecessary linting
      'next.config.js',
      'jest.config.js',
      'babel.config.js',
      'postcss.config.js',
      'tailwind.config.js',

      // Public assets and generated files
      '**/generated/**/*',
      '*.bundle.js',
      '*.chunk.js',

      // Test fixtures
      '**/__fixtures__/**',
      '**/__mocks__/**',

      // Script files
      'scripts/**',
      'create-test-mapping.js',
      'create-test-mapping-csv.js',
    ],
  },

  // Basic JS config
  js.configs.recommended,

  // Global settings for all files
  {
    languageOptions: {
      globals,
    },
    rules: {
      // Relaxed rules for all files
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-undef': 'warn',
      'no-redeclare': 'warn',
    }
  },

  // Setup for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Use a simpler configuration that doesn't require type checking
    // to avoid performance issues while we transition to the new ESLint format
    rules: {
      // Base TypeScript rules without type checking
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_|^req$|^res$|^request$|^response$|^props$|error$|^ctx$|^context$',
        varsIgnorePattern: '^_|^React$',
        caughtErrorsIgnorePattern: '^_|^error$',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
      }],
      // Disable type-aware rules for now
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },

  // React-specific configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Next.js specific rules
  {
    files: ['app/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      next,
    },
  },

  // Test files - more relaxed rules
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*', 'jest.setup.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
    },
  },

  // Disable formatting rules (handled by Prettier)
  prettier,
);
