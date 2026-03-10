// Owner: finance
// Tests: account statement management
// Route: /app/account-statements

describe("Account Statements - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/account-statements");
    cy.get("body", { timeout: 10000 }).should("be.visible");
  });

  it("should load the account statements page with heading", () => {
    cy.verifyPageLoads("Statement", "/app/account-statements");
  });

  it("should render statements table or list", () => {
    cy.get("table, [class*='list'], [class*='card']", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasContent =
        $body.find("table tbody tr").length > 0 || $body.text().length > 100;
      expect(hasContent, "Page should render statement content").to.be.true;
    });
  });

  it("should have a create or generate statement button", () => {
    cy.contains("button, a", /create|generate|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should have a search or filter input", () => {
    cy.get(
      'input[placeholder*="Search"], input[placeholder*="Filter"], input[placeholder*="Customer"]',
      { timeout: 10000 },
    )
      .first()
      .should("be.visible");
  });

  it("should display expected columns in the table", () => {
    cy.get("table", { timeout: 10000 }).should("exist");
    cy.get("table thead").then(($thead) => {
      const text = $thead.text().toLowerCase();
      const hasRelevantColumns =
        text.includes("customer") ||
        text.includes("period") ||
        text.includes("balance") ||
        text.includes("date") ||
        text.includes("amount");
      expect(hasRelevantColumns, "Table should have relevant columns").to.be.true;
    });
  });

  it("should show status indicators on rows", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("table tbody tr").first();
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/generated|sent|draft|pending|active/);
      expect(hasStatus, "Row should display a status indicator").to.be.true;
    });
  });
});
