/**
 * Concurrent User Workflows E2E Tests
 *
 * Verifies navigation across multiple modules loads correctly.
 */

describe("Concurrent User Workflows", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the invoices page", () => {
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load the customers page", () => {
    cy.visit("/app/customers", { timeout: 15000 });
    cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load the products page", () => {
    cy.visit("/app/products", { timeout: 15000 });
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
  });

  it("should navigate between all three modules without errors", () => {
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");

    cy.visit("/app/customers", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");

    cy.visit("/app/products", { timeout: 15000 });
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
  });
});
