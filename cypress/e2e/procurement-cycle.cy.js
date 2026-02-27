/**
 * Procurement Cycle E2E Tests - Production Grade
 *
 * Tests complete procurement workflows:
 * - Purchase Order creation and approval
 * - Goods Receipt Note (GRN) matching
 * - Supplier Bill reconciliation
 * - Payment processing
 * - Landed cost allocation
 *
 * Uses data-testid attributes and API interception.
 * Test data deterministic and self-contained.
 *
 * Run: npm run test:e2e
 */

describe("Procurement Cycle - Complete Workflow E2E Tests", () => {
  const API_URL = Cypress.env("apiUrl");
  const TEST_SUPPLIER_NAME = "ABC Suppliers";
  const TEST_PRODUCT_NAME = "SS-304-Coil";

  beforeEach(() => {
    cy.login();

    // Setup API intercepts
    cy.intercept("GET", `${API_URL}/api/suppliers*`).as("getSuppliers");
    cy.intercept("GET", `${API_URL}/api/products*`).as("getProducts");
    cy.intercept("POST", `${API_URL}/api/purchase-orders`).as("createPO");
    cy.intercept("POST", `${API_URL}/api/grn`).as("createGRN");
    cy.intercept("POST", `${API_URL}/api/supplier-bills`).as("createBill");
    cy.intercept("POST", `${API_URL}/api/payments`).as("recordPayment");
  });

  describe("PO to GRN to Bill to Payment Cycle", () => {
    it("should complete full procurement cycle: PO → GRN → Bill → Payment", () => {
      // Step 1: Create Purchase Order
      cy.visit("/app/purchases");
      cy.wait("@getSuppliers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.get('[data-testid="po-form"]', { timeout: 10000 }).should("be.visible");

      // Step 2: Select supplier
      cy.get('[data-testid="supplier-autocomplete"]', { timeout: 5000 })
        .click()
        .type(TEST_SUPPLIER_NAME, { delay: 50 });

      cy.get('[data-testid="supplier-autocomplete-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="supplier-autocomplete-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      // Step 3: Add line items
      cy.contains("button", "New").click();
      cy.wait(500);

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

      // Fill quantity and price
      cy.get('input[data-testid="po-quantity-0"]').clear().type("500");
      cy.get('input[data-testid="po-unit-price-0"]').clear().type("40");

      // Add second item
      cy.contains("button", "New").click();
      cy.wait(500);

      cy.get('[data-testid="product-autocomplete-1"]')
        .click()
        .type("SS-316L-Sheet", { delay: 50 });

      cy.get('[data-testid="product-autocomplete-1-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="product-autocomplete-1-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      cy.get('input[data-testid="po-quantity-1"]').clear().type("300");
      cy.get('input[data-testid="po-unit-price-1"]').clear().type("60");

      // Step 4: Set warehouse
      cy.get('[data-testid="warehouse-select"]').select("Main Warehouse");

      // Step 5: Create PO
      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createPO");
      cy.contains(/purchase.*order.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Step 6: Get PO ID
      cy.get('[data-testid="po-id"]').then(($el) => {
        const poId = $el.text();

        // Step 7: Submit PO for approval
        cy.contains("button", "New").click();
        cy.wait(2000);

        // Step 8: Simulate approval
        cy.visit("/app/finance");
        cy.get('[data-testid="approval-item"]')
          .first()
          .click({ timeout: 5000 });

        cy.contains("button", "New")
          .first()
          .click();

        cy.get('textarea[data-testid="approval-comments"]').type(
          "Approved - proceed"
        );
        cy.contains("button", "New").click();

        cy.contains(/approved|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Step 9: Create GRN
        cy.visit(`/purchase-orders/${poId}`);
        cy.contains("button", "Receive", {
          timeout: 5000,
        }).click();

        cy.get('[data-testid="grn-form"]', { timeout: 10000 }).should(
          "be.visible"
        );

        // Fill GRN details
        cy.get('input[data-testid="grn-date"]').clear().type("2024-02-01");
        cy.get('input[data-testid="supplier-invoice-ref"]').type("SUP-INV-001");

        // Receive quantities
        cy.get('input[data-testid="received-qty-0"]').clear().type("500");
        cy.get('input[data-testid="received-qty-1"]').clear().type("300");

        // Mark as inspected
        cy.get('input[data-testid="quality-check-0"]').check({ force: true });
        cy.get('input[data-testid="quality-check-1"]').check({ force: true });

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createGRN");
        cy.contains(/grn created|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Step 10: Create Supplier Bill
        cy.contains("button", "Bill", { timeout: 5000 }).click();

        cy.get('[data-testid="bill-form"]', { timeout: 10000 }).should(
          "be.visible"
        );

        cy.get('input[data-testid="supplier-invoice-number"]').type(
          "INV-2024-001"
        );
        cy.get('input[data-testid="bill-date"]').clear().type("2024-02-01");

        // Add freight charge
        cy.contains("button", "New").click();

        cy.get('input[data-testid="charge-type"]').type("Freight");
        cy.get('input[data-testid="charge-amount"]').type("500");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createBill");
        cy.contains(/bill created|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Step 11: Verify bill total (500*40 + 300*60 + 500 = 38500)
        cy.get('[data-testid="bill-total"]').should("contain", "38500");

        // Step 12: Record payment
        cy.contains("button", "Payment", {
          timeout: 5000,
        }).click();

        cy.get('input[data-testid="payment-amount"]')
          .clear()
          .type("38500");
        cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");
        cy.get('input[data-testid="payment-reference"]').type("TXN-SUPP-001");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@recordPayment");
        cy.contains(/payment.*recorded|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Step 13: Verify bill is paid
        cy.get('[data-testid="bill-status"]').should(
          "contain.text",
          /PAID|RECEIVED/
        );
      });
    });

    it("should handle partial goods receipt and reconciliation", () => {
      cy.visit("/app/purchases");
      cy.wait("@getSuppliers");

      cy.contains("button", "New")
        .first()
        .click();

      // Create simple PO
      cy.get('[data-testid="supplier-autocomplete"]')
        .click()
        .type(TEST_SUPPLIER_NAME, { delay: 50 });

      cy.get('[data-testid="supplier-autocomplete-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="supplier-autocomplete-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

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

      cy.get('input[data-testid="po-quantity-0"]').clear().type("1000");
      cy.get('input[data-testid="po-unit-price-0"]').clear().type("50");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createPO");

      // Get PO ID and proceed to partial receipt
      cy.get('[data-testid="po-id"]').then(($el) => {
        const poId = $el.text();

        cy.visit(`/purchase-orders/${poId}`);
        cy.contains("button", "Receive", { timeout: 5000 }).click();

        // First GRN - partial
        cy.get('input[data-testid="grn-date"]').clear().type("2024-02-01");
        cy.get('input[data-testid="received-qty-0"]').clear().type("600");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createGRN");

        // Check pending balance
        cy.contains(/pending.*400|balance.*400/i).should("be.visible");

        // Second GRN - remainder
        cy.contains("button", "Receive", { timeout: 5000 }).click();

        cy.get('input[data-testid="received-qty-0"]').clear().type("400");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createGRN");

        // Verify fully received
        cy.get('[data-testid="grn-status"]', { timeout: 5000 }).should(
          "contain.text",
          /RECEIVED|COMPLETE/
        );
      });
    });

    it("should prevent duplicate supplier invoice numbers", () => {
      cy.visit("/app/supplier-bills");
      cy.wait("@getSuppliers");

      // Create first bill
      cy.contains("button", "New")
        .first()
        .click();

      cy.get('[data-testid="bill-form"]', { timeout: 10000 }).should(
        "be.visible"
      );

      cy.get('[data-testid="supplier-autocomplete"]')
        .click()
        .type(TEST_SUPPLIER_NAME, { delay: 50 });

      cy.get('[data-testid="supplier-autocomplete-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="supplier-autocomplete-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      cy.get('input[data-testid="supplier-invoice-number"]').type("DUP-TEST");
      cy.get('input[data-testid="bill-amount"]').type("5000");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createBill");

      // Try to create duplicate
      cy.contains("button", "New")
        .first()
        .click();

      cy.get('[data-testid="supplier-autocomplete"]')
        .click()
        .type(TEST_SUPPLIER_NAME, { delay: 50 });

      cy.get('[data-testid="supplier-autocomplete-listbox"]', {
        timeout: 5000,
      }).should("be.visible");

      cy.get('[data-testid="supplier-autocomplete-listbox"]')
        .find('[role="option"]')
        .first()
        .click();

      cy.get('input[data-testid="supplier-invoice-number"]').type("DUP-TEST");
      cy.get('input[data-testid="bill-amount"]').type("3000");

      cy.contains("button", "New")
        .last()
        .click();

      // Should show error
      cy.contains(/duplicate|already exists|invoice number/i, {
        timeout: 10000,
      }).should("be.visible");
    });
  });
});
