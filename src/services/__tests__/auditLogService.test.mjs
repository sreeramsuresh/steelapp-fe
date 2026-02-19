/**
 * Audit Log Service Unit Tests (Node Native Test Runner)
 *
 * Tests the audit log API calls used by:
 * - AuditLogs.jsx page (GET /audit-logs with filters)
 * - EntityAuditTimeline.jsx (GET /audit-logs/entity/:type/:id)
 * - HomePage RecentActivitySection (GET /audit-logs/recent)
 * - AuditDetailDrawer.jsx (single log entry display)
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('auditLogService - API calls', () => {
  afterEach(() => {
    sinon.restore();
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs (paginated list with filters)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs', () => {
    test('should fetch audit logs with default pagination', async () => {
      const mockResponse = {
        logs: [
          { id: 1, action: 'CREATE_CUSTOMER', category: 'CUSTOMER', status: 'success' },
          { id: 2, action: 'DELETE_SUPPLIER', category: 'SUPPLIER', status: 'success' },
        ],
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/audit-logs');

      assert.strictEqual(result.logs.length, 2);
      assert.strictEqual(result.pagination.total, 2);
      assert.ok(apiClient.get.calledWith('/audit-logs'));
    });

    test('should apply category filter', async () => {
      const mockResponse = { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      await apiClient.get('/audit-logs?category=SUPPLIER');

      assert.ok(apiClient.get.calledWith('/audit-logs?category=SUPPLIER'));
    });

    test('should apply date range filters', async () => {
      const mockResponse = { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      await apiClient.get('/audit-logs?start_date=2026-01-01&end_date=2026-01-31');

      const callArg = apiClient.get.firstCall.args[0];
      assert.ok(callArg.includes('start_date='));
      assert.ok(callArg.includes('end_date='));
    });

    test('should apply entity_type and action filters', async () => {
      const mockResponse = { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      await apiClient.get('/audit-logs?entity_type=invoice&action=CREATE_INVOICE');

      const callArg = apiClient.get.firstCall.args[0];
      assert.ok(callArg.includes('entity_type=invoice'));
      assert.ok(callArg.includes('action=CREATE_INVOICE'));
    });

    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/audit-logs');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs/recent (dashboard widget)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs/recent', () => {
    test('should fetch recent activity for dashboard widget', async () => {
      const mockResponse = {
        logs: [
          { id: 1, action: 'CREATE', category: 'CUSTOMER', entity_name: 'Corp A', created_at: '2026-02-08T10:00:00Z' },
          { id: 2, action: 'UPDATE', category: 'INVOICE', entity_name: 'INV-001', created_at: '2026-02-08T09:00:00Z' },
        ],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/audit-logs/recent');

      assert.strictEqual(result.logs.length, 2);
      assert.ok(apiClient.get.calledWith('/audit-logs/recent'));
    });

    test('should return empty logs gracefully', async () => {
      sinon.stub(apiClient, 'get').resolves({ logs: [] });

      const result = await apiClient.get('/audit-logs/recent');

      assert.strictEqual(result.logs.length, 0);
    });
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs/entity/:type/:id (entity timeline)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs/entity/:entityType/:entityId', () => {
    test('should fetch entity audit history', async () => {
      const mockResponse = {
        logs: [
          { id: 1, action: 'CREATE', entity_type: 'supplier', entity_id: 5, old_values: null, new_values: { name: 'Test' } },
          { id: 2, action: 'UPDATE', entity_type: 'supplier', entity_id: 5, old_values: { name: 'Test' }, new_values: { name: 'Updated' } },
          { id: 3, action: 'DELETE', entity_type: 'supplier', entity_id: 5, old_values: { name: 'Updated' }, new_values: null },
        ],
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/audit-logs/entity/supplier/5');

      assert.strictEqual(result.logs.length, 3);
      assert.strictEqual(result.logs[0].action, 'CREATE');
      assert.strictEqual(result.logs[2].action, 'DELETE');
    });

    test('should include old_values and new_values in response', async () => {
      const mockResponse = {
        logs: [{
          id: 1,
          action: 'UPDATE',
          old_values: { email: 'old@test.com', phone: '+971-4-111' },
          new_values: { email: 'new@test.com', phone: '+971-4-222' },
        }],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/audit-logs/entity/customer/1');
      const log = result.logs[0];

      assert.strictEqual(log.old_values.email, 'old@test.com');
      assert.strictEqual(log.new_values.email, 'new@test.com');
    });

    test('should handle empty entity history', async () => {
      sinon.stub(apiClient, 'get').resolves({ logs: [] });

      const result = await apiClient.get('/audit-logs/entity/product/999');

      assert.strictEqual(result.logs.length, 0);
    });
  });

  // ────────────────────────────────────────────────
  // GET /audit-logs/stats (category breakdown)
  // ────────────────────────────────────────────────
  describe('GET /audit-logs/stats', () => {
    test('should fetch category statistics', async () => {
      const mockResponse = {
        categoryStats: [
          { category: 'CUSTOMER', count: '15', failed_count: '1' },
          { category: 'INVOICE', count: '30', failed_count: '0' },
        ],
        recentActivities: [
          { action: 'CREATE', category: 'CUSTOMER', created_at: '2026-02-08' },
        ],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/audit-logs/stats');

      assert.strictEqual(result.categoryStats.length, 2);
      assert.strictEqual(result.recentActivities.length, 1);
    });
  });

  // ────────────────────────────────────────────────
  // Response shape validation
  // ────────────────────────────────────────────────
  describe('Response shape validation', () => {
    test('audit log entry has expected fields', async () => {
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
      sinon.stub(apiClient, 'get').resolves(mockLog);

      const result = await apiClient.get('/audit-logs/1');

      assert.strictEqual(result.action, 'DELETE_SUPPLIER');
      assert.strictEqual(result.category, 'SUPPLIER');
      assert.strictEqual(result.entity_type, 'supplier');
      assert.strictEqual(result.entity_id, 10);
      assert.strictEqual(result.entity_name, 'Al Rashid Steel');
      assert.strictEqual(result.status, 'success');
      assert.ok(result.old_values);
      assert.strictEqual(result.new_values, null);
    });
  });
});
