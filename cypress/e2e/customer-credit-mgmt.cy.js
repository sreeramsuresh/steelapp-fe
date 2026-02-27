/**
 * Customer Credit Management E2E Tests
 *
 * Tests customer credit limit and control:
 * - Credit limit setup and modification
 * - Credit utilization tracking
 * - Approval workflows for credit overages
 * - Credit suspension and restoration
 * - Credit history and aging
 *
 * Run: npm run test:e2e -- --spec '**/customer-credit-mgmt.cy.js'
 */

describe("Customer Credit Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Credit Limit Management", () => {
    it("should set customer credit limit", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Credit Limit"]').type("100000");

      cy.get('button:contains("Save")').click();
      cy.contains("Credit limit updated").should("be.visible");
    });

    it("should modify credit limit", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit Credit")').click();

      cy.get('input[placeholder*="New Limit"]').type("150000");
      cy.get('textarea[placeholder*="Reason"]').type("Customer expansion");

      cy.get('button:contains("Update")').click();
      cy.contains("Credit limit updated").should("be.visible");
    });

    it("should set credit terms", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('select[name="Credit Terms"]').select("NET 30");

      cy.get('button:contains("Save")').click();
      cy.contains("Terms updated").should("be.visible");
    });
  });

  describe("Credit Utilization", () => {
    it("should track credit utilization", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.contains("Credit Limit").should("be.visible");
      cy.contains("Used").should("be.visible");
      cy.contains("Available").should("be.visible");
      cy.contains("Utilization %").should("be.visible");
    });

    it("should warn when approaching limit", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("High Value");

      cy.contains("Credit limit warning").should("be.visible");
    });

    it("should prevent exceeding credit limit without approval", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      // Add items exceeding limit
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Quantity"]').type("Exceeds");

      cy.get('button:contains("Create")').click();

      cy.contains("Credit limit exceeded").should("be.visible");
      cy.contains("Approval required").should("be.visible");
    });
  });

  describe("Credit Overage Approval", () => {
    it("should submit credit overage for approval", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"][data-exceeds-credit="true"]').first().click();

      cy.get('button:contains("Request Credit Approval")').click();

      cy.get('button:contains("Submit")').click();
      cy.contains("Approval requested").should("be.visible");
    });

    it("should approve credit overage", () => {
      cy.visit("/approvals/credit-overages");
      cy.get('[data-testid="approval-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Approve")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Approved").should("be.visible");
    });

    it("should reject credit overage", () => {
      cy.visit("/approvals/credit-overages");
      cy.get('[data-testid="approval-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Insufficient creditworthiness");
      cy.get('button:contains("Reject")').click();
      cy.contains("Rejected").should("be.visible");
    });
  });

  describe("Credit Suspension & Restoration", () => {
    it("should suspend customer credit for non-payment", () => {
      cy.visit("/receivables");
      cy.get('[data-testid="invoice-row"][data-days-overdue=">90"]').first().click();

      cy.get('button:contains("Suspend Credit")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Excessive overdue invoices");
      cy.get('button:contains("Suspend")').click();
      cy.contains("Credit suspended").should("be.visible");
    });

    it("should track suspension period", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"][data-credit-status="SUSPENDED"]').first().click();

      cy.contains("Suspension Date").should("be.visible");
      cy.contains("Suspension Reason").should("be.visible");
    });

    it("should restore credit after payment", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"][data-credit-status="SUSPENDED"]').first().click();

      cy.get('button:contains("Restore Credit")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Credit restored").should("be.visible");
    });

    it("should prevent transactions during suspension", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Suspended Customer");
      cy.get('[role="option"]').first().click();

      cy.contains("Customer credit suspended").should("be.visible");
      cy.get('button:contains("Create")').should("be.disabled");
    });
  });

  describe("Credit History & Aging", () => {
    it("should view credit history", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Credit History")').click();

      cy.get('[data-testid="history-row"]').should("have.length.greaterThan", 0);
    });

    it("should show credit aging", () => {
      cy.visit("/reports/credit-aging");

      cy.contains("Credit Aging Report").should("be.visible");
      cy.contains("Current").should("be.visible");
      cy.contains("30+ Days").should("be.visible");
      cy.contains("60+ Days").should("be.visible");
      cy.contains("90+ Days").should("be.visible");
    });

    it("should track limit changes", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Credit History")').click();

      cy.contains("Limit Change").should("be.visible");
      cy.contains("From").should("be.visible");
      cy.contains("To").should("be.visible");
    });
  });

  describe("Credit Reporting", () => {
    it("should view customer credit summary", () => {
      cy.visit("/reports/customer-credit");

      cy.contains("Customer Credit Report").should("be.visible");
      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should identify at-risk customers", () => {
      cy.visit("/reports/credit-at-risk");

      cy.contains("At-Risk Customers").should("be.visible");
      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should export credit report", () => {
      cy.visit("/reports/customer-credit");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/credit-report-*.csv").should("exist");
    });
  });
});
