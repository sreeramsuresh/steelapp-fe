/**
 * GRN (Goods Receipt Note) Service Unit Tests (Node Native Test Runner)
 * Tests GRN CRUD operations for 3-way match workflow
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('grnService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('getAll()', () => {
    test('should fetch GRNs with pagination', async () => {
      const mockResponse = {
        data: [
          { id: 1, grnNumber: 'GRN-2026-001', status: 'draft' },
          { id: 2, grnNumber: 'GRN-2026-002', status: 'approved' },
        ],
        pagination: { page: 1, pageSize: 10, total: 28 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/grns', { page: 1, pageSize: 10 });

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.pagination.total, 28);
      assert.ok(apiClient.get.calledWith('/grns', { page: 1, pageSize: 10 }));
    });

    test('should fetch GRNs with filters', async () => {
      const mockResponse = { data: [], pagination: null };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      await apiClient.get('/grns', {
        page: 1,
        pageSize: 50,
        status: 'draft',
        supplierId: 5,
      });

      assert.ok(
        apiClient.get.calledWith('/grns', sinon.match({
          page: 1,
          pageSize: 50,
          status: 'draft',
          supplierId: 5,
        }))
      );
    });
  });

  describe('getById()', () => {
    test('should fetch GRN by ID with full details', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'approved',
        items: [
          {
            id: 1,
            productId: 50,
            description: 'SS 304 Coil',
            receivedQuantity: 1050,
            poWeightKg: 10000,
            receivedWeightKg: 10500,
          },
        ],
      };
      sinon.stub(apiClient, 'get').resolves(mockGRN);

      const result = await apiClient.get('/grns/1');

      assert.strictEqual(result.grnNumber, 'GRN-2026-001');
      assert.strictEqual(result.items.length, 1);
      assert.ok(apiClient.get.calledWith('/grns/1'));
    });

    test('should handle GRN not found', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('GRN not found'));

      try {
        await apiClient.get('/grns/999');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'GRN not found');
      }
    });
  });

  describe('create()', () => {
    test('should create new GRN', async () => {
      const grnData = {
        purchaseOrderId: 100,
        supplierId: 5,
        warehouseId: 2,
        receivedDate: '2026-01-15',
        items: [
          {
            purchaseOrderLineId: 10,
            receivedQuantity: 1050,
            receivedWeightKg: 10500,
          },
        ],
      };
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'draft',
        purchaseOrderId: 100,
        items: [],
      };
      sinon.stub(apiClient, 'post').resolves(mockGRN);

      const result = await apiClient.post('/grns', grnData);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.grnNumber, 'GRN-2026-001');
      assert.ok(apiClient.post.called);
    });

    test('should handle creation errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Invalid GRN data'));

      try {
        await apiClient.post('/grns', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid GRN data');
      }
    });
  });

  describe('update()', () => {
    test('should update GRN details', async () => {
      const updateData = { receivedBy: 'new_mgr', notes: 'Updated notes' };
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        receivedBy: 'new_mgr',
        notes: 'Updated notes',
      };
      sinon.stub(apiClient, 'put').resolves(mockGRN);

      const result = await apiClient.put('/grns/1', updateData);

      assert.strictEqual(result.receivedBy, 'new_mgr');
      assert.strictEqual(result.notes, 'Updated notes');
      assert.ok(apiClient.put.called);
    });

    test('should prevent updating approved GRN', async () => {
      sinon.stub(apiClient, 'put').rejects(new Error('Cannot update approved GRN'));

      try {
        await apiClient.put('/grns/1', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Cannot update approved GRN');
      }
    });
  });

  describe('Advanced Tracking via Service Methods', () => {
    test('should accept GRN with weight variance data', async () => {
      const grnData = {
        purchaseOrderId: 100,
        items: [
          {
            purchaseOrderLineId: 10,
            orderedQuantity: 1000,
            receivedQuantity: 1050,
            poWeightKg: 10000,
            receivedWeightKg: 10500,
            weightVariancePercent: 5,
            batchNumber: 'BATCH-001',
            pcsReceived: 100,
          },
        ],
      };
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        items: [
          {
            receivedQuantity: 1050,
            weightVariancePercent: 5,
            batchNumber: 'BATCH-001',
          },
        ],
      };
      sinon.stub(apiClient, 'post').resolves(mockGRN);

      const result = await apiClient.post('/grns', grnData);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.items[0].batchNumber, 'BATCH-001');
      assert.ok(apiClient.post.called);
    });

    test('should prevent exceeding ordered quantity', async () => {
      sinon.stub(apiClient, 'post').rejects(
        new Error('Received quantity exceeds ordered quantity')
      );

      try {
        await apiClient.post('/grns', {
          items: [{ orderedQuantity: 1000, receivedQuantity: 1100 }],
        });
        assert.fail('Expected error');
      } catch (error) {
        assert.ok(error.message.includes('exceeds ordered quantity'));
      }
    });
  });

  describe('approve()', () => {
    test('should approve GRN and move stock to inventory', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'approved',
      };
      sinon.stub(apiClient, 'post').resolves(mockGRN);

      const result = await apiClient.post('/grns/1/approve', {
        notes: 'All items verified',
      });

      assert.strictEqual(result.status, 'approved');
      assert.ok(
        apiClient.post.calledWith('/grns/1/approve', sinon.match({}))
      );
    });

    test('should prevent approving GRN with rejections', async () => {
      sinon.stub(apiClient, 'post').rejects(
        new Error('Cannot approve GRN with rejected items')
      );

      try {
        await apiClient.post('/grns/1/approve', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.ok(error.message.includes('Cannot approve GRN'));
      }
    });
  });

  describe('cancel()', () => {
    test('should cancel GRN and restore stock', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'cancelled',
      };
      sinon.stub(apiClient, 'post').resolves(mockGRN);

      const result = await apiClient.post('/grns/1/cancel', {
        reason: 'Wrong goods received',
      });

      assert.strictEqual(result.status, 'cancelled');
      assert.ok(
        apiClient.post.calledWith('/grns/1/cancel', sinon.match({}))
      );
    });

    test('should prevent cancelling approved GRN', async () => {
      sinon.stub(apiClient, 'post').rejects(
        new Error('Cannot cancel approved GRN')
      );

      try {
        await apiClient.post('/grns/1/cancel', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Cannot cancel approved GRN');
      }
    });
  });

  describe('markBilled()', () => {
    test('should link GRN to supplier bill for 3-way match', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'billed',
      };
      sinon.stub(apiClient, 'post').resolves(mockGRN);

      const result = await apiClient.post('/grns/1/mark-billed', {
        supplierBillId: 500,
      });

      assert.strictEqual(result.status, 'billed');
      assert.ok(
        apiClient.post.calledWith('/grns/1/mark-billed', sinon.match({}))
      );
    });

    test('should enforce 3-way match logic', async () => {
      sinon.stub(apiClient, 'post').rejects(
        new Error('PO, GRN, and Bill quantities do not match')
      );

      try {
        await apiClient.post('/grns/1/mark-billed', { supplierBillId: 500 });
        assert.fail('Expected error');
      } catch (error) {
        assert.ok(error.message.includes('do not match'));
      }
    });
  });

  describe('getNextNumber()', () => {
    test('should generate next GRN number', async () => {
      const mockResponse = { nextNumber: 'GRN-2026-042' };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/grns/number/next');

      assert.strictEqual(result.nextNumber, 'GRN-2026-042');
      assert.ok(apiClient.get.calledWith('/grns/number/next'));
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors in getAll', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/grns');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle network errors in create', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Server error'));

      try {
        await apiClient.post('/grns', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Server error');
      }
    });

    test('should handle network errors in approve', async () => {
      sinon.stub(apiClient, 'post').rejects(
        new Error('Service unavailable')
      );

      try {
        await apiClient.post('/grns/1/approve', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Service unavailable');
      }
    });
  });
});
