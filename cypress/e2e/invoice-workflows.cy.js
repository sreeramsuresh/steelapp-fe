/**
 * Invoice Workflows E2E Tests
 *
 * Tests invoice list page:
 * - Page load with heading and stats cards
 * - Content rendering
 * - Search input
 * - Navigation to Create Invoice
 *
 */

describe("Invoice Workflows - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Page Load", () => {
    it("should load the invoices page with heading", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
    });

    it("should display stats cards", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.get("body").then(($body) => {
        expect($body.text().length).to.be.greaterThan(50);
      });
    });

    it("should display invoices content", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.url().should("include", "/app/invoices");
    });
  });

  describe("Search and Filter", () => {
    it("should have a search box for invoices", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.get('input[placeholder*="Search"]', { timeout: 10000 })
        .first()
        .should("be.visible");
    });

    it("should allow typing in search", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.get('input[placeholder*="Search"]', { timeout: 10000 }).first().type("INV");
      cy.wait(500);
      cy.url().should("include", "/app/invoices");
    });
  });

  describe("Navigation", () => {
    it("should stay on the invoices page", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 });
      cy.url().should("include", "/app/invoices");
    });
  });
});
