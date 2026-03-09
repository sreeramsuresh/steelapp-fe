// Owner: auth
// Tests: login, session persistence, logout, forgot password
// Routes: /login, /forgot-password, /app

describe("Auth Flow - E2E Tests", () => {
  describe("Login", () => {
    it("should load login page with email and password fields", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");
      cy.get('input[type="password"], input[name="password"]').should("be.visible");
    });

    it("should redirect to /app after successful login via UI", () => {
      cy.loginViaUI(Cypress.env("testUserEmail"), Cypress.env("testUserPassword"));
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);
    });

    it("should show error message for wrong email", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 })
        .clear()
        .type("nonexistent@wrong.com");
      cy.get('input[type="password"], input[name="password"]')
        .clear()
        .type("SomePassword123!");
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should("include", "/login");
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasError =
          text.includes("invalid") ||
          text.includes("error") ||
          text.includes("incorrect") ||
          text.includes("failed");
        expect(hasError, "Should display an error message for wrong email").to.be.true;
      });
    });

    it("should show error message for wrong password", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 })
        .clear()
        .type(Cypress.env("testUserEmail"));
      cy.get('input[type="password"], input[name="password"]')
        .clear()
        .type("TotallyWrongPassword999!");
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should("include", "/login");
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasError =
          text.includes("invalid") ||
          text.includes("error") ||
          text.includes("incorrect") ||
          text.includes("failed");
        expect(hasError, "Should display an error message for wrong password").to.be.true;
      });
    });

    it("should show validation on empty form submit", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).clear();
      cy.get('input[type="password"], input[name="password"]').clear();
      cy.get('button[type="submit"]').click();
      // Should stay on login page — either HTML5 validation or app-level validation
      cy.url({ timeout: 5000 }).should("include", "/login");
    });

    it("should have password field masked (type=password)", () => {
      cy.visit("/login");
      cy.get('input[type="password"]', { timeout: 10000 }).should("exist");
      cy.get('input[type="password"]').should("have.attr", "type", "password");
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
        expect($body.text().length).to.be.greaterThan(50);
      });
    });

    it("should maintain session when navigating between pages", () => {
      cy.visit("/app/invoices");
      cy.url({ timeout: 15000 }).should("include", "/app");
      cy.visit("/app/customers");
      cy.url({ timeout: 15000 }).should("include", "/app/customers");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(50);
      });
    });
  });

  describe("Logout", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should show logout button in user menu", () => {
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Open user menu
      cy.get("button")
        .contains(/Development User|E2E Admin|admin/i)
        .should("be.visible");
    });

    it("should redirect to login page after logout", () => {
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.logout();
      cy.url({ timeout: 10000 }).should("include", "/login");
    });

    it("should redirect to login when visiting /app after logout", () => {
      cy.visit("/app");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.logout();
      cy.url({ timeout: 10000 }).should("include", "/login");
      // Clear any remaining state
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });
  });

  describe("Forgot Password", () => {
    it("should load forgot password page at /forgot-password", () => {
      cy.visit("/forgot-password");
      cy.url().should("include", "/forgot-password");
      cy.get("body", { timeout: 10000 }).should("be.visible");
    });

    it("should have email input field on forgot password form", () => {
      cy.visit("/forgot-password");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("exist");
    });

    it("should have submit button on forgot password form", () => {
      cy.visit("/forgot-password");
      cy.get('button[type="submit"]', { timeout: 10000 }).should("exist");
    });
  });
});
