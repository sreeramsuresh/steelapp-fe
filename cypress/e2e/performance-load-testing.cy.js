/**
 * Performance Load Testing
 *
 * Verifies rapid navigation between pages loads without errors.
 */

describe("Performance Load Testing", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should navigate between multiple pages without errors", () => {
    const pages = [
      "/app/invoices",
      "/app/customers",
      "/app/products",
      "/app",
    ];

    pages.forEach((page) => {
      cy.visit(page, { timeout: 15000 });
      cy.get("body", { timeout: 15000 }).should("be.visible");
    });
  });

  it("should load invoices page after rapid navigation", () => {
    cy.visit("/app/customers", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");

    cy.visit("/app/products", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");

    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
  });

  it("should remain responsive after visiting analytics", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");

    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
  });
});
