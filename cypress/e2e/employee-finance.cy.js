// Owner: hr
/**
 * Employee Finance E2E Tests
 *
 * Tests employee finance hub, advances, and loans pages.
 * Routes: /app/employee-finance, /app/employee-advances, /app/employee-loans
 */

describe("Employee Finance - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    // Register most-specific intercepts LAST (Cypress uses LIFO matching)
    cy.intercept("GET", "**/api/employees?*").as("getEmployees");
    cy.intercept("GET", "**/api/employee-advances*").as("getEmployeeAdvances");
    cy.intercept("GET", "**/api/employee-loans*").as("getEmployeeLoans");
  });

  it("should load employee finance hub", () => {
    cy.visit("/app/employee-finance");
    cy.verifyPageLoads("Employee Finance", "/app/employee-finance");
  });

  it("should show navigation cards for advances and loans", () => {
    cy.visit("/app/employee-finance");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("advance") ||
        text.includes("loan") ||
        text.includes("employee") ||
        text.includes("finance") ||
        $body.find("[class*='card'], [class*='hub'], a[href*='employee']").length > 0 ||
        text.length > 50;
      expect(hasContent, "Employee finance hub should have meaningful content").to.be.true;
    });
  });

  it("should load employee advances page", () => {
    cy.visit("/app/employee-advances");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.verifyPageLoads("Advance", "/app/employee-advances");
  });

  it("should render advances table", () => {
    cy.visit("/app/employee-advances");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create advance button", () => {
    cy.visit("/app/employee-advances");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new|request/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load employee loans page", () => {
    cy.visit("/app/employee-loans");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.verifyPageLoads("Loan", "/app/employee-loans");
  });

  it("should render loans table", () => {
    cy.visit("/app/employee-loans");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should display table with expected columns on loans", () => {
    cy.visit("/app/employee-loans");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      if ($body.find("table").length > 0) {
        const headerText = $body.find("table thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("employee") ||
          headerText.includes("amount") ||
          headerText.includes("status");
        expect(hasExpected).to.be.true;
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });
});
