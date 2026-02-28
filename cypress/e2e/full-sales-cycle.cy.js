/**
 * Full Sales Cycle E2E Tests
 *
 * Tests multi-page navigation across the sales workflow:
 * - Quotations page loads
 * - Invoices page loads
 * - Delivery notes page loads
 *
 */

describe("Full Sales Cycle - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Sales Module Navigation", () => {
    it("should load the quotations page", () => {
      cy.visit("/app/quotations");
      cy.contains(/Quotation/i, { timeout: 15000 }).should("be.visible");
    });

    it("should load the invoices page", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
    });

    it("should load the delivery notes page", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 }).should("be.visible");
    });

    it("should navigate across sales pages sequentially", () => {
      cy.visit("/app/quotations");
      cy.contains(/Quotation/i, { timeout: 15000 }).should("be.visible");

      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");

      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 }).should("be.visible");
    });
  });
});
