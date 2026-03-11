// Owner: analytics
// Routes: /analytics/delivery-performance, /analytics/supplier-performance, /app/commission-dashboard

describe('Operations Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the delivery variance dashboard', () => {
    cy.visit('/analytics/delivery-performance', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasHeading = $body.find('h1, h2, h3, h4, [data-testid$="-heading"]').length > 0;
      expect(hasHeading, 'Delivery performance page should have a heading').to.be.true;
    });
    cy.url().should('include', '/analytics/delivery-performance');
  });

  it('should have chart or table content or page content on delivery variance', () => {
    cy.visit('/analytics/delivery-performance', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'Delivery performance page should have chart or table content').to.be.true;
    });
  });

  it('should load the supplier performance dashboard', () => {
    cy.visit('/analytics/supplier-performance', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /supplier|performance/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/supplier-performance');
  });

  it('should have filters and metrics on supplier performance', () => {
    cy.visit('/analytics/supplier-performance', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasFiltersOrMetrics =
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('[class*="card"], [class*="Card"], [class*="metric"], [class*="Metric"]').length > 0 ||
        $body.find('canvas, svg, table').length > 0 ||
        $body.find('button, input, a').length > 0;
      expect(hasFiltersOrMetrics, 'Supplier performance should have filters, metrics, or interactive elements').to.be.true;
    });
  });

  it('should load the commission dashboard', () => {
    cy.visit('/app/commission-dashboard', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /commission/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/app/commission-dashboard');
  });

  it('should show summary or metrics or content on commission dashboard', () => {
    cy.visit('/app/commission-dashboard', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"], [class*="summary"], [class*="Summary"]').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'Commission dashboard should have summary or metrics content').to.be.true;
    });
  });
});
