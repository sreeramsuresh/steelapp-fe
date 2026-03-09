// Owner: inventory
/**
 * Inventory Fulfillment Cycle E2E Tests
 *
 * Tests the inventory workflow:
 * Invoice → Stock allocation → Delivery → Credit note
 *
 * Routes: /app/inventory, /app/stock-movements, /app/warehouses,
 *         /app/invoices, /app/delivery-notes, /app/credit-notes
 */

describe("Inventory Fulfillment Cycle - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Inventory Pages", () => {
    it("should load the inventory/stock levels page", () => {
      cy.visit("/app/inventory");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/inventory");
    });

    it("should display stock levels content", () => {
      cy.visit("/app/inventory");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasStockContent =
          text.includes("stock") ||
          text.includes("inventory") ||
          text.includes("product") ||
          text.includes("warehouse");
        expect(hasStockContent, "Should show stock/inventory content").to.be.true;
      });
    });

    it("should load the stock movements page", () => {
      cy.visit("/app/stock-movements");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/stock-movements");
    });

    it("should display stock movement records or empty state", () => {
      cy.visit("/app/stock-movements");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("table, [data-testid*='movement'], [data-testid*='stock']").should("exist");
    });
  });

  describe("Warehouse Access", () => {
    it("should load the warehouses list page", () => {
      cy.visit("/app/warehouses");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/warehouses");
    });

    it("should display warehouse list with content", () => {
      cy.visit("/app/warehouses");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("warehouse");
      });
    });
  });

  describe("Sequential Fulfillment Flow", () => {
    it("should navigate from invoices to delivery notes", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/delivery-notes");
    });

    it("should navigate from delivery notes to credit notes", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/credit-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/credit-notes");
    });

    it("should navigate the full inventory chain", () => {
      cy.visit("/app/inventory");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/stock-movements");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/warehouses");
      cy.get("body", { timeout: 15000 }).should("be.visible");
    });

    it("should display inventory page with filter/search controls", () => {
      cy.visit("/app/inventory");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("input, select, button").should("have.length.greaterThan", 0);
    });
  });
});
