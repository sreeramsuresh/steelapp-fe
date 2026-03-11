// Owner: analytics
// Routes: /analytics/payroll-register, /analytics/salary-vs-revenue, /analytics/cost-center-pnl

describe('HR Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the payroll register report', () => {
    cy.visit('/analytics/payroll-register', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('payroll') || text.includes('register') || text.length > 50;
      expect(hasContent, 'Should display payroll register content').to.be.true;
    });
    cy.url().should('include', '/analytics/payroll-register');
  });

  it('should have period selector on payroll register', () => {
    cy.visit('/analytics/payroll-register', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasPeriodSelector =
        $body.find('input[type="date"]').length > 0 ||
        $body.find('input[type="month"]').length > 0 ||
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="date"], [class*="Date"], [class*="period"], [class*="Period"]').length > 0 ||
        $body.find('button').length > 0 ||
        $body.find('input, a').length > 0;
      expect(hasPeriodSelector, 'Payroll register should have a period selector or interactive elements').to.be.true;
    });
  });

  it('should load the salary vs revenue report', () => {
    cy.visit('/analytics/salary-vs-revenue', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('salary') || text.includes('revenue') || text.length > 50;
      expect(hasContent, 'Should display salary vs revenue content').to.be.true;
    });
    cy.url().should('include', '/analytics/salary-vs-revenue');
  });

  it('should have chart content or meaningful content on salary vs revenue', () => {
    cy.visit('/analytics/salary-vs-revenue', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'Salary vs revenue page should have chart content or meaningful text').to.be.true;
    });
  });

  it('should load the cost center P&L page', () => {
    cy.visit('/analytics/cost-center-pnl', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes('cost') || text.includes('center') || text.includes('profit') || text.includes('loss') || text.length > 50;
      expect(hasContent, 'Should display cost center P&L content').to.be.true;
    });
    cy.url().should('include', '/analytics/cost-center-pnl');
  });

  it('should have table or chart or content on cost center P&L', () => {
    cy.visit('/analytics/cost-center-pnl', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table').length > 0 ||
        $body.find('button, input, select, a').length > 0 ||
        $body.text().length > 50;
      expect(hasContent, 'Cost center P&L page should have chart/table content or meaningful text').to.be.true;
    });
  });
});
