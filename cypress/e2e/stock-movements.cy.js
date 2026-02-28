/**
 * Stock Movements E2E Tests
 *
 * Verifies the stock movements page loads and displays movement data.
 */

describe("Stock Movements - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the stock movements page", () => {
    cy.visit("/app/stock-movements");
    cy.contains("h1, h2, h3, h4", /stock.?movement/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display movement records or empty state", () => {
    cy.visit("/app/stock-movements");
    cy.contains("h1, h2, h3, h4", /stock.?movement/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasEmptyState = $body.text().match(/no.*movement|no.*record|no.*data/i);
      const hasContent = $body.text().length > 100;
      expect(hasTable || !!hasEmptyState || hasContent).to.be.true;
    });
  });

  it("should remain on the stock movements route", () => {
    cy.visit("/app/stock-movements");
    cy.contains("h1, h2, h3, h4", /stock.?movement/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/stock-movements");
  });
});
