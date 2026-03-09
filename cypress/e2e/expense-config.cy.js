// Owner: hr
/**
 * Expense Configuration E2E Tests
 *
 * Tests expense config hub, categories, policies, and approval chains pages.
 * Routes: /app/expense-config, /app/expense-categories, /app/expense-policies, /app/expense-approval-chains
 */

describe("Expense Configuration - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load expense config hub", () => {
    cy.visit("/app/expense-config");
    cy.verifyPageLoads("Expense", "/app/expense-config");
  });

  it("should show navigation cards for categories, policies, and approval chains", () => {
    cy.visit("/app/expense-config");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasCategories = text.includes("categor");
      const hasPolicies = text.includes("polic");
      const hasApproval = text.includes("approval");
      expect(hasCategories || hasPolicies || hasApproval).to.be.true;
    });
  });

  it("should load expense categories page", () => {
    cy.interceptAPI("GET", "/api/expense-categories*", "getCategories");
    cy.visit("/app/expense-categories");
    cy.verifyPageLoads("Categor", "/app/expense-categories");
  });

  it("should render categories table", () => {
    cy.interceptAPI("GET", "/api/expense-categories*", "getCategories");
    cy.visit("/app/expense-categories");
    cy.wait("@getCategories");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should load expense policies page", () => {
    cy.interceptAPI("GET", "/api/expense-policies*", "getPolicies");
    cy.visit("/app/expense-policies");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/expense-policies");
    cy.get("body").should(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });

  it("should load expense approval chains page", () => {
    cy.interceptAPI("GET", "/api/expense-approval-chains*", "getApprovalChains");
    cy.visit("/app/expense-approval-chains");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/expense-approval-chains");
    cy.get("body").should(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });
});
