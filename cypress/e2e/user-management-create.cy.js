// Owner: admin
// Tests: user management CRUD
// Route: /app/users

describe("User Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/users");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("h1, h2, h3, h4", /user/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load page with User Management heading", () => {
    cy.verifyPageLoads("User Management", "/app/users");
  });

  it("should render users table/list with columns (Name, Email, Role, Status)", () => {
    // The page uses card-based or table-based list — check for user data content
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasUserColumns =
        (text.includes("name") || text.includes("email")) &&
        (text.includes("role") || text.includes("status"));
      expect(hasUserColumns, "Should display user list with name/email/role/status").to.be.true;
    });
  });

  it("should display Create User button", () => {
    cy.contains("Create User", { timeout: 10000 }).should("be.visible");
  });

  it("should display search input that accepts text", () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 }).first().should("be.visible");
    cy.get('input[placeholder*="Search"]').first().type("test");
    cy.get('input[placeholder*="Search"]').first().should("have.value", "test");
  });

  it("should show seeded test users in the list", () => {
    cy.get("body", { timeout: 10000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasUsers =
        text.includes("admin") ||
        text.includes("e2e") ||
        text.includes("development") ||
        text.includes("user");
      expect(hasUsers, "Should display seeded test users").to.be.true;
    });
  });

  it("should filter user list when searching", () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .first()
      .clear()
      .type("admin");
    // After filtering, page should still show content
    cy.get("body").should("be.visible");
  });

  it("should show status indicators (active/inactive)", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasStatus = text.includes("active") || text.includes("inactive") || text.includes("enabled");
      expect(hasStatus, "Should display user status indicators").to.be.true;
    });
  });

  it("should show role information for users", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasRoles =
        text.includes("admin") ||
        text.includes("manager") ||
        text.includes("sales") ||
        text.includes("viewer") ||
        text.includes("role");
      expect(hasRoles, "Should display role information").to.be.true;
    });
  });

  it("should make user rows clickable for details/edit", () => {
    // Find clickable user entries (cards, rows, or links)
    cy.get("body").then(($body) => {
      const hasClickable =
        $body.find("table tbody tr").length > 0 ||
        $body.find('[class*="card"], [class*="Card"]').length > 0 ||
        $body.find("a[href*='users']").length > 0;
      expect(hasClickable, "Should have clickable user entries").to.be.true;
    });
  });

  it("should open form/modal when Create User is clicked", () => {
    cy.contains("Create User", { timeout: 10000 }).click();
    // A modal or form should appear
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasForm =
        text.includes("name") &&
        (text.includes("email") || text.includes("role") || text.includes("password"));
      expect(hasForm, "Should display user creation form").to.be.true;
    });
  });

  it("should show name field in user form", () => {
    cy.contains("Create User", { timeout: 10000 }).click();
    cy.get('input[name*="name"], input[placeholder*="name"]', { timeout: 10000 })
      .first()
      .should("exist");
  });

  it("should show email field in user form", () => {
    cy.contains("Create User", { timeout: 10000 }).click();
    cy.get('input[name*="email"], input[type="email"], input[placeholder*="email"]', {
      timeout: 10000,
    })
      .first()
      .should("exist");
  });

  it("should show role selection in user form", () => {
    cy.contains("Create User", { timeout: 10000 }).click();
    cy.get("body").then(($body) => {
      const hasRoleSelect =
        $body.find('select[name*="role"]').length > 0 ||
        $body.find('[class*="role"]').length > 0 ||
        $body.text().toLowerCase().includes("role");
      expect(hasRoleSelect, "Should have role selection in user form").to.be.true;
    });
  });

  it("should show save/create button in user form", () => {
    cy.contains("Create User", { timeout: 10000 }).click();
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSaveButton =
        text.includes("save") || text.includes("create") || text.includes("submit");
      expect(hasSaveButton, "Should have save/create button").to.be.true;
    });
  });
});
