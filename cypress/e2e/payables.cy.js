/**
 * Payables Management E2E Tests
 *
 * Tests accounts payable operations:
 * - Supplier aging analysis
 * - Payment planning
 * - Discount management
 * - Payment scheduling
 * - Supplier disputes
 *
 * Run: npm run test:e2e -- --spec '**/payables.cy.js'
 */

describe("Payables Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Payables Analysis", () => {
    it("should view AP aging report", () => {
      cy.visit("/payables");
      cy.get('button:contains("AP Aging")').click();

      cy.contains("Current").should("be.visible");
      cy.contains("30-60 Days").should("be.visible");
      cy.contains("60-90 Days").should("be.visible");
      cy.contains("Over 90 Days").should("be.visible");

      cy.get('[data-testid="aging-bucket"]').should("have.length", 4);
    });

    it("should view supplier payables summary", () => {
      cy.visit("/payables");

      cy.get('button:contains("Supplier Summary")').click();

      cy.get('[data-testid="supplier-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="supplier-row"]')
        .first()
        .within(() => {
          cy.contains(/\d+/).should("be.visible"); // Outstanding
        });
    });

    it("should view payment due dates", () => {
      cy.visit("/payables");

      cy.get('button:contains("Payment Due")').click();

      cy.contains("Due Today").should("be.visible");
      cy.contains("Due This Week").should("be.visible");
      cy.contains("Due This Month").should("be.visible");
    });
  });

  describe("Payment Planning", () => {
    it("should create payment plan", () => {
      cy.visit("/payables");
      cy.get('button:contains("Payment Plan")').click();

      cy.get('input[placeholder*="Select Supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      // Add bills to plan
      cy.get('button:contains("Add Bill")').click();

      cy.get('checkbox[name="select-bill"]').first().check();

      // Set payment date
      cy.get('input[placeholder*="Payment Date"]').type("2024-02-15");

      cy.get('button:contains("Create Plan")').click();
      cy.contains("Payment plan created").should("be.visible");
    });

    it("should optimize payment schedule", () => {
      cy.visit("/payables");
      cy.get('button:contains("Optimize Schedule")').click();

      cy.get('select[name="Optimization"]').select("EARLY_DISCOUNTS");

      cy.get('button:contains("Analyze")').click();

      cy.contains("Potential Savings:").should("be.visible");
    });

    it("should set payment calendar", () => {
      cy.visit("/payables");
      cy.get('button:contains("Payment Calendar")').click();

      // Add payment date
      cy.get('input[placeholder*="Payment Date"]').type("2024-02-15");
      cy.get('input[placeholder*="Amount"]').type("50000");

      cy.get('button:contains("Add to Calendar")').click();
      cy.contains("Payment added to calendar").should("be.visible");
    });
  });

  describe("Early Payment Discounts", () => {
    it("should identify available early discounts", () => {
      cy.visit("/payables");

      cy.get('button:contains("Available Discounts")').click();

      cy.get('[data-testid="discount-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="discount-row"]')
        .first()
        .within(() => {
          cy.contains("%").should("be.visible"); // Discount %
          cy.contains(/\d+ days/).should("be.visible"); // Period
        });
    });

    it("should calculate discount savings", () => {
      cy.visit("/payables");

      cy.get('button:contains("Discount Analysis")').click();

      cy.get('input[placeholder*="Select Bill"]').type("SINV-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Calculate Savings")').click();

      cy.contains("Discount Available:").should("be.visible");
      cy.contains("Payment Due Date:").should("be.visible");
      cy.contains("Discount Due Date:").should("be.visible");
    });

    it("should take early payment discount", () => {
      cy.visit("/payables");

      cy.get('button:contains("Available Discounts")').click();

      cy.get('[data-testid="discount-row"]').first().click();

      cy.get('button:contains("Pay Early")').click();

      // Record payment
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Reference"]').type("TXN-12345");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Payment recorded with discount").should("be.visible");
    });
  });

  describe("Supplier Payment Coordination", () => {
    it("should consolidate supplier payments", () => {
      cy.visit("/payables");
      cy.get('button:contains("Consolidate Payments")').click();

      cy.get('input[placeholder*="Select Supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      // Select multiple bills
      cy.get('checkbox[name="select-all"]').check();

      cy.get('button:contains("Consolidate")').click();

      cy.contains("Bills consolidated for payment").should("be.visible");
    });

    it("should batch multiple supplier payments", () => {
      cy.visit("/payables");
      cy.get('button:contains("Batch Payments")').click();

      cy.get('button:contains("Select Suppliers")').click();

      cy.get('checkbox[name="supplier"]').first().check();
      cy.get('checkbox[name="supplier"]').eq(1).check();

      cy.get('button:contains("Create Batch")').click();

      cy.contains("Payment batch created").should("be.visible");
    });
  });

  describe("Payment Holds & Disputes", () => {
    it("should place hold on supplier payment", () => {
      cy.visit("/payables");
      cy.get('button:contains("AP Aging")').click();

      cy.get('[data-testid="bill-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Place Hold")').click();

      cy.get('select[name="Hold Reason"]').select("VERIFICATION");
      cy.get('textarea[placeholder*="Reason"]').type("Awaiting invoice verification");

      cy.get('button:contains("Place Hold")').click();
      cy.contains("Hold placed").should("be.visible");
    });

    it("should record supplier dispute", () => {
      cy.visit("/payables");
      cy.get('button:contains("AP Aging")').click();

      cy.get('[data-testid="bill-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Record Dispute")').click();

      cy.get('textarea[placeholder*="Dispute Details"]').type(
        "Invoice quantity mismatch",
      );
      cy.get('input[placeholder*="Disputed Amount"]').type("2000");

      cy.get('button:contains("File Dispute")').click();
      cy.contains("Dispute recorded").should("be.visible");
    });

    it("should resolve supplier dispute", () => {
      cy.visit("/payables");
      cy.get('button:contains("Active Disputes")').click();

      cy.get('[data-testid="dispute-row"]').first().click();

      cy.get('button:contains("Resolve")').click();

      cy.get('select[name="Resolution"]').select("PARTIAL_CREDIT");
      cy.get('input[placeholder*="Credit Amount"]').type("500");

      cy.get('button:contains("Resolve Dispute")').click();
      cy.contains("Dispute resolved").should("be.visible");
    });
  });

  describe("Payables Reconciliation", () => {
    it("should reconcile payables ledger", () => {
      cy.visit("/payables");

      cy.get('button:contains("Reconcile")').click();

      cy.get('input[placeholder*="Reconciliation Date"]').type("2024-01-31");

      cy.get('button:contains("Generate Reconciliation")').click();

      cy.contains("General Ledger Balance:").should("be.visible");
      cy.contains("Subledger Balance:").should("be.visible");
    });

    it("should identify reconciliation variance", () => {
      cy.visit("/payables");

      cy.get('button:contains("Reconcile")').click();

      cy.get('input[placeholder*="Reconciliation Date"]').type("2024-01-31");

      cy.get('button:contains("Generate Reconciliation")').click();

      cy.get('body').then(($body) => {
        if ($body.text().includes("Variance")) {
          cy.contains("Reconciliation Variance:").should("be.visible");
        }
      });
    });
  });

  describe("Supplier Communication", () => {
    it("should send payment remittance", () => {
      cy.visit("/payables");
      cy.get('button:contains("Payment Remittance")').click();

      cy.get('input[placeholder*="Select Supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Generate Remittance")').click();

      cy.contains("Remittance Generated").should("be.visible");
    });

    it("should email payment notification", () => {
      cy.visit("/payables");
      cy.get('button:contains("Payment Remittance")').click();

      cy.get('input[placeholder*="Select Supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Generate Remittance")').click();

      cy.get('button:contains("Email Notification")').click();

      cy.get('button:contains("Send")').click();
      cy.contains("Notification sent").should("be.visible");
    });
  });

  describe("Payables Analytics", () => {
    it("should view payables trends", () => {
      cy.visit("/payables");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total AP:").should("be.visible");
      cy.contains("Average Invoice Age:").should("be.visible");
      cy.contains("Average Payment Days:").should("be.visible");
    });

    it("should analyze supplier payment performance", () => {
      cy.visit("/payables");

      cy.get('button:contains("Supplier Performance")').click();

      cy.get('[data-testid="supplier-row"]').should("have.length.greaterThan", 0);
    });

    it("should export AP aging report", () => {
      cy.visit("/payables");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/ap-aging-*.pdf").should("exist");
    });
  });

  describe("Payment Processing", () => {
    it("should generate payment voucher", () => {
      cy.visit("/payables");
      cy.get('button:contains("AP Aging")').click();

      cy.get('[data-testid="bill-row"]').first().click();

      cy.get('button:contains("Payment Voucher")').click();

      cy.contains("Voucher Number:").should("be.visible");
      cy.get('button:contains("Print")').should("be.visible");
    });

    it("should approve payment request", () => {
      cy.visit("/payables");
      cy.get('button:contains("Pending Approvals")').click();

      cy.get('[data-testid="payment-row"]').first().click();

      cy.get('button:contains("Approve")').click();

      cy.get('textarea[placeholder*="Notes"]').type("Approved for payment");

      cy.get('button:contains("Confirm Approval")').click();
      cy.contains("Payment approved").should("be.visible");
    });
  });
});
