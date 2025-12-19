import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,

    // Test isolation
    testIsolation: true,

    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false, // Disable video recording for faster tests
    screenshotOnRunFailure: true,

    // Environment variables
    env: {
      apiUrl: 'http://localhost:3000',
      testUserEmail: 'test@steelapp.com',
      testUserPassword: 'testpassword123',
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
});
