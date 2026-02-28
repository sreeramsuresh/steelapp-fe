import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,

    // Test isolation
    testIsolation: true,

    // Screenshots and videos
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    video: !!process.env.CI, // Record in CI, skip locally for speed
    screenshotOnRunFailure: true,

    // Environment variables
    env: {
      testUserEmail: process.env.E2E_ADMIN_EMAIL || "admin@steelapp.test",
      testUserPassword: process.env.E2E_ADMIN_PASSWORD || "Test@12345",
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
});
