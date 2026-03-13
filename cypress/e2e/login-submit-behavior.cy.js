// Owner: auth
// Tests: form submission mechanics, loading state, duplicate prevention, error sanitization
// Routes: /login

describe("Login Submit Behavior - E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");
  });

  describe("Form Submission Methods", () => {
    it("should submit the form when pressing Enter in password field", () => {
      cy.intercept("POST", "/api/auth/login").as("loginRequest");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345{enter}");

      cy.wait("@loginRequest").its("request.body").should("deep.include", {
        email: "admin@steelapp.test",
        password: "Test@12345",
      });
    });

    it("should submit the form when clicking the submit button", () => {
      cy.intercept("POST", "/api/auth/login").as("loginRequest");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345");
      cy.get('button[type="submit"]').click();

      cy.wait("@loginRequest").its("request.body").should("deep.include", {
        email: "admin@steelapp.test",
        password: "Test@12345",
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading state during form submission", () => {
      // Delay the response so we can observe loading state
      cy.intercept("POST", "/api/auth/login", (req) => {
        req.reply({
          delay: 1500,
          statusCode: 200,
          body: {
            token: "mock-token",
            refreshToken: "mock-refresh",
            user: { id: 1, name: "Test", email: "admin@steelapp.test", role: "admin", companyId: 1 },
          },
        });
      }).as("slowLogin");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345");
      cy.get('button[type="submit"]').click();

      // During loading, button should show loading text and be disabled
      cy.contains("Please wait...", { timeout: 3000 }).should("be.visible");
      cy.get('button[type="submit"]').should("be.disabled");

      cy.wait("@slowLogin");
    });

    it("should disable the submit button while loading", () => {
      cy.intercept("POST", "/api/auth/login", (req) => {
        req.reply({
          delay: 2000,
          statusCode: 200,
          body: {
            token: "mock-token",
            refreshToken: "mock-refresh",
            user: { id: 1, name: "Test", email: "admin@steelapp.test", role: "admin", companyId: 1 },
          },
        });
      }).as("slowLogin");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345");
      cy.get('button[type="submit"]').click();

      // Button should be disabled during loading
      cy.get('button[type="submit"]').should("be.disabled");

      cy.wait("@slowLogin");
    });
  });

  describe("Duplicate Request Prevention", () => {
    it("should not send duplicate requests on rapid double-click", () => {
      let requestCount = 0;
      cy.intercept("POST", "/api/auth/login", (req) => {
        requestCount++;
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: {
            token: "mock-token",
            refreshToken: "mock-refresh",
            user: { id: 1, name: "Test", email: "admin@steelapp.test", role: "admin", companyId: 1 },
          },
        });
      }).as("loginRequest");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345");

      // Rapid double-click on submit
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').click({ force: true });

      // Wait a bit for potential duplicate requests
      cy.wait("@loginRequest");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      // Only one request should have been sent (button disabled after first click)
      cy.then(() => {
        expect(requestCount).to.eq(1);
      });
    });
  });

  describe("Error Message Sanitization", () => {
    it("should show a generic error for invalid credentials without username enumeration", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 401,
        body: { error: "Invalid credentials" },
      }).as("failedLogin");

      cy.get('input[name="email"]').clear().type("nonexistent@company.com");
      cy.get('input[name="password"]').clear().type("WrongPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@failedLogin");

      // Should show a generic error message
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        // Should NOT say "user not found" or "email not registered"
        expect(text).not.to.include("user not found");
        expect(text).not.to.include("email not registered");
        expect(text).not.to.include("no account");
      });

      // Should stay on the login page
      cy.url().should("include", "/login");
    });

    it("should show generic error for wrong password without leaking that email exists", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 401,
        body: { error: "Invalid credentials" },
      }).as("failedLogin");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("WrongPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@failedLogin");

      // Error message should be generic, not "wrong password"
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).not.to.include("wrong password");
        expect(text).not.to.include("incorrect password");
        expect(text).not.to.include("password is wrong");
      });
    });

    it("should not show stack traces in error messages", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 500,
        body: {
          error: "Internal server error",
          stack: "Error: ECONNREFUSED\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)",
        },
      }).as("serverError");

      cy.get('input[name="email"]').clear().type("admin@steelapp.test");
      cy.get('input[name="password"]').clear().type("Test@12345");
      cy.get('button[type="submit"]').click();
      cy.wait("@serverError");

      // No stack trace patterns in the rendered page
      cy.get("body").should(($body) => {
        const text = $body.text();
        expect(text).not.to.include("TCPConnectWrap");
        expect(text).not.to.include("net.js");
        expect(text).not.to.match(/at\s+\w+\s*\(/);
        expect(text).not.to.include("ECONNREFUSED");
      });
    });

    it("should not expose raw JSON error objects to the user", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 400,
        body: {
          error: "Validation failed",
          details: [
            { field: "email", message: "Invalid format" },
            { field: "password", message: "Too short" },
          ],
        },
      }).as("validationError");

      cy.get('input[name="email"]').clear().type("bad@example.com");
      cy.get('input[name="password"]').clear().type("shortpw");
      cy.get('button[type="submit"]').click();
      cy.wait("@validationError");

      // Should not render raw JSON like [object Object]
      cy.get("body").should(($body) => {
        const text = $body.text();
        expect(text).not.to.include("[object Object]");
      });
    });
  });

  describe("Form Stays on Page After Error", () => {
    it("should keep form values after a failed submission", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 401,
        body: { error: "Invalid credentials" },
      }).as("failedLogin");

      cy.get('input[name="email"]').clear().type("test@example.com");
      cy.get('input[name="password"]').clear().type("wrongpass");
      cy.get('button[type="submit"]').click();
      cy.wait("@failedLogin");

      // Form fields should retain their values
      cy.get('input[name="email"]').should("have.value", "test@example.com");
      // Password field may or may not be cleared depending on UX choice
      cy.url().should("include", "/login");
    });

    it("should re-enable the submit button after a failed submission", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 401,
        body: { error: "Invalid credentials" },
      }).as("failedLogin");

      cy.get('input[name="email"]').clear().type("test@example.com");
      cy.get('input[name="password"]').clear().type("wrongpass");
      cy.get('button[type="submit"]').click();
      cy.wait("@failedLogin");

      // Button should be re-enabled after error response
      cy.get('button[type="submit"]', { timeout: 5000 }).should("not.be.disabled");
    });
  });
});
