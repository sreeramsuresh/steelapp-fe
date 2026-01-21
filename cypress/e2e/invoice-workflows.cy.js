/**
 * Invoice Workflows E2E Tests
 *
 * Tests complete invoice workflows including:
 * - Discounts and adjustments
 * - Credit note creation
 * - Delivery note linkage
 * - Payment reconciliation
 *
 * Run: npm run test:e2e -- --spec "**/invoice-workflows.cy.js"
 */

describe("Invoice Workflows - Advanced E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Invoice with Discounts", () => {
    it("should create invoice with line-item discount", () => {
      cy.visit("/create-invoice");

      // Select customer
      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      // Add line item
      cy.get('button:contains("Add Line Item")').click();

      // Fill line item
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Apply line discount
      cy.get('button[aria-label*="Discount"]').click();
      cy.get('input[placeholder*="Discount %"]').type("10");
      cy.get('button:contains("Apply")').click();

      // Verify discount applied
      cy.contains("Discount: -500").should("be.visible");

      // Submit
      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created successfully").should("be.visible");
    });

    it("should create invoice with global discount", () => {
      cy.visit("/create-invoice");

      // Select customer
      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      // Add line item
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Apply invoice-level discount
      cy.get('button[aria-label*="Invoice Discount"]').click();
      cy.get('input[placeholder*="Discount Amount"]').type("500");
      cy.get('button:contains("Apply")').click();

      // Verify total reduced
      cy.contains("Total: 4500").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created successfully").should("be.visible");
    });

    it("should handle invalid discount values", () => {
      cy.visit("/create-invoice");

      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Try invalid discount
      cy.get('button[aria-label*="Discount"]').click();
      cy.get('input[placeholder*="Discount %"]').type("150");
      cy.get('button:contains("Apply")').click();

      cy.contains("Discount cannot exceed 100%").should("be.visible");
    });
  });

  describe("Invoice Adjustments & Amendments", () => {
    it("should edit invoice before confirmation", () => {
      // Navigate to existing invoice
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      // Edit invoice
      cy.get('button[aria-label="Edit"]').click();

      // Change quantity
      cy.get('input[placeholder*="Quantity"]').first().clear().type("150");

      // Save
      cy.get('button:contains("Save")').click();
      cy.contains("Invoice updated").should("be.visible");
    });

    it("should add line item to draft invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Edit")').click();
      cy.get('button:contains("Add Line Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-316L-Coil");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("50");
      cy.get('input[placeholder*="Unit Price"]').type("75");

      cy.get('button:contains("Save")').click();
      cy.contains("Line item added").should("be.visible");
    });

    it("should remove line item from draft invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Edit")').click();

      // Remove first line item
      cy.get('button[aria-label="Remove"]').first().click();
      cy.get('button:contains("Confirm")').click();

      cy.get('button:contains("Save")').click();
      cy.contains("Line item removed").should("be.visible");
    });

    it("should prevent editing confirmed invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"][data-status="CONFIRMED"]')
        .first()
        .click();

      cy.get('button[aria-label="Edit"]').should("be.disabled");
      cy.contains("Cannot edit confirmed invoice").should("be.visible");
    });
  });

  describe("Payment Reconciliation", () => {
    it("should apply partial payment to invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Record Payment")').click();

      cy.get('input[placeholder*="Payment Amount"]').type("5000");
      cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
      cy.get('input[placeholder*="Reference"]').type("TXN-12345");

      cy.get('button:contains("Record")').click();
      cy.contains("Payment recorded").should("be.visible");

      // Verify balance
      cy.contains("Outstanding: 5000").should("be.visible");
    });

    it("should apply full payment and mark as paid", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      // Get invoice total
      cy.contains(/Total:\s+[\d,]+/).then(($el) => {
        const totalText = $el.text();
        const total = parseFloat(totalText.match(/[\d,]+/)[0].replace(",", ""));

        cy.get('button:contains("Record Payment")').click();
        cy.get('input[placeholder*="Payment Amount"]').type(total.toString());
        cy.get('select[name="Payment Method"]').select("BANK_TRANSFER");
        cy.get('button:contains("Record")').click();

        cy.contains("Invoice marked as paid").should("be.visible");
      });
    });

    it("should overpayment validation", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Record Payment")').click();
      cy.get('input[placeholder*="Payment Amount"]').type("999999");
      cy.get('button:contains("Record")').click();

      cy.contains("Payment exceeds invoice total").should("be.visible");
    });
  });

  describe("Invoice Status Workflow", () => {
    it("should confirm draft invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Confirm")').click();
      cy.get('button:contains("Yes, Confirm")').click();

      cy.contains("Invoice confirmed").should("be.visible");
      cy.contains("Status: Confirmed").should("be.visible");
    });

    it("should cancel invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"][data-status="DRAFT"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Cancel")').click();
      cy.get('input[placeholder*="Cancellation Reason"]').type("Changed mind");
      cy.get('button:contains("Cancel Invoice")').click();

      cy.contains("Invoice cancelled").should("be.visible");
    });

    it("should generate delivery note from invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Generate Delivery Note")').click();

      // Verify DN form prefilled
      cy.contains("DN-").should("be.visible");
      cy.get('input[placeholder*="Customer"]').should(
        "have.value",
        "Test Customer",
      );

      cy.get('button:contains("Create Delivery Note")').click();
      cy.contains("Delivery note created").should("be.visible");
    });
  });

  describe("Invoice Printing & Exports", () => {
    it("should preview invoice PDF", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button[aria-label="Preview"]').click();

      cy.get('[data-testid="pdf-viewer"]').should("be.visible");
      cy.contains(/INV-\d{4}-\d{6}/);
    });

    it("should download invoice as PDF", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Download PDF")').click();

      // Verify download initiated
      cy.readFile("cypress/downloads/invoice-*.pdf").should("exist");
    });

    it("should email invoice", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button[aria-label="Email"]').click();
      cy.get('input[placeholder*="Email To"]').should(
        "have.value",
        "customer@example.com",
      );

      cy.get('button:contains("Send")').click();
      cy.contains("Invoice sent via email").should("be.visible");
    });

    it("should export invoice to accounting system", () => {
      cy.visit("/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Export to Accounting")').click();
      cy.get('select[name="System"]').select("QUICKBOOKS");

      cy.get('button:contains("Export")').click();
      cy.contains("Invoice exported successfully").should("be.visible");
    });
  });

  describe("Invoice Batch Operations", () => {
    it("should bulk confirm invoices", () => {
      cy.visit("/invoices");

      // Select multiple invoices
      cy.get('input[aria-label="Select all"]').click();

      cy.get('button:contains("Bulk Actions")').click();
      cy.get('button:contains("Confirm Selected")').click();
      cy.get('button:contains("Confirm All")').click();

      cy.contains("3 invoices confirmed").should("be.visible");
    });

    it("should bulk send invoices via email", () => {
      cy.visit("/invoices");

      cy.get('input[aria-label="Select all"]').click();

      cy.get('button:contains("Bulk Actions")').click();
      cy.get('button:contains("Email Selected")').click();
      cy.get('button:contains("Send to All")').click();

      cy.contains("3 invoices sent via email").should("be.visible");
    });

    it("should bulk export invoices", () => {
      cy.visit("/invoices");

      cy.get('input[aria-label="Select all"]').click();

      cy.get('button:contains("Bulk Actions")').click();
      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/invoices-*.csv").should("exist");
    });
  });

  describe("Invoice Filtering & Search", () => {
    it("should filter invoices by date range", () => {
      cy.visit("/invoices");

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");
      cy.get('button:contains("Apply Filter")').click();

      cy.get('[data-testid="invoice-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter invoices by status", () => {
      cy.visit("/invoices");

      cy.get('select[name="Status"]').select("PAID");
      cy.get('button:contains("Apply Filter")').click();

      cy.get('[data-testid="invoice-row"]').each(($row) => {
        cy.wrap($row).contains("PAID");
      });
    });

    it("should search invoices by customer", () => {
      cy.visit("/invoices");

      cy.get('input[placeholder*="Search"]').type("Test Customer");
      cy.get('button:contains("Search")').click();

      cy.get('[data-testid="invoice-row"]')
        .first()
        .contains("Test Customer")
        .should("be.visible");
    });

    it("should search invoices by invoice number", () => {
      cy.visit("/invoices");

      cy.get('input[placeholder*="Invoice Number"]').type("INV-2024");
      cy.get('button:contains("Search")').click();

      cy.get('[data-testid="invoice-row"]').should("have.length.greaterThan", 0);
    });
  });
});
