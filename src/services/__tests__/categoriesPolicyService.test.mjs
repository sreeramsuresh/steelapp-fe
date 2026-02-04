/**
 * Category Policy Service Unit Tests (Node Native Test Runner)
 * Tests product category policies and rules
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { categoryPolicyService } from '../categoryPolicyService.js';

describe('categoryPolicyService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getPolicies', () => {
    test('should fetch category policies', async () => {
      const mockPolicies = [
        { id: 1, category: 'sheet', minMargin: 10, maxDiscount: 20 },
        { id: 2, category: 'pipe', minMargin: 12, maxDiscount: 15 },
      ];
      sinon.stub(apiClient, 'get').resolves(mockPolicies);

      const result = await categoryPolicyService.getPolicies();

      assert.strictEqual(result.length, 2);
      assert.ok(apiClient.get.called);
    });
  });

  describe('getPolicy', () => {
    test('should fetch single category policy', async () => {
      const mockPolicy = { id: 1, category: 'sheet', minMargin: 10 };
      sinon.stub(apiClient, 'get').resolves(mockPolicy);

      const result = await categoryPolicyService.getPolicy('sheet');

      assert.strictEqual(result.category, 'sheet');
      assert.ok(apiClient.get.called);
    });
  });

  describe('updatePolicy', () => {
    test('should update category policy', async () => {
      const updates = { minMargin: 15, maxDiscount: 18 };
      const mockResponse = { id: 1, ...updates };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await categoryPolicyService.updatePolicy(1, updates);

      assert.strictEqual(result.minMargin, 15);
      assert.ok(apiClient.put.called);
    });
  });

  describe('validatePricing', () => {
    test('should validate pricing against policy', async () => {
      const mockResult = { valid: true, margin: 15, withinLimits: true };
      sinon.stub(apiClient, 'post').resolves(mockResult);

      const result = await categoryPolicyService.validatePricing({
        category: 'sheet',
        price: 1000,
        cost: 850,
      });

      assert.strictEqual(result.valid, true);
      assert.ok(apiClient.post.called);
    });
  });
});
