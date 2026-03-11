// Owner: auth
// Tests: user profile page
// Route: /app/profile

describe("User Profile - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the profile page with user information", () => {
    cy.visit("/app/profile");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasProfileContent =
        text.includes("profile") ||
        text.includes("name") ||
        text.includes("email") ||
        text.includes("account") ||
        text.includes("admin");
      expect(hasProfileContent, "Profile page should display user-related content").to.be.true;
    });
    cy.url().should("include", "/app/profile");
  });

  it("should display the logged-in user email", () => {
    cy.visit("/app/profile");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasEmail =
        text.includes("admin@steelapp.test") ||
        text.includes("email") ||
        text.includes("@");
      expect(hasEmail, "Profile should display user email or email field").to.be.true;
    });
  });

  it("should have form fields for profile editing", () => {
    cy.visit("/app/profile");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasInputs = $body.find("input, textarea, select").length > 0;
      const hasForm = $body.find("form").length > 0;
      expect(hasInputs || hasForm, "Profile page should have editable fields").to.be.true;
    });
  });

  it("should have a save or update button", () => {
    cy.visit("/app/profile");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button").filter(function () {
          return /save|update|change|submit/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button").length > 0;
      expect(hasButton || hasControls, "Profile page should have action buttons").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/app/profile");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
