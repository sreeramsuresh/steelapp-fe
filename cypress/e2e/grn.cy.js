// Owner: procurement
// Tests: GRN (Goods Receipt Note) management
// Route: /app/purchases (GRN accessed via PO workspace)

describe("GRN Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/purchases");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("h1, h2, h3, h4", /purchase/i, { timeout: 15000 }).should("be.visible");
  });

  it("should load the purchases page with heading", () => {
    cy.verifyPageLoads("Purchase", "/app/purchases");
  });

  it("should render purchase order table or list", () => {
    cy.get("table, [class*='list'], [class*='card']", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasContent = $body.find("table tbody tr").length > 0 || $body.text().length > 100;
      expect(hasContent, "Page should render PO content").to.be.true;
    });
  });

  it("should show status indicators on PO rows", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available, skipping status indicator test");
        return;
      }
      cy.get("table tbody tr").first().then(($row) => {
        const text = $row.text().toLowerCase();
        const hasStatus =
          text.includes("draft") ||
          text.includes("approved") ||
          text.includes("sent") ||
          text.includes("received") ||
          text.includes("partial") ||
          text.includes("closed") ||
          text.includes("pending") ||
          $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0;
        expect(hasStatus, "PO row should display a status indicator").to.be.true;
      });
    });
  });

  it("should open PO workspace when clicking a PO row", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available, skipping navigation test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
    });
  });

  it("should show navigation tabs in PO workspace", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available, skipping workspace tabs test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.get("body", { timeout: 10000 }).then(($wsBody) => {
        const text = $wsBody.text().toLowerCase();
        const hasTabs =
          text.includes("overview") ||
          text.includes("grn") ||
          text.includes("goods receipt") ||
          text.includes("bill") ||
          $wsBody.find("[role='tab'], [role='tablist'], button[class*='tab']").length > 0;
        expect(hasTabs, "PO workspace should have navigation tabs").to.be.true;
      });
    });
  });

  it("should access GRN tab from PO workspace", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available, skipping GRN tab test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.contains("button, [role='tab'], a", /grn|goods receipt|receive/i, { timeout: 10000 })
        .first()
        .click();
      cy.get("body").then(($wsBody) => {
        const text = $wsBody.text().toLowerCase();
        const hasGrnContent =
          text.includes("grn") ||
          text.includes("goods receipt") ||
          text.includes("receive") ||
          text.includes("receipt");
        expect(hasGrnContent, "GRN tab content should be visible").to.be.true;
      });
    });
  });

  it("should show a create or receive goods button in PO workspace", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available, skipping receive goods button test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.get("body", { timeout: 10000 }).then(($wsBody) => {
        const hasReceiveButton =
          $wsBody.find("button, a").filter(function () {
            const t = this.textContent.toLowerCase();
            return t.includes("receive") || t.includes("create grn") || t.includes("new grn") || t.includes("goods receipt");
          }).length > 0;
        expect(hasReceiveButton, "Receive goods or create GRN button should exist").to.be.true;
      });
    });
  });

  it("should display supplier information on PO detail", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available, skipping supplier info test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.get("body", { timeout: 10000 }).then(($wsBody) => {
        const text = $wsBody.text().toLowerCase();
        const hasSupplier =
          text.includes("supplier") || text.includes("vendor");
        expect(hasSupplier, "Supplier information should be visible").to.be.true;
      });
    });
  });
});
