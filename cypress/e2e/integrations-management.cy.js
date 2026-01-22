/**
 * Integrations Management E2E Tests
 *
 * Tests for 3rd party API integrations (FTA TRN, Central Bank)
 * - List integrations
 * - Create integration
 * - Test connection
 * - Lock/unlock integration
 * - Delete integration
 * - Audit logging
 */

describe('Integrations Management', () => {
  const testIntegrationUrl = 'https://api.test.example.com';
  const testApiKey = 'test-api-key-12345';

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateTo('/integrations');
  });

  describe('List Integrations', () => {
    it('should display integrations page with list', () => {
      cy.contains('h1', 'Integrations').should('be.visible');
      cy.get('[data-testid="integration-list"]').should('exist');
    });

    it('should show available integration types', () => {
      cy.get('[data-testid="available-types"]').within(() => {
        cy.contains('FTA TRN Verification').should('be.visible');
        cy.contains('UAE Central Bank Exchange Rates').should('be.visible');
      });
    });

    it('should display empty state when no integrations configured', () => {
      cy.get('[data-testid="integrations-empty"]').should('be.visible');
      cy.contains('No integrations configured yet').should('be.visible');
    });
  });

  describe('Create Integration', () => {
    it('should open create integration modal', () => {
      cy.get('[data-testid="btn-add-integration"]').click();
      cy.get('[data-testid="modal-create-integration"]').should('be.visible');
    });

    it('should validate required fields before creating', () => {
      cy.get('[data-testid="btn-add-integration"]').click();
      cy.get('[data-testid="modal-create-integration"]').within(() => {
        cy.get('[data-testid="btn-save"]').click();
        cy.contains('API URL is required').should('be.visible');
        cy.contains('API Key is required').should('be.visible');
      });
    });

    it('should create FTA TRN integration successfully', () => {
      cy.get('[data-testid="btn-add-integration"]').click();
      cy.get('[data-testid="modal-create-integration"]').within(() => {
        cy.get('[data-testid="select-integration-type"]').click();
        cy.contains('FTA TRN Verification').click();

        cy.get('[data-testid="input-api-url"]').type(testIntegrationUrl);
        cy.get('[data-testid="input-api-key"]').type(testApiKey);

        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Integration created successfully').should('be.visible');
      cy.get('[data-testid="integration-item-fta_trn"]').should('be.visible');
    });

    it('should create Central Bank integration successfully', () => {
      cy.get('[data-testid="btn-add-integration"]').click();
      cy.get('[data-testid="modal-create-integration"]').within(() => {
        cy.get('[data-testid="select-integration-type"]').click();
        cy.contains('UAE Central Bank').click();

        cy.get('[data-testid="input-api-url"]').type(testIntegrationUrl);
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Integration created successfully').should('be.visible');
    });
  });

  describe('Test Integration Connection', () => {
    beforeEach(() => {
      // Create an integration first
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: testIntegrationUrl,
        api_key: testApiKey,
      });
      cy.reload();
    });

    it('should test integration connection', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-test-connection"]').click();
      });

      cy.get('[data-testid="modal-test-result"]').should('be.visible');
      cy.contains('Testing connection').should('be.visible');
    });

    it('should show test result on success', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-test-connection"]').click();
      });

      cy.get('[data-testid="modal-test-result"]').within(() => {
        cy.contains('Connection successful').should('be.visible');
        cy.get('[data-testid="test-success-badge"]').should('be.visible');
      });
    });

    it('should lock integration after successful test', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-test-connection"]').click();
      });

      cy.get('[data-testid="modal-test-result"]').within(() => {
        cy.contains('Auto-locked after successful test').should('be.visible');
      });

      // Verify lock status
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="lock-badge"]').should('contain', 'Locked');
      });
    });
  });

  describe('Lock/Unlock Integration', () => {
    beforeEach(() => {
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: testIntegrationUrl,
        api_key: testApiKey,
      });
      cy.reload();
    });

    it('should unlock locked integration', () => {
      // First lock it via API
      cy.request('POST', '/api/integrations/fta_trn/lock');
      cy.reload();

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-unlock"]').click();
      });

      cy.contains('Integration unlocked').should('be.visible');
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="lock-badge"]').should('not.exist');
      });
    });

    it('should prevent editing locked integration', () => {
      cy.request('POST', '/api/integrations/fta_trn/lock');
      cy.reload();

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-edit"]').should('be.disabled');
      });
    });

    it('should allow editing after unlocking', () => {
      cy.request('POST', '/api/integrations/fta_trn/lock');
      cy.reload();

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-unlock"]').click();
      });

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-edit"]').should('not.be.disabled');
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-integration"]').should('be.visible');
    });
  });

  describe('Update Integration', () => {
    beforeEach(() => {
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: testIntegrationUrl,
        api_key: testApiKey,
      });
      cy.reload();
    });

    it('should update integration details', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-integration"]').within(() => {
        const newUrl = 'https://api.updated.example.com';
        cy.get('[data-testid="input-api-url"]').clear().type(newUrl);
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Integration updated successfully').should('be.visible');
    });

    it('should clear test status when credentials change', () => {
      // First test connection
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-test-connection"]').click();
      });

      cy.get('[data-testid="modal-test-result"]').within(() => {
        cy.contains('successful').should('be.visible');
      });

      cy.get('body').type('{Escape}'); // Close modal

      // Now edit
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-integration"]').within(() => {
        cy.get('[data-testid="input-api-key"]').clear().type('new-key');
        cy.get('[data-testid="btn-save"]').click();
      });

      // Verify test status cleared
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="last-test-badge"]').should('not.exist');
      });
    });
  });

  describe('Delete Integration', () => {
    beforeEach(() => {
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: testIntegrationUrl,
        api_key: testApiKey,
      });
      cy.reload();
    });

    it('should prevent deleting locked integration', () => {
      cy.request('POST', '/api/integrations/fta_trn/lock');
      cy.reload();

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-delete"]').should('be.disabled');
      });
    });

    it('should delete unlocked integration', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-delete"]').click();
      });

      cy.get('[data-testid="modal-confirm-delete"]').within(() => {
        cy.get('[data-testid="btn-confirm"]').click();
      });

      cy.contains('Integration deleted successfully').should('be.visible');
      cy.get('[data-testid="integration-item-fta_trn"]').should('not.exist');
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: testIntegrationUrl,
        api_key: testApiKey,
      });
      cy.reload();
    });

    it('should display audit log', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-view-audit"]').click();
      });

      cy.get('[data-testid="modal-audit-log"]').should('be.visible');
      cy.contains('Audit Log').should('be.visible');
    });

    it('should show creation event in audit log', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-view-audit"]').click();
      });

      cy.get('[data-testid="audit-log-list"]').within(() => {
        cy.contains('created').should('be.visible');
      });
    });

    it('should show test event in audit log', () => {
      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-test-connection"]').click();
      });

      cy.get('[data-testid="modal-test-result"]').within(() => {
        cy.get('[data-testid="btn-close"]').click();
      });

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-view-audit"]').click();
      });

      cy.get('[data-testid="audit-log-list"]').within(() => {
        cy.contains('tested').should('be.visible');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid integration type', () => {
      cy.get('[data-testid="btn-add-integration"]').click();
      cy.get('[data-testid="modal-create-integration"]').within(() => {
        cy.get('[data-testid="select-integration-type"]').click();
        // Try to select invalid type - should not be available
        cy.get('[data-testid="option-invalid"]').should('not.exist');
      });
    });

    it('should show error when API connection fails', () => {
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: 'https://invalid-url-12345.example.com',
        api_key: testApiKey,
      });
      cy.reload();

      cy.get('[data-testid="integration-item-fta_trn"]').within(() => {
        cy.get('[data-testid="btn-test-connection"]').click();
      });

      cy.get('[data-testid="modal-test-result"]').within(() => {
        cy.contains('Connection failed').should('be.visible');
        cy.get('[data-testid="test-failure-badge"]').should('be.visible');
      });
    });
  });
});
