// Jest config for React component testing
export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js', '**/test/**/*.test.js'],
  testTimeout: 30000,
  transform: {},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
