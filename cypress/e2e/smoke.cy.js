/**
 * Cypress E2E Smoke Tests
 * 
 * Quick validation that critical paths work:
 * 1. Login → Dashboard
 * 2. List invoices → Table renders
 * 3. Create invoice → Success message
 * 4. Add payment → Balance updates
 * 5. Logout
 * 
 * Run: npm run test:e2e
 * Open: npm run test:e2e:open
 */

describe('Smoke Tests - Critical User Flows', () => {
  
  beforeEach(() => {
    // Clear cookies before each test
    cy.clearCookies();
  });

  it('1. Should login and navigate to dashboard', () => {
    cy.visit('/login');
    
    // Fill login form
    cy.get('input[name="email"], input[type="email"]')
      .type(Cypress.env('testUserEmail'));
    
    cy.get('input[name="password"], input[type="password"]')
      .type(Cypress.env('testUserPassword'));
    
    // Submit login
    cy.get('button[type="submit"]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify dashboard elements load
    cy.contains(/dashboard|overview|home/i).should('be.visible');
  });

  it('2. Should load invoices list and render table', () => {
    // Login first
    cy.login();
    
    // Navigate to invoices
    cy.visit('/invoices');
    
    // Wait for page to load
    cy.contains(/invoice/i).should('be.visible');
    
    // Verify table or list exists
    cy.get('table, [role="table"], .invoice-list').should('exist');
    
    // Verify at least one row (header or data)
    cy.get('tr, [role="row"], .invoice-item').should('have.length.greaterThan', 0);
  });

  it('3. Should create a new invoice successfully', () => {
    cy.login();
    
    cy.visit('/invoices');
    
    // Click create/new invoice button
    cy.contains(/new|create|add/i).click();
    
    // Wait for form to load
    cy.url().should('match', /\/invoices\/(new|create)/i);
    
    // Fill minimum required fields
    // Note: Actual selectors may vary based on your form implementation
    cy.get('select[name="customerId"], select[name="customer"], input[placeholder*="customer"]')
      .first()
      .select(1, { force: true })
      .should('not.have.value', '');
    
    // Add at least one product/line item
    cy.contains(/add.*item|add.*product/i).click();
    
    // Fill product details (adjust selectors based on actual form)
    cy.get('input[name*="product"], select[name*="product"]')
      .first()
      .type('Test Product{enter}', { force: true });
    
    cy.get('input[name*="quantity"]')
      .first()
      .clear()
      .type('10');
    
    cy.get('input[name*="price"], input[name*="unitPrice"]')
      .first()
      .clear()
      .type('100');
    
    // Submit form
    cy.contains('button', /save|create|submit/i).click();
    
    // Verify success message
    cy.contains(/success|created|saved/i, { timeout: 10000 }).should('be.visible');
  });

  it('4. Should add payment to an invoice and update balance', () => {
    cy.login();
    
    cy.visit('/invoices');
    
    // Find an unpaid or partially paid invoice
    // Click on the first invoice row
    cy.get('table tbody tr, [role="row"]')
      .first()
      .click();
    
    // Wait for invoice detail page
    cy.url().should('match', /\/invoices\/\d+/);
    
    // Get current balance before payment
    let initialBalance;
    cy.contains(/balance|due|outstanding/i)
      .invoke('text')
      .then((text) => {
        // Extract number from text
        initialBalance = parseFloat(text.replace(/[^0-9.]/g, ''));
        cy.log(`Initial balance: ${initialBalance}`);
      });
    
    // Click add/record payment button
    cy.contains(/add.*payment|record.*payment|pay/i).click();
    
    // Fill payment form
    cy.get('input[name="amount"], input[placeholder*="amount"]')
      .clear()
      .type('100');
    
    cy.get('select[name="paymentMethod"], select[name="method"]')
      .select('cash');
    
    cy.get('input[name="paymentDate"], input[type="date"]')
      .first()
      .type(new Date().toISOString().split('T')[0]);
    
    // Submit payment
    cy.contains('button', /save|record|submit|add/i).click();
    
    // Verify success message
    cy.contains(/success|recorded|added/i, { timeout: 10000 }).should('be.visible');
    
    // Verify balance updated
    cy.contains(/balance|due|outstanding/i)
      .invoke('text')
      .then((text) => {
        const newBalance = parseFloat(text.replace(/[^0-9.]/g, ''));
        cy.log(`New balance: ${newBalance}`);
        // Balance should decrease (or stay same if initial was 0)
        expect(newBalance).to.be.lte(initialBalance);
      });
  });

  it('5. Should logout successfully', () => {
    cy.login();
    
    cy.visit('/dashboard');
    
    // Click logout button (adjust selector based on actual implementation)
    cy.get('[data-testid="logout-button"], button:contains("Logout"), a:contains("Logout")')
      .first()
      .click();
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
    
    // Verify login form is visible
    cy.get('input[type="email"], input[name="email"]').should('be.visible');
  });
});

/**
 * Additional Smoke Tests - Error Scenarios
 */
describe('Smoke Tests - Error Handling', () => {
  
  it('Should show error for invalid login credentials', () => {
    cy.visit('/login');
    
    cy.get('input[name="email"], input[type="email"]')
      .type('invalid@email.com');
    
    cy.get('input[name="password"], input[type="password"]')
      .type('wrongpassword');
    
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.contains(/invalid|incorrect|error|failed/i, { timeout: 5000 })
      .should('be.visible');
    
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('Should handle 404 for non-existent invoice', () => {
    cy.login();
    
    // Try to access non-existent invoice
    cy.visit('/invoices/99999999', { failOnStatusCode: false });
    
    // Should show error message or redirect
    cy.contains(/not found|error|invalid/i, { timeout: 5000 })
      .should('be.visible');
  });
});

/**
 * Test Execution Instructions:
 * 
 * Install Cypress:
 *   npm install
 * 
 * Open Cypress Test Runner (interactive):
 *   npm run test:e2e:open
 *   or
 *   npm run cypress
 * 
 * Run tests headlessly (CI):
 *   npm run test:e2e
 *   or
 *   npm run cypress:headless
 * 
 * Prerequisites:
 * - Frontend must be running on http://localhost:5173
 * - API Gateway must be running on http://localhost:3000
 * - Test user must exist in database:
 *   Email: test@steelapp.com (or set in cypress.config.js)
 *   Password: testpassword123 (or set in cypress.config.js)
 * 
 * Notes:
 * - These are SMOKE tests - basic happy path validation
 * - Selectors may need adjustment based on actual UI implementation
 * - Add data-testid attributes to critical elements for stable selectors
 * - Avoid using CSS classes for selectors (they change frequently)
 */
