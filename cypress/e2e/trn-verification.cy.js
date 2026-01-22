/**
 * TRN (Tax Registration Number) Verification E2E Tests
 *
 * Tests for UAE FTA TRN verification
 * - Validate TRN format locally
 * - Verify TRN with FTA API
 * - Multi-country support
 * - Error handling
 */

describe('TRN Verification', () => {
  beforeEach(() => {
    cy.loginAsUser();
  });

  describe('TRN Validation - Format Check', () => {
    beforeEach(() => {
      cy.navigateTo('/settings/company');
    });

    it('should display TRN validation field', () => {
      cy.get('[data-testid="section-company-info"]').should('be.visible');
      cy.get('[data-testid="input-trn"]').should('be.visible');
    });

    it('should validate UAE TRN format locally', () => {
      const validUAETRN = '100123456789012';
      cy.get('[data-testid="input-trn"]').type(validUAETRN);
      cy.get('[data-testid="btn-validate"]').click();

      cy.get('[data-testid="validation-result"]').should('be.visible');
      cy.contains('TRN format is valid').should('be.visible');
      cy.get('[data-testid="success-badge"]').should('be.visible');
    });

    it('should reject invalid UAE TRN format', () => {
      const invalidTRN = '123456789'; // Wrong format
      cy.get('[data-testid="input-trn"]').type(invalidTRN);
      cy.get('[data-testid="btn-validate"]').click();

      cy.get('[data-testid="validation-result"]').should('be.visible');
      cy.contains('Invalid UAE TRN format').should('be.visible');
      cy.get('[data-testid="error-badge"]').should('be.visible');
    });

    it('should reject TRN with wrong starting digits', () => {
      const invalidTRN = '200123456789012'; // Starts with 200, not 100
      cy.get('[data-testid="input-trn"]').type(invalidTRN);
      cy.get('[data-testid="btn-validate"]').click();

      cy.contains('Expected: 15 digits starting with 100').should('be.visible');
    });

    it('should handle TRN with spaces and dashes', () => {
      const trnWithFormat = '100-1234-5678-9012'; // With dashes
      cy.get('[data-testid="input-trn"]').type(trnWithFormat);
      cy.get('[data-testid="btn-validate"]').click();

      cy.contains('TRN format is valid').should('be.visible');
    });

    it('should show expected format for UAE', () => {
      cy.get('[data-testid="input-trn"]').type('123');
      cy.get('[data-testid="btn-validate"]').click();

      cy.get('[data-testid="format-description"]').should('contain', '15 digits starting with 100');
      cy.get('[data-testid="format-example"]').should('contain', '100123456789012');
    });

    it('should require TRN input', () => {
      cy.get('[data-testid="btn-validate"]').click();
      cy.contains('TRN is required').should('be.visible');
    });
  });

  describe('Multi-Country TRN Support', () => {
    beforeEach(() => {
      cy.navigateTo('/settings/company');
    });

    it('should support Saudi Arabia TRN format', () => {
      cy.get('[data-testid="select-country"]').click();
      cy.get('[data-testid="option-SA"]').click();

      cy.get('[data-testid="input-trn"]').type('310123456789012');
      cy.get('[data-testid="btn-validate"]').click();

      cy.contains('TRN format is valid').should('be.visible');
      cy.get('[data-testid="format-description"]').should('contain', '15 digits starting with 3');
    });

    it('should support Bahrain TRN format', () => {
      cy.get('[data-testid="select-country"]').click();
      cy.get('[data-testid="option-BH"]').click();

      cy.get('[data-testid="input-trn"]').type('1234567890123');
      cy.get('[data-testid="btn-validate"]').click();

      cy.contains('TRN format is valid').should('be.visible');
      cy.get('[data-testid="format-description"]').should('contain', '13 digits');
    });

    it('should support Oman TRN format', () => {
      cy.get('[data-testid="select-country"]').click();
      cy.get('[data-testid="option-OM"]').click();

      cy.get('[data-testid="input-trn"]').type('12345678');
      cy.get('[data-testid="btn-validate"]').click();

      cy.contains('TRN format is valid').should('be.visible');
      cy.get('[data-testid="format-description"]').should('contain', '8 digits');
    });

    it('should show all supported country formats', () => {
      cy.get('[data-testid="link-view-formats"]').click();
      cy.get('[data-testid="modal-formats"]').should('be.visible');

      cy.get('[data-testid="format-ae"]').should('contain', '15 digits');
      cy.get('[data-testid="format-sa"]').should('contain', '15 digits');
      cy.get('[data-testid="format-bh"]').should('contain', '13 digits');
      cy.get('[data-testid="format-om"]').should('contain', '8 digits');
    });
  });

  describe('TRN Verification with FTA API', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.navigateTo('/integrations');
      // Setup FTA integration first
      cy.request('POST', '/api/integrations/fta_trn', {
        api_url: 'https://api.test.fta.example.com',
        api_key: 'test-api-key',
      });
      cy.navigateTo('/settings/company');
    });

    it('should verify TRN with FTA API', () => {
      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.get('[data-testid="verification-spinner"]').should('be.visible');
      cy.get('[data-testid="verification-result"]').should('be.visible');
    });

    it('should show verified status for valid TRN', () => {
      cy.intercept('POST', '/api/trn/verify', {
        verified: true,
        business_name: 'Test Company LLC',
        status: 'active',
      }).as('verifySuccess');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.wait('@verifySuccess');
      cy.contains('Verified').should('be.visible');
      cy.contains('Test Company LLC').should('be.visible');
    });

    it('should show not found for unregistered TRN', () => {
      cy.intercept('POST', '/api/trn/verify', {
        verified: false,
        message: 'TRN not found in FTA database',
      }).as('verifyNotFound');

      cy.get('[data-testid="input-trn"]').type('100999999999999');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.wait('@verifyNotFound');
      cy.contains('TRN not found').should('be.visible');
    });

    it('should display business details when verified', () => {
      cy.intercept('POST', '/api/trn/verify', {
        verified: true,
        business_name: 'Al Jazira Steel Trading',
        trade_name: 'AJZ Steel',
        status: 'active',
        registration_date: '2015-01-15',
      }).as('verifyFull');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.wait('@verifyFull');
      cy.get('[data-testid="business-name"]').should('contain', 'Al Jazira Steel Trading');
      cy.get('[data-testid="trade-name"]').should('contain', 'AJZ Steel');
      cy.get('[data-testid="registration-date"]').should('contain', '2015');
    });

    it('should show manual verification link when API not configured', () => {
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.contains('FTA API not configured').should('be.visible');
      cy.get('[data-testid="link-manual-verify"]').should('have.attr', 'href', 'https://tax.gov.ae/en/trn.verification.aspx');
    });
  });

  describe('TRN Service Status', () => {
    beforeEach(() => {
      cy.navigateTo('/settings/company');
    });

    it('should display service status indicator', () => {
      cy.get('[data-testid="service-status"]').should('be.visible');
    });

    it('should show format validation always available', () => {
      cy.get('[data-testid="status-format-validation"]').should('contain', 'Available');
      cy.get('[data-testid="status-format-icon"]').should('have.class', 'success');
    });

    it('should indicate FTA API status', () => {
      cy.get('[data-testid="status-fta-api"]').should('be.visible');
    });

    it('should show supported countries', () => {
      cy.get('[data-testid="supported-countries"]').should('contain', 'AE');
      cy.get('[data-testid="supported-countries"]').should('contain', 'SA');
      cy.get('[data-testid="supported-countries"]').should('contain', 'BH');
      cy.get('[data-testid="supported-countries"]').should('contain', 'OM');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.navigateTo('/settings/company');
    });

    it('should handle API authentication failure', () => {
      cy.intercept('POST', '/api/trn/verify', {
        statusCode: 401,
        body: { error: 'Invalid API key' },
      }).as('authError');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.wait('@authError');
      cy.contains('Authentication failed').should('be.visible');
    });

    it('should handle network timeout', () => {
      cy.intercept('POST', '/api/trn/verify', {
        statusCode: 503,
        body: { error: 'FTA API timeout' },
      }).as('timeoutError');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.wait('@timeoutError');
      cy.contains('Unable to connect').should('be.visible');
    });

    it('should handle unknown country code', () => {
      cy.get('[data-testid="select-country"]').click();
      cy.get('[data-testid="option-XX"]').should('not.exist');
    });

    it('should show fallback to manual verification on API error', () => {
      cy.intercept('POST', '/api/trn/verify', {
        statusCode: 500,
      }).as('serverError');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.wait('@serverError');
      cy.get('[data-testid="link-manual-verify"]').should('be.visible');
      cy.contains('verify manually').should('be.visible');
    });
  });

  describe('TRN in Company Settings', () => {
    it('should save validated TRN to company settings', () => {
      cy.loginAsAdmin();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-validate"]').click();
      cy.contains('TRN format is valid').should('be.visible');

      cy.get('[data-testid="btn-save-settings"]').click();
      cy.contains('Settings saved').should('be.visible');

      cy.reload();
      cy.get('[data-testid="input-trn"]').should('have.value', '100123456789012');
    });

    it('should show TRN in company profile', () => {
      cy.loginAsUser();
      cy.navigateTo('/settings/company/view');

      cy.get('[data-testid="company-trn"]').should('be.visible');
      cy.get('[data-testid="company-trn"]').should('contain', '100');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="input-trn"]').should('be.visible');
      cy.get('[data-testid="btn-validate"]').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="section-company-info"]').should('be.visible');
      cy.get('[data-testid="input-trn"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for TRN input', () => {
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="input-trn"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="label-trn"]').should('be.visible');
    });

    it('should show validation messages to screen readers', () => {
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="input-trn"]').type('123');
      cy.get('[data-testid="btn-validate"]').click();

      cy.get('[data-testid="error-message"]').should('have.attr', 'role', 'alert');
    });

    it('should support keyboard navigation', () => {
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      cy.get('[data-testid="input-trn"]').focus();
      cy.focused().should('have.data-testid', 'input-trn');

      cy.get('body').type('{tab}');
      cy.focused().should('have.data-testid', 'btn-validate');
    });
  });

  describe('Performance', () => {
    it('should validate format instantly', () => {
      cy.loginAsUser();
      cy.navigateTo('/settings/company');

      const startTime = Date.now();
      cy.get('[data-testid="input-trn"]').type('100123456789012');
      cy.get('[data-testid="btn-validate"]').click();
      cy.contains('TRN format is valid').should('be.visible');

      cy.then(() => {
        const duration = Date.now() - startTime;
        expect(duration).to.be.lessThan(500); // Should be instant
      });
    });

    it('should debounce API calls during typing', () => {
      cy.loginAsAdmin();
      cy.navigateTo('/settings/company');

      cy.intercept('POST', '/api/trn/verify', {
        body: { verified: true },
      }).as('verifyRequest');

      cy.get('[data-testid="input-trn"]').type('100123456789012', { delay: 50 });
      cy.get('[data-testid="btn-verify-fta"]').click();

      cy.get('@verifyRequest.all').should('have.length', 1); // Only one call
    });
  });
});
