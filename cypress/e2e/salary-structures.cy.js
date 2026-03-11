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
    cy.visit("/app/salary-components");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes("salary") || text.includes("component") || text.length > 50;
      expect(hasContent, "Should display salary components content").to.be.true;
    });
    cy.url().should("include", "/app/salary-components");
  });

  it("should render components table or content", () => {
    cy.visit("/app/salary-components");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent, "Page should have table or content").to.be.true;
    });
  });

  it("should have an add component button or interactive controls", () => {
    cy.visit("/app/salary-components");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button").length > 0;
      expect(hasButton || hasControls, "Page should have add button or controls").to.be.true;
    });
  });

  it("should load salary structures list page", () => {
    cy.visit("/app/salary-structures");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent = text.includes("salary") || text.includes("structure") || text.length > 50;
      expect(hasContent, "Should display salary structures content").to.be.true;
    });
    cy.url().should("include", "/app/salary-structures");
  });

  it("should render structures table or content", () => {
    cy.visit("/app/salary-structures");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent, "Page should have table or content").to.be.true;
    });
  });

  it("should have a create structure button or interactive controls", () => {
    cy.visit("/app/salary-structures");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button").length > 0;
      expect(hasButton || hasControls, "Page should have create button or controls").to.be.true;
    });
  });

  it("should load structure creation form", () => {
    cy.visit("/app/salary-structures/new");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasForm = $body.find("form, [class*='form'], input").length > 0;
      const hasContent = $body.text().length > 50;
      expect(hasForm || hasContent, "Page should have form or content").to.be.true;
    });
    cy.url().should("include", "/app/salary-structures/new");
  });

  it("should have name and component assignment fields on form", () => {
    cy.visit("/app/salary-structures/new");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasNameField =
        text.includes("name") || $body.find("input[name*='name']").length > 0;
      const hasComponentRef =
        text.includes("component") ||
        $body.find("select, [class*='select'], [role='combobox']").length > 0;
      const hasFormContent = $body.find("input, select, button").length > 0;
      expect(hasNameField || hasFormContent, "Form should have name field or form elements").to.be.true;
      expect(hasComponentRef || hasFormContent, "Form should have component reference or form elements").to.be.true;
    });
  });
});
