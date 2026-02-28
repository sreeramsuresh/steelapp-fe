/**
 * Supplier Bills E2E Tests
 *
 * Tests the payables page where supplier bills are managed.
 */

describe("Supplier Bills", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/payables");
  });

  it("should load the payables page with heading", () => {
    cy.contains(/payable|bill/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render content on the payables page", () => {
    cy.get("table", { timeout: 15000 }).should("exist");
  });

  it("should display data rows in the table", () => {
    cy.get("table tbody tr", { timeout: 15000 }).should(
      "have.length.greaterThan",
      0,
    );
  });
});
