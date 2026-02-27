/**
 * Delivery Notes E2E Tests
 *
 * Tests delivery note lifecycle:
 * - Create from invoice
 * - Create standalone
 * - Mark as delivered
 * - Quantity adjustments
 * - Recipient signature
 *
 */

describe("Delivery Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Delivery Notes", () => {
    it("should create delivery note from invoice", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Generate Delivery Note")').click();

      // Verify prefilled data
      cy.contains(/DN-\d{6}/);
      cy.get('input[placeholder*="Customer"]').should(
        "have.value",
        "Test Customer",
      );

      // Verify line items
      cy.get('[data-testid="dn-line-item"]').should(
        "have.length.greaterThan",
        0,
      );

      cy.get('button:contains("Create Delivery Note")').click();
      cy.contains("Delivery note created").should("be.visible");
    });

    it("should create standalone delivery note", () => {
      cy.visit("/app/delivery-notes");
      cy.get('button:contains("Create Delivery Note")').click();

      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");

      cy.get('button:contains("Create Delivery Note")').click();
      cy.contains("Delivery note created").should("be.visible");
    });

    it("should create delivery note with multiple line items", () => {
      cy.visit("/app/delivery-notes");
      cy.get('button:contains("Create Delivery Note")').click();

      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      // Item 1
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').first().type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').first().type("100");

      // Item 2
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').eq(1).type("SS-316L-Coil");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').eq(1).type("50");

      cy.get('button:contains("Create Delivery Note")').click();
      cy.contains("Delivery note created").should("be.visible");
    });
  });

  describe("Delivery Note Adjustments", () => {
    it("should update quantity before marking delivered", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Quantity"]').first().clear().type("90");

      cy.get('button:contains("Save")').click();
      cy.contains("Delivery note updated").should("be.visible");
    });

    it("should add item to pending delivery note", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Edit")').click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-316-Tube");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("25");

      cy.get('button:contains("Save")').click();
      cy.contains("Item added").should("be.visible");
    });

    it("should remove item from delivery note", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Edit")').click();

      cy.get('button[aria-label="Remove Item"]').first().click();
      cy.get('button:contains("Confirm")').click();

      cy.get('button:contains("Save")').click();
      cy.contains("Item removed").should("be.visible");
    });
  });

  describe("Mark Delivery as Delivered", () => {
    it("should mark delivery note as delivered", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Mark as Delivered")').click();

      cy.get('input[placeholder*="Delivered By"]').type("John Doe");
      cy.get('input[placeholder*="Recipient Name"]').type("Jane Smith");
      cy.get('input[placeholder*="Delivery Date"]').type("2024-01-15");

      cy.get('button:contains("Confirm Delivery")').click();
      cy.contains("Delivery marked as delivered").should("be.visible");
    });

    it("should capture recipient signature", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Mark as Delivered")').click();

      cy.get('input[placeholder*="Recipient Name"]').type("Jane Smith");

      // Capture signature
      cy.get('canvas[data-testid="signature-pad"]').trigger("mousedown", {
        x: 10,
        y: 10,
      });
      cy.get('canvas[data-testid="signature-pad"]').trigger("mousemove", {
        x: 50,
        y: 50,
      });
      cy.get('canvas[data-testid="signature-pad"]').trigger("mouseup");

      cy.get('button:contains("Confirm Delivery")').click();
      cy.contains("Signature captured").should("be.visible");
    });

    it("should upload delivery proof document", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Mark as Delivered")').click();

      cy.get('input[placeholder*="Recipient Name"]').type("Jane Smith");

      // Upload proof
      cy.get('input[type="file"][data-testid="proof-upload"]').selectFile(
        "cypress/fixtures/delivery-proof.pdf",
      );

      cy.get('button:contains("Confirm Delivery")').click();
      cy.contains("Delivery marked as delivered").should("be.visible");
    });
  });

  describe("Partial Delivery Handling", () => {
    it("should record partial delivery", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Partial Delivery")').click();

      // Adjust quantities to delivered amount
      cy.get('input[placeholder*="Qty Delivered"]').first().clear().type("80");

      cy.get('input[placeholder*="Recipient Name"]').type("Jane Smith");
      cy.get('button:contains("Record Partial Delivery")').click();

      cy.contains("Partial delivery recorded").should("be.visible");
    });

    it("should create remainder delivery note for undelivered items", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Partial Delivery")').click();

      cy.get('input[placeholder*="Qty Delivered"]').first().clear().type("80");

      cy.get('input[placeholder*="Recipient Name"]').type("Jane Smith");
      cy.get('checkbox[name="create-remainder"]').click();

      cy.get('button:contains("Record Partial Delivery")').click();

      cy.contains("Partial delivery recorded").should("be.visible");
      cy.contains("Remainder delivery note created").should("be.visible");
    });
  });

  describe("Delivery Note Reconciliation", () => {
    it("should reconcile delivery note to invoice", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="DELIVERED"]')
        .first()
        .click();

      cy.get('button:contains("Reconcile with Invoice")').click();

      // Should show matching invoice
      cy.get('select[name="Invoice"]').should("have.value", /INV-/);

      cy.get('button:contains("Reconcile")').click();
      cy.contains("Delivery note reconciled").should("be.visible");
    });

    it("should handle quantity variance", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="DELIVERED"]')
        .first()
        .click();

      cy.get('button:contains("Reconcile with Invoice")').click();

      // Simulate variance
      cy.get('input[placeholder*="Invoice Qty"]').then(($input) => {
        const invoiceQty = $input.val();
        const dnQty = cy.get('input[placeholder*="DN Qty"]').then(($dnInput) => {
          expect(parseInt(dnQty)).not.to.equal(parseInt(invoiceQty));
        });
      });

      cy.get('button:contains("Reconcile")').click();
      cy.contains("Quantity variance noted").should("be.visible");
    });

    it("should handle damaged goods claim", () => {
      cy.visit("/app/delivery-notes");
      cy.get('[data-testid="dn-row"][data-status="DELIVERED"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Report Damage")').click();

      cy.get('input[placeholder*="Damaged Qty"]').type("10");
      cy.get('textarea[placeholder*="Damage Description"]').type(
        "Dent on corner",
      );

      cy.get('input[type="file"]').selectFile(
        "cypress/fixtures/damage-photo.jpg",
      );

      cy.get('button:contains("Report")').click();
      cy.contains("Damage claim created").should("be.visible");
    });
  });

  describe("Delivery Analytics", () => {
    it("should view on-time delivery rate", () => {
      cy.visit("/app/delivery-notes");

      cy.get('button:contains("Analytics")').click();

      cy.contains("On-Time Delivery Rate").should("be.visible");
      cy.get('[data-testid="on-time-stat"]').should("contain", /\d+\.\d+%/);
    });

    it("should view delivery by customer", () => {
      cy.visit("/app/delivery-notes");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Deliveries by Customer").should("be.visible");
      cy.get('[data-testid="customer-chart"]').should("be.visible");
    });
  });
});
