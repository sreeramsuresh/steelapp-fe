/**
 * VAT Operations E2E Tests
 *
 * Verifies the finance page loads for VAT operations.
 */

describe("VAT Operations", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the finance page", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/finance");
  });

  it("should render finance page content", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.length).to.be.greaterThan(10);
    });
  });
});
