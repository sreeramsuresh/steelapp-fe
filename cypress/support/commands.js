// ***********************************************
// Custom Cypress Commands
// ***********************************************

/**
 * Login via API (fast, no UI interaction)
 * Sets cookies, localStorage, and sessionStorage to match what the app expects.
 * Usage: cy.login() or cy.login('user@example.com', 'password')
 */
Cypress.Commands.add("login", (email, password) => {
  const userEmail = email || Cypress.env("testUserEmail");
  const userPassword = password || Cypress.env("testUserPassword");

  cy.request({
    method: "POST",
    url: "/api/auth/login",
    body: { email: userEmail, password: userPassword },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status !== 200) {
      cy.log(`API login failed (${response.status}), falling back to UI login`);
      cy.loginViaUI(userEmail, userPassword);
      return;
    }

    const { token, refreshToken, user } = response.body;

    // Set cookies (NOT httpOnly — app uses document.cookie)
    cy.setCookie("accessToken", token);
    cy.setCookie("refreshToken", refreshToken);

    // Set localStorage (matches authService.js)
    window.localStorage.setItem("steel-app-token", token);
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("steel-app-refresh-token", refreshToken);

    // Set sessionStorage (matches axiosApi.js response interceptor)
    window.sessionStorage.setItem("userId", String(user.id));
    window.sessionStorage.setItem("userEmail", user.email);
    window.sessionStorage.setItem("userRole", user.role);
    window.sessionStorage.setItem("userName", user.name);
    window.sessionStorage.setItem("userCompanyId", String(user.companyId));
    if (user.permissions) {
      window.sessionStorage.setItem("userPermissions", JSON.stringify(user.permissions));
    }
    if (user.roleNames) {
      window.sessionStorage.setItem("userRoleNames", JSON.stringify(user.roleNames));
    }

    cy.visit("/");
    cy.log("Logged in via API");
  });
});

/**
 * Login as admin user (alias for cy.login with admin credentials)
 */
Cypress.Commands.add("loginAsAdmin", () => {
  cy.login(Cypress.env("testUserEmail"), Cypress.env("testUserPassword"));
});

/**
 * Login as a regular (non-admin) user
 * In test environment, falls back to the same test user credentials
 */
Cypress.Commands.add("loginAsUser", (role) => {
  // In E2E test environment, we use the same test user
  // A proper multi-user setup would use different credentials per role
  cy.login(Cypress.env("testUserEmail"), Cypress.env("testUserPassword"));
});

/**
 * Login via UI (fallback — uses form interaction)
 * Usage: cy.loginViaUI() or cy.loginViaUI('user@example.com', 'password')
 */
Cypress.Commands.add("loginViaUI", (email, password) => {
  const userEmail = email || Cypress.env("testUserEmail");
  const userPassword = password || Cypress.env("testUserPassword");

  cy.visit("/login");

  // Wait for page to fully load
  cy.wait(2000);

  // Check current URL - if already logged in (auto-login), we're done
  cy.url().then((currentUrl) => {
    if (!currentUrl.includes("/login")) {
      // Auto-login succeeded, already on another page
      cy.log("Auto-login detected - already logged in");
      return;
    }

    // Still on login page - do manual login
    cy.log("Manual login required");

    // Wait for email input to be enabled and type
    cy.get('input[name="email"], input[type="email"]')
      .should('not.be.disabled')
      .should('be.visible')
      .clear()
      .type(userEmail, { force: true });

    cy.get('input[name="password"], input[type="password"]')
      .should('not.be.disabled')
      .should('be.visible')
      .clear()
      .type(userPassword, { force: true });

    cy.get('button[type="submit"]').should('not.be.disabled').click();

    // Wait for navigation after manual login
    cy.url({ timeout: 15000 }).should("not.include", "/login");
  });
});

/**
 * Logout command
 * Usage: cy.logout()
 */
Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="logout-button"], button:contains("Logout")').click();
  cy.url().should("include", "/login");
});

/**
 * Navigate to a specific page
 * Usage: cy.navigateTo('invoices')
 */
Cypress.Commands.add("navigateTo", (page) => {
  const routes = {
    dashboard: "/app",
    invoices: "/app/invoices",
    customers: "/app/customers",
    products: "/app/products",
    payments: "/app/receivables",
    quotations: "/app/quotations",
    suppliers: "/app/suppliers",
    warehouses: "/app/warehouses",
    settings: "/app/settings",
  };

  cy.visit(routes[page] || `/${page}`);
});

/**
 * Wait for API request to complete
 * Usage: cy.waitForAPI('invoices')
 */
Cypress.Commands.add("waitForAPI", (alias) => {
  cy.wait(`@${alias}`);
});

/**
 * Check if element contains text (case-insensitive)
 * Usage: cy.get('.element').shouldContainText('invoice')
 */
Cypress.Commands.add(
  "shouldContainText",
  { prevSubject: true },
  (subject, text) => {
    cy.wrap(subject)
      .invoke("text")
      .then((elementText) => {
        expect(elementText.toLowerCase()).to.include(text.toLowerCase());
      });
  },
);

/**
 * Select customer from autocomplete dropdown
 * Usage: cy.selectCustomer('ABC Corporation')
 *
 * This command handles the custom Autocomplete component which uses:
 * - A text input with data-testid="customer-autocomplete"
 * - A fixed-position dropdown with role="listbox" that appears on focus/type
 * - Options with role="option" inside the listbox
 */
Cypress.Commands.add("selectCustomer", (customerName) => {
  cy.log(`Selecting customer: ${customerName}`);

  // Wait for customers to load first
  cy.wait("@getCustomers", { timeout: 10000 });

  // Additional wait to ensure data is processed
  cy.wait(500);

  // Click input to focus and open dropdown
  cy.get('[data-testid="customer-autocomplete"]').click().should("be.focused");

  // Wait for dropdown to potentially appear
  cy.wait(300);

  // Type to filter (don't clear - let autocomplete filter)
  // Use {selectall} first to select existing text without blur
  cy.get('[data-testid="customer-autocomplete"]').type(
    "{selectall}{backspace}" + customerName,
    { delay: 80 },
  );

  // Wait for the listbox to appear with filtered options
  cy.get('[data-testid="customer-autocomplete-listbox"]', { timeout: 10000 })
    .should("exist")
    .should("be.visible");

  // Wait a moment for options to filter
  cy.wait(300);

  // Click the option that contains the customer name
  // Note: Autocomplete uses onMouseDown, we need to click directly (not trigger)
  // Using click() instead of trigger() to properly simulate user interaction
  cy.get('[data-testid="customer-autocomplete-listbox"]')
    .find('[role="option"]')
    .contains(customerName, { matchCase: false })
    .click();

  // Wait for dropdown to close and selection to complete
  cy.wait(500);

  cy.log(`✓ Customer "${customerName}" selected`);
});

/**
 * Add product via autocomplete in line item table
 * Usage: cy.selectProduct(0, 'SS-316-Bar-BRIGHT-30mm-6000mm')
 *
 * @param {number} lineIndex - Zero-based index of the line item (0 for first product)
 * @param {string} productName - Full or partial product name to search for
 */
Cypress.Commands.add("selectProduct", (lineIndex, productName) => {
  cy.log(`Adding product "${productName}" at line ${lineIndex}`);

  // Get the product autocomplete input for this specific line
  const testId = `product-autocomplete-${lineIndex}`;

  // Wait for products to load (assume intercept is already set up)
  cy.wait(500);

  // Focus the autocomplete input
  cy.get(`[data-testid="${testId}"]`).focus().should("be.focused");

  // Wait for dropdown to open after focus
  cy.wait(200);

  // Clear and type the product name slowly
  cy.get(`[data-testid="${testId}"]`).clear().type(productName, { delay: 100 });

  // Wait for the listbox to appear (it's rendered with position:fixed)
  cy.get(`[data-testid="${testId}-listbox"]`, { timeout: 5000 }).should(
    "be.visible",
  );

  // Wait for options to filter
  cy.wait(500);

  // Click the option containing the product name
  cy.get(`[data-testid="${testId}-listbox"]`)
    .find('[role="option"]')
    .contains(productName, { matchCase: false })
    .click();

  // Wait for dropdown to close and product selection to complete
  cy.wait(500);

  cy.log(`✓ Product "${productName}" added at line ${lineIndex}`);
});

/**
 * Wait for allocation panel to load with stock data
 * Usage: cy.waitForAllocationPanel(0)
 *
 * @param {number} lineIndex - Zero-based index of the line item
 */
Cypress.Commands.add("waitForAllocationPanel", (lineIndex) => {
  cy.log(`Waiting for allocation panel at line ${lineIndex}...`);

  // The allocation panel is auto-expanded when a product with stock is added
  // Wait for the panel to be visible
  cy.get(`[data-testid="allocation-panel-${lineIndex}"]`, {
    timeout: 10000,
  }).should("be.visible");

  // Wait for stock data to load by checking for warehouse stock indicators
  // At least one warehouse stock should be visible
  cy.get(`[data-testid="allocation-stock-warehouses-${lineIndex}"]`, {
    timeout: 10000,
  })
    .should("be.visible")
    .find('[data-testid^="stock-warehouse-"]')
    .should("have.length.greaterThan", 0);

  cy.log(`✓ Allocation panel loaded at line ${lineIndex}`);
});

/**
 * Get source type value for a specific line item
 * Usage: cy.getSourceType(0).should('eq', 'WAREHOUSE')
 *
 * @param {number} lineIndex - Zero-based index of the line item
 */
Cypress.Commands.add("getSourceType", (lineIndex) => {
  return cy.get(`[data-testid="source-type-${lineIndex}"]`).invoke("val");
});

/**
 * Get stock quantity for a specific warehouse in a line item
 * Usage: cy.getWarehouseStock(0, 3).should('contain', '5')
 *
 * @param {number} lineIndex - Zero-based index of the line item
 * @param {number} warehouseId - Warehouse ID (1=Main, 2=Dubai, 3=Abu Dhabi)
 */
Cypress.Commands.add("getWarehouseStock", (lineIndex, warehouseId) => {
  return cy
    .get(`[data-testid="allocation-stock-warehouses-${lineIndex}"]`)
    .find(`[data-testid="stock-warehouse-${warehouseId}"]`);
});

/**
 * Verify batch allocation table is visible for a line item
 * Usage: cy.verifyBatchTable(0, 4) // Verify 4 batches exist
 *
 * @param {number} lineIndex - Zero-based index of the line item
 * @param {number} expectedBatchCount - Expected number of batches (optional)
 */
Cypress.Commands.add("verifyBatchTable", (lineIndex, expectedBatchCount) => {
  cy.log(`Verifying batch table at line ${lineIndex}...`);

  // Check if batch table exists
  cy.get(`[data-testid="batch-allocation-table-${lineIndex}"]`, {
    timeout: 5000,
  }).should("be.visible");

  if (expectedBatchCount) {
    // Count batch rows (excluding header)
    cy.get(
      `[data-testid="batch-allocation-table-${lineIndex}"] tbody tr`,
    ).should("have.length", expectedBatchCount);

    cy.log(`✓ Batch table has ${expectedBatchCount} batches`);
  } else {
    cy.log(`✓ Batch table is visible`);
  }
});

/**
 * Fill invoice form basic fields
 * Usage: cy.fillInvoiceBasicFields({ quantity: 10, rate: 100 })
 *
 * @param {Object} options - Form field values
 * @param {number} options.lineIndex - Line item index (default: 0)
 * @param {number} options.quantity - Quantity to enter
 * @param {number} options.rate - Unit rate/price
 */
Cypress.Commands.add(
  "fillInvoiceBasicFields",
  ({ lineIndex = 0, quantity, rate }) => {
    if (quantity !== undefined) {
      cy.get(`input[name*="quantity"]`)
        .eq(lineIndex)
        .clear()
        .type(String(quantity));
    }

    if (rate !== undefined) {
      cy.get(`input[name*="rate"], input[name*="price"]`)
        .eq(lineIndex)
        .clear()
        .type(String(rate));
    }

    cy.log(`✓ Filled basic fields for line ${lineIndex}`);
  },
);

/**
 * Navigate to supplier quotations page
 * Usage: cy.visitSupplierQuotations()
 */
Cypress.Commands.add('visitSupplierQuotations', () => {
  cy.visit('/app/supplier-quotations');
  cy.contains(/supplier quotations/i, { timeout: 10000 }).should('be.visible');
});

/**
 * Create a supplier quotation via API (for test setup)
 * Usage: cy.createSupplierQuotation({ supplierId: 1, ... })
 */
Cypress.Commands.add('createSupplierQuotation', (quotationData) => {
  const defaultData = {
    supplierId: 1,
    supplierReference: `TEST-${Date.now()}`,
    quoteDate: new Date().toISOString().split('T')[0],
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    currency: 'AED',
    status: 'draft',
    items: [
      {
        description: 'Test Steel Product',
        quantity: 100,
        unit: 'KG',
        unitPrice: 50,
      },
    ],
    ...quotationData,
  };

  return cy
    .request({
      method: 'POST',
      url: `/api/supplier-quotations`,
      body: defaultData,
      headers: {
        Authorization: `Bearer ${Cypress.env('authToken')}`,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(201);
      return response.body;
    });
});

/**
 * Delete a supplier quotation via API (for test cleanup)
 * Usage: cy.deleteSupplierQuotation(quotationId)
 */
Cypress.Commands.add('deleteSupplierQuotation', (quotationId) => {
  return cy.request({
    method: 'DELETE',
    url: `/api/supplier-quotations/${quotationId}`,
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
    failOnStatusCode: false,
  });
});
