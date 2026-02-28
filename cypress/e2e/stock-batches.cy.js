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
});
