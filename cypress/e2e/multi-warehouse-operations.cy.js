/**
 * Multi-Warehouse Operations E2E Tests
 *
 * Tests multi-warehouse scenarios:
 * - Inter-warehouse transfers
 * - Stock allocation across warehouses
 * - Warehouse consolidation
 * - Distributed order fulfillment
 *
 * Run: npm run test:e2e -- --spec '**/multi-warehouse-operations.cy.js'
 */

describe("Multi-Warehouse Operations - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Inter-Warehouse Transfers", () => {
    it("should create inter-warehouse transfer", () => {
      cy.visit("/warehouse-transfers");
      cy.get('button:contains("New Transfer")').click();

      cy.get('select[name="From Warehouse"]').select("Warehouse A");
      cy.get('select[name="To Warehouse"]').select("Warehouse B");

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("500");

      cy.get('button:contains("Create Transfer")').click();
      cy.contains("Transfer created").should("be.visible");
    });

    it("should track transfer status", () => {
      cy.visit("/warehouse-transfers");
      cy.get('[data-testid="transfer-row"]').first().click();

      cy.contains("Initiated").should("be.visible");
      cy.contains("In Transit").should("be.visible");
      cy.contains("Received").should("be.visible");
    });

    it("should receive transferred stock", () => {
      cy.visit("/warehouse-transfers");
      cy.get('[data-testid="transfer-row"][data-status="IN_TRANSIT"]')
        .first()
        .click();

      cy.get('button:contains("Receive")').click();

      cy.get('input[placeholder*="Received Qty"]').type("500");

      cy.get('button:contains("Complete Transfer")').click();
      cy.contains("Transfer completed").should("be.visible");
    });
  });

  describe("Stock Allocation Across Warehouses", () => {
    it("should allocate stock from nearest warehouse", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("1000");

      // Verify allocation across warehouses
      cy.contains("From Multiple Warehouses").should("be.visible");
    });

    it("should rebalance stock", () => {
      cy.visit("/warehouse-management");

      cy.get('button:contains("Rebalance Stock")').click();

      cy.get('select[name="Strategy"]').select("EQUAL_DISTRIBUTION");

      cy.get('button:contains("Start Rebalancing")').click();

      cy.contains("Rebalancing initiated").should("be.visible");
    });
  });

  describe("Distributed Fulfillment", () => {
    it("should split order across warehouses", () => {
      cy.visit("/orders");
      cy.get('[data-testid="order-row"]').first().click();

      cy.get('button:contains("Create Delivery")').click();

      // System suggests split shipment
      cy.contains("Ship from Multiple Warehouses").should("be.visible");

      cy.get('button:contains("Approve Split")').click();
      cy.contains("Shipment created").should("be.visible");
    });

    it("should consolidate orders for shipment", () => {
      cy.visit("/warehouse-management");

      cy.get('button:contains("Consolidation")').click();

      cy.get('select[name="Group By"]').select("Destination");

      cy.get('button:contains("Consolidate")').click();

      cy.contains("Consolidation complete").should("be.visible");
    });
  });

  describe("Warehouse Analytics", () => {
    it("should view warehouse utilization", () => {
      cy.visit("/analytics/warehouses");

      cy.get('[data-testid="warehouse-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="warehouse-row"]')
        .first()
        .within(() => {
          cy.contains("Utilization %").should("be.visible");
        });
    });

    it("should compare warehouse performance", () => {
      cy.visit("/analytics/warehouses");

      cy.get('button:contains("Compare")').click();

      cy.get('checkbox[name="warehouse"]').first().check();
      cy.get('checkbox[name="warehouse"]').eq(1).check();

      cy.get('button:contains("Compare")').click();
      cy.contains("Comparison").should("be.visible");
    });
  });
});
