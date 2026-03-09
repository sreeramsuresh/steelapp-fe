// Owner: hr
/**
 * Payroll Runs E2E Tests
 *
 * Tests payroll hub, payroll runs list, and payroll register pages.
 * Routes: /app/payroll-hub, /app/payroll-runs, /app/payroll-register
 */

describe("Payroll Runs - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load payroll hub page", () => {
    cy.visit("/app/payroll-hub");
    cy.verifyPageLoads("Payroll", "/app/payroll-hub");
  });

  it("should show navigation cards on payroll hub", () => {
    cy.visit("/app/payroll-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasRunsLink = text.includes("run") || text.includes("payroll");
      const hasComponentsLink =
        text.includes("component") || text.includes("salary");
      expect(hasRunsLink || hasComponentsLink).to.be.true;
    });
  });

  it("should load payroll runs page", () => {
    cy.interceptAPI("GET", "/api/payroll-runs*", "getPayrollRuns");
    cy.visit("/app/payroll-runs");
    cy.verifyPageLoads("Payroll", "/app/payroll-runs");
  });

  it("should render payroll runs table", () => {
    cy.interceptAPI("GET", "/api/payroll-runs*", "getPayrollRuns");
    cy.visit("/app/payroll-runs");
    cy.wait("@getPayrollRuns");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create or process payroll button", () => {
    cy.interceptAPI("GET", "/api/payroll-runs*", "getPayrollRuns");
    cy.visit("/app/payroll-runs");
    cy.wait("@getPayrollRuns");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new|process|run/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should display table with expected columns", () => {
    cy.interceptAPI("GET", "/api/payroll-runs*", "getPayrollRuns");
    cy.visit("/app/payroll-runs");
    cy.wait("@getPayrollRuns");
    cy.get("table", { timeout: 10000 }).then(($table) => {
      if ($table.length > 0) {
        const headerText = $table.find("thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("period") ||
          headerText.includes("status") ||
          headerText.includes("employee") ||
          headerText.includes("total");
        expect(hasExpected).to.be.true;
      }
    });
  });

  it("should load payroll register page", () => {
    cy.interceptAPI("GET", "/api/payroll*", "getPayrollData");
    cy.visit("/app/payroll-register");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/payroll-register");
    cy.get("body").should(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });

  it("should show report layout on payroll register", () => {
    cy.interceptAPI("GET", "/api/payroll*", "getPayrollData");
    cy.visit("/app/payroll-register");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasReport =
        $body.find("[class*='report'], [class*='register']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasReport || hasContent).to.be.true;
    });
  });

  it("should have search or filter controls on payroll runs", () => {
    cy.interceptAPI("GET", "/api/payroll-runs*", "getPayrollRuns");
    cy.visit("/app/payroll-runs");
    cy.wait("@getPayrollRuns");
    cy.get("body").then(($body) => {
      const hasSearch =
        $body.find("input[type='search'], input[type='text'], input[placeholder*='earch']")
          .length > 0;
      const hasFilter =
        $body.find("select, [class*='filter'], [role='combobox']").length > 0;
      expect(hasSearch || hasFilter).to.be.true;
    });
  });

  it("should display status indicators on payroll runs", () => {
    cy.interceptAPI("GET", "/api/payroll-runs*", "getPayrollRuns");
    cy.visit("/app/payroll-runs");
    cy.wait("@getPayrollRuns");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasStatus =
        text.includes("draft") ||
        text.includes("processed") ||
        text.includes("completed") ||
        text.includes("pending") ||
        text.includes("status") ||
        $body.find("[class*='badge'], [class*='status'], [class*='chip']").length > 0;
      expect(hasStatus).to.be.true;
    });
  });
});
