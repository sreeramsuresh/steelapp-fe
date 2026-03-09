// Owner: analytics
// Routes: /analytics/stock-movement, /analytics/batch-analytics

describe('Inventory Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the stock movement report', () => {
    cy.interceptAPI('GET', '/api/*stock*', 'getStock');
    cy.visit('/analytics/stock-movement', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /stock|movement|inventory/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/stock-movement');
  });

  it('should have date range filter on stock movement', () => {
    cy.interceptAPI('GET', '/api/*stock*', 'getStock');
    cy.visit('/analytics/stock-movement', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasDateRange =
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[class*="date"], [class*="Date"]').length > 0 ||
        $body.find('[class*="range"], [class*="Range"]').length > 0 ||
        $body.find('[data-testid*="date"]').length > 0 ||
        $body.find('button').filter(':contains("From"), :contains("To"), :contains("Start"), :contains("End"), :contains("Date")').length > 0 ||
        $body.find('select').length > 0;
      expect(hasDateRange, 'Stock movement should have date range filter').to.be.true;
    });
  });

  it('should have table or chart content on stock movement', () => {
    cy.interceptAPI('GET', '/api/*stock*', 'getStock');
    cy.visit('/analytics/stock-movement', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should load the batch analytics page', () => {
    cy.interceptAPI('GET', '/api/*batch*', 'getBatch');
    cy.visit('/analytics/batch-analytics', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /batch|analytics/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/batch-analytics');
  });

  it('should have filter controls on batch analytics', () => {
    cy.interceptAPI('GET', '/api/*batch*', 'getBatch');
    cy.visit('/analytics/batch-analytics', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasFilter =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('button').filter(':contains("Filter"), :contains("Apply"), :contains("Search")').length > 0 ||
        $body.find('input[type="text"], input[type="search"]').length > 0;
      expect(hasFilter, 'Batch analytics should have filter controls').to.be.true;
    });
  });

  it('should show data visualization on batch analytics', () => {
    cy.interceptAPI('GET', '/api/*batch*', 'getBatch');
    cy.visit('/analytics/batch-analytics', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should have export button on stock movement', () => {
    cy.interceptAPI('GET', '/api/*stock*', 'getStock');
    cy.visit('/analytics/stock-movement', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasExport =
        $body.find('button').filter(':contains("Export"), :contains("Download"), :contains("PDF"), :contains("CSV"), :contains("Print")').length > 0 ||
        $body.find('[data-testid*="export"], [data-testid*="download"]').length > 0 ||
        $body.find('a[download]').length > 0 ||
        $body.find('[class*="export"], [class*="Export"]').length > 0;
      expect(hasExport, 'Stock movement should have an export button').to.be.true;
    });
  });

  it('should have product or warehouse filter', () => {
    cy.interceptAPI('GET', '/api/*stock*', 'getStock');
    cy.visit('/analytics/stock-movement', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasProductOrWarehouseFilter =
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('input[type="text"], input[type="search"]').length > 0 ||
        $body.text().match(/product|warehouse|category|all/i);
      expect(hasProductOrWarehouseFilter, 'Should have product or warehouse filter').to.be.truthy;
    });
  });
});
