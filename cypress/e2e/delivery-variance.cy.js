/**
 * Delivery Variance E2E Tests
 *
 * Tests delivery notes page load and table rendering.
 * Variance tracking is part of the delivery notes workflow.
 *
 */

describe("Delivery Variance - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Delivery Notes Page", () => {
    it("should load the delivery notes page", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 }).should("be.visible");
    });

    it("should render a table with delivery data", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
    });

    it("should have table with column headers", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 });
      cy.get("table thead th, table thead td", { timeout: 10000 }).should("have.length.greaterThan", 1);
    });

    it("should have action buttons", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 });
      cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
    });

    it("should have search or filter controls", () => {
      cy.visit("/app/delivery-notes");
      cy.contains(/Delivery/i, { timeout: 15000 });
      cy.get('input[placeholder*="Search" i], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
        .should("have.length.greaterThan", 0);
    });

    it("should not display an error state", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.contains("Something went wrong").should("not.exist");
    });
  });
});
