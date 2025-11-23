/**
 * ESLint Configuration for Steel App Frontend (steelapp-fe)
 *
 * NAMING CONVENTION RULES:
 * ========================
 * FRONTEND: camelCase ONLY - snake_case DISALLOWED
 *
 * Applies to:
 *   - React components
 *   - Props
 *   - Hooks
 *   - State variables
 *   - UI logic
 *   - Any data model used inside React
 *
 * Architecture Flow:
 *   Frontend (camelCase) → API Gateway (converts) → Backend (snake_case) → DB (snake_case)
 *
 * The API Gateway automatically handles camelCase ↔ snake_case conversion,
 * so frontend code should NEVER use snake_case directly.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    // 'plugin:import/recommended', // Disabled - causing performance issues
    'plugin:jsx-a11y/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  plugins: [
    'react',
    'react-hooks',
    // 'import', // Disabled - causing performance issues
    'jsx-a11y',
  ],
  rules: {
    // ============================================
    // NAMING CONVENTIONS - camelCase ENFORCED
    // ============================================
    // Frontend MUST use camelCase only
    // API Gateway handles conversion to snake_case for backend
    'camelcase': ['error', {
      properties: 'never',
      ignoreDestructuring: false,
      ignoreImports: false,
      allow: ['^UPPER_SNAKE_CASE$', '^_.*'],
    }],

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import rules - Disabled due to performance issues
    // 'import/no-unresolved': 'off', // Vite handles this
    // 'import/order': ['error', {
    //   'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    //   'newlines-between': 'never',
    //   'alphabetize': { order: 'asc', caseInsensitive: true },
    // }],
    // 'import/no-duplicates': 'error',
    // 'import/newline-after-import': 'error',

    // Variable rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-shadow': 'error',

    // Code quality
    'no-empty': ['error', { allowEmptyCatch: false }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'warn',
    'object-shorthand': ['warn', 'always'],

    // Style rules
    'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'semi': ['error', 'always'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'comma-dangle': ['error', 'always-multiline'],
    'eol-last': ['error', 'always'],

    // JSX Accessibility
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
  },
  overrides: [
    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:jsx-a11y/recommended',
      ],
      plugins: ['react', '@typescript-eslint', 'react-hooks', 'import', 'jsx-a11y'],
      rules: {
        'react/prop-types': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        'no-unused-vars': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],
      },
    },
    // Test files - more lenient
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true,
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'off',
      },
    },
    // Config files
    {
      files: ['*.config.js', '*.config.ts', 'vite.config.*', 'vitest.config.*', '.eslintrc.*'],
      rules: {
        'import/no-default-export': 'off',
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'cypress/downloads/',
  ],
};
