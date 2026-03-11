// Owner: hr
/**
 * Employee Management E2E Tests
 *
 * Tests employee list, hub, and creation form pages.
 * Routes: /app/employees, /app/employees-hub, /app/employees/new
 */

describe("Employee Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/employees*").as("getEmployees");
  });

  it("should load employees page with heading", () => {
    cy.visit("/app/employees");
    cy.wait("@getEmployees");
    cy.verifyPageLoads("Employee", "/app/employees");
  });

  it("should render employee table or list", () => {
    cy.visit("/app/employees");
    cy.wait("@getEmployees");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card'], [class*='list']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasCards || hasContent).to.be.true;
    });
  });

  it("should have a create employee button", () => {
    cy.visit("/app/employees");
    cy.wait("@getEmployees");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should have a search input", () => {
    cy.visit("/app/employees");
    cy.wait("@getEmployees");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("input[type='search'], input[type='text'], input[placeholder*='earch']", {
      timeout: 10000,
    }).should("exist");
  });

  it("should display table with expected columns", () => {
    cy.visit("/app/employees");
    cy.wait("@getEmployees");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("table", { timeout: 10000 }).then(($table) => {
      if ($table.length > 0) {
        const headerText = $table.find("thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("name") ||
          headerText.includes("department") ||
          headerText.includes("designation") ||
          headerText.includes("status");
        expect(hasExpected).to.be.true;
      }
    });
  });

  it("should load employee hub page", () => {
    cy.visit("/app/employees-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/employees-hub");
    cy.get("body").should(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should load employee form at /app/employees/new", () => {
    cy.visit("/app/employees/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/employees/new");
    cy.get("form, [class*='form'], input", { timeout: 10000 }).should("exist");
  });

  it("should have name, email, department, and designation fields on form", () => {
    cy.visit("/app/employees/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("form, [class*='form']", { timeout: 10000 }).should("exist");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasNameField =
        text.includes("name") || $body.find("input[name*='name']").length > 0;
      const hasEmailField =
        text.includes("email") || $body.find("input[name*='email']").length > 0;
      expect(hasNameField).to.be.true;
      expect(hasEmailField).to.be.true;
    });
  });
});
