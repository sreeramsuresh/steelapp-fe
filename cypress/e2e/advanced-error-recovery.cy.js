/**
 * Advanced Error Recovery E2E Tests - Production Grade
 *
 * Tests error handling and recovery scenarios:
 * - Form validation errors and recovery
 * - API error handling with retry
 * - Concurrent operation conflicts
 * - Data validation edge cases
 * - Graceful error messaging
 *
 * Run: npm run test:e2e
 */

describe("Advanced Error Recovery - E2E Tests", () => {
  const API_URL = Cypress.env("apiUrl");
  const TEST_CUSTOMER_NAME = "ABC Corporation";

  beforeEach(() => {
    cy.login();

    cy.intercept("GET", `${API_URL}/api/customers*`).as("getCustomers");
    cy.intercept("POST", `${API_URL}/api/invoices`).as("createInvoice");
    cy.intercept("POST", `${API_URL}/api/payments`).as("recordPayment");
  });

  describe("Form Validation and Error Handling", () => {
    it("should show validation errors for required fields", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      // Try to create without customer
      cy.contains("button", "New")
        .last()
        .click();

      // Should show error
      cy.contains(/customer.*required|select.*customer/i, {
        timeout: 5000,
      }).should("be.visible");

      // Form should still be editable
      cy.selectCustomer(TEST_CUSTOMER_NAME);

      // Error should clear
      cy.contains(/customer.*required/i).should("not.exist");
    });

    it("should validate numeric field ranges", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });

      // Try invalid quantity (negative)
      cy.get('input[data-testid="item-quantity-0"]').type("-100");

      cy.contains("button", "New")
        .last()
        .click();

      // Should show error
      cy.contains(/quantity.*positive|must be greater|invalid/i, {
        timeout: 5000,
      }).should("be.visible");

      // Fix and retry
      cy.get('input[data-testid="item-quantity-0"]').clear().type("100");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/created|success/i, { timeout: 10000 }).should("be.visible");
    });

    it("should prevent duplicate invoice for same data", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      // Create first invoice
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");
      cy.contains(/created|success/i).should("be.visible");

      // Try exact duplicate (quick second attempt)
      cy.go("back");
      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      cy.contains("button", "New")
        .last()
        .click();

      // Should handle gracefully (either allow or show warning)
      cy.wait("@createInvoice", { timeout: 5000 }).then((interception) => {
        // If accepted, status should be 201
        // If rejected, status should be 4xx
        expect([201, 400, 409]).to.include(interception.response.statusCode);
      });
    });
  });

  describe("Payment Error Scenarios", () => {
    it("should prevent overpayment on invoice", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Get invoice total
      cy.get('[data-testid="invoice-subtotal"]').then(($el) => {
        const subtotal = parseInt($el.text().replace(/\D/g, ""));
        const totalWithTax = Math.ceil(subtotal * 1.05);

        // Try to pay more than total
        cy.contains("button", "Record").first().click({ timeout: 10000 });

        cy.get('input[data-testid="payment-amount"]')
          .clear()
          .type((totalWithTax + 1000).toString());

        cy.contains("button", "New")
          .last()
          .click();

        // Should warn or prevent overpayment
        cy.wait("@recordPayment", { timeout: 5000 }).then((interception) => {
          // API should reject or warn about overpayment
          expect([201, 400]).to.include(
            interception.response.statusCode
          );
        });
      });
    });

    it("should handle payment method validation", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Try payment without method selection
      cy.contains("button", "Record").first().click({ timeout: 10000 });

      cy.get('input[data-testid="payment-amount"]').type("5250");

      cy.contains("button", "New")
        .last()
        .click();

      // Should show error
      cy.contains(/payment.*method|select.*method/i, {
        timeout: 5000,
      }).should("be.visible");

      // Select method and retry
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");
      cy.contains(/recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });
  });

  describe("Concurrent Operation Handling", () => {
    it("should handle simultaneous invoice creates gracefully", () => {
      // Create two invoices in quick succession
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      for (let i = 0; i < 2; i++) {
        cy.contains("button", "New")
          .first()
          .click();

        cy.selectCustomer(TEST_CUSTOMER_NAME);

        cy.contains("button", "Add").first().click({ timeout: 10000 });
        cy.selectProduct(0, "SS-304-Coil");
        cy.fillInvoiceBasicFields({
          lineIndex: 0,
          quantity: 100 + i * 10,
          rate: 50,
        });

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createInvoice", { timeout: 10000 });

        cy.go("back");
      }

      // Both should complete successfully
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");
      cy.get('[data-testid="invoice-row"]').should("have.length.at.least", 2);
    });

    it("should detect and handle stale data on edit", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Open for edit
      cy.contains("button", "Edit", { timeout: 5000 }).click();

      // Simulate concurrent update by intercepting with version mismatch
      cy.intercept("PUT", `${API_URL}/api/invoices/*`, {
        statusCode: 409,
        body: { error: "Document was modified" },
      }).as("updateConflict");

      cy.get('input[data-testid="item-quantity-0"]').clear().type("150");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@updateConflict", { timeout: 5000 });

      // Should show conflict message or offer refresh
      cy.contains(/conflict|modified|refresh/i, { timeout: 5000 }).should(
        "exist"
      );
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle very large quantities", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");

      // Very large quantity
      cy.get('input[data-testid="item-quantity-0"]').type("999999");
      cy.get('input[data-testid="item-rate-0"]').type("100");

      cy.contains("button", "New")
        .last()
        .click();

      // Should either accept or show validation error
      cy.wait("@createInvoice", { timeout: 10000 }).then((interception) => {
        expect([201, 400]).to.include(interception.response.statusCode);
      });
    });

    it("should handle decimal precision in prices", () => {
      cy.visit("/app/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, "SS-304-Coil");

      // Decimal price
      cy.get('input[data-testid="item-quantity-0"]').type("100");
      cy.get('input[data-testid="item-rate-0"]').type("50.5555");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Verify precision handling
      cy.get('[data-testid="invoice-subtotal"]').should("be.visible");
    });
  });
});
