/**
 * E2E Test: User Management - Create User with Roles
 *
 * This test verifies that users can be created with multiple roles
 * and that the roles are correctly assigned and displayed.
 *
 * Test Steps:
 * 1. Login as admin
 * 2. Navigate to Company Settings > User Management
 * 3. Click "Add User" button
 * 4. Fill in user details (name, email, password)
 * 5. Select multiple roles
 * 6. Submit the form
 * 7. Verify success notification
 * 8. Verify user appears in the list with correct roles
 * 9. Verify the user can login with the new credentials
 */

describe("User Management - Create User with Roles", () => {
  const testUser = {
    name: "Test User " + Date.now(),
    email: `testuser${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  before(() => {
    // Login as admin before running tests
    cy.visit("/login");
    cy.get('input[type="email"]').type("admin@ultimatesteel.com");
    cy.get('input[type="password"]').type("admin123");
    cy.get('button[type="submit"]').click();

    // Wait for dashboard to load
    cy.url().should("match", /\/(app|analytics)/);
  });

  it("should navigate to User Management section", () => {
    // Navigate to Company Settings
    cy.visit("/app/settings");

    // Wait for settings page to load
    cy.contains("Company Settings").should("be.visible");

    // Click on Users tab or section
    cy.contains("User Management").should("be.visible");
  });

  it("should open Add User modal", () => {
    cy.visit("/app/settings");

    // Click Add User button
    cy.contains("button", "Add User").click();

    // Verify modal is open
    cy.contains("Add New User").should("be.visible");
  });

  it("should validate required fields", () => {
    cy.visit("/app/settings");
    cy.contains("button", "Add User").click();

    // Try to submit without filling fields
    cy.contains("button", "Add User").last().click();

    // Should show validation errors
    cy.contains("Name is required").should("be.visible");
  });

  it("should validate email format", () => {
    cy.visit("/app/settings");
    cy.contains("button", "Add User").click();

    // Enter invalid email
    cy.get('input[placeholder*="full name"]').type("Test User");
    cy.get('input[type="email"]').type("invalid-email");
    cy.get('input[placeholder*="8 characters"]').type("password123");

    // Try to submit
    cy.contains("button", "Add User").last().click();

    // Should show email validation error
    cy.contains("valid email address").should("be.visible");
  });

  it("should validate password strength", () => {
    cy.visit("/app/settings");
    cy.contains("button", "Add User").click();

    // Enter short password
    cy.get('input[placeholder*="full name"]').type("Test User");
    cy.get('input[type="email"]').type("test@example.com");
    cy.get('input[placeholder*="8 characters"]').type("short");

    // Try to submit
    cy.contains("button", "Add User").last().click();

    // Should show password validation error
    cy.contains("at least 8 characters").should("be.visible");
  });

  it("should validate role selection", () => {
    cy.visit("/app/settings");
    cy.contains("button", "Add User").click();

    // Fill in all fields except roles
    cy.get('input[placeholder*="full name"]').type("Test User");
    cy.get('input[type="email"]').type("test@example.com");
    cy.get('input[placeholder*="8 characters"]').type("password123");

    // Try to submit without selecting roles
    cy.contains("button", "Add User").last().click();

    // Should show role validation error
    cy.contains("assign at least one role").should("be.visible");
  });

  it("should successfully create user with multiple roles", () => {
    cy.visit("/app/settings");
    cy.contains("button", "Add User").click();

    // Fill in user details
    cy.get('input[placeholder*="full name"]').type(testUser.name);
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[placeholder*="8 characters"]').type(testUser.password);

    // Select multiple roles (click on role cards)
    // Note: Adjust selectors based on your actual role structure
    cy.contains("Sales Manager").click();
    cy.contains("Stock Viewer").click();

    // Submit form
    cy.contains("button", "Add User").last().click();

    // Verify success notification
    cy.contains("User created successfully", { timeout: 10000 }).should(
      "be.visible",
    );

    // Verify modal closes
    cy.contains("Add New User").should("not.exist");
  });

  it("should display newly created user in the list", () => {
    cy.visit("/app/settings");

    // Search for the new user
    cy.get('input[placeholder*="Search users"]').type(testUser.email);

    // Verify user appears in the list
    cy.contains(testUser.name).should("be.visible");
    cy.contains(testUser.email).should("be.visible");

    // Verify roles are displayed
    cy.contains("Sales Manager").should("be.visible");
    cy.contains("Stock Viewer").should("be.visible");
  });

  it("should show user as active by default", () => {
    cy.visit("/app/settings");

    // Search for the user
    cy.get('input[placeholder*="Search users"]').type(testUser.email);

    // Verify status toggle shows "Active"
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.contains("Active").should("be.visible");
      });
  });

  it("should allow the new user to login", () => {
    // Logout current user
    cy.visit("/logout");

    // Try to login with new user credentials
    cy.visit("/login");
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Verify successful login
    cy.url().should("match", /\/(app|analytics)/);
    cy.contains("Welcome").should("be.visible");
  });

  after(() => {
    // Cleanup: Delete the test user (optional)
    // You might want to keep this for manual verification

    // Re-login as admin
    cy.visit("/login");
    cy.get('input[type="email"]').type("admin@ultimatesteel.com");
    cy.get('input[type="password"]').type("admin123");
    cy.get('button[type="submit"]').click();

    // Navigate to user management
    cy.visit("/app/settings");

    // Search for test user
    cy.get('input[placeholder*="Search users"]').type(testUser.email);

    // Delete the user
    cy.contains(testUser.name)
      .parent()
      .parent()
      .within(() => {
        cy.get('button[title*="delete"]').click({ force: true });
      });

    // Confirm deletion
    cy.on("window:confirm", () => true);

    // Verify deletion success
    cy.contains("User deleted successfully").should("be.visible");
  });
});
