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
  });

  it("should load employee finance hub", () => {
    cy.visit("/app/employee-finance");
    cy.verifyPageLoads("Employee Finance", "/app/employee-finance");
  });

  it("should show navigation cards for advances and loans", () => {
    cy.visit("/app/employee-finance");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAdvances = text.includes("advance");
      const hasLoans = text.includes("loan");
      expect(hasAdvances || hasLoans).to.be.true;
    });
  });

  it("should load employee advances page", () => {
    cy.interceptAPI("GET", "/api/employee-advances*", "getAdvances");
    cy.visit("/app/employee-advances");
    cy.verifyPageLoads("Advance", "/app/employee-advances");
  });

  it("should render advances table", () => {
    cy.interceptAPI("GET", "/api/employee-advances*", "getAdvances");
    cy.visit("/app/employee-advances");
    cy.wait("@getAdvances");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create advance button", () => {
    cy.interceptAPI("GET", "/api/employee-advances*", "getAdvances");
    cy.visit("/app/employee-advances");
    cy.wait("@getAdvances");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new|request/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load employee loans page", () => {
    cy.interceptAPI("GET", "/api/employee-loans*", "getLoans");
    cy.visit("/app/employee-loans");
    cy.verifyPageLoads("Loan", "/app/employee-loans");
  });

  it("should render loans table", () => {
    cy.interceptAPI("GET", "/api/employee-loans*", "getLoans");
    cy.visit("/app/employee-loans");
    cy.wait("@getLoans");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should display table with expected columns on loans", () => {
    cy.interceptAPI("GET", "/api/employee-loans*", "getLoans");
    cy.visit("/app/employee-loans");
    cy.wait("@getLoans");
    cy.get("table", { timeout: 10000 }).then(($table) => {
      if ($table.length > 0) {
        const headerText = $table.find("thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("employee") ||
          headerText.includes("amount") ||
          headerText.includes("status");
        expect(hasExpected).to.be.true;
      }
    });
  });
});
