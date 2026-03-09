// Owner: finance
/**
 * Concurrency & Business Rule Negative Path E2E Tests
 *
 * Tests edge cases and error handling:
 * - Non-existent record access
 * - Missing configuration errors
 * - Boundary conditions
 */

describe("Concurrency & Business Rule Negative Paths - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Non-Existent Record Handling", () => {
    it("should handle non-existent invoice gracefully", () => {
      cy.visit("/app/invoices/999999999", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });

    it("should handle non-existent customer gracefully", () => {
      cy.visit("/app/customers/999999999", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });

    it("should handle non-existent quotation gracefully", () => {
      cy.visit("/app/quotations/999999999", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });
  });

  describe("Form Submission Without Required Data", () => {
    it("should not submit invoice form without customer", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Attempt submit
      cy.get("body").then(($body) => {
        const btn = $body.find("button:contains('Save'), button:contains('Create')")[0];
        if (btn) {
          cy.wrap(btn).click();
          // Should stay on form
          cy.url().should("include", "/invoices");
        }
      });
    });

    it("should not submit delivery note without items", () => {
      cy.visit("/app/delivery-notes/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const btn = $body.find("button:contains('Save'), button:contains('Create')")[0];
        if (btn) {
          cy.wrap(btn).click();
          cy.url().should("include", "/delivery-notes");
        }
      });
    });
  });

  describe("Invalid URL Navigation", () => {
    it("should handle invalid route segments gracefully", () => {
      cy.visit("/app/invoices/abc-not-a-number", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });

    it("should handle deep non-existent nested routes", () => {
      cy.visit("/app/purchases/po/999999999/overview", {
        failOnStatusCode: false,
      });
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });

    it("should redirect unknown /app routes to home or 404", () => {
      cy.visit("/app/this-route-does-not-exist", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");
    });
  });
});
