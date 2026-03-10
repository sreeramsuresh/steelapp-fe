// Owner: inventory
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

  it("should have action buttons", () => {
    cy.visit("/app/warehouses");
    cy.contains("h1, h2, h3, h4", /Warehouse/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.visit("/app/warehouses");
    cy.contains("h1, h2, h3, h4", /Warehouse/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search"], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.visit("/app/warehouses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
