/**
 * Products Master Data E2E Tests
 *
 * Tests product master data management:
 * - Create, edit, and delete products
 * - Product categorization and classification
 * - SKU and naming conventions
 * - Pricing and cost management
 * - Unit conversions
 * - Product lifecycle and status
 *
 * Run: npm run test:e2e -- --spec '**/products.cy.js'
 */

describe("Products Master Data - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Products", () => {
    it("should create basic product", () => {
      cy.visit("/products");
      cy.get('button:contains("New Product")').click();

      // Basic details
      cy.get('input[placeholder*="Product Name"]').type("SS-304 Coil");
      cy.get('input[placeholder*="SKU"]').type("SS-304-COIL-001");
      cy.get('input[placeholder*="Product Code"]').type("P-001");

      // Category
      cy.get('input[placeholder*="Category"]').type("Stainless Steel");
      cy.get('[role="option"]').first().click();

      // Unit
      cy.get('select[name="Unit"]').select("KG");

      cy.get('button:contains("Create Product")').click();
      cy.contains("Product created successfully").should("be.visible");
    });

    it("should create product with specifications", () => {
      cy.visit("/products");
      cy.get('button:contains("New Product")').click();

      cy.get('input[placeholder*="Product Name"]').type("SS-316L Sheet");
      cy.get('input[placeholder*="SKU"]').type("SS-316L-SHEET-001");

      // Specifications
      cy.get('button:contains("Add Specification")').click();

      cy.get('input[placeholder*="Grade"]').type("316L");
      cy.get('input[placeholder*="Form"]').type("Sheet");
      cy.get('input[placeholder*="Finish"]').type("2B");
      cy.get('input[placeholder*="Thickness"]').type("1.5");

      cy.get('button:contains("Create Product")').click();
      cy.contains("Product created successfully").should("be.visible");
    });

    it("should create product with pricing", () => {
      cy.visit("/products");
      cy.get('button:contains("New Product")').click();

      cy.get('input[placeholder*="Product Name"]').type("SS-430 Plate");
      cy.get('input[placeholder*="SKU"]').type("SS-430-PLATE-001");

      // Pricing
      cy.get('input[placeholder*="Cost Price"]').type("50");
      cy.get('input[placeholder*="Selling Price"]').type("75");

      cy.get('button:contains("Create Product")').click();
      cy.contains("Product created successfully").should("be.visible");
    });

    it("should create product with supplier info", () => {
      cy.visit("/products");
      cy.get('button:contains("New Product")').click();

      cy.get('input[placeholder*="Product Name"]').type("SS-201 Wire");
      cy.get('input[placeholder*="SKU"]').type("SS-201-WIRE-001");

      // Supplier
      cy.get('button:contains("Add Supplier")').click();

      cy.get('input[placeholder*="Supplier"]').type("Supplier A");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Supplier SKU"]').type("SUP-SKU-001");
      cy.get('input[placeholder*="Lead Time"]').type("7");

      cy.get('button:contains("Create Product")').click();
      cy.contains("Product created successfully").should("be.visible");
    });
  });

  describe("Edit Product Details", () => {
    it("should edit product information", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Product Name"]').clear().type("Updated Product Name");
      cy.get('input[placeholder*="Description"]').clear().type("New description");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should update product pricing", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Cost Price"]').clear().type("55");
      cy.get('input[placeholder*="Selling Price"]').clear().type("85");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should update product category", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Category"]').clear();
      cy.get('input[placeholder*="Category"]').type("Specialty Steel");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should update product specifications", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Grade"]').clear().type("304L");
      cy.get('input[placeholder*="Thickness"]').clear().type("2.0");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should add alternate supplier", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Suppliers")').click();

      cy.get('button:contains("Add Supplier")').click();

      cy.get('input[placeholder*="Supplier"]').type("Supplier B");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Supplier SKU"]').type("SUP-SKU-002");
      cy.get('input[placeholder*="Lead Time"]').type("10");

      cy.get('button:contains("Add Supplier")').click();
      cy.contains("Supplier added").should("be.visible");
    });
  });

  describe("Product Categorization", () => {
    it("should assign product category", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Category"]').clear();
      cy.get('input[placeholder*="Category"]').type("Coils");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should set product tags", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Tags"]').type("EXPORT");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should mark product as active/inactive", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="is-active"]').uncheck();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });
  });

  describe("Unit Conversions", () => {
    it("should view product units", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Units")').click();

      cy.contains("Base Unit").should("be.visible");
      cy.get('[data-testid="unit-row"]').should("have.length.greaterThan", 0);
    });

    it("should add alternate unit", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Units")').click();

      cy.get('button:contains("Add Unit")').click();

      cy.get('select[name="Unit"]').select("TON");
      cy.get('input[placeholder*="Conversion Factor"]').type("1000");

      cy.get('button:contains("Add Unit")').click();
      cy.contains("Unit added").should("be.visible");
    });

    it("should set conversion rates between units", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Units")').click();

      cy.get('[data-testid="unit-row"]').first().within(() => {
        cy.get('button:contains("Edit")').click();
      });

      cy.get('input[placeholder*="Conversion Factor"]').clear().type("1100");

      cy.get('button:contains("Save")').click();
      cy.contains("Unit updated").should("be.visible");
    });
  });

  describe("Product Pricing", () => {
    it("should view pricing tiers", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Pricing")').click();

      cy.contains("Base Price").should("be.visible");
      cy.contains("Tier").should("be.visible");
    });

    it("should add price tier", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Pricing")').click();

      cy.get('button:contains("Add Tier")').click();

      cy.get('input[placeholder*="Minimum Qty"]').type("100");
      cy.get('input[placeholder*="Price"]').type("70");

      cy.get('button:contains("Add Tier")').click();
      cy.contains("Tier added").should("be.visible");
    });

    it("should set product margin", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Cost Price"]').type("50");
      cy.get('input[placeholder*="Selling Price"]').type("80");

      // Verify margin calculation
      cy.contains(/37.5% Margin|60% Margin/).should("be.visible");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });
  });

  describe("Product Images & Documents", () => {
    it("should upload product image", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Images")').click();

      cy.get('input[placeholder*="Product Image"]').selectFile("cypress/fixtures/product.jpg");

      cy.get('button:contains("Upload")').click();
      cy.contains("Image uploaded").should("be.visible");
    });

    it("should manage product documents", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Documents")').click();

      cy.get('button:contains("Upload Document")').click();

      cy.get('input[placeholder*="Document"]').selectFile("cypress/fixtures/datasheet.pdf");

      cy.get('button:contains("Upload")').click();
      cy.contains("Document uploaded").should("be.visible");
    });
  });

  describe("Product Search & Filter", () => {
    it("should search product by name", () => {
      cy.visit("/products");

      cy.get('input[placeholder*="Search"]').type("SS-304");

      cy.wait(500);
      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should search product by SKU", () => {
      cy.visit("/products");

      cy.get('input[placeholder*="Search"]').type("SKU-");

      cy.wait(500);
      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter products by category", () => {
      cy.visit("/products");

      cy.get('button:contains("Filters")').click();

      cy.get('input[placeholder*="Category"]').type("Coils");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter products by status", () => {
      cy.visit("/products");

      cy.get('button:contains("Filters")').click();

      cy.get('select[name="Status"]').select("ACTIVE");

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter products by price range", () => {
      cy.visit("/products");

      cy.get('button:contains("Filters")').click();

      cy.get('input[placeholder*="Min Price"]').type("50");
      cy.get('input[placeholder*="Max Price"]').type("100");

      cy.get('button:contains("Apply Filters")').click();

      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Delete Product", () => {
    it("should delete inactive product", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"][data-status="INACTIVE"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Product deleted").should("be.visible");
    });
  });

  describe("Product Analytics", () => {
    it("should view product metrics", () => {
      cy.visit("/products");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Products").should("be.visible");
      cy.contains("Active Products").should("be.visible");
      cy.contains("Total Stock Value").should("be.visible");
    });

    it("should analyze products by category", () => {
      cy.visit("/products");

      cy.get('button:contains("By Category")').click();

      cy.get('[data-testid="category-row"]').should("have.length.greaterThan", 0);
    });

    it("should view slow-moving products", () => {
      cy.visit("/products");

      cy.get('button:contains("Slow Movers")').click();

      cy.get('[data-testid="product-row"]').should("have.length.greaterThan", 0);
    });

    it("should export product list", () => {
      cy.visit("/products");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/products-*.csv").should("exist");
    });
  });
});
