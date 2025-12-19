// ***********************************************************
// Cypress E2E Support File
//
// This file is processed and loaded automatically before test files.
// Use this file to configure global behavior for Cypress tests.
// ***********************************************************

// Import custom commands
import "./commands";

// Disable uncaught exception handling for React errors
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Useful for handling React errors that don't affect test validity
  if (err.message.includes("React")) {
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
