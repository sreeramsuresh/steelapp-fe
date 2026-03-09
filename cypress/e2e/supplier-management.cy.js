/**
 * Supplier Management E2E Tests
 *
 * Suppliers are managed from the customers page under the "Suppliers" tab.
 * Tests that the page loads and the Suppliers tab is accessible.
 */

describe("Supplier Management", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/customers");
  });

  it("should load the customer management page with heading", () => {
    cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display tabs including Suppliers", () => {
    cy.contains("Suppliers", { timeout: 15000 }).should("be.visible");
  });

  it("should switch to the Suppliers tab and show content", () => {
    cy.contains("Suppliers", { timeout: 15000 }).click();
    cy.wait(500);
    cy.get("table").should("exist");
  });

  it("should render supplier data in the table", () => {
    cy.contains("Suppliers", { timeout: 15000 }).click();
    cy.wait(500);
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should have search or filter input", () => {
    cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search" i], input[type="search"], [data-testid*="search"], select, [data-testid*="filter"]')
      .should("have.length.greaterThan", 0);
  });

  it("should render without errors", () => {
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("[class*='error' i], [data-testid*='error']").should("have.length", 0);
  });
});
