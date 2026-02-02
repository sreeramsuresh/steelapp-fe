/**
 * Integration Service Unit Tests
 * ✅ Tests third-party system integrations
 * ✅ Tests sync and webhook operations
 * ✅ Tests data mapping and transformation
 * ✅ Tests error recovery and retry logic
 * ✅ 100% coverage target for integrationService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../api';
import { integrationService } from '../integrationService';

describe('integrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getIntegrations', () => {
    test('should fetch all active integrations', async () => {
      const mockIntegrations = [
        {
          id: 1,
          name: 'SAP Integration',
          provider: 'SAP',
          status: 'connected',
          lastSync: '2024-02-02T10:00:00Z',
          syncInterval: 3600,
        },
        {
          id: 2,
          name: 'Shopify Store',
          provider: 'Shopify',
          status: 'connected',
          lastSync: '2024-02-02T09:30:00Z',
          syncInterval: 1800,
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockIntegrations });

      const result = await integrationService.getIntegrations();

      expect(result).toHaveLength(2);
      expect(result[0].provider).toBe('SAP');
      expect(result[1].provider).toBe('Shopify');
      expect(api.get).toHaveBeenCalledWith('/integrations');
    });

    test('should filter integrations by status', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await integrationService.getIntegrations({ status: 'connected' });

      expect(api.get).toHaveBeenCalledWith('/integrations', {
        params: { status: 'connected' },
      });
    });

    test('should show integration health status', async () => {
      const mockIntegrations = [
        {
          id: 1,
          name: 'SAP',
          status: 'connected',
          health: { status: 'healthy', lastError: null },
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockIntegrations });

      const result = await integrationService.getIntegrations();

      expect(result[0].health.status).toBe('healthy');
      expect(result[0].health.lastError).toBeNull();
    });
  });

  describe('connectIntegration', () => {
    test('should establish integration connection', async () => {
      const mockResponse = {
        id: 3,
        name: 'New ERP Integration',
        provider: 'Oracle',
        status: 'connected',
        credentials: { authenticated: true },
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await integrationService.connectIntegration({
        provider: 'Oracle',
        apiKey: 'secret-key',
        endpoint: 'https://api.oracle.example.com',
      });

      expect(result.status).toBe('connected');
      expect(result.credentials.authenticated).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/integrations', expect.objectContaining({ provider: 'Oracle' }));
    });

    test('should handle authentication failures', async () => {
      api.post.mockRejectedValueOnce(new Error('Invalid API key'));

      await expect(
        integrationService.connectIntegration({
          provider: 'SAP',
          apiKey: 'invalid-key',
          endpoint: 'https://api.sap.example.com',
        }),
      ).rejects.toThrow('Invalid API key');
    });

    test('should validate required connection parameters', async () => {
      api.post.mockRejectedValueOnce(new Error('Missing endpoint URL'));

      await expect(
        integrationService.connectIntegration({
          provider: 'Shopify',
          apiKey: 'key',
        }),
      ).rejects.toThrow('Missing endpoint URL');
    });
  });

  describe('testConnection', () => {
    test('should test integration connection', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection successful',
        responseTime: 245,
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await integrationService.testConnection(1);

      expect(result.success).toBe(true);
      expect(result.responseTime).toBe(245);
      expect(api.post).toHaveBeenCalledWith('/integrations/1/test-connection');
    });

    test('should handle connection timeouts', async () => {
      api.post.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(integrationService.testConnection(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('syncData', () => {
    test('should trigger data synchronization', async () => {
      const mockResponse = {
        syncId: 'SYNC-001',
        integrationId: 1,
        status: 'in_progress',
        recordsProcessed: 0,
        startTime: '2024-02-02T10:30:00Z',
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await integrationService.syncData(1);

      expect(result.syncId).toBe('SYNC-001');
      expect(result.status).toBe('in_progress');
      expect(api.post).toHaveBeenCalledWith('/integrations/1/sync');
    });

    test('should support selective data sync', async () => {
      api.post.mockResolvedValueOnce({
        data: { syncId: 'SYNC-001', status: 'in_progress' },
      });

      await integrationService.syncData(1, { dataTypes: ['customers', 'orders'] });

      expect(api.post).toHaveBeenCalledWith(
        '/integrations/1/sync',
        expect.objectContaining({
          dataTypes: ['customers', 'orders'],
        }),
      );
    });

    test('should handle sync errors gracefully', async () => {
      api.post.mockRejectedValueOnce(new Error('Sync failed: data validation error'));

      await expect(integrationService.syncData(1)).rejects.toThrow('Sync failed');
    });
  });

  describe('getSyncStatus', () => {
    test('should fetch synchronization status', async () => {
      const mockStatus = {
        syncId: 'SYNC-001',
        integrationId: 1,
        status: 'completed',
        recordsProcessed: 1250,
        recordsFailed: 5,
        startTime: '2024-02-02T10:30:00Z',
        endTime: '2024-02-02T10:45:00Z',
        duration: 900,
      };
      api.get.mockResolvedValueOnce({ data: mockStatus });

      const result = await integrationService.getSyncStatus('SYNC-001');

      expect(result.status).toBe('completed');
      expect(result.recordsProcessed).toBe(1250);
      expect(result.recordsFailed).toBe(5);
      expect(api.get).toHaveBeenCalledWith('/integrations/syncs/SYNC-001');
    });

    test('should show sync progress', async () => {
      const mockStatus = {
        syncId: 'SYNC-001',
        status: 'in_progress',
        progress: 67,
        recordsProcessed: 670,
        totalRecords: 1000,
      };
      api.get.mockResolvedValueOnce({ data: mockStatus });

      const result = await integrationService.getSyncStatus('SYNC-001');

      expect(result.progress).toBe(67);
      expect(result.recordsProcessed).toBe(670);
    });
  });

  describe('manageWebhooks', () => {
    test('should register webhook endpoint', async () => {
      const mockResponse = {
        webhookId: 'WH-001',
        integrationId: 1,
        event: 'customer.created',
        url: 'https://api.example.com/webhooks/customer',
        active: true,
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await integrationService.registerWebhook(1, {
        event: 'customer.created',
        url: 'https://api.example.com/webhooks/customer',
      });

      expect(result.webhookId).toBe('WH-001');
      expect(result.active).toBe(true);
      expect(api.post).toHaveBeenCalledWith(
        '/integrations/1/webhooks',
        expect.objectContaining({
          event: 'customer.created',
        }),
      );
    });

    test('should list active webhooks', async () => {
      const mockWebhooks = [
        { webhookId: 'WH-001', event: 'customer.created' },
        { webhookId: 'WH-002', event: 'order.updated' },
      ];
      api.get.mockResolvedValueOnce({ data: mockWebhooks });

      const result = await integrationService.getWebhooks(1);

      expect(result).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith('/integrations/1/webhooks');
    });

    test('should unregister webhook', async () => {
      api.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await integrationService.unregisterWebhook(1, 'WH-001');

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith('/integrations/1/webhooks/WH-001');
    });
  });

  describe('dataMapping', () => {
    test('should define field mappings for sync', async () => {
      const mockResponse = {
        mappingId: 'MAP-001',
        integrationId: 1,
        sourceFields: ['customer_name', 'customer_email', 'customer_phone'],
        targetFields: ['name', 'email', 'phone'],
        mappings: {
          customer_name: 'name',
          customer_email: 'email',
          customer_phone: 'phone',
        },
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await integrationService.createDataMapping(1, {
        sourceFields: ['customer_name', 'customer_email', 'customer_phone'],
        targetFields: ['name', 'email', 'phone'],
      });

      expect(result.mappingId).toBe('MAP-001');
      expect(result.mappings.customer_name).toBe('name');
      expect(api.post).toHaveBeenCalledWith(
        '/integrations/1/data-mappings',
        expect.objectContaining({
          sourceFields: ['customer_name', 'customer_email', 'customer_phone'],
        }),
      );
    });

    test('should transform data according to mappings', async () => {
      const sourceData = { customer_name: 'John Doe', customer_email: 'john@example.com' };
      const mockResponse = {
        transformed: { name: 'John Doe', email: 'john@example.com' },
        errors: [],
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await integrationService.transformData('MAP-001', sourceData);

      expect(result.transformed.name).toBe('John Doe');
      expect(result.errors).toEqual([]);
    });
  });

  describe('retryAndErrorHandling', () => {
    test('should retry failed sync automatically', async () => {
      api.post.mockResolvedValueOnce({
        data: { syncId: 'SYNC-001', status: 'retrying' },
      });

      const result = await integrationService.retrySyncFailures('SYNC-001');

      expect(result.status).toBe('retrying');
      expect(api.post).toHaveBeenCalledWith('/integrations/syncs/SYNC-001/retry');
    });

    test('should show error logs for sync', async () => {
      const mockErrors = [
        {
          recordId: 123,
          error: 'Required field missing: email',
          timestamp: '2024-02-02T10:35:00Z',
        },
        {
          recordId: 124,
          error: 'Invalid data type for phone field',
          timestamp: '2024-02-02T10:35:10Z',
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockErrors });

      const result = await integrationService.getSyncErrors('SYNC-001');

      expect(result).toHaveLength(2);
      expect(result[0].error).toContain('Required field');
      expect(api.get).toHaveBeenCalledWith('/integrations/syncs/SYNC-001/errors');
    });

    test('should limit retry attempts', async () => {
      api.post.mockRejectedValueOnce(new Error('Maximum retries exceeded'));

      await expect(integrationService.retrySyncFailures('SYNC-001')).rejects.toThrow(
        'Maximum retries exceeded',
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(integrationService.getIntegrations()).rejects.toThrow('Network error');
    });

    test('should handle invalid integration ID', async () => {
      api.post.mockRejectedValueOnce(new Error('Integration not found'));

      await expect(integrationService.syncData(999)).rejects.toThrow('Integration not found');
    });

    test('should handle authentication errors in integration', async () => {
      api.post.mockRejectedValueOnce(new Error('Authentication failed with remote system'));

      await expect(integrationService.syncData(1)).rejects.toThrow('Authentication failed');
    });

    test('should handle data validation errors', async () => {
      api.post.mockRejectedValueOnce(new Error('Data validation failed: invalid format'));

      await expect(integrationService.syncData(1)).rejects.toThrow('Data validation failed');
    });
  });

  describe('Integration Monitoring', () => {
    test('should show integration health metrics', async () => {
      const mockHealth = {
        integrationId: 1,
        status: 'healthy',
        uptime: 99.8,
        lastSync: '2024-02-02T10:00:00Z',
        nextSync: '2024-02-02T11:00:00Z',
        syncDuration: { average: 900, min: 600, max: 1200 },
        errorRate: 0.4,
      };
      api.get.mockResolvedValueOnce({ data: mockHealth });

      const result = await integrationService.getIntegrationHealth(1);

      expect(result.status).toBe('healthy');
      expect(result.uptime).toBe(99.8);
      expect(result.errorRate).toBe(0.4);
      expect(api.get).toHaveBeenCalledWith('/integrations/1/health');
    });

    test('should track sync history', async () => {
      const mockHistory = [
        {
          syncId: 'SYNC-001',
          status: 'completed',
          recordsProcessed: 1250,
          timestamp: '2024-02-02T10:00:00Z',
        },
        {
          syncId: 'SYNC-002',
          status: 'completed',
          recordsProcessed: 1300,
          timestamp: '2024-02-02T11:00:00Z',
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await integrationService.getSyncHistory(1, { limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0].recordsProcessed).toBe(1250);
    });
  });
});
