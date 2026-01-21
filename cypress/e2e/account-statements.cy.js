/**
 * Account Statements E2E Tests
 *
 * Tests customer/supplier account statements:
 * - Statement generation by period
 * - Transaction listing and aging
 * - Balance certification
 * - Statement delivery via email
 * - Archive and history tracking
 *
 * Run: npm run test:e2e -- --spec "**/account-statements.cy.js"
 */

describe("Account Statements - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Customer Statement Generation", () => {
    it("should generate customer statement", () => {
      cy.visit("/reports/account-statements");

      cy.get('button:contains("Generate Statement")').click();

      cy.get('select[name="Account Type"]').select("CUSTOMER");
      cy.get('input[placeholder*="Customer"]').type("ABC");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-01-31");

      cy.get('button:contains("Generate")').click();
      cy.contains("Statement generated").should("be.visible");
    });

    it("should show opening balance on statement", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.contains("Opening Balance").should("be.visible");
      cy.contains("Transactions").should("be.visible");
      cy.contains("Closing Balance").should("be.visible");
    });

    it("should detail invoices on statement", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.get('[data-testid="transaction-row"]').should("have.length.greaterThan", 0);
      cy.contains("Invoice").should("be.visible");
      cy.contains("Amount").should("be.visible");
    });

    it("should detail payments on statement", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.contains("Payment").should("be.visible");
      cy.contains("Receipt").should("be.visible");
    });
  });

  describe("Supplier Statement Generation", () => {
    it("should generate supplier statement", () => {
      cy.visit("/reports/account-statements");

      cy.get('button:contains("Generate Statement")').click();

      cy.get('select[name="Account Type"]').select("SUPPLIER");
      cy.get('input[placeholder*="Supplier"]').type("Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Generate")').click();
      cy.contains("Statement generated").should("be.visible");
    });

    it("should show payables on supplier statement", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"][data-type="SUPPLIER"]').first().click();

      cy.contains("Opening Balance").should("be.visible");
      cy.contains("Bills").should("be.visible");
      cy.contains("Payments").should("be.visible");
    });
  });

  describe("Statement Aging Analysis", () => {
    it("should show aged balance breakdown", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.contains("Aging Analysis").should("be.visible");
      cy.contains("Current").should("be.visible");
      cy.contains("30+ Days").should("be.visible");
      cy.contains("60+ Days").should("be.visible");
      cy.contains("90+ Days").should("be.visible");
    });

    it("should calculate days overdue", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.contains("Days Overdue").should("be.visible");
    });
  });

  describe("Statement Delivery", () => {
    it("should email statement to customer", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.get('button:contains("Email Statement")').click();

      cy.get('input[placeholder*="Email"]').should("have.value", /.+@.+/);

      cy.get('button:contains("Send")').click();
      cy.contains("Statement sent").should("be.visible");
    });

    it("should download statement PDF", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.get('button:contains("Download PDF")').click();

      cy.readFile("cypress/downloads/statement-*.pdf").should("exist");
    });

    it("should export statement data", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("EXCEL");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/statement-*.xlsx").should("exist");
    });
  });

  describe("Statement Archive & History", () => {
    it("should archive statement", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.get('button:contains("Archive")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Statement archived").should("be.visible");
    });

    it("should view statement history", () => {
      cy.visit("/reports/account-statements");

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="statement-row"]').should("have.length.greaterThan", 0);
    });

    it("should compare statements across periods", () => {
      cy.visit("/reports/account-statements");

      cy.get('button:contains("Compare")').click();

      cy.get('select[name="Period 1"]').select("January 2024");
      cy.get('select[name="Period 2"]').select("February 2024");

      cy.get('button:contains("Compare")').click();
      cy.contains("Comparison").should("be.visible");
    });
  });

  describe("Statement Reconciliation", () => {
    it("should certify statement balance", () => {
      cy.visit("/reports/account-statements");
      cy.get('[data-testid="statement-row"]').first().click();

      cy.get('button:contains("Certify")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Statement certified").should("be.visible");
    });

    it("should track statement confirmations", () => {
      cy.visit("/reports/account-statements");

      cy.get('button:contains("Confirmations")').click();

      cy.get('[data-testid="confirmation-row"]').should("have.length.greaterThan", 0);
    });
  });
});
