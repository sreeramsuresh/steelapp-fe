/**
 * VAT Operations E2E Tests
 *
 * Tests VAT compliance and operations:
 * - VAT calculation and application
 * - VAT returns filing
 * - Reverse charge handling
 * - Zero-rated supplies
 * - VAT reconciliation
 *
 */

describe("VAT Operations - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("VAT Calculation", () => {
    it("should calculate VAT on invoice", () => {
      cy.visit("/app/invoices");
      cy.get('button:contains("Create Invoice")').click();

      // Create invoice with VAT
      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Verify VAT applied
      cy.contains(/VAT.*5%/).should("be.visible");
      cy.contains(/Total.*AED/).should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should apply reverse charge on import", () => {
      cy.visit("/app/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('checkbox[name="reverse-charge"]').check();

      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      cy.contains("Reverse Charge Applies").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created with reverse charge").should("be.visible");
    });

    it("should apply zero-rated VAT to exports", () => {
      cy.visit("/app/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Select customer"]').type("International Customer");
      cy.get('[role="option"]').first().click();

      // Select export option
      cy.get('checkbox[name="export-supply"]').check();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      cy.contains("0% VAT").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should handle VAT exemptions", () => {
      cy.visit("/app/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Select customer"]').type("Exempt Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("EXEMPT_SERVICE");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("5");
      cy.get('input[placeholder*="Unit Price"]').type("100");

      cy.contains("Exempt Supply").should("be.visible");
      cy.contains("0% VAT").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });
  });

  describe("VAT Returns Filing", () => {
    it("should prepare VAT return for period", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Prepare Return")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-03-31");

      cy.get('button:contains("Prepare")').click();

      // Verify VAT return data
      cy.contains("Total Taxable Supplies:").should("be.visible");
      cy.contains("Total Output VAT:").should("be.visible");
      cy.contains("Total Input VAT:").should("be.visible");
      cy.contains("VAT Payable:").should("be.visible");
    });

    it("should file VAT return with FTA", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Prepare Return")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-03-31");

      cy.get('button:contains("Prepare")').click();

      cy.get('button:contains("File Return")').click();

      // Confirm filing
      cy.get('button:contains("Confirm Filing")').click();
      cy.contains("Return filed with FTA").should("be.visible");
    });

    it("should track VAT payment status", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Payment Status")').click();

      cy.get('[data-testid="payment-row"]').should("have.length.greaterThan", 0);

      // Verify columns
      cy.get('[data-testid="payment-row"]')
        .first()
        .within(() => {
          cy.contains(/PENDING|PAID|OVERDUE/).should("be.visible");
          cy.contains(/\d+/).should("be.visible"); // Amount
        });
    });
  });

  describe("VAT Reconciliation", () => {
    it("should reconcile VAT accounts", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Reconcile VAT")').click();

      cy.get('input[placeholder*="Reconciliation Date"]').type("2024-03-31");

      cy.get('button:contains("Generate Reconciliation")').click();

      // Verify reconciliation
      cy.contains("Output VAT Account:").should("be.visible");
      cy.contains("Input VAT Account:").should("be.visible");
      cy.contains("Variance:").should("be.visible");
    });

    it("should identify VAT discrepancies", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Reconcile VAT")').click();

      cy.get('input[placeholder*="Reconciliation Date"]').type("2024-03-31");

      cy.get('button:contains("Generate Reconciliation")').click();

      // Check for discrepancies
      cy.get('body').then(($body) => {
        if ($body.text().includes("Variance")) {
          cy.contains("VAT Variance:").should("be.visible");
        }
      });
    });

    it("should audit VAT adjustments", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Audit Trail")').click();

      cy.get('[data-testid="adjustment-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Reverse Charge Handling", () => {
    it("should track reverse charge transactions", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Reverse Charge")').click();

      cy.get('[data-testid="rc-transaction"]').should("have.length.greaterThan", 0);
    });

    it("should verify supplier TRN for reverse charge", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Reverse Charge")').click();

      cy.get('button:contains("Verify Suppliers")').click();

      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Check TRN")').click();

      cy.contains("TRN Status:").should("be.visible");
    });

    it("should report reverse charge VAT", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Prepare Return")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-03-31");

      cy.get('button:contains("Prepare")').click();

      cy.contains("Reverse Charge VAT:").should("be.visible");
    });
  });

  describe("Zero-Rated Supplies", () => {
    it("should track zero-rated supplies", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Zero-Rated Supplies")').click();

      cy.get('[data-testid="supply-row"]').should("have.length.greaterThan", 0);
    });

    it("should verify export documentation", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Zero-Rated Supplies")').click();

      cy.get('[data-testid="supply-row"]').first().click();

      cy.get('button:contains("View Documents")').click();

      cy.contains("Certificate of Origin").should("be.visible");
      cy.contains("Bill of Lading").should("be.visible");
    });

    it("should validate zero-rating eligibility", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Validate Zero-Rating")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-03-31");

      cy.get('button:contains("Validate")').click();

      cy.contains("Validation Results:").should("be.visible");
    });
  });

  describe("VAT Adjustments & Corrections", () => {
    it("should record VAT adjustment", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Adjustments")').click();

      cy.get('button:contains("New Adjustment")').click();

      cy.get('select[name="Type"]').select("ERROR_CORRECTION");
      cy.get('input[placeholder*="Amount"]').type("500");
      cy.get('textarea[placeholder*="Reason"]').type("Correction for prior period error");

      cy.get('button:contains("Record Adjustment")').click();
      cy.contains("Adjustment recorded").should("be.visible");
    });

    it("should amend filed VAT return", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Filed Returns")').click();

      cy.get('[data-testid="return-row"]').first().click();

      cy.get('button:contains("Amend Return")').click();

      cy.get('textarea[placeholder*="Amendment Reason"]').type(
        "Correction for calculation error",
      );

      cy.get('button:contains("File Amendment")').click();
      cy.contains("Amendment filed").should("be.visible");
    });

    it("should claim VAT refund", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Refund Claim")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-03-31");

      cy.get('button:contains("Calculate Refund")').click();

      cy.contains("Refund Amount:").should("be.visible");

      cy.get('button:contains("Claim Refund")').click();
      cy.contains("Refund claim filed").should("be.visible");
    });
  });

  describe("VAT Analytics", () => {
    it("should view VAT metrics", () => {
      cy.visit("/app/settings");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Output VAT:").should("be.visible");
      cy.contains("Total Input VAT:").should("be.visible");
      cy.contains("Net VAT:").should("be.visible");
      cy.contains("Effective VAT Rate:").should("be.visible");
    });

    it("should analyze VAT by transaction type", () => {
      cy.visit("/app/settings");

      cy.get('button:contains("By Transaction Type")').click();

      cy.contains("Taxable Supplies").should("be.visible");
      cy.contains("Zero-Rated Supplies").should("be.visible");
      cy.contains("Reverse Charge").should("be.visible");
    });

    it("should export VAT report", () => {
      cy.visit("/app/settings");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/vat-report-*.pdf").should("exist");
    });
  });

  describe("VAT Compliance", () => {
    it("should verify TRN details", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Compliance")').click();

      cy.get('button:contains("Verify TRN")').click();

      cy.get('input[placeholder*="TRN"]').type("100123456789012");

      cy.get('button:contains("Verify")').click();

      cy.contains("TRN Status:").should("be.visible");
    });

    it("should generate compliance certificate", () => {
      cy.visit("/app/settings");
      cy.get('button:contains("Compliance")').click();

      cy.get('button:contains("Compliance Certificate")').click();

      cy.get('input[placeholder*="Certificate Date"]').type("2024-03-31");

      cy.get('button:contains("Generate")').click();

      cy.contains("Certificate Generated").should("be.visible");
    });
  });
});
