// Owner: admin
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

  it("should display page content beyond heading", () => {
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should(($body) => {
      expect($body.text().length).to.be.greaterThan(100);
    });
  });

  it("should have action buttons after navigation", () => {
    cy.visit("/app/customers", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should render without errors after rapid navigation", () => {
    cy.visit("/app/products", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("[class*='error' i], [data-testid*='error']").should("have.length", 0);
  });
});
