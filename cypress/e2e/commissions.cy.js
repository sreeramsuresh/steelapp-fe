/**
 * Commissions Management E2E Tests
 *
 * Tests commission calculation and payouts:
 * - Commission structure setup
 * - Calculation and eligibility
 * - Commission approval workflows
 * - Payment processing
 * - Commission reports
 *
 */

describe("Commissions Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Commission Calculation", () => {
    it("should calculate tiered commissions", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Calculate Commissions")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-01-31");

      cy.get('button:contains("Calculate")').click();

      cy.contains("Commission calculated").should("be.visible");

      // Verify results
      cy.get('[data-testid="commission-row"]').should("have.length.greaterThan", 0);
    });

    it("should apply commission rate overrides", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Calculate Commissions")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-01-31");

      // Set override for specific salesperson
      cy.get('button:contains("Add Override")').click();

      cy.get('input[placeholder*="Salesperson"]').type("John Sales");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Commission %"]').type("8");
      cy.get('textarea[placeholder*="Reason"]').type("Top performer bonus");

      cy.get('button:contains("Apply Override")').click();

      cy.get('button:contains("Calculate")').click();
      cy.contains("Commission calculated with overrides").should("be.visible");
    });

    it("should handle deductions from commissions", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Calculate Commissions")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-01-31");

      cy.get('button:contains("Add Deduction")').click();

      cy.get('input[placeholder*="Salesperson"]').type("John Sales");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Deduction Amount"]').type("500");
      cy.get('select[name="Deduction Type"]').select("ADVANCE");

      cy.get('button:contains("Add Deduction")').click();

      cy.get('button:contains("Calculate")').click();
      cy.contains("Commission calculated with deductions").should("be.visible");
    });
  });

  describe("Commission Eligibility", () => {
    it("should verify commission eligibility", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Eligibility Check")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-01-31");

      cy.get('button:contains("Check Eligibility")').click();

      cy.contains("Eligible").should("be.visible");
      cy.contains("Not Eligible").should("be.visible");
    });

    it("should identify ineligible transactions", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Eligibility Check")').click();

      cy.get('input[placeholder*="Period Start"]').type("2024-01-01");
      cy.get('input[placeholder*="Period End"]').type("2024-01-31");

      cy.get('button:contains("Check Eligibility")').click();

      cy.get('[data-testid="ineligible-row"]').each(($row) => {
        cy.wrap($row).should("contain", "Reason");
      });
    });

    it("should exclude transactions by criteria", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Eligibility Rules")').click();

      cy.get('button:contains("Add Rule")').click();

      cy.get('select[name="Criteria"]').select("DISCOUNT_PERCENTAGE");
      cy.get('input[placeholder*="Threshold"]').type("15");

      cy.get('button:contains("Save Rule")').click();
      cy.contains("Rule added").should("be.visible");
    });
  });

  describe("Commission Approval Workflow", () => {
    it("should submit commissions for approval", () => {
      cy.visit("/app/my-commissions");
      cy.get('[data-testid="commission-batch"]').first().click();

      cy.get('button:contains("Submit for Approval")').click();

      cy.get('textarea[placeholder*="Notes"]').type("Commissions for Jan 2024");

      cy.get('button:contains("Submit")').click();
      cy.contains("Submitted for approval").should("be.visible");
    });

    it("should approve commission batch", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Pending Approval")').click();

      cy.get('[data-testid="commission-batch"]').first().click();

      cy.get('button:contains("Approve")').click();

      cy.get('textarea[placeholder*="Approval Notes"]').type("Approved");

      cy.get('button:contains("Confirm Approval")').click();
      cy.contains("Commissions approved").should("be.visible");
    });

    it("should reject commissions with reason", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Pending Approval")').click();

      cy.get('[data-testid="commission-batch"]').first().click();

      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Rejection Reason"]').type(
        "Recalculate with correct rates",
      );

      cy.get('button:contains("Reject")').click();
      cy.contains("Commissions rejected").should("be.visible");
    });

    it("should request revisions to commissions", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Pending Approval")').click();

      cy.get('[data-testid="commission-batch"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Request Revision")').click();

      cy.get('textarea[placeholder*="Revision Notes"]').type(
        "Review high-value transactions",
      );

      cy.get('button:contains("Request")').click();
      cy.contains("Revision requested").should("be.visible");
    });
  });

  describe("Commission Payouts", () => {
    it("should generate commission payment proposal", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Approved Commissions")').click();

      cy.get('[data-testid="commission-batch"]').first().click();

      cy.get('button:contains("Generate Payout")').click();

      cy.get('button:contains("Create Payroll")').click();
      cy.contains("Payout created").should("be.visible");
    });

    it("should process commission payment", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Pending Payouts")').click();

      cy.get('[data-testid="payout-row"]').first().click();

      cy.get('button:contains("Process Payment")').click();

      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Effective Date"]').type("2024-02-01");

      cy.get('button:contains("Process")').click();
      cy.contains("Payment processed").should("be.visible");
    });

    it("should track commission payout status", () => {
      cy.visit("/app/my-commissions");
      cy.get('button:contains("Payout Status")').click();

      cy.get('[data-testid="payout-row"]').should("have.length.greaterThan", 0);

      // Verify status column
      cy.get('[data-testid="payout-row"]')
        .first()
        .within(() => {
          cy.contains(/PENDING|PAID|CANCELLED/).should("be.visible");
        });
    });
  });

  describe("Commission Adjustments", () => {
    it("should record commission reversal", () => {
      cy.visit("/app/my-commissions");
      cy.get('[data-testid="commission-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Reverse")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Invoice cancelled");

      cy.get('button:contains("Reverse Commission")').click();
      cy.contains("Commission reversed").should("be.visible");
    });

    it("should record commission adjustment", () => {
      cy.visit("/app/my-commissions");
      cy.get('[data-testid="commission-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Adjust")').click();

      cy.get('input[placeholder*="Adjustment Amount"]').type("250");
      cy.get('textarea[placeholder*="Reason"]').type("Performance bonus");

      cy.get('button:contains("Record Adjustment")').click();
      cy.contains("Adjustment recorded").should("be.visible");
    });

    it("should handle commission disputes", () => {
      cy.visit("/app/my-commissions");
      cy.get('[data-testid="commission-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Dispute")').click();

      cy.get('textarea[placeholder*="Dispute Details"]').type(
        "Incorrect calculation",
      );

      cy.get('button:contains("File Dispute")').click();
      cy.contains("Dispute recorded").should("be.visible");
    });
  });

  describe("Commission Analytics", () => {
    it("should view commission metrics", () => {
      cy.visit("/app/my-commissions");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Commissions:").should("be.visible");
      cy.contains("Average Commission:").should("be.visible");
      cy.contains("Commission Rate %:").should("be.visible");
    });

    it("should compare salesperson performance", () => {
      cy.visit("/app/my-commissions");

      cy.get('button:contains("Salesperson Performance")').click();

      cy.get('[data-testid="salesperson-row"]').should("have.length.greaterThan", 0);

      // Verify columns
      cy.get('[data-testid="salesperson-row"]')
        .first()
        .within(() => {
          cy.contains(/\d+/).should("be.visible"); // Sales
          cy.contains(/\d+/).should("be.visible"); // Commission
        });
    });

    it("should export commission report", () => {
      cy.visit("/app/my-commissions");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/commissions-*.csv").should("exist");
    });
  });

  describe("Commission Audit Trail", () => {
    it("should view commission history", () => {
      cy.visit("/app/my-commissions");
      cy.get('[data-testid="commission-row"]').first().click();

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="history-record"]').should("have.length.greaterThan", 0);
    });

    it("should view all commission changes", () => {
      cy.visit("/app/my-commissions");

      cy.get('button:contains("Audit Log")').click();

      cy.get('[data-testid="audit-entry"]').should("have.length.greaterThan", 0);
    });
  });
});
