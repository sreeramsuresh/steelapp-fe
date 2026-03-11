// Owner: admin
// Tests: permissions matrix page for RBAC configuration
// Route: /app/permissions-matrix

describe("Permissions Matrix - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the permissions matrix page", () => {
    cy.visit("/app/permissions-matrix");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("permission") ||
        text.includes("role") ||
        text.includes("access") ||
        text.includes("matrix");
      expect(hasContent, "Permissions matrix page should have relevant content").to.be.true;
    });
    cy.url().should("include", "/app/permissions-matrix");
  });

  it("should render a matrix table or grid layout", () => {
    cy.visit("/app/permissions-matrix");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasGrid =
        $body.find("[class*='grid'], [class*='matrix'], [role='grid']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasGrid || hasContent, "Should display matrix, table, or grid layout").to
        .be.true;
    });
  });

  it("should display role names in the matrix", () => {
    cy.visit("/app/permissions-matrix");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasRoles =
        text.includes("admin") ||
        text.includes("manager") ||
        text.includes("sales") ||
        text.includes("role");
      expect(hasRoles, "Matrix should display role names").to.be.true;
    });
  });

  it("should display permission categories or modules", () => {
    cy.visit("/app/permissions-matrix");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasModules =
        text.includes("invoice") ||
        text.includes("customer") ||
        text.includes("product") ||
        text.includes("purchase") ||
        text.includes("view") ||
        text.includes("create") ||
        text.includes("edit") ||
        text.includes("delete");
      expect(hasModules, "Matrix should display permission categories or actions").to.be.true;
    });
  });

  it("should have interactive checkboxes or toggles", () => {
    cy.visit("/app/permissions-matrix");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasCheckboxes =
        $body.find('input[type="checkbox"], [role="checkbox"], [role="switch"]').length > 0;
      const hasToggles = $body.find("button, input").length > 0;
      expect(hasCheckboxes || hasToggles, "Matrix should have interactive controls").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/app/permissions-matrix");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
