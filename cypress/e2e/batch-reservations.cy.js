/**
 * Batch Reservations E2E Tests
 *
 * Verifies the inventory page loads for batch reservation workflows.
 */

describe("Batch Reservations - E2E Tests", () => {
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
    cy.get("h1, h2, h3", { timeout: 15000 })
      .should("exist")
      .and("be.visible");
  });

  it("should not show error state", () => {
    cy.visit("/app/inventory");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
