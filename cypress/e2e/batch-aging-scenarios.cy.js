/**
 * Batch Aging Scenarios E2E Tests
 *
 * Tests advanced batch lifecycle and aging:
 * - Batch expiration dates and grace periods
 * - FIFO/LIFO allocation strategies
 * - Batch lifecycle state transitions
 * - Automatic archival and recall
 * - Quality and compliance scenarios
 *
 * Run: npm run test:e2e -- --spec "**/batch-aging-scenarios.cy.js"
 */

describe("Batch Aging Scenarios - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Batch Expiration Management", () => {
    it("should warn when batch nearing expiration", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').should("have.length.greaterThan", 0);

      // Check for expiration warning indicator
      cy.contains("Days to expiration").should("be.visible");
    });

    it("should prevent allocation of expired batches", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // System should not offer expired batches
      cy.contains("No available stock").should("be.visible");
    });

    it("should apply grace period before expiration", () => {
      cy.visit("/settings/stock");;

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Expiration Grace Period"]').clear().type("7");

      cy.get('button:contains("Save")').click();
      cy.contains("Settings updated").should("be.visible");
    });

    it("should notify when batch expires", () => {
      cy.visit("/notifications");

      cy.contains("Batch expiration").should("be.visible");
    });
  });

  describe("FIFO/LIFO Allocation", () => {
    it("should allocate using FIFO strategy", () => {
      cy.visit("/stock-batches");
      cy.get('button:contains("Configure")').click();

      cy.get('select[name="Allocation Strategy"]').select("FIFO");

      cy.get('button:contains("Save")').click();
      cy.contains("Strategy updated").should("be.visible");
    });

    it("should allocate using LIFO strategy", () => {
      cy.visit("/stock-batches");
      cy.get('button:contains("Configure")').click();

      cy.get('select[name="Allocation Strategy"]').select("LIFO");

      cy.get('button:contains("Save")').click();
      cy.contains("Strategy updated").should("be.visible");
    });

    it("should verify batch order in allocation", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      // Check batch allocation sequence
      cy.contains("Batch Allocation").should("be.visible");
      cy.contains("Batch 1").should("be.visible");
    });
  });

  describe("Batch Lifecycle", () => {
    it("should transition batch through lifecycle", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.contains("Status: ACTIVE").should("be.visible");
      cy.contains("Status: RESERVED").should("be.visible");
      cy.contains("Status: CONSUMED").should("be.visible");
    });

    it("should create batch with initial state", () => {
      cy.visit("/warehouse-management");
      cy.get('button:contains("Receive Stock")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("1000");
      cy.get('input[placeholder*="Batch Number"]').type("BATCH-001");
      cy.get('input[placeholder*="Manufacture Date"]').type("2024-01-01");
      cy.get('input[placeholder*="Expiration Date"]').type("2025-01-01");

      cy.get('button:contains("Create Batch")').click();
      cy.contains("Batch created").should("be.visible");
    });

    it("should archive consumed batches", () => {
      cy.visit("/stock-batches");

      cy.get('button:contains("Archive")').click();

      cy.get('checkbox[name="consumed-only"]').check();

      cy.get('button:contains("Archive Selected")').click();
      cy.contains("Batches archived").should("be.visible");
    });

    it("should restore archived batch", () => {
      cy.visit("/stock-batches/archive");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Restore")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Batch restored").should("be.visible");
    });
  });

  describe("Batch Aging Analysis", () => {
    it("should view batch aging report", () => {
      cy.visit("/reports/batch-aging");

      cy.contains("Batch Aging Report").should("be.visible");
      cy.contains("Days in Stock").should("be.visible");
      cy.contains("Batch Age").should("be.visible");
    });

    it("should identify slow-moving batches", () => {
      cy.visit("/analytics/inventory");

      cy.get('button:contains("Slow Movers")').click();

      cy.get('[data-testid="batch-row"]').should("have.length.greaterThan", 0);
    });

    it("should calculate batch holding costs", () => {
      cy.visit("/reports/batch-aging");

      cy.get('button:contains("Calculate Costs")').click();

      cy.contains("Storage Cost").should("be.visible");
      cy.contains("Holding Cost").should("be.visible");
    });

    it("should export batch aging data", () => {
      cy.visit("/reports/batch-aging");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/batch-aging-*.csv").should("exist");
    });
  });

  describe("Batch Quality & Compliance", () => {
    it("should mark batch as quarantine", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Quarantine")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Quality issue detected");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Batch quarantined").should("be.visible");
    });

    it("should release quarantined batch", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"][data-status="QUARANTINE"]').first().click();

      cy.get('button:contains("Release")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Batch released").should("be.visible");
    });

    it("should perform batch recall", () => {
      cy.visit("/stock-batches");

      cy.get('button:contains("Recall")').click();

      cy.get('input[placeholder*="Batch Number"]').type("BATCH-001");
      cy.get('textarea[placeholder*="Reason"]').type("Safety recall");

      cy.get('button:contains("Initiate Recall")').click();
      cy.contains("Recall initiated").should("be.visible");
    });

    it("should track batch genealogy", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Genealogy")').click();

      cy.contains("Parent Batches").should("be.visible");
      cy.contains("Child Batches").should("be.visible");
      cy.contains("Allocation History").should("be.visible");
    });
  });

  describe("Batch Consolidation", () => {
    it("should consolidate similar batches", () => {
      cy.visit("/warehouse-management");

      cy.get('button:contains("Consolidate Batches")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('checkbox[name="same-product"]').check();

      cy.get('button:contains("Consolidate")').click();
      cy.contains("Consolidation complete").should("be.visible");
    });

    it("should split batch quantity", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Split")').click();

      cy.get('input[placeholder*="Split Quantity"]').type("500");

      cy.get('button:contains("Create Split Batch")').click();
      cy.contains("Batch split").should("be.visible");
    });
  });
});
