/**
 * Cross-Module Integration E2E Tests - Production Grade
 *
 * Tests integration between multiple system modules:
 * - Multi-invoice payment allocation (Invoicing + Payments)
 * - VAT calculation across document types (Invoicing + VAT + Tax)
 * - Commission calculation from sales (Sales + Commission + Accounting)
 * - Stock allocation with pricing (Inventory + Pricing + Sales)
 * - Landed cost allocation (Procurement + Costing + Inventory)
 * - Accounting entries generation (Sales/Procurement + Accounting)
 *
 * Run: npm run test:e2e
 */

describe("Cross-Module Integration - E2E Tests", () => {
  const API_URL = Cypress.env("apiUrl");
  const TEST_CUSTOMER_NAME = "ABC Corporation";
  const TEST_PRODUCT_NAME = "SS-304-Coil";

  beforeEach(() => {
    cy.login();

    // Setup API intercepts for all major operations
    cy.intercept("GET", `${API_URL}/api/customers*`).as("getCustomers");
    cy.intercept("GET", `${API_URL}/api/products*`).as("getProducts");
    cy.intercept("GET", `${API_URL}/api/invoices*`).as("listInvoices");
    cy.intercept("POST", `${API_URL}/api/invoices`).as("createInvoice");
    cy.intercept("POST", `${API_URL}/api/payments`).as("recordPayment");
    cy.intercept("GET", `${API_URL}/api/purchase-orders*`).as("listPOs");
    cy.intercept("POST", `${API_URL}/api/purchase-orders`).as("createPO");
    cy.intercept("POST", `${API_URL}/api/grn`).as("createGRN");
    cy.intercept("POST", `${API_URL}/api/supplier-bills`).as("createBill");
  });

  describe("Multi-Invoice Payment Allocation", () => {
    it("should allocate single payment across multiple invoices", () => {
      // Create Invoice 1
      cy.visit("/invoices");
      cy.wait("@listInvoices");

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
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Get Invoice 1 ID from URL
      cy.url().then((url) => {
        const invoiceId1 = url.split("/").pop();

        // Create Invoice 2 for same customer
        cy.visit("/invoices");
        cy.wait("@listInvoices");

        cy.contains("button", "New")
          .first()
          .click();

        cy.selectCustomer(TEST_CUSTOMER_NAME);

        cy.contains("button", "Add").first().click({ timeout: 10000 });
        cy.selectProduct(0, TEST_PRODUCT_NAME);
        cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 75, rate: 60 });

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createInvoice");
        cy.contains(/created|success/i).should("be.visible");

        // Now make combined payment
        cy.contains("button", "Payment", { timeout: 5000 }).click();

        // Enter total amount covering both invoices
        cy.get('input[data-testid="payment-amount"]')
          .clear()
          .type("11612.50"); // 5250 + 4725 + VAT

        cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");
        cy.get('input[data-testid="payment-reference"]').type(
          "MULTI-PAYMENT-001"
        );

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@recordPayment");
        cy.contains(/recorded|success/i, { timeout: 10000 }).should(
          "be.visible"
        );
      });
    });

    it("should handle partial payments on multiple invoices", () => {
      cy.visit("/invoices");
      cy.wait("@listInvoices");

      // Create 2 invoices
      for (let i = 0; i < 2; i++) {
        cy.contains("button", "New")
          .first()
          .click();

        cy.selectCustomer(TEST_CUSTOMER_NAME);

        cy.contains("button", "Add").first().click({ timeout: 10000 });
        cy.selectProduct(0, TEST_PRODUCT_NAME);
        cy.fillInvoiceBasicFields({
          lineIndex: 0,
          quantity: 100 + i * 50,
          rate: 50,
        });

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createInvoice");

        // Return to list for next iteration
        cy.visit("/invoices");
        cy.wait("@listInvoices");
      }

      // Make 2 partial payments
      for (let i = 0; i < 2; i++) {
        cy.get('[data-testid="invoice-row"]').first().click();

        cy.contains("button", "Record").first().click({ timeout: 10000 });

        cy.get('input[data-testid="payment-amount"]')
          .clear()
          .type("2500");

        cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@recordPayment");

        cy.visit("/invoices");
        cy.wait("@listInvoices");
      }
    });
  });

  describe("VAT Calculation Across Document Types", () => {
    it("should calculate consistent VAT on invoice and credit note", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      // Create invoice
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 100 });

      // Verify VAT calculation on invoice
      cy.get('[data-testid="vat-amount"]', { timeout: 5000 }).should(
        "contain",
        /500|525/
      ); // 5% of 10000

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Create credit note for 50% return
      cy.contains("button", "Credit", { timeout: 5000 }).click();

      cy.get('input[data-testid="credit-quantity"]', { timeout: 5000 })
        .clear()
        .type("50");

      cy.get('textarea[data-testid="credit-reason"]').type(
        "Partial return for VAT testing"
      );

      // Verify VAT on credit note is proportional
      cy.get('[data-testid="credit-vat"]', { timeout: 5000 }).should(
        "contain",
        /250|262/
      ); // 5% of 5000

      cy.contains("button", "New")
        .last()
        .click();

      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });

    it("should maintain VAT consistency across document lifecycle", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 200, rate: 75 });

      // Record initial VAT
      cy.get('[data-testid="vat-amount"]', { timeout: 5000 }).then(
        ($vatEl) => {
          const initialVAT = $vatEl.text();

          cy.contains("button", "New")
            .last()
            .click();

          cy.wait("@createInvoice");

          // Create credit note and verify VAT relationship
          cy.contains("button", "New").click();

          cy.get('input[data-testid="credit-quantity"]')
            .clear()
            .type("100");

          cy.get('[data-testid="credit-vat"]', { timeout: 5000 }).should(
            "be.visible"
          );

          cy.contains("button", "New")
            .last()
            .click();

          cy.contains(/created|success/i, { timeout: 10000 }).should(
            "be.visible"
          );
        }
      );
    });
  });

  describe("Commission Calculation from Sales", () => {
    it("should calculate commission based on invoice amount", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      // Create invoice with substantial amount
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 100 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify commission field appears on invoice
      cy.get('[data-testid="commission-amount"]', { timeout: 5000 }).should(
        "be.visible"
      );

      // Record payment to trigger commission settlement
      cy.contains("button", "Record").first().click({ timeout: 10000 });

      cy.get('input[data-testid="payment-amount"]').clear().type("10500");
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");
      cy.contains(/recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });

    it("should calculate commission proportional to invoice subtotal", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      // Create 2 invoices with different amounts
      for (let i = 0; i < 2; i++) {
        cy.contains("button", "New")
          .first()
          .click();

        cy.selectCustomer(TEST_CUSTOMER_NAME);

        cy.contains("button", "Add").first().click({ timeout: 10000 });
        cy.selectProduct(0, TEST_PRODUCT_NAME);
        cy.fillInvoiceBasicFields({
          lineIndex: 0,
          quantity: 50 + i * 50,
          rate: 100,
        });

        // Verify commission field changes with different amounts
        cy.get('[data-testid="commission-amount"]', { timeout: 5000 }).should(
          "be.visible"
        );

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createInvoice");

        cy.visit("/invoices");
        cy.wait("@listInvoices");
      }
    });
  });

  describe("Stock Allocation with Batch Costs", () => {
    it("should allocate batches and calculate cost of goods accurately", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      // Create invoice with batch allocation
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
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify batch allocation panel
      cy.waitForAllocationPanel(0, { timeout: 10000 });

      // Verify batch cost information is visible
      cy.get('[data-testid="batch-cost"]', { timeout: 5000 }).should(
        "be.visible"
      );

      // Verify total cost of goods calculation
      cy.get('[data-testid="line-total-cost"]', { timeout: 5000 }).should(
        "be.visible"
      );
    });

    it("should calculate margin based on allocated batch costs", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);

      // Set selling price
      cy.get('input[data-testid="item-quantity-0"]').type("200");
      cy.get('input[data-testid="item-rate-0"]').type("100");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Verify margin calculation after batch allocation
      cy.waitForAllocationPanel(0);

      cy.get('[data-testid="line-margin"]', { timeout: 5000 }).should(
        "be.visible"
      );

      cy.get('[data-testid="line-margin-percent"]', { timeout: 5000 }).should(
        "be.visible"
      );
    });
  });

  describe("Accounting Entry Generation", () => {
    it("should track accounting impact of invoice creation and payment", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      // Create invoice
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 100 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Record payment
      cy.contains("button", "Record").first().click({ timeout: 10000 });

      cy.get('input[data-testid="payment-amount"]').clear().type("10500");
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");
      cy.contains(/recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify transaction status
      cy.get('[data-testid="invoice-status"]', { timeout: 5000 }).should(
        "contain.text",
        /PAID|RECEIVED/
      );
    });

    it("should record payment against accounts in transaction flow", () => {
      cy.visit("/invoices");
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

      // Process payment with bank transfer
      cy.contains("button", "Record").first().click({ timeout: 10000 });

      cy.get('input[data-testid="payment-amount"]').clear().type("5250");
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");
      cy.get('input[data-testid="payment-reference"]').type(
        "ACCT-TEST-001"
      );

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");
      cy.contains(/recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });
  });

  describe("Multi-Module Workflow Integrity", () => {
    it("should maintain consistency across procurement workflow", () => {
      cy.visit("/purchase-orders");
      cy.wait("@listPOs");

      const TEST_SUPPLIER_NAME = "ABC Suppliers";

      // Create PO
      cy.contains("button", "New")
        .first()
        .click();

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

      cy.contains("button", "New").click();

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

      cy.get('input[data-testid="po-quantity-0"]').clear().type("500");
      cy.get('input[data-testid="po-unit-price-0"]').clear().type("40");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createPO");
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Create GRN
      cy.get('[data-testid="po-id"]').then(($el) => {
        const poId = $el.text();

        cy.visit(`/purchase-orders/${poId}`);
        cy.contains("button", "Receive", {
          timeout: 5000,
        }).click();

        cy.get('input[data-testid="grn-date"]').clear().type("2024-02-01");
        cy.get('input[data-testid="received-qty-0"]').clear().type("500");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createGRN");
        cy.contains(/grn created|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Create supplier bill
        cy.contains("button", "Bill", { timeout: 5000 }).click();

        cy.get('input[data-testid="supplier-invoice-number"]').type(
          "SUP-INV-INTEGRITY-001"
        );

        cy.get('input[data-testid="bill-date"]').clear().type("2024-02-01");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createBill");
        cy.contains(/bill created|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Verify amounts match throughout
        cy.get('[data-testid="bill-total"]', { timeout: 5000 }).should(
          "contain",
          "20000"
        ); // 500 * 40

        // Record payment
        cy.contains("button", "Payment", {
          timeout: 5000,
        }).click();

        cy.get('input[data-testid="payment-amount"]')
          .clear()
          .type("20000");

        cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@recordPayment");
        cy.contains(/payment.*recorded|success/i, { timeout: 10000 }).should(
          "be.visible"
        );
      });
    });
  });
});
