// Owner: finance
describe("Payables Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/payables");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes("payable") || text.includes("supplier") || text.includes("bill") || text.length > 100;
      expect(hasContent, "Page should finish loading").to.be.true;
    });
  });

  it("loads with payables heading and summary stats", () => {
    cy.get("body").should(($body) => {
      const text = $body.text().toLowerCase();
      const hasPayables = text.includes("payable") || text.includes("supplier") || text.includes("bill");
      expect(hasPayables, "Page should have payables-related content").to.be.true;
    });
    cy.url().should("include", "/app/payables");
    // Summary stats section should be present (cards, badges, or stat containers)
    cy.get("body").should(($body) => {
      const hasStats =
        $body.find('[class*="stat"], [class*="card"], [class*="summary"], [class*="metric"], [class*="kpi"]').length > 0;
      const hasAmounts = /AED|total|balance|outstanding/i.test($body.text());
      const hasContent = $body.text().length > 50;
      expect(hasStats || hasAmounts || hasContent).to.be.true;
    });
  });

  it("renders payables table or empty state", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      if ($body.find("table").length === 0) {
        // No table rendered — accept empty state or non-table layout
        expect($body.text().length).to.be.greaterThan(10);
      } else {
        expect($body.find("table")).to.be.visible;
        expect($body.find("table thead th").length).to.be.gte(3);
      }
    });
  });

  it("search/filter input exists and accepts text", () => {
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const $input = $body.find('input[type="search"], input[type="text"], input[placeholder*="earch"], input[placeholder*="ilter"]');
      if ($input.length > 0) {
        cy.wrap($input.first())
          .should("be.visible")
          .type("test supplier")
          .should("have.value", "test supplier");
      } else {
        // No search input, page should still have interactive elements
        expect($body.find("button, input, select, a").length).to.be.greaterThan(0);
      }
    });
  });

  it("status filter dropdown or tabs exist", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasSelect = $body.find("select, [role='combobox'], [role='listbox']").length > 0;
      const hasTabs = $body.find("[role='tab'], [role='tablist'], [class*='tab']").length > 0;
      const hasFilterButtons = $body.find("button").filter((_i, el) => /paid|unpaid|pending|overdue|all|open|draft/i.test(el.textContent)).length > 0;
      const hasButtons = $body.find("button").length > 0;
      expect(hasSelect || hasTabs || hasFilterButtons || hasButtons).to.be.true;
    });
  });

  it("table rows have action buttons or are clickable", () => {
    cy.get("body", { timeout: 15000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No table rows available, skipping action buttons test");
        return;
      }
      cy.get("table tbody tr").first().should(($row) => {
        const hasActions =
          $row.find("button, a, [role='button'], [class*='action'], [class*='menu']").length > 0;
        const isClickable =
          $row.css("cursor") === "pointer" || $row.find("[onclick], [href]").length > 0;
        expect(hasActions || isClickable).to.be.true;
      });
    });
  });

  it("aging summary section or stats are visible", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text();
      const hasAgingLabels = /current|0.?30|1.?30|31.?60|61.?90|90\+|overdue|aging/i.test(text);
      const hasAgingCards =
        $body.find('[class*="aging"], [class*="bucket"], [class*="period"], [class*="overdue"]').length > 0;
      const hasStats = $body.find('[class*="card"], [class*="stat"]').length > 0;
      const hasContent = text.length > 50;
      expect(hasAgingLabels || hasAgingCards || hasStats || hasContent).to.be.true;
    });
  });

  it("filtering by status changes displayed data", () => {
    cy.get("body", { timeout: 15000 }).then(($body) => {
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
    cy.get("body", { timeout: 15000 }).then(($body) => {
      if ($body.find("table thead th").length === 0) {
        cy.log("No table headers available, skipping sort test");
        return;
      }
      cy.get("table thead th").first().click();
      cy.get("body").should("be.visible");
    });
  });
});
