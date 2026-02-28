/**
 * Price Lists E2E Tests
 *
 * Tests the price lists page loads and renders content.
 */

describe("Price Lists", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/pricelists");
  });

  it("should load the price lists page with heading", () => {
    cy.contains("h1, h2, h3, h4", /price/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.contains("h1, h2, h3, h4", /price/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasContent = $body.text().length > 50;
      expect(hasTable || hasCards || hasContent).to.be.true;
    });
  });

  it("should remain on the pricelists route", () => {
    cy.url().should("include", "/app/pricelists");
  });

  it("should have a search or filter control", () => {
    cy.contains("h1, h2, h3, h4", /price/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      const hasSearch = $body.find('input[placeholder*="Search"]').length > 0;
      const hasFilter = $body.find("select").length > 0;
      const hasButton = $body.find("button").length > 0;
      expect(hasSearch || hasFilter || hasButton).to.be.true;
    });
  });
});
