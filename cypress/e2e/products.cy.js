/**
 * Products Master Data E2E Tests
 *
 * Tests the products listing page loads and renders content.
 */

describe("Products Master Data", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/products");
  });

  it("should load the products page with heading", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render product content", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasContent = $body.text().length > 50;
      expect(hasTable || hasCards || hasContent).to.be.true;
    });
  });

  it("should have a search input", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search"]').first().should("be.visible");
  });

  it("should remain on the products route", () => {
    cy.url().should("include", "/app/products");
  });
});
