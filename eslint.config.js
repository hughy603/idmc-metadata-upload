// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create compatibility layer between new flat config and old config format
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

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

export default [
  // Ignore patterns from .eslintignore
  {
    ignores: [
      // Build outputs
      '.next/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',

      // Dependencies
      'node_modules/**',

      // Configuration files
      '*.config.js',
      '*rc.js',
      '*.d.ts',
      'jest.setup.mjs',

      // Generated files
      'public/**',
      '*.min.js',

      // Example files
      'lib/examples/**',

      // Environment files
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',

      // Editor directories
      '.idea/**',
      '.vscode/**',
      '.cursor/**',

      // Cache files
      '.eslintcache',
      '.stylelintcache',
      '*.tsbuildinfo',

      // Script files
      'scripts/**',
      'create-test-mapping.js',
      'create-test-mapping-csv.js',

      // Test files
      '__tests__/utils/**',
      '__tests__/lib/**',

      // Misc
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.DS_Store',
    ],
  },

  // Use compatibility layer to load configs from existing .eslintrc.js
  ...compat.config({
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
      'plugin:jsx-a11y/recommended',
      'next/core-web-vitals',
      'prettier',
    ],
    plugins: ['sonarjs'],
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
      project: './tsconfig.json',
    },
    env: {
      browser: true,
      node: true,
      es6: true,
      jest: true,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {},
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // Medium strictness TypeScript rules
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern:
            '^_|^req$|^res$|^request$|^response$|^props$|^e$|error$|^ctx$|^context$',
          varsIgnorePattern: '^_|^React$',
          caughtErrorsIgnorePattern: '^_|^error$|^e$',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'warn',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'objectLiteralProperty',
          format: ['camelCase', 'snake_case', 'PascalCase', 'UPPER_CASE'],
          filter: {
            regex:
              '^(Content-Type|IDS-SESSION-ID|__esModule|SourceSystem|SourceTable|SourceColumn|TargetSystem|TargetTable|TargetColumn|TransformationLogic|BusinessTerm|Description)$',
            match: false,
          },
        },
      ],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'sonarjs/no-identical-functions': 'off',
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/default': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'off',

      // Medium strictness React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unknown-property': ['error', { ignore: ['css', 'tw'] }],
      'react/jsx-curly-brace-presence': [
        'warn',
        { props: 'never', children: 'never' },
      ],

      // Medium strictness import rules
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-named-as-default': 'warn',
      'import/no-named-as-default-member': 'warn',

      // Medium strictness general rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Usage of relative parent imports is not allowed. Use absolute imports instead.',
            },
          ],
        },
      ],
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: false, variables: false },
      ],

      // Additional medium strictness rules
      complexity: ['warn', 20],
      'max-depth': ['warn', 6],
      'max-nested-callbacks': ['warn', 5],
      'max-params': ['warn', 6],

      // SonarJS rules with medium strictness
      'sonarjs/cognitive-complexity': ['warn', 20],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-redundant-jump': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
    },
    overrides: [
      {
        // Disable unsafe any rules globally
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/no-unsafe-member-access': 'off',
          '@typescript-eslint/no-unsafe-call': 'off',
          '@typescript-eslint/no-unsafe-return': 'off',
          '@typescript-eslint/no-unsafe-argument': 'off',
        },
      },
      {
        files: [
          '**/__tests__/**/*',
          '**/*.test.*',
          '**/*.spec.*',
          'jest.setup.js',
        ],
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/no-non-null-assertion': 'off',
          'import/no-extraneous-dependencies': 'off',
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/no-unsafe-member-access': 'off',
          '@typescript-eslint/no-unsafe-call': 'off',
          'sonarjs/no-duplicate-string': 'off',
          'sonarjs/no-identical-functions': 'off',
        },
      },
      {
        files: [
          '**/examples/**/*.ts',
          '**/examples/**/*.tsx',
          '**/examples/**/*.js',
        ],
        rules: {
          'no-console': 'off',
          '@typescript-eslint/no-explicit-any': 'off',
        },
      },
      {
        files: ['app/api/**/*.ts', 'app/api/**/*.js'],
        rules: {
          '@typescript-eslint/explicit-module-boundary-types': 'off',
          'import/no-anonymous-default-export': 'off',
        },
      },
      {
        files: ['*.config.js', '*rc.js'],
        rules: {
          '@typescript-eslint/no-var-requires': 'off',
        },
      },
      {
        files: ['scripts/**/*.js'],
        rules: {
          '@typescript-eslint/no-var-requires': 'off',
          'no-console': 'off',
        },
      },
      {
        files: [
          '**/mapping-file-parser.ts',
          '**/file-parser.ts',
          '**/utils/excel/**/*.ts',
        ],
        rules: {
          '@typescript-eslint/no-unsafe-member-access': 'off',
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/no-unsafe-return': 'off',
          '@typescript-eslint/no-explicit-any': 'off',
        },
      },
    ],
  }),
];
