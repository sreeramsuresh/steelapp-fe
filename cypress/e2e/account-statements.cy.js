/**
 * Account Statements E2E Tests
 *
 * Tests receivables page which provides account statement context:
 * - Page load and heading
 * - Basic page rendering
 *
 */

describe("Account Statements - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Receivables Page Load", () => {
    it("should load the receivables page", () => {
      cy.visit("/app/receivables");
      cy.url().should("include", "/app/receivables");
      // Wait for the page to render with some content
      cy.get("body", { timeout: 15000 }).should("not.be.empty");
    });

    it("should display page content after loading", () => {
      cy.visit("/app/receivables");
      // The page should have some heading or content visible
      cy.get("h1, h2, h3, [role='heading']", { timeout: 15000 })
        .first()
        .should("be.visible");
    });
  });
});
