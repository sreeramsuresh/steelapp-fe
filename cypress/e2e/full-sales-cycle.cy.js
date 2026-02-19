/**
 * Full Sales Cycle E2E Tests - Production Grade
 *
 * Tests complete end-to-end sales workflows:
 * - Quotation creation and approval
 * - Invoice conversion and processing
 * - Payment allocation and reconciliation
 * - Credit note handling
 * - Delivery note integration
 *
 * Uses data-testid attributes and API interception for reliability.
 * Test data is deterministic and self-contained.
 *
 * Run: npm run test:e2e
 */

describe("Full Sales Cycle - Complete Workflow E2E Tests", () => {
  const API_URL = Cypress.env("apiUrl");
  const TEST_CUSTOMER_NAME = "ABC Corporation";
  const TEST_PRODUCT_NAME = "SS-316-Bar-BRIGHT-30mm-6000mm";

  beforeEach(() => {
    // Login with test credentials
    cy.login();

    // Setup API intercepts for all major operations
    cy.intercept("GET", `${API_URL}/api/customers*`).as("getCustomers");
    cy.intercept("GET", `${API_URL}/api/products*`).as("getProducts");
    cy.intercept("GET", `${API_URL}/api/quotations*`).as("getQuotations");
    cy.intercept("POST", `${API_URL}/api/quotations`).as("createQuotation");
    cy.intercept("POST", `${API_URL}/api/invoices`).as("createInvoice");
    cy.intercept("POST", `${API_URL}/api/payments`).as("recordPayment");
  });

  describe("Quote to Invoice to Payment Cycle", () => {
    it("should complete full sales cycle: quotation → approval → invoice → payment", () => {
      // Step 1: Navigate to quotations
      cy.visit("/quotations");
      cy.wait("@getQuotations", { timeout: 10000 });
      cy.contains(/quotation/i).should("be.visible");

      // Step 2: Create new quotation - click New button
      cy.contains("button", "New").first().click({ timeout: 10000 });

      // Step 3: Select customer using custom command
      cy.selectCustomer(TEST_CUSTOMER_NAME);

      // Step 4: Wait for form to be ready
      cy.get('[data-testid="quotation-form"]', { timeout: 10000 }).should(
        "be.visible"
      );

      // Step 5: Add first line item
      cy.contains("button", "New").click();
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      // Step 6: Add second line item
      cy.contains("button", "New").click();
      cy.selectProduct(1, "SS-304-Coil"); // Using a different product
      cy.fillInvoiceBasicFields({ lineIndex: 1, quantity: 50, rate: 75 });

      // Step 7: Set quotation validity
      cy.get('input[data-testid="valid-until"]', { timeout: 5000 })
        .clear()
        .type("2024-12-31");

      // Step 8: Create quotation
      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createQuotation");
      cy.contains(/quotation created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Step 9: Capture quotation ID from URL or data attribute
      cy.get('[data-testid="quotation-id"]').then(($el) => {
        const quotationId = $el.text();

        // Step 10: Submit for approval
        cy.contains("button", "New").click();

        // Wait for approval submission
        cy.wait(2000);

        // Step 11: Approve the quotation (simulate manager approval)
        cy.visit("/approvals");
        cy.wait("@getQuotations");

        // Click on pending quotation
        cy.get('[data-testid="approval-item"]')
          .first()
          .click({ timeout: 5000 });

        // Approve button
        cy.contains("button", "New")
          .first()
          .click();

        // Add approval comment
        cy.get('textarea[data-testid="approval-comments"]', {
          timeout: 5000
        }).type("Approved - proceed with invoice");

        // Confirm approval
        cy.contains("button", "New").click();

        cy.contains(/approved|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Step 12: Convert quotation to invoice
        cy.visit(`/quotations/${quotationId}`);
        cy.contains("button", "New").click();

        // Set invoice date
        cy.get('input[data-testid="invoice-date"]', { timeout: 5000 })
          .clear()
          .type(new Date().toISOString().split("T")[0]);

        // Create invoice
        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createInvoice");
        cy.contains(/invoice created|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Step 13: Verify invoice totals
        cy.get('[data-testid="invoice-subtotal"]', { timeout: 5000 }).should(
          "contain",
          "8750"
        ); // 100*50 + 50*75

        // Step 14: Record payment
        cy.contains("button", "New").click();

        // Get invoice ID for payment
        cy.get('[data-testid="invoice-id"]').then(($inv) => {
          const invoiceId = $inv.text();

          // Fill payment amount
          cy.get('input[data-testid="payment-amount"]', { timeout: 5000 })
            .clear()
            .type("9187.50"); // Including VAT

          // Select payment method
          cy.get('[data-testid="payment-method"]', { timeout: 5000 }).select(
            "BANK_TRANSFER"
          );

          // Add reference
          cy.get('input[data-testid="payment-reference"]').type(
            "TXN-TEST-001"
          );

          // Record payment
          cy.contains("button", "New")
            .last()
            .click();

          cy.wait("@recordPayment");
          cy.contains(/payment.*recorded|success/i, { timeout: 10000 }).should(
            "be.visible"
          );

          // Step 15: Verify invoice status is PAID or RECEIVED
          cy.get('[data-testid="invoice-status"]', { timeout: 5000 }).should(
            "contain.text",
            /RECEIVED|PAID/
          );
        });
      });
    });

    it("should handle quotation with discount and carry to invoice", () => {
      cy.visit("/quotations");
      cy.wait("@getQuotations");

      // Create quotation
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      // Add line item
      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 100 });

      // Apply discount
      cy.contains("button", "Discount").first().click({ timeout: 5000 });

      cy.get('input[data-testid="discount-percent"]').type("10");
      cy.contains("button", "New").click();

      // Verify discount applied
      cy.contains(/discount.*1000|savings/i).should("be.visible");

      // Create quotation
      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createQuotation");
      cy.contains(/created|success/i).should("be.visible");

      // Convert to invoice
      cy.contains("button", "New").click();

      cy.get('input[data-testid="invoice-date"]').clear().type("2024-02-01");
      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Verify discount is on invoice (9000 = 10000 - 1000)
      cy.get('[data-testid="invoice-subtotal"]').should("contain", "9000");
    });

    it("should handle partial payment allocation", () => {
      // Create invoice
      cy.visit("/invoices");
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      // Add items
      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 100 });

      // Create invoice
      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/created|success/i).should("be.visible");

      // First partial payment (50%)
      cy.contains("button", "New").click();

      cy.get('input[data-testid="payment-amount"]').clear().type("5250"); // 50% of total
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");
      cy.get('input[data-testid="payment-reference"]').type("PARTIAL-1");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");
      cy.contains(/recorded|success/i).should("be.visible");

      // Second partial payment (remaining)
      cy.contains("button", "New").click();

      cy.get('input[data-testid="payment-amount"]').clear().type("5250");
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");
      cy.get('input[data-testid="payment-reference"]').type("PARTIAL-2");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");

      // Verify invoice is fully paid
      cy.get('[data-testid="invoice-status"]').should(
        "contain.text",
        /RECEIVED|PAID/
      );
    });
  });

  describe("Credit Note and Delivery Workflows", () => {
    it("should create credit note and apply to future invoice", () => {
      // Create initial invoice
      cy.visit("/invoices");
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

      // Create credit note (20% return)
      cy.contains("button", "Credit").click({ timeout: 5000 });

      cy.get('input[data-testid="credit-quantity"]', { timeout: 5000 })
        .clear()
        .type("20");

      cy.get('textarea[data-testid="credit-reason"]').type(
        "Product return - damage in shipment"
      );

      cy.contains("button", "New")
        .last()
        .click();

      cy.contains(/credit.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify credit amount
      cy.get('[data-testid="credit-amount"]').should("contain", "1000"); // 20 * 50
    });

    it("should reconcile delivery notes with invoice quantities", () => {
      // Create invoice
      cy.visit("/invoices");
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

      // Create partial delivery
      cy.contains("button", "Delivery").click({ timeout: 5000 });

      cy.get('input[data-testid="delivery-date"]', { timeout: 5000 })
        .clear()
        .type(new Date().toISOString().split("T")[0]);

      cy.get('input[data-testid="delivered-qty"]')
        .clear()
        .type("75"); // Partial delivery

      cy.contains("button", "New")
        .last()
        .click();

      cy.contains(/delivery.*created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify pending balance
      cy.contains(/pending.*25|balance.*25/i).should("be.visible");

      // Create second delivery for remainder
      cy.contains("button", "Delivery").click({ timeout: 5000 });

      cy.get('input[data-testid="delivered-qty"]')
        .clear()
        .type("25");

      cy.contains("button", "New")
        .last()
        .click();

      // Verify fully delivered
      cy.get('[data-testid="delivery-status"]', { timeout: 5000 }).should(
        "contain.text",
        /DELIVERED|COMPLETE/
      );
    });
  });
});
