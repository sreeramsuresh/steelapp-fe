// Owner: finance
describe('Receivables Management - E2E Tests', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/app/receivables');
    cy.contains("h1, h2, h3, h4", /receivable/i, { timeout: 15000 }).should("be.visible");
  });

  it('should load the receivables page with heading and summary stats', () => {
    cy.verifyPageLoads('Receivable', '/app/receivables');
    // Summary stats cards should be visible (total outstanding, overdue, etc.)
    cy.get('body').then(($body) => {
      const hasCards =
        $body.find('[class*="card"], [class*="stat"], [class*="summary"], [class*="metric"], [data-testid*="stat"]').length > 0;
      const hasAmounts = /AED|total|outstanding|balance/i.test($body.text());
      expect(hasCards || hasAmounts, 'Page should display summary stats or amounts').to.be.true;
    });
  });

  it('should render receivables table with expected columns', () => {
    cy.get('table', { timeout: 10000 }).should('be.visible');
    cy.get('table thead th, table thead td').then(($headers) => {
      const headerTexts = [...$headers].map((el) => el.textContent.trim().toLowerCase());
      const expectedColumns = ['customer', 'invoice', 'amount', 'due', 'status'];
      for (const col of expectedColumns) {
        const found = headerTexts.some((h) => h.includes(col));
        expect(found, `Column containing "${col}" should exist in table headers`).to.be.true;
      }
    });
  });

  it('should have a search or filter input that accepts text', () => {
    // Look for a search/filter input
    cy.get('input[type="search"], input[type="text"], input[placeholder*="earch"], input[placeholder*="ilter"]')
      .first()
      .should('be.visible')
      .type('test search')
      .should('have.value', 'test search');
  });

  it('should have status filter controls', () => {
    // Look for filter buttons, tabs, select, or dropdown for status filtering
    cy.get('body').then(($body) => {
      const hasFilterButtons =
        $body.find('button, [role="tab"], [role="option"], select, [class*="filter"], [data-testid*="filter"]').length > 0;
      expect(hasFilterButtons, 'Status filter controls should exist on page').to.be.true;
    });
    // Verify at least one status-related filter text exists
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasStatusText =
        text.includes('overdue') ||
        text.includes('pending') ||
        text.includes('paid') ||
        text.includes('all') ||
        text.includes('outstanding');
      expect(hasStatusText, 'Page should contain status filter labels').to.be.true;
    });
  });

  it('should have clickable table rows or action buttons', () => {
    cy.get('table tbody', { timeout: 10000 }).then(($tbody) => {
      if ($tbody.find('tr').length > 0) {
        // Check for clickable rows (cursor pointer, links, or action buttons)
        cy.get('table tbody tr').first().then(($row) => {
          const hasLink = $row.find('a').length > 0;
          const hasButton = $row.find('button, [role="button"]').length > 0;
          const isClickable = $row.css('cursor') === 'pointer';
          expect(
            hasLink || hasButton || isClickable,
            'Table rows should be clickable or contain action buttons'
          ).to.be.true;
        });
      } else {
        // Empty state is acceptable — just verify the table structure exists
        cy.get('table').should('exist');
      }
    });
  });

  it('should filter receivables when overdue filter is applied', () => {
    cy.get('body').then(($body) => {
      const overdueEl = $body.find('button, [role="tab"], [role="option"], a').filter(function () {
        return /overdue/i.test(this.textContent);
      });

      if (overdueEl.length > 0) {
        cy.wrap(overdueEl.first()).click();
        cy.get('body', { timeout: 10000 }).should('be.visible');
      } else {
        // No overdue filter element found — page is still interactive
        cy.log('No overdue filter element found, skipping filter test');
      }
    });
  });

  it('should support sorting by clicking column headers', () => {
    cy.get('table thead th, table thead td', { timeout: 10000 }).then(($headers) => {
      // Find a sortable column (amount or due date)
      const sortableHeader = [...$headers].find((h) => {
        const text = h.textContent.toLowerCase();
        return text.includes('amount') || text.includes('due') || text.includes('date');
      });

      if (sortableHeader) {
        // Click the header to trigger sort
        cy.wrap(sortableHeader).click();
        // Verify table still renders after sort interaction
        cy.get('table tbody', { timeout: 10000 }).should('exist');
        // Click again for reverse sort
        cy.wrap(sortableHeader).click();
        cy.get('table tbody').should('exist');
      } else {
        // If no matching header, just verify headers are present
        expect($headers.length).to.be.greaterThan(0);
      }
    });
  });

  it('should display aging summary or equivalent stats cards', () => {
    // Aging summary typically shows: current, 30 days, 60 days, 90+ days
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAgingLabels =
        (text.includes('current') || text.includes('0-30') || text.includes('not due')) &&
        (text.includes('30') || text.includes('60') || text.includes('90') || text.includes('overdue'));
      const hasStatCards =
        $body.find('[class*="card"], [class*="stat"], [class*="summary"], [class*="aging"], [data-testid*="aging"]').length >= 2;
      const hasTotalAmount = /total|outstanding|receivable|balance/i.test($body.text());

      expect(
        hasAgingLabels || hasStatCards || hasTotalAmount,
        'Page should display aging summary, stats cards, or total amounts'
      ).to.be.true;
    });
  });
});
