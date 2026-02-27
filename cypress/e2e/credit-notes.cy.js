/**
 * Credit Notes E2E Tests
 *
 * Tests credit note workflows:
 * - Credit note creation from invoice
 * - Partial and full credit adjustments
 * - Credit note approval and posting
 * - VAT reversal on credits
 * - Stock return tracking
 *
 */

describe("Credit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Credit Note Creation", () => {
    it("should create credit note from invoice", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Credit Note")').click();

      cy.contains("Credit Note").should("be.visible");
      cy.contains("Reference Invoice").should("have.value", /INV-/);
    });

    it("should apply full credit", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Credit Note")').click();

      cy.get('input[placeholder*="Reason"]').type("Goods returned");
      cy.get('checkbox[name="full-credit"]').check();

      cy.get('button:contains("Create Credit Note")').click();
      cy.contains("Credit note created").should("be.visible");
    });

    it("should apply partial credit", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Credit Note")').click();

      cy.get('input[placeholder*="Reason"]').type("Partial return");
      cy.get('checkbox[name="full-credit"]').uncheck();

      cy.get('button:contains("Add Line")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("50");

      cy.get('button:contains("Create Credit Note")').click();
      cy.contains("Credit note created").should("be.visible");
    });

    it("should select credit reason", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Credit Note")').click();

      cy.get('select[name="Reason"]').select("GOODS_RETURNED");

      cy.contains("Reason selected").should("be.visible");
    });
  });

  describe("Credit Note Approval", () => {
    it("should submit credit note for approval", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Submit for Approval")').click();

      cy.contains("Submitted").should("be.visible");
    });

    it("should approve credit note", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Approve")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Credit note approved").should("be.visible");
    });

    it("should reject credit note", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Missing documentation");
      cy.get('button:contains("Confirm")').click();
      cy.contains("Credit note rejected").should("be.visible");
    });
  });

  describe("Credit Note Posting & Accounting", () => {
    it("should post approved credit note", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"][data-status="APPROVED"]').first().click();

      cy.get('button:contains("Post")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Credit note posted").should("be.visible");
    });

    it("should reverse VAT on credit", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"]').first().click();

      cy.contains("VAT Reversal").should("be.visible");
      cy.contains("Original VAT").should("be.visible");
      cy.contains("Reversed VAT").should("be.visible");
    });

    it("should update customer balance on credit", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"]').first().click();

      cy.get('button:contains("Post")').click();
      cy.get('button:contains("Confirm")').click();

      cy.visit("/app/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.contains("Outstanding Balance").should("be.visible");
    });

    it("should create GL entries for credit", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"]').first().click();

      cy.get('button:contains("View GL Entries")').click();

      cy.contains("Debit").should("be.visible");
      cy.contains("Credit").should("be.visible");
    });
  });

  describe("Stock Return Tracking", () => {
    it("should track returned stock in credit note", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"]').first().click();

      cy.contains("Returned Items").should("be.visible");
      cy.get('[data-testid="line-row"]').should("have.length.greaterThan", 0);
    });

    it("should create return receipt for credit", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"]').first().click();

      cy.get('button:contains("Create Return Receipt")').click();

      cy.contains("Return receipt created").should("be.visible");
    });

    it("should update stock on return receipt", () => {
      cy.visit("/app/credit-notes");
      cy.get('[data-testid="credit-note-row"]').first().click();

      cy.get('button:contains("Create Return Receipt")').click();
      cy.get('button:contains("Post Return")').click();

      cy.visit("/app/inventory");
      cy.get('[data-testid="batch-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Credit Note Listing & Search", () => {
    it("should list credit notes", () => {
      cy.visit("/app/credit-notes");

      cy.get('[data-testid="credit-note-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter credit notes by status", () => {
      cy.visit("/app/credit-notes");

      cy.get('select[name="Status"]').select("APPROVED");

      cy.get('[data-testid="credit-note-row"]').should("have.length.greaterThan", 0);
    });

    it("should export credit notes", () => {
      cy.visit("/app/credit-notes");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/credit-notes-*.csv").should("exist");
    });
  });
});
