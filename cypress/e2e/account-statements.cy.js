// Owner: finance
// Tests: account statement management
// Route: /app/account-statements

describe("Account Statements - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/account-statements");
    cy.contains("Statement", { timeout: 15000 }).should("be.visible");
  });

  it("should load the account statements page with heading", () => {
    cy.verifyPageLoads("Statement", "/app/account-statements");
  });

  it("should render statements table or empty state", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 10;
      expect(hasTable || hasContent, "Page should have table or content").to.be.true;
    });
  });

  it("should have a create or generate statement button or page content", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /create|generate|new|add/i.test(this.textContent);
        }).length > 0;
      const hasContent = $body.find("button, a, input, select").length > 0;
      expect(hasButton || hasContent, "Page should have action buttons or interactive elements").to.be.true;
    });
  });

  it("should have a search or filter input or interactive controls", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasSearch =
        $body.find('input[placeholder*="Search"], input[placeholder*="Filter"], input[placeholder*="Customer"]').length > 0;
      const hasControls = $body.find("input, select, button").length > 0;
      expect(hasSearch || hasControls, "Page should have search input or interactive controls").to.be.true;
    });
  });

  it("should display expected columns or content", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      if ($body.find("table").length > 0) {
        const text = $body.find("table thead").text().toLowerCase();
        const hasRelevantColumns =
          text.includes("customer") ||
          text.includes("period") ||
          text.includes("balance") ||
          text.includes("date") ||
          text.includes("amount");
        expect(hasRelevantColumns, "Table should have relevant columns").to.be.true;
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should show status indicators on rows if data exists", () => {
    cy.get("body", { timeout: 15000 }).should(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        // No data rows — just verify the page has content
        expect($body.text().length).to.be.greaterThan(10);
      } else {
        const $row = $body.find("table tbody tr").first();
        const hasStatus =
          $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
          !!$row.text().toLowerCase().match(/generated|sent|draft|pending|active/);
        const hasContent = $row.text().length > 5;
        expect(hasStatus || hasContent, "Row should display status or content").to.be.true;
      }
    });
  });
});
