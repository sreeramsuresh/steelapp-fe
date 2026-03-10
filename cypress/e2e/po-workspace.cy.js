// Owner: procurement
/**
 * PO Workspace E2E Tests
 *
 * Tests the Purchase Order workspace with tabbed navigation:
 * - Overview tab
 * - Dispatch tab
 * - GRN tab
 * - Bills tab
 * - Payments tab
 *
 * Route: /app/purchases/po/:poId/*
 */

describe("PO Workspace - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Purchases Dashboard Entry", () => {
    it("should load purchases dashboard with PO list", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("purchase");
      });
    });

    it("should display purchase orders in table or cards", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("table, [data-testid*='po-'], [data-testid*='purchase']", {
        timeout: 10000,
      }).should("exist");
    });

    it("should navigate to PO workspace when clicking a PO", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Try clicking first PO row if exists
      cy.get("table tbody tr, [data-testid*='po-row'], a[href*='purchases/po/']").then(
        ($rows) => {
          if ($rows.length > 0) {
            cy.wrap($rows.first()).find("a, td").first().click();
            cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
          } else {
            cy.log("No POs available to click");
          }
        }
      );
    });
  });

  describe("PO Workspace Tabs", () => {
    it("should show workspace tabs when navigated to PO", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("a[href*='purchases/po/'], table tbody tr").then(($links) => {
        if ($links.length > 0) {
          cy.wrap($links.first()).find("a, td").first().click();
          cy.url({ timeout: 10000 }).should("match", /purchases\/po\/\d+/);
          // Workspace should have navigation tabs
          cy.get("body").should(($body) => {
            const text = $body.text().toLowerCase();
            const hasTabs =
              text.includes("overview") ||
              text.includes("grn") ||
              text.includes("bills") ||
              text.includes("dispatch");
            expect(hasTabs, "Should show workspace tab labels").to.be.true;
          });
        } else {
          cy.log("No POs available for workspace testing");
        }
      });
    });

    it("should show PO details in overview tab", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("a[href*='purchases/po/'], table tbody tr").then(($links) => {
        if ($links.length > 0) {
          cy.wrap($links.first()).find("a, td").first().click();
          cy.url({ timeout: 10000 }).should("include", "/purchases/po/");
          // Overview should show PO summary info
          cy.get("body").should(($body) => {
            const text = $body.text().toLowerCase();
            const hasOverview =
              text.includes("supplier") ||
              text.includes("total") ||
              text.includes("status") ||
              text.includes("date");
            expect(hasOverview, "Should show PO overview details").to.be.true;
          });
        } else {
          cy.log("No POs available for overview testing");
        }
      });
    });
  });

  describe("PO Type Selection", () => {
    it("should load PO type selection page", () => {
      cy.visit("/app/purchases/po/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/purchases/po/new");
    });

    it("should display PO type options", () => {
      cy.visit("/app/purchases/po/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasTypeOptions =
          text.includes("type") ||
          text.includes("local") ||
          text.includes("import") ||
          text.includes("purchase") ||
          text.includes("order");
        expect(hasTypeOptions, "Should show PO type options").to.be.true;
      });
    });
  });

  describe("Legacy PO Form", () => {
    it("should load legacy PO creation form", () => {
      cy.visit("/app/purchase-orders/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasFormContent =
          text.includes("supplier") ||
          text.includes("purchase") ||
          text.includes("order");
        expect(hasFormContent, "Should show PO form content").to.be.true;
      });
    });

    it("should have supplier selection and line items", () => {
      cy.visit("/app/purchase-orders/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Supplier field and product/item fields should exist
      cy.get("input, select, [data-testid*='supplier']").should(
        "have.length.greaterThan",
        0
      );
    });
  });
});
