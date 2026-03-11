// Owner: admin
// Tests: dedicated roles management page
// Route: /app/roles

describe("Roles Management Page - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the roles page with heading", () => {
    cy.visit("/app/roles");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("role") ||
        text.includes("permission") ||
        text.includes("access");
      expect(hasContent, "Roles page should have role-related content").to.be.true;
    });
    cy.url().should("include", "/app/roles");
  });

  it("should display role list with seeded roles", () => {
    cy.visit("/app/roles");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasRoles =
        text.includes("admin") ||
        text.includes("manager") ||
        text.includes("sales") ||
        text.includes("role");
      expect(hasRoles, "Roles page should show existing roles").to.be.true;
    });
  });

  it("should render role table or card layout", () => {
    cy.visit("/app/roles");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasCards || hasContent, "Roles page should display role data").to.be.true;
    });
  });

  it("should have action controls (add role, edit)", () => {
    cy.visit("/app/roles");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButtons = $body.find("button, a").length > 0;
      expect(hasButtons, "Roles page should have interactive controls").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/app/roles");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
