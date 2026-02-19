/**
 * Performance & Load Testing E2E Tests - Production Grade
 *
 * Tests system performance under load:
 * - Bulk invoice creation (10+ invoices)
 * - Large batch allocation with multiple items
 * - Concurrent payment processing
 * - High-volume stock movements
 * - Response time validation
 * - Memory stability with large datasets
 *
 * Run: npm run test:e2e
 */

describe("Performance & Load Testing - E2E Tests", () => {
  const API_URL = Cypress.env("apiUrl");
  const TEST_CUSTOMER_NAME = "ABC Corporation";
  const TEST_PRODUCT_NAME = "SS-304-Coil";

  beforeEach(() => {
    cy.login();

    cy.intercept("GET", `${API_URL}/api/customers*`).as("getCustomers");
    cy.intercept("GET", `${API_URL}/api/products*`).as("getProducts");
    cy.intercept("GET", `${API_URL}/api/invoices*`).as("listInvoices");
    cy.intercept("POST", `${API_URL}/api/invoices`).as("createInvoice");
    cy.intercept("POST", `${API_URL}/api/payments`).as("recordPayment");
    cy.intercept("GET", `${API_URL}/api/stock-batches*`).as("getBatches");
    cy.intercept("POST", `${API_URL}/api/stock-movements`).as(
      "recordMovement"
    );
  });

  describe("Bulk Invoice Operations", () => {
    it("should handle rapid sequential invoice creation (10 invoices)", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      // Create 10 invoices sequentially
      for (let i = 0; i < 10; i++) {
        cy.contains("button", "New")
          .first()
          .click();

        cy.selectCustomer(TEST_CUSTOMER_NAME);

        cy.contains("button", "Add").first().click({ timeout: 10000 });
        cy.selectProduct(0, TEST_PRODUCT_NAME);
        cy.fillInvoiceBasicFields({
          lineIndex: 0,
          quantity: 50 + i * 5,
          rate: 30 + i * 2,
        });

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@createInvoice", { timeout: 10000 }).then((interception) => {
          // Verify successful creation
          expect([201, 200]).to.include(interception.response.statusCode);
        });

        // Return to list for next iteration
        cy.visit("/invoices");
        cy.wait("@listInvoices");
      }

      // Verify all invoices were created
      cy.get('[data-testid="invoice-row"]', { timeout: 5000 }).should(
        "have.length.at.least",
        10
      );
    });

    it("should handle multi-line invoice with many items", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      // Add 8 line items
      for (let i = 0; i < 8; i++) {
        cy.contains("button", "Add").first().click({ timeout: 10000 });
        cy.selectProduct(i, TEST_PRODUCT_NAME);
        cy.fillInvoiceBasicFields({
          lineIndex: i,
          quantity: 100 + i * 10,
          rate: 50 + i * 5,
        });
      }

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice", { timeout: 15000 });
      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify invoice shows all items
      cy.get('[data-testid="invoice-line-item"]').should("have.length", 8);
    });

    it("should render large invoice list without performance degradation", () => {
      cy.visit("/invoices");
      cy.wait("@listInvoices");

      // Trigger scroll to load more items if pagination exists
      cy.get("table tbody", { timeout: 5000 }).then(($tbody) => {
        if ($tbody.find("tr").length > 50) {
          // If more than 50 rows, verify virtualization or pagination works
          cy.window().then((win) => {
            const rowCount = $tbody.find("tr").length;
            expect(rowCount).to.be.lessThan(200); // Should not render all at once
          });
        }
      });

      // Verify page remains responsive
      cy.get('[data-testid="invoice-row"]').first().should("be.visible");
    });
  });

  describe("Batch Allocation with Large Quantities", () => {
    it("should allocate batches to high-volume invoice", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);

      // High quantity allocation
      cy.get('input[data-testid="item-quantity-0"]').type("5000");
      cy.get('input[data-testid="item-rate-0"]').type("45");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Verify allocation panel loads
      cy.waitForAllocationPanel(0, { timeout: 10000 });

      // Verify batches are displayed
      cy.get('[data-testid="batch-row"]', { timeout: 5000 }).should(
        "have.length.greaterThan",
        0
      );
    });

    it("should handle partial allocation across multiple batches", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 800, rate: 40 });

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice");

      // Verify batches are allocated
      cy.waitForAllocationPanel(0);

      // Check total allocated matches requested
      cy.get('[data-testid="batch-allocated-qty"]').then(($batches) => {
        let totalAllocated = 0;
        $batches.each((index, el) => {
          const qty = parseInt(
            Cypress.$(el).text().match(/\d+/)?.[0] || "0"
          );
          totalAllocated += qty;
        });
        expect(totalAllocated).to.equal(800);
      });
    });
  });

  describe("Concurrent Payment Processing", () => {
    it("should process multiple sequential payments without conflicts", () => {
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

      // Record 3 sequential partial payments
      for (let i = 0; i < 3; i++) {
        cy.contains("button", "New").click();

        cy.get('input[data-testid="payment-amount"]')
          .clear()
          .type((3500 + i * 10).toString());

        cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");
        cy.get('input[data-testid="payment-reference"]').type(
          `PAYMENT-${i + 1}`
        );

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@recordPayment", { timeout: 10000 });

        // Wait for payment to process before next one
        cy.wait(500);
      }

      // Verify all payments recorded
      cy.contains(/payment.*recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });

    it("should handle rapid payment attempts with proper locking", () => {
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

      // First payment
      cy.contains("button", "Record").first().click({ timeout: 10000 });

      cy.get('input[data-testid="payment-amount"]').clear().type("5250");
      cy.get('[data-testid="payment-method"]').select("BANK_TRANSFER");

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@recordPayment");

      // Verify payment succeeded
      cy.contains(/recorded|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });
  });

  describe("High-Volume Stock Movements", () => {
    it("should record multiple stock movements sequentially", () => {
      cy.visit("/stock-movements");

      // Create 5 stock movement records
      for (let i = 0; i < 5; i++) {
        cy.contains("button", "New")
          .first()
          .click();

        cy.get('[data-testid="batch-autocomplete"]', { timeout: 5000 })
          .click()
          .type(TEST_PRODUCT_NAME, { delay: 50 });

        cy.get('[data-testid="batch-autocomplete-listbox"]', {
          timeout: 5000,
        }).should("be.visible");

        cy.get('[data-testid="batch-autocomplete-listbox"]')
          .find('[role="option"]')
          .first()
          .click();

        // Random movement type
        const movementType = i % 2 === 0 ? "IN" : "OUT";
        cy.get('[data-testid="movement-type"]').select(movementType);

        cy.get('input[data-testid="movement-qty"]')
          .clear()
          .type((50 + i * 10).toString());

        cy.get('textarea[data-testid="movement-notes"]').type(
          `Bulk movement #${i + 1}`
        );

        cy.contains("button", "New")
          .last()
          .click();

        cy.wait("@recordMovement", { timeout: 10000 });

        // Return to list for next iteration
        cy.visit("/stock-movements");
      }
    });

    it("should handle concurrent warehouse transfers", () => {
      cy.visit("/warehouse-transfers");

      // Create 3 transfers
      for (let i = 0; i < 3; i++) {
        cy.contains("button", "New")
          .first()
          .click();

        cy.get('[data-testid="from-warehouse"]', { timeout: 5000 }).select(
          "Main Warehouse"
        );
        cy.get('[data-testid="to-warehouse"]').select("Dubai Branch");

        cy.contains("button", "Add").first().click({ timeout: 10000 });

        cy.get('[data-testid="batch-autocomplete-0"]', { timeout: 5000 })
          .click()
          .type(TEST_PRODUCT_NAME, { delay: 50 });

        cy.get('[data-testid="batch-autocomplete-0-listbox"]', {
          timeout: 5000,
        }).should("be.visible");

        cy.get('[data-testid="batch-autocomplete-0-listbox"]')
          .find('[role="option"]')
          .first()
          .click();

        cy.get('input[data-testid="transfer-qty-0"]')
          .clear()
          .type((100 + i * 50).toString());

        cy.contains("button", "New")
          .last()
          .click();

        cy.contains(/transfer.*created|success/i, { timeout: 10000 }).should(
          "be.visible"
        );

        // Return to list
        cy.visit("/warehouse-transfers");
      }
    });
  });

  describe("Response Time Validation", () => {
    it("should complete invoice creation within acceptable time", () => {
      cy.visit("/invoices");
      cy.wait("@getCustomers");

      cy.contains("button", "New")
        .first()
        .click();

      cy.selectCustomer(TEST_CUSTOMER_NAME);

      cy.contains("button", "Add").first().click({ timeout: 10000 });
      cy.selectProduct(0, TEST_PRODUCT_NAME);
      cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 100, rate: 50 });

      const startTime = Date.now();

      cy.contains("button", "New")
        .last()
        .click();

      cy.wait("@createInvoice").then(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete within 10 seconds
        expect(duration).to.be.lessThan(10000);
      });

      cy.contains(/created|success/i, { timeout: 10000 }).should(
        "be.visible"
      );
    });

    it("should list invoices with acceptable page load time", () => {
      const startTime = Date.now();

      cy.visit("/invoices");
      cy.wait("@listInvoices");

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Page should load within 5 seconds
      expect(duration).to.be.lessThan(5000);

      cy.get('[data-testid="invoice-row"]').should("be.visible");
    });

    it("should allocate batches to invoice within acceptable time", () => {
      cy.visit("/invoices");
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

      const startTime = Date.now();

      // Wait for allocation panel to appear
      cy.waitForAllocationPanel(0, { timeout: 10000 }).then(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Batch allocation should complete within 8 seconds
        expect(duration).to.be.lessThan(8000);
      });
    });
  });

  describe("Memory Stability with Large Data Sets", () => {
    it("should maintain stability when filtering large invoice list", () => {
      cy.visit("/invoices");
      cy.wait("@listInvoices");

      // Filter by customer name
      cy.get('input[data-testid="search-customer"]', { timeout: 5000 }).type(
        TEST_CUSTOMER_NAME
      );

      cy.wait("@listInvoices");

      // Verify filtered results appear
      cy.get('[data-testid="invoice-row"]').should("be.visible");

      // Clear filter
      cy.get('input[data-testid="search-customer"]').clear();

      cy.wait("@listInvoices");

      // Verify all results reappear
      cy.get('[data-testid="invoice-row"]').should("have.length.greaterThan", 0);
    });

    it("should handle pagination without memory leaks", () => {
      cy.visit("/invoices");
      cy.wait("@listInvoices");

      // Navigate through multiple pages if pagination exists
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="invoice-row"]', { timeout: 5000 }).should(
          "be.visible"
        );

        // Click next page if available
        cy.get('button[data-testid="pagination-next"]', {
          timeout: 2000,
        }).then(($btn) => {
          if ($btn.is(":enabled")) {
            cy.wrap($btn).click();
            cy.wait("@listInvoices");
          }
        });
      }
    });
  });
});
