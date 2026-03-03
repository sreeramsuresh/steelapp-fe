/**
 * Material Certificates E2E Tests
 *
 * Tests material certificate management:
 * - Certificate creation and upload
 * - Batch-to-certificate linkage
 * - Certificate verification
 * - Compliance tracking
 * - Certificate archival
 *
 * Run: npm run test:e2e -- --spec '**/material-certificates.cy.js'
 */

describe("Material Certificates - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Certificate Upload", () => {
    it("should upload material certificate", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Upload Certificate")').click();

      cy.get('input[type="file"]').selectFile("cypress/fixtures/cert-coa.pdf");

      cy.get('button:contains("Upload")').click();
      cy.contains("Certificate uploaded").should("be.visible");
    });

    it("should link certificate to batch", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();

      cy.get('[data-testid="certificate-row"]').should("have.length.greaterThan", 0);
    });

    it("should extract certificate metadata", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();
      cy.get('[data-testid="certificate-row"]').first().click();

      cy.contains("Manufacturer").should("be.visible");
      cy.contains("Test Date").should("be.visible");
      cy.contains("Certificate Number").should("be.visible");
    });
  });

  describe("Certificate Types", () => {
    it("should handle Certificate of Analysis (COA)", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Upload Certificate")').click();

      cy.get('select[name="Certificate Type"]').select("COA");

      cy.get('input[type="file"]').selectFile("cypress/fixtures/coa.pdf");
      cy.get('button:contains("Upload")').click();

      cy.contains("COA uploaded").should("be.visible");
    });

    it("should handle Mill Test Reports", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Upload Certificate")').click();

      cy.get('select[name="Certificate Type"]').select("MTR");

      cy.get('input[type="file"]').selectFile("cypress/fixtures/mtr.pdf");
      cy.get('button:contains("Upload")').click();

      cy.contains("MTR uploaded").should("be.visible");
    });

    it("should handle Quality Certifications", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Upload Certificate")').click();

      cy.get('select[name="Certificate Type"]').select("QUALITY");

      cy.get('input[type="file"]').selectFile("cypress/fixtures/quality-cert.pdf");
      cy.get('button:contains("Upload")').click();

      cy.contains("Quality certificate uploaded").should("be.visible");
    });
  });

  describe("Certificate Verification", () => {
    it("should verify certificate authenticity", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();
      cy.get('[data-testid="certificate-row"]').first().click();

      cy.get('button:contains("Verify")').click();

      cy.contains("Verification status").should("be.visible");
    });

    it("should flag expired certificates", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();

      cy.get('[data-testid="certificate-row"][data-expired="true"]').should("exist");
      cy.contains("Expired").should("be.visible");
    });

    it("should require re-certification", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();
      cy.get('[data-testid="certificate-row"][data-expired="true"]').first().click();

      cy.get('button:contains("Request Re-certification")').click();

      cy.get('button:contains("Submit")').click();
      cy.contains("Re-certification requested").should("be.visible");
    });
  });

  describe("Compliance Tracking", () => {
    it("should track compliance requirements", () => {
      cy.visit("/settings/compliance");

      cy.get('button:contains("Certificate Requirements")').click();

      cy.get('[data-testid="requirement-row"]').should("have.length.greaterThan", 0);
    });

    it("should enforce certificate requirements", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.contains("Certificate required").should("be.visible");
    });

    it("should verify compliance on delivery", () => {
      cy.visit("/delivery-notes");
      cy.get('[data-testid="note-row"]').first().click();

      cy.get('button:contains("Verify Compliance")').click();

      cy.contains("All certificates present").should("be.visible");
    });
  });

  describe("Certificate Archival", () => {
    it("should archive certificate", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();
      cy.get('[data-testid="certificate-row"]').first().click();

      cy.get('button:contains("Archive")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Certificate archived").should("be.visible");
    });

    it("should retrieve archived certificate", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Certificates")').click();
      cy.get('button:contains("Show Archived")').click();

      cy.get('[data-testid="certificate-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Certificate Reporting", () => {
    it("should generate compliance report", () => {
      cy.visit("/reports/compliance");

      cy.get('button:contains("Certificate Report")').click();

      cy.get('[data-testid="batch-row"]').should("have.length.greaterThan", 0);
      cy.contains("Certificate Status").should("be.visible");
    });

    it("should export certificates", () => {
      cy.visit("/stock-batches");

      cy.get('button:contains("Export Certificates")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/certificates-*.csv").should("exist");
    });
  });
});
