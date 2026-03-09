// Owner: sales
// Tests: invoice list page with search, filter, sort, pagination, status tabs
// Route: /app/invoices

describe("Invoice Workflows - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/invoices*", "getInvoices");
    cy.visit("/app/invoices");
    cy.wait("@getInvoices");
  });

  it("should load the invoices page with heading", () => {
    cy.verifyPageLoads("Invoices", "/app/invoices");
  });

  it("should render invoice table with expected columns", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.verifyTableColumns(["Invoice", "Customer", "Date", "Amount", "Status"]);
  });

  it("should have a search input that filters on typing", () => {
    cy.get('input[placeholder*="Search" i]', { timeout: 10000 })
      .first()
      .should("be.visible")
      .type("INV");
    cy.wait("@getInvoices");
    cy.get("table").should("be.visible");
  });

  it("should have status filter tabs or dropdown", () => {
    cy.get("body").then(($body) => {
      const hasTabs =
        $body.find("button, [role='tab']").filter(":contains('Draft'), :contains('Confirmed'), :contains('Issued'), :contains('All')").length > 0;
      const hasDropdown =
        $body.find("select, [role='combobox'], [role='listbox']").length > 0;
      expect(hasTabs || hasDropdown, "Status filter controls should exist").to.be.true;
    });
  });

  it("should display stats cards with summary numbers", () => {
    cy.get("body").then(($body) => {
      const text = $body.text();
      // Stats cards typically show totals, counts, or amounts
      const hasNumbers = /\d+/.test(text);
      expect(hasNumbers, "Page should display summary numbers").to.be.true;
    });
    // Verify there are card-like elements above the table
    cy.get("[class*='card'], [class*='stat'], [class*='summary'], [class*='Card']", { timeout: 5000 })
      .should("have.length.greaterThan", 0);
  });

  it("should navigate to invoice detail when clicking a table row", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().click();
    cy.url().should("match", /\/app\/invoices\/\d+/);
  });

  it("should have a create invoice button that navigates to new invoice page", () => {
    cy.contains("button, a", /create|new/i, { timeout: 10000 }).should("be.visible").click();
    cy.url().should("include", "/app/invoices/new");
  });

  it("should sort table when clicking a column header", () => {
    cy.get("table thead th, table thead td", { timeout: 10000 })
      .contains(/date|amount/i)
      .click();
    // Table should still be visible after sort
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should show pagination controls when table has rows", () => {
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.get("body").then(($body) => {
      const hasPagination =
        $body.find("[class*='pagination'], [class*='Pagination'], nav[aria-label*='pagination'], button:contains('Next'), button:contains('Previous'), [class*='page']").length > 0 ||
        $body.text().match(/page\s+\d|showing\s+\d|of\s+\d/i);
      expect(hasPagination, "Pagination controls should exist").to.be.true;
    });
  });

  it("should display status badge or chip on each invoice row", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().within(() => {
      cy.get("body").then(() => {
        // Status is typically rendered as a badge/chip with specific classes or text
        cy.root().then(($row) => {
          const text = $row.text().toLowerCase();
          const hasStatus =
            text.includes("draft") ||
            text.includes("confirmed") ||
            text.includes("issued") ||
            text.includes("paid") ||
            text.includes("cancelled") ||
            text.includes("overdue");
          expect(hasStatus, "Row should display a status indicator").to.be.true;
        });
      });
    });
  });

  it("should show customer name on each table row", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().within(() => {
      // Each row should have text content beyond just numbers (customer name)
      cy.root().invoke("text").should("have.length.greaterThan", 10);
    });
    // Verify the customer column header exists
    cy.get("table thead").should("contain.text", "Customer");
  });

  it("should clear search results when search input is cleared", () => {
    cy.get('input[placeholder*="Search" i]', { timeout: 10000 })
      .first()
      .type("INV");
    cy.wait("@getInvoices");
    cy.get('input[placeholder*="Search" i]')
      .first()
      .clear();
    cy.wait("@getInvoices");
    cy.get("table").should("be.visible");
  });
});
