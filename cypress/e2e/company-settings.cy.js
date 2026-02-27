/**
 * Company Settings E2E Tests
 *
 * Tests company configuration:
 * - Company information
 * - System settings
 * - Integration configuration
 * - Email settings
 * - Document templates
 *
 */

describe("Company Settings - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Company Information", () => {
    it("should view company details", () => {
      cy.visit("/app/settings/company");

      cy.contains("Company Name").should("be.visible");
      cy.contains("TRN").should("be.visible");
      cy.contains("Address").should("be.visible");
    });

    it("should edit company details", () => {
      cy.visit("/app/settings/company");

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Company Name"]').clear().type("Updated Company");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Company updated").should("be.visible");
    });

    it("should upload company logo", () => {
      cy.visit("/app/settings/company");

      cy.get('button:contains("Upload Logo")').click();

      cy.get('input[type="file"]').selectFile("cypress/fixtures/logo.png");

      cy.get('button:contains("Upload")').click();
      cy.contains("Logo uploaded").should("be.visible");
    });

    it("should configure fiscal year", () => {
      cy.visit("/app/settings/company");

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Fiscal Year Start"]').type("2024-01-01");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Company updated").should("be.visible");
    });
  });

  describe("System Settings", () => {
    it("should configure system defaults", () => {
      cy.visit("/app/settings/system");

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Default Currency"]').select("AED");
      cy.get('select[name="Default Language"]').select("English");
      cy.get('select[name="Timezone"]').select("GMT+4");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Settings updated").should("be.visible");
    });

    it("should configure number format", () => {
      cy.visit("/app/settings/system");

      cy.get('button:contains("Number Format")').click();

      cy.get('input[placeholder*="Decimal Separator"]').clear().type(".");
      cy.get('input[placeholder*="Thousands Separator"]').clear().type(",");

      cy.get('button:contains("Save")').click();
      cy.contains("Format updated").should("be.visible");
    });

    it("should configure date format", () => {
      cy.visit("/app/settings/system");

      cy.get('select[name="Date Format"]').select("DD/MM/YYYY");

      cy.get('button:contains("Save")').click();
      cy.contains("Settings updated").should("be.visible");
    });
  });

  describe("Email Configuration", () => {
    it("should configure SMTP settings", () => {
      cy.visit("/app/settings/email");

      cy.get('button:contains("Configure SMTP")').click();

      cy.get('input[placeholder*="SMTP Server"]').type("smtp.gmail.com");
      cy.get('input[placeholder*="Port"]').type("587");
      cy.get('input[placeholder*="Email"]').type("noreply@company.com");
      cy.get('input[placeholder*="Password"]').type("password");

      cy.get('button:contains("Save")').click();
      cy.contains("Settings saved").should("be.visible");
    });

    it("should test email configuration", () => {
      cy.visit("/app/settings/email");

      cy.get('button:contains("Test Email")').click();

      cy.get('input[placeholder*="Test Email"]').type("test@example.com");

      cy.get('button:contains("Send Test")').click();

      cy.contains("Test email sent").should("be.visible");
    });

    it("should configure email templates", () => {
      cy.visit("/app/settings/email-templates");

      cy.get('[data-testid="template-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('textarea[placeholder*="Subject"]').clear().type("New Subject");

      cy.get('button:contains("Save Template")').click();
      cy.contains("Template updated").should("be.visible");
    });
  });

  describe("Document Templates", () => {
    it("should configure invoice template", () => {
      cy.visit("/app/settings/document-templates");

      cy.get('[data-testid="template"]').contains("Invoice").click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Template Name"]').clear().type("Custom Invoice");

      cy.get('button:contains("Save")').click();
      cy.contains("Template updated").should("be.visible");
    });

    it("should upload custom logo to template", () => {
      cy.visit("/app/settings/document-templates");

      cy.get('[data-testid="template"]').first().click();

      cy.get('button:contains("Upload Logo")').click();

      cy.get('input[type="file"]').selectFile("cypress/fixtures/logo.png");

      cy.get('button:contains("Upload")').click();
      cy.contains("Logo updated").should("be.visible");
    });

    it("should preview document template", () => {
      cy.visit("/app/settings/document-templates");

      cy.get('[data-testid="template"]').first().click();

      cy.get('button:contains("Preview")').click();

      cy.contains("Preview").should("be.visible");
    });
  });

  describe("Integration Settings", () => {
    it("should configure API integrations", () => {
      cy.visit("/app/settings/integrations");

      cy.get('button:contains("New Integration")').click();

      cy.get('select[name="Service"]').select("FTA API");

      cy.get('input[placeholder*="API Key"]').type("api-key-123");

      cy.get('button:contains("Configure")').click();
      cy.contains("Integration configured").should("be.visible");
    });

    it("should test integration connection", () => {
      cy.visit("/app/settings/integrations");

      cy.get('[data-testid="integration-row"]').first().click();

      cy.get('button:contains("Test Connection")').click();

      cy.contains("Connection successful").should("be.visible");
    });

    it("should disable integration", () => {
      cy.visit("/app/settings/integrations");

      cy.get('[data-testid="integration-row"]').first().click();

      cy.get('checkbox[name="is-active"]').uncheck();

      cy.get('button:contains("Save")').click();
      cy.contains("Integration disabled").should("be.visible");
    });
  });

  describe("Backup & Recovery", () => {
    it("should configure automatic backups", () => {
      cy.visit("/app/settings/backup");

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Frequency"]').select("DAILY");
      cy.get('input[placeholder*="Time"]').type("23:00");

      cy.get('button:contains("Save")').click();
      cy.contains("Backup configured").should("be.visible");
    });

    it("should view backup list", () => {
      cy.visit("/app/settings/backup");

      cy.get('button:contains("View Backups")').click();

      cy.get('[data-testid="backup-row"]').should("have.length.greaterThan", 0);
    });

    it("should restore from backup", () => {
      cy.visit("/app/settings/backup");

      cy.get('[data-testid="backup-row"]').first().click();

      cy.get('button:contains("Restore")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Restore started").should("be.visible");
    });
  });

  describe("License & Subscription", () => {
    it("should view license information", () => {
      cy.visit("/app/settings/license");

      cy.contains("License Status").should("be.visible");
      cy.contains("Valid Until").should("be.visible");
    });

    it("should upgrade subscription", () => {
      cy.visit("/app/settings/license");

      cy.get('button:contains("Upgrade")').click();

      cy.get('select[name="Plan"]').select("Premium");

      cy.get('button:contains("Upgrade")').click();
      cy.contains("Upgrade initiated").should("be.visible");
    });
  });
});
