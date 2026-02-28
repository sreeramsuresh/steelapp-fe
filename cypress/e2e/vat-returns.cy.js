/**
 * VAT Returns E2E Tests
 *
 * Verifies the finance page loads for VAT returns.
 */

describe("VAT Returns", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the finance page", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.contains("Finance", { timeout: 15000 }).should("be.visible");
  });

  it("should render finance page content", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body").should("not.be.empty");
    cy.url().should("include", "/app/finance");
  });
});
