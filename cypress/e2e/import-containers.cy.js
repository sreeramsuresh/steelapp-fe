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

  it("should have action buttons", () => {
    cy.visit("/app/containers");
    cy.contains("h1, h2, h3, h4", /container/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.visit("/app/containers");
    cy.contains("h1, h2, h3, h4", /container/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search" i], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.visit("/app/containers");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
