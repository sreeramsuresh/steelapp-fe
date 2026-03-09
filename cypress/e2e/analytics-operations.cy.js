// Owner: analytics
// Routes: /analytics/delivery-variance, /analytics/supplier-performance, /app/commission-dashboard

describe('Operations Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the delivery variance dashboard', () => {
    cy.interceptAPI('GET', '/api/*deliver*', 'getDelivery');
    cy.visit('/analytics/delivery-variance', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /delivery|variance/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/delivery-variance');
  });

  it('should have chart or table content on delivery variance', () => {
    cy.interceptAPI('GET', '/api/*deliver*', 'getDelivery');
    cy.visit('/analytics/delivery-variance', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should load the supplier performance dashboard', () => {
    cy.interceptAPI('GET', '/api/*supplier*', 'getSupplier');
    cy.visit('/analytics/supplier-performance', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /supplier|performance/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/supplier-performance');
  });

  it('should have filters and metrics on supplier performance', () => {
    cy.interceptAPI('GET', '/api/*supplier*', 'getSupplier');
    cy.visit('/analytics/supplier-performance', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasFiltersOrMetrics =
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('[class*="card"], [class*="Card"], [class*="metric"], [class*="Metric"]').length > 0 ||
        $body.find('canvas, svg, table').length > 0;
      expect(hasFiltersOrMetrics, 'Supplier performance should have filters or metrics').to.be.true;
    });
  });

  it('should load the commission dashboard', () => {
    cy.interceptAPI('GET', '/api/*commission*', 'getCommission');
    cy.visit('/app/commission-dashboard', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /commission/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/app/commission-dashboard');
  });

  it('should show summary or metrics on commission dashboard', () => {
    cy.interceptAPI('GET', '/api/*commission*', 'getCommission');
    cy.visit('/app/commission-dashboard', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"], [class*="summary"], [class*="Summary"]', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });
});
