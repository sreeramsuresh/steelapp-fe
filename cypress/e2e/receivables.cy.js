/**
 * Receivables Management E2E Tests
 *
 * Tests accounts receivable operations:
 * - Customer aging analysis
 * - Follow-up management
 * - Write-off procedures
 * - Customer credit limits
 * - Collection workflows
 *
 */

describe("Receivables Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Receivables Analysis", () => {
    it("should view AR aging report", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("AR Aging")').click();

      cy.contains("Current").should("be.visible");
      cy.contains("30-60 Days").should("be.visible");
      cy.contains("60-90 Days").should("be.visible");
      cy.contains("Over 90 Days").should("be.visible");

      cy.get('[data-testid="aging-bucket"]').should("have.length", 4);
    });

    it("should view customer receivables summary", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Customer Summary")').click();

      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);

      // Verify columns
      cy.get('[data-testid="customer-row"]')
        .first()
        .within(() => {
          cy.contains(/\d+/).should("be.visible"); // DSO
          cy.contains(/\d+/).should("be.visible"); // Outstanding
        });
    });

    it("should calculate Days Sales Outstanding (DSO)", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("DSO Analysis")').click();

      cy.get('[data-testid="dso-metric"]').should("contain", /\d+/);
      cy.contains("Company DSO:").should("be.visible");
      cy.contains("Industry Benchmark:").should("be.visible");
    });

    it("should view customer credit utilization", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Credit Utilization")').click();

      cy.get('[data-testid="customer-credit"]').each(($row) => {
        cy.wrap($row).should("contain", "%");
      });
    });
  });

  describe("Follow-up Management", () => {
    it("should create follow-up for overdue invoice", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("AR Aging")').click();

      // Select overdue bucket
      cy.get('[data-testid="aging-bucket"][data-days="90+"]').click();

      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Follow-up")').click();

      cy.get('select[name="Follow-up Type"]').select("REMINDER");
      cy.get('input[placeholder*="Follow-up Date"]').type("2024-01-25");
      cy.get('textarea[placeholder*="Notes"]').type("First collection reminder");

      cy.get('button:contains("Create Follow-up")').click();
      cy.contains("Follow-up created").should("be.visible");
    });

    it("should send payment reminder email", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("AR Aging")').click();

      cy.get('[data-testid="aging-bucket"][data-days="30+"]').click();

      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Send Reminder")').click();

      cy.get('textarea[placeholder*="Message"]').type(
        "Please remit payment for overdue invoice",
      );

      cy.get('button:contains("Send Email")').click();
      cy.contains("Reminder sent").should("be.visible");
    });

    it("should escalate collection case", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("AR Aging")').click();

      cy.get('[data-testid="aging-bucket"][data-days="90+"]').click();

      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Escalate")').click();

      cy.get('select[name="Escalation Level"]').select("LEGAL");
      cy.get('textarea[placeholder*="Reason"]').type("Payment not received after 3 reminders");

      cy.get('button:contains("Escalate Case")').click();
      cy.contains("Case escalated").should("be.visible");
    });

    it("should track follow-up history", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Follow-up History")').click();

      cy.get('[data-testid="followup-record"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Write-off Procedures", () => {
    it("should write-off bad debt", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("AR Aging")').click();

      cy.get('[data-testid="aging-bucket"][data-days="90+"]').click();

      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Write-Off")').click();

      cy.get('select[name="Write-off Reason"]').select("UNCOLLECTIBLE");
      cy.get('textarea[placeholder*="Justification"]').type(
        "Customer bankruptcy declared",
      );

      cy.get('button:contains("Write-Off Invoice")').click();
      cy.contains("Invoice written off").should("be.visible");
    });

    it("should create credit note for write-off", () => {
      cy.visit("/app/receivables");
      cy.get('[data-testid="invoice-row"][data-status="WRITTEN_OFF"]')
        .first()
        .click();

      cy.get('button:contains("Create Credit Note")').click();

      cy.get('button:contains("Create CN")').click();
      cy.contains("Credit note created").should("be.visible");
    });

    it("should recover written-off amount", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Write-off Recovery")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Recovery Amount"]').type("1000");

      cy.get('button:contains("Record Recovery")').click();
      cy.contains("Recovery recorded").should("be.visible");
    });
  });

  describe("Credit Limit Management", () => {
    it("should view customer credit limit", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Credit Limits")').click();

      cy.get('[data-testid="customer-row"]').first().click();

      cy.contains("Credit Limit:").should("be.visible");
      cy.contains("Available Credit:").should("be.visible");
      cy.contains("Outstanding:").should("be.visible");
    });

    it("should update customer credit limit", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Credit Limits")').click();

      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Modify Limit")').click();

      cy.get('input[placeholder*="New Limit"]').clear().type("75000");
      cy.get('textarea[placeholder*="Reason"]').type("Improved payment history");

      cy.get('button:contains("Update Limit")').click();
      cy.contains("Credit limit updated").should("be.visible");
    });

    it("should alert on credit limit exceeded", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Credit Alerts")').click();

      cy.get('[data-testid="alert-row"][data-alert-type="CREDIT_EXCEEDED"]').should(
        "have.length.greaterThan",
        0,
      );
    });

    it("should freeze account for credit limit breach", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Credit Alerts")').click();

      cy.get('[data-testid="alert-row"][data-alert-type="CREDIT_EXCEEDED"]')
        .first()
        .click();

      cy.get('button:contains("Freeze Account")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Credit limit exceeded");

      cy.get('button:contains("Confirm Freeze")').click();
      cy.contains("Account frozen").should("be.visible");
    });
  });

  describe("Receivables Reconciliation", () => {
    it("should reconcile receivables ledger", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Reconcile")').click();

      cy.get('input[placeholder*="Reconciliation Date"]').type("2024-01-31");

      cy.get('button:contains("Generate Reconciliation")').click();

      cy.contains("General Ledger Balance:").should("be.visible");
      cy.contains("Subledger Balance:").should("be.visible");
    });

    it("should identify reconciliation variance", () => {
      cy.visit("/app/receivables");

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

  describe("Customer Communication", () => {
    it("should generate customer statement", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Customer Statements")').click();

      cy.get('input[placeholder*="Select Customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-01-31");

      cy.get('button:contains("Generate Statement")').click();

      cy.contains("Statement Generated").should("be.visible");
    });

    it("should email customer statement", () => {
      cy.visit("/app/receivables");
      cy.get('button:contains("Customer Statements")').click();

      cy.get('input[placeholder*="Select Customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Generate Statement")').click();

      cy.get('button:contains("Email Statement")').click();

      cy.get('button:contains("Send")').click();
      cy.contains("Statement sent").should("be.visible");
    });
  });

  describe("Receivables Analytics", () => {
    it("should view receivables trends", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total AR:").should("be.visible");
      cy.contains("Average Invoice Age:").should("be.visible");
      cy.contains("Collection Rate:").should("be.visible");
    });

    it("should compare customer payment performance", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Customer Comparison")').click();

      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should export AR aging report", () => {
      cy.visit("/app/receivables");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/ar-aging-*.pdf").should("exist");
    });
  });
});
