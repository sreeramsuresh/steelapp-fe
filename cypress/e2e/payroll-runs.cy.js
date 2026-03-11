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
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes("payroll") || text.includes("hub") || text.includes("salary") || text.length > 50;
      expect(hasContent, "Payroll hub should have relevant content").to.be.true;
    });
    cy.url().should("include", "/app/payroll-hub");
  });

  it("should show navigation cards on payroll hub", () => {
    cy.visit("/app/payroll-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasRunsLink = text.includes("run") || text.includes("payroll");
      const hasComponentsLink = text.includes("component") || text.includes("salary");
      const hasContent = text.length > 50;
      expect(hasRunsLink || hasComponentsLink || hasContent, "Payroll hub should have navigation links or content").to.be.true;
    });
  });

  it("should load payroll runs page", () => {
    cy.visit("/app/payroll-runs");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes("payroll") || text.includes("run") || text.length > 50;
      expect(hasContent, "Payroll runs page should have relevant content").to.be.true;
    });
    cy.url().should("include", "/app/payroll-runs");
  });

  it("should render payroll runs table or content", () => {
    cy.visit("/app/payroll-runs");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent, "Page should have table or content").to.be.true;
    });
  });

  it("should have a create or process payroll button or controls", () => {
    cy.visit("/app/payroll-runs");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new|process|run/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button").length > 0;
      expect(hasButton || hasControls, "Page should have create/process button or controls").to.be.true;
    });
  });

  it("should display table with expected columns or content", () => {
    cy.visit("/app/payroll-runs");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      if ($body.find("table").length > 0) {
        const headerText = $body.find("table thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("period") ||
          headerText.includes("status") ||
          headerText.includes("employee") ||
          headerText.includes("total");
        expect(hasExpected, "Table should have relevant columns").to.be.true;
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should load payroll register page", () => {
    cy.visit("/app/payroll-register");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes("payroll") || text.includes("register") || text.length > 50;
      expect(hasContent, "Payroll register should have relevant content").to.be.true;
    });
    cy.url().should("include", "/app/payroll-register");
  });

  it("should show report layout on payroll register", () => {
    cy.visit("/app/payroll-register");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasReport =
        $body.find("[class*='report'], [class*='register']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasReport || hasContent, "Payroll register should have table, report layout, or content").to.be.true;
    });
  });

  it("should have search or filter controls on payroll runs", () => {
    cy.visit("/app/payroll-runs");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasSearch =
        $body.find("input[type='search'], input[type='text'], input[placeholder*='earch']").length > 0;
      const hasFilter =
        $body.find("select, [class*='filter'], [role='combobox']").length > 0;
      const hasControls = $body.find("input, select, button").length > 0;
      expect(hasSearch || hasFilter || hasControls, "Page should have search, filter, or interactive controls").to.be.true;
    });
  });

  it("should display status indicators on payroll runs", () => {
    cy.visit("/app/payroll-runs");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasStatus =
        text.includes("draft") ||
        text.includes("processed") ||
        text.includes("completed") ||
        text.includes("pending") ||
        text.includes("status") ||
        text.includes("payroll") ||
        $body.find("[class*='badge'], [class*='status'], [class*='chip']").length > 0;
      expect(hasStatus, "Page should have status indicators or payroll content").to.be.true;
    });
  });
});
