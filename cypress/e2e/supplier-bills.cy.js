/**
 * Supplier Bills E2E Tests
 *
 * Tests supplier invoice/bill lifecycle:
 * - Create supplier bills
 * - Match with PO/GRN
 * - Three-way matching
 * - Payment reconciliation
 * - Credit/debit notes
 *
 */

describe("Supplier Bills - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Supplier Bills", () => {
    it("should create supplier bill manually", () => {
      cy.visit("/app/supplier-bills");
      cy.get('button:contains("Create Bill")').click();

      // Select supplier
      cy.get('input[placeholder*="Select supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      // Set invoice details
      cy.get('input[placeholder*="Invoice Number"]').type("SINV-001");
      cy.get('input[placeholder*="Invoice Date"]').type("2024-01-15");

      // Add line item
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Description"]').type("Materials");
      cy.get('input[placeholder*="Amount"]').type("5000");

      // Submit
      cy.get('button:contains("Create Bill")').click();
      cy.contains("Supplier bill created").should("be.visible");
    });

    it("should create bill from GRN", () => {
      cy.visit("/app/supplier-bills");
      cy.get('button:contains("Create from GRN")').click();

      // Select GRN
      cy.get('input[placeholder*="Select GRN"]').type("GRN-");
      cy.get('[role="option"]').first().click();

      // Prefilled data
      cy.get('input[placeholder*="Supplier"]').should("have.value");
      cy.get('[data-testid="bill-line-item"]').should("have.length.greaterThan", 0);

      // Set invoice details
      cy.get('input[placeholder*="Invoice Number"]').type("SINV-001");
      cy.get('input[placeholder*="Invoice Date"]').type("2024-01-15");

      cy.get('button:contains("Create Bill")').click();
      cy.contains("Bill created from GRN").should("be.visible");
    });

    it("should create bill with VAT", () => {
      cy.visit("/app/supplier-bills");
      cy.get('button:contains("Create Bill")').click();

      cy.get('input[placeholder*="Select supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Invoice Number"]').type("SINV-001");
      cy.get('input[placeholder*="Invoice Date"]').type("2024-01-15");

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Description"]').type("Materials");
      cy.get('input[placeholder*="Amount"]').type("5000");

      // Add VAT
      cy.get('input[placeholder*="VAT Rate"]').type("5");

      cy.get('button:contains("Create Bill")').click();
      cy.contains("Bill created").should("be.visible");
    });
  });

  describe("Bill Matching", () => {
    it("should match bill with PO (two-way match)", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Match with PO")').click();

      // Select PO
      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Match")').click();
      cy.contains("Bill matched with PO").should("be.visible");
    });

    it("should perform three-way matching (PO-GRN-Bill)", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Three-Way Match")').click();

      // Select PO
      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      // Select GRN
      cy.get('input[placeholder*="Select GRN"]').type("GRN-");
      cy.get('[role="option"]').first().click();

      // Verify match
      cy.contains("PO Qty:").should("be.visible");
      cy.contains("GRN Qty:").should("be.visible");
      cy.contains("Bill Qty:").should("be.visible");

      cy.get('button:contains("Confirm Match")').click();
      cy.contains("Three-way match successful").should("be.visible");
    });

    it("should handle matching variance", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Three-Way Match")').click();

      cy.get('input[placeholder*="Select PO"]').type("PO-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Select GRN"]').type("GRN-");
      cy.get('[role="option"]').first().click();

      // Check for variance (may trigger tolerance check)
      cy.get('button:contains("Confirm Match")').click();

      // May show variance or proceed depending on tolerance
      cy.get("body").then(($body) => {
        if ($body.text().includes("Variance detected")) {
          cy.contains("Accept variance").should("be.visible");
        }
      });
    });
  });

  describe("Bill Approval", () => {
    it("should submit bill for approval", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Submit for Approval")').click();
      cy.contains("Bill submitted").should("be.visible");
    });

    it("should approve supplier bill", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="PENDING_APPROVAL"]')
        .first()
        .click();

      cy.get('button:contains("Approve")').click();
      cy.get('textarea[placeholder*="Comments"]').type("Approved");
      cy.get('button:contains("Confirm Approval")').click();

      cy.contains("Bill approved").should("be.visible");
    });

    it("should reject bill with reason", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="PENDING_APPROVAL"]')
        .first()
        .click();

      cy.get('button:contains("Reject")').click();
      cy.get('textarea[placeholder*="Rejection Reason"]').type(
        "Invoice discrepancy",
      );
      cy.get('button:contains("Reject Bill")').click();

      cy.contains("Bill rejected").should("be.visible");
    });
  });

  describe("Bill Adjustments", () => {
    it("should add debit note to bill", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Add Debit Note")').click();

      cy.get('input[placeholder*="Amount"]').type("500");
      cy.get('textarea[placeholder*="Reason"]').type("Additional charges");

      cy.get('button:contains("Add")').click();
      cy.contains("Debit note added").should("be.visible");
    });

    it("should apply credit note to bill", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Add Credit Note")').click();

      cy.get('input[placeholder*="Amount"]').type("200");
      cy.get('textarea[placeholder*="Reason"]').type("Damaged goods return");

      cy.get('button:contains("Apply")').click();
      cy.contains("Credit note applied").should("be.visible");
    });

    it("should adjust bill line item", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Amount"]').first().clear().type("4500");

      cy.get('button:contains("Save")').click();
      cy.contains("Bill updated").should("be.visible");
    });
  });

  describe("Payment Processing", () => {
    it("should record partial payment against bill", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Record Payment")').click();

      cy.get('input[placeholder*="Payment Amount"]').type("2500");
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Reference"]').type("TXN-12345");

      cy.get('button:contains("Record")').click();
      cy.contains("Payment recorded").should("be.visible");

      // Verify outstanding amount
      cy.contains("Outstanding:").should("be.visible");
    });

    it("should record full payment and mark as paid", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="APPROVED"]')
        .first()
        .click();

      // Get total amount
      cy.contains(/Total:\s+\d+/).then(($el) => {
        const totalText = $el.text();
        const total = parseFloat(totalText.match(/\d+/)[0]);

        cy.get('button:contains("Record Payment")').click();
        cy.get('input[placeholder*="Payment Amount"]').type(total.toString());
        cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");

        cy.get('button:contains("Record")').click();
        cy.contains("Bill marked as paid").should("be.visible");
      });
    });

    it("should record advance payment allocation", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Allocate Advance")').click();

      cy.get('input[placeholder*="Advance Amount"]').type("1000");

      cy.get('button:contains("Allocate")').click();
      cy.contains("Advance allocated").should("be.visible");
    });
  });

  describe("Bill Analytics", () => {
    it("should view supplier payment performance", () => {
      cy.visit("/app/supplier-bills");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Bills").should("be.visible");
      cy.contains("Average Payment Days").should("be.visible");
      cy.contains("On-Time Payment Rate").should("be.visible");
    });

    it("should filter bills by supplier", () => {
      cy.visit("/app/supplier-bills");

      cy.get('input[placeholder*="Supplier"]').type("Test Supplier");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="bill-row"]').each(($row) => {
        cy.wrap($row).contains("Test Supplier");
      });
    });

    it("should filter bills by status", () => {
      cy.visit("/app/supplier-bills");

      cy.get('select[name="Status"]').select("PAID");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="bill-row"]').each(($row) => {
        cy.wrap($row).should("have.attr", "data-status", "PAID");
      });
    });
  });

  describe("Bill Printing & Export", () => {
    it("should download bill as PDF", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"]').first().click();

      cy.get('button:contains("Download PDF")').click();

      cy.readFile("cypress/downloads/bill-*.pdf").should("exist");
    });

    it("should export bills to accounting", () => {
      cy.visit("/app/supplier-bills");
      cy.get('[data-testid="bill-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Export to Accounting")').click();

      cy.get('select[name="System"]').select("QUICKBOOKS");
      cy.get('button:contains("Export")').click();

      cy.contains("Bill exported").should("be.visible");
    });
  });
});
