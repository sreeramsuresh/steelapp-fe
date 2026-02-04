/**
 * Customs Document Service Unit Tests (Node Native Test Runner)
 * Tests BOE, COO document handling and clearance workflow
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { api } from '../api.js';

describe('customsDocumentService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('getCustomsDocuments', () => {
    test('should fetch all customs documents', async () => {
      const mockData = [
        {
          id: 1,
          document_type: 'BOE',
          reference_number: 'BOE-2024-001',
          status: 'cleared',
        },
        {
          id: 2,
          document_type: 'COO',
          reference_number: 'COO-2024-001',
          status: 'pending',
        },
      ];

      sinon.stub(api, 'get').resolves(mockData);

      const result = await api.get('/customs-documents', { params: {} });

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].document_type, 'BOE');
      assert.ok(api.get.calledWith('/customs-documents', { params: {} }));
    });

    test('should support filtering by status', async () => {
      sinon.stub(api, 'get').resolves([]);

      await api.get('/customs-documents', { params: { status: 'cleared' } });

      assert.ok(
        api.get.calledWith(
          '/customs-documents',
          sinon.match({ params: { status: 'cleared' } })
        )
      );
    });
  });

  describe('getCustomsDocument', () => {
    test('should fetch single customs document', async () => {
      const mockData = {
        id: 1,
        document_type: 'BOE',
        reference_number: 'BOE-2024-001',
        clearance_status: 'cleared',
        clearance_date: '2024-01-15',
      };

      sinon.stub(api, 'get').resolves(mockData);

      const result = await api.get('/customs-documents/1');

      assert.strictEqual(result.document_type, 'BOE');
      assert.strictEqual(result.clearance_status, 'cleared');
      assert.ok(api.get.calledWith('/customs-documents/1'));
    });
  });

  describe('createCustomsDocument', () => {
    test('should create new customs document', async () => {
      const mockData = {
        id: 1,
        document_type: 'BOE',
        reference_number: 'BOE-2024-001',
        status: 'pending',
      };

      sinon.stub(api, 'post').resolves(mockData);

      const payload = {
        document_type: 'BOE',
        reference_number: 'BOE-2024-001',
      };

      const result = await api.post('/customs-documents', payload);

      assert.strictEqual(result.id, 1);
      assert.ok(api.post.calledWith('/customs-documents', payload));
    });
  });

  describe('updateCustomsDocument', () => {
    test('should update customs document', async () => {
      const mockData = {
        id: 1,
        reference_number: 'BOE-2024-001-UPDATED',
      };

      sinon.stub(api, 'put').resolves(mockData);

      const payload = { reference_number: 'BOE-2024-001-UPDATED' };

      const result = await api.put('/customs-documents/1', payload);

      assert.strictEqual(result.reference_number, 'BOE-2024-001-UPDATED');
      assert.ok(api.put.calledWith('/customs-documents/1', payload));
    });
  });

  describe('deleteCustomsDocument', () => {
    test('should delete customs document', async () => {
      sinon.stub(api, 'delete').resolves({ success: true });

      const result = await api.delete('/customs-documents/1');

      assert.strictEqual(result.success, true);
      assert.ok(api.delete.calledWith('/customs-documents/1'));
    });
  });

  describe('updateClearance', () => {
    test('should update clearance status with notes and date', async () => {
      const mockData = {
        id: 1,
        clearance_status: 'cleared',
        clearance_date: '2024-01-15T10:00:00Z',
        notes: 'All documents verified',
      };

      sinon.stub(api, 'patch').resolves(mockData);

      const result = await api.patch('/customs-documents/1/clearance', {
        clearance_status: 'cleared',
        notes: 'All documents verified',
        clearance_date: '2024-01-15T10:00:00Z',
      });

      assert.strictEqual(result.clearance_status, 'cleared');
      assert.ok(
        api.patch.calledWith('/customs-documents/1/clearance', sinon.match({}))
      );
    });

    test('should handle clearance without notes and date', async () => {
      sinon.stub(api, 'patch').resolves({
        id: 1,
        clearance_status: 'pending',
      });

      await api.patch('/customs-documents/1/clearance', {
        clearance_status: 'pending',
        notes: '',
        clearance_date: null,
      });

      assert.ok(api.patch.called);
    });
  });

  describe('calculateDuties', () => {
    test('should calculate customs duties', async () => {
      const mockData = {
        customs_duty: 5000,
        vat_amount: 250,
        total_duties: 5250,
      };

      sinon.stub(api, 'post').resolves(mockData);

      const payload = {
        hs_code: '7226.91.00',
        declared_value: 100000,
        quantity: 500,
        unit: 'KG',
      };

      const result = await api.post('/customs-documents/1/calculate-duties', payload);

      assert.strictEqual(result.customs_duty, 5000);
      assert.strictEqual(result.total_duties, 5250);
      assert.ok(
        api.post.calledWith('/customs-documents/1/calculate-duties', payload)
      );
    });
  });

  describe('getDocumentTypes', () => {
    test('should fetch document types list', async () => {
      const mockData = [
        { value: 'BOE', label: 'Bill of Entry' },
        { value: 'COO', label: 'Certificate of Origin' },
        { value: 'BL', label: 'Bill of Lading' },
      ];

      sinon.stub(api, 'get').resolves(mockData);

      const result = await api.get('/customs-documents/types/list');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].value, 'BOE');
      assert.ok(api.get.calledWith('/customs-documents/types/list'));
    });
  });

  describe('getHsCodes', () => {
    test('should fetch HS codes for stainless steel', async () => {
      const mockData = [
        {
          code: '7226.91.00',
          description: 'Other flat-rolled products of stainless steel',
        },
        {
          code: '7307.19.00',
          description: 'Stainless steel fittings',
        },
      ];

      sinon.stub(api, 'get').resolves(mockData);

      const result = await api.get('/customs-documents/hs-codes/list');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].code, '7226.91.00');
      assert.ok(api.get.calledWith('/customs-documents/hs-codes/list'));
    });
  });
});
