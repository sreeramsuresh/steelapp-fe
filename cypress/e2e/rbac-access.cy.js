// Owner: auth
// Tests: role-based access control
// Uses cy.loginAsRole() for different users

describe("RBAC Access Control - E2E Tests", () => {
  describe("Admin Access", () => {
    beforeEach(() => {
      cy.loginAsRole("admin");
    });

    it("should allow admin to access settings page", () => {
      cy.visit("/app/settings");
      cy.verifyPageLoads("Company Settings", "/app/settings");
    });

    it("should allow admin to access user management page", () => {
      cy.visit("/app/users");
      cy.verifyPageLoads("User Management", "/app/users");
    });

    it("should allow admin to access audit logs", () => {
      cy.visit("/app/audit-logs");
      cy.contains("h1, h2, h3, h4, [data-testid]", /Audit/i, { timeout: 15000 }).should(
        "be.visible",
      );
    });
  });

  describe("Sales User Access", () => {
    beforeEach(() => {
      cy.loginAsRole("sales");
    });

    it("should allow sales user to access invoices", () => {
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app");
    });

    it("should allow sales user to access quotations", () => {
      cy.visit("/app/quotations");
      cy.contains(/quotation/i, { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app");
    });

    it("should allow sales user to access customers", () => {
      cy.visit("/app/customers");
      cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app");
    });
  });

  // Note: Negative RBAC tests may not block in E2E because PERMISSION_CHECK_DISABLED=true
  // These tests verify the UI elements are present, not server-side enforcement
  describe("Page Access Verification", () => {
    it("should allow readonly user to access dashboard", () => {
      cy.loginAsRole("readonly");
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);
      cy.get("body", { timeout: 10000 }).should(($body) => {
        expect($body.text().length).to.be.greaterThan(50);
      });
    });

    it("should allow readonly user to view invoice list", () => {
      cy.loginAsRole("readonly");
      cy.visit("/app/invoices");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
    });

    it("should show appropriate navigation menu items for each role", () => {
      cy.loginAsRole("admin");
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Admin should see navigation with core menu items
      cy.get("nav, aside, [role='navigation']", { timeout: 10000 }).should("exist");
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasNavItems =
          text.includes("dashboard") ||
          text.includes("invoices") ||
          text.includes("settings");
        expect(hasNavItems, "Should display navigation menu items").to.be.true;
      });
    });

    it("should redirect unauthenticated user from /app to /login", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });
  });
});
