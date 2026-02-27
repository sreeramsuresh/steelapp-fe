/**
 * Customers Master Data E2E Tests
 *
 * Tests customer master data management:
 * - Create, edit, and delete customers
 * - Customer categorization and classification
 * - Credit management and limits
 * - Contact and address management
 * - Customer performance tracking
 * - Customer segmentation and grouping
 *
 * Run: npm run test:e2e -- --spec '**/customers.cy.js'
 */

describe("Customers Master Data - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Customers", () => {
    it("should create new customer with basic details", () => {
      cy.visit("/customers");
      cy.get('button:contains("New Customer")').click();

      // Fill customer details
      cy.get('input[placeholder*="Customer Name"]').type("New Customer Ltd");
      cy.get('input[placeholder*="Customer Code"]').type("CUST-001");
      cy.get('input[placeholder*="Email"]').type("contact@customer.ae");
      cy.get('input[placeholder*="Phone"]').type("+971501234567");

      // Select customer type
      cy.get('select[name="Customer Type"]').select("RETAIL");

      // Set customer group
      cy.get('input[placeholder*="Customer Group"]').type("Standard");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create Customer")').click();
      cy.contains("Customer created successfully").should("be.visible");
    });

    it("should create customer with address details", () => {
      cy.visit("/customers");
      cy.get('button:contains("New Customer")').click();

      cy.get('input[placeholder*="Customer Name"]').type("Address Test Ltd");
      cy.get('input[placeholder*="Customer Code"]').type("CUST-002");

      // Add address
      cy.get('button:contains("Add Address")').click();

      cy.get('input[placeholder*="Street Address"]').type("123 Business Street");
      cy.get('input[placeholder*="City"]').type("Dubai");
      cy.get('input[placeholder*="Emirate"]').select("Dubai");
      cy.get('input[placeholder*="Postal Code"]').type("12345");
      cy.get('input[placeholder*="Country"]').type("UAE");
      cy.get('[role="option"]').first().click();

      cy.get('checkbox[name="is-billing-address"]').check();

      cy.get('button:contains("Create Customer")').click();
      cy.contains("Customer created successfully").should("be.visible");
    });

    it("should create customer with tax registration", () => {
      cy.visit("/customers");
      cy.get('button:contains("New Customer")').click();

      cy.get('input[placeholder*="Customer Name"]').type("Tax Registered Ltd");
      cy.get('input[placeholder*="Customer Code"]').type("CUST-003");

      // Add tax details
      cy.get('input[placeholder*="TRN"]').type("100123456789012");
      cy.get('input[placeholder*="Tax Name"]').type("Business Name");

      cy.get('button:contains("Create Customer")').click();
      cy.contains("Customer created successfully").should("be.visible");
    });

    it("should create customer with payment terms", () => {
      cy.visit("/customers");
      cy.get('button:contains("New Customer")').click();

      cy.get('input[placeholder*="Customer Name"]').type("Payment Terms Ltd");
      cy.get('input[placeholder*="Customer Code"]').type("CUST-004");

      // Set payment terms
      cy.get('select[name="Payment Terms"]').select("NET30");
      cy.get('input[placeholder*="Credit Days"]').type("30");

      cy.get('button:contains("Create Customer")').click();
      cy.contains("Customer created successfully").should("be.visible");
    });
  });

  describe("Edit Customer Details", () => {
    it("should edit customer basic information", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Customer Name"]').clear().type("Updated Name");
      cy.get('input[placeholder*="Phone"]').clear().type("+971509876543");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });

    it("should edit customer address", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Manage Addresses")').click();

      cy.get('[data-testid="address-row"]').first().within(() => {
        cy.get('button[aria-label="Edit"]').click();
      });

      cy.get('input[placeholder*="Street Address"]').clear().type("456 New Avenue");
      cy.get('input[placeholder*="City"]').clear().type("Abu Dhabi");

      cy.get('button:contains("Update Address")').click();
      cy.contains("Address updated").should("be.visible");
    });

    it("should add new contact person", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Add Contact")').click();

      cy.get('input[placeholder*="Contact Name"]').type("John Doe");
      cy.get('input[placeholder*="Contact Email"]').type("john@customer.ae");
      cy.get('input[placeholder*="Contact Phone"]').type("+971501111111");
      cy.get('select[name="Contact Role"]').select("SALES");

      cy.get('button:contains("Add Contact")').click();
      cy.contains("Contact added").should("be.visible");
    });

    it("should update customer tax information", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="TRN"]').clear().type("100987654321098");
      cy.get('input[placeholder*="Tax Name"]').clear().type("Updated Legal Name");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });
  });

  describe("Credit Management", () => {
    it("should set customer credit limit", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Credit Management")').click();

      cy.get('input[placeholder*="Credit Limit"]').type("100000");
      cy.get('input[placeholder*="Credit Exposure"]').should("have.value", "0");

      cy.get('button:contains("Update Credit Limit")').click();
      cy.contains("Credit limit updated").should("be.visible");
    });

    it("should place credit hold", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Credit Management")').click();

      cy.get('checkbox[name="credit-hold"]').check();
      cy.get('textarea[placeholder*="Hold Reason"]').type("Reviewing account");

      cy.get('button:contains("Apply Hold")').click();
      cy.contains("Credit hold applied").should("be.visible");
    });

    it("should review credit exposure", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Credit Exposure")').click();

      cy.contains("Credit Limit").should("be.visible");
      cy.contains("Outstanding Amount").should("be.visible");
      cy.contains("Available Credit").should("be.visible");
      cy.contains("Credit Utilization %").should("be.visible");
    });

    it("should set payment terms and credit days", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Payment Terms"]').select("NET45");
      cy.get('input[placeholder*="Credit Days"]').clear().type("45");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });
  });

  describe("Customer Categorization", () => {
    it("should assign customer group", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Customer Group"]').clear();
      cy.get('input[placeholder*="Customer Group"]').type("Gold");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });

    it("should set customer segment", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Segment"]').select("ENTERPRISE");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });

    it("should assign sales person to customer", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Sales Person"]').type("John Sales");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });

    it("should mark customer as inactive", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="is-active"]').uncheck();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });
  });

  describe("Customer Performance", () => {
    it("should view customer transaction history", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Transaction History")').click();

      cy.contains("Invoice").should("be.visible");
      cy.contains("Date").should("be.visible");
      cy.contains("Amount").should("be.visible");
      cy.get('[data-testid="transaction-row"]').should("have.length.greaterThan", 0);
    });

    it("should view customer aging analysis", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Aging Analysis")').click();

      cy.contains("Current").should("be.visible");
      cy.contains("30-60 Days").should("be.visible");
      cy.contains("60-90 Days").should("be.visible");
      cy.contains("Over 90 Days").should("be.visible");
    });

    it("should view customer payment history", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Payment History")').click();

      cy.get('[data-testid="payment-row"]').should("have.length.greaterThan", 0);
      cy.get('[data-testid="payment-row"]').first().within(() => {
        cy.contains(/\\d+/).should("be.visible"); // Amount
      });
    });

    it("should view customer sales performance", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Sales Performance")').click();

      cy.contains("Total Sales").should("be.visible");
      cy.contains("Average Order Value").should("be.visible");
      cy.contains("Frequency").should("be.visible");
    });

    it("should view customer lifetime value", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("LTV Analysis")').click();

      cy.contains("Total Revenue").should("be.visible");
      cy.contains("Profit Margin").should("be.visible");
      cy.contains("Status").should("be.visible");
    });
  });

  describe("Customer Search & Filter", () => {
    it("should search customer by name", () => {
      cy.visit("/customers");

      cy.get('input[placeholder*="Search"]').type("Customer");

      cy.wait(500); // Debounce
      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter customers by group", () => {
      cy.visit("/customers");

      cy.get('button:contains("Filters")').click();

      cy.get('select[name="Group"]').select("Gold");

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter customers by segment", () => {
      cy.visit("/customers");

      cy.get('button:contains("Filters")').click();

      cy.get('select[name="Segment"]').select("ENTERPRISE");

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter customers by credit status", () => {
      cy.visit("/customers");

      cy.get('button:contains("Filters")').click();

      cy.get('checkbox[name="on-credit-hold"]').check();

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter customers by status", () => {
      cy.visit("/customers");

      cy.get('button:contains("Filters")').click();

      cy.get('select[name="Status"]').select("ACTIVE");

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="customer-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Customer Documents", () => {
    it("should upload customer license document", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Documents")').click();

      cy.get('input[placeholder*="License"]').selectFile("cypress/fixtures/license.pdf");

      cy.get('button:contains("Upload")').click();
      cy.contains("Document uploaded").should("be.visible");
    });

    it("should manage customer documents", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Documents")').click();

      cy.get('[data-testid="document-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="document-row"]').first().within(() => {
        cy.get('button[aria-label="Download"]').should("be.visible");
      });
    });
  });

  describe("Delete Customer", () => {
    it("should delete inactive customer", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"][data-status="INACTIVE"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Customer deleted").should("be.visible");
    });
  });

  describe("Customer Analytics", () => {
    it("should view customer metrics", () => {
      cy.visit("/customers");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Customers").should("be.visible");
      cy.contains("Active Customers").should("be.visible");
      cy.contains("Total Credit Limit").should("be.visible");
      cy.contains("Total Outstanding").should("be.visible");
    });

    it("should analyze customers by segment", () => {
      cy.visit("/customers");

      cy.get('button:contains("By Segment")').click();

      cy.get('[data-testid="segment-row"]').should("have.length.greaterThan", 0);
    });

    it("should export customer list", () => {
      cy.visit("/customers");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/customers-*.csv").should("exist");
    });
  });
});
