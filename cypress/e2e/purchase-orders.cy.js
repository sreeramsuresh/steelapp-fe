/**
 * Purchase Orders E2E Tests
 *
 * Tests the purchase orders page loads and renders content.
 */

describe("Purchase Orders", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/purchases");
  });

  it("should load the purchases page with heading", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should stay on purchases route", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/purchases");
  });
});
