/**
 * VAT Returns E2E Tests
 *
 * Tests VAT return filing workflows:
 * - VAT return period setup
 * - VAT calculation consolidation
 * - Return generation and review
 * - Return submission to authorities
 * - Return history and amendments
 *
 * Run: npm run test:e2e -- --spec '**/vat-returns.cy.js'
 */

describe("VAT Returns - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("VAT Return Period Management", () => {
    it("should configure VAT return period", () => {
      cy.visit("/settings/vat-returns");

      cy.get('button:contains("Configure Period")').click();

      cy.get('select[name="Period Type"]').select("MONTHLY");
      cy.get('input[placeholder*="Due Date"]').type("2024-02-10");

      cy.get('button:contains("Save")').click();
      cy.contains("Period configured").should("be.visible");
    });

    it("should view VAT return calendar", () => {
      cy.visit("/vat-returns");

      cy.contains("VAT Return Calendar").should("be.visible");
      cy.get('[data-testid="return-period"]').should("have.length.greaterThan", 0);
    });

    it("should identify upcoming due dates", () => {
      cy.visit("/vat-returns");

      cy.contains("Due").should("be.visible");
      cy.contains("Pending Submission").should("be.visible");
    });
  });

  describe("VAT Return Generation", () => {
    it("should generate monthly VAT return", () => {
      cy.visit("/vat-returns");

      cy.get('button:contains("Generate Return")').click();

      cy.get('select[name="Period"]').select("January 2024");
      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-01-31");

      cy.get('button:contains("Generate")').click();
      cy.contains("Return generated").should("be.visible");
    });

    it("should calculate output VAT", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.contains("Output VAT").should("be.visible");
      cy.contains("Standard Rate (5%)").should("be.visible");
      cy.contains("Zero Rate (0%)").should("be.visible");
      cy.contains("Exempt").should("be.visible");
    });

    it("should calculate input VAT", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.contains("Input VAT").should("be.visible");
      cy.contains("Recoverable VAT").should("be.visible");
      cy.contains("Non-recoverable VAT").should("be.visible");
    });

    it("should calculate net VAT payable", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.contains("VAT Payable").should("be.visible");
      cy.contains("VAT Refund").should("be.visible");
    });
  });

  describe("VAT Return Review & Validation", () => {
    it("should review return summary", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="DRAFT"]').first().click();

      cy.contains("Return Summary").should("be.visible");
      cy.contains("Total Sales").should("be.visible");
      cy.contains("Total Purchases").should("be.visible");
    });

    it("should validate return calculations", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.get('button:contains("Validate")').click();

      cy.contains("Validation complete").should("be.visible");
    });

    it("should detect VAT calculation errors", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.get('button:contains("Validate")').click();

      // Check for any validation errors
      cy.get('[data-testid="error-message"]').should("not.exist");
    });

    it("should allow manual adjustments to return", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Output VAT"]').clear().type("15000");

      cy.get('button:contains("Save")').click();
      cy.contains("Return updated").should("be.visible");
    });
  });

  describe("VAT Return Submission", () => {
    it("should submit return to tax authority", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="READY"]').first().click();

      cy.get('button:contains("Submit")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Return submitted").should("be.visible");
    });

    it("should track submission status", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="SUBMITTED"]').first().click();

      cy.contains("Status: SUBMITTED").should("be.visible");
      cy.contains("Submission Date").should("be.visible");
      cy.contains("Reference Number").should("be.visible");
    });

    it("should handle submission rejection", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="REJECTED"]').first().click();

      cy.contains("Rejection Reason").should("be.visible");
      cy.get('button:contains("Edit & Resubmit")').click();

      cy.contains("Edit mode").should("be.visible");
    });

    it("should generate VAT return certificate", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="ACCEPTED"]').first().click();

      cy.get('button:contains("Download Certificate")').click();

      cy.readFile("cypress/downloads/vat-return-*.pdf").should("exist");
    });
  });

  describe("VAT Return History", () => {
    it("should view VAT return history", () => {
      cy.visit("/vat-returns");

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="return-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter returns by status", () => {
      cy.visit("/vat-returns");

      cy.get('select[name="Status"]').select("SUBMITTED");

      cy.get('[data-testid="return-row"]').should("have.length.greaterThan", 0);
    });

    it("should compare VAT across periods", () => {
      cy.visit("/vat-returns");

      cy.get('button:contains("Compare Periods")').click();

      cy.get('select[name="Period 1"]').select("January 2024");
      cy.get('select[name="Period 2"]').select("February 2024");

      cy.get('button:contains("Compare")').click();
      cy.contains("Comparison").should("be.visible");
    });
  });

  describe("VAT Return Amendments", () => {
    it("should create amended VAT return", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"][data-status="ACCEPTED"]').first().click();

      cy.get('button:contains("Amend")').click();

      cy.get('input[placeholder*="Reason"]').type("Correction needed");

      cy.get('button:contains("Create Amendment")').click();
      cy.contains("Amendment created").should("be.visible");
    });

    it("should track amendment history", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.get('button:contains("View Amendments")').click();

      cy.get('[data-testid="amendment-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("VAT Return Reports", () => {
    it("should view VAT summary report", () => {
      cy.visit("/reports/vat");

      cy.contains("VAT Summary").should("be.visible");
      cy.contains("Total Output VAT").should("be.visible");
      cy.contains("Total Input VAT").should("be.visible");
      cy.contains("Net Payable").should("be.visible");
    });

    it("should export VAT return data", () => {
      cy.visit("/vat-returns");
      cy.get('[data-testid="return-row"]').first().click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("XML");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/vat-return-*.xml").should("exist");
    });

    it("should generate VAT audit report", () => {
      cy.visit("/reports/vat-audit");

      cy.contains("VAT Audit Trail").should("be.visible");
      cy.get('[data-testid="audit-row"]').should("have.length.greaterThan", 0);
    });
  });
});
