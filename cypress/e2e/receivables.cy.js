/**
 * Receivables Management E2E Tests
 *
 * Tests the accounts receivable page loads and renders content.
 */

describe("Receivables Management", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/receivables");
  });

  it("should load the receivables page with heading", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should stay on receivables route", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/receivables");
  });
});
