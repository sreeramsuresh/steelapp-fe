/**
 * Product Categories & Policies E2E Tests
 *
 * Tests product category and policy management:
 * - Create and manage product categories
 * - Category hierarchies and grouping
 * - Discount policies
 * - Pricing policies
 * - Return and warranty policies
 *
 * Run: npm run test:e2e -- --spec '**/categories-policies.cy.js'
 */

describe("Categories & Policies - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Product Categories", () => {
    it("should create product category", () => {
      cy.visit("/settings/categories");
      cy.get('button:contains("New Category")').click();

      cy.get('input[placeholder*="Category Name"]').type("Stainless Steel");
      cy.get('input[placeholder*="Category Code"]').type("CAT-SS");
      cy.get('textarea[placeholder*="Description"]').type("Stainless steel products");

      cy.get('button:contains("Create Category")').click();
      cy.contains("Category created").should("be.visible");
    });

    it("should create category hierarchy", () => {
      cy.visit("/settings/categories");
      cy.get('button:contains("New Category")').click();

      cy.get('input[placeholder*="Category Name"]').type("Sheets");
      cy.get('input[placeholder*="Category Code"]').type("CAT-SHEETS");

      // Set parent category
      cy.get('input[placeholder*="Parent Category"]').type("Stainless Steel");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create Category")').click();
      cy.contains("Category created").should("be.visible");
    });

    it("should edit category details", () => {
      cy.visit("/settings/categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Category Name"]').clear().type("Updated Category");
      cy.get('textarea[placeholder*="Description"]').clear().type("Updated description");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Category updated").should("be.visible");
    });

    it("should view products in category", () => {
      cy.visit("/settings/categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button:contains("Products")').click();

      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should delete category", () => {
      cy.visit("/settings/categories");
      cy.get('[data-testid="category-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Category deleted").should("be.visible");
    });
  });

  describe("Discount Policies", () => {
    it("should create quantity discount policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("DISCOUNT");

      cy.get('input[placeholder*="Policy Name"]').type("Volume Discount");
      cy.get('textarea[placeholder*="Description"]').type("Discount for large orders");

      // Add discount tiers
      cy.get('button:contains("Add Tier")').click();

      cy.get('input[placeholder*="Minimum Qty"]').type("100");
      cy.get('input[placeholder*="Discount %"]').type("5");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should create customer group discount policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("DISCOUNT");

      cy.get('input[placeholder*="Policy Name"]').type("Gold Customer Discount");

      // Assign to customer group
      cy.get('input[placeholder*="Customer Group"]').type("Gold");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Discount %"]').type("10");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should create seasonal discount policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("DISCOUNT");

      cy.get('input[placeholder*="Policy Name"]').type("Summer Sale");

      cy.get('input[placeholder*="Valid From"]').type("2024-06-01");
      cy.get('input[placeholder*="Valid To"]').type("2024-08-31");

      cy.get('input[placeholder*="Discount %"]').type("15");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should edit discount policy", () => {
      cy.visit("/settings/policies");
      cy.get('[data-testid="policy-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Discount %"]').clear().type("8");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Policy updated").should("be.visible");
    });

    it("should activate/deactivate policy", () => {
      cy.visit("/settings/policies");
      cy.get('[data-testid="policy-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="is-active"]').uncheck();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Policy updated").should("be.visible");
    });
  });

  describe("Pricing Policies", () => {
    it("should create pricing policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("PRICING");

      cy.get('input[placeholder*="Policy Name"]').type("Standard Pricing");
      cy.get('textarea[placeholder*="Description"]').type("Base pricing policy");

      cy.get('input[placeholder*="Margin %"]').type("25");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should create category pricing policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("PRICING");

      cy.get('input[placeholder*="Policy Name"]').type("Premium Category Pricing");

      // Assign to category
      cy.get('input[placeholder*="Category"]').type("Sheets");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Margin %"]').type("30");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should create dynamic pricing policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("PRICING");

      cy.get('input[placeholder*="Policy Name"]').type("Dynamic Pricing");

      // Set price adjustment
      cy.get('select[name="Price Adjustment"]').select("COST_PLUS_MARGIN");

      cy.get('input[placeholder*="Margin %"]').type("20");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });
  });

  describe("Return Policies", () => {
    it("should create return policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("RETURN");

      cy.get('input[placeholder*="Policy Name"]').type("Standard Return");
      cy.get('input[placeholder*="Days"]').type("30");

      cy.get('checkbox[name="allow-partial-return"]').check();

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should create category-specific return policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("RETURN");

      cy.get('input[placeholder*="Policy Name"]').type("Premium Return");

      // Assign to category
      cy.get('input[placeholder*="Category"]').type("Specialty");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Days"]').type("60");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should define return restocking charges", () => {
      cy.visit("/settings/policies");
      cy.get('[data-testid="policy-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Restocking %"]').type("10");
      cy.get('textarea[placeholder*="Terms"]').type("Restocking charges apply");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Policy updated").should("be.visible");
    });
  });

  describe("Warranty Policies", () => {
    it("should create warranty policy", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("WARRANTY");

      cy.get('input[placeholder*="Policy Name"]').type("1-Year Warranty");
      cy.get('input[placeholder*="Days"]').type("365");

      cy.get('checkbox[name="covers-manufacturing"]').check();

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should create category warranty", () => {
      cy.visit("/settings/policies");
      cy.get('button:contains("New Policy")').click();

      cy.get('select[name="Policy Type"]').select("WARRANTY");

      cy.get('input[placeholder*="Policy Name"]').type("Extended Warranty");

      // Assign to category
      cy.get('input[placeholder*="Category"]').type("Premium");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Days"]').type("730");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should define warranty terms", () => {
      cy.visit("/settings/policies");
      cy.get('[data-testid="policy-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('textarea[placeholder*="Coverage"]').type("Covers manufacturing defects");
      cy.get('textarea[placeholder*="Exclusions"]').type("Does not cover misuse");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Policy updated").should("be.visible");
    });
  });

  describe("Policy Management", () => {
    it("should view policies by type", () => {
      cy.visit("/settings/policies");

      cy.get('select[name="Type"]').select("DISCOUNT");

      cy.get('[data-testid="policy-row"]').should("have.length.greaterThan", 0);
    });

    it("should search policies", () => {
      cy.visit("/settings/policies");

      cy.get('input[placeholder*="Search"]').type("Discount");

      cy.wait(500);
      cy.get('[data-testid="policy-row"]').should("have.length.greaterThan", 0);
    });

    it("should duplicate policy", () => {
      cy.visit("/settings/policies");
      cy.get('[data-testid="policy-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Duplicate")').click();

      cy.get('input[placeholder*="Policy Name"]').clear().type("Duplicated Policy");

      cy.get('button:contains("Create Policy")').click();
      cy.contains("Policy created").should("be.visible");
    });

    it("should delete policy", () => {
      cy.visit("/settings/policies");
      cy.get('[data-testid="policy-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Policy deleted").should("be.visible");
    });
  });

  describe("Policy Application", () => {
    it("should apply discount policy to invoice", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Select customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Quantity"]').type("150");

      // Verify discount applied
      cy.contains("Volume Discount").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should show policy-adjusted pricing", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Pricing")').click();

      // Verify policy-based price displayed
      cy.contains("Policy Price").should("be.visible");
    });
  });

  describe("Category Analytics", () => {
    it("should view category metrics", () => {
      cy.visit("/settings/categories");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Categories").should("be.visible");
      cy.contains("Total Products").should("be.visible");
    });

    it("should export categories", () => {
      cy.visit("/settings/categories");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/categories-*.csv").should("exist");
    });
  });

  describe("Policy Analytics", () => {
    it("should view policy effectiveness", () => {
      cy.visit("/settings/policies");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Policies").should("be.visible");
      cy.contains("Active Policies").should("be.visible");
    });

    it("should export policies", () => {
      cy.visit("/settings/policies");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/policies-*.csv").should("exist");
    });
  });
});
