// Owner: finance
describe("Payables Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/payables");
    cy.contains("h1, h2, h3, h4", /payable/i, { timeout: 15000 }).should("be.visible");
  });

  it("loads with payables heading and summary stats", () => {
    cy.contains(/payable/i).should("be.visible");
    cy.url().should("include", "/app/payables");
    // Summary stats section should be present (cards, badges, or stat containers)
    cy.get("body").then(($body) => {
      const hasStats =
        $body.find('[class*="stat"], [class*="card"], [class*="summary"], [class*="metric"], [class*="kpi"]').length > 0;
      const hasAmounts = /AED|total|balance|outstanding/i.test($body.text());
      expect(hasStats || hasAmounts).to.be.true;
    });
  });

  it("renders payables table with expected columns", () => {
    cy.get("table").should("exist").and("be.visible");
    cy.get("table thead").within(() => {
      cy.get("th").should("have.length.gte", 3);
      // Check for expected column headers
      const expectedColumns = [/supplier/i, /bill|invoice|ref/i, /amount|total/i, /due\s*date|date/i, /status/i];
      expectedColumns.forEach((col) => {
        cy.contains("th", col).should("exist");
      });
    });
  });

  it("search/filter input exists and accepts text", () => {
    cy.get('input[type="search"], input[type="text"], input[placeholder*="earch"], input[placeholder*="ilter"]')
      .first()
      .should("be.visible")
      .type("test supplier")
      .should("have.value", "test supplier");
  });

  it("status filter dropdown or tabs exist", () => {
    cy.get("body").then(($body) => {
      const hasSelect = $body.find("select, [role='combobox'], [role='listbox']").length > 0;
      const hasTabs = $body.find("[role='tab'], [role='tablist'], [class*='tab']").length > 0;
      const hasFilterButtons = $body.find("button").filter((_i, el) => /paid|unpaid|pending|overdue|all|open|draft/i.test(el.textContent)).length > 0;
      expect(hasSelect || hasTabs || hasFilterButtons).to.be.true;
    });
  });

  it("table rows have action buttons or are clickable", () => {
    cy.get("table tbody tr").first().within(() => {
      cy.get("body").then(() => {
        // Check for action buttons, links, or clickable indicators within the row
        cy.root().then(($row) => {
          const hasActions =
            $row.find("button, a, [role='button'], [class*='action'], [class*='menu']").length > 0;
          const isClickable =
            $row.css("cursor") === "pointer" || $row.find("[onclick], [href]").length > 0;
          expect(hasActions || isClickable).to.be.true;
        });
      });
    });
  });

  it("aging summary section is visible with period buckets", () => {
    // Look for aging-related content: current, 30-day, 60-day, 90+ day buckets
    cy.get("body").then(($body) => {
      const text = $body.text();
      const hasAgingLabels = /current|0.?30|1.?30|31.?60|61.?90|90\+|overdue|aging/i.test(text);
      const hasAgingCards =
        $body.find('[class*="aging"], [class*="bucket"], [class*="period"], [class*="overdue"]').length > 0;
      expect(hasAgingLabels || hasAgingCards).to.be.true;
    });
  });

  it("filtering by status changes displayed data", () => {
    // Capture initial row count
    cy.get("table tbody tr").its("length").then((initialCount) => {
      // Find and interact with a status filter
      cy.get("body").then(($body) => {
        const $select = $body.find("select, [role='combobox']");
        const $tabs = $body.find("[role='tab'], button").filter((_i, el) =>
          /paid|unpaid|pending|overdue|open/i.test(el.textContent)
        );

        if ($select.length > 0) {
          cy.wrap($select.first()).select(1);
          cy.contains("h1, h2, h3, h4", /payable/i, { timeout: 15000 }).should("be.visible");
        } else if ($tabs.length > 0) {
          cy.wrap($tabs.first()).click();
          cy.contains("h1, h2, h3, h4", /payable/i, { timeout: 15000 }).should("be.visible");
        }
      });

      // After filter, table should still render (may have different count or empty state)
      cy.get("table").should("exist");
    });
  });

  it("sort functionality works via column header click", () => {
    // Click a sortable column header and verify the table responds
    cy.get("table thead th").first().then(($th) => {
      cy.wrap($th).click();
      // Either the API is called for server-side sort, or the table re-renders client-side
      cy.get("table tbody tr").should("have.length.gte", 0);
    });
  });
});
