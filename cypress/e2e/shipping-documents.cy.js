/**
 * Shipping Documents E2E Tests
 *
 * Tests shipping document workflows:
 * - Bill of Lading (BOL) generation
 * - Air Waybill (AWB) creation
 * - Packing lists and shipping marks
 * - Commercial invoice for shipping
 * - Document collection and delivery
 *
 * Run: npm run test:e2e -- --spec '**/shipping-documents.cy.js'
 */

describe("Shipping Documents - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Bill of Lading", () => {
    it("should generate Bill of Lading", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Generate BOL")').click();

      cy.contains("BOL Number").should("be.visible");
      cy.get('button:contains("Create")').click();
      cy.contains("BOL generated").should("be.visible");
    });

    it("should populate BOL with shipment details", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("View BOL")').click();

      cy.contains("Shipper").should("be.visible");
      cy.contains("Consignee").should("be.visible");
      cy.contains("Notify Party").should("be.visible");
      cy.contains("Vessel").should("be.visible");
      cy.contains("Port of Loading").should("be.visible");
    });

    it("should print BOL", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("BOL")').click();
      cy.get('button:contains("Print")').click();

      cy.readFile("cypress/downloads/bol-*.pdf").should("exist");
    });

    it("should issue negotiable BOL", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("BOL Type")').click();

      cy.get('checkbox[name="negotiable"]').check();

      cy.get('button:contains("Save")').click();
      cy.contains("Negotiable BOL").should("be.visible");
    });
  });

  describe("Air Waybill", () => {
    it("should generate Air Waybill for air shipments", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"][data-mode="AIR"]').first().click();

      cy.get('button:contains("Generate AWB")').click();

      cy.contains("AWB Number").should("be.visible");
      cy.get('button:contains("Create")').click();
      cy.contains("AWB generated").should("be.visible");
    });

    it("should track AWB status", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"][data-mode="AIR"]').first().click();

      cy.get('button:contains("AWB Details")').click();

      cy.contains("Origin Airport").should("be.visible");
      cy.contains("Destination Airport").should("be.visible");
    });

    it("should download AWB", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"][data-mode="AIR"]').first().click();

      cy.get('button:contains("Download AWB")').click();

      cy.readFile("cypress/downloads/awb-*.pdf").should("exist");
    });
  });

  describe("Packing Lists & Marks", () => {
    it("should generate packing list", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Packing List")').click();

      cy.contains("Packing List").should("be.visible");
      cy.get('[data-testid="line-row"]').should("have.length.greaterThan", 0);
    });

    it("should define shipping marks", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Shipping Marks")').click();

      cy.get('textarea[placeholder*="Marks"]').type("FRAGILE\nHANDLE WITH CARE");

      cy.get('button:contains("Save")').click();
      cy.contains("Marks updated").should("be.visible");
    });

    it("should print packing list", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Packing List")').click();
      cy.get('button:contains("Print")').click();

      cy.readFile("cypress/downloads/packing-list-*.pdf").should("exist");
    });
  });

  describe("Commercial Invoice", () => {
    it("should generate commercial invoice for export", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Commercial Invoice")').click();

      cy.contains("Invoice Number").should("be.visible");
      cy.get('button:contains("Create")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should populate invoice with HS codes", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Commercial Invoice")').click();

      cy.get('[data-testid="line-row"]').each(($line) => {
        cy.wrap($line).find('input[placeholder*="HS Code"]').should("be.visible");
      });
    });

    it("should calculate duty and taxes", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Commercial Invoice")').click();

      cy.contains("CIF Value").should("be.visible");
      cy.contains("Total Value").should("be.visible");
    });

    it("should print commercial invoice", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Commercial Invoice")').click();
      cy.get('button:contains("Print")').click();

      cy.readFile("cypress/downloads/invoice-*.pdf").should("exist");
    });
  });

  describe("Document Collection", () => {
    it("should collect all shipping documents", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Document Collection")').click();

      cy.contains("BOL").should("be.visible");
      cy.contains("Packing List").should("be.visible");
      cy.contains("Commercial Invoice").should("be.visible");
    });

    it("should verify document completeness", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Verify Documents")').click();

      cy.contains("All required documents present").should("be.visible");
    });

    it("should transmit documents to buyer", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Document Collection")').click();
      cy.get('button:contains("Send to Buyer")').click();

      cy.get('input[placeholder*="Email"]').type("buyer@example.com");
      cy.get('button:contains("Send")').click();

      cy.contains("Documents sent").should("be.visible");
    });
  });

  describe("Document Tracking & Archive", () => {
    it("should track document status", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Document Status")').click();

      cy.get('[data-testid="document-row"]').should("have.length.greaterThan", 0);
      cy.contains("Status").should("be.visible");
    });

    it("should archive shipping documents", () => {
      cy.visit("/export-shipping");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Archive")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Documents archived").should("be.visible");
    });

    it("should retrieve archived documents", () => {
      cy.visit("/export-shipping");

      cy.get('button:contains("Archived Documents")').click();

      cy.get('[data-testid="shipment-row"]').should("have.length.greaterThan", 0);
    });
  });
});
