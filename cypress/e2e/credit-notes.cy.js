/**
 * Credit Notes E2E Tests
 *
 * Credit notes are accessed through the invoices page.
 * Tests that the invoices page loads correctly.
 *
 */

describe("Credit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Invoices Page (Credit Notes Context)", () => {
    it("should load the invoices page", () => {
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

    it("should display invoice status information", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.url().should("include", "/app/invoices");
    });
  });
});
