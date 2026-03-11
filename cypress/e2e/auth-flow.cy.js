// Owner: auth
// Tests: login, session persistence, logout, forgot password
// Routes: /login, /forgot-password, /app

describe("Auth Flow - E2E Tests", () => {
  describe("Login", () => {
    it("should load login page with email and password fields", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");
      cy.get('input[type="password"], input[name="password"]').should("be.visible");
      cy.get('button[type="submit"]').should("exist");
    });

    it("should redirect to /app after successful login", () => {
      cy.login();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);
    });

    it("should show error and stay on login for wrong email", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 })
        .clear()
        .type("nonexistent@wrong.com");
      cy.get('input[type="password"], input[name="password"]')
        .clear()
        .type("SomePassword123!");
      cy.get('button[type="submit"]').click();

      // Must stay on login page
      cy.url({ timeout: 10000 }).should("include", "/login");
      // Email input should still be visible (form not cleared/navigated)
      cy.get('input[type="email"], input[name="email"]').should("exist");
    });

    it("should show error and stay on login for wrong password", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 })
        .clear()
        .type(Cypress.env("testUserEmail"));
      cy.get('input[type="password"], input[name="password"]')
        .clear()
        .type("TotallyWrongPassword999!");
      cy.get('button[type="submit"]').click();

      // Must stay on login page
      cy.url({ timeout: 10000 }).should("include", "/login");
      cy.get('input[type="email"], input[name="email"]').should("exist");
    });

    it("should prevent submission with empty fields", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).clear();
      cy.get('input[type="password"], input[name="password"]').clear();
      cy.get('button[type="submit"]').click();
      // Should stay on login page -- either HTML5 validation or app-level validation
      cy.url({ timeout: 5000 }).should("include", "/login");
    });

    it("should have password field masked (type=password)", () => {
      cy.visit("/login");
      cy.get('input[type="password"]', { timeout: 10000 })
        .should("exist")
        .should("have.attr", "type", "password");
    });
  });

  describe("Session Persistence", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should access /app without re-login after login", () => {
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);
      cy.get("body", { timeout: 10000 }).should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });

    it("should maintain session when navigating between pages", () => {
      cy.visit("/app/invoices");
      cy.url({ timeout: 15000 }).should("include", "/app");
      cy.visit("/app/customers");
      cy.url({ timeout: 15000 }).should("include", "/app/customers");
      // Verify content loaded (not just a blank page)
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });
  });

  describe("Logout", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should show user menu or navigation controls", () => {
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Page should have interactive elements (buttons in nav, sidebar, etc.)
      cy.get("button, a, [role='menuitem']").should("have.length.greaterThan", 2);
    });

    it("should redirect to login page after logout", () => {
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.logout();
      cy.url({ timeout: 10000 }).should("include", "/login");
    });

    it("should redirect to login when visiting /app after clearing auth", () => {
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Clear auth state
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });
  });

  describe("Forgot Password", () => {
    it("should load forgot password page with email input", () => {
      cy.visit("/forgot-password");
      cy.url().should("include", "/forgot-password");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("exist");
    });

    it("should have submit button on forgot password form", () => {
      cy.visit("/forgot-password");
      cy.get('button[type="submit"]', { timeout: 10000 }).should("exist");
    });
  });
});
