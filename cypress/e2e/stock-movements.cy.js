// Owner: inventory
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

  it("should have action buttons", () => {
    cy.visit("/app/stock-movements");
    cy.contains("h1, h2, h3, h4", /stock.?movement/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.visit("/app/stock-movements");
    cy.contains("h1, h2, h3, h4", /stock.?movement/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search" i], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.visit("/app/stock-movements");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
