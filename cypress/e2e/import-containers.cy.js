/**
 * Import Containers E2E Tests
 *
 * Verifies the containers page loads and displays container data.
 */

describe("Import Containers - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the containers page", () => {
    cy.visit("/app/containers");
    cy.contains("h1, h2, h3, h4", /container/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display container content or empty state", () => {
    cy.visit("/app/containers");
    cy.contains("h1, h2, h3, h4", /container/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasCards || hasContent).to.be.true;
    });
  });

  it("should remain on the containers route", () => {
    cy.visit("/app/containers");
    cy.contains("h1, h2, h3, h4", /container/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/containers");
  });
});
