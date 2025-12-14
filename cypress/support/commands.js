// ***********************************************
// Custom Cypress Commands
// ***********************************************

/**
 * Login command
 * Usage: cy.login()
 */
Cypress.Commands.add('login', (email, password) => {
  const userEmail = email || Cypress.env('testUserEmail');
  const userPassword = password || Cypress.env('testUserPassword');

  cy.visit('/login');

  // Wait a moment to see if auto-login happens
  cy.wait(1000);

  // Check current URL - if already logged in (auto-login), we're done
  cy.url().then((currentUrl) => {
    if (!currentUrl.includes('/login')) {
      // Auto-login succeeded, already on another page
      cy.log('Auto-login detected - already logged in');
      return;
    }

    // Still on login page - do manual login
    cy.log('Manual login required');
    cy.get('input[name="email"], input[type="email"]').type(userEmail);
    cy.get('input[name="password"], input[type="password"]').type(userPassword);
    cy.get('button[type="submit"]').click();

    // Wait for navigation after manual login
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  });
});

/**
 * Logout command
 * Usage: cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"], button:contains("Logout")').click();
  cy.url().should('include', '/login');
});

/**
 * Navigate to a specific page
 * Usage: cy.navigateTo('invoices')
 */
Cypress.Commands.add('navigateTo', (page) => {
  const routes = {
    dashboard: '/dashboard',
    invoices: '/invoices',
    customers: '/customers',
    products: '/products',
    payments: '/payments',
  };

  cy.visit(routes[page] || `/${page}`);
});

/**
 * Wait for API request to complete
 * Usage: cy.waitForAPI('invoices')
 */
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(`@${alias}`);
});

/**
 * Check if element contains text (case-insensitive)
 * Usage: cy.get('.element').shouldContainText('invoice')
 */
Cypress.Commands.add('shouldContainText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).invoke('text').then((elementText) => {
    expect(elementText.toLowerCase()).to.include(text.toLowerCase());
  });
});

/**
 * Select customer from autocomplete dropdown
 * Usage: cy.selectCustomer('ABC Corporation')
 *
 * This command handles the custom Autocomplete component which uses:
 * - A text input with data-testid="customer-autocomplete"
 * - A fixed-position dropdown with role="listbox" that appears on focus/type
 * - Options with role="option" inside the listbox
 */
Cypress.Commands.add('selectCustomer', (customerName) => {
  cy.log(`Selecting customer: ${customerName}`);

  // Wait for customers to load first
  cy.wait('@getCustomers', { timeout: 10000 });

  // Additional wait to ensure data is processed
  cy.wait(500);

  // Click input to focus and open dropdown
  cy.get('[data-testid="customer-autocomplete"]')
    .click()
    .should('be.focused');

  // Wait for dropdown to potentially appear
  cy.wait(300);

  // Type to filter (don't clear - let autocomplete filter)
  // Use {selectall} first to select existing text without blur
  cy.get('[data-testid="customer-autocomplete"]')
    .type('{selectall}{backspace}' + customerName, { delay: 80 });

  // Wait for the listbox to appear with filtered options
  cy.get('[data-testid="customer-autocomplete-listbox"]', { timeout: 10000 })
    .should('exist')
    .should('be.visible');

  // Wait a moment for options to filter
  cy.wait(300);

  // Click the option that contains the customer name
  cy.get('[data-testid="customer-autocomplete-listbox"]')
    .find('[role="option"]')
    .contains(customerName)
    .click({ force: true });

  cy.log(`✓ Customer "${customerName}" selected`);
});

/**
 * Add product via autocomplete in line item table
 * Usage: cy.selectProduct(0, 'SS-316-Bar-BRIGHT-30mm-6000mm')
 *
 * @param {number} lineIndex - Zero-based index of the line item (0 for first product)
 * @param {string} productName - Full or partial product name to search for
 */
Cypress.Commands.add('selectProduct', (lineIndex, productName) => {
  cy.log(`Adding product "${productName}" at line ${lineIndex}`);

  // Get the product autocomplete input for this specific line
  const testId = `product-autocomplete-${lineIndex}`;

  // Wait for products to load (assume intercept is already set up)
  cy.wait(500);

  // Focus the autocomplete input
  cy.get(`[data-testid="${testId}"]`)
    .focus()
    .should('be.focused');

  // Wait for dropdown to open after focus
  cy.wait(200);

  // Clear and type the product name slowly
  cy.get(`[data-testid="${testId}"]`)
    .clear()
    .type(productName, { delay: 100 });

  // Wait for the listbox to appear (it's rendered with position:fixed)
  cy.get(`[data-testid="${testId}-listbox"]`, { timeout: 5000 })
    .should('be.visible');

  // Wait for options to filter
  cy.wait(500);

  // Click the option containing the product name
  // Note: Product options have complex rendering with displayName/uniqueName
  cy.get(`[data-testid="${testId}-listbox"]`)
    .find('[role="option"]')
    .contains(productName)
    .click({ force: true });

  cy.log(`✓ Product "${productName}" added at line ${lineIndex}`);
});

/**
 * Wait for allocation panel to load with stock data
 * Usage: cy.waitForAllocationPanel(0)
 *
 * @param {number} lineIndex - Zero-based index of the line item
 */
Cypress.Commands.add('waitForAllocationPanel', (lineIndex) => {
  cy.log(`Waiting for allocation panel at line ${lineIndex}...`);

  // The allocation panel is auto-expanded when a product with stock is added
  // Wait for the panel to be visible
  cy.get(`[data-testid="allocation-panel-${lineIndex}"]`, { timeout: 10000 })
    .should('be.visible');

  // Wait for stock data to load by checking for warehouse stock indicators
  // At least one warehouse stock should be visible
  cy.get(`[data-testid="allocation-stock-warehouses-${lineIndex}"]`, { timeout: 10000 })
    .should('be.visible')
    .find('[data-testid^="stock-warehouse-"]')
    .should('have.length.greaterThan', 0);

  cy.log(`✓ Allocation panel loaded at line ${lineIndex}`);
});

/**
 * Get source type value for a specific line item
 * Usage: cy.getSourceType(0).should('eq', 'WAREHOUSE')
 *
 * @param {number} lineIndex - Zero-based index of the line item
 */
Cypress.Commands.add('getSourceType', (lineIndex) => {
  return cy.get(`[data-testid="source-type-${lineIndex}"]`).invoke('val');
});

/**
 * Get stock quantity for a specific warehouse in a line item
 * Usage: cy.getWarehouseStock(0, 3).should('contain', '5')
 *
 * @param {number} lineIndex - Zero-based index of the line item
 * @param {number} warehouseId - Warehouse ID (1=Main, 2=Dubai, 3=Abu Dhabi)
 */
Cypress.Commands.add('getWarehouseStock', (lineIndex, warehouseId) => {
  return cy.get(`[data-testid="allocation-stock-warehouses-${lineIndex}"]`)
    .find(`[data-testid="stock-warehouse-${warehouseId}"]`);
});

/**
 * Verify batch allocation table is visible for a line item
 * Usage: cy.verifyBatchTable(0, 4) // Verify 4 batches exist
 *
 * @param {number} lineIndex - Zero-based index of the line item
 * @param {number} expectedBatchCount - Expected number of batches (optional)
 */
Cypress.Commands.add('verifyBatchTable', (lineIndex, expectedBatchCount) => {
  cy.log(`Verifying batch table at line ${lineIndex}...`);

  // Check if batch table exists
  cy.get(`[data-testid="batch-allocation-table-${lineIndex}"]`, { timeout: 5000 })
    .should('be.visible');

  if (expectedBatchCount) {
    // Count batch rows (excluding header)
    cy.get(`[data-testid="batch-allocation-table-${lineIndex}"] tbody tr`)
      .should('have.length', expectedBatchCount);

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
Cypress.Commands.add('fillInvoiceBasicFields', ({ lineIndex = 0, quantity, rate }) => {
  if (quantity !== undefined) {
    cy.get(`input[name*="quantity"]`).eq(lineIndex).clear().type(String(quantity));
  }

  if (rate !== undefined) {
    cy.get(`input[name*="rate"], input[name*="price"]`).eq(lineIndex).clear().type(String(rate));
  }

  cy.log(`✓ Filled basic fields for line ${lineIndex}`);
});
