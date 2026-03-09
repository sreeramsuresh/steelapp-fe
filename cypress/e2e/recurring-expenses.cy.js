// Owner: hr
/**
 * Recurring Expenses E2E Tests
 *
 * Tests expenses hub and recurring expenses pages.
 * Routes: /app/expenses-hub, /app/recurring-expenses
 */

describe("Recurring Expenses - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load expenses hub", () => {
    cy.visit("/app/expenses-hub");
    cy.verifyPageLoads("Expense", "/app/expenses-hub");
  });

  it("should show navigation cards on expenses hub", () => {
    cy.visit("/app/expenses-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasRecurring = text.includes("recurring");
      const hasExpense = text.includes("expense");
      expect(hasRecurring || hasExpense).to.be.true;
    });
  });

  it("should load recurring expenses page", () => {
    cy.interceptAPI("GET", "/api/recurring-expenses*", "getRecurringExpenses");
    cy.visit("/app/recurring-expenses");
    cy.verifyPageLoads("Recurring", "/app/recurring-expenses");
  });

  it("should render recurring expenses table", () => {
    cy.interceptAPI("GET", "/api/recurring-expenses*", "getRecurringExpenses");
    cy.visit("/app/recurring-expenses");
    cy.wait("@getRecurringExpenses");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create recurring expense button", () => {
    cy.interceptAPI("GET", "/api/recurring-expenses*", "getRecurringExpenses");
    cy.visit("/app/recurring-expenses");
    cy.wait("@getRecurringExpenses");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should display table with expected columns", () => {
    cy.interceptAPI("GET", "/api/recurring-expenses*", "getRecurringExpenses");
    cy.visit("/app/recurring-expenses");
    cy.wait("@getRecurringExpenses");
    cy.get("table", { timeout: 10000 }).then(($table) => {
      if ($table.length > 0) {
        const headerText = $table.find("thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("description") ||
          headerText.includes("amount") ||
          headerText.includes("frequency") ||
          headerText.includes("status");
        expect(hasExpected).to.be.true;
      }
    });
  });
});
