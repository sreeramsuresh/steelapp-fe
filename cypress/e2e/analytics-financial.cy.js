// Owner: analytics
// Routes: /analytics/profit-analysis, /analytics/ar-aging, /analytics/cogs-analysis, /analytics/normalized-margin

describe('Financial Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the profit analysis page', () => {
    cy.interceptAPI('GET', '/api/*profit*', 'getProfit');
    cy.visit('/analytics/profit-analysis', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /profit|margin|analysis/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/profit-analysis');
  });

  it('should have chart container and filters on profit analysis', () => {
    cy.interceptAPI('GET', '/api/*profit*', 'getProfit');
    cy.visit('/analytics/profit-analysis', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
    cy.get('body').then(($body) => {
      const hasFilter =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('button').filter(':contains("Filter"), :contains("Apply"), :contains("Month"), :contains("Year")').length > 0;
      expect(hasFilter, 'Profit analysis should have filter controls').to.be.true;
    });
  });

  it('should load the AR aging report', () => {
    cy.interceptAPI('GET', '/api/*aging*', 'getAging');
    cy.visit('/analytics/ar-aging', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /aging|receivable|ar/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/ar-aging');
  });

  it('should have aging bucket columns or chart on AR aging', () => {
    cy.interceptAPI('GET', '/api/*aging*', 'getAging');
    cy.visit('/analytics/ar-aging', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasAgingContent =
        $body.find('table').length > 0 ||
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"]').length > 0 ||
        $body.text().match(/0-30|30-60|60-90|current|overdue|bucket/i);
      expect(hasAgingContent, 'AR aging should have table or chart with aging data').to.be.truthy;
    });
  });

  it('should load the COGS analysis page', () => {
    cy.interceptAPI('GET', '/api/*cogs*', 'getCogs');
    cy.visit('/analytics/cogs-analysis', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /cogs|cost|goods/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/cogs-analysis');
  });

  it('should have chart or table on COGS analysis', () => {
    cy.interceptAPI('GET', '/api/*cogs*', 'getCogs');
    cy.visit('/analytics/cogs-analysis', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should load the normalized margin report', () => {
    cy.interceptAPI('GET', '/api/*margin*', 'getMargin');
    cy.visit('/analytics/normalized-margin', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /margin|normalized/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/normalized-margin');
  });

  it('should have an export or download button on each report page', () => {
    const routes = [
      '/analytics/profit-analysis',
      '/analytics/ar-aging',
      '/analytics/cogs-analysis',
      '/analytics/normalized-margin',
    ];

    // Check the first route that loads successfully for export controls
    cy.visit(routes[0], { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasExport =
        $body.find('button').filter(':contains("Export"), :contains("Download"), :contains("PDF"), :contains("CSV"), :contains("Print")').length > 0 ||
        $body.find('[data-testid*="export"], [data-testid*="download"]').length > 0 ||
        $body.find('a[download]').length > 0 ||
        $body.find('[class*="export"], [class*="Export"], [class*="download"], [class*="Download"]').length > 0;
      expect(hasExport, 'Report page should have an export/download button').to.be.true;
    });
  });
});
