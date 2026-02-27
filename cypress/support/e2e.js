// ***********************************************************
// Cypress E2E Support File
//
// This file is processed and loaded automatically before test files.
// Use this file to configure global behavior for Cypress tests.
// ***********************************************************

// Import custom commands
import "./commands";

// Disable uncaught exception handling for React/framework errors
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false prevents Cypress from failing the test on app exceptions.
  // Common in SPAs where lazy-loaded chunks or React internals throw errors
  // that don't affect test validity (e.g. hydration, memo, lazy loading).
  if (
    err.message.includes("React") ||
    err.message.includes("memo") ||
    err.message.includes("chunk") ||
    err.message.includes("Loading chunk") ||
    err.message.includes("dynamically imported module")
  ) {
    return false;
  }
  return true;
});

// Global before hook
before(() => {
  cy.log("Starting E2E test suite");
});

// Global after hook
after(() => {
  cy.log("E2E test suite complete");
});
