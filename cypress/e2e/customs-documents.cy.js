/**
 * Customs Documents E2E Tests
 *
 * Tests customs documentation workflows:
 * - Import/export customs document creation
 * - Bill of Entry (BOE) for imports
 * - Certificate of Origin (COO)
 * - Packing lists and manifests
 * - Customs clearance and compliance
 *
 * Run: npm run test:e2e -- --spec "**/customs-documents.cy.js"
 */

describe("Customs Documents - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Bill of Entry (BOE)", () => {
    it("should create Bill of Entry for import", () => {
      cy.visit("/customs-documents");
      cy.get('button:contains("New BOE")').click();

      cy.get('input[placeholder*="BOE Number"]').type("BOE-001");
      cy.get('input[placeholder*="Import Order"]').type("IO-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create BOE")').click();
      cy.contains("BOE created").should("be.visible");
    });

    it("should populate BOE from import order", () => {
      cy.visit("/customs-documents");
      cy.get('button:contains("New BOE")').click();

      cy.get('input[placeholder*="Import Order"]').type("IO-001");
      cy.get('[role="option"]').first().click();

      cy.contains("Items populated").should("be.visible");
      cy.get('[data-testid="item-row"]').should("have.length.greaterThan", 0);
    });

    it("should add HS codes to BOE items", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="boe-row"]').first().click();

      cy.get('[data-testid="item-row"]').first().click();

      cy.get('input[placeholder*="HS Code"]').type("7208.36.00");

      cy.get('button:contains("Save")').click();
      cy.contains("HS code saved").should("be.visible");
    });

    it("should calculate duty and taxes on BOE", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="boe-row"]').first().click();

      cy.contains("CIF Value").should("be.visible");
      cy.contains("Basic Customs Duty").should("be.visible");
      cy.contains("VAT").should("be.visible");
      cy.contains("Total Duty").should("be.visible");
    });

    it("should submit BOE for clearance", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="boe-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Submit for Clearance")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("BOE submitted").should("be.visible");
    });
  });

  describe("Certificate of Origin (COO)", () => {
    it("should create Certificate of Origin for export", () => {
      cy.visit("/customs-documents");
      cy.get('button:contains("New COO")').click();

      cy.get('input[placeholder*="Export Order"]').type("EO-");
      cy.get('[role="option"]').first().click();

      cy.get('select[name="Country of Origin"]').select("United Arab Emirates");

      cy.get('button:contains("Create COO")').click();
      cy.contains("COO created").should("be.visible");
    });

    it("should certify product origin", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="coo-row"]').first().click();

      cy.get('[data-testid="item-row"]').each(($item) => {
        cy.wrap($item).find('checkbox').check();
      });

      cy.get('button:contains("Certify Products")').click();
      cy.contains("Products certified").should("be.visible");
    });

    it("should add authorized signatory", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="coo-row"]').first().click();

      cy.get('button:contains("Add Signatory")').click();

      cy.get('select[name="Signatory"]').select("Chamber of Commerce");

      cy.get('button:contains("Add")').click();
      cy.contains("Signatory added").should("be.visible");
    });

    it("should generate COO document", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="coo-row"]').first().click();

      cy.get('button:contains("Generate Document")').click();

      cy.readFile("cypress/downloads/coo-*.pdf").should("exist");
    });
  });

  describe("Packing Lists & Manifests", () => {
    it("should create packing list", () => {
      cy.visit("/customs-documents");
      cy.get('button:contains("New Packing List")').click();

      cy.get('input[placeholder*="Order"]').type("IO-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create")').click();
      cy.contains("Packing list created").should("be.visible");
    });

    it("should detail packing list items", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="packing-list-row"]').first().click();

      cy.contains("Item").should("be.visible");
      cy.contains("Description").should("be.visible");
      cy.contains("Quantity").should("be.visible");
      cy.contains("Weight").should("be.visible");
    });

    it("should create shipping manifest", () => {
      cy.visit("/customs-documents");
      cy.get('button:contains("New Manifest")').click();

      cy.get('input[placeholder*="Shipment"]').type("SHIP-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create")').click();
      cy.contains("Manifest created").should("be.visible");
    });

    it("should validate manifest against container", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="manifest-row"]').first().click();

      cy.get('button:contains("Validate Against Container")').click();

      cy.contains("Validation complete").should("be.visible");
    });
  });

  describe("Import Clearance Workflow", () => {
    it("should submit all required documents for clearance", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('button:contains("Submit for Clearance")').click();

      // Check BOE
      cy.get('checkbox[name="boe"]').check();
      // Check COO
      cy.get('checkbox[name="coo"]').check();
      // Check Packing List
      cy.get('checkbox[name="packing-list"]').check();

      cy.get('button:contains("Submit")').click();
      cy.contains("Clearance submitted").should("be.visible");
    });

    it("should check customs clearance status", () => {
      cy.visit("/customs-documents");

      cy.get('button:contains("Clearance Status")').click();

      cy.get('[data-testid="clearance-row"]').should("have.length.greaterThan", 0);
      cy.contains("Status").should("be.visible");
    });

    it("should handle customs holds", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="clearance-row"][data-status="ON_HOLD"]').first().click();

      cy.contains("Hold Reason").should("be.visible");
      cy.get('button:contains("Resolve")').should("be.visible");
    });

    it("should obtain clearance approval", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="clearance-row"][data-status="APPROVED"]').first().click();

      cy.contains("Cleared by Customs").should("be.visible");
      cy.contains("Clearance Reference").should("be.visible");
    });
  });

  describe("Export Compliance Documents", () => {
    it("should create export shipping instructions", () => {
      cy.visit("/customs-documents");
      cy.get('button:contains("New Export Instructions")').click();

      cy.get('input[placeholder*="Export Order"]').type("EO-");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Create")').click();
      cy.contains("Export instructions created").should("be.visible");
    });

    it("should declare export value", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="export-doc-row"]').first().click();

      cy.contains("Export Value").should("be.visible");
      cy.contains("Declared Amount").should("be.visible");
    });

    it("should generate export invoice", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="export-doc-row"]').first().click();

      cy.get('button:contains("Generate Invoice")').click();

      cy.readFile("cypress/downloads/export-invoice-*.pdf").should("exist");
    });
  });

  describe("Document Compliance & Audit", () => {
    it("should validate document completeness", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="clearance-row"]').first().click();

      cy.get('button:contains("Validate Docs")').click();

      cy.contains("All required documents present").should("be.visible");
    });

    it("should track document versions", () => {
      cy.visit("/customs-documents");
      cy.get('[data-testid="doc-row"]').first().click();

      cy.get('button:contains("Version History")').click();

      cy.get('[data-testid="version-row"]').should("have.length.greaterThan", 0);
    });

    it("should generate customs compliance report", () => {
      cy.visit("/reports/customs-compliance");

      cy.contains("Customs Compliance Report").should("be.visible");
      cy.get('[data-testid="compliance-row"]').should("have.length.greaterThan", 0);
    });

    it("should export customs audit trail", () => {
      cy.visit("/customs-documents");

      cy.get('button:contains("Audit Trail")').click();
      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("EXCEL");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/customs-audit-*.xlsx").should("exist");
    });
  });
});
