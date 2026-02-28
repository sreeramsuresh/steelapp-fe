/**
 * Quotations E2E Tests - Complete Workflow
 *
 * Tests quotations page:
 * - Page load and heading
 * - Table rendering
 * - Search and navigation
 *
 */

describe("Quotations - Complete E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Page Load", () => {
    it("should load the quotations page", () => {
      cy.visit("/app/quotations");
      cy.contains("h1, h2, h3, h4", /Quotation/i, { timeout: 15000 }).should("be.visible");
    });

    it("should display a table of quotations", () => {
      cy.visit("/app/quotations");
      cy.contains("h1, h2, h3, h4", /Quotation/i, { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
    });

    it("should display expected table columns", () => {
      cy.visit("/app/quotations");
      cy.contains("h1, h2, h3, h4", /Quotation/i, { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
      cy.get("table thead th").should("have.length.greaterThan", 3);
    });
  });

  describe("Navigation", () => {
    it("should have a way to create new quotations", () => {
      cy.visit("/app/quotations");
      cy.contains("h1, h2, h3, h4", /Quotation/i, { timeout: 15000 });
      // Look for a create/new quotation button or link
      cy.get("body").then(($body) => {
        const hasCreate =
          $body.text().includes("Create Quotation") ||
          $body.text().includes("New Quotation");
        expect(hasCreate).to.be.true;
      });
    });
  });
});
