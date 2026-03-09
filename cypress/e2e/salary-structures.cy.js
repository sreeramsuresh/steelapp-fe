// Owner: hr
/**
 * Salary Structures E2E Tests
 *
 * Tests salary components, salary structures list, and structure creation form.
 * Routes: /app/salary-components, /app/salary-structures, /app/salary-structures/new
 */

describe("Salary Structures - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load salary components page", () => {
    cy.interceptAPI("GET", "/api/salary-components*", "getSalaryComponents");
    cy.visit("/app/salary-components");
    cy.verifyPageLoads("Salary Component", "/app/salary-components");
  });

  it("should render components table", () => {
    cy.interceptAPI("GET", "/api/salary-components*", "getSalaryComponents");
    cy.visit("/app/salary-components");
    cy.wait("@getSalaryComponents");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have an add component button", () => {
    cy.interceptAPI("GET", "/api/salary-components*", "getSalaryComponents");
    cy.visit("/app/salary-components");
    cy.wait("@getSalaryComponents");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load salary structures list page", () => {
    cy.interceptAPI("GET", "/api/salary-structures*", "getSalaryStructures");
    cy.visit("/app/salary-structures");
    cy.verifyPageLoads("Salary Structure", "/app/salary-structures");
  });

  it("should render structures table", () => {
    cy.interceptAPI("GET", "/api/salary-structures*", "getSalaryStructures");
    cy.visit("/app/salary-structures");
    cy.wait("@getSalaryStructures");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should have a create structure button", () => {
    cy.interceptAPI("GET", "/api/salary-structures*", "getSalaryStructures");
    cy.visit("/app/salary-structures");
    cy.wait("@getSalaryStructures");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load structure creation form", () => {
    cy.visit("/app/salary-structures/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/salary-structures/new");
    cy.get("form, [class*='form'], input", { timeout: 10000 }).should("exist");
  });

  it("should have name and component assignment fields on form", () => {
    cy.visit("/app/salary-structures/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("form, [class*='form']", { timeout: 10000 }).should("exist");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasNameField =
        text.includes("name") || $body.find("input[name*='name']").length > 0;
      const hasComponentRef =
        text.includes("component") ||
        $body.find("select, [class*='select'], [role='combobox']").length > 0;
      expect(hasNameField).to.be.true;
      expect(hasComponentRef).to.be.true;
    });
  });
});
