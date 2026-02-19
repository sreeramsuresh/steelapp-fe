/**
 * Category Policy Service Unit Tests (Node Native Test Runner)
 * Tests product category policies and pricing rules
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('categoryPolicyService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('listCategoryPolicies', () => {
    test('should fetch all category policies with active_only filter', async () => {
      const mockResponse = {
        data: {
          policies: [
            {
              id: 1,
              category: 'coil',
              pricing_mode: 'MT_ONLY',
              requires_weight: true,
            },
            {
              id: 2,
              category: 'sheet',
              pricing_mode: 'PCS_ONLY',
              requires_weight: false,
            },
          ],
          taxonomy_status: { is_frozen: false },
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/category-policies', {
        params: { active_only: true },
      });

      assert.strictEqual(result.data.policies.length, 2);
      assert.strictEqual(result.data.policies[0].category, 'coil');
    });

    test('should fetch policies with active_only false', async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: { policies: [], taxonomy_status: { is_frozen: false } },
      });

      const result = await apiClient.get('/category-policies', {
        params: { active_only: false },
      });

      assert.ok(result);
    });

    test('should handle API errors when fetching policies', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/category-policies', { params: { active_only: true } });
        assert.fail('Expected error');
      } catch (error) {
        assert.ok(error);
      }
    });
  });

  describe('getCategoryPolicy', () => {
    test('should fetch pricing policy for specific category', async () => {
      const mockPolicy = {
        data: {
          policy: {
            id: 1,
            category: 'coil',
            pricing_mode: 'MT_ONLY',
            requires_weight: true,
            is_frozen: false,
          },
          is_frozen: false,
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockPolicy);

      const result = await apiClient.get('/category-policies/coil');

      assert.strictEqual(result.data.policy.category, 'coil');
      assert.strictEqual(result.data.policy.pricing_mode, 'MT_ONLY');
    });

    test('should handle missing category policy', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Category not found'));

      try {
        await apiClient.get('/category-policies/invalid');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Category not found');
      }
    });
  });

  describe('getProductSubtypes', () => {
    test('should fetch all product subtypes without category filter', async () => {
      const mockResponse = {
        data: {
          subtypes: [
            { id: 1, name: 'Cold Rolled', category: 'sheet' },
            { id: 2, name: 'Hot Rolled', category: 'sheet' },
            { id: 3, name: 'Seamless', category: 'pipe' },
          ],
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/category-policies/subtypes/list', {
        params: {},
      });

      assert.strictEqual(result.data.subtypes.length, 3);
    });

    test('should fetch product subtypes with category filter', async () => {
      const mockResponse = {
        data: {
          subtypes: [
            { id: 1, name: 'Cold Rolled', category: 'sheet' },
            { id: 2, name: 'Hot Rolled', category: 'sheet' },
          ],
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/category-policies/subtypes/list', {
        params: { category: 'sheet' },
      });

      assert.strictEqual(result.data.subtypes.length, 2);
    });
  });

  describe('error handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/category-policies');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle server errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Server error'));

      try {
        await apiClient.get('/category-policies/invalid');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Server error');
      }
    });
  });
});
