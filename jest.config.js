export default {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
  ],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["@swc/jest", {
      jsc: {
        parser: {
          syntax: "ecmascript",
          jsx: true,
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          react: {
            runtime: "automatic",
          },
        },
      },
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(axios)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
  forceExit: true,
  maxWorkers: 1,
};
