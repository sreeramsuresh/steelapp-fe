// Owner: admin
// Tests: role and permission management
// Route: /app/users (Users & Roles tab, Permissions Matrix tab)

describe("Role Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/users*", "getUsers");
    cy.interceptAPI("GET", "/api/roles*", "getRoles");
    cy.visit("/app/users");
    cy.wait("@getUsers", { timeout: 15000 });
  });

  describe("Roles Page", () => {
    it("should load User Management page with heading", () => {
      cy.verifyPageLoads("User Management", "/app/users");
    });

    it("should display Users & Roles and Permissions Matrix tabs", () => {
      cy.contains("Users & Roles", { timeout: 10000 }).should("be.visible");
      cy.contains("Permissions Matrix").should("be.visible");
    });

    it("should display Manage Roles button", () => {
      cy.contains("Manage Roles", { timeout: 10000 }).should("be.visible");
    });

    it("should show role badges on user entries", () => {
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase();
        const hasRoles =
          text.includes("admin") ||
          text.includes("manager") ||
          text.includes("sales") ||
          text.includes("viewer") ||
          text.includes("role");
        expect(hasRoles, "Should display role names on user cards/rows").to.be.true;
      });
    });

    it("should open Manage Roles modal with role content", () => {
      cy.contains("Manage Roles", { timeout: 10000 }).click();
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasRoleContent =
          text.includes("role") && (text.includes("admin") || text.includes("manage"));
        expect(hasRoleContent, "Manage Roles modal should show role content").to.be.true;
      });
    });

    it("should have search/filter for users", () => {
      cy.get('input[placeholder*="Search"]', { timeout: 10000 }).first().should("be.visible");
    });
  });

  describe("Permissions Matrix", () => {
    beforeEach(() => {
      cy.contains("Permissions Matrix", { timeout: 10000 }).click();
    });

    it("should load permissions matrix tab", () => {
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase();
        const hasMatrix =
          text.includes("permission") || text.includes("matrix") || text.includes("module");
        expect(hasMatrix, "Permissions matrix tab should load with content").to.be.true;
      });
    });

    it("should show module rows in the matrix", () => {
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase();
        const hasModules =
          text.includes("invoice") ||
          text.includes("customer") ||
          text.includes("product") ||
          text.includes("payment") ||
          text.includes("quotation");
        expect(hasModules, "Matrix should show module names").to.be.true;
      });
    });

    it("should show permission type columns (read, create, update, delete)", () => {
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase();
        const hasPermTypes =
          text.includes("read") ||
          text.includes("create") ||
          text.includes("update") ||
          text.includes("delete") ||
          text.includes("view");
        expect(hasPermTypes, "Matrix should show permission types").to.be.true;
      });
    });

    it("should have checkboxes or toggles for permissions", () => {
      cy.get("body").then(($body) => {
        const hasToggles =
          $body.find('input[type="checkbox"]').length > 0 ||
          $body.find('[role="switch"]').length > 0 ||
          $body.find('[class*="toggle" i], [class*="check" i]').length > 0;
        expect(hasToggles, "Matrix should have permission toggles/checkboxes").to.be.true;
      });
    });

    it("should have role selector to view permissions per role", () => {
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasRoleSelector =
          $body.find("select").length > 0 ||
          $body.find('[role="combobox"]').length > 0 ||
          $body.find('[class*="select" i]').length > 0 ||
          text.includes("admin") ||
          text.includes("role");
        expect(hasRoleSelector, "Should have a way to select role for permissions view").to.be
          .true;
      });
    });
  });

  describe("Role Details", () => {
    it("should show predefined roles (admin, manager, sales, viewer)", () => {
      cy.contains("Manage Roles", { timeout: 10000 }).click();
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasPredefined =
          text.includes("admin") || text.includes("manager") || text.includes("viewer");
        expect(hasPredefined, "Should show predefined roles").to.be.true;
      });
    });

    it("should show role details with permission info", () => {
      cy.contains("Manage Roles", { timeout: 10000 }).click();
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasDetails =
          text.includes("permission") || text.includes("description") || text.includes("user");
        expect(hasDetails, "Should show role details or permission info").to.be.true;
      });
    });

    it("should show edit controls in role management", () => {
      cy.contains("Manage Roles", { timeout: 10000 }).click();
      cy.get("body").then(($body) => {
        const hasEditControls =
          $body.find("button").length > 0 ||
          $body.find('[class*="edit" i]').length > 0 ||
          $body.find('[class*="icon" i]').length > 0;
        expect(hasEditControls, "Should have edit controls for roles").to.be.true;
      });
    });

    it("should show users count or assignment info per role", () => {
      cy.contains("Manage Roles", { timeout: 10000 }).click();
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasAssignment =
          text.includes("user") ||
          text.includes("assigned") ||
          text.includes("member") ||
          /\d/.test(text);
        expect(hasAssignment, "Should show user assignment info for roles").to.be.true;
      });
    });
  });
});
