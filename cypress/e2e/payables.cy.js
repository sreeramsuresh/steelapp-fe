/**
 * Payables Management E2E Tests
 *
 * Tests the accounts payable page loads and renders content.
 */

describe("Payables Management", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/payables");
  });

  it("should load the payables page with heading", () => {
    cy.contains(/payable/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.contains(/payable/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should stay on payables route", () => {
    cy.contains(/payable/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/payables");
  });
});
