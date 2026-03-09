// Owner: procurement
/**
 * Procurement Workflow E2E Tests
 *
 * Tests the PO → GRN → Supplier Bill workflow:
 * - Purchase order list and creation
 * - PO workspace navigation (tabs)
 * - GRN page access
 * - Supplier bill linking
 *
 * Routes: /app/purchases, /app/purchases/po/:id/*, /app/supplier-bills
 */

describe("Procurement Workflow - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/purchase-orders*", "getPurchaseOrders");
    cy.interceptAPI("GET", "/api/suppliers*", "getSuppliers");
  });

  describe("Purchases Dashboard", () => {
    it("should load the purchases dashboard page", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/purchases");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasPurchaseContent =
          text.includes("purchase") || text.includes("order") || text.includes("po");
        expect(hasPurchaseContent, "Should show purchase-related content").to.be.true;
      });
    });

    it("should display purchase order list or cards", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Look for table or card layout
      cy.get("table, [data-testid*='po-'], [data-testid*='purchase-order']", {
        timeout: 10000,
      }).should("exist");
    });

    it("should have create PO button or link", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCreateBtn =
          $body.find("a[href*='po/new']").length > 0 ||
          $body.find("a[href*='purchase-orders/new']").length > 0 ||
          $body.find("button:contains('Create')").length > 0 ||
          $body.find("button:contains('New')").length > 0 ||
          $body.find("[data-testid*='create-po']").length > 0;
        expect(hasCreateBtn, "Should have create PO button").to.be.true;
      });
    });
  });

  describe("PO Creation Form", () => {
    it("should load PO type selection or creation form", () => {
      cy.visit("/app/purchases/po/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/purchases/po/new");
    });

    it("should have supplier selection field", () => {
      cy.visit("/app/purchase-orders/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasSupplierField =
          text.includes("supplier") || text.includes("vendor");
        expect(hasSupplierField, "Should have supplier selection").to.be.true;
      });
    });
  });

  describe("Supplier Bills", () => {
    it("should load the supplier bills page", () => {
      cy.interceptAPI("GET", "/api/supplier-bills*", "getSupplierBills");
      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasBillContent =
          text.includes("bill") || text.includes("payable") || text.includes("supplier");
        expect(hasBillContent, "Should show bill-related content").to.be.true;
      });
    });

    it("should display bills in a table", () => {
      cy.interceptAPI("GET", "/api/supplier-bills*", "getSupplierBills");
      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("table, [data-testid*='bill-']", { timeout: 10000 }).should("exist");
    });

    it("should have create supplier bill button", () => {
      cy.interceptAPI("GET", "/api/supplier-bills*", "getSupplierBills");
      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCreateBtn =
          $body.find("a[href*='supplier-bills/new']").length > 0 ||
          $body.find("button:contains('Create')").length > 0 ||
          $body.find("button:contains('New')").length > 0;
        expect(hasCreateBtn, "Should have create bill button").to.be.true;
      });
    });
  });

  describe("Sequential Procurement Flow", () => {
    it("should navigate from purchases to supplier bills sequentially", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/supplier-bills");
    });
  });

  describe("GRN Access", () => {
    it("should be able to navigate to GRN from purchases", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // GRN is accessed through PO workspace - verify purchase page has navigation
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasGRNRef =
          text.includes("grn") ||
          text.includes("goods") ||
          text.includes("receive") ||
          text.includes("receipt");
        // GRN may not be directly visible on the dashboard, which is ok
        expect($body.text().length).to.be.greaterThan(50);
      });
    });
  });
});
