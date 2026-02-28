/**
 * Performance Smoke Tests
 *
 * Verifies key pages load within acceptable timeouts.
 */

describe("Performance Smoke Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the homepage", () => {
    cy.visit("/app", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should load the invoices page", () => {
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load the customers page", () => {
    cy.visit("/app/customers", { timeout: 15000 });
    cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 }).should("be.visible");
  });
});
