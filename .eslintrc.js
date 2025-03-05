module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'next/core-web-vitals',
    'prettier',
  ],
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
    // TypeScript specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment': [
      'warn',
      {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
      },
    ],

    // React specific rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import rules
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
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/no-duplicates': 'error',

    // General rules
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'warn',
    'no-alert': 'warn',
  },
  overrides: [
    // Specific relaxed rules for test files
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
    // More relaxed rules for Next.js API routes 
    {
      files: ['app/api/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'import/no-anonymous-default-export': 'off',
      },
    },
  ],
  ignorePatterns: [
    '.next/',
    'node_modules/',
    'coverage/',
    '.cursor/',
    'next.config.js',
    'jest.config.js',
    'babel.config.js',
    'postcss.config.js',
    'tailwind.config.js'
  ],
} 