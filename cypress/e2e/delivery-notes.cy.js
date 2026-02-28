/**
 * Delivery Notes E2E Tests
 *
 * Tests delivery notes page:
 * - Page load and heading
 * - Content rendering
 * - Basic navigation
 *
 */

describe("Delivery Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Page Load", () => {
    it("should load the delivery notes page", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("contain.text", "Deliver");
    });

    it("should display page content", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("contain.text", "Deliver");
      cy.get("body").then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().length > 100;
        expect(hasTable || hasContent).to.be.true;
      });
    });

    it("should stay on delivery notes route", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("contain.text", "Deliver");
      cy.url().should("include", "/app/delivery-notes");
    });
  });
});
