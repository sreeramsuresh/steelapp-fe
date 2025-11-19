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
  cy.get('input[name="email"], input[type="email"]').type(userEmail);
  cy.get('input[name="password"], input[type="password"]').type(userPassword);
  cy.get('button[type="submit"]').click();
  
  // Wait for navigation to dashboard
  cy.url().should('include', '/dashboard');
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
    payments: '/payments'
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
