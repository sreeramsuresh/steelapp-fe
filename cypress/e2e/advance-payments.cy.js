// Owner: finance
// Tests: advance payment management
// Route: /app/advance-payments

describe("Advance Payments - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/advance-payments*", "getAdvancePayments");
    cy.visit("/app/advance-payments");
    cy.wait("@getAdvancePayments");
  });

  it("should load the advance payments page with heading", () => {
    cy.verifyPageLoads("Advance", "/app/advance-payments");
  });

  it("should render payments table", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should have a create advance payment button", () => {
    cy.contains("button, a", /create|new|add|record/i, { timeout: 10000 }).should("be.visible");
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search" i]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should display expected columns in the table", () => {
    cy.get("table thead th, table thead td").should("have.length.greaterThan", 2);
  });

  it("should show status indicators on rows", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().then(($row) => {
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/pending|applied|refunded|partial|active|cancelled/);
      expect(hasStatus, "Row should display a status indicator").to.be.true;
    });
  });
});
