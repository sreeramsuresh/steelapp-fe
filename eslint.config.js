import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

// Safe extraction of TypeScript ESLint recommended rules
const tsRecommendedRules = Object.assign(
  {},
  ...tseslint.configs.recommended.map((c) => c.rules ?? {}),
);

// Safe extraction of React configs with fallbacks for different versions
const reactRecommendedRules =
  react.configs?.flat?.recommended?.rules ??
  react.configs?.recommended?.rules ??
  {};

const reactJsxRuntimeRules =
  react.configs?.flat?.['jsx-runtime']?.rules ??
  react.configs?.['jsx-runtime']?.rules ??
  {};

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.min.js',
      '*.backup.*',
      'cypress/',
      'steelapp/',
      'chromium/',
      'check-constraint.js',
      'get-constraint-def.js',
      'inspect-schema.js',
      'find-status.js',
      'scripts/show-backup-status.js',
      'cypress.config.js',
      'tailwind.config.js',
      'vite.config.js',
      'vitest.config.js',
    ],
  },

  // Base configuration for JS/JSX files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
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
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactRecommendedRules,
      ...reactJsxRuntimeRules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // ============================================
      // NAMING CONVENTIONS - camelCase ENFORCED
      // ============================================
      camelcase: [
        'warn',
        {
          properties: 'never',
          ignoreDestructuring: true,
          ignoreImports: true,
          allow: ['^UPPER_SNAKE_CASE$', '^_.*', '^.*_.*'],
        },
      ],

      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Variable rules
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
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
      quotes: [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      semi: ['error', 'always'],
      indent: 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],

      // JSX Accessibility
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'local-rules/no-dead-button': 'off',
    },
  },

  // TypeScript configuration (without type checking for speed)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parser: tseslint.parser,
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
    plugins: {
      react,
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsRecommendedRules,
      ...reactRecommendedRules,
      ...reactJsxRuntimeRules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],

      // Include JS rules for TS files
      camelcase: [
        'warn',
        {
          properties: 'never',
          ignoreDestructuring: true,
          ignoreImports: true,
          allow: ['^UPPER_SNAKE_CASE$', '^_.*', '^.*_.*'],
        },
      ],
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'object-shorthand': ['warn', 'always'],
      quotes: [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      semi: ['error', 'always'],
      indent: 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'local-rules/no-dead-button': 'off',
    },
  },

  // Test files - more lenient
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
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
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  // Config files
  {
    files: [
      '*.config.{js,ts}',
      'vite.config.*',
      'vitest.config.*',
    ],
    rules: {
      'no-undef': 'off',
    },
  },
];
