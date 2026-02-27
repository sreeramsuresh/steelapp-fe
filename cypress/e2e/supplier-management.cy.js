/**
 * Supplier Management E2E Tests
 *
 * Tests supplier CRUD and workflows:
 * - Create suppliers
 * - Edit supplier details
 * - Manage payment terms
 * - Credit limits
 * - Supplier performance
 *
 * Run: npm run test:e2e -- --spec '**/supplier-management.cy.js'
 */

describe("Supplier Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Suppliers", () => {
    it("should create new supplier", () => {
      cy.visit("/suppliers");
      cy.get('button:contains("Create Supplier")').click();

      // Basic info
      cy.get('input[placeholder*="Supplier Name"]').type("New Supplier Ltd");
      cy.get('input[placeholder*="Tax ID"]').type("TAX-12345");

      // Contact info
      cy.get('input[placeholder*="Email"]').type("contact@supplier.com");
      cy.get('input[placeholder*="Phone"]').type("+971123456789");

      // Address
      cy.get('input[placeholder*="Street"]').type("123 Trade Street");
      cy.get('input[placeholder*="City"]').type("Dubai");
      cy.get('select[name="Country"]').select("United Arab Emirates");

      // Submit
      cy.get('button:contains("Create Supplier")').click();
      cy.contains("Supplier created").should("be.visible");

      // Verify supplier ID
      cy.contains(/SUP-\d{6}/);
    });

    it("should create supplier with payment terms", () => {
      cy.visit("/suppliers");
      cy.get('button:contains("Create Supplier")').click();

      cy.get('input[placeholder*="Supplier Name"]').type("Supplier with Terms");
      cy.get('input[placeholder*="Tax ID"]').type("TAX-54321");

      cy.get('input[placeholder*="Email"]').type("contact@supplier.com");
      cy.get('input[placeholder*="Phone"]').type("+971123456789");

      // Payment terms
      cy.get('select[name="Payment Terms"]').select("NET 30");
      cy.get('input[placeholder*="Credit Limit"]').type("50000");

      // Submit
      cy.get('button:contains("Create Supplier")').click();
      cy.contains("Supplier created").should("be.visible");
    });

    it("should create supplier with bank details", () => {
      cy.visit("/suppliers");
      cy.get('button:contains("Create Supplier")').click();

      cy.get('input[placeholder*="Supplier Name"]').type("Bank-enabled Supplier");
      cy.get('input[placeholder*="Tax ID"]').type("TAX-99999");

      cy.get('input[placeholder*="Email"]').type("contact@supplier.com");
      cy.get('input[placeholder*="Phone"]').type("+971123456789");

      // Bank details
      cy.get('input[placeholder*="Bank Name"]').type("Emirates NBD");
      cy.get('input[placeholder*="Account Number"]').type("123456789");
      cy.get('input[placeholder*="IBAN"]').type("AE210260001234567890123456");

      cy.get('button:contains("Create Supplier")').click();
      cy.contains("Supplier created").should("be.visible");
    });
  });

  describe("Edit Supplier Details", () => {
    it("should update supplier contact information", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Email"]').clear().type("newemail@supplier.com");
      cy.get('input[placeholder*="Phone"]').clear().type("+971987654321");

      cy.get('button:contains("Save")').click();
      cy.contains("Supplier updated").should("be.visible");
    });

    it("should update supplier address", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Street"]').clear().type("456 Supply Street");
      cy.get('input[placeholder*="City"]').clear().type("Abu Dhabi");

      cy.get('button:contains("Save")').click();
      cy.contains("Supplier updated").should("be.visible");
    });

    it("should update payment terms and credit limit", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Payment Terms"]').select("NET 60");
      cy.get('input[placeholder*="Credit Limit"]').clear().type("75000");

      cy.get('button:contains("Save")').click();
      cy.contains("Supplier updated").should("be.visible");
    });

    it("should update bank details", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Bank Name"]').clear().type("FAB");
      cy.get('input[placeholder*="Account Number"]').clear().type("987654321");

      cy.get('button:contains("Save")').click();
      cy.contains("Supplier updated").should("be.visible");
    });
  });

  describe("Supplier Status Management", () => {
    it("should activate supplier", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"][data-status="INACTIVE"]')
        .first()
        .click();

      cy.get('button:contains("Activate")').click();
      cy.contains("Supplier activated").should("be.visible");
    });

    it("should deactivate supplier", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"][data-status="ACTIVE"]')
        .first()
        .click();

      cy.get('button:contains("Deactivate")').click();
      cy.get('textarea[placeholder*="Reason"]').type("Supplier quality declined");
      cy.get('button:contains("Confirm")').click();

      cy.contains("Supplier deactivated").should("be.visible");
    });

    it("should suspend supplier account", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"][data-status="ACTIVE"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Suspend")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Outstanding invoices");
      cy.get('input[placeholder*="Suspension Days"]').type("30");

      cy.get('button:contains("Suspend")').click();
      cy.contains("Supplier suspended").should("be.visible");
    });
  });

  describe("Credit Management", () => {
    it("should update supplier credit limit", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Manage Credit")').click();

      cy.get('input[placeholder*="Credit Limit"]').clear().type("100000");

      cy.get('button:contains("Update")').click();
      cy.contains("Credit limit updated").should("be.visible");
    });

    it("should view credit utilization", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Manage Credit")').click();

      cy.contains("Available Credit:").should("be.visible");
      cy.contains("Used Credit:").should("be.visible");
      cy.contains("Utilization %:").should("be.visible");
    });

    it("should review credit history", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Credit History")').click();

      cy.get('[data-testid="credit-transaction"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Supplier Documents", () => {
    it("should upload certificate of origin", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Manage Documents")').click();

      cy.get('input[placeholder*="Certificate of Origin"]').selectFile(
        "cypress/fixtures/coo.pdf",
      );

      cy.get('button:contains("Upload")').click();
      cy.contains("Document uploaded").should("be.visible");
    });

    it("should upload license documents", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Manage Documents")').click();

      cy.get('input[placeholder*="Business License"]').selectFile(
        "cypress/fixtures/license.pdf",
      );

      cy.get('button:contains("Upload")').click();
      cy.contains("Document uploaded").should("be.visible");
    });
  });

  describe("Supplier Performance", () => {
    it("should view supplier performance metrics", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Performance")').click();

      cy.contains("On-Time Delivery Rate").should("be.visible");
      cy.contains("Quality Rating").should("be.visible");
      cy.contains("Average Lead Time").should("be.visible");
    });

    it("should record supplier rating", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Performance")').click();
      cy.get('button:contains("Rate Supplier")').click();

      cy.get('select[name="Quality"]').select("5");
      cy.get('select[name="Delivery"]').select("4");
      cy.get('select[name="Communication"]').select("5");

      cy.get('textarea[placeholder*="Comments"]').type("Good supplier overall");

      cy.get('button:contains("Submit Rating")').click();
      cy.contains("Rating recorded").should("be.visible");
    });

    it("should view supplier compliance status", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Compliance")').click();

      cy.contains("Tax Compliance").should("be.visible");
      cy.contains("Document Status").should("be.visible");
      cy.contains("Audit Status").should("be.visible");
    });
  });

  describe("Supplier Contacts", () => {
    it("should add supplier contact person", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Manage Contacts")').click();
      cy.get('button:contains("Add Contact")').click();

      cy.get('input[placeholder*="Contact Name"]').type("John Supplier");
      cy.get('input[placeholder*="Email"]').type("john@supplier.com");
      cy.get('input[placeholder*="Phone"]').type("+971123456789");
      cy.get('select[name="Department"]').select("Sales");

      cy.get('button:contains("Add Contact")').click();
      cy.contains("Contact added").should("be.visible");
    });

    it("should edit supplier contact", () => {
      cy.visit("/suppliers");
      cy.get('[data-testid="supplier-row"]').first().click();

      cy.get('button:contains("Manage Contacts")').click();
      cy.get('[data-testid="contact-row"]').first().click();

      cy.get('input[placeholder*="Phone"]').clear().type("+971987654321");

      cy.get('button:contains("Save")').click();
      cy.contains("Contact updated").should("be.visible");
    });
  });

  describe("Supplier Search & Filter", () => {
    it("should search suppliers by name", () => {
      cy.visit("/suppliers");

      cy.get('input[placeholder*="Search"]').type("Test Supplier");
      cy.get('button:contains("Search")').click();

      cy.get('[data-testid="supplier-row"]').each(($row) => {
        cy.wrap($row).contains("Test Supplier");
      });
    });

    it("should filter suppliers by status", () => {
      cy.visit("/suppliers");

      cy.get('select[name="Status"]').select("ACTIVE");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="supplier-row"]').each(($row) => {
        cy.wrap($row).should("have.attr", "data-status", "ACTIVE");
      });
    });

    it("should filter suppliers by country", () => {
      cy.visit("/suppliers");

      cy.get('select[name="Country"]').select("United Arab Emirates");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="supplier-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Supplier Analytics", () => {
    it("should view total suppliers and categories", () => {
      cy.visit("/suppliers");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Suppliers").should("be.visible");
      cy.contains("Active Suppliers").should("be.visible");
      cy.contains("Inactive Suppliers").should("be.visible");
    });

    it("should export supplier list", () => {
      cy.visit("/suppliers");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/suppliers-*.csv").should("exist");
    });
  });
});
