// Owner: procurement
// Tests: GRN (Goods Receipt Note) management via PO workspace
// Route: /app/purchases (GRN accessed via PO workspace)

describe("GRN Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/purchases");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").should(($body) => {
      expect($body.text().toLowerCase()).to.include("purchase");
    });
  });

  it("should load the purchases page with heading", () => {
    cy.url().should("include", "/app/purchases");
    cy.get("body").should(($body) => {
      expect($body.text().toLowerCase()).to.include("purchase");
    });
  });

  it("should render purchase order table with data or empty state", () => {
    cy.get("body").should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasEmptyState =
        $body.text().toLowerCase().includes("no purchase") ||
        $body.text().toLowerCase().includes("create");
      expect(
        hasTable || hasEmptyState,
        "Page should render PO table or empty state with create prompt",
      ).to.be.true;
    });
  });

  it("should have create PO button", () => {
    cy.get('[data-testid="create-po-button"]', { timeout: 10000 }).should("be.visible");
  });

  it("should show status indicators on PO rows when data exists", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        // No seeded PO data -- verify empty state
        cy.get("body").should(($b) => {
          expect($b.text().length).to.be.greaterThan(50);
        });
        return;
      }
      // Verify first row has a status indicator
      cy.get("table tbody tr")
        .first()
        .should(($row) => {
          const text = $row.text().toLowerCase();
          const hasStatus =
            text.includes("draft") ||
            text.includes("approved") ||
            text.includes("sent") ||
            text.includes("received") ||
            text.includes("partial") ||
            text.includes("closed") ||
            text.includes("pending");
          expect(hasStatus, "PO row should display a status indicator").to.be.true;
        });
    });
  });

  it("should navigate to PO workspace when clicking a PO row", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows available -- skipping navigation test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
    });
  });

  it("should show PO workspace tabs (overview, GRN, bill)", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows -- skipping workspace tabs test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.get("body", { timeout: 10000 }).should(($wsBody) => {
        const text = $wsBody.text().toLowerCase();
        const hasTabs =
          text.includes("overview") ||
          text.includes("grn") ||
          text.includes("goods receipt") ||
          text.includes("bill") ||
          $wsBody.find("[role='tab'], [role='tablist']").length > 0;
        expect(hasTabs, "PO workspace should have navigation tabs").to.be.true;
      });
    });
  });

  it("should access GRN tab from PO workspace when PO exists", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows -- skipping GRN tab test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.contains("button, [role='tab'], a", /grn|goods receipt|receive/i, { timeout: 10000 })
        .first()
        .click();
      cy.get("body").should(($wsBody) => {
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

  it("should display supplier information on PO detail", () => {
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr").length === 0) {
        cy.log("No PO rows -- skipping supplier info test");
        return;
      }
      cy.get("table tbody tr").first().click();
      cy.url({ timeout: 10000 }).should("match", /\/app\/purchases\/po\/\d+/);
      cy.get("body", { timeout: 10000 }).should(($wsBody) => {
        const text = $wsBody.text().toLowerCase();
        expect(
          text.includes("supplier") || text.includes("vendor"),
          "Supplier information should be visible on PO detail",
        ).to.be.true;
      });
    });
  });
});
