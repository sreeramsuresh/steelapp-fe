/**
 * Goods Receipt Notes (GRN) E2E Tests
 *
 * Tests complete GRN lifecycle:
 * - Create GRN from PO
 * - Partial receipts
 * - Quality checks
 * - Batch creation
 * - Stock updates
 *
 */

describe("Goods Receipt Notes (GRN) - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create GRN", () => {
    it("should create GRN from purchase order", () => {
      cy.visit("/app/purchases");
      cy.get('button:contains("Create GRN")').click();

      // Link to PO
      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      // Verify prefilled line items
      cy.get('[data-testid="grn-line-item"]').should("have.length.greaterThan", 0);

      // Set received quantities
      cy.get('input[placeholder*="Received Qty"]').first().type("100");

      // Set warehouse location
      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("GRN created").should("be.visible");

      // Verify GRN number
      cy.contains(/GRN-\d{6}/);
    });

    it("should create standalone GRN without PO", () => {
      cy.visit("/app/purchases");
      cy.get('button:contains("Create GRN")').click();

      cy.get('checkbox[name="create-without-po"]').click();

      // Select supplier
      cy.get('input[placeholder*="Select supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      // Add line item
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Received Qty"]').type("100");

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("GRN created").should("be.visible");
    });

    it("should create GRN with multiple line items", () => {
      cy.visit("/app/purchases");
      cy.get('button:contains("Create GRN")').click();

      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      // Set quantities for all items
      cy.get('input[placeholder*="Received Qty"]').first().type("100");
      cy.get('input[placeholder*="Received Qty"]').eq(1).type("50");

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("GRN created").should("be.visible");
    });
  });

  describe("Partial Receipt Handling", () => {
    it("should record partial receipt of PO", () => {
      cy.visit("/app/purchases");
      cy.get('button:contains("Create GRN")').click();

      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      // Receive less than ordered
      cy.get('input[placeholder*="Received Qty"]')
        .first()
        .then(($input) => {
          const ordered = parseInt($input.attr("placeholder"));
          cy.wrap($input).type((ordered / 2).toString());
        });

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("Partial GRN created").should("be.visible");
    });

    it("should handle overage in receipt", () => {
      cy.visit("/app/purchases");
      cy.get('button:contains("Create GRN")').click();

      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      // Receive more than ordered
      cy.get('input[placeholder*="Received Qty"]').first().type("150");

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Create GRN")').click();

      cy.contains("Overage noted").should("be.visible");
    });

    it("should create remainder GRN for outstanding items", () => {
      cy.visit("/app/purchases");
      cy.get('button:contains("Create GRN")').click();

      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      // Receive partial
      cy.get('input[placeholder*="Received Qty"]').first().type("80");

      cy.get('checkbox[name="create-remainder"]').click();

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Create GRN")').click();

      cy.contains("GRN created").should("be.visible");
      cy.contains("Remainder PO created").should("be.visible");
    });
  });

  describe("Quality Checks", () => {
    it("should record quality inspection results", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Quality Check")').click();

      // Mark as accepted
      cy.get('radio[name="quality-status"]').check("accepted");

      cy.get('textarea[placeholder*="QC Notes"]').type(
        "All items inspected and acceptable",
      );

      cy.get('button:contains("Complete QC")').click();
      cy.contains("Quality check recorded").should("be.visible");
    });

    it("should record quality rejection with damage claims", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Quality Check")').click();

      // Mark as rejected
      cy.get('radio[name="quality-status"]').check("rejected");

      cy.get('input[placeholder*="Damaged Qty"]').type("10");
      cy.get('textarea[placeholder*="Damage Description"]').type(
        "Corner bent, surface scratches",
      );

      // Upload photo
      cy.get('input[type="file"]').selectFile(
        "cypress/fixtures/damage-photo.jpg",
      );

      cy.get('button:contains("Report Damage")').click();
      cy.contains("Damage claim created").should("be.visible");
    });

    it("should handle partial quality acceptance", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Quality Check")').click();

      // Mark as conditional
      cy.get('radio[name="quality-status"]').check("conditional");

      cy.get('input[placeholder*="Accepted Qty"]').type("90");
      cy.get('input[placeholder*="Rejected Qty"]').type("10");

      cy.get('button:contains("Complete QC")').click();
      cy.contains("Conditional QC recorded").should("be.visible");
    });
  });

  describe("Batch Creation & Tracking", () => {
    it("should create stock batch from GRN", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="QUALITY_PASSED"]')
        .first()
        .click();

      cy.get('button:contains("Create Stock Batch")').click();

      // Set batch details
      cy.get('input[placeholder*="Batch Code"]').type("BATCH-001");
      cy.get('input[placeholder*="Manufacturing Date"]').type("2024-01-01");
      cy.get('input[placeholder*="Expiry Date"]').type("2026-01-01");

      cy.get('button:contains("Create Batch")').click();
      cy.contains("Stock batch created").should("be.visible");
    });

    it("should track batch details and cost", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("View Batches")').click();

      // Verify batch information
      cy.contains(/BATCH-\d+/);
      cy.get('[data-testid="batch-cost"]').should("contain", /\d+/);
      cy.get('[data-testid="batch-qty"]').should("contain", /\d+/);
    });

    it("should apply landed costs to batch", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="QUALITY_PASSED"]')
        .first()
        .click();

      cy.get('button:contains("Allocate Costs")').click();

      // Add freight cost
      cy.get('input[placeholder*="Freight Cost"]').type("500");

      // Add customs cost
      cy.get('input[placeholder*="Customs Cost"]').type("200");

      cy.get('button:contains("Apply Costs")').click();
      cy.contains("Costs allocated to batch").should("be.visible");
    });
  });

  describe("GRN Reconciliation", () => {
    it("should reconcile GRN with invoice", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="COMPLETED"]')
        .first()
        .click();

      cy.get('button:contains("Reconcile with Invoice")').click();

      // Should auto-match invoice
      cy.get('select[name="Invoice"]').should("have.value", /SINV-/);

      cy.get('button:contains("Reconcile")').click();
      cy.contains("GRN reconciled with invoice").should("be.visible");
    });

    it("should handle quantity variance in reconciliation", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="COMPLETED"]')
        .first()
        .click();

      cy.get('button:contains("Reconcile with Invoice")').click();

      // Check for variance
      cy.get('input[placeholder*="Invoice Qty"]').then(($input) => {
        const invoiceQty = $input.val();
        cy.get('input[placeholder*="GRN Qty"]').then(($grnInput) => {
          const grnQty = $grnInput.val();
          if (invoiceQty !== grnQty) {
            cy.contains("Quantity variance detected").should("be.visible");
          }
        });
      });
    });

    it("should record GRN exceptions", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Record Exception")').click();

      cy.get('select[name="Exception Type"]').select("SHORT_SUPPLY");
      cy.get('textarea[placeholder*="Details"]').type(
        "50 units short, contacted supplier",
      );

      cy.get('button:contains("Record")').click();
      cy.contains("Exception recorded").should("be.visible");
    });
  });

  describe("GRN Analytics", () => {
    it("should view receipt performance", () => {
      cy.visit("/app/purchases");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total GRNs").should("be.visible");
      cy.contains("On-Time Receipt Rate").should("be.visible");
      cy.contains("Quality Pass Rate").should("be.visible");
    });

    it("should filter GRNs by status", () => {
      cy.visit("/app/purchases");

      cy.get('select[name="Status"]').select("COMPLETED");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="grn-row"]').each(($row) => {
        cy.wrap($row).should("have.attr", "data-status", "COMPLETED");
      });
    });
  });

  describe("GRN Printing & Export", () => {
    it("should download GRN as PDF", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("Download PDF")').click();

      cy.readFile("cypress/downloads/grn-*.pdf").should("exist");
    });

    it("should export GRN data", () => {
      cy.visit("/app/purchases");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/grn-*.csv").should("exist");
    });
  });
});
