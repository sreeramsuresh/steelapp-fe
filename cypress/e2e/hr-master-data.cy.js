// Owner: hr
/**
 * HR Master Data E2E Tests
 *
 * Tests departments and designations management pages.
 * Routes: /app/departments, /app/designations
 */

describe("HR Master Data - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load departments page with heading", () => {
    cy.interceptAPI("GET", "/api/departments*", "getDepartments");
    cy.visit("/app/departments");
    cy.verifyPageLoads("Department", "/app/departments");
  });

  it("should render departments table or list", () => {
    cy.interceptAPI("GET", "/api/departments*", "getDepartments");
    cy.visit("/app/departments");
    cy.wait("@getDepartments");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card'], [class*='list']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasCards || hasContent).to.be.true;
    });
  });

  it("should have an add department button", () => {
    cy.interceptAPI("GET", "/api/departments*", "getDepartments");
    cy.visit("/app/departments");
    cy.wait("@getDepartments");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });

  it("should load designations page with heading", () => {
    cy.interceptAPI("GET", "/api/designations*", "getDesignations");
    cy.visit("/app/designations");
    cy.verifyPageLoads("Designation", "/app/designations");
  });

  it("should render designations table or list", () => {
    cy.interceptAPI("GET", "/api/designations*", "getDesignations");
    cy.visit("/app/designations");
    cy.wait("@getDesignations");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card'], [class*='list']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasCards || hasContent).to.be.true;
    });
  });

  it("should have an add designation button", () => {
    cy.interceptAPI("GET", "/api/designations*", "getDesignations");
    cy.visit("/app/designations");
    cy.wait("@getDesignations");
    cy.get("body").then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      expect(hasButton).to.be.true;
    });
  });
});
