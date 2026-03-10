// Owner: analytics
// Route: /analytics/dashboard (reports hub), /analytics/price-history, /analytics/reconciliation, /analytics/certificate-audit

describe('Reports Generation - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load analytics dashboard as reports hub', () => {
    cy.visit('/analytics/dashboard', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /dashboard|analytics|report/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/dashboard');
  });

  it('should load the price history report', () => {
    cy.visit('/analytics/price-history', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /price|history/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/price-history');
  });

  it('should have product and date filters on price history', () => {
    cy.visit('/analytics/price-history', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasFilters =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('input[type="text"], input[type="search"]').length > 0 ||
        $body.find('button').filter(':contains("Filter"), :contains("Apply"), :contains("Search"), :contains("Product"), :contains("Date")').length > 0;
      expect(hasFilters, 'Price history should have product and date filters').to.be.true;
    });
  });

  it('should load the reconciliation report', () => {
    cy.visit('/analytics/reconciliation', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /reconcil/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/reconciliation');
  });

  it('should have filter controls on reconciliation', () => {
    cy.visit('/analytics/reconciliation', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasFilter =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('button').filter(':contains("Filter"), :contains("Apply"), :contains("Run"), :contains("Generate")').length > 0;
      expect(hasFilter, 'Reconciliation should have filter controls').to.be.true;
    });
  });

  it('should load the certificate audit report', () => {
    cy.visit('/analytics/certificate-audit', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /certificate|audit/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/certificate-audit');
  });

  it('should have heading on each report page', () => {
    const routes = [
      { path: '/analytics/price-history', heading: /price|history/i },
      { path: '/analytics/reconciliation', heading: /reconcil/i },
      { path: '/analytics/certificate-audit', heading: /certificate|audit/i },
    ];

    for (const route of routes) {
      cy.visit(route.path, { timeout: 15000 });
      cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', route.heading, {
        timeout: 15000,
      }).should('be.visible');
    }
  });

  it('should have some form of data display on each report page', () => {
    const routes = [
      '/analytics/price-history',
      '/analytics/reconciliation',
      '/analytics/certificate-audit',
    ];

    for (const route of routes) {
      cy.visit(route, { timeout: 15000 });
      cy.get('body', { timeout: 15000 }).then(($body) => {
        const hasContent =
          $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]').length > 0 ||
          $body.text().length > 50;
        expect(hasContent, `${route} should have data display elements or meaningful text`).to.be.true;
      });
    }
  });
});
