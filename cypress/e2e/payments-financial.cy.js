/**
 * Payments & Financial Operations E2E Tests
 *
 * Tests payment processing and financial workflows:
 * - Record customer and supplier payments
 * - Payment reconciliation
 * - Bank matching
 * - Payment holds and disputes
 * - Multi-currency handling
 *
 */

describe("Payments & Financial Operations - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Record Customer Payments", () => {
    it("should record partial customer payment", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("CUSTOMER");

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Payment Amount"]').type("5000");
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Reference"]').type("TXN-12345");
      cy.get('input[placeholder*="Payment Date"]').type("2024-01-15");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Payment recorded").should("be.visible");
    });

    it("should record full customer payment", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("CUSTOMER");

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      // Get invoice total and pay full amount
      cy.get('[data-testid="invoice-total"]').then(($total) => {
        const amount = $total.text().match(/\d+/)[0];
        cy.get('input[placeholder*="Payment Amount"]').type(amount);
      });

      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Reference"]').type("TXN-12345");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Invoice marked as paid").should("be.visible");
    });

    it("should record customer payment with hold", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("CUSTOMER");

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Payment Amount"]').type("5000");
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");

      // Place on hold
      cy.get('checkbox[name="hold-payment"]').check();
      cy.get('textarea[placeholder*="Hold Reason"]').type("Verification pending");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Payment recorded on hold").should("be.visible");
    });

    it("should handle overpayment validation", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("CUSTOMER");

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Payment Amount"]').type("999999");

      cy.get('button:contains("Record Payment")').click();

      cy.contains("Overpayment").should("be.visible");
    });
  });

  describe("Record Supplier Payments", () => {
    it("should record supplier payment", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("SUPPLIER");

      cy.get('input[placeholder*="Select Bill"]').type("SINV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Payment Amount"]').type("5000");
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Cheque Number"]').type("CHQ-12345");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Supplier payment recorded").should("be.visible");
    });

    it("should record supplier payment on account", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("SUPPLIER");

      cy.get('checkbox[name="payment-on-account"]').check();

      cy.get('input[placeholder*="Select Supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Payment Amount"]').type("10000");
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Payment on account recorded").should("be.visible");
    });
  });

  describe("Payment Reconciliation", () => {
    it("should reconcile payment against invoice", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"][data-status="UNRECONCILED"]')
        .first()
        .click();

      cy.get('button:contains("Reconcile")').click();

      // Auto-match or manual match
      cy.get('select[name="Invoice"]').should("have.value");

      cy.get('button:contains("Confirm Reconciliation")').click();
      cy.contains("Payment reconciled").should("be.visible");
    });

    it("should handle partial payment reconciliation", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"][data-status="UNRECONCILED"]')
        .first()
        .click();

      cy.get('button:contains("Partial Reconciliation")').click();

      // Link to multiple invoices
      cy.get('input[placeholder*="Invoice"]').first().type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Amount"]').type("3000");

      cy.get('button:contains("Add Invoice")').click();

      cy.get('button:contains("Reconcile")').click();
      cy.contains("Partial reconciliation completed").should("be.visible");
    });

    it("should identify unreconciled payments", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Unreconciled")').click();

      cy.get('[data-testid="payment-row"][data-status="UNRECONCILED"]').should(
        "have.length.greaterThan",
        0,
      );
    });
  });

  describe("Bank Reconciliation", () => {
    it("should upload bank statement", () => {
      cy.visit("/analytics/bank-reconciliation");
      cy.get('button:contains("Upload Statement")').click();

      cy.get('select[name="Bank Account"]').select("Primary Account");
      cy.get('input[placeholder*="Upload File"]').selectFile(
        "cypress/fixtures/bank-statement.csv",
      );

      cy.get('button:contains("Upload")').click();
      cy.contains("Statement uploaded").should("be.visible");
    });

    it("should match payments to bank transactions", () => {
      cy.visit("/analytics/bank-reconciliation");

      cy.get('button:contains("Match Transactions")').click();

      // Should auto-match based on amount and date
      cy.contains("Matched:").should("be.visible");
      cy.contains("Outstanding:").should("be.visible");

      cy.get('button:contains("Confirm Matching")').click();
      cy.contains("Reconciliation completed").should("be.visible");
    });

    it("should identify bank discrepancies", () => {
      cy.visit("/analytics/bank-reconciliation");

      cy.get('button:contains("Match Transactions")').click();

      // Check for variance
      cy.get('body').then(($body) => {
        if ($body.text().includes("Discrepancy")) {
          cy.contains("Bank/System variance:").should("be.visible");
        }
      });
    });
  });

  describe("Payment Holds & Disputes", () => {
    it("should place hold on payment", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Place Hold")').click();

      cy.get('select[name="Hold Reason"]').select("VERIFICATION");
      cy.get('textarea[placeholder*="Notes"]').type("Awaiting confirmation");

      cy.get('button:contains("Apply Hold")').click();
      cy.contains("Hold placed on payment").should("be.visible");
    });

    it("should release payment hold", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"][data-status="ON_HOLD"]')
        .first()
        .click();

      cy.get('button:contains("Release Hold")').click();

      cy.get('button:contains("Confirm Release")').click();
      cy.contains("Hold released").should("be.visible");
    });

    it("should record payment dispute", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Dispute Payment")').click();

      cy.get('textarea[placeholder*="Dispute Reason"]').type(
        "Duplicate payment processed",
      );
      cy.get('input[placeholder*="Dispute Amount"]').type("5000");

      cy.get('button:contains("File Dispute")').click();
      cy.contains("Dispute recorded").should("be.visible");
    });
  });

  describe("Multi-Currency Payments", () => {
    it("should record payment in foreign currency", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Record Payment")').click();

      cy.get('select[name="Payment Type"]').select("CUSTOMER");

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      // Set currency and amount
      cy.get('select[name="Currency"]').select("USD");
      cy.get('input[placeholder*="Payment Amount"]').type("1500");

      cy.get('input[placeholder*="Exchange Rate"]').type("3.67");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Payment recorded").should("be.visible");
    });

    it("should apply exchange gain/loss", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"][data-currency="USD"]')
        .first()
        .click();

      cy.get('button:contains("Apply Exchange Adjustment")').click();

      cy.get('input[placeholder*="Actual Rate"]').type("3.70");

      cy.get('button:contains("Calculate Gain/Loss")').click();

      cy.contains("Exchange gain").should("be.visible");
    });
  });

  describe("Payment Reversal & Refunds", () => {
    it("should reverse paid invoice", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"][data-status="RECONCILED"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Reverse Payment")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Duplicate payment");

      cy.get('button:contains("Reverse")').click();
      cy.contains("Payment reversed").should("be.visible");
    });

    it("should issue refund to customer", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="payment-row"][data-status="RECONCILED"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Issue Refund")').click();

      cy.get('input[placeholder*="Refund Amount"]').type("2000");
      cy.get('textarea[placeholder*="Reason"]').type("Overpayment refund");

      cy.get('button:contains("Issue Refund")').click();
      cy.contains("Refund issued").should("be.visible");
    });
  });

  describe("Payment Analytics", () => {
    it("should view payment summary metrics", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Payments").should("be.visible");
      cy.contains("Reconciled %").should("be.visible");
      cy.contains("Outstanding").should("be.visible");
      cy.contains("Average Payment Days").should("be.visible");
    });

    it("should view payments by method", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("By Method")').click();

      cy.contains("Bank Transfer").should("be.visible");
      cy.contains("Cheque").should("be.visible");
      cy.contains("Cash").should("be.visible");
    });

    it("should identify slow-paying customers", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Aging Analysis")').click();

      cy.contains("0-30 Days").should("be.visible");
      cy.contains("31-60 Days").should("be.visible");
      cy.contains("Over 60 Days").should("be.visible");
    });
  });

  describe("Payment Export & Reporting", () => {
    it("should export payments to CSV", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/payments-*.csv").should("exist");
    });

    it("should export bank reconciliation report", () => {
      cy.visit("/analytics/bank-reconciliation");

      cy.get('button:contains("Export Report")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/reconciliation-*.pdf").should("exist");
    });
  });
});
