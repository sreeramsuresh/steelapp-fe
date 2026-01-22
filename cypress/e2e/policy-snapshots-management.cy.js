/**
 * Policy Snapshots Management E2E Tests
 *
 * Tests for historical policy versioning and audit trails
 * - View policy snapshots
 * - Compare policy versions
 * - Restore from snapshot
 * - Audit logging
 */

describe('Policy Snapshots Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateTo('/settings/policies');
  });

  describe('Policy Snapshots List', () => {
    it('should display policy snapshots section', () => {
      cy.contains('h2', 'Policy History').should('be.visible');
      cy.get('[data-testid="snapshots-list"]').should('exist');
    });

    it('should list all policy snapshots', () => {
      cy.get('[data-testid="snapshot-item"]').should('have.length.greaterThan', 0);
    });

    it('should show snapshot details', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="snapshot-date"]').should('be.visible');
        cy.get('[data-testid="snapshot-version"]').should('be.visible');
        cy.get('[data-testid="snapshot-author"]').should('be.visible');
      });
    });

    it('should display empty state when no snapshots', () => {
      cy.intercept('GET', '/api/policy-snapshots', {
        body: [],
      }).as('getEmptySnapshots');

      cy.reload();
      cy.wait('@getEmptySnapshots');

      cy.contains('No policy snapshots yet').should('be.visible');
    });

    it('should sort snapshots by most recent first', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="snapshot-date"]').then(($date) => {
          const firstDate = $date.text();
          cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
            cy.get('[data-testid="snapshot-date"]').should(($nextDate) => {
              expect(firstDate > $nextDate.text()).to.be.true;
            });
          });
        });
      });
    });
  });

  describe('View Snapshot Details', () => {
    it('should expand snapshot to show policy details', () => {
      cy.get('[data-testid="snapshot-item"]').first().click();
      cy.get('[data-testid="snapshot-details"]').should('be.visible');
    });

    it('should display policy content in snapshot', () => {
      cy.get('[data-testid="snapshot-item"]').first().click();
      cy.get('[data-testid="snapshot-details"]').within(() => {
        cy.get('[data-testid="policy-content"]').should('not.be.empty');
      });
    });

    it('should show metadata for snapshot', () => {
      cy.get('[data-testid="snapshot-item"]').first().click();
      cy.get('[data-testid="snapshot-metadata"]').within(() => {
        cy.contains('Created by').should('be.visible');
        cy.contains('Created on').should('be.visible');
        cy.contains('Version').should('be.visible');
      });
    });

    it('should show reason for policy change', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="change-reason"]').should('be.visible');
      });
    });

    it('should collapse snapshot details', () => {
      cy.get('[data-testid="snapshot-item"]').first().click();
      cy.get('[data-testid="snapshot-details"]').should('be.visible');

      cy.get('[data-testid="snapshot-item"]').first().click();
      cy.get('[data-testid="snapshot-details"]').should('not.be.visible');
    });
  });

  describe('Compare Policy Versions', () => {
    it('should compare two snapshots side-by-side', () => {
      cy.get('[data-testid="snapshot-item"]').eq(0).within(() => {
        cy.get('[data-testid="btn-select"]').click();
      });

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-compare"]').click();
      });

      cy.get('[data-testid="modal-compare"]').should('be.visible');
      cy.contains('Compare Policies').should('be.visible');
    });

    it('should show differences between versions', () => {
      cy.get('[data-testid="snapshot-item"]').eq(0).within(() => {
        cy.get('[data-testid="btn-select"]').click();
      });

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-compare"]').click();
      });

      cy.get('[data-testid="modal-compare"]').within(() => {
        cy.get('[data-testid="diff-added"]').should('be.visible');
        cy.get('[data-testid="diff-removed"]').should('be.visible');
      });
    });

    it('should highlight added lines in comparison', () => {
      cy.get('[data-testid="snapshot-item"]').eq(0).within(() => {
        cy.get('[data-testid="btn-select"]').click();
      });

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-compare"]').click();
      });

      cy.get('[data-testid="modal-compare"]').within(() => {
        cy.get('[data-testid="diff-added"]').should('have.class', 'highlight-green');
      });
    });

    it('should highlight removed lines in comparison', () => {
      cy.get('[data-testid="snapshot-item"]').eq(0).within(() => {
        cy.get('[data-testid="btn-select"]').click();
      });

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-compare"]').click();
      });

      cy.get('[data-testid="modal-compare"]').within(() => {
        cy.get('[data-testid="diff-removed"]').should('have.class', 'highlight-red');
      });
    });

    it('should allow clearing comparison selection', () => {
      cy.get('[data-testid="btn-clear-comparison"]').click();
      cy.get('[data-testid="snapshot-item"]').each(() => {
        cy.get('[data-testid="btn-select"]').should('not.be.checked');
      });
    });
  });

  describe('Restore Policy from Snapshot', () => {
    it('should show restore button for past snapshots', () => {
      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').should('be.visible');
      });
    });

    it('should open restore confirmation dialog', () => {
      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').click();
      });

      cy.get('[data-testid="modal-confirm-restore"]').should('be.visible');
      cy.contains('Restore Policy').should('be.visible');
    });

    it('should show what will be restored', () => {
      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').click();
      });

      cy.get('[data-testid="modal-confirm-restore"]').within(() => {
        cy.contains('This will overwrite current policy').should('be.visible');
      });
    });

    it('should restore policy on confirmation', () => {
      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').click();
      });

      cy.get('[data-testid="modal-confirm-restore"]').within(() => {
        cy.get('[data-testid="btn-confirm"]').click();
      });

      cy.contains('Policy restored successfully').should('be.visible');
    });

    it('should create new snapshot after restore', () => {
      const initialCount = cy.get('[data-testid="snapshot-item"]').length;

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').click();
      });

      cy.get('[data-testid="modal-confirm-restore"]').within(() => {
        cy.get('[data-testid="btn-confirm"]').click();
      });

      cy.get('[data-testid="snapshot-item"]').should('have.length', initialCount + 1);
    });

    it('should not restore current snapshot', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="btn-restore"]').should('be.disabled');
      });
    });

    it('should cancel restore without changes', () => {
      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').click();
      });

      cy.get('[data-testid="modal-confirm-restore"]').within(() => {
        cy.get('[data-testid="btn-cancel"]').click();
      });

      cy.contains('Policy restored').should('not.exist');
    });
  });

  describe('Policy Snapshot Metadata', () => {
    it('should display creator information', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="created-by"]').should('contain', '@');
      });
    });

    it('should show timestamp with timezone', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="created-timestamp"]').should('be.visible');
        cy.get('[data-testid="timezone"]').should('contain', 'GST');
      });
    });

    it('should display version number', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="version-number"]').should('contain', 'v');
      });
    });

    it('should show change description', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="change-description"]').should('not.be.empty');
      });
    });
  });

  describe('Audit Trail', () => {
    it('should show audit log for policy changes', () => {
      cy.contains('h3', 'Audit Trail').should('be.visible');
      cy.get('[data-testid="audit-entry"]').should('have.length.greaterThan', 0);
    });

    it('should display audit entry details', () => {
      cy.get('[data-testid="audit-entry"]').first().within(() => {
        cy.get('[data-testid="audit-action"]').should('be.visible');
        cy.get('[data-testid="audit-user"]').should('be.visible');
        cy.get('[data-testid="audit-timestamp"]').should('be.visible');
      });
    });

    it('should show all audit actions (create, update, restore)', () => {
      cy.get('[data-testid="audit-entry"]').each(() => {
        cy.get('[data-testid="audit-action"]').should('be.oneOf', ['Created', 'Updated', 'Restored']);
      });
    });
  });

  describe('Export Snapshot', () => {
    it('should allow exporting snapshot as JSON', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="btn-export"]').click();
      });

      cy.get('[data-testid="modal-export"]').should('be.visible');
      cy.get('[data-testid="format-json"]').click();
      cy.get('[data-testid="btn-download"]').click();
    });

    it('should allow exporting snapshot as PDF', () => {
      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="btn-export"]').click();
      });

      cy.get('[data-testid="modal-export"]').should('be.visible');
      cy.get('[data-testid="format-pdf"]').click();
      cy.get('[data-testid="btn-download"]').click();
    });
  });

  describe('Filtering Snapshots', () => {
    it('should filter by policy type', () => {
      cy.get('[data-testid="filter-type"]').click();
      cy.get('[data-testid="option-pricing"]').click();

      cy.get('[data-testid="snapshot-item"]').each(() => {
        cy.get('[data-testid="policy-type"]').should('contain', 'Pricing');
      });
    });

    it('should filter by date range', () => {
      cy.get('[data-testid="filter-date-from"]').click();
      cy.get('[data-testid="date-picker"]').type('2025-12-15');

      cy.get('[data-testid="snapshot-item"]').each(() => {
        cy.get('[data-testid="created-date"]').should('not.be.empty');
      });
    });

    it('should filter by creator', () => {
      cy.get('[data-testid="filter-creator"]').type('admin');
      cy.get('[data-testid="snapshot-item"]').each(() => {
        cy.get('[data-testid="created-by"]').should('contain', 'admin');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="snapshots-list"]').should('be.visible');
      cy.get('[data-testid="snapshot-item"]').should('have.length.greaterThan', 0);
    });

    it('should stack comparison view on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="snapshot-item"]').eq(0).within(() => {
        cy.get('[data-testid="btn-select"]').click();
      });

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-compare"]').click();
      });

      cy.get('[data-testid="modal-compare"]').within(() => {
        cy.get('[data-testid="compare-layout"]').should('have.class', 'stacked');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle restore errors', () => {
      cy.intercept('POST', '/api/policy-snapshots/*/restore', {
        statusCode: 500,
        body: { error: 'Failed to restore policy' },
      }).as('restoreError');

      cy.get('[data-testid="snapshot-item"]').eq(1).within(() => {
        cy.get('[data-testid="btn-restore"]').click();
      });

      cy.get('[data-testid="modal-confirm-restore"]').within(() => {
        cy.get('[data-testid="btn-confirm"]').click();
      });

      cy.wait('@restoreError');
      cy.contains('Failed to restore').should('be.visible');
    });

    it('should handle export errors', () => {
      cy.intercept('GET', '/api/policy-snapshots/*/export', {
        statusCode: 500,
      }).as('exportError');

      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="btn-export"]').click();
      });

      cy.get('[data-testid="btn-download"]').click();
      cy.wait('@exportError');
      cy.contains('Failed to export').should('be.visible');
    });
  });

  describe('Permissions', () => {
    it('should not show restore button for non-admins', () => {
      cy.loginAsUser('viewer');
      cy.navigateTo('/settings/policies');

      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="btn-restore"]').should('not.exist');
      });
    });

    it('should show read-only view for non-admins', () => {
      cy.loginAsUser('viewer');
      cy.navigateTo('/settings/policies');

      cy.get('[data-testid="snapshot-item"]').first().within(() => {
        cy.get('[data-testid="btn-delete"]').should('not.exist');
        cy.get('[data-testid="btn-edit"]').should('not.exist');
      });
    });
  });
});
