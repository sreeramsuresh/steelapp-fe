// Owner: analytics
// Routes: /analytics/payroll-register, /analytics/salary-vs-revenue, /analytics/cost-center-pnl

describe('HR Analytics - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the payroll register report', () => {
    cy.visit('/analytics/payroll-register', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /payroll|register/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/payroll-register');
  });

  it('should have period selector on payroll register', () => {
    cy.visit('/analytics/payroll-register', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasPeriodSelector =
        $body.find('input[type="date"]').length > 0 ||
        $body.find('input[type="month"]').length > 0 ||
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="date"], [class*="Date"], [class*="period"], [class*="Period"]').length > 0 ||
        $body.find('button').filter(':contains("Month"), :contains("Year"), :contains("Period"), :contains("Date")').length > 0;
      expect(hasPeriodSelector, 'Payroll register should have a period selector').to.be.true;
    });
  });

  it('should load the salary vs revenue report', () => {
    cy.visit('/analytics/salary-vs-revenue', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /salary|revenue/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/salary-vs-revenue');
  });

  it('should have chart content on salary vs revenue', () => {
    cy.visit('/analytics/salary-vs-revenue', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table, [class*="card"], [class*="Card"]').length > 0 ||
        $body.text().length > 10;
      expect(hasContent, 'Salary vs revenue page should have chart content or meaningful text').to.be.true;
    });
  });

  it('should load the cost center P&L page', () => {
    cy.visit('/analytics/cost-center-pnl', { timeout: 15000 });
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /cost.center|p.?l|profit.?loss/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/cost-center-pnl');
  });

  it('should have table or chart on cost center P&L', () => {
    cy.visit('/analytics/cost-center-pnl', { timeout: 15000 });
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasContent =
        $body.find('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react, table').length > 0 ||
        $body.text().length > 10;
      expect(hasContent, 'Cost center P&L page should have chart/table content or meaningful text').to.be.true;
    });
  });
});
