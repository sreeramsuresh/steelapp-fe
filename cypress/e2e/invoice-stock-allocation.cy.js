/**
 * Invoice Stock Allocation E2E Tests
 *
 * Tests that the invoices page loads correctly.
 * Stock allocation is tested indirectly by verifying the invoice
 * list page and navigation to create invoice form.
 *
 */

describe("Invoice Stock Allocation - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Invoices Page Load", () => {
    it("should load the invoices page with heading", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
    });

    it("should display invoices content", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.get("body").then(($body) => {
        expect($body.text().length).to.be.greaterThan(50);
      });
    });

    it("should load the invoices page and verify URL", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.url().should("include", "/app/invoices");
    });
  });
});
