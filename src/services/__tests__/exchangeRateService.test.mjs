/**
 * Exchange Rate Service Unit Tests (Node Native Test Runner)
 * ✅ Tests exchange rate CRUD operations
 * ✅ Tests currency conversion and formatting
 * ✅ Tests rate history and bulk import
 * ✅ 100% coverage target for exchangeRateService.js
 */

// Initialize test environment first
import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { api } from '../api.js';
import exchangeRateService from '../exchangeRateService.js';

describe('exchangeRateService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Get Exchange Rates', () => {
    test('should get all exchange rates', async () => {
      const mockRates = [
        { id: 1, fromCurrency: 'AED', toCurrency: 'USD', rate: 3.67 },
        { id: 2, fromCurrency: 'AED', toCurrency: 'EUR', rate: 4.01 },
      ];
      sinon.stub(api, 'get').resolves({ data: mockRates });

      const result = await exchangeRateService.getExchangeRates();

      assert.deepStrictEqual(result, mockRates);
      assert.ok(api.get.calledWith('/exchange-rates', { params: {} }));
    });

    test('should get latest rate for currency pair', async () => {
      const mockRate = { rate: 3.67, from: 'AED', to: 'USD', timestamp: '2026-02-01T09:00:00Z' };
      sinon.stub(api, 'get').resolves({ data: mockRate });

      const result = await exchangeRateService.getLatestRate('AED', 'USD');

      assert.strictEqual(result.rate, 3.67);
      assert.ok(api.get.calledWith('/exchange-rates/latest/AED/USD'));
    });

    test('should get all latest rates for base currency', async () => {
      const mockRates = {
        AED_USD: 3.67,
        AED_EUR: 4.01,
        AED_GBP: 4.58,
      };
      sinon.stub(api, 'get').resolves({ data: mockRates });

      const result = await exchangeRateService.getLatestRatesForBase('AED');

      assert.strictEqual(result.AED_USD, 3.67);
      assert.ok(api.get.calledWith('/exchange-rates/latest/AED'));
    });
  });

  describe('Exchange Rate CRUD', () => {
    test('should create new exchange rate', async () => {
      const newRate = { fromCurrency: 'AED', toCurrency: 'JPY', rate: 2.75 };
      const mockResponse = { id: 100, ...newRate };
      sinon.stub(api, 'post').resolves({ data: mockResponse });

      const result = await exchangeRateService.createExchangeRate(newRate);

      assert.strictEqual(result.id, 100);
      assert.ok(api.post.calledWith('/exchange-rates', newRate));
    });

    test('should update exchange rate', async () => {
      const updateData = { rate: 3.7 };
      const mockResponse = { id: 1, fromCurrency: 'AED', toCurrency: 'USD', rate: 3.7 };
      sinon.stub(api, 'put').resolves({ data: mockResponse });

      const result = await exchangeRateService.updateExchangeRate(1, updateData);

      assert.strictEqual(result.rate, 3.7);
      assert.ok(api.put.calledWith('/exchange-rates/1', updateData));
    });

    test('should delete exchange rate', async () => {
      sinon.stub(api, 'delete').resolves({ data: { success: true } });

      const result = await exchangeRateService.deleteExchangeRate(1);

      assert.strictEqual(result.success, true);
      assert.ok(api.delete.calledWith('/exchange-rates/1'));
    });
  });

  describe('Currency Conversion', () => {
    test('should convert amount between currencies', async () => {
      const conversionData = { amount: 100, from: 'AED', to: 'USD' };
      const mockResult = { convertedAmount: 27.25, from: 'AED', to: 'USD', rate: 3.67 };
      sinon.stub(api, 'post').resolves({ data: mockResult });

      const result = await exchangeRateService.convertCurrency(conversionData);

      // Check closeness to 2 decimal places (27.25)
      assert.ok(Math.abs(result.convertedAmount - 27.25) < 0.01);
      assert.ok(api.post.calledWith('/exchange-rates/convert', conversionData));
    });

    test('should handle currency conversion error', async () => {
      sinon.stub(api, 'post').rejects(new Error('Invalid currency'));

      try {
        await exchangeRateService.convertCurrency({ amount: 100, from: 'XXX', to: 'YYY' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid currency');
      }
    });
  });

  describe('Bulk Import', () => {
    test('should bulk import exchange rates', async () => {
      const importData = [
        { fromCurrency: 'AED', toCurrency: 'USD', rate: 3.67 },
        { fromCurrency: 'AED', toCurrency: 'EUR', rate: 4.01 },
      ];
      const mockResponse = { imported: 2, failed: 0 };
      sinon.stub(api, 'post').resolves({ data: mockResponse });

      const result = await exchangeRateService.bulkImportRates(importData);

      assert.strictEqual(result.imported, 2);
      assert.ok(api.post.calledWith('/exchange-rates/bulk-import', importData));
    });
  });

  describe('Supported Currencies', () => {
    test('should get list of supported currencies', async () => {
      const mockCurrencies = ['AED', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'KWD'];
      sinon.stub(api, 'get').resolves({ data: mockCurrencies });

      const result = await exchangeRateService.getCurrencies();

      assert.ok(result.includes('AED'));
      assert.ok(result.includes('USD'));
      assert.strictEqual(result.length, 7);
      assert.ok(api.get.calledWith('/exchange-rates/currencies/list'));
    });
  });

  describe('Rate History', () => {
    test('should get rate history for currency pair', async () => {
      const mockHistory = [
        { rate: 3.67, date: '2026-02-01' },
        { rate: 3.68, date: '2026-01-31' },
        { rate: 3.65, date: '2026-01-30' },
      ];
      sinon.stub(api, 'get').resolves({ data: mockHistory });

      const result = await exchangeRateService.getRateHistory('AED', 'USD', 30);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].rate, 3.67);
      assert.ok(
        api.get.calledWith('/exchange-rates/history/AED/USD', {
          params: { days: 30 },
        })
      );
    });

    test('should use default days parameter (30)', async () => {
      sinon.stub(api, 'get').resolves({ data: [] });

      await exchangeRateService.getRateHistory('AED', 'USD');

      assert.ok(
        api.get.calledWith('/exchange-rates/history/AED/USD', {
          params: { days: 30 },
        })
      );
    });
  });

  describe('Formatting', () => {
    test('should format amount as currency', () => {
      const formatted = exchangeRateService.formatCurrency(1234.56, 'AED');

      assert.ok(formatted.includes('1,234.56'));
      assert.ok(formatted.includes('AED'));
    });

    test('should use AED as default currency for formatting', () => {
      const formatted = exchangeRateService.formatCurrency(100);

      assert.ok(formatted.includes('100.00'));
      assert.ok(formatted.includes('AED'));
    });

    test('should format exchange rate display', () => {
      const formatted = exchangeRateService.formatRate(3.67, 'AED', 'USD');

      assert.strictEqual(formatted, '1 AED = 3.6700 USD');
    });

    test('should format rate with 4 decimal places', () => {
      const formatted = exchangeRateService.formatRate(3.6789, 'AED', 'USD');

      assert.strictEqual(formatted, '1 AED = 3.6789 USD');
    });
  });

  describe('Error Handling', () => {
    test('should handle network error in getExchangeRates', async () => {
      sinon.stub(api, 'get').rejects(new Error('Network timeout'));

      try {
        await exchangeRateService.getExchangeRates();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network timeout');
      }
    });

    test('should handle error in getLatestRate', async () => {
      sinon.stub(api, 'get').rejects(new Error('Rate not found'));

      try {
        await exchangeRateService.getLatestRate('XXX', 'YYY');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Rate not found');
      }
    });

    test('should handle error in createExchangeRate', async () => {
      sinon.stub(api, 'post').rejects(new Error('Validation failed'));

      try {
        await exchangeRateService.createExchangeRate({});
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Validation failed');
      }
    });

    test('should handle error in updateExchangeRate', async () => {
      sinon.stub(api, 'put').rejects(new Error('Rate not found'));

      try {
        await exchangeRateService.updateExchangeRate(999, { rate: 4.0 });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Rate not found');
      }
    });

    test('should handle error in deleteExchangeRate', async () => {
      sinon.stub(api, 'delete').rejects(new Error('Rate not found'));

      try {
        await exchangeRateService.deleteExchangeRate(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Rate not found');
      }
    });

    test('should handle error in bulkImportRates', async () => {
      sinon.stub(api, 'post').rejects(new Error('Import failed'));

      try {
        await exchangeRateService.bulkImportRates([]);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Import failed');
      }
    });

    test('should handle error in getCurrencies', async () => {
      sinon.stub(api, 'get').rejects(new Error('Network error'));

      try {
        await exchangeRateService.getCurrencies();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle error in getRateHistory', async () => {
      sinon.stub(api, 'get').rejects(new Error('History not available'));

      try {
        await exchangeRateService.getRateHistory('AED', 'USD');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'History not available');
      }
    });
  });
});
