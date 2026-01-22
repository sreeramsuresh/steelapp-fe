/**
 * Templates Management E2E Tests
 *
 * Tests for document/email templates
 * - List templates
 * - Create template
 * - Edit template
 * - Delete template
 * - Filter templates
 */

describe('Templates Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateTo('/templates');
  });

  describe('Templates List', () => {
    it('should display templates page', () => {
      cy.contains('h1', 'Templates').should('be.visible');
      cy.get('[data-testid="templates-list"]').should('exist');
    });

    it('should list all templates', () => {
      cy.get('[data-testid="template-item"]').should('have.length.greaterThan', 0);
    });

    it('should show template details in list', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="template-name"]').should('be.visible');
        cy.get('[data-testid="template-type"]').should('be.visible');
        cy.get('[data-testid="template-status"]').should('be.visible');
      });
    });

    it('should display empty state when no templates', () => {
      cy.intercept('GET', '/api/templates', {
        body: [],
      }).as('getEmptyTemplates');

      cy.reload();
      cy.wait('@getEmptyTemplates');

      cy.contains('No templates created yet').should('be.visible');
    });
  });

  describe('Create Template', () => {
    it('should open create template modal', () => {
      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').should('be.visible');
      cy.contains('Create Template').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').within(() => {
        cy.get('[data-testid="btn-save"]').click();
        cy.contains('Template name is required').should('be.visible');
        cy.contains('Template type is required').should('be.visible');
      });
    });

    it('should create invoice template successfully', () => {
      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').within(() => {
        cy.get('[data-testid="input-name"]').type('Standard Invoice');
        cy.get('[data-testid="select-type"]').click();
        cy.get('[data-testid="option-invoice"]').click();
        cy.get('[data-testid="textarea-content"]').type('Invoice Template Content');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Template created successfully').should('be.visible');
      cy.get('[data-testid="template-item"]').should('contain', 'Standard Invoice');
    });

    it('should create email template successfully', () => {
      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').within(() => {
        cy.get('[data-testid="input-name"]').type('Payment Reminder Email');
        cy.get('[data-testid="select-type"]').click();
        cy.get('[data-testid="option-email"]').click();
        cy.get('[data-testid="textarea-content"]').type('Hello {{customer_name}},\nYour payment is due.');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Template created successfully').should('be.visible');
    });

    it('should support template variables', () => {
      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').within(() => {
        cy.get('[data-testid="input-name"]').type('Template with Variables');
        cy.get('[data-testid="select-type"]').click();
        cy.get('[data-testid="option-invoice"]').click();

        cy.get('[data-testid="btn-insert-variable"]').click();
        cy.get('[data-testid="option-invoice-number"]').click();

        cy.get('[data-testid="textarea-content"]').should('contain', '{{invoice_number}}');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Template created successfully').should('be.visible');
    });

    it('should allow description/notes', () => {
      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').within(() => {
        cy.get('[data-testid="input-name"]').type('Template Name');
        cy.get('[data-testid="select-type"]').click();
        cy.get('[data-testid="option-invoice"]').click();
        cy.get('[data-testid="textarea-description"]').type('This is a template description');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Template created successfully').should('be.visible');
    });
  });

  describe('Edit Template', () => {
    beforeEach(() => {
      cy.request('POST', '/api/templates', {
        name: 'Test Template',
        type: 'invoice',
        content: 'Original content',
      });
      cy.reload();
    });

    it('should open edit template modal', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-template"]').should('be.visible');
      cy.contains('Edit Template').should('be.visible');
    });

    it('should update template content', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-template"]').within(() => {
        cy.get('[data-testid="textarea-content"]').clear().type('Updated content');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Template updated successfully').should('be.visible');
    });

    it('should update template name', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-template"]').within(() => {
        cy.get('[data-testid="input-name"]').clear().type('Updated Template Name');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.contains('Updated Template Name').should('be.visible');
    });

    it('should validate required fields on update', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-template"]').within(() => {
        cy.get('[data-testid="input-name"]').clear();
        cy.get('[data-testid="btn-save"]').click();
        cy.contains('Template name is required').should('be.visible');
      });
    });
  });

  describe('Delete Template', () => {
    beforeEach(() => {
      cy.request('POST', '/api/templates', {
        name: 'Template to Delete',
        type: 'invoice',
        content: 'Content',
      });
      cy.reload();
    });

    it('should open delete confirmation', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-delete"]').click();
      });

      cy.get('[data-testid="modal-confirm-delete"]').should('be.visible');
      cy.contains('Are you sure').should('be.visible');
    });

    it('should delete template on confirmation', () => {
      const templateName = 'Template to Delete';
      cy.get('[data-testid="template-item"]').contains(templateName).closest('[data-testid="template-item"]').within(() => {
        cy.get('[data-testid="btn-delete"]').click();
      });

      cy.get('[data-testid="modal-confirm-delete"]').within(() => {
        cy.get('[data-testid="btn-confirm"]').click();
      });

      cy.contains('Template deleted successfully').should('be.visible');
      cy.get('[data-testid="template-item"]').should('not.contain', templateName);
    });

    it('should cancel delete without removing template', () => {
      const templateName = 'Template to Delete';
      cy.get('[data-testid="template-item"]').contains(templateName).closest('[data-testid="template-item"]').within(() => {
        cy.get('[data-testid="btn-delete"]').click();
      });

      cy.get('[data-testid="modal-confirm-delete"]').within(() => {
        cy.get('[data-testid="btn-cancel"]').click();
      });

      cy.get('[data-testid="template-item"]').should('contain', templateName);
    });
  });

  describe('Filter Templates', () => {
    beforeEach(() => {
      cy.request('POST', '/api/templates', { name: 'Invoice Template', type: 'invoice', content: 'Content' });
      cy.request('POST', '/api/templates', { name: 'Email Template', type: 'email', content: 'Content' });
      cy.request('POST', '/api/templates', { name: 'SMS Template', type: 'sms', content: 'Content' });
      cy.reload();
    });

    it('should filter templates by type', () => {
      cy.get('[data-testid="filter-type"]').click();
      cy.get('[data-testid="option-invoice"]').click();

      cy.get('[data-testid="template-item"]').each(() => {
        cy.get('[data-testid="template-type"]').should('contain', 'Invoice');
      });
    });

    it('should show templates only for selected type', () => {
      cy.get('[data-testid="filter-type"]').click();
      cy.get('[data-testid="option-email"]').click();

      cy.get('[data-testid="template-item"]').should('contain', 'Email Template');
      cy.get('[data-testid="template-item"]').should('not.contain', 'Invoice Template');
    });

    it('should clear type filter', () => {
      cy.get('[data-testid="filter-type"]').click();
      cy.get('[data-testid="option-invoice"]').click();

      cy.get('[data-testid="btn-clear-filter"]').click();
      cy.get('[data-testid="template-item"]').should('have.length', 3);
    });
  });

  describe('Search Templates', () => {
    beforeEach(() => {
      cy.request('POST', '/api/templates', { name: 'Invoice Template', type: 'invoice', content: 'Content' });
      cy.request('POST', '/api/templates', { name: 'Reminder Email', type: 'email', content: 'Content' });
      cy.reload();
    });

    it('should search templates by name', () => {
      cy.get('[data-testid="search-templates"]').type('Invoice');
      cy.get('[data-testid="template-item"]').should('contain', 'Invoice Template');
      cy.get('[data-testid="template-item"]').should('not.contain', 'Reminder Email');
    });

    it('should clear search', () => {
      cy.get('[data-testid="search-templates"]').type('Invoice');
      cy.get('[data-testid="search-templates"]').clear();
      cy.get('[data-testid="template-item"]').should('have.length', 2);
    });
  });

  describe('Template Preview', () => {
    beforeEach(() => {
      cy.request('POST', '/api/templates', {
        name: 'Preview Template',
        type: 'invoice',
        content: 'Invoice {{invoice_number}}\nTotal: {{total_amount}}',
      });
      cy.reload();
    });

    it('should preview template with sample data', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-preview"]').click();
      });

      cy.get('[data-testid="modal-preview"]').should('be.visible');
      cy.contains('Preview').should('be.visible');
    });

    it('should show preview with variable placeholders filled', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-preview"]').click();
      });

      cy.get('[data-testid="modal-preview"]').within(() => {
        cy.get('[data-testid="preview-content"]').should('contain', 'Invoice');
        cy.get('[data-testid="preview-content"]').should('contain', 'Total:');
      });
    });
  });

  describe('Duplicate Template', () => {
    beforeEach(() => {
      cy.request('POST', '/api/templates', { name: 'Original Template', type: 'invoice', content: 'Content' });
      cy.reload();
    });

    it('should duplicate template', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-duplicate"]').click();
      });

      cy.contains('Template duplicated').should('be.visible');
      cy.get('[data-testid="template-item"]').should('contain', 'Original Template (Copy)');
    });

    it('should allow editing duplicated template immediately', () => {
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-duplicate"]').click();
      });

      cy.get('[data-testid="template-item"]').contains('Copy').closest('[data-testid="template-item"]').within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-template"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="btn-create-template"]').should('be.visible');
      cy.get('[data-testid="templates-list"]').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="templates-list"]').should('be.visible');
      cy.get('[data-testid="template-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors', () => {
      cy.intercept('POST', '/api/templates', {
        statusCode: 500,
        body: { error: 'Failed to create template' },
      }).as('createError');

      cy.get('[data-testid="btn-create-template"]').click();
      cy.get('[data-testid="modal-create-template"]').within(() => {
        cy.get('[data-testid="input-name"]').type('Template');
        cy.get('[data-testid="select-type"]').click();
        cy.get('[data-testid="option-invoice"]').click();
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.wait('@createError');
      cy.contains('Failed to create template').should('be.visible');
    });

    it('should handle update errors', () => {
      cy.request('POST', '/api/templates', { name: 'Test', type: 'invoice', content: 'Content' });
      cy.intercept('PUT', '/api/templates/*', {
        statusCode: 500,
      }).as('updateError');

      cy.reload();
      cy.get('[data-testid="template-item"]').first().within(() => {
        cy.get('[data-testid="btn-edit"]').click();
      });

      cy.get('[data-testid="modal-edit-template"]').within(() => {
        cy.get('[data-testid="textarea-content"]').clear().type('Updated');
        cy.get('[data-testid="btn-save"]').click();
      });

      cy.wait('@updateError');
      cy.contains('Failed to update').should('be.visible');
    });
  });
});
