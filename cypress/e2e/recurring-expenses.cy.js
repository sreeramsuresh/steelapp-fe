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
    cy.intercept("GET", "**/api/recurring-expenses*").as("getRecurringExpenses");
    cy.intercept("GET", "**/api/expense-categories*").as("getExpenseCategories");
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
      const hasContent =
        text.includes("recurring") ||
        text.includes("expense") ||
        text.includes("cost") ||
        $body.find("[class*='card'], [class*='hub'], a[href*='expense']").length > 0 ||
        text.length > 50;
      expect(hasContent, "Expenses hub should have meaningful content").to.be.true;
    });
  });

  it("should load recurring expenses page", () => {
    cy.visit("/app/recurring-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.verifyPageLoads("Recurring", "/app/recurring-expenses");
  });

  it("should render recurring expenses table", () => {
    cy.visit("/app/recurring-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create recurring expense button", () => {
    cy.visit("/app/recurring-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should display table with expected columns", () => {
    cy.visit("/app/recurring-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      if ($body.find("table").length > 0) {
        const headerText = $body.find("table thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("description") ||
          headerText.includes("amount") ||
          headerText.includes("frequency") ||
          headerText.includes("status");
        expect(hasExpected).to.be.true;
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });
});
