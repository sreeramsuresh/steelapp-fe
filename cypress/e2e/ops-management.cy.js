/**
 * Ops Management E2E Tests
 *
 * Tests for operational/infrastructure endpoints
 * - View backup status
 * - Check backup health
 * - Monitor backup metrics
 */

describe('Ops Management - Backup Status', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateTo('/ops');
  });

  describe('Backup Status Dashboard', () => {
    it('should display ops dashboard', () => {
      cy.contains('h1', 'Operations').should('be.visible');
      cy.get('[data-testid="ops-dashboard"]').should('exist');
    });

    it('should display backup status section', () => {
      cy.get('[data-testid="backup-status-card"]').should('be.visible');
      cy.contains('Backup Status').should('be.visible');
    });
  });

  describe('Backup Status - Success State', () => {
    it('should display successful backup status', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.get('[data-testid="status-badge"]').should('contain', 'SUCCESS');
        cy.get('[data-testid="status-icon-success"]').should('be.visible');
      });
    });

    it('should show last successful backup time', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Last Successful Backup').should('be.visible');
        cy.get('[data-testid="last-success-time"]').should('contain', '20');
      });
    });

    it('should display backup file details', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Backup File').should('be.visible');
        cy.get('[data-testid="backup-filename"]').should('contain', 'steelapp');
      });
    });

    it('should show backup duration', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Duration').should('be.visible');
        cy.get('[data-testid="backup-duration"]').should('contain', 'seconds');
      });
    });

    it('should display environment information', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Environment').should('be.visible');
        cy.get('[data-testid="environment-badge"]').should('be.visible');
      });
    });

    it('should show database host information', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Database Host').should('be.visible');
        cy.get('[data-testid="db-host"]').should('be.visible');
      });
    });

    it('should display SHA256 checksum', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Checksum').should('be.visible');
        cy.get('[data-testid="backup-sha256"]').should('have.text').and('not.be.empty');
      });
    });
  });

  describe('Backup Status - Blocked State', () => {
    it('should display blocked status with reason', () => {
      // Mock blocked state
      cy.intercept('GET', '/api/ops/backup-status', {
        status: 'BLOCKED',
        blocked: true,
        blockedReason: 'Disk space check failed',
        lastSuccessAt: '2025-12-21T04:00:12Z',
        lastAttemptAt: '2025-12-21T08:00:05Z',
      }).as('getBlockedStatus');

      cy.reload();
      cy.wait('@getBlockedStatus');

      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.get('[data-testid="status-badge"]').should('contain', 'BLOCKED');
        cy.get('[data-testid="status-icon-warning"]').should('be.visible');
      });
    });

    it('should show blocking reason', () => {
      cy.intercept('GET', '/api/ops/backup-status', {
        status: 'BLOCKED',
        blocked: true,
        blockedReason: 'Disk space check failed',
      }).as('getBlockedStatus');

      cy.reload();
      cy.wait('@getBlockedStatus');

      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Disk space check failed').should('be.visible');
      });
    });

    it('should allow admin to view detailed blocking information', () => {
      cy.intercept('GET', '/api/ops/backup-status', {
        status: 'BLOCKED',
        blocked: true,
        blockedReason: 'SECURITY_GUARD: Disk space check failed',
      }).as('getBlockedStatus');

      cy.reload();
      cy.wait('@getBlockedStatus');

      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.get('[data-testid="btn-view-details"]').click();
      });

      cy.get('[data-testid="modal-backup-details"]').should('be.visible');
      cy.contains('SECURITY_GUARD').should('be.visible');
    });
  });

  describe('Backup Status - Unknown State', () => {
    it('should display unknown status when backup not configured', () => {
      cy.intercept('GET', '/api/ops/backup-status', {
        status: 'UNKNOWN',
        message: 'No backup status found - backup system not configured',
      }).as('getUnknownStatus');

      cy.reload();
      cy.wait('@getUnknownStatus');

      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.get('[data-testid="status-badge"]').should('contain', 'UNKNOWN');
        cy.get('[data-testid="status-icon-unknown"]').should('be.visible');
      });
    });

    it('should show configuration instructions for unknown state', () => {
      cy.intercept('GET', '/api/ops/backup-status', {
        status: 'UNKNOWN',
        message: 'No backup status found - backup system not configured',
      }).as('getUnknownStatus');

      cy.reload();
      cy.wait('@getUnknownStatus');

      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.contains('Backup system not configured').should('be.visible');
        cy.get('[data-testid="btn-setup-backup"]').should('be.visible');
      });
    });
  });

  describe('Backup Health Indicators', () => {
    it('should show backup freshness indicator', () => {
      cy.get('[data-testid="backup-freshness"]').should('be.visible');
      cy.contains('Backup Freshness').should('be.visible');
    });

    it('should display backup frequency status', () => {
      cy.get('[data-testid="backup-frequency"]').should('be.visible');
      cy.contains('Daily').should('be.visible');
    });

    it('should show backup encryption status', () => {
      cy.get('[data-testid="backup-encryption"]').should('be.visible');
      cy.contains('Encryption').should('be.visible');
      cy.get('[data-testid="encryption-badge"]').should('contain', 'GPG');
    });

    it('should indicate backup reliability', () => {
      cy.get('[data-testid="backup-reliability"]').should('be.visible');
      cy.contains('Reliability').should('be.visible');
    });
  });

  describe('Backup Metrics', () => {
    it('should display backup file size', () => {
      cy.get('[data-testid="backup-metrics"]').within(() => {
        cy.contains('File Size').should('be.visible');
        cy.get('[data-testid="file-size"]').should('be.visible');
      });
    });

    it('should show last attempt information', () => {
      cy.get('[data-testid="backup-metrics"]').within(() => {
        cy.contains('Last Attempt').should('be.visible');
        cy.get('[data-testid="last-attempt-time"]').should('be.visible');
      });
    });

    it('should display backup success rate', () => {
      cy.get('[data-testid="backup-metrics"]').within(() => {
        cy.contains('Success Rate').should('be.visible');
        cy.get('[data-testid="success-rate"]').should('contain', '%');
      });
    });
  });

  describe('Backup Actions', () => {
    it('should not allow manual backup trigger for non-admins', () => {
      cy.loginAsUser('user');
      cy.navigateTo('/ops');

      cy.get('[data-testid="btn-trigger-backup"]').should('be.disabled');
    });

    it('should allow admin to view backup logs', () => {
      cy.get('[data-testid="btn-view-logs"]').click();
      cy.get('[data-testid="modal-backup-logs"]').should('be.visible');
    });

    it('should display backup logs with timestamps', () => {
      cy.get('[data-testid="btn-view-logs"]').click();
      cy.get('[data-testid="log-entry"]').first().within(() => {
        cy.get('[data-testid="log-timestamp"]').should('be.visible');
        cy.get('[data-testid="log-message"]').should('be.visible');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="backup-status-card"]').should('be.visible');
      cy.get('[data-testid="status-badge"]').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="backup-status-card"]').should('be.visible');
      cy.get('[data-testid="backup-metrics"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/ops/backup-status', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('getStatusError');

      cy.reload();
      cy.wait('@getStatusError');

      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.contains('Unable to load backup status').should('be.visible');
    });

    it('should retry loading on temporary failure', () => {
      cy.intercept('GET', '/api/ops/backup-status', {
        statusCode: 503,
      }).as('getStatusUnavailable');

      cy.reload();
      cy.wait('@getStatusUnavailable');

      cy.get('[data-testid="btn-retry"]').click();
      cy.contains('Retrying').should('be.visible');
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh backup status periodically', () => {
      cy.get('[data-testid="backup-status-card"]').within(() => {
        cy.get('[data-testid="last-refresh"]').should('contain', 'ago');
      });

      // Wait for auto-refresh (typically 30-60 seconds)
      cy.wait(5000); // Wait 5 seconds for demo
      cy.get('[data-testid="last-refresh"]').should('be.updated');
    });

    it('should allow manual refresh', () => {
      cy.get('[data-testid="btn-refresh"]').click();
      cy.get('[data-testid="refreshing-spinner"]').should('be.visible');
      cy.get('[data-testid="backup-status-card"]').should('be.visible');
    });
  });
});
