/**
 * Stock Batches E2E Tests
 *
 * Tests stock batch management:
 * - Create batches from GRN
 * - Batch allocation and tracking
 * - Landed cost allocation
 * - Batch FIFO sequencing
 * - Expiry management
 *
 * Run: npm run test:e2e -- --spec '**/stock-batches.cy.js'
 */

describe("Stock Batches - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Stock Batches", () => {
    it("should create batch from GRN", () => {
      cy.visit("/stock-batches");
      cy.get('button:contains("Create Batch")').click();

      // Link to GRN
      cy.get('input[placeholder*="Select GRN"]').type("GRN-");
      cy.get('[role="option"]').first().click();

      // Batch details prefilled from GRN
      cy.get('input[placeholder*="Product"]').should("have.value");
      cy.get('input[placeholder*="Quantity"]').should("have.value");

      // Set batch code
      cy.get('input[placeholder*="Batch Code"]').type("BATCH-001-2024");

      // Set dates
      cy.get('input[placeholder*="Manufacturing Date"]').type("2024-01-01");
      cy.get('input[placeholder*="Expiry Date"]').type("2026-01-01");

      cy.get('button:contains("Create Batch")').click();
      cy.contains("Stock batch created").should("be.visible");
    });

    it("should create batch with landed costs", () => {
      cy.visit("/stock-batches");
      cy.get('button:contains("Create Batch")').click();

      cy.get('input[placeholder*="Select GRN"]').type("GRN-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Batch Code"]').type("BATCH-002-2024");
      cy.get('input[placeholder*="Manufacturing Date"]').type("2024-01-01");
      cy.get('input[placeholder*="Expiry Date"]').type("2026-01-01");

      // Add landed costs
      cy.get('input[placeholder*="Freight Cost"]').type("500");
      cy.get('input[placeholder*="Customs Cost"]').type("200");
      cy.get('input[placeholder*="Insurance Cost"]').type("100");

      cy.get('button:contains("Create Batch")').click();
      cy.contains("Batch created with landed costs").should("be.visible");
    });

    it("should create manual batch without GRN", () => {
      cy.visit("/stock-batches");
      cy.get('button:contains("Create Batch")').click();

      cy.get('checkbox[name="manual-entry"]').click();

      // Select product
      cy.get('input[placeholder*="Select Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Set quantity
      cy.get('input[placeholder*="Quantity"]').type("500");

      // Batch details
      cy.get('input[placeholder*="Batch Code"]').type("MANUAL-001");
      cy.get('input[placeholder*="Manufacturing Date"]').type("2024-01-01");
      cy.get('input[placeholder*="Cost per Unit"]').type("50");

      cy.get('button:contains("Create Batch")').click();
      cy.contains("Manual batch created").should("be.visible");
    });
  });

  describe("Batch Allocation", () => {
    it("should allocate batch to invoice line item", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Allocate")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Allocate Quantity"]').type("100");

      cy.get('button:contains("Allocate")').click();
      cy.contains("Batch allocated").should("be.visible");
    });

    it("should split batch allocation", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Split Allocation")').click();

      // First allocation
      cy.get('input[placeholder*="Select Invoice"]').first().type("INV-");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').first().type("60");

      // Add another allocation
      cy.get('button:contains("Add Allocation")').click();
      cy.get('input[placeholder*="Select Invoice"]').eq(1).type("INV-");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').eq(1).type("40");

      cy.get('button:contains("Complete Split")').click();
      cy.contains("Batch split successfully").should("be.visible");
    });

    it("should handle FIFO allocation automatically", () => {
      cy.visit("/stock-batches");

      // Navigate to batch allocation
      cy.get('button:contains("Batch Allocation")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      cy.get('checkbox[name="use-fifo"]').check();

      cy.get('button:contains("Allocate FIFO")').click();
      cy.contains("FIFO allocation applied").should("be.visible");
    });
  });

  describe("Batch Tracking & Analysis", () => {
    it("should view batch details and cost breakdown", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      // Verify batch information
      cy.contains(/BATCH-\d+/).should("be.visible");
      cy.get('[data-testid="batch-qty"]').should("contain", /\d+/);
      cy.get('[data-testid="batch-cost"]').should("contain", /\d+/);
      cy.get('[data-testid="avg-cost"]').should("contain", /\d+/);
    });

    it("should track batch aging", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Aging Analysis")').click();

      cy.contains("Days in Stock:").should("be.visible");
      cy.contains("Turnover Rate:").should("be.visible");
      cy.contains("Slow Moving:").should("be.visible");
    });

    it("should view batch allocation history", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Allocation History")').click();

      cy.get('[data-testid="allocation-record"]').should("have.length.greaterThan", 0);
    });

    it("should track batch locations across warehouses", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Warehouse Locations")').click();

      cy.contains("Warehouse:").should("be.visible");
      cy.contains("Location:").should("be.visible");
      cy.contains("Qty on Hand:").should("be.visible");
    });
  });

  describe("Batch Expiry Management", () => {
    it("should flag batch approaching expiry", () => {
      cy.visit("/stock-batches");

      // Set expiry filter to 30 days
      cy.get('input[placeholder*="Expiry Warning Days"]').type("30");
      cy.get('button:contains("Apply Filter")').click();

      cy.get('[data-testid="batch-row"][data-status="EXPIRING_SOON"]').should(
        "have.length.greaterThan",
        0,
      );
    });

    it("should mark batch as expired", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"][data-status="EXPIRED"]').first().click();

      cy.get('button:contains("Mark Expired")').click();
      cy.get('textarea[placeholder*="Reason"]').type("Past expiry date");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Batch marked as expired").should("be.visible");
    });

    it("should dispose of expired batch", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"][data-status="EXPIRED"]').first().click();

      cy.get('button:contains("Dispose")').click();

      cy.get('input[placeholder*="Disposal Qty"]').type("100");
      cy.get('select[name="Disposal Method"]').select("SCRAP");
      cy.get('textarea[placeholder*="Notes"]').type("Expired batch disposal");

      cy.get('button:contains("Confirm Disposal")').click();
      cy.contains("Batch disposed").should("be.visible");
    });
  });

  describe("Batch Cost Calculations", () => {
    it("should calculate weighted average cost", () => {
      cy.visit("/stock-batches");

      cy.get('button:contains("Cost Analysis")').click();

      cy.contains("Weighted Average Cost").should("be.visible");
      cy.get('[data-testid="wac-value"]').should("contain", /\d+/);
    });

    it("should view landed cost allocation breakdown", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Landed Cost Breakdown")').click();

      cy.contains("Base Cost").should("be.visible");
      cy.contains("Freight").should("be.visible");
      cy.contains("Customs").should("be.visible");
      cy.contains("Total Cost").should("be.visible");
    });

    it("should revalue batch cost", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Revalue")').click();

      cy.get('input[placeholder*="New Cost per Unit"]').type("55");
      cy.get('textarea[placeholder*="Reason"]').type("Market price adjustment");

      cy.get('button:contains("Apply Revaluation")').click();
      cy.contains("Batch revalued").should("be.visible");
    });
  });

  describe("Batch Reconciliation", () => {
    it("should reconcile batch with delivery notes", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Reconcile DNs")').click();

      // View allocation vs delivery
      cy.contains("Allocated:").should("be.visible");
      cy.contains("Delivered:").should("be.visible");
      cy.contains("Outstanding:").should("be.visible");

      cy.get('button:contains("Reconcile")').click();
      cy.contains("Batch reconciled").should("be.visible");
    });

    it("should verify batch count via stock take", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Stock Count")').click();

      cy.get('input[placeholder*="Physical Count"]').type("100");

      cy.get('button:contains("Record Count")').click();

      // Should show variance if any
      cy.get('body').then(($body) => {
        if ($body.text().includes("Variance")) {
          cy.contains("Variance:").should("be.visible");
        }
      });
    });
  });

  describe("Batch Analytics", () => {
    it("should view batch inventory metrics", () => {
      cy.visit("/stock-batches");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Batches").should("be.visible");
      cy.contains("Average Batch Age").should("be.visible");
      cy.contains("Turnover Rate").should("be.visible");
    });

    it("should filter batches by product", () => {
      cy.visit("/stock-batches");

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="batch-row"]').each(($row) => {
        cy.wrap($row).contains("SS-304");
      });
    });

    it("should filter batches by status", () => {
      cy.visit("/stock-batches");

      cy.get('select[name="Status"]').select("AVAILABLE");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="batch-row"]').each(($row) => {
        cy.wrap($row).should("have.attr", "data-status", "AVAILABLE");
      });
    });
  });

  describe("Batch Export", () => {
    it("should export batch list to CSV", () => {
      cy.visit("/stock-batches");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/batches-*.csv").should("exist");
    });

    it("should export batch details report", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Export Details")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/batch-*.pdf").should("exist");
    });
  });
});
