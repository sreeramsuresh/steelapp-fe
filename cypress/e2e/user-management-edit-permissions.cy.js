/**
 * E2E Test: User Management - Edit User Roles and Verify Permissions
 *
 * This test verifies that user roles can be edited and that the
 * permission changes are correctly reflected in the system.
 *
 * Test Steps:
 * 1. Login as admin
 * 2. Navigate to Company Settings > User Management
 * 3. Find an existing user
 * 4. Click "View Permissions" to see current permissions
 * 5. Close and click "Edit" on the user
 * 6. Modify roles (add/remove)
 * 7. Save changes
 * 8. Verify success notification
 * 9. Click "View Permissions" again
 * 10. Verify permissions reflect the role changes
 */

describe("User Management - Edit User Roles and Verify Permissions", () => {
  const testUser = {
    name: "Edit Test User " + Date.now(),
    email: `edituser${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  before(() => {
    // Login as admin
    cy.visit("/login");
    cy.get('input[type="email"]').type("admin@ultimatesteel.com");
    cy.get('input[type="password"]').type("admin123");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");

    // Create a test user first
    cy.visit("/settings");
    cy.contains("button", "Add User").click();

    cy.get('input[placeholder*="full name"]').type(testUser.name);
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[placeholder*="8 characters"]').type(testUser.password);

    // Select initial role - Stock Viewer only
    cy.contains("Stock Viewer").click();

    cy.contains("button", "Add User").last().click();
    cy.contains("User created successfully", { timeout: 10000 }).should(
      "be.visible",
    );

    // Wait for modal to close
    cy.wait(1000);
  });

  it("should display user in the user list", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Verify user is displayed
    cy.contains(testUser.name).should("be.visible");
    cy.contains(testUser.email).should("be.visible");
  });

  it("should show initial role badge", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Verify Stock Viewer role is displayed
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Stock Viewer").should("be.visible");
      });
  });

  it("should open View Permissions modal and show initial permissions", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Click View Permissions button (eye icon)
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get('button[title*="View All Permissions"]').click();
      });

    // Verify permissions modal is open
    cy.contains("User Permissions").should("be.visible");
    cy.contains(testUser.name).should("be.visible");

    // Verify Stock Viewer role is shown
    cy.contains("Stock Viewer").should("be.visible");

    // Verify permissions are displayed
    // Stock Viewer should have read-only permissions
    cy.contains("stock").should("be.visible");

    // Close modal
    cy.get("button").contains("Close").click();
  });

  it("should open Edit User modal", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Click Edit button
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get("button").filter('[title=""]').first().click({ force: true });
      });

    // Verify Edit User modal is open
    cy.contains("Edit User").should("be.visible");

    // Verify user details are pre-filled
    cy.get('input[value*="' + testUser.name.substring(0, 10) + '"]').should(
      "exist",
    );
  });

  it("should allow editing user name and email", () => {
    cy.visit("/settings");

    // Search and open edit modal
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get("button").filter('[title=""]').first().click({ force: true });
      });

    // Update name
    const newName = testUser.name + " Updated";
    cy.get('input[placeholder*="full name"]').clear().type(newName);

    // Save changes
    cy.contains("button", "Save Changes").click();

    // Verify success
    cy.contains("User updated successfully", { timeout: 10000 }).should(
      "be.visible",
    );

    // Verify updated name is displayed
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);
    cy.contains(newName).should("be.visible");

    // Update testUser for subsequent tests
    testUser.name = newName;
  });

  it("should allow adding additional roles", () => {
    cy.visit("/settings");

    // Search and open edit modal
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get("button").filter('[title=""]').first().click({ force: true });
      });

    // Add Sales Manager role (keeping Stock Viewer)
    cy.contains("Sales Manager").click();

    // Verify both roles are selected (should show checkmarks)
    cy.contains("Stock Viewer")
      .parent()
      .within(() => {
        cy.get("svg").should("exist"); // Checkmark icon
      });
    cy.contains("Sales Manager")
      .parent()
      .within(() => {
        cy.get("svg").should("exist"); // Checkmark icon
      });

    // Save changes
    cy.contains("button", "Save Changes").click();

    // Verify success
    cy.contains("User updated successfully", { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("should display both role badges after update", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Verify both roles are displayed
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Stock Viewer").should("be.visible");
        cy.contains("Sales Manager").should("be.visible");
      });
  });

  it("should show updated permissions in View Permissions modal", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Click View Permissions
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get('button[title*="View All Permissions"]').click();
      });

    // Verify both roles are shown
    cy.contains("Stock Viewer").should("be.visible");
    cy.contains("Sales Manager").should("be.visible");

    // Verify permissions from Sales Manager role are present
    // Sales Manager should have create/update permissions for invoices
    cy.contains("invoice").should("be.visible");
    cy.contains("sales").should("be.visible");

    // Close modal
    cy.get("button").contains("Close").click();
  });

  it("should allow removing a role", () => {
    cy.visit("/settings");

    // Search and open edit modal
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get("button").filter('[title=""]').first().click({ force: true });
      });

    // Remove Stock Viewer role (click to deselect)
    cy.contains("Stock Viewer").click();

    // Verify only Sales Manager is selected
    cy.contains("Sales Manager")
      .parent()
      .within(() => {
        cy.get("svg").should("exist"); // Checkmark should be present
      });

    // Save changes
    cy.contains("button", "Save Changes").click();

    // Verify success
    cy.contains("User updated successfully", { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("should only show remaining role after removal", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Verify only Sales Manager is displayed
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Sales Manager").should("be.visible");
        cy.contains("Stock Viewer").should("not.exist");
      });
  });

  it("should prevent removing all roles", () => {
    cy.visit("/settings");

    // Search and open edit modal
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get("button").filter('[title=""]').first().click({ force: true });
      });

    // Try to deselect the last role
    cy.contains("Sales Manager").click();

    // Try to save
    cy.contains("button", "Save Changes").click();

    // Should show validation error
    cy.contains("assign at least one role").should("be.visible");
  });

  it("should toggle user status between active and inactive", () => {
    cy.visit("/settings");

    // Search for the test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Click status toggle
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Active").click();
      });

    // Verify status changed to Inactive
    cy.contains("User status updated").should("be.visible");
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Inactive").should("be.visible");
      });

    // Toggle back to Active
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Inactive").click();
      });

    cy.contains("User status updated").should("be.visible");
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Active").should("be.visible");
      });
  });

  after(() => {
    // Cleanup: Delete the test user
    cy.visit("/settings");

    // Search for test user
    cy.get('input[placeholder*="Search users"]').clear().type(testUser.email);

    // Delete the user
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get("button").last().click({ force: true });
      });

    // Confirm deletion
    cy.on("window:confirm", () => true);

    // Verify deletion success
    cy.contains("User deleted successfully").should("be.visible");
  });
});
