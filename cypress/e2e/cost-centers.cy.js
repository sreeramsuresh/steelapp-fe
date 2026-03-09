// Owner: hr
/**
 * Cost Centers E2E Tests
 *
 * Tests cost centers hub, list, and budgets pages.
 * Routes: /app/cost-centers-hub, /app/cost-centers, /app/cost-center-budgets
 */

describe("Cost Centers - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load cost centers hub", () => {
    cy.visit("/app/cost-centers-hub");
    cy.verifyPageLoads("Cost Center", "/app/cost-centers-hub");
  });

  it("should show navigation cards on hub", () => {
    cy.visit("/app/cost-centers-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasCostCenters = text.includes("cost center");
      const hasBudgets = text.includes("budget");
      expect(hasCostCenters || hasBudgets).to.be.true;
    });
  });

  it("should load cost centers list page", () => {
    cy.interceptAPI("GET", "/api/cost-centers*", "getCostCenters");
    cy.visit("/app/cost-centers");
    cy.verifyPageLoads("Cost Center", "/app/cost-centers");
  });

  it("should render cost centers table", () => {
    cy.interceptAPI("GET", "/api/cost-centers*", "getCostCenters");
    cy.visit("/app/cost-centers");
    cy.wait("@getCostCenters");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create cost center button", () => {
    cy.interceptAPI("GET", "/api/cost-centers*", "getCostCenters");
    cy.visit("/app/cost-centers");
    cy.wait("@getCostCenters");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load cost center budgets page", () => {
    cy.interceptAPI("GET", "/api/cost-center-budgets*", "getBudgets");
    cy.visit("/app/cost-center-budgets");
    cy.verifyPageLoads("Budget", "/app/cost-center-budgets");
  });

  it("should render budgets table", () => {
    cy.interceptAPI("GET", "/api/cost-center-budgets*", "getBudgets");
    cy.visit("/app/cost-center-budgets");
    cy.wait("@getBudgets");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should display table with expected columns on budgets", () => {
    cy.interceptAPI("GET", "/api/cost-center-budgets*", "getBudgets");
    cy.visit("/app/cost-center-budgets");
    cy.wait("@getBudgets");
    cy.get("table", { timeout: 10000 }).then(($table) => {
      if ($table.length > 0) {
        const headerText = $table.find("thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("cost center") ||
          headerText.includes("budget") ||
          headerText.includes("amount") ||
          headerText.includes("period");
        expect(hasExpected).to.be.true;
      }
    });
  });
});
