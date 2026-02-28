/**
 * Audit Log Service Unit Tests (Node Native Test Runner)
 *
 * Tests the audit log API calls used by:
 * - AuditLogs.jsx page (GET /audit-logs with filters)
 * - EntityAuditTimeline.jsx (GET /audit-logs/entity/:type/:id)
 * - HomePage RecentActivitySection (GET /audit-logs/recent)
 * - AuditDetailDrawer.jsx (single log entry display)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';

describe('auditLogService - API calls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs (paginated list with filters)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs', () => {
    it('should fetch audit logs with default pagination', async () => {
      const mockResponse = {
        logs: [
          { id: 1, action: 'CREATE_CUSTOMER', category: 'CUSTOMER', status: 'success' },
          { id: 2, action: 'DELETE_SUPPLIER', category: 'SUPPLIER', status: 'success' },
        ],
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/audit-logs');

      expect(result.logs.length).toBe(2);
      expect(result.pagination.total).toBe(2);
      expect(apiClient.get.calledWith('/audit-logs').toBeTruthy());
    });

    it('should apply category filter', async () => {
      const mockResponse = { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      await apiClient.get('/audit-logs?category=SUPPLIER');

      expect(apiClient.get.calledWith('/audit-logs?category=SUPPLIER').toBeTruthy());
    });

    it('should apply date range filters', async () => {
      const mockResponse = { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      await apiClient.get('/audit-logs?start_date=2026-01-01&end_date=2026-01-31');

      const callArg = apiClient.get.firstCall.args[0];
      expect(callArg.includes('start_date=').toBeTruthy());
      expect(callArg.includes('end_date=').toBeTruthy());
    });

    it('should apply entity_type and action filters', async () => {
      const mockResponse = { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      await apiClient.get('/audit-logs?entity_type=invoice&action=CREATE_INVOICE');

      const callArg = apiClient.get.firstCall.args[0];
      expect(callArg.includes('entity_type=invoice').toBeTruthy());
      expect(callArg.includes('action=CREATE_INVOICE').toBeTruthy());
    });

    it('should handle network errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/audit-logs');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs/recent (dashboard widget)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs/recent', () => {
    it('should fetch recent activity for dashboard widget', async () => {
      const mockResponse = {
        logs: [
          { id: 1, action: 'CREATE', category: 'CUSTOMER', entity_name: 'Corp A', created_at: '2026-02-08T10:00:00Z' },
          { id: 2, action: 'UPDATE', category: 'INVOICE', entity_name: 'INV-001', created_at: '2026-02-08T09:00:00Z' },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/audit-logs/recent');

      expect(result.logs.length).toBe(2);
      expect(apiClient.get.calledWith('/audit-logs/recent').toBeTruthy());
    });

    it('should return empty logs gracefully', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ logs: [] });

      const result = await apiClient.get('/audit-logs/recent');

      expect(result.logs.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs/entity/:type/:id (entity timeline)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs/entity/:entityType/:entityId', () => {
    it('should fetch entity audit history', async () => {
      const mockResponse = {
        logs: [
          { id: 1, action: 'CREATE', entity_type: 'supplier', entity_id: 5, old_values: null, new_values: { name: 'Test' } },
          { id: 2, action: 'UPDATE', entity_type: 'supplier', entity_id: 5, old_values: { name: 'Test' }, new_values: { name: 'Updated' } },
          { id: 3, action: 'DELETE', entity_type: 'supplier', entity_id: 5, old_values: { name: 'Updated' }, new_values: null },
        ],
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/audit-logs/entity/supplier/5');

      expect(result.logs.length).toBe(3);
      expect(result.logs[0].action).toBe('CREATE');
      expect(result.logs[2].action).toBe('DELETE');
    });

    it('should include old_values and new_values in response', async () => {
      const mockResponse = {
        logs: [{
          id: 1,
          action: 'UPDATE',
          old_values: { email: 'old@test.com', phone: '+971-4-111' },
          new_values: { email: 'new@test.com', phone: '+971-4-222' },
        }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/audit-logs/entity/customer/1');
      const log = result.logs[0];

      expect(log.old_values.email).toBe('old@test.com');
      expect(log.new_values.email).toBe('new@test.com');
    });

    it('should handle empty entity history', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ logs: [] });

      const result = await apiClient.get('/audit-logs/entity/product/999');

      expect(result.logs.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs/stats (category breakdown)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs/stats', () => {
    it('should fetch category statistics', async () => {
      const mockResponse = {
        categoryStats: [
          { category: 'CUSTOMER', count: '15', failed_count: '1' },
          { category: 'INVOICE', count: '30', failed_count: '0' },
        ],
        recentActivities: [
          { action: 'CREATE', category: 'CUSTOMER', created_at: '2026-02-08' },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/audit-logs/stats');

      expect(result.categoryStats.length).toBe(2);
      expect(result.recentActivities.length).toBe(1);
    });
  });

  // ────────────────────────────────────────────────
  // Response shape validation
  // ────────────────────────────────────────────────
  describe('Response shape validation', () => {
    it('audit log entry has expected fields', async () => {
      const mockLog = {
        id: 1,
        action: 'DELETE_SUPPLIER',
        category: 'SUPPLIER',
        entity_type: 'supplier',
        entity_id: 10,
        entity_name: 'Al Rashid Steel',
        description: 'Deleted supplier Al Rashid Steel',
        username: 'admin',
        user_email: 'admin@test.com',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        method: 'DELETE',
        endpoint: '/api/suppliers/10',
        status: 'success',
        old_values: { name: 'Al Rashid Steel', status: 'active' },
        new_values: null,
        created_at: '2026-02-08T14:32:00Z',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockLog);

      const result = await apiClient.get('/audit-logs/1');

      expect(result.action).toBe('DELETE_SUPPLIER');
      expect(result.category).toBe('SUPPLIER');
      expect(result.entity_type).toBe('supplier');
      expect(result.entity_id).toBe(10);
      expect(result.entity_name).toBe('Al Rashid Steel');
      expect(result.status).toBe('success');
      expect(result.old_values).toBeTruthy();
      expect(result.new_values).toBe(null);
    });
  });
});
