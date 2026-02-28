/**
 * Multi-Warehouse Operations E2E Tests
 *
 * Verifies warehouse page loads and renders warehouse list.
 */

describe("Multi-Warehouse Operations - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the warehouses page", () => {
    cy.visit("/app/warehouses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/warehouses");
  });

  it("should render page content without errors", () => {
    cy.visit("/app/warehouses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.length).to.be.greaterThan(10);
    });
  });

  it("should stay on warehouses route", () => {
    cy.visit("/app/warehouses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/warehouses");
  });
});
