// Setup environment variables for tests
process.env.VITE_API_BASE_URL = '/api';
process.env.VITE_DISABLE_CONTRACT_VALIDATION = 'true';
process.env.VITE_REFRESH_ENDPOINT = '/auth/refresh-token';

// Add testing-library matchers
import '@testing-library/jest-dom';

// Suppress console errors during tests if needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
