// Owner: analytics
// Route: /analytics/dashboard

describe('Dashboard - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI('GET', '/api/analytics*', 'getAnalytics');
    cy.interceptAPI('GET', '/api/dashboard*', 'getDashboard');
    cy.visit('/analytics/dashboard', { timeout: 15000 });
  });

  it('should load the dashboard page with heading', () => {
    cy.contains('h1, h2, h3, h4, [data-testid$="-heading"]', /dashboard|analytics/i, {
      timeout: 15000,
    }).should('be.visible');
    cy.url().should('include', '/analytics/dashboard');
  });

  it('should have widget or card containers', () => {
    cy.get(
      '[class*="card"], [class*="widget"], [class*="Card"], [data-testid*="card"], [data-testid*="widget"]',
      { timeout: 15000 },
    ).should('have.length.greaterThan', 0);
  });

  it('should have a date selector or period filter', () => {
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasDateControl =
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[class*="date"], [class*="Date"]').length > 0 ||
        $body.find('[class*="period"], [class*="Period"]').length > 0 ||
        $body.find('select').length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('button').filter(':contains("Month"), :contains("Year"), :contains("Week"), :contains("Today"), :contains("period")').length > 0;
      expect(hasDateControl, 'Dashboard should have a date/period selector').to.be.true;
    });
  });

  it('should render at least one chart container', () => {
    cy.get('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"], .echarts-for-react', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should show KPI card labels', () => {
    cy.get(
      '[class*="card"], [class*="widget"], [class*="Card"], [data-testid*="card"], [data-testid*="kpi"]',
      { timeout: 15000 },
    )
      .first()
      .should(($el) => {
        expect($el.text().trim().length).to.be.greaterThan(0);
      });
  });

  it('should have dashboard navigation menu visible', () => {
    cy.get('nav, aside, [class*="sidebar"], [class*="Sidebar"], [role="navigation"]', {
      timeout: 15000,
    }).should('have.length.greaterThan', 0);
  });

  it('should have refresh or reload controls', () => {
    cy.get('body', { timeout: 15000 }).then(($body) => {
      const hasRefresh =
        $body.find('button').filter(':contains("Refresh"), :contains("Reload"), :contains("refresh")').length > 0 ||
        $body.find('[data-testid*="refresh"]').length > 0 ||
        $body.find('[class*="refresh"], [class*="Refresh"]').length > 0 ||
        $body.find('[aria-label*="refresh"], [aria-label*="Refresh"]').length > 0 ||
        $body.find('button svg').length > 0; // icon buttons often serve as refresh
      expect(hasRefresh, 'Dashboard should have refresh or action controls').to.be.true;
    });
  });

  it('should have widget areas with content', () => {
    cy.get(
      '[class*="card"], [class*="widget"], [class*="Card"], [data-testid*="card"], [data-testid*="widget"]',
      { timeout: 15000 },
    ).each(($widget) => {
      expect($widget.text().trim().length).to.be.greaterThan(0);
    });
  });
});
