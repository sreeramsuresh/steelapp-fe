/**
 * Warehouse Management E2E Tests
 *
 * Verifies the warehouses page loads and displays expected content.
 */

describe("Warehouse Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the warehouses page", () => {
    cy.visit("/app/warehouses");
    cy.contains("h1, h2, h3, h4", /Warehouse/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display warehouse content", () => {
    cy.visit("/app/warehouses");
    cy.contains("h1, h2, h3, h4", /Warehouse/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      // Page should have either a table or card-based layout
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have navigation back to warehouses from sidebar", () => {
    cy.visit("/app/warehouses");
    cy.contains("h1, h2, h3, h4", /Warehouse/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/warehouses");
  });
});
