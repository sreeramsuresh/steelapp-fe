/**
 * Delivery Variance E2E Tests
 *
 * Tests delivery notes page load and table rendering.
 * Variance tracking is part of the delivery notes workflow.
 *
 */

describe("Delivery Variance - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Delivery Notes Page", () => {
    it("should load the delivery notes page", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 }).should("be.visible");
    });

    it("should render a table with delivery data", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
    });
  });
});
