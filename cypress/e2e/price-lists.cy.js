/**
 * Price Lists E2E Tests
 *
 * Tests price list management:
 * - Create and manage price lists
 * - Price list versions and effective dates
 * - Customer group pricing
 * - Volume-based pricing
 * - Currency-specific pricing
 *
 * Run: npm run test:e2e -- --spec '**/price-lists.cy.js'
 */

describe("Price Lists - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Price Lists", () => {
    it("should create basic price list", () => {
      cy.visit("/price-lists");
      cy.get('button:contains("New Price List")').click();

      cy.get('input[placeholder*="Price List Name"]').type("Standard Pricing 2024");
      cy.get('input[placeholder*="Code"]').type("PL-2024-STD");
      cy.get('input[placeholder*="Effective Date"]').type("2024-01-01");

      cy.get('button:contains("Create Price List")').click();
      cy.contains("Price list created").should("be.visible");
    });

    it("should create price list for customer group", () => {
      cy.visit("/price-lists");
      cy.get('button:contains("New Price List")').click();

      cy.get('input[placeholder*="Price List Name"]').type("Gold Customer Pricing");
      cy.get('input[placeholder*="Code"]').type("PL-GOLD");

      // Assign to customer group
      cy.get('input[placeholder*="Customer Group"]').type("Gold");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create Price List")').click();
      cy.contains("Price list created").should("be.visible");
    });

    it("should create currency-specific price list", () => {
      cy.visit("/price-lists");
      cy.get('button:contains("New Price List")').click();

      cy.get('input[placeholder*="Price List Name"]').type("USD Pricing");
      cy.get('input[placeholder*="Code"]').type("PL-USD");

      // Set currency
      cy.get('select[name="Currency"]').select("USD");

      cy.get('button:contains("Create Price List")').click();
      cy.contains("Price list created").should("be.visible");
    });

    it("should create seasonal price list", () => {
      cy.visit("/price-lists");
      cy.get('button:contains("New Price List")').click();

      cy.get('input[placeholder*="Price List Name"]').type("Summer Sale 2024");
      cy.get('input[placeholder*="Code"]').type("PL-SUMMER");

      cy.get('input[placeholder*="Effective From"]').type("2024-06-01");
      cy.get('input[placeholder*="Effective To"]').type("2024-08-31");

      cy.get('button:contains("Create Price List")').click();
      cy.contains("Price list created").should("be.visible");
    });
  });

  describe("Add Products to Price List", () => {
    it("should add product to price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Add Product")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Price"]').type("75");

      cy.get('button:contains("Add Product")').click();
      cy.contains("Product added to price list").should("be.visible");
    });

    it("should add multiple products to price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Bulk Add")').click();

      // Upload CSV
      cy.get('input[placeholder*="Products"]').selectFile("cypress/fixtures/products.csv");

      cy.get('button:contains("Import")').click();
      cy.contains("Products imported").should("be.visible");
    });

    it("should set volume-based pricing", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Add Product")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Add pricing tiers
      cy.get('button:contains("Add Tier")').click();

      cy.get('input[placeholder*="Min Qty"]').type("100");
      cy.get('input[placeholder*="Price"]').type("70");

      cy.get('button:contains("Add Tier")').click();

      cy.get('input[placeholder*="Min Qty"]').eq(1).type("500");
      cy.get('input[placeholder*="Price"]').eq(1).type("65");

      cy.get('button:contains("Add Product")').click();
      cy.contains("Product added").should("be.visible");
    });

    it("should set margin-based pricing", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Add Product")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Use margin calculation
      cy.get('select[name="Price Method"]').select("COST_PLUS_MARGIN");

      cy.get('input[placeholder*="Margin %"]').type("25");

      cy.get('button:contains("Add Product")').click();
      cy.contains("Product added").should("be.visible");
    });
  });

  describe("Edit Price List", () => {
    it("should edit price list details", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Price List Name"]').clear().type("Updated Pricing");
      cy.get('input[placeholder*="Effective Date"]').clear().type("2024-02-01");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Price list updated").should("be.visible");
    });

    it("should update product price in list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('[data-testid="item-row"]').first().within(() => {
        cy.get('button:contains("Edit")').click();
      });

      cy.get('input[placeholder*="Price"]').clear().type("80");

      cy.get('button:contains("Save")').click();
      cy.contains("Price updated").should("be.visible");
    });

    it("should remove product from price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('[data-testid="item-row"]').first().within(() => {
        cy.get('button[aria-label="Delete"]').click();
      });

      cy.get('button:contains("Confirm")').click();
      cy.contains("Product removed").should("be.visible");
    });

    it("should copy price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Copy")').click();

      cy.get('input[placeholder*="Name"]').type("Copy of Pricing");
      cy.get('input[placeholder*="Code"]').clear().type("PL-COPY");

      cy.get('button:contains("Create")').click();
      cy.contains("Price list created").should("be.visible");
    });

    it("should activate/deactivate price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="is-active"]').uncheck();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Price list updated").should("be.visible");
    });
  });

  describe("Price List Versions", () => {
    it("should create new version of price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("New Version")').click();

      cy.get('input[placeholder*="Effective Date"]').type("2024-03-01");

      cy.get('button:contains("Create Version")').click();
      cy.contains("Version created").should("be.visible");
    });

    it("should view price list history", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="version-row"]').should("have.length.greaterThan", 0);
    });

    it("should revert to previous version", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="version-row"]').first().within(() => {
        cy.get('button:contains("Revert")').click();
      });

      cy.get('button:contains("Confirm")').click();
      cy.contains("Reverted to version").should("be.visible");
    });

    it("should compare price list versions", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"]').first().click();

      cy.get('button:contains("Compare")').click();

      cy.get('select[name="Version 1"]').select("v1");
      cy.get('select[name="Version 2"]').select("v2");

      cy.get('button:contains("Compare")').click();

      cy.contains("Differences").should("be.visible");
    });
  });

  describe("Price List Application", () => {
    it("should apply price list to customer", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Price List"]').select("Standard Pricing");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });

    it("should view applied price in quotation", () => {
      cy.visit("/quotations");
      cy.get('button:contains("Create Quotation")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      // Verify price from price list
      cy.contains(/\\d+/).should("be.visible"); // Price
    });

    it("should show price list discount on invoice", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Gold Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("500");

      // Verify volume discount applied
      cy.contains("Discount").should("be.visible");
    });
  });

  describe("Price List Search & Filter", () => {
    it("should search price list by name", () => {
      cy.visit("/price-lists");

      cy.get('input[placeholder*="Search"]').type("Standard");

      cy.wait(500);
      cy.get('[data-testid="pricelist-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter price lists by status", () => {
      cy.visit("/price-lists");

      cy.get('select[name="Status"]').select("ACTIVE");

      cy.get('[data-testid="pricelist-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter price lists by currency", () => {
      cy.visit("/price-lists");

      cy.get('select[name="Currency"]').select("AED");

      cy.get('[data-testid="pricelist-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter price lists by effective date", () => {
      cy.visit("/price-lists");

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="pricelist-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Delete Price List", () => {
    it("should delete inactive price list", () => {
      cy.visit("/price-lists");
      cy.get('[data-testid="pricelist-row"][data-status="INACTIVE"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Price list deleted").should("be.visible");
    });
  });

  describe("Price List Analytics", () => {
    it("should view price list metrics", () => {
      cy.visit("/price-lists");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Price Lists").should("be.visible");
      cy.contains("Active Lists").should("be.visible");
      cy.contains("Total Products").should("be.visible");
    });

    it("should analyze price list usage", () => {
      cy.visit("/price-lists");

      cy.get('button:contains("Usage")').click();

      cy.get('[data-testid="usage-row"]').should("have.length.greaterThan", 0);
    });

    it("should export price list", () => {
      cy.visit("/price-lists");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/price-lists-*.csv").should("exist");
    });

    it("should generate price comparison report", () => {
      cy.visit("/price-lists");

      cy.get('button:contains("Compare Prices")').click();

      cy.get('select[name="List 1"]').select("Standard Pricing");
      cy.get('select[name="List 2"]').select("Gold Pricing");

      cy.get('button:contains("Compare")').click();

      cy.contains("Price Comparison").should("be.visible");
    });
  });
});
