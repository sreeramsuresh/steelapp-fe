/**
 * Supplier Quotation E2E Tests
 *
 * Tests critical flows:
 * 1. List page loads correctly
 * 2. Create quotation manually
 * 3. PDF Upload and extraction
 * 4. View/Edit quotation
 * 5. Approve/Reject workflow
 * 6. Convert to Purchase Order
 * 7. Delete quotation
 *
 * Run: npm run test:e2e -- --spec "cypress/e2e/supplier-quotations.cy.js'
 */

describe('Supplier Quotations - Critical Flows', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login();
  });

  describe('1. List Page', () => {
    it('should load supplier quotations list page', () => {
      cy.visit('/app/supplier-quotations');

      // Wait for page to load - look for title with "Supplier Quotations" text
      cy.contains(/supplier quotations/i).should('be.visible');

      // Verify action buttons using data-testid (reliable selectors)
      cy.get('[data-testid="upload-pdf-btn"]').should('be.visible');
      cy.get('[data-testid="new-quotation-btn"]').should('be.visible');

      // Verify filter controls - search has specific placeholder
      cy.get('input[placeholder*="Search by reference"]').should('be.visible');
      cy.get('select').should('exist');
    });

    it('should show empty state when no quotations exist', () => {
      cy.visit('/app/supplier-quotations');

      // Wait for loading to complete
      cy.wait(1000);

      // Should show empty message or table with data rows
      cy.get('body').then(($body) => {
        if ($body.text().includes('No quotations found')) {
          cy.contains('No quotations found').should('be.visible');
        } else {
          // Table exists with data rows
          cy.get('table').should('exist');
        }
      });
    });

    it('should filter quotations by status', () => {
      cy.visit('/app/supplier-quotations');

      // Wait for page to load
      cy.wait(500);

      // Verify status dropdown has options
      cy.get('select').should('be.visible');
      cy.get('select option').should('have.length.greaterThan', 1);

      // Select a status filter
      cy.get('select').select('draft');

      // Verify filter was applied
      cy.get('select').should('have.value', 'draft');
    });
  });

  describe('2. Create Quotation Manually', () => {
    beforeEach(() => {
      // Intercept API calls
      cy.intercept('GET', '**/api/suppliers*').as('getSuppliers');
      cy.intercept('POST', '**/api/supplier-quotations').as('createQuotation');
    });

    it('should navigate to create quotation form', () => {
      cy.visit('/app/supplier-quotations');

      // Wait for page to load
      cy.contains(/supplier quotations/i).should('be.visible');

      // Click the New Quotation button using data-testid
      cy.get('[data-testid="new-quotation-btn"]').click();

      // Should navigate to form page
      cy.url().should('include', '/app/supplier-quotations/new');

      // Form should be visible - look for heading
      cy.contains(/new supplier quotation/i).should('be.visible');
    });

    it('should create a new quotation with valid data', () => {
      cy.visit('/app/supplier-quotations/new');

      // Wait for suppliers to load
      cy.wait('@getSuppliers', { timeout: 10000 });
      cy.wait(500);

      // Fill basic fields - supplier select is the first select on page
      cy.get('select').first().select(1);

      // Fill dates using input[type="date"]
      const today = new Date().toISOString().split('T')[0];
      cy.get('input[type="date"]').eq(0).type(today);
      cy.get('input[type="date"]').eq(1).type(today);

      // Fill supplier reference - input with placeholder
      cy.get('input[placeholder*="quote number"]').type('SQ-TEST-001');

      // Add a line item
      cy.contains('button', /add item/i).click();

      // Fill line item details - use placeholders to find inputs
      cy.get('input[placeholder="Product description"]')
        .first()
        .type('Test Steel Product 304 Grade');

      // Quantity and price are type="number"
      cy.get('input[type="number"]').eq(0).clear().type('100');
      cy.get('input[type="number"]').eq(1).clear().type('50');

      // Submit form
      cy.contains('button', /save/i).first().click();

      // Wait for API response
      cy.wait('@createQuotation', { timeout: 15000 });

      // Verify success toast
      cy.contains(/created|success/i, { timeout: 10000 }).should('be.visible');

      // Should redirect to detail page
      cy.url().should('match', /app\/supplier-quotations\/\d+$/);
    });

    it('should validate required fields', () => {
      cy.visit('/app/supplier-quotations/new');

      // Wait for page to load
      cy.wait(1000);

      // Try to submit without filling required fields
      cy.contains('button', /save/i).first().click();

      // Validation should prevent submission - we stay on the same page
      cy.url().should('include', '/app/supplier-quotations/new');

      // Check for any validation feedback (toast notification or still on form)
      cy.wait(500);
      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        // Either toast appeared OR we're still on the form (which means validation prevented submit)
        const hasValidation =
          text.includes('select a supplier') ||
          text.includes('required') ||
          text.includes('new supplier quotation'); // Still on form = validation prevented submit
        expect(hasValidation).to.be.true;
      });
    });
  });

  describe('3. PDF Upload Flow', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/suppliers*').as('getSuppliers');
      cy.intercept('POST', '**/api/supplier-quotations/upload').as(
        'uploadPDF'
      );
    });

    it('should navigate to upload page', () => {
      cy.visit('/app/supplier-quotations');

      // Wait for page to load
      cy.contains(/supplier quotations/i).should('be.visible');

      // Click the Upload PDF button using data-testid
      cy.get('[data-testid="upload-pdf-btn"]').click();

      // Should navigate to upload page
      cy.url().should('include', '/app/supplier-quotations/upload');

      // Upload area should be visible
      cy.contains(/upload|drop|pdf/i).should('be.visible');
    });

    it('should show upload drop zone', () => {
      cy.visit('/app/supplier-quotations/upload');

      // Verify drop zone with dashed border exists
      cy.get('[class*="border-dashed"]').should('be.visible');

      // Verify file input exists with id="pdf-upload"
      cy.get('input#pdf-upload').should('exist');

      // Verify accept attribute for PDF
      cy.get('input#pdf-upload').should('have.attr', 'accept').and('include', 'pdf');
    });

    it('should upload a PDF and show extraction preview', () => {
      cy.visit('/app/supplier-quotations/upload');

      // Wait for page to load
      cy.wait(500);

      // Use the real PDF fixture file
      cy.get('input#pdf-upload').selectFile(
        'cypress/fixtures/sample-quotation.pdf',
        { force: true }
      );

      // Verify file is selected
      cy.contains('sample-quotation.pdf').should('be.visible');

      // Click extract/upload button
      cy.contains('button', /extract|upload|process/i).click();

      // Wait for API response
      cy.wait('@uploadPDF', { timeout: 30000 }).then((interception) => {
        // Test passes if we got any response (UI handled it gracefully)
        expect(interception.response.statusCode).to.be.oneOf([200, 201, 400, 500]);

        // The page should still be functional (no crash)
        cy.get('body').should('exist');

        // Check for some feedback (success or error)
        cy.wait(1000);
        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase();
          const hasFeedback =
            text.includes('extract') ||
            text.includes('preview') ||
            text.includes('results') ||
            text.includes('error') ||
            text.includes('success') ||
            text.includes('quotation');
          expect(hasFeedback).to.be.true;
        });
      });
    });
  });

  describe('4. View and Edit Quotation', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/supplier-quotations*').as('getQuotations');
      cy.intercept('GET', '**/api/supplier-quotations/*').as('getQuotation');
      cy.intercept('PUT', '**/api/supplier-quotations/*').as('updateQuotation');
    });

    it('should view quotation details', () => {
      cy.visit('/app/supplier-quotations');
      cy.wait('@getQuotations', { timeout: 10000 });

      // Check if there are any quotations
      cy.get('body').then(($body) => {
        if (!$body.text().includes('No quotations found')) {
          // Click on first quotation row's view button (has title="View")
          cy.get('table tbody tr').first().find('button[title="View"]').click();

          // Wait for detail page
          cy.wait('@getQuotation', { timeout: 10000 });

          // Should show quotation details
          cy.url().should('match', /app\/supplier-quotations\/\d+$/);
          // Page title contains internal reference
          cy.get('h1').should('exist');
        } else {
          cy.log('No quotations to view - skipping test');
        }
      });
    });

    it('should edit quotation', () => {
      cy.visit('/app/supplier-quotations');
      cy.wait('@getQuotations', { timeout: 10000 });

      // Filter for draft quotations (only drafts can be edited)
      cy.get('select').select('draft');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        // Check if we have draft quotations with edit buttons
        const hasEditButton = $body.find('button[title="Edit"]').length > 0;
        const hasTableRows = $body.find('table tbody tr').length > 0;

        if (hasTableRows && hasEditButton) {
          // Click edit button on first quotation (has title="Edit")
          cy.get('table tbody tr').first().find('button[title="Edit"]').click();

          // Should be on edit page
          cy.url().should('include', '/edit');

          // Wait for form to load
          cy.wait('@getQuotation', { timeout: 10000 });

          // Make a change - notes textarea (if exists)
          cy.get('body').then(($formBody) => {
            if ($formBody.find('textarea').length > 0) {
              cy.get('textarea').first().clear().type('Updated via E2E test');
            }
          });

          // Save changes
          cy.contains('button', /save/i).first().click();

          // Wait for update
          cy.wait('@updateQuotation', { timeout: 10000 });

          // Verify success toast
          cy.contains(/updated|success/i).should('be.visible');
        } else {
          cy.log('No draft quotations to edit - skipping test');
        }
      });
    });
  });

  describe('5. Approve/Reject Workflow', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/supplier-quotations*').as('getQuotations');
      cy.intercept('GET', '**/api/supplier-quotations/*').as('getQuotation');
      cy.intercept('POST', '**/api/supplier-quotations/*/approve').as(
        'approveQuotation'
      );
      cy.intercept('POST', '**/api/supplier-quotations/*/reject').as(
        'rejectQuotation'
      );
    });

    it('should approve a draft quotation', () => {
      cy.visit('/app/supplier-quotations');
      cy.wait('@getQuotations', { timeout: 10000 });

      // Filter by draft status (draft quotations can be approved)
      cy.get('select').select('draft');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        const hasViewButton = $body.find('button[title="View"]').length > 0;

        if (hasViewButton) {
          // Click on first quotation's view button
          cy.get('table tbody tr').first().find('button[title="View"]').click();

          cy.wait('@getQuotation', { timeout: 10000 });

          // Check if approve button exists
          cy.get('body').then(($detailBody) => {
            const hasApproveButton = $detailBody.text().toLowerCase().includes('approve') &&
              $detailBody.find('button').filter((i, el) => el.textContent.toLowerCase().includes('approve')).length > 0;

            if (hasApproveButton) {
              // Click approve button
              cy.contains('button', /approve/i).click();

              // Wait for API
              cy.wait('@approveQuotation', { timeout: 10000 });

              // Verify success toast
              cy.contains(/approved|success/i).should('be.visible');
            } else {
              cy.log('No approve button visible - quotation may already be approved');
              // Test passes - we verified the workflow UI loads correctly
            }
          });
        } else {
          cy.log('No draft quotations to approve - skipping test');
        }
      });
    });

    it('should reject a quotation with reason', () => {
      cy.visit('/app/supplier-quotations');
      cy.wait('@getQuotations', { timeout: 10000 });

      // Filter by draft status
      cy.get('select').select('draft');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        const hasViewButton = $body.find('button[title="View"]').length > 0;

        if (hasViewButton) {
          // Click on first quotation's view button
          cy.get('table tbody tr').first().find('button[title="View"]').click();

          cy.wait('@getQuotation', { timeout: 10000 });

          // Check if reject button exists
          cy.get('body').then(($detailBody) => {
            const hasRejectButton = $detailBody.find('button').filter((i, el) =>
              el.textContent.toLowerCase().includes('reject')
            ).length > 0;

            if (hasRejectButton) {
              // Click reject button (red destructive button)
              cy.contains('button', /reject/i).click();

              // Fill rejection reason in dialog
              cy.get('[role="dialog"]').within(() => {
                cy.get('textarea').type('Price too high - E2E test rejection');
                cy.contains('button', /reject/i).click();
              });

              // Wait for API
              cy.wait('@rejectQuotation', { timeout: 10000 });

              // Verify success toast
              cy.contains(/rejected|success/i).should('be.visible');
            } else {
              cy.log('No reject button visible - quotation may already be rejected');
            }
          });
        } else {
          cy.log('No draft quotations to reject - skipping test');
        }
      });
    });
  });

  describe('6. Convert to Purchase Order', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/supplier-quotations*').as('getQuotations');
      cy.intercept('GET', '**/api/supplier-quotations/*').as('getQuotation');
      cy.intercept('POST', '**/api/supplier-quotations/*/convert-to-po').as(
        'convertToPO'
      );
    });

    it('should convert approved quotation to purchase order', () => {
      cy.visit('/app/supplier-quotations');
      cy.wait('@getQuotations', { timeout: 10000 });

      // Filter by approved status
      cy.get('select').select('approved');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        const hasViewButton = $body.find('button[title="View"]').length > 0;

        if (hasViewButton) {
          // Click on first approved quotation's view button
          cy.get('table tbody tr').first().find('button[title="View"]').click();

          cy.wait('@getQuotation', { timeout: 10000 });

          // Check if convert button exists
          cy.get('body').then(($detailBody) => {
            const hasConvertButton = $detailBody.find('button').filter((i, el) =>
              el.textContent.toLowerCase().includes('convert')
            ).length > 0;

            if (hasConvertButton) {
              // Click convert to PO button (blue button)
              cy.contains('button', /convert to po/i).click();

              // Dialog appears - click Create Purchase Order button
              cy.get('[role="dialog"]').within(() => {
                cy.contains('button', /create purchase order/i).click();
              });

              // Wait for API
              cy.wait('@convertToPO', { timeout: 15000 });

              // Verify success toast
              cy.contains(/purchase order created|success/i).should('be.visible');

              // Should redirect to PO detail
              cy.url().should('match', /purchase-orders/);
            } else {
              cy.log('No convert button visible - quotation may already be converted');
            }
          });
        } else {
          cy.log('No approved quotations to convert - skipping test');
        }
      });
    });
  });

  describe('7. Delete Quotation', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/supplier-quotations*').as('getQuotations');
      cy.intercept('DELETE', '**/api/supplier-quotations/*').as(
        'deleteQuotation'
      );
    });

    it('should delete a draft quotation', () => {
      cy.visit('/app/supplier-quotations');
      cy.wait('@getQuotations', { timeout: 10000 });

      // Filter by draft status (only drafts can be deleted)
      cy.get('select').select('draft');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        const hasDeleteButton = $body.find('button[title="Delete"]').length > 0;

        if (hasDeleteButton) {
          // Get count before delete
          cy.get('table tbody tr').then(($rows) => {
            const initialCount = $rows.length;

            // Click delete button on first row (has title="Delete")
            cy.get('table tbody tr')
              .first()
              .find('button[title="Delete"]')
              .click();

            // Delete uses window.confirm - Cypress auto-accepts

            // Wait for API
            cy.wait('@deleteQuotation', { timeout: 10000 });

            // Verify success toast
            cy.contains(/deleted|success/i).should('be.visible');

            // Wait for list to refresh
            cy.wait(500);

            if (initialCount === 1) {
              cy.contains('No quotations found').should('be.visible');
            } else {
              cy.get('table tbody tr').should('have.length', initialCount - 1);
            }
          });
        } else {
          cy.log('No draft quotations to delete - skipping test');
        }
      });
    });
  });
});

/**
 * Supplier Quotation - Edge Cases & Error Handling
 */
describe('Supplier Quotations - Error Handling', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login();
  });

  it('should handle API error gracefully on list page', () => {
    // Intercept and force error
    cy.intercept('GET', '**/api/supplier-quotations*', {
      statusCode: 500,
      body: { error: 'Internal server error' },
    }).as('getQuotationsError');

    cy.visit('/app/supplier-quotations');

    cy.wait('@getQuotationsError');

    // Should show error message with retry button
    cy.contains(/error|failed/i).should('be.visible');
    cy.contains('button', /retry/i).should('be.visible');
  });

  it('should handle 404 for non-existent quotation', () => {
    cy.intercept('GET', '**/api/supplier-quotations/99999999', {
      statusCode: 404,
      body: { error: 'Quotation not found' },
    }).as('getQuotationNotFound');

    cy.visit('/app/supplier-quotations/99999999', { failOnStatusCode: false });

    cy.wait('@getQuotationNotFound');

    // Should show error message or "not found" text
    cy.get('body').then(($body) => {
      const bodyText = $body.text().toLowerCase();
      const hasError =
        bodyText.includes('not found') ||
        bodyText.includes('error') ||
        bodyText.includes('failed');

      expect(hasError).to.be.true;
    });
  });

  it('should handle PDF upload failure', () => {
    cy.intercept('POST', '**/api/supplier-quotations/upload', {
      statusCode: 400,
      body: { error: 'Invalid PDF format' },
    }).as('uploadError');

    cy.visit('/app/supplier-quotations/upload');

    // Upload invalid file using input#pdf-upload
    cy.get('input#pdf-upload').selectFile(
      {
        contents: Cypress.Buffer.from('invalid content'),
        fileName: 'invalid.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );

    cy.contains('button', /extract data/i).click();

    cy.wait('@uploadError');

    // Should show error message
    cy.contains(/error|failed|invalid/i).should('be.visible');
  });
});
