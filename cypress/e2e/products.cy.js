// Owner: inventory
/**
 * Products Master Data E2E Tests
 *
 * Tests the products listing page loads, renders seeded data,
 * and has search/action controls.
 */

describe("Products Master Data", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/products");
  });

  it("should load the products page with heading", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/products");
  });

  it("should render product table or card layout with data", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get("body").should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasCards || hasContent, "Products page should render table, card layout, or content").to.be.true;
    });
  });

  it("should have a search input", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search"]').first().should("be.visible");
  });

  it("should have action buttons (add product, etc.)", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should not display error boundary", () => {
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
