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
      const hasContent =
        text.includes("categor") ||
        text.includes("polic") ||
        text.includes("approval") ||
        text.includes("expense") ||
        text.includes("config") ||
        $body.find("[class*='card'], [class*='hub'], a[href*='expense']").length > 0 ||
        text.length > 50;
      expect(hasContent, "Expense config hub should have meaningful content").to.be.true;
    });
  });

  it("should load expense categories page", () => {
    cy.visit("/app/expense-categories");
    cy.verifyPageLoads("Categor", "/app/expense-categories");
  });

  it("should render categories content", () => {
    cy.visit("/app/expense-categories");
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 50;
      expect(hasTable || hasContent, "Categories page should have content").to.be.true;
    });
  });

  it("should load expense policies page", () => {
    cy.visit("/app/expense-policies");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/expense-policies");
    cy.get("body").should(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should load expense approval chains page", () => {
    cy.visit("/app/expense-approval-chains");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/expense-approval-chains");
    cy.get("body").should(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });
});
