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

    // Retry policy: 1 retry in CI, 0 locally
    retries: {
      runMode: 1,
      openMode: 0,
    },

    // Screenshots and videos
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    video: !!process.env.CI, // Record in CI, skip locally for speed
    screenshotOnRunFailure: true,

    // Environment variables
    env: {
      testUserEmail: process.env.E2E_ADMIN_EMAIL || "admin@steelapp.test",
      testUserPassword: process.env.E2E_ADMIN_PASSWORD || "Test@12345",
      salesUserEmail: process.env.E2E_SALES_EMAIL || "sales@steelapp.test",
      salesUserPassword: process.env.E2E_SALES_PASSWORD || "Test@12345",
      readonlyUserEmail: process.env.E2E_READONLY_EMAIL || "readonly@steelapp.test",
      readonlyUserPassword: process.env.E2E_READONLY_PASSWORD || "Test@12345",
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
});
