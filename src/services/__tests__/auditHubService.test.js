/**
 * Audit Hub Service Unit Tests (Node Native Test Runner)
 * Tests audit logging and activity tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { auditHubService } from '../auditHubService.js';

describe('auditHubService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuditLog', () => {
    it('should fetch audit log', async () => {
      const mockLog = [
        { id: 1, action: 'CREATE', entity: 'Invoice', timestamp: '2026-01-15' },
        { id: 2, action: 'UPDATE', entity: 'Invoice', timestamp: '2026-01-16' },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockLog);

      const result = await auditHubService.getAuditLog();

      expect(result.length).toBe(2);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('logAction', () => {
    it('should log user action', async () => {
      const actionData = { action: 'CREATE', entity: 'Invoice', entityId: 1 };
      const mockResponse = { id: 1, ...actionData };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await auditHubService.logAction(actionData);

      expect(result.id).toBe(1);
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getActivitySummary', () => {
    it('should fetch activity summary', async () => {
      const mockSummary = {
        totalActions: 500,
        topUsers: [{ userId: 1, actions: 150 }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await auditHubService.getActivitySummary();

      expect(result.totalActions).toBe(500);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await auditHubService.getAuditLog();
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });
});
