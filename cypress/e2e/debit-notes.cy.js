/**
 * Debit Notes E2E Tests
 *
 * Tests debit note workflows:
 * - Debit note creation for additional charges
 * - Debit note approval and posting
 * - VAT addition on debits
 * - Customer balance adjustment
 * - GL entry creation
 *
 */

describe("Debit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Debit Note Creation", () => {
    it("should create debit note from invoice", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Debit Note")').click();

      cy.contains("Debit Note").should("be.visible");
      cy.contains("Reference Invoice").should("have.value", /INV-/);
    });

    it("should add debit charge for extra items", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Debit Note")').click();

      cy.get('input[placeholder*="Reason"]').type("Additional items supplied");

      cy.get('button:contains("Add Line")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      cy.get('button:contains("Create Debit Note")').click();
      cy.contains("Debit note created").should("be.visible");
    });

    it("should add debit for services/freight", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Debit Note")').click();

      cy.get('input[placeholder*="Reason"]').type("Additional freight charges");
      cy.get('select[name="Reason"]').select("ADDITIONAL_CHARGES");

      cy.get('button:contains("Add Line")').click();
      cy.get('input[placeholder*="Description"]').type("Freight surcharge");
      cy.get('input[placeholder*="Amount"]').type("500");

      cy.get('button:contains("Create Debit Note")').click();
      cy.contains("Debit note created").should("be.visible");
    });

    it("should select debit reason", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Create Debit Note")').click();

      cy.get('select[name="Reason"]').select("PRICE_ADJUSTMENT");

      cy.contains("Reason selected").should("be.visible");
    });
  });

  describe("Debit Note Approval", () => {
    it("should submit debit note for approval", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Submit for Approval")').click();

      cy.contains("Submitted").should("be.visible");
    });

    it("should approve debit note", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Approve")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Debit note approved").should("be.visible");
    });

    it("should reject debit note", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"][data-status="PENDING"]').first().click();

      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Incorrect calculation");
      cy.get('button:contains("Confirm")').click();
      cy.contains("Debit note rejected").should("be.visible");
    });
  });

  describe("Debit Note Posting & Accounting", () => {
    it("should post approved debit note", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"][data-status="APPROVED"]').first().click();

      cy.get('button:contains("Post")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Debit note posted").should("be.visible");
    });

    it("should add VAT on debit", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"]').first().click();

      cy.contains("VAT Addition").should("be.visible");
      cy.contains("Original VAT").should("be.visible");
      cy.contains("Additional VAT").should("be.visible");
    });

    it("should update customer balance on debit", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"]').first().click();

      cy.get('button:contains("Post")').click();
      cy.get('button:contains("Confirm")').click();

      cy.visit("/app/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.contains("Outstanding Balance").should("be.visible");
    });

    it("should create GL entries for debit", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"]').first().click();

      cy.get('button:contains("View GL Entries")').click();

      cy.contains("Debit").should("be.visible");
      cy.contains("Credit").should("be.visible");
    });
  });

  describe("Debit Note Calculations", () => {
    it("should calculate line totals", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"]').first().click();

      cy.contains("Subtotal").should("be.visible");
      cy.contains("Line Total").should("be.visible");
    });

    it("should calculate VAT correctly", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"]').first().click();

      cy.contains("VAT (5%)").should("be.visible");
      cy.contains("VAT Amount").should("be.visible");
    });

    it("should calculate grand total", () => {
      cy.visit("/app/debit-notes");
      cy.get('[data-testid="debit-note-row"]').first().click();

      cy.contains("Grand Total").should("be.visible");
    });
  });

  describe("Debit Note Listing & Search", () => {
    it("should list debit notes", () => {
      cy.visit("/app/debit-notes");

      cy.get('[data-testid="debit-note-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter debit notes by status", () => {
      cy.visit("/app/debit-notes");

      cy.get('select[name="Status"]').select("POSTED");

      cy.get('[data-testid="debit-note-row"]').should("have.length.greaterThan", 0);
    });

    it("should export debit notes", () => {
      cy.visit("/app/debit-notes");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/debit-notes-*.pdf").should("exist");
    });
  });
});
