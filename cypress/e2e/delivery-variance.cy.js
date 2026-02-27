/**
 * Delivery Variance E2E Tests
 *
 * Tests receiving reconciliation:
 * - GRN vs PO quantity variance
 * - Quality inspection on receipt
 * - Variance approval workflows
 * - Short receipt and overage handling
 * - Batch variance tracking
 *
 */

describe("Delivery Variance - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Quantity Variance", () => {
    it("should detect short receipt", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Receive")').click();

      // PO qty: 1000, Received: 950
      cy.get('input[placeholder*="Received Qty"]').type("950");

      cy.contains("Variance").should("be.visible");
      cy.contains("Short by 50 units").should("be.visible");
    });

    it("should detect overage receipt", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Receive")').click();

      // PO qty: 1000, Received: 1050
      cy.get('input[placeholder*="Received Qty"]').type("1050");

      cy.contains("Variance").should("be.visible");
      cy.contains("Over by 50 units").should("be.visible");
    });

    it("should apply variance discount for short receipt", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Receive")').click();
      cy.get('input[placeholder*="Received Qty"]').type("950");

      cy.get('button:contains("Apply Variance Adjustment")').click();
      cy.get('select[name="Adjustment Type"]').select("VARIANCE_DISCOUNT");

      cy.contains("Discount applied").should("be.visible");
    });

    it("should reject overage with variance approval", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("Receive")').click();
      cy.get('input[placeholder*="Received Qty"]').type("1050");

      cy.get('button:contains("Require Approval")').click();

      cy.contains("Awaiting approval").should("be.visible");
    });
  });

  describe("Quality Inspection Variance", () => {
    it("should record rejected quantity", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("Receive")').click();

      cy.get('input[placeholder*="Received Qty"]').type("1000");
      cy.get('input[placeholder*="Rejected Qty"]').type("50");

      cy.contains("Quality Variance").should("be.visible");
      cy.contains("50 units rejected").should("be.visible");
    });

    it("should mark batch as quarantine due to quality", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("Receive")').click();

      cy.get('input[placeholder*="Received Qty"]').type("1000");
      cy.get('checkbox[name="quality-issue"]').check();
      cy.get('textarea[placeholder*="Issue"]').type("Found cracks in batch");

      cy.get('button:contains("Complete")').click();
      cy.contains("Batch quarantined").should("be.visible");
    });

    it("should accept partial batch after inspection", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("Receive")').click();

      cy.get('input[placeholder*="Received Qty"]').type("1000");
      cy.get('input[placeholder*="Accepted Qty"]').type("950");

      cy.get('button:contains("Complete Reception")').click();
      cy.contains("Reception completed").should("be.visible");
    });
  });

  describe("Variance Approval Workflow", () => {
    it("should submit variance for approval", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.get('button:contains("Receive")').click();
      cy.get('input[placeholder*="Received Qty"]').type("950");

      cy.get('button:contains("Submit for Variance Approval")').click();

      cy.contains("Submitted for approval").should("be.visible");
    });

    it("should approve variance", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="variance-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Approve")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Variance approved").should("be.visible");
    });

    it("should reject variance", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="variance-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Excessive shortage");
      cy.get('button:contains("Confirm")').click();
      cy.contains("Variance rejected").should("be.visible");
    });

    it("should escalate variance to manager", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="variance-row"]').first().click();

      cy.get('button:contains("Escalate")').click();

      cy.get('select[name="Escalate To"]').select("MANAGER");
      cy.get('button:contains("Escalate")').click();

      cy.contains("Escalated to manager").should("be.visible");
    });
  });

  describe("Variance Reconciliation", () => {
    it("should reconcile PO to received", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.contains("PO Quantity").should("be.visible");
      cy.contains("Received Quantity").should("be.visible");
      cy.contains("Variance").should("be.visible");
    });

    it("should track cumulative variance", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="po-row"]').first().click();

      cy.get('button:contains("View Receipts")').click();

      cy.contains("Total Received").should("be.visible");
      cy.contains("Total Variance").should("be.visible");
      cy.contains("Pending Receipt").should("be.visible");
    });

    it("should close PO after variance resolution", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="po-row"][data-status="PARTIAL"]').first().click();

      cy.get('button:contains("View Receipts")').click();
      cy.get('button:contains("Resolve Variances")').click();

      cy.get('button:contains("Close PO")').click();
      cy.contains("PO closed").should("be.visible");
    });

    it("should calculate variance percentage", () => {
      cy.visit("/app/purchases");
      cy.get('[data-testid="grn-row"]').first().click();

      cy.contains("Variance %").should("be.visible");
    });
  });

  describe("Variance Reporting", () => {
    it("should view variance report", () => {
      cy.visit("/analytics/reports/variance");

      cy.contains("Variance Report").should("be.visible");
      cy.contains("Supplier").should("be.visible");
      cy.contains("Short Receipts").should("be.visible");
      cy.contains("Overages").should("be.visible");
    });

    it("should identify problematic suppliers", () => {
      cy.visit("/analytics/reports/variance");

      cy.get('button:contains("By Supplier")').click();

      cy.get('[data-testid="supplier-row"]').should("have.length.greaterThan", 0);
      cy.contains("Average Variance %").should("be.visible");
    });

    it("should export variance report", () => {
      cy.visit("/analytics/reports/variance");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("EXCEL");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/variance-report-*.xlsx").should("exist");
    });
  });
});
