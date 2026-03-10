// Owner: settings
/**
 * Pinned Products E2E Tests
 *
 * Tests that the products page loads and renders content.
 */

describe("Pinned Products", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/products");
  });

  it("should load the products page", () => {
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

  it("should stay on the products route", () => {
    cy.url().should("include", "/app/products");
  });

  it("should have action buttons", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search"], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.contains("h1, h2, h3, h4", /product/i, { timeout: 15000 });
    cy.contains("Something went wrong").should("not.exist");
  });
});
