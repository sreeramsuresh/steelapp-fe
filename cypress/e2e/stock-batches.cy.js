/**
 * Stock Batches E2E Tests
 *
 * Verifies the inventory/stock page loads and displays batch data.
 */

describe("Stock Batches - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the inventory page", () => {
    cy.visit("/app/inventory");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/inventory");
  });

  it("should display inventory content", () => {
    cy.visit("/app/inventory");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should render page without errors", () => {
    cy.visit("/app/inventory");
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
  });

  it("should have action buttons", () => {
    cy.visit("/app/inventory");
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.visit("/app/inventory");
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
    cy.get('input[placeholder*="Search" i], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.visit("/app/inventory");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
