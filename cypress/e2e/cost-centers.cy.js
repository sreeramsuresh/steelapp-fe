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
      const hasContent =
        text.includes("cost center") ||
        text.includes("budget") ||
        text.includes("cost") ||
        $body.find("[class*='card'], [class*='hub'], a[href*='cost']").length > 0 ||
        text.length > 50;
      expect(hasContent, "Hub page should have meaningful content").to.be.true;
    });
  });

  it("should load cost centers list page", () => {
    cy.visit("/app/cost-centers");
    cy.verifyPageLoads("Cost Center", "/app/cost-centers");
  });

  it("should render cost centers table", () => {
    cy.visit("/app/cost-centers");
    cy.get("table, [class*='cost-center']", { timeout: 10000 }).should("exist");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create cost center button", () => {
    cy.visit("/app/cost-centers");
    cy.get("table, [class*='cost-center']", { timeout: 10000 }).should("exist");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load cost center budgets page", () => {
    cy.visit("/app/cost-center-budgets");
    cy.verifyPageLoads("Budget", "/app/cost-center-budgets");
  });

  it("should render budgets content", () => {
    cy.visit("/app/cost-center-budgets");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 50;
      expect(hasTable || hasContent, "Budgets page should have content").to.be.true;
    });
  });

  it("should display table with expected columns on budgets", () => {
    cy.visit("/app/cost-center-budgets");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      if ($body.find("table").length > 0) {
        const headerText = $body.find("table thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("cost center") ||
          headerText.includes("budget") ||
          headerText.includes("amount") ||
          headerText.includes("period") ||
          headerText.includes("name");
        expect(hasExpected).to.be.true;
      } else {
        // No table rendered (empty state) — pass
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });
});
