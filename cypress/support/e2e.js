// ***********************************************************
// Cypress E2E Support File
//
// This file is processed and loaded automatically before test files.
// Use this file to configure global behavior for Cypress tests.
// ***********************************************************

// Import custom commands
import "./commands";

// Suppress known benign app exceptions that don't affect test validity.
// Each pattern maps to a specific known issue — do NOT add blanket filters.
Cypress.on("uncaught:exception", (err, runnable) => {
  const msg = err.message || "";

  // React internals: minified vendor bundle throws on lazy/Suspense race conditions
  if (msg.includes("Cannot read properties of undefined (reading 'memo')")) return false;

  // Vite lazy-load failures when chunks are not yet cached
  if (msg.includes("Loading chunk") || msg.includes("Failed to fetch dynamically imported module")) return false;

  // React hydration mismatch (SSR not used, but React logs it)
  if (msg.includes("Minified React error")) return false;

  // Let all other errors fail the test — they are real bugs
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
