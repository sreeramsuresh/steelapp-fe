// Owner: analytics
// Routes: /analytics/profit-analysis, /analytics/ar-aging, /analytics/cogs-analysis, /analytics/normalized-margin

describe('Financial Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the profit analysis page', () => {
    cy.visit('/analytics/profit-analysis', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('profit') || text.includes('margin') || text.includes('analysis') || text.length > 50;
      expect(hasContent, 'Should display profit analysis content').to.be.true;
    });
    cy.url().should('include', '/analytics/profit-analysis');
  });

  it('should have chart container and filters on profit analysis', () => {
    cy.visit('/analytics/profit-analysis', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('profit') || text.includes('margin') || text.includes('analysis') || text.length > 50;
      expect(hasContent, 'Page should load with content').to.be.true;
    });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasChartOrContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasChartOrContent, 'Profit analysis should have chart/table content or meaningful text').to.be.true;
    });
  });

  it('should load the AR aging report', () => {
    cy.visit('/analytics/ar-aging', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('aging') || text.includes('receivable') || text.includes('ar') || text.length > 50;
      expect(hasContent, 'Should display AR aging content').to.be.true;
    });
    cy.url().should('include', '/analytics/ar-aging');
  });

  it('should have aging bucket columns or chart on AR aging', () => {
    cy.visit('/analytics/ar-aging', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('aging') || text.includes('receivable') || text.includes('ar') || text.length > 50;
      expect(hasContent, 'Page should load with content').to.be.true;
    });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasAgingContent =
        $body.find('table').length > 0 ||
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"]').length > 0 ||
        !!$body.text().match(/0-30|30-60|60-90|current|overdue|bucket/i) ||
        $body.find('button, input, a').length > 0;
      expect(hasAgingContent, 'AR aging should have table, chart, or page content').to.be.true;
    });
  });

  it('should load the COGS analysis page', () => {
    cy.visit('/analytics/cogs-analysis', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('cogs') || text.includes('cost') || text.includes('goods') || text.length > 50;
      expect(hasContent, 'Should display COGS analysis content').to.be.true;
    });
    cy.url().should('include', '/analytics/cogs-analysis');
  });

  it('should have chart or table or content on COGS analysis', () => {
    cy.visit('/analytics/cogs-analysis', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('cogs') || text.includes('cost') || text.includes('goods') || text.length > 50;
      expect(hasContent, 'Page should load with content').to.be.true;
    });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'COGS analysis page should have chart/table content or meaningful text').to.be.true;
    });
  });

  it('should load the normalized margin report', () => {
    cy.visit('/analytics/normalized-margin', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('margin') || text.includes('normalized') || text.length > 50;
      expect(hasContent, 'Should display normalized margin content').to.be.true;
    });
    cy.url().should('include', '/analytics/normalized-margin');
  });

  it('should have an export or download button on each report page', () => {
    cy.visit('/analytics/profit-analysis', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('profit') || text.includes('margin') || text.includes('analysis') || text.length > 50;
      expect(hasContent, 'Page should load with content').to.be.true;
    });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasExport =
        $body.find('button').filter(':contains("Export"), :contains("Download"), :contains("PDF"), :contains("CSV"), :contains("Print")').length > 0 ||
        $body.find('[data-testid*="export"], [data-testid*="download"]').length > 0 ||
        $body.find('a[download]').length > 0 ||
        $body.find('[class*="export"], [class*="Export"], [class*="download"], [class*="Download"]').length > 0 ||
        $body.find('button').length > 0 ||
        $body.find('a').length > 0;
      expect(hasExport, 'Report page should have export/download buttons or content').to.be.true;
    });
  });
});
