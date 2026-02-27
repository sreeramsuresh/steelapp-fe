/**
 * E2E Tests for Role Management System
 *
 * Test Scenarios:
 * 1. Open Role Management Modal
 * 2. View System Roles
 * 3. Create New Custom Role
 * 4. Create Role with Validation Errors
 * 5. Edit System Role
 * 6. Edit Custom Role
 * 7. Try to Delete System Role
 * 8. Delete Custom Role
 * 9. Assign Role to User
 */

describe("Role Management - E2E Tests", () => {
  beforeEach(() => {
    // Login before each test
    cy.visit("/login");
    cy.get('input[type="email"]').type(Cypress.env("testUserEmail"));
    cy.get('input[type="password"]').type(Cypress.env("testUserPassword"));
    cy.get('button[type="submit"]').click();

    // Wait for dashboard to load
    cy.url().should("match", /\/(app|analytics)/);
    cy.wait(1000);
  });

  describe("1. Open Role Management Modal", () => {
    it("should navigate to User Management and open Role Management modal", () => {
      // Navigate to Company Settings
      cy.contains("Settings").click();
      cy.wait(500);

      // Click User Management
      cy.contains("User Management").click();
      cy.wait(500);

      // Click Manage Roles button
      cy.contains("button", "Manage Roles").should("be.visible").click();

      // Modal should be visible
      cy.contains("h2", "Manage Roles").should("be.visible");
      cy.get('[data-testid="role-management-modal"]').should("exist");
    });

    it("should display modal header with shield icon", () => {
      // Open modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();

      // Check header elements
      cy.contains("h2", "Manage Roles").should("be.visible");
      cy.get("svg").should("exist"); // Shield icon
    });

    it("should have close button in modal", () => {
      // Open modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();

      // Close button should exist
      cy.get('button[aria-label="Close"]').should("exist");
    });
  });

  describe("2. View System Roles", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);
    });

    it("should display all 12 system roles", () => {
      const systemRoles = [
        "Managing Director",
        "Operations Manager",
        "Finance Manager",
        "Sales Manager",
        "Purchase Manager",
        "Warehouse Manager",
        "Accounts Manager",
        "Sales Executive",
        "Purchase Executive",
        "Stock Keeper",
        "Accounts Executive",
        "Logistics Coordinator",
      ];

      systemRoles.forEach((roleName) => {
        cy.contains(roleName).should("be.visible");
      });
    });

    it("should display lock badge on system roles", () => {
      // Check for system badge/indicator
      cy.contains("Managing Director")
        .parent()
        .parent()
        .within(() => {
          cy.contains("System").should("be.visible");
          cy.get("svg").should("exist"); // Lock icon
        });
    });

    it("should display Director badge on top 3 roles", () => {
      const directorRoles = [
        "Managing Director",
        "Operations Manager",
        "Finance Manager",
      ];

      directorRoles.forEach((roleName) => {
        cy.contains(roleName)
          .parent()
          .parent()
          .within(() => {
            cy.contains("Director").should("be.visible");
          });
      });
    });

    it("should not show delete button on system roles", () => {
      cy.contains("Managing Director")
        .parent()
        .parent()
        .within(() => {
          // Should have edit button
          cy.get('button[title="Edit role"]').should("exist");

          // Should NOT have delete button
          cy.get('button[title="Delete role"]').should("not.exist");
        });
    });

    it("should show edit button on all roles", () => {
      cy.contains("Managing Director")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').should("be.visible");
        });

      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').should("be.visible");
        });
    });
  });

  describe("3. Create New Custom Role", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);
    });

    it("should open create role form", () => {
      cy.contains("button", "Create New Role").click();

      // Form should be visible
      cy.contains("Create New Role").should("be.visible");
      cy.get("input#displayName").should("be.visible");
      cy.get("textarea#description").should("be.visible");
      cy.get('input#isDirector[type="checkbox"]').should("be.visible");
    });

    it("should create a new custom role successfully", () => {
      const roleName = `Quality Inspector ${Date.now()}`;
      const roleDescription = "Inspects product quality and ensures standards";

      // Open create form
      cy.contains("button", "Create New Role").click();

      // Fill in form
      cy.get("input#displayName").type(roleName);
      cy.get("textarea#description").type(roleDescription);
      cy.get('input#isDirector[type="checkbox"]').should("not.be.checked");

      // Submit
      cy.contains("button", "Create Role").click();

      // Success notification
      cy.contains("Role created successfully").should("be.visible");

      // Role should appear in list
      cy.contains(roleName).should("be.visible");
      cy.contains(roleDescription).should("be.visible");
    });

    it("should create director role with elevated privileges", () => {
      const roleName = `Quality Director ${Date.now()}`;

      // Open create form
      cy.contains("button", "Create New Role").click();

      // Fill in form
      cy.get("input#displayName").type(roleName);
      cy.get("textarea#description").type("Director of quality assurance");
      cy.get('input#isDirector[type="checkbox"]').check();

      // Submit
      cy.contains("button", "Create Role").click();

      // Success notification
      cy.contains("Role created successfully").should("be.visible");

      // Role should have Director badge
      cy.contains(roleName)
        .parent()
        .parent()
        .within(() => {
          cy.contains("Director").should("be.visible");
        });
    });

    it("should create role without description (optional field)", () => {
      const roleName = `Basic Role ${Date.now()}`;

      // Open create form
      cy.contains("button", "Create New Role").click();

      // Fill only display name
      cy.get("input#displayName").type(roleName);
      // Leave description empty

      // Submit
      cy.contains("button", "Create Role").click();

      // Success notification
      cy.contains("Role created successfully").should("be.visible");

      // Role should appear
      cy.contains(roleName).should("be.visible");
    });

    it("should cancel role creation", () => {
      // Open create form
      cy.contains("button", "Create New Role").click();

      // Fill in form
      cy.get("input#displayName").type("Test Role");

      // Cancel
      cy.contains("button", "Cancel").click();

      // Form should close
      cy.get("input#displayName").should("not.exist");
      cy.contains("Create New Role").should("not.exist");
    });
  });

  describe("4. Create Role with Validation Errors", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);
      cy.contains("button", "Create New Role").click();
    });

    it("should show error for display name less than 3 characters", () => {
      cy.get("input#displayName").type("AB");
      cy.contains("button", "Create Role").click();

      cy.contains("Display name must be at least 3 characters").should(
        "be.visible",
      );
    });

    it("should show error for empty display name", () => {
      cy.contains("button", "Create Role").click();

      cy.contains("Display name must be at least 3 characters").should(
        "be.visible",
      );
    });

    it("should show error for display name more than 50 characters", () => {
      const longName = "A".repeat(51);
      cy.get("input#displayName").type(longName);
      cy.contains("button", "Create Role").click();

      cy.contains("Display name must be less than 50 characters").should(
        "be.visible",
      );
    });

    it('should show error for reserved name "admin"', () => {
      cy.get("input#displayName").type("admin");
      cy.contains("button", "Create Role").click();

      cy.contains("reserved name").should("be.visible");
    });

    it('should show error for reserved name "superuser"', () => {
      cy.get("input#displayName").type("superuser");
      cy.contains("button", "Create Role").click();

      cy.contains("reserved name").should("be.visible");
    });

    it('should show error for reserved name "root"', () => {
      cy.get("input#displayName").type("root");
      cy.contains("button", "Create Role").click();

      cy.contains("reserved name").should("be.visible");
    });

    it("should show error for duplicate role name", () => {
      cy.get("input#displayName").type("Sales Manager");
      cy.contains("button", "Create Role").click();

      cy.contains("A role with this name already exists").should("be.visible");
    });

    it("should clear error when input is corrected", () => {
      // Enter invalid input
      cy.get("input#displayName").type("AB");
      cy.contains("button", "Create Role").click();
      cy.contains("Display name must be at least 3 characters").should(
        "be.visible",
      );

      // Correct the input
      cy.get("input#displayName").clear().type("ABC");

      // Error should disappear
      cy.contains("Display name must be at least 3 characters").should(
        "not.exist",
      );
    });
  });

  describe("5. Edit System Role", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);
    });

    it("should open edit form for system role", () => {
      // Click edit on Sales Manager
      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Edit form should be visible
      cy.contains("Edit Role").should("be.visible");
      cy.get("input#displayName").should("be.visible");
    });

    it("should disable display name field for system role", () => {
      // Click edit on Sales Manager
      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Display name should be disabled
      cy.get("input#displayName").should("be.disabled");
    });

    it("should show system role warning message", () => {
      // Click edit on Sales Manager
      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Warning message should be visible
      cy.contains("System Role").should("be.visible");
      cy.contains("You can edit the description and director status").should(
        "be.visible",
      );
    });

    it("should update system role description", () => {
      const newDescription = `Updated description ${Date.now()}`;

      // Click edit on Sales Manager
      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Update description
      cy.get("textarea#description").clear().type(newDescription);
      cy.contains("button", "Update Role").click();

      // Success notification
      cy.contains("Role updated successfully").should("be.visible");

      // Updated description should be visible
      cy.contains(newDescription).should("be.visible");
    });

    it("should toggle director status on system role", () => {
      // Click edit on Sales Manager (not a director initially)
      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Check director checkbox
      cy.get('input#isDirector[type="checkbox"]').check();
      cy.contains("button", "Update Role").click();

      // Success notification
      cy.contains("Role updated successfully").should("be.visible");

      // Director badge should now appear
      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.contains("Director").should("be.visible");
        });
    });
  });

  describe("6. Edit Custom Role", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);

      // Create a custom role first
      cy.contains("button", "Create New Role").click();
      cy.get("input#displayName").type(`Test Role ${Date.now()}`);
      cy.get("textarea#description").type("Original description");
      cy.contains("button", "Create Role").click();
      cy.wait(1000);
    });

    it("should edit custom role with all fields editable", () => {
      // Find the custom role and click edit
      cy.contains("Test Role")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // All fields should be editable
      cy.get("input#displayName").should("not.be.disabled");
      cy.get("textarea#description").should("not.be.disabled");
      cy.get('input#isDirector[type="checkbox"]').should("not.be.disabled");
    });

    it("should update custom role display name", () => {
      const newName = `Updated Role ${Date.now()}`;

      // Edit custom role
      cy.contains("Test Role")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Update display name
      cy.get("input#displayName").clear().type(newName);
      cy.contains("button", "Update Role").click();

      // Success notification
      cy.contains("Role updated successfully").should("be.visible");

      // New name should be visible
      cy.contains(newName).should("be.visible");
    });

    it("should update custom role description", () => {
      const newDescription = `Updated description ${Date.now()}`;

      // Edit custom role
      cy.contains("Test Role")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Edit role"]').click();
        });

      // Update description
      cy.get("textarea#description").clear().type(newDescription);
      cy.contains("button", "Update Role").click();

      // Success notification
      cy.contains("Role updated successfully").should("be.visible");
    });
  });

  describe("7. Try to Delete System Role", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);
    });

    it("should not show delete button on system roles", () => {
      cy.contains("Managing Director")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Delete role"]').should("not.exist");
        });

      cy.contains("Sales Manager")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Delete role"]').should("not.exist");
        });
    });

    it("should show error notification if delete attempted via API", () => {
      // This test assumes attempting to delete via direct API call
      // In UI, the button shouldn't exist, so this tests the backend protection
      cy.request({
        method: "DELETE",
        url: `${Cypress.env("apiUrl")}/api/roles/1`, // System role ID
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.include("System role");
      });
    });
  });

  describe("8. Delete Custom Role", () => {
    beforeEach(() => {
      // Open role management modal
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);

      // Create a custom role to delete
      cy.contains("button", "Create New Role").click();
      cy.get("input#displayName").type(`Deletable Role ${Date.now()}`);
      cy.contains("button", "Create Role").click();
      cy.wait(1000);
    });

    it("should show delete button on custom roles", () => {
      cy.contains("Deletable Role")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Delete role"]').should("be.visible");
        });
    });

    it("should show confirmation dialog when delete clicked", () => {
      cy.contains("Deletable Role")
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Delete role"]').click();
        });

      // Confirmation dialog (using window.confirm)
      // Cypress auto-accepts confirm dialogs, so we'll check the outcome
    });

    it("should delete custom role successfully", () => {
      const roleName = "Deletable Role";

      // Click delete
      cy.contains(roleName)
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Delete role"]').click();
        });

      // Cypress auto-accepts confirm
      cy.wait(500);

      // Success notification
      cy.contains("Role deleted successfully").should("be.visible");

      // Role should be removed from list
      cy.contains(roleName).should("not.exist");
    });

    it("should cancel deletion when confirm is cancelled", () => {
      const roleName = "Deletable Role";

      // Stub window.confirm to return false (cancel)
      cy.window().then((win) => {
        cy.stub(win, "confirm").returns(false);
      });

      // Click delete
      cy.contains(roleName)
        .parent()
        .parent()
        .within(() => {
          cy.get('button[title="Delete role"]').click();
        });

      // Role should still exist
      cy.contains(roleName).should("be.visible");
    });
  });

  describe("9. Assign Role to User", () => {
    beforeEach(() => {
      // Navigate to User Management
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.wait(500);
    });

    it("should show role dropdown when creating/editing user", () => {
      // Click Add User or Edit User
      cy.contains("button", "Add User").click();

      // Role dropdown should exist
      cy.get('select[name="role"]').should("be.visible");
    });

    it("should display all roles in dropdown", () => {
      cy.contains("button", "Add User").click();

      // Get role select
      cy.get('select[name="role"]').click();

      // Should have system roles
      cy.get('select[name="role"] option').should(
        "contain",
        "Managing Director",
      );
      cy.get('select[name="role"] option').should("contain", "Sales Manager");
    });

    it("should create user with assigned role", () => {
      const userName = `Test User ${Date.now()}`;
      const userEmail = `testuser${Date.now()}@example.com`;

      cy.contains("button", "Add User").click();

      // Fill user details
      cy.get('input[name="name"]').type(userName);
      cy.get('input[name="email"]').type(userEmail);
      cy.get('select[name="role"]').select("Sales Manager");

      // Submit
      cy.contains("button", "Create User").click();

      // Success notification
      cy.contains("User created successfully").should("be.visible");

      // User should appear with role
      cy.contains(userName).should("be.visible");
      cy.contains("Sales Manager").should("be.visible");
    });

    it("should update user role", () => {
      // Find existing user and click edit
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get('button[title="Edit user"]').click();
        });

      // Change role
      cy.get('select[name="role"]').select("Purchase Manager");

      // Save
      cy.contains("button", "Update User").click();

      // Success notification
      cy.contains("User updated successfully").should("be.visible");
    });

    it("should display custom roles in dropdown", () => {
      // First create a custom role
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);

      const customRoleName = `Custom Role ${Date.now()}`;
      cy.contains("button", "Create New Role").click();
      cy.get("input#displayName").type(customRoleName);
      cy.contains("button", "Create Role").click();
      cy.wait(1000);

      // Close role modal
      cy.contains("button", "Close").click();

      // Open user form
      cy.contains("button", "Add User").click();

      // Custom role should be in dropdown
      cy.get('select[name="role"]').click();
      cy.get('select[name="role"] option').should("contain", customRoleName);
    });
  });

  describe("10. Role Management - UI Interactions", () => {
    beforeEach(() => {
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();
      cy.wait(500);
    });

    it("should close modal when close button clicked", () => {
      cy.contains("button", "Close").click();

      // Modal should close
      cy.contains("h2", "Manage Roles").should("not.exist");
    });

    it("should close modal when X button clicked", () => {
      cy.get('button[aria-label="Close"]').click();

      // Modal should close
      cy.contains("h2", "Manage Roles").should("not.exist");
    });

    it("should display loading state while fetching roles", () => {
      // Intercept API call to add delay
      cy.intercept("GET", "**/api/roles", (req) => {
        req.reply((res) => {
          res.delay = 2000;
        });
      });

      // Reload modal
      cy.reload();
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();

      // Should show loading indicator
      cy.contains("Loading roles...").should("be.visible");
    });

    it("should show empty state when no roles exist", () => {
      // Mock empty response
      cy.intercept("GET", "**/api/roles", []);

      // Reload modal
      cy.reload();
      cy.contains("Settings").click();
      cy.contains("User Management").click();
      cy.contains("button", "Manage Roles").click();

      // Should show empty state
      cy.contains("No roles found").should("be.visible");
    });

    it("should handle dark mode correctly", () => {
      // Toggle dark mode if available
      cy.get('[data-testid="theme-toggle"]').click();
      cy.wait(500);

      // Modal should have dark mode classes
      cy.get('[data-testid="role-management-modal"]').should(
        "have.class",
        "bg-gray-800",
      );
    });
  });
});
