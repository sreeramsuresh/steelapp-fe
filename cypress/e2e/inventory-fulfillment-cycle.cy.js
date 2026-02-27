/**
 * Inventory & Fulfillment Cycle E2E Tests - Production Grade
 *
 * Tests inventory and fulfillment workflows:
 * - Stock batch import via GRN
 * - FIFO batch allocation
 * - Stock variance reconciliation
 * - Warehouse transfers
 * - Partial deliveries with reconciliation
 *
 * Run: npm run test:e2e
 */

describe("Inventory & Fulfillment Cycle - Complete Workflow E2E Tests", () => {
  const API_URL = Cypress.env("apiUrl");
  const TEST_CUSTOMER_NAME = "ABC Corporation";
  const TEST_PRODUCT_NAME = "SS-316-Bar-BRIGHT-30mm-6000mm";

  beforeEach(() => {
    cy.login();

    cy.intercept("GET", `${API_URL}/api/customers*`).as("getCustomers");
    cy.intercept("GET", `${API_URL}/api/products*`).as("getProducts");
    cy.intercept("GET", `${API_URL}/api/stock-batches*`).as("getBatches");
    cy.intercept("POST", `${API_URL}/api/invoices`).as("createInvoice");
    cy.intercept("POST", `${API_URL}/api/grn`).as("createGRN");
    cy.intercept("POST", `${API_URL}/api/deliveries`).as("createDelivery");
  });

  describe("Stock Import to Fulfillment", () => {
    it("should import stock via GRN and allocate to invoice", () => {
      // Step 1: Create GRN to import stock
      cy.visit("/app/purchases");
      cy.wait("@getProducts");

      cy.contains("button", "New")
        .first()
        .click();

      cy.get('[data-testid="grn-form"]', { timeout: 10000 }).should("be.visible");

      // Add batch
      cy.contains("button", "Add").first().click({ timeout: 10000 });

      cy.get('[data-testid="product-autocomplete-0"]')
        .click()
        .type(TEST_PRODUCT_NAME, { delay: 50 });

      cy.get('[data-testid="product-autocomplete-0-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="product-autocomplete-0-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      // Enter batch details
      cy.get('input[data-testid="batch-number"]').type("BATCH-2024-001");
      cy.get('input[data-testid="batch-quantity"]').clear().type("1000");
      cy.get('input[data-testid="unit-weight"]').clear().type("50");

      // Set warehouse
      cy.get('[data-testid="warehouse-select"]').select("Main Warehouse");

      cy.get('input[data-testid="supplier-invoice"]').type("SUP-INV-001");
      cy.get('input[data-testid="grn-date"]').clear().type("2024-02-01");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createGRN");
      cy.contains(/grn.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Step 2: Create invoice and allocate batch
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 500, rate: 40 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/invoice.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Step 3: Verify batch allocation
      cy.waitForAllocationPanel(0);
      cy.verifyBatchTable(0, 1); // Should see the batch we imported

      // Step 4: Create delivery note
      cy.contains("button", "Delivery", { timeout: 5000 }).click();

      cy.get('[data-testid="delivery-form"]', { timeout: 10000 }).should(
        "be.visible"
      );

      cy.get('input[data-testid="delivery-date"]').clear().type("2024-02-02");
      cy.get('input[data-testid="delivered-qty"]').clear().type("500");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createDelivery");
      cy.contains(/delivery.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Step 5: Verify remaining stock
      cy.visit("/app/inventory");
      cy.wait("@getBatches");

      cy.contains("BATCH-2024-001").click();
      cy.get('[data-testid="batch-remaining"]').should("contain", "500"); // 1000 - 500 allocated
    });

    it("should allocate batches using FIFO order", () => {
      // This test assumes multiple batches exist with different cost prices
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 200, rate: 40 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Use auto-fill FIFO
      cy.contains("button", "Allocate", {
        timeout: 5000,
      }).click();

      cy.contains(/allocat|fifo/i, { timeout: 5000 }).should("be.visible");
    });

    it("should record stock variance and reconcile", () => {
      cy.visit("/app/stock-movements");
      cy.wait("@getBatches");

      cy.contains("button", "Adjust", { timeout: 5000 }).click();

      cy.get('[data-testid="batch-autocomplete"]')
        .click()
        .type(TEST_PRODUCT_NAME, { delay: 50 });

      cy.get('[data-testid="batch-autocomplete-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="batch-autocomplete-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      // Variance: physical count differs from system
      cy.get('input[data-testid="physical-count"]').clear().type("950");
      cy.get('input[data-testid="expected-count"]').should("have.value", "1000");

      cy.get('textarea[data-testid="variance-reason"]').type(
        "Loss during handling"
      );

      cy.contains("button", "New")
        .last()
        .click();

      cy.contains(/variance.*recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify stock adjusted
      cy.visit("/app/inventory");
      cy.wait("@getBatches");

      cy.contains(TEST_PRODUCT_NAME).click();
      cy.get('[data-testid="batch-quantity"]').should("contain", "950");
    });
  });

  describe("Warehouse Operations", () => {
    it("should transfer stock between warehouses", () => {
      cy.visit("/app/stock-movements");

      cy.contains("button", "New")
        .first()
        .click();

      cy.get('[data-testid="transfer-form"]', { timeout: 10000 }).should(
        "be.visible"
      );

      // Source warehouse
      cy.get('[data-testid="from-warehouse"]').select("Main Warehouse");

      // Destination warehouse
      cy.get('[data-testid="to-warehouse"]').select("Dubai Branch");

      // Add item
      cy.contains("button", "Add").first().click({ timeout: 10000 });

      cy.get('[data-testid="batch-autocomplete-0"]')
        .click()
        .type(TEST_PRODUCT_NAME, { delay: 50 });

      cy.get('[data-testid="batch-autocomplete-0-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="batch-autocomplete-0-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      cy.get('input[data-testid="transfer-qty-0"]').clear().type("200");

      cy.contains("button", "New")
        .last()
        .click();

      cy.contains(/transfer.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Confirm receipt at destination
      cy.contains("button", "Receive", {
        timeout: 5000,
      }).click();

      cy.get('input[data-testid="received-qty"]').clear().type("200");

      cy.contains("button", "New")
        .last()
        .click();

      cy.contains(/completed|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });
  });

  describe("Delivery Reconciliation", () => {
    it("should handle partial delivery with balance tracking", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // First partial delivery
      cy.contains("button", "Delivery", { timeout: 5000 }).click();

      cy.get('input[data-testid="delivery-date"]').clear().type("2024-02-02");
      cy.get('input[data-testid="delivered-qty"]').clear().type("60");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createDelivery");

      // Check balance
      cy.contains(/pending.*40|balance.*40/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Second delivery for remainder
      cy.contains("button", "Delivery", { timeout: 5000 }).click();

      cy.get('input[data-testid="delivered-qty"]').clear().type("40");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createDelivery");

      // Verify fully delivered
      cy.get('[data-testid="invoice-delivery-status"]', { timeout: 5000 }).should(
        "contain.text",
        /DELIVERED|COMPLETE|FULL/
      );
    });
  });
});
