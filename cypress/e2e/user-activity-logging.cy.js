/**
 * User Activity Logging E2E Tests
 *
 * Tests user activity tracking and logging:
 * - Activity log recording
 * - User session tracking
 * - Action audit trails
 * - Login/logout tracking
 * - Access logs
 *
 * Run: npm run test:e2e -- --spec '**/user-activity-logging.cy.js'
 */

describe("User Activity Logging - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Activity Log Viewing", () => {
    it("should view user activity log", () => {
      cy.visit("/admin/activity-logs");

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="log-row"]')
        .first()
        .within(() => {
          cy.contains("User").should("be.visible");
          cy.contains("Action").should("be.visible");
          cy.contains("Timestamp").should("be.visible");
        });
    });

    it("should view activity log details", () => {
      cy.visit("/admin/activity-logs");
      cy.get('[data-testid="log-row"]').first().click();

      cy.contains("User").should("be.visible");
      cy.contains("Action").should("be.visible");
      cy.contains("IP Address").should("be.visible");
      cy.contains("Timestamp").should("be.visible");
      cy.contains("Details").should("be.visible");
    });

    it("should view login history", () => {
      cy.visit("/admin/login-logs");

      cy.get('[data-testid="login-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="login-row"]')
        .first()
        .within(() => {
          cy.contains("User").should("be.visible");
          cy.contains("Time").should("be.visible");
          cy.contains("IP").should("be.visible");
        });
    });

    it("should view logout history", () => {
      cy.visit("/admin/logout-logs");

      cy.get('[data-testid="logout-row"]').should("have.length.greaterThan", 0);
    });

    it("should view session tracking", () => {
      cy.visit("/admin/sessions");

      cy.get('[data-testid="session-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="session-row"]')
        .first()
        .within(() => {
          cy.contains("User").should("be.visible");
          cy.contains("Status").should("be.visible");
          cy.contains("IP Address").should("be.visible");
        });
    });
  });

  describe("Activity Filtering", () => {
    it("should filter activity by user", () => {
      cy.visit("/admin/activity-logs");

      cy.get('input[placeholder*="User"]').type("John");

      cy.wait(500);
      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter activity by action type", () => {
      cy.visit("/admin/activity-logs");

      cy.get('select[name="Action"]').select("CREATE");

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter activity by date range", () => {
      cy.visit("/admin/activity-logs");

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter activity by module", () => {
      cy.visit("/admin/activity-logs");

      cy.get('select[name="Module"]').select("INVOICES");

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter login by result", () => {
      cy.visit("/admin/login-logs");

      cy.get('select[name="Result"]').select("SUCCESS");

      cy.get('[data-testid="login-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Activity Search", () => {
    it("should search activity log by keyword", () => {
      cy.visit("/admin/activity-logs");

      cy.get('input[placeholder*="Search"]').type("invoice");

      cy.wait(500);
      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should search by IP address", () => {
      cy.visit("/admin/login-logs");

      cy.get('input[placeholder*="Search"]').type("192.168");

      cy.wait(500);
      cy.get('[data-testid="login-row"]').should("have.length.greaterThan", 0);
    });

    it("should search by user email", () => {
      cy.visit("/admin/activity-logs");

      cy.get('input[placeholder*="Search"]').type("user@example.com");

      cy.wait(500);
      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Activity Export", () => {
    it("should export activity log", () => {
      cy.visit("/admin/activity-logs");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/activity-log-*.csv").should("exist");
    });

    it("should export login history", () => {
      cy.visit("/admin/login-logs");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/login-logs-*.pdf").should("exist");
    });

    it("should export session logs", () => {
      cy.visit("/admin/sessions");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/sessions-*.csv").should("exist");
    });
  });

  describe("Activity Retention & Cleanup", () => {
    it("should configure activity log retention", () => {
      cy.visit("/admin/settings/logging");

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Retention Days"]').clear().type("90");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Settings updated").should("be.visible");
    });

    it("should view activity log disk usage", () => {
      cy.visit("/admin/settings/logging");

      cy.contains("Disk Usage").should("be.visible");
      cy.contains("Records Stored").should("be.visible");
    });

    it("should archive old activity logs", () => {
      cy.visit("/admin/settings/logging");

      cy.get('button:contains("Archive Logs")').click();

      cy.get('input[placeholder*="Before Date"]').type("2024-01-01");

      cy.get('button:contains("Archive")').click();
      cy.contains("Logs archived").should("be.visible");
    });

    it("should purge expired logs", () => {
      cy.visit("/admin/settings/logging");

      cy.get('button:contains("Purge Logs")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Old logs purged").should("be.visible");
    });
  });

  describe("Activity Audit", () => {
    it("should view user activity summary", () => {
      cy.visit("/admin/users");
      cy.get('[data-testid="user-row"]').first().click();

      cy.get('button:contains("Activity")').click();

      cy.get('[data-testid="activity-row"]').should("have.length.greaterThan", 0);
    });

    it("should view resource change audit trail", () => {
      cy.visit("/admin/audit-trail");

      cy.get('select[name="Resource"]').select("INVOICE");

      cy.get('[data-testid="change-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="change-row"]')
        .first()
        .within(() => {
          cy.contains("Before").should("be.visible");
          cy.contains("After").should("be.visible");
        });
    });

    it("should view field-level changes", () => {
      cy.visit("/admin/audit-trail");

      cy.get('[data-testid="change-row"]').first().click();

      cy.contains("Field").should("be.visible");
      cy.contains("Old Value").should("be.visible");
      cy.contains("New Value").should("be.visible");
      cy.contains("Changed By").should("be.visible");
      cy.contains("Changed At").should("be.visible");
    });

    it("should generate audit report", () => {
      cy.visit("/admin/audit-trail");

      cy.get('button:contains("Generate Report")').click();

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('select[name="Resource Type"]').select("ALL");

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });
  });

  describe("Activity Analytics", () => {
    it("should view user activity metrics", () => {
      cy.visit("/admin/activity-logs");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Activities").should("be.visible");
      cy.contains("Active Users").should("be.visible");
      cy.contains("Total Logins").should("be.visible");
    });

    it("should view activity by user", () => {
      cy.visit("/admin/activity-logs");

      cy.get('button:contains("By User")').click();

      cy.get('[data-testid="user-row"]').should("have.length.greaterThan", 0);
    });

    it("should view activity by action type", () => {
      cy.visit("/admin/activity-logs");

      cy.get('button:contains("By Action")').click();

      cy.get('[data-testid="action-row"]').should("have.length.greaterThan", 0);
    });

    it("should view hourly activity distribution", () => {
      cy.visit("/admin/activity-logs");

      cy.get('button:contains("Hourly Distribution")').click();

      cy.contains("Distribution").should("be.visible");
    });
  });

  describe("Session Management", () => {
    it("should view active sessions", () => {
      cy.visit("/admin/sessions");

      cy.get('[data-testid="session-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="session-row"]')
        .first()
        .within(() => {
          cy.contains("ACTIVE").should("be.visible");
        });
    });

    it("should terminate user session", () => {
      cy.visit("/admin/sessions");

      cy.get('[data-testid="session-row"]').first().within(() => {
        cy.get('button[aria-label="Terminate"]').click();
      });

      cy.get('button:contains("Confirm")').click();
      cy.contains("Session terminated").should("be.visible");
    });

    it("should force logout all sessions", () => {
      cy.visit("/admin/users");
      cy.get('[data-testid="user-row"]').first().click();

      cy.get('button:contains("Force Logout")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("User logged out").should("be.visible");
    });

    it("should view session duration", () => {
      cy.visit("/admin/sessions");

      cy.get('[data-testid="session-row"]').first().click();

      cy.contains("Session Duration").should("be.visible");
      cy.contains("Login Time").should("be.visible");
      cy.contains("Last Activity").should("be.visible");
    });
  });

  describe("Suspicious Activity Detection", () => {
    it("should highlight failed login attempts", () => {
      cy.visit("/admin/login-logs");

      cy.get('select[name="Result"]').select("FAILED");

      cy.get('[data-testid="login-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="login-row"]')
        .first()
        .should("have.class", "alert-row"); // Visual indicator
    });

    it("should detect rapid activity", () => {
      cy.visit("/admin/security");

      cy.get('button:contains("Rapid Activity")').click();

      cy.get('[data-testid="alert-row"]').should("have.length.greaterThan", 0);
    });

    it("should view security alerts", () => {
      cy.visit("/admin/security-alerts");

      cy.get('[data-testid="alert-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="alert-row"]')
        .first()
        .within(() => {
          cy.contains("Alert Type").should("be.visible");
          cy.contains("Severity").should("be.visible");
        });
    });
  });
});
