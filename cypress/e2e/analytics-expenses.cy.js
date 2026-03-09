// Owner: analytics
// Routes: /analytics/expense-trends, /analytics/budget-vs-actual, /analytics/expense-reports

describe('Expense Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the expense trends report', () => {
    cy.interceptAPI('GET', '/api/*expense*', 'getExpenses');
    cy.visit('/analytics/expense-trends', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /expense|trend/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/expense-trends');
  });

  it('should have chart content on expense trends', () => {
    cy.interceptAPI('GET', '/api/*expense*', 'getExpenses');
    cy.visit('/analytics/expense-trends', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should load the budget vs actual report', () => {
    cy.interceptAPI('GET', '/api/*budget*', 'getBudget');
    cy.visit('/analytics/budget-vs-actual', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /budget|actual/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/budget-vs-actual');
  });

  it('should have comparison table or chart on budget vs actual', () => {
    cy.interceptAPI('GET', '/api/*budget*', 'getBudget');
    cy.visit('/analytics/budget-vs-actual', { timeout: 15000 });
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should load the expense reports page', () => {
    cy.interceptAPI('GET', '/api/*expense*', 'getExpenseReports');
    cy.visit('/analytics/expense-reports', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /expense|report/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/expense-reports');
  });

  it('should have filter and export controls on expense reports', () => {
    cy.interceptAPI('GET', '/api/*expense*', 'getExpenseReports');
    cy.visit('/analytics/expense-reports', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasFilterOrExport =
        $body.find('select').length > 0 ||
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"], [class*="Filter"]').length > 0 ||
        $body.find('button').filter(':contains("Export"), :contains("Download"), :contains("Filter"), :contains("Apply"), :contains("CSV"), :contains("PDF")').length > 0 ||
        $body.find('[data-testid*="export"], [data-testid*="filter"]').length > 0;
      expect(hasFilterOrExport, 'Expense reports should have filter or export controls').to.be.true;
    });
  });
});
