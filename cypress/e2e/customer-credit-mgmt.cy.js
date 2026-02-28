/**
 * Customer Credit Management E2E Tests
 *
 * Tests customer page with focus on credit-related columns:
 * - Page load and heading
 * - Table with credit limit and credit used columns
 * - Customer table rendering
 *
 */

describe("Customer Credit Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Page Load", () => {
    it("should load customer management page", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 }).should(
        "be.visible",
      );
    });

    it("should display customer table with credit columns", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
      cy.contains("Credit Limit").should("be.visible");
      cy.contains("Credit Used").should("be.visible");
    });

    it("should display customer names in the table", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
      cy.contains("Customer Name").should("be.visible");
    });
  });
});
