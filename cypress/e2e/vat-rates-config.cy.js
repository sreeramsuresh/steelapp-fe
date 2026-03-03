/**
 * VAT Rates Configuration E2E Tests
 *
 * Tests VAT rates and compliance configuration:
 * - Create and manage VAT rates
 * - Tax category configuration
 * - Tax codes and groups
 * - Regional tax settings
 * - Tax exemptions and overrides
 *
 * Run: npm run test:e2e -- --spec '**/vat-rates-config.cy.js'
 */

describe("VAT Rates Configuration - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("VAT Rates Management", () => {
    it("should view existing VAT rates", () => {
      cy.visit("/settings/vat-rates");

      cy.get('[data-testid="rate-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="rate-row"]')
        .first()
        .within(() => {
          cy.contains("5%").should("be.visible");
          cy.contains("Standard").should("be.visible");
        });
    });

    it("should create new VAT rate", () => {
      cy.visit("/settings/vat-rates");
      cy.get('button:contains("New Rate")').click();

      cy.get('input[placeholder*="Rate %"]').type("10");
      cy.get('input[placeholder*="Description"]').type("Reduced VAT Rate");
      cy.get('input[placeholder*="Tax Code"]').type("TAX-10");

      cy.get('button:contains("Create Rate")').click();
      cy.contains("VAT rate created").should("be.visible");
    });

    it("should create zero-rated VAT entry", () => {
      cy.visit("/settings/vat-rates");
      cy.get('button:contains("New Rate")').click();

      cy.get('input[placeholder*="Rate %"]').type("0");
      cy.get('input[placeholder*="Description"]').type("Zero-Rated Export");
      cy.get('checkbox[name="is-zero-rated"]').check();

      cy.get('button:contains("Create Rate")').click();
      cy.contains("VAT rate created").should("be.visible");
    });

    it("should create exempt supply rate", () => {
      cy.visit("/settings/vat-rates");
      cy.get('button:contains("New Rate")').click();

      cy.get('input[placeholder*="Description"]').type("Exempt Supply");
      cy.get('checkbox[name="is-exempt"]').check();

      cy.get('button:contains("Create Rate")').click();
      cy.contains("VAT rate created").should("be.visible");
    });

    it("should edit VAT rate", () => {
      cy.visit("/settings/vat-rates");
      cy.get('[data-testid="rate-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Description"]').clear().type("Updated Description");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("VAT rate updated").should("be.visible");
    });

    it("should activate/deactivate VAT rate", () => {
      cy.visit("/settings/vat-rates");
      cy.get('[data-testid="rate-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="is-active"]').uncheck();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("VAT rate updated").should("be.visible");
    });

    it("should delete VAT rate", () => {
      cy.visit("/settings/vat-rates");
      cy.get('[data-testid="rate-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("VAT rate deleted").should("be.visible");
    });
  });

  describe("Tax Categories", () => {
    it("should create tax category", () => {
      cy.visit("/settings/tax-categories");
      cy.get('button:contains("New Category")').click();

      cy.get('input[placeholder*="Category Name"]').type("Services");
      cy.get('input[placeholder*="Category Code"]').type("TAX-CAT-SRV");

      // Assign VAT rate
      cy.get('select[name="VAT Rate"]').select("5%");

      cy.get('button:contains("Create Category")').click();
      cy.contains("Tax category created").should("be.visible");
    });

    it("should assign products to tax category", () => {
      cy.visit("/settings/tax-categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button:contains("Assign Products")').click();

      cy.get('checkbox[name="product"]').first().check();
      cy.get('checkbox[name="product"]').eq(1).check();

      cy.get('button:contains("Assign")').click();
      cy.contains("Products assigned").should("be.visible");
    });

    it("should view products in tax category", () => {
      cy.visit("/settings/tax-categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button:contains("Products")').click();

      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should edit tax category", () => {
      cy.visit("/settings/tax-categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="VAT Rate"]').select("10%");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Tax category updated").should("be.visible");
    });

    it("should delete tax category", () => {
      cy.visit("/settings/tax-categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Tax category deleted").should("be.visible");
    });
  });

  describe("Tax Codes & Groups", () => {
    it("should view tax codes", () => {
      cy.visit("/settings/tax-codes");

      cy.get('[data-testid="code-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="code-row"]')
        .first()
        .within(() => {
          cy.contains(/TAX-\\d+/).should("be.visible");
        });
    });

    it("should create tax code", () => {
      cy.visit("/settings/tax-codes");
      cy.get('button:contains("New Code")').click();

      cy.get('input[placeholder*="Tax Code"]').type("TAX-2024-001");
      cy.get('input[placeholder*="Description"]').type("2024 Standard Tax");

      // Assign rate
      cy.get('select[name="VAT Rate"]').select("5%");

      cy.get('button:contains("Create Code")').click();
      cy.contains("Tax code created").should("be.visible");
    });

    it("should create tax group", () => {
      cy.visit("/settings/tax-groups");
      cy.get('button:contains("New Group")').click();

      cy.get('input[placeholder*="Group Name"]').type("Combined Tax");

      // Add tax codes
      cy.get('button:contains("Add Code")').click();

      cy.get('select[name="Tax Code"]').select("TAX-001");

      cy.get('button:contains("Create Group")').click();
      cy.contains("Tax group created").should("be.visible");
    });

    it("should add multiple tax codes to group", () => {
      cy.visit("/settings/tax-groups");
      cy.get('[data-testid="group-row"]').first().click();

      cy.get('button:contains("Add Code")').click();

      cy.get('select[name="Tax Code"]').select("TAX-002");

      cy.get('button:contains("Add Code")').click();
      cy.contains("Tax code added").should("be.visible");
    });
  });

  describe("Regional Tax Settings", () => {
    it("should configure UAE tax settings", () => {
      cy.visit("/settings/regional-tax");

      cy.get('[data-testid="region-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Standard Rate"]').select("5%");
      cy.get('select[name="Reduced Rate"]').select("0%");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Regional tax settings updated").should("be.visible");
    });

    it("should set reverse charge applicable countries", () => {
      cy.visit("/settings/regional-tax");

      cy.get('[data-testid="region-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="reverse-charge-applies"]').check();

      cy.get('textarea[placeholder*="Countries"]').type("Saudi Arabia, Qatar");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Regional tax settings updated").should("be.visible");
    });

    it("should configure tax by customer type", () => {
      cy.visit("/settings/regional-tax");

      cy.get('button:contains("Customer Types")').click();

      cy.get('[data-testid="type-row"]').first().within(() => {
        cy.get('button:contains("Edit")').click();
      });

      cy.get('select[name="Tax Rate"]').select("5%");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Updated").should("be.visible");
    });
  });

  describe("Tax Exemptions & Overrides", () => {
    it("should create tax exemption", () => {
      cy.visit("/settings/tax-exemptions");
      cy.get('button:contains("New Exemption")').click();

      cy.get('input[placeholder*="Exemption Code"]').type("EXEMPT-001");
      cy.get('input[placeholder*="Description"]').type("Government Entity");

      // Set conditions
      cy.get('textarea[placeholder*="Conditions"]').type("Applicable to government organizations");

      cy.get('button:contains("Create Exemption")').click();
      cy.contains("Tax exemption created").should("be.visible");
    });

    it("should apply tax exemption to customer", () => {
      cy.visit("/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Tax Exemption"]').select("EXEMPT-001");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Customer updated").should("be.visible");
    });

    it("should create tax override for transaction", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Select customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();

      // Set custom tax
      cy.get('select[name="Tax Rate"]').select("Custom");

      cy.get('input[placeholder*="Custom Tax %"]').type("3");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should view tax override history", () => {
      cy.visit("/settings/tax-exemptions");

      cy.get('button:contains("Override History")').click();

      cy.get('[data-testid="override-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Tax Configuration Search & Filter", () => {
    it("should search VAT rates", () => {
      cy.visit("/settings/vat-rates");

      cy.get('input[placeholder*="Search"]').type("Standard");

      cy.wait(500);
      cy.get('[data-testid="rate-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter tax categories by status", () => {
      cy.visit("/settings/tax-categories");

      cy.get('select[name="Status"]').select("ACTIVE");

      cy.get('[data-testid="category-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter tax exemptions by type", () => {
      cy.visit("/settings/tax-exemptions");

      cy.get('select[name="Type"]').select("GOVERNMENT");

      cy.get('[data-testid="exemption-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Tax Configuration Analytics", () => {
    it("should view tax configuration metrics", () => {
      cy.visit("/settings/vat-rates");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Rates").should("be.visible");
      cy.contains("Active Rates").should("be.visible");
      cy.contains("Tax Categories").should("be.visible");
    });

    it("should export tax configuration", () => {
      cy.visit("/settings/vat-rates");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/vat-rates-*.csv").should("exist");
    });

    it("should export tax categories", () => {
      cy.visit("/settings/tax-categories");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/tax-categories-*.csv").should("exist");
    });
  });
});
