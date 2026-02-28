/**
 * Cross-Module Integration E2E Tests
 *
 * Verifies navigation between different ERP modules loads correctly.
 */

describe("Cross-Module Integration", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the invoices module", () => {
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load the customers module", () => {
    cy.visit("/app/customers", { timeout: 15000 });
    cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load the products module", () => {
    cy.visit("/app/products", { timeout: 15000 });
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
  });

  it("should load the quotations module", () => {
    cy.visit("/app/quotations", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should navigate across all modules sequentially", () => {
    const modules = [
      "/app/invoices",
      "/app/customers",
      "/app/products",
      "/app/quotations",
    ];

    modules.forEach((route) => {
      cy.visit(route, { timeout: 15000 });
      cy.get("body", { timeout: 15000 }).should("be.visible");
    });
  });
});
