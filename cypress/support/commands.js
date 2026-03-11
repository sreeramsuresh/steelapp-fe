// ***********************************************
// Custom Cypress Commands
// ***********************************************

// ==============================================
// ROLE-BASED LOGIN COMMANDS
// ==============================================

/**
 * Login as a specific role (admin, sales, readonly)
 * Uses seeded E2E users with pre-assigned roles/permissions.
 * Usage: cy.loginAsRole('admin') | cy.loginAsRole('sales') | cy.loginAsRole('readonly')
 */
Cypress.Commands.add("loginAsRole", (role) => {
  const credentials = {
    admin: {
      email: Cypress.env("testUserEmail"),
      password: Cypress.env("testUserPassword"),
    },
    sales: {
      email: Cypress.env("salesUserEmail"),
      password: Cypress.env("salesUserPassword"),
    },
    readonly: {
      email: Cypress.env("readonlyUserEmail"),
      password: Cypress.env("readonlyUserPassword"),
    },
  };

  const cred = credentials[role];
  if (!cred) {
    throw new Error(`Unknown role "${role}". Use: admin, sales, readonly`);
  }

  cy.login(cred.email, cred.password);
});

// ==============================================
// SHARED VERIFICATION COMMANDS
// ==============================================

/**
 * Verify a page loads with the expected heading text.
 * Checks: URL correct, heading visible, body has content.
 * Usage: cy.verifyPageLoads('Invoices', '/app/invoices')
 */
Cypress.Commands.add("verifyPageLoads", (heading, expectedUrl) => {
  if (expectedUrl) {
    cy.url().should("include", expectedUrl);
  }
  cy.contains("h1, h2, h3, h4, [data-testid$='-heading']", new RegExp(heading, "i"), {
    timeout: 15000,
  }).should("be.visible");
  cy.get("body").should(($body) => {
    expect($body.text().length).to.be.greaterThan(10);
  });
});

/**
 * Verify table columns match expected headers.
 * Usage: cy.verifyTableColumns(['Invoice #', 'Customer', 'Amount', 'Status'])
 */
Cypress.Commands.add("verifyTableColumns", (columns, tableSelector) => {
  const selector = tableSelector || "table";
  cy.get(selector, { timeout: 10000 }).should("be.visible");
  // Use .should() for retryability -- .then() runs once and cannot retry
  cy.get(`${selector} thead th, ${selector} thead td`).should(($headers) => {
    const headerTexts = [...$headers].map((el) => el.textContent.trim().toLowerCase());
    for (const col of columns) {
      const found = headerTexts.some((h) => h.includes(col.toLowerCase()));
      expect(found, `Column "${col}" should exist in table headers`).to.be.true;
    }
  });
});

/**
 * Verify empty state is shown when no data exists.
 * Usage: cy.verifyEmptyState()
 */
Cypress.Commands.add("verifyEmptyState", () => {
  cy.get("body").should(($body) => {
    const text = $body.text().toLowerCase();
    const hasEmptyState =
      text.includes("no data") ||
      text.includes("no records") ||
      text.includes("no results") ||
      text.includes("nothing to show") ||
      text.includes("empty") ||
      text.includes("get started");
    expect(hasEmptyState, "Should display an empty state message").to.be.true;
  });
});

/**
 * Shorthand for cy.intercept + alias.
 * Usage: cy.interceptAPI('GET', '/api/invoices*', 'getInvoices')
 */
Cypress.Commands.add("interceptAPI", (method, path, alias) => {
  cy.intercept(method, path).as(alias);
});

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

    // Set cookies — if tokens are in body (RETURN_TOKENS_IN_BODY=true), set them explicitly.
    // If not in body (HttpOnly cookie flow), the server already set them via Set-Cookie headers
    // and cy.request() captured them automatically.
    if (token) {
      cy.setCookie("accessToken", token);
    }
    if (refreshToken) {
      cy.setCookie("refreshToken", refreshToken);
    }

    // Visit the app first to establish the AUT window
    cy.visit("/");

    // Set localStorage and sessionStorage on the AUT window (not the spec runner)
    cy.window().then((win) => {
      // localStorage (matches authService.js)
      if (token) {
        win.localStorage.setItem("steel-app-token", token);
        win.localStorage.setItem("token", token);
      }
      if (refreshToken) {
        win.localStorage.setItem("steel-app-refresh-token", refreshToken);
      }

      // sessionStorage (matches axiosApi.js response interceptor)
      win.sessionStorage.setItem("userId", String(user.id));
      win.sessionStorage.setItem("userEmail", user.email);
      win.sessionStorage.setItem("userRole", user.role);
      win.sessionStorage.setItem("userName", user.name);
      win.sessionStorage.setItem("userCompanyId", String(user.companyId));
      if (user.permissions) {
        win.sessionStorage.setItem("userPermissions", JSON.stringify(user.permissions));
      }
      if (user.roleNames) {
        win.sessionStorage.setItem("userRoleNames", JSON.stringify(user.roleNames));
      }
    });

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
 * Login as a regular (non-admin) user.
 * Delegates to loginAsRole for proper role-based credentials.
 */
Cypress.Commands.add("loginAsUser", (role) => {
  cy.loginAsRole(role || "sales");
});

/**
 * Login via UI (fallback — uses form interaction)
 * Usage: cy.loginViaUI() or cy.loginViaUI('user@example.com', 'password')
 */
Cypress.Commands.add("loginViaUI", (email, password) => {
  const userEmail = email || Cypress.env("testUserEmail");
  const userPassword = password || Cypress.env("testUserPassword");

  cy.visit("/login");

  // Wait for login form to be ready
  cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");

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
  // Try to find user profile button with flexible matching
  cy.get("body").then(($body) => {
    const $userBtn = $body.find("button").filter(function () {
      return /Development User|E2E Admin|admin|user|profile|account/i.test(this.textContent);
    });
    const $avatar = $body.find('[class*="avatar"], [class*="user-menu"], [data-testid*="user"]');

    if ($userBtn.length > 0) {
      cy.wrap($userBtn.first()).click({ force: true });
      // Wait for dropdown and click logout
      cy.get("body").then(($menuBody) => {
        const $logoutBtn = $menuBody.find("button, a, [role='menuitem']").filter(function () {
          return /logout|sign out|log out/i.test(this.textContent);
        });
        if ($logoutBtn.length > 0) {
          cy.wrap($logoutBtn.first()).click();
        } else {
          // Fallback: clear auth state manually
          cy.clearCookies();
          cy.clearLocalStorage();
          cy.visit("/login");
        }
      });
    } else if ($avatar.length > 0) {
      cy.wrap($avatar.first()).click({ force: true });
      cy.contains(/logout|sign out/i, { timeout: 5000 }).click();
    } else {
      // Fallback: clear auth state manually
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/login");
    }
  });
  cy.url({ timeout: 10000 }).should("include", "/login");
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
    // Use .should() for retryability -- .then() runs once and cannot retry
    cy.wrap(subject).should(($el) => {
      expect($el.text().toLowerCase()).to.include(text.toLowerCase());
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

  // Click input to focus and open dropdown
  cy.get('[data-testid="customer-autocomplete"]').click().should("be.focused");

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

  // Click the option that contains the customer name
  cy.get('[data-testid="customer-autocomplete-listbox"]')
    .find('[role="option"]')
    .contains(customerName, { matchCase: false })
    .click();

  // Verify selection completed (dropdown closed)
  cy.get('[data-testid="customer-autocomplete-listbox"]').should("not.exist");

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

  // Focus the autocomplete input
  cy.get(`[data-testid="${testId}"]`).focus().should("be.focused");

  // Clear and type the product name slowly
  cy.get(`[data-testid="${testId}"]`).clear().type(productName, { delay: 100 });

  // Wait for the listbox to appear (it's rendered with position:fixed)
  cy.get(`[data-testid="${testId}-listbox"]`, { timeout: 5000 }).should(
    "be.visible",
  );

  // Click the option containing the product name
  cy.get(`[data-testid="${testId}-listbox"]`)
    .find('[role="option"]')
    .contains(productName, { matchCase: false })
    .click();

  // Verify selection completed (dropdown closed)
  cy.get(`[data-testid="${testId}-listbox"]`).should("not.exist");

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
