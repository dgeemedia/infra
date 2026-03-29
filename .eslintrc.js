/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    /* ── TypeScript ─────────────────────────────────── */
    '@typescript-eslint/no-unused-vars':        ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any':       'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises':  'error',
    '@typescript-eslint/no-misused-promises':   'error',
    '@typescript-eslint/await-thenable':        'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    /* ── Imports ────────────────────────────────────── */
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
        'object',
        'type',
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates':       'error',
    'import/no-unused-modules':   'warn',
    'import/no-cycle':            'error',

    /* ── General ────────────────────────────────────── */
    'no-console':     ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger':    'error',
    'prefer-const':   'error',
    'no-var':         'error',
    'eqeqeq':         ['error', 'always'],
    'no-throw-literal': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: { alwaysTryTypes: true },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    '*.js',        // ignore compiled output
    '!.eslintrc.js', // but keep this file linted
  ],
};
