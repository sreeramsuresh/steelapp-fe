/**
 * Category Policy Service Unit Tests (Node Native Test Runner)
 * Tests product category policies and rules
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { categoryPolicyService } from '../categoryPolicyService.js';

describe('categoryPolicyService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPolicies', () => {
    it('should fetch category policies', async () => {
      const mockPolicies = [
        { id: 1, category: 'sheet', minMargin: 10, maxDiscount: 20 },
        { id: 2, category: 'pipe', minMargin: 12, maxDiscount: 15 },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPolicies);

      const result = await categoryPolicyService.getPolicies();

      expect(result.length).toBe(2);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getPolicy', () => {
    it('should fetch single category policy', async () => {
      const mockPolicy = { id: 1, category: 'sheet', minMargin: 10 };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPolicy);

      const result = await categoryPolicyService.getPolicy('sheet');

      expect(result.category).toBe('sheet');
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('updatePolicy', () => {
    it('should update category policy', async () => {
      const updates = { minMargin: 15, maxDiscount: 18 };
      const mockResponse = { id: 1, ...updates };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await categoryPolicyService.updatePolicy(1, updates);

      expect(result.minMargin).toBe(15);
      expect(apiClient.put.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('validatePricing', () => {
    it('should validate pricing against policy', async () => {
      const mockResult = { valid: true, margin: 15, withinLimits: true };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResult);

      const result = await categoryPolicyService.validatePricing({
        category: 'sheet',
        price: 1000,
        cost: 850,
      });

      expect(result.valid).toBe(true);
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });
  });
});
