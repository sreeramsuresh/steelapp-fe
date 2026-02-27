/**
 * Advance Payments E2E Tests
 *
 * Tests advance payment workflows:
 * - Advance payment creation and tracking
 * - Payment terms with deposits
 * - Advance payment allocation to invoices
 * - Advance payment reconciliation
 * - Refund processing
 *
 * Run: npm run test:e2e -- --spec '**/advance-payments.cy.js'
 */

describe("Advance Payments - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Advance Payment Creation", () => {
    it("should create advance payment from customer", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Receive Payment")').click();

      cy.get('select[name="Payment Type"]').select("ADVANCE");
      cy.get('input[placeholder*="Amount"]').type("10000");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Advance payment recorded").should("be.visible");
    });

    it("should set payment terms with deposit requirement", () => {
      cy.visit("/settings/payment-terms");

      cy.get('button:contains("New Term")').click();

      cy.get('input[placeholder*="Term Name"]').type("30% Deposit");
      cy.get('input[placeholder*="Days"]').type("30");
      cy.get('input[placeholder*="Deposit %"]').type("30");

      cy.get('button:contains("Create")').click();
      cy.contains("Payment term created").should("be.visible");
    });

    it("should require advance payment before invoice", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('select[name="Payment Terms"]').select("30% Deposit");

      cy.get('button:contains("Create")').click();

      cy.contains("Advance payment required").should("be.visible");
    });
  });

  describe("Advance Payment Tracking", () => {
    it("should track advance payment balance", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.contains("Advance Payment Balance").should("be.visible");
      cy.contains("Available for Allocation").should("be.visible");
    });

    it("should allocate advance to invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.contains("Advance Payment Available").should("be.visible");

      cy.get('button:contains("Apply Advance")').click();

      cy.get('input[placeholder*="Amount"]').type("10000");

      cy.get('button:contains("Allocate")').click();
      cy.contains("Advance allocated").should("be.visible");
    });

    it("should show advance payment deduction on invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.contains("Invoice Total").should("be.visible");
      cy.contains("Less: Advance Payment").should("be.visible");
      cy.contains("Amount Due").should("be.visible");
    });
  });

  describe("Advance Payment Reconciliation", () => {
    it("should reconcile advance payments", () => {
      cy.visit("/payments");

      cy.get('button:contains("Reconcile Advances")').click();

      cy.get('[data-testid="advance-row"]').should("have.length.greaterThan", 0);
    });

    it("should identify unallocated advances", () => {
      cy.visit("/payments");

      cy.get('button:contains("Unallocated Advances")').click();

      cy.get('[data-testid="advance-row"]').should("have.length.greaterThan", 0);
    });

    it("should allocate unallocated advance to pending invoice", () => {
      cy.visit("/payments");
      cy.get('[data-testid="advance-row"][data-status="UNALLOCATED"]').first().click();

      cy.get('button:contains("Allocate")').click();

      cy.get('select[name="Invoice"]').select("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Allocate")').click();
      cy.contains("Allocated").should("be.visible");
    });
  });

  describe("Advance Payment Refunds", () => {
    it("should refund unused advance payment", () => {
      cy.visit("/payments");

      cy.get('button:contains("Process Refund")').click();

      cy.get('input[placeholder*="Amount"]').type("5000");
      cy.get('input[placeholder*="Reason"]').type("Cancelled order");

      cy.get('button:contains("Process Refund")').click();
      cy.contains("Refund processed").should("be.visible");
    });

    it("should track refund status", () => {
      cy.visit("/payments");

      cy.get('button:contains("Refund Status")').click();

      cy.get('[data-testid="refund-row"]').should("have.length.greaterThan", 0);
      cy.contains("Status").should("be.visible");
    });

    it("should post refund to GL", () => {
      cy.visit("/payments");
      cy.get('[data-testid="refund-row"]').first().click();

      cy.get('button:contains("View GL Entries")').click();

      cy.contains("Debit").should("be.visible");
      cy.contains("Credit").should("be.visible");
    });
  });

  describe("Advance Payment Reporting", () => {
    it("should view advance payment summary", () => {
      cy.visit("/reports/advance-payments");

      cy.contains("Advance Payment Summary").should("be.visible");
      cy.contains("Total Advances").should("be.visible");
      cy.contains("Allocated").should("be.visible");
      cy.contains("Unallocated").should("be.visible");
    });

    it("should export advance payment list", () => {
      cy.visit("/payments");

      cy.get('button:contains("Export Advances")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/advance-payments-*.csv").should("exist");
    });
  });
});
