export default {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/src/services/__tests__/**/*.test.js",
  ],
  transform: {},
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
};
