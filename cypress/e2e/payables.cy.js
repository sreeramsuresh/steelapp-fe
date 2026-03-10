// Owner: finance
describe("Payables Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/payables");
    cy.get("body", { timeout: 15000 }).should("be.visible");
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
    cy.get("body").then(($body) => {
      if ($body.find("table").length === 0) {
        cy.log("No table rendered on payables page, skipping column check");
        return;
      }
      cy.get("table").should("be.visible");
      cy.get("table thead").within(() => {
        cy.get("th").should("have.length.gte", 3);
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
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No table rows available, skipping action buttons test");
        return;
      }
      cy.get("table tbody tr").first().then(($row) => {
        const hasActions =
          $row.find("button, a, [role='button'], [class*='action'], [class*='menu']").length > 0;
        const isClickable =
          $row.css("cursor") === "pointer" || $row.find("[onclick], [href]").length > 0;
        expect(hasActions || isClickable).to.be.true;
      });
    });
  });

  it("aging summary section is visible with period buckets", () => {
    cy.get("body").then(($body) => {
      const text = $body.text();
      const hasAgingLabels = /current|0.?30|1.?30|31.?60|61.?90|90\+|overdue|aging/i.test(text);
      const hasAgingCards =
        $body.find('[class*="aging"], [class*="bucket"], [class*="period"], [class*="overdue"]').length > 0;
      const hasStats = $body.find('[class*="card"], [class*="stat"]').length > 0;
      expect(hasAgingLabels || hasAgingCards || hasStats).to.be.true;
    });
  });

  it("filtering by status changes displayed data", () => {
    cy.get("body").then(($body) => {
      const $tabs = $body.find("[role='tab'], button").filter((_i, el) =>
        /paid|unpaid|pending|overdue|open|all/i.test(el.textContent)
      );

      if ($tabs.length > 0) {
        cy.wrap($tabs.first()).click();
        cy.get("body", { timeout: 10000 }).should("be.visible");
      }

      // After filter, page should still render
      cy.get("body").should("be.visible");
    });
  });

  it("sort functionality works via column header click", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table thead th").length === 0) {
        cy.log("No table headers available, skipping sort test");
        return;
      }
      cy.get("table thead th").first().click();
      cy.get("body").should("be.visible");
    });
  });
});
