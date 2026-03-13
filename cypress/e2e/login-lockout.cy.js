// Owner: auth
// Tests: account lockout, countdown timer, OTP bypass
// Routes: /login

describe("Login Lockout - E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[type="email"], input[name="email"]', { timeout: 10000 }).should("be.visible");
  });

  describe("Account Lockout After Failed Attempts", () => {
    it("should show lockout message after 5 wrong password attempts", () => {
      // Intercept login to return 423 (locked) on the 5th attempt
      let attemptCount = 0;
      cy.intercept("POST", "/api/auth/login", (req) => {
        attemptCount++;
        if (attemptCount < 5) {
          req.reply({
            statusCode: 401,
            body: { error: "Invalid credentials" },
          });
        } else {
          req.reply({
            statusCode: 423,
            body: {
              error: "Account locked due to too many failed attempts",
              code: "ACCOUNT_LOCKED",
              lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              remainingMinutes: 15,
            },
          });
        }
      }).as("loginAttempt");

      // Make 5 attempts with wrong password
      for (let i = 0; i < 5; i++) {
        cy.get('input[name="email"]').clear().type("admin@steelapp.test");
        cy.get('input[name="password"]').clear().type("WrongPassword!");
        cy.get('button[type="submit"]').click();
        cy.wait("@loginAttempt");
      }

      // Verify lockout message is displayed
      cy.contains(/account locked/i, { timeout: 5000 }).should("be.visible");
      // Verify countdown timer shows remaining minutes
      cy.contains(/\d+\s*minute/i).should("be.visible");
    });

    it("should display lockout with countdown timer from mocked 423 response", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked due to too many failed attempts",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          remainingMinutes: 10,
        },
      }).as("lockedLogin");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      // Lockout message visible
      cy.contains(/account locked/i).should("be.visible");
      // Should show 10 minutes
      cy.contains(/10\s*minute/i).should("be.visible");
    });

    it("should disable the submit button while locked out", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          remainingMinutes: 15,
        },
      }).as("lockedLogin");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      // Submit button should be disabled
      cy.get('button[type="submit"]').should("be.disabled");
    });

    it("should reject correct password while account is locked", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked due to too many failed attempts",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
          remainingMinutes: 14,
        },
      }).as("lockedLogin");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("CorrectPassword123!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      // Should still show lockout, not navigate away
      cy.url().should("include", "/login");
      cy.contains(/account locked/i).should("be.visible");
    });
  });

  describe("No Stack Traces or Raw Errors", () => {
    it("should not expose stack traces on lockout", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked due to too many failed attempts",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          remainingMinutes: 15,
        },
      }).as("lockedLogin");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      // Should not contain stack trace indicators
      cy.get("body").should(($body) => {
        const text = $body.text();
        expect(text).not.to.match(/at\s+\w+\s*\(/); // stack trace pattern: "at FunctionName ("
        expect(text).not.to.match(/Error:\s+.*\n\s+at/); // multi-line stack
        expect(text.toLowerCase()).not.to.include("internal server error");
        expect(text.toLowerCase()).not.to.include("unhandled");
      });
    });

    it("should not expose stack traces on 500 server error", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 500,
        body: {
          error: "Internal server error",
          stack: "Error: something\n    at Object.<anonymous> (/app/server.js:42:13)",
        },
      }).as("serverError");

      cy.get('input[name="email"]').clear().type("test@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@serverError");

      // Should not render raw stack trace from the response
      cy.get("body").should(($body) => {
        const text = $body.text();
        expect(text).not.to.include("Object.<anonymous>");
        expect(text).not.to.include("/app/server.js");
      });
    });
  });

  describe("Lockout OTP Bypass", () => {
    it("should show Unlock via Email OTP button when locked out", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          remainingMinutes: 15,
        },
      }).as("lockedLogin");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      // OTP unlock button should appear
      cy.contains(/unlock via email otp/i, { timeout: 5000 }).should("be.visible");
    });

    it("should show OTP input after clicking unlock button", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          remainingMinutes: 15,
        },
      }).as("lockedLogin");

      cy.intercept("POST", "/api/auth/lockout/send-otp", {
        statusCode: 200,
        body: { lockoutToken: "mock-lockout-token-123", message: "OTP sent" },
      }).as("sendOtp");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      // Click the unlock button
      cy.contains(/unlock via email otp/i).click();
      cy.wait("@sendOtp");

      // OTP input field should appear
      cy.get('input[placeholder*="6-digit"]', { timeout: 5000 }).should("be.visible");
      // Masked email should be shown
      cy.contains(/\*\*\*@/i).should("be.visible");
    });

    it("should show Back to Login button in OTP view", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 423,
        body: {
          error: "Account locked",
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          remainingMinutes: 15,
        },
      }).as("lockedLogin");

      cy.intercept("POST", "/api/auth/lockout/send-otp", {
        statusCode: 200,
        body: { lockoutToken: "mock-lockout-token-123", message: "OTP sent" },
      }).as("sendOtp");

      cy.get('input[name="email"]').clear().type("locked@steelapp.test");
      cy.get('input[name="password"]').clear().type("AnyPassword!");
      cy.get('button[type="submit"]').click();
      cy.wait("@lockedLogin");

      cy.contains(/unlock via email otp/i).click();
      cy.wait("@sendOtp");

      // Back to Login button should be present
      cy.contains(/back to login/i).should("be.visible");
    });
  });
});
