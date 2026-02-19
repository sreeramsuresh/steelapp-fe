/**
 * Pinned Products Service Unit Tests (Node Native Test Runner)
 * Tests user's pinned products management
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { pinnedProductsService } from '../pinnedProductsService.js';

describe('pinnedProductsService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getPinnedProducts', () => {
    test('should fetch user\'s pinned products', async () => {
      const mockResponse = [
        {
          id: 1,
          product_id: 100,
          product_name: 'SS304 Sheet 2B 1220×2×2440',
          category: 'sheet',
          pinned_at: '2024-01-10T10:00:00Z',
          order: 1,
        },
        {
          id: 2,
          product_id: 101,
          product_name: 'SS316L Pipe BA 2inch Sch40',
          category: 'pipe',
          pinned_at: '2024-01-15T14:00:00Z',
          order: 2,
        },
      ];

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await pinnedProductsService.getPinnedProducts();

      assert.strictEqual(result.length, 2);
      assert.ok(result[0].product_name.includes('SS304'));
      assert.ok(apiClient.get.calledWith('/pinned-products'));
    });

    test('should return empty array if no products pinned', async () => {
      sinon.stub(apiClient, 'get').resolves([]);

      const result = await pinnedProductsService.getPinnedProducts();

      assert.strictEqual(result.length, 0);
      assert.ok(apiClient.get.calledWith('/pinned-products'));
    });
  });

  describe('pinProduct', () => {
    test('should pin product to user\'s favorites', async () => {
      const mockResponse = {
        id: 1,
        product_id: 100,
        product_name: 'SS304 Sheet 2B 1220×2×2440',
        pinned_at: '2024-01-15T10:00:00Z',
        order: 1,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await pinnedProductsService.pinProduct(100);

      assert.strictEqual(result.product_id, 100);
      assert.ok(result.pinned_at);
      assert.ok(apiClient.post.calledWith('/pinned-products/100'));
    });

    test('should handle multiple product pins', async () => {
      sinon.stub(apiClient, 'post').resolves({
        id: 2,
        product_id: 101,
        pinned_at: '2024-01-15T15:00:00Z',
      });

      const result = await pinnedProductsService.pinProduct(101);

      assert.strictEqual(result.product_id, 101);
      assert.ok(apiClient.post.calledWith('/pinned-products/101'));
    });
  });

  describe('unpinProduct', () => {
    test('should remove product from pinned list', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await pinnedProductsService.unpinProduct(100);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith('/pinned-products/100'));
    });

    test('should handle unpinning non-existent pin', async () => {
      sinon.stub(apiClient, 'delete').resolves({
        success: false,
        error: 'Pinned product not found',
      });

      const result = await pinnedProductsService.unpinProduct(999);

      assert.strictEqual(result.success, false);
    });
  });
});
