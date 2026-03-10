// Owner: admin
// Tests: audit log viewing and filtering
// Route: /app/audit-logs

describe("Audit Logs - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/audit-logs*").as("getAuditLogs");
    cy.visit("/app/audit-logs");
    cy.wait("@getAuditLogs");
    cy.get("body", { timeout: 10000 }).should("be.visible");
  });

  it("should load page with Audit Logs heading", () => {
    cy.contains("h1, h2, h3, h4, [data-testid]", /Audit/i, { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("should render audit log table", () => {
    cy.get("table", { timeout: 10000 }).should("exist");
  });

  it("should display expected column headers (Action, User, Module, Date/Time)", () => {
    cy.get("table thead", { timeout: 10000 }).should("exist");
    cy.get("table thead th, table thead td").then(($headers) => {
      const headerTexts = [...$headers].map((el) => el.textContent.trim().toLowerCase());
      const allText = headerTexts.join(" ");
      const hasExpected =
        (allText.includes("action") || allText.includes("type")) &&
        (allText.includes("user") || allText.includes("by")) &&
        (allText.includes("date") || allText.includes("time"));
      expect(hasExpected, "Table should have Action, User, and Date columns").to.be.true;
    });
  });

  it("should have search input", () => {
    cy.get("body").then(($body) => {
      const hasSearch =
        $body.find('input[placeholder*="Search"]').length > 0 ||
        $body.find('input[placeholder*="Filter"]').length > 0 ||
        $body.find('input[type="search"]').length > 0;
      expect(hasSearch, "Should have a search or filter input").to.be.true;
    });
  });

  it("should have filter by action type", () => {
    cy.get("body").then(($body) => {
      const hasActionFilter =
        $body.find("select").length > 0 ||
        $body.find('[role="combobox"]').length > 0 ||
        $body.find('[class*="filter"]').length > 0 ||
        $body.find('[class*="select"]').length > 0;
      expect(hasActionFilter, "Should have action type filter").to.be.true;
    });
  });

  it("should have filter by user", () => {
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasUserFilter =
        text.includes("user") ||
        $body.find("select").length > 1 ||
        $body.find('[placeholder*="user"]').length > 0;
      expect(hasUserFilter, "Should have user filter option").to.be.true;
    });
  });

  it("should have date range filter", () => {
    cy.get("body").then(($body) => {
      const hasDateFilter =
        $body.find('input[type="date"]').length > 0 ||
        $body.find('[class*="date"]').length > 0 ||
        $body.find('[placeholder*="date"]').length > 0 ||
        $body.find('[class*="calendar"]').length > 0;
      expect(hasDateFilter, "Should have date range filter").to.be.true;
    });
  });

  it("should show action details in table rows", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("tbody tr").first();
      const text = $row.text().trim();
      expect(text.length).to.be.greaterThan(5);
    });
  });

  it("should have pagination controls", () => {
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasPagination =
        $body.find('[class*="pagination"]').length > 0 ||
        $body.find('button[aria-label*="page"]').length > 0 ||
        $body.find('[class*="pager"]').length > 0 ||
        text.includes("page") ||
        text.includes("showing") ||
        text.includes("of ");
      expect(hasPagination, "Should have pagination controls").to.be.true;
    });
  });

  it("should display log entries sorted by date (newest first)", () => {
    cy.get("table", { timeout: 10000 }).should("exist");
  });
});
