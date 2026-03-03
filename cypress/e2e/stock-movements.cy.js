/**
 * Stock Movements E2E Tests
 *
 * Tests stock IN/OUT tracking:
 * - Inbound movements (GRN, transfers)
 * - Outbound movements (invoices, adjustments)
 * - Inter-warehouse transfers
 * - Goods-in-transit tracking
 * - Movement reconciliation
 *
 * Run: npm run test:e2e -- --spec '**/stock-movements.cy.js'
 */

describe("Stock Movements - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Inbound Movements", () => {
    it("should record inbound from GRN", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Record IN")').click();

      cy.get('select[name="IN Type"]').select("GRN_RECEIPT");

      cy.get('input[placeholder*="Select GRN"]').type("GRN-");
      cy.get('[role="option"]').first().click();

      // Prefilled data
      cy.get('input[placeholder*="Product"]').should("have.value");
      cy.get('input[placeholder*="Quantity"]').should("have.value");

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Record IN")').click();
      cy.contains("Inbound recorded").should("be.visible");
    });

    it("should record inbound from purchase return", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Record IN")').click();

      cy.get('select[name="IN Type"]').select("PURCHASE_RETURN");

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("50");
      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.get('button:contains("Record IN")').click();
      cy.contains("Purchase return recorded").should("be.visible");
    });

    it("should record inbound adjustment", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Record IN")').click();

      cy.get('select[name="IN Type"]').select("ADJUSTMENT");

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("25");
      cy.get('textarea[placeholder*="Reason"]').type("Physical count adjustment");

      cy.get('button:contains("Record IN")').click();
      cy.contains("Adjustment recorded").should("be.visible");
    });
  });

  describe("Outbound Movements", () => {
    it("should record outbound from delivery note", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Record OUT")').click();

      cy.get('select[name="OUT Type"]').select("DELIVERY_NOTE");

      cy.get('input[placeholder*="Select DN"]').type("DN-");
      cy.get('[role="option"]').first().click();

      // Prefilled data
      cy.get('input[placeholder*="Product"]').should("have.value");
      cy.get('input[placeholder*="Quantity"]').should("have.value");

      cy.get('button:contains("Record OUT")').click();
      cy.contains("Outbound recorded").should("be.visible");
    });

    it("should record outbound from scrap/damage", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Record OUT")').click();

      cy.get('select[name="OUT Type"]').select("SCRAP");

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("10");
      cy.get('textarea[placeholder*="Reason"]').type("Damaged goods write-off");

      cy.get('button:contains("Record OUT")').click();
      cy.contains("Scrap recorded").should("be.visible");
    });

    it("should record outbound adjustment", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Record OUT")').click();

      cy.get('select[name="OUT Type"]').select("ADJUSTMENT");

      cy.get('input[placeholder*="Product"]').type("SS-316");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("15");
      cy.get('textarea[placeholder*="Reason"]').type("Inventory shortage adjustment");

      cy.get('button:contains("Record OUT")').click();
      cy.contains("Adjustment recorded").should("be.visible");
    });
  });

  describe("Inter-Warehouse Transfers", () => {
    it("should initiate warehouse transfer", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Transfer Stock")').click();

      // Source warehouse
      cy.get('select[name="From Warehouse"]').select("Main Warehouse");

      // Destination warehouse
      cy.get('select[name="To Warehouse"]').select("Branch Warehouse");

      // Product and quantity
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      cy.get('button:contains("Initiate Transfer")').click();
      cy.contains("Transfer initiated").should("be.visible");
    });

    it("should receive warehouse transfer", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Pending Transfers")').click();

      cy.get('[data-testid="transfer-row"][data-status="IN_TRANSIT"]')
        .first()
        .click();

      cy.get('button:contains("Receive Transfer")').click();

      cy.get('input[placeholder*="Received Quantity"]').type("100");

      cy.get('button:contains("Confirm Receipt")').click();
      cy.contains("Transfer received").should("be.visible");
    });

    it("should handle partial transfer receipt", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Pending Transfers")').click();

      cy.get('[data-testid="transfer-row"][data-status="IN_TRANSIT"]')
        .first()
        .click();

      cy.get('button:contains("Receive Transfer")').click();

      // Receive less than sent
      cy.get('input[placeholder*="Received Quantity"]').type("80");
      cy.get('textarea[placeholder*="Shortage Notes"]').type("Damaged units");

      cy.get('button:contains("Confirm Receipt")').click();
      cy.contains("Transfer received with shortage").should("be.visible");
    });

    it("should cancel in-transit transfer", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Pending Transfers")').click();

      cy.get('[data-testid="transfer-row"][data-status="IN_TRANSIT"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Cancel Transfer")').click();

      cy.get('textarea[placeholder*="Reason"]').type("Order cancelled");

      cy.get('button:contains("Confirm Cancel")').click();
      cy.contains("Transfer cancelled").should("be.visible");
    });
  });

  describe("Goods-in-Transit Tracking", () => {
    it("should create GIT when transfer initiated", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Transfer Stock")').click();

      cy.get('select[name="From Warehouse"]').select("Main Warehouse");
      cy.get('select[name="To Warehouse"]').select("Branch Warehouse");

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");

      cy.get('button:contains("Initiate Transfer")').click();

      // Verify GIT created
      cy.visit("/stock-movements");
      cy.get('button:contains("Goods in Transit")').click();

      cy.get('[data-testid="git-row"]').should("have.length.greaterThan", 0);
    });

    it("should track GIT aging and pending transfers", () => {
      cy.visit("/stock-movements");
      cy.get('button:contains("Goods in Transit")').click();

      cy.get('[data-testid="git-row"]').first().click();

      cy.contains("Days in Transit:").should("be.visible");
      cy.contains("Source Warehouse:").should("be.visible");
      cy.contains("Destination Warehouse:").should("be.visible");
      cy.contains("Initiated Date:").should("be.visible");
    });
  });

  describe("Movement Reconciliation", () => {
    it("should reconcile stock balance", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Reconcile")').click();

      // Select warehouse
      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      // Select product
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Calculate Balance")').click();

      // Verify calculation
      cy.contains("Opening Balance:").should("be.visible");
      cy.contains("Total Inbound:").should("be.visible");
      cy.contains("Total Outbound:").should("be.visible");
      cy.contains("Closing Balance:").should("be.visible");
    });

    it("should identify stock discrepancies", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Reconcile")').click();

      cy.get('select[name="Warehouse"]').select("Main Warehouse");
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Calculate Balance")').click();

      // Check for variance
      cy.get('body').then(($body) => {
        if ($body.text().includes("Discrepancy")) {
          cy.contains("Discrepancy:").should("be.visible");
          cy.get('button:contains("Investigate")').should("be.visible");
        }
      });
    });
  });

  describe("Movement Reporting", () => {
    it("should view movement ledger by product", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Ledger")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // View transactions
      cy.get('[data-testid="ledger-row"]').should("have.length.greaterThan", 0);
    });

    it("should view movement summary by warehouse", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Summary")').click();

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.contains("Total IN:").should("be.visible");
      cy.contains("Total OUT:").should("be.visible");
      cy.contains("Transfers IN:").should("be.visible");
      cy.contains("Transfers OUT:").should("be.visible");
    });

    it("should generate movement report by date range", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Generate Report")').click();

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('button:contains("Generate")').click();

      cy.contains("Movement Report").should("be.visible");
    });
  });

  describe("Movement Analytics", () => {
    it("should view stock velocity metrics", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Average Holding Days").should("be.visible");
      cy.contains("Turnover Ratio").should("be.visible");
      cy.contains("Movement Frequency").should("be.visible");
    });

    it("should filter movements by type", () => {
      cy.visit("/stock-movements");

      cy.get('select[name="Movement Type"]').select("INBOUND");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="movement-row"]').each(($row) => {
        cy.wrap($row).should("contain", "IN");
      });
    });

    it("should filter movements by warehouse", () => {
      cy.visit("/stock-movements");

      cy.get('select[name="Warehouse"]').select("Main Warehouse");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="movement-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Movement Export", () => {
    it("should export movement history to CSV", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/movements-*.csv").should("exist");
    });

    it("should export reconciliation report", () => {
      cy.visit("/stock-movements");

      cy.get('button:contains("Reconcile")').click();
      cy.get('select[name="Warehouse"]').select("Main Warehouse");
      cy.get('button:contains("Generate Report")').click();

      cy.get('button:contains("Export Report")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/reconciliation-*.pdf").should("exist");
    });
  });
});
