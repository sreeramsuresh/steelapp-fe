module.exports = {
  root: false,  // Inherit from monorepo root
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    '../.eslintrc.js',  // Inherit monorepo naming rules
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
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
  },
  plugins: [
    'react',
    'local-rules',
  ],
  rules: {
    // Enable our custom snake_case detection rule
    'local-rules/no-snakecase-props': 'error',
    
    // Standard React rules
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    // TODO: Add TypeScript support
    // Uncomment this override after installing TypeScript ESLint packages:
    // npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
    //
    // {
    //   files: ['*.ts', '*.tsx'],
    //   parser: '@typescript-eslint/parser',
    //   parserOptions: {
    //     ecmaVersion: 'latest',
    //     sourceType: 'module',
    //     ecmaFeatures: { jsx: true },
    //     project: './tsconfig.json',
    //   },
    //   extends: [
    //     '../.eslintrc.js',
    //     'eslint:recommended',
    //     'plugin:@typescript-eslint/recommended',
    //     'plugin:react/recommended',
    //     'plugin:react/jsx-runtime',
    //   ],
    //   plugins: ['react', '@typescript-eslint'],
    //   rules: {
    //     'react/prop-types': 'off',
    //     '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    //     '@typescript-eslint/no-explicit-any': 'warn',
    //   },
    // },
  ],
};
