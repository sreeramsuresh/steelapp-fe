/**
 * Audit Hub Service Unit Tests (Node Native Test Runner)
 * Tests audit logging and activity tracking
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { auditHubService } from '../auditHubService.js';

describe('auditHubService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getAuditLog', () => {
    test('should fetch audit log', async () => {
      const mockLog = [
        { id: 1, action: 'CREATE', entity: 'Invoice', timestamp: '2026-01-15' },
        { id: 2, action: 'UPDATE', entity: 'Invoice', timestamp: '2026-01-16' },
      ];
      sinon.stub(apiClient, 'get').resolves(mockLog);

      const result = await auditHubService.getAuditLog();

      assert.strictEqual(result.length, 2);
      assert.ok(apiClient.get.called);
    });
  });

  describe('logAction', () => {
    test('should log user action', async () => {
      const actionData = { action: 'CREATE', entity: 'Invoice', entityId: 1 };
      const mockResponse = { id: 1, ...actionData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await auditHubService.logAction(actionData);

      assert.strictEqual(result.id, 1);
      assert.ok(apiClient.post.called);
    });
  });

  describe('getActivitySummary', () => {
    test('should fetch activity summary', async () => {
      const mockSummary = {
        totalActions: 500,
        topUsers: [{ userId: 1, actions: 150 }],
      };
      sinon.stub(apiClient, 'get').resolves(mockSummary);

      const result = await auditHubService.getActivitySummary();

      assert.strictEqual(result.totalActions, 500);
      assert.ok(apiClient.get.called);
    });
  });

  describe('error handling', () => {
    test('should handle API errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await auditHubService.getAuditLog();
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });
  });
});
