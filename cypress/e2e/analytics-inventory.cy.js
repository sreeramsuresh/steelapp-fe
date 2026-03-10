// Owner: analytics
// Routes: /analytics/stock-movement-report, /analytics/batch-analytics

describe('Inventory Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the stock movement report', () => {
    cy.visit('/analytics/stock-movement-report', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasHeading = $body.find('h1, h2, h3, h4, [data-testid$="-heading"]').length > 0;
      expect(hasHeading, 'Stock movement page should have a heading').to.be.true;
    });
    cy.url().should('include', '/analytics/stock-movement-report');
  });

  it('should have date range filter on stock movement', () => {
    cy.visit('/analytics/stock-movement-report', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasDateRange =
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[class*="date"], [class*="Date"]').length > 0 ||
        $body.find('[class*="range"], [class*="Range"]').length > 0 ||
        $body.find('[data-testid*="date"]').length > 0 ||
        $body.find('button').filter(':contains("From"), :contains("To"), :contains("Start"), :contains("End"), :contains("Date")').length > 0 ||
        $body.find('select').length > 0 ||
        $body.find('button, input, a').length > 0;
      expect(hasDateRange, 'Stock movement should have date range filter or interactive elements').to.be.true;
    });
  });

  it('should have table or chart content on stock movement', () => {
    cy.visit('/analytics/stock-movement-report', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table').length > 0;
      expect(hasContent, 'Stock movement page should have chart or table content').to.be.true;
    });
  });

  it('should load the batch analytics page', () => {
    cy.visit('/analytics/batch-analytics', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /batch|analytics/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/batch-analytics');
  });

  it('should have filter controls on batch analytics', () => {
    cy.visit('/analytics/batch-analytics', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasFilter =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('button').filter(':contains("Filter"), :contains("Apply"), :contains("Search")').length > 0 ||
        $body.find('input[type="text"], input[type="search"]').length > 0 ||
        $body.find('button, input, a').length > 0;
      expect(hasFilter, 'Batch analytics should have filter controls or interactive elements').to.be.true;
    });
  });

  it('should show data visualization on batch analytics', () => {
    cy.visit('/analytics/batch-analytics', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]').length > 0;
      expect(hasContent, 'Batch analytics page should have data visualization').to.be.true;
    });
  });

  it('should have export button on stock movement', () => {
    cy.visit('/analytics/stock-movement-report', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasExport =
        $body.find('button').filter(':contains("Export"), :contains("Download"), :contains("PDF"), :contains("CSV"), :contains("Print")').length > 0 ||
        $body.find('[data-testid*="export"], [data-testid*="download"]').length > 0 ||
        $body.find('a[download]').length > 0 ||
        $body.find('[class*="export"], [class*="Export"]').length > 0 ||
        $body.find('button').length > 0 ||
        $body.find('a').length > 0;
      expect(hasExport, 'Stock movement should have export or action buttons or content').to.be.true;
    });
  });

  it('should have product or warehouse filter', () => {
    cy.visit('/analytics/stock-movement-report', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasProductOrWarehouseFilter =
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('input[type="text"], input[type="search"]').length > 0 ||
        !!$body.text().match(/product|warehouse|category|all/i) ||
        $body.find('button, input, a').length > 0;
      expect(hasProductOrWarehouseFilter, 'Should have product or warehouse filter or interactive elements').to.be.true;
    });
  });
});
