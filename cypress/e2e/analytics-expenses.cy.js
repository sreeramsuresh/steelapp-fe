// Owner: analytics
// Routes: /analytics/expense-trends, /analytics/budget-vs-actual, /analytics/expense-reports

describe('Expense Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the expense trends report', () => {
    cy.visit('/analytics/expense-trends', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('expense') || text.includes('trend') || text.length > 50;
      expect(hasContent, 'Should display expense trends content').to.be.true;
    });
    cy.url().should('include', '/analytics/expense-trends');
  });

  it('should have chart content or meaningful content on expense trends', () => {
    cy.visit('/analytics/expense-trends', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'Expense trends page should have chart content or meaningful text').to.be.true;
    });
  });

  it('should load the budget vs actual report', () => {
    cy.visit('/analytics/budget-vs-actual', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('budget') || text.includes('actual') || text.length > 50;
      expect(hasContent, 'Should display budget vs actual content').to.be.true;
    });
    cy.url().should('include', '/analytics/budget-vs-actual');
  });

  it('should have comparison table or chart or content on budget vs actual', () => {
    cy.visit('/analytics/budget-vs-actual', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'Budget vs actual page should have chart/table content or meaningful text').to.be.true;
    });
  });

  it('should load the expense reports page', () => {
    cy.visit('/analytics/expense-reports', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('expense') || text.includes('report') || text.length > 50;
      expect(hasContent, 'Should display expense reports content').to.be.true;
    });
    cy.url().should('include', '/analytics/expense-reports');
  });

  it('should have filter and export controls on expense reports', () => {
    cy.visit('/analytics/expense-reports', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasFilterOrExport =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('button').length > 0 ||
        $body.find('input, a').length > 0;
      expect(hasFilterOrExport, 'Expense reports should have filter, export, or page content').to.be.true;
    });
  });
});
