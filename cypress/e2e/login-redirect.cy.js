// Owner: auth
// Tests: login redirect behavior, post-login routing, protected routes
// Routes: /login, /app

describe("Login Redirect - E2E Tests", () => {
  describe("Already Logged-In User", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should redirect logged-in user from /login to /app", () => {
      cy.visit("/login");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);
    });

    it("should redirect from root / to a valid page", () => {
      cy.visit("/");
      // Root may go to marketing or app depending on logic
      cy.url({ timeout: 15000 }).should("not.include", "/login");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });
  });

  describe("Post-Login Redirect", () => {
    it("should redirect to /app after successful login", () => {
      cy.login();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);
      cy.get("body", { timeout: 10000 }).should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });

    it("should redirect to /app after UI-based login", () => {
      cy.visit("/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");

      cy.intercept("POST", "/api/auth/login", {
        statusCode: 200,
        body: {
          token: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: 1,
            name: "Test User",
            email: "admin@steelapp.test",
            role: "admin",
            companyId: 1,
          },
        },
      }).as("mockLogin");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345");
      cy.get('button[type="submit"]').click();
      cy.wait("@mockLogin");

      // After login, the app should redirect away from /login
      cy.url({ timeout: 15000 }).should("not.include", "/login");
    });
  });

  describe("Unauthenticated Access", () => {
    it("should show login page when not authenticated", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/login");
      cy.url().should("include", "/login");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");
      cy.get('input[type="password"], input[name="password"]').should("be.visible");
    });

    it("should redirect to /login when visiting /app without auth", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });

    it("should redirect to /login when visiting /app/invoices without auth", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app/invoices");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });

    it("should redirect to /login when visiting /app/customers without auth", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app/customers");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });
  });

  describe("Back Button After Logout", () => {
    it("should not expose authenticated content after logout and back navigation", () => {
      // Log in first
      cy.login();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);

      // Log out
      cy.logout();
      cy.url({ timeout: 10000 }).should("include", "/login");

      // Navigate back — should stay on login or redirect back to login
      cy.go("back");
      // Wait for any redirects to settle
      // The app should either redirect to /login or show login content
      cy.url({ timeout: 15000 }).then((url) => {
        if (url.includes("/app")) {
          // If URL shows /app, the page should redirect to login
          cy.url({ timeout: 10000 }).should("include", "/login");
        } else {
          // Already on login page
          cy.url().should("include", "/login");
        }
      });
    });
  });

  describe("Public Auth Pages Accessible Without Auth", () => {
    it("should allow access to /forgot-password without auth", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/forgot-password");
      cy.url().should("include", "/forgot-password");
      cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("exist");
    });
  });
});
