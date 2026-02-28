/**
 * Advance Payments E2E Tests
 *
 * Tests that the receivables page loads, where advance
 * payment functionality is accessible.
 */

describe("Advance Payments", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/receivables");
  });

  it("should load the receivables page with heading", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render a table on the receivables page", () => {
    cy.get("table", { timeout: 15000 }).should("exist");
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should display table column headers", () => {
    cy.get("table thead", { timeout: 15000 }).should("exist");
    cy.get("table thead th").should("have.length.greaterThan", 0);
  });
});
