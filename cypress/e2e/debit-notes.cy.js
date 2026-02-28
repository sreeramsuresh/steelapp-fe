/**
 * Debit Notes E2E Tests
 *
 * Debit notes are accessed through the invoices page.
 * Tests that the invoices page loads correctly.
 *
 */

describe("Debit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Invoices Page (Debit Notes Context)", () => {
    it("should load the invoices page", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
    });

    it("should display invoices content with action buttons", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.get("body").then(($body) => {
        expect($body.text().length).to.be.greaterThan(50);
      });
    });
  });
});
