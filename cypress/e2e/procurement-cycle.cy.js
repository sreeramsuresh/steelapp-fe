/**
 * Procurement Cycle E2E Tests
 *
 * Tests that the procurement/purchases page loads and renders
 * the expected content for the procurement workflow.
 */

describe("Procurement Cycle", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the purchases page with heading", () => {
    cy.visit("/app/purchases");
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.visit("/app/purchases");
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should stay on purchases route", () => {
    cy.visit("/app/purchases");
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/purchases");
  });
});
