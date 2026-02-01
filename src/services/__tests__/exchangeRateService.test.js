/**
 * Exchange Rate Service Unit Tests
 * ✅ Tests exchange rate CRUD operations
 * ✅ Tests currency conversion and formatting
 * ✅ Tests rate history and bulk import
 * ✅ 100% coverage target for exchangeRateService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { exchangeRateService } from '../exchangeRateService';
import { api } from '../api';

describe('exchangeRateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Get Exchange Rates', () => {
    test('should get all exchange rates', async () => {
      const mockRates = [
        { id: 1, fromCurrency: 'AED', toCurrency: 'USD', rate: 3.67 },
        { id: 2, fromCurrency: 'AED', toCurrency: 'EUR', rate: 4.01 },
      ];
      api.get.mockResolvedValueOnce({ data: mockRates });

      const result = await exchangeRateService.getExchangeRates();

      expect(result).toEqual(mockRates);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates', { params: {} });
    });

    test('should get latest rate for currency pair', async () => {
      const mockRate = { rate: 3.67, from: 'AED', to: 'USD', timestamp: '2026-02-01T09:00:00Z' };
      api.get.mockResolvedValueOnce({ data: mockRate });

      const result = await exchangeRateService.getLatestRate('AED', 'USD');

      expect(result.rate).toBe(3.67);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/latest/AED/USD');
    });

    test('should get all latest rates for base currency', async () => {
      const mockRates = {
        AED_USD: 3.67,
        AED_EUR: 4.01,
        AED_GBP: 4.58,
      };
      api.get.mockResolvedValueOnce({ data: mockRates });

      const result = await exchangeRateService.getLatestRatesForBase('AED');

      expect(result.AED_USD).toBe(3.67);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/latest/AED');
    });
  });

  describe('Exchange Rate CRUD', () => {
    test('should create new exchange rate', async () => {
      const newRate = { fromCurrency: 'AED', toCurrency: 'JPY', rate: 2.75 };
      const mockResponse = { id: 100, ...newRate };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await exchangeRateService.createExchangeRate(newRate);

      expect(result.id).toBe(100);
      expect(api.post).toHaveBeenCalledWith('/exchange-rates', newRate);
    });

    test('should update exchange rate', async () => {
      const updateData = { rate: 3.70 };
      const mockResponse = { id: 1, fromCurrency: 'AED', toCurrency: 'USD', rate: 3.70 };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await exchangeRateService.updateExchangeRate(1, updateData);

      expect(result.rate).toBe(3.70);
      expect(api.put).toHaveBeenCalledWith('/exchange-rates/1', updateData);
    });

    test('should delete exchange rate', async () => {
      api.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await exchangeRateService.deleteExchangeRate(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith('/exchange-rates/1');
    });
  });

  describe('Currency Conversion', () => {
    test('should convert amount between currencies', async () => {
      const conversionData = { amount: 100, from: 'AED', to: 'USD' };
      const mockResult = { convertedAmount: 27.25, from: 'AED', to: 'USD', rate: 3.67 };
      api.post.mockResolvedValueOnce({ data: mockResult });

      const result = await exchangeRateService.convertCurrency(conversionData);

      expect(result.convertedAmount).toBeCloseTo(27.25, 1);
      expect(api.post).toHaveBeenCalledWith('/exchange-rates/convert', conversionData);
    });

    test('should handle currency conversion error', async () => {
      api.post.mockRejectedValueOnce(new Error('Invalid currency'));

      await expect(
        exchangeRateService.convertCurrency({ amount: 100, from: 'XXX', to: 'YYY' }),
      ).rejects.toThrow('Invalid currency');
    });
  });

  describe('Bulk Import', () => {
    test('should bulk import exchange rates', async () => {
      const importData = [
        { fromCurrency: 'AED', toCurrency: 'USD', rate: 3.67 },
        { fromCurrency: 'AED', toCurrency: 'EUR', rate: 4.01 },
      ];
      const mockResponse = { imported: 2, failed: 0 };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await exchangeRateService.bulkImportRates(importData);

      expect(result.imported).toBe(2);
      expect(api.post).toHaveBeenCalledWith('/exchange-rates/bulk-import', importData);
    });
  });

  describe('Supported Currencies', () => {
    test('should get list of supported currencies', async () => {
      const mockCurrencies = ['AED', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'KWD'];
      api.get.mockResolvedValueOnce({ data: mockCurrencies });

      const result = await exchangeRateService.getCurrencies();

      expect(result).toContain('AED');
      expect(result).toContain('USD');
      expect(result).toHaveLength(7);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/currencies/list');
    });
  });

  describe('Rate History', () => {
    test('should get rate history for currency pair', async () => {
      const mockHistory = [
        { rate: 3.67, date: '2026-02-01' },
        { rate: 3.68, date: '2026-01-31' },
        { rate: 3.65, date: '2026-01-30' },
      ];
      api.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await exchangeRateService.getRateHistory('AED', 'USD', 30);

      expect(result).toHaveLength(3);
      expect(result[0].rate).toBe(3.67);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/history/AED/USD', {
        params: { days: 30 },
      });
    });

    test('should use default days parameter (30)', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await exchangeRateService.getRateHistory('AED', 'USD');

      expect(api.get).toHaveBeenCalledWith('/exchange-rates/history/AED/USD', {
        params: { days: 30 },
      });
    });
  });

  describe('Formatting', () => {
    test('should format amount as currency', () => {
      const formatted = exchangeRateService.formatCurrency(1234.56, 'AED');

      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('AED');
    });

    test('should use AED as default currency for formatting', () => {
      const formatted = exchangeRateService.formatCurrency(100);

      expect(formatted).toContain('100.00');
      expect(formatted).toContain('AED');
    });

    test('should format exchange rate display', () => {
      const formatted = exchangeRateService.formatRate(3.67, 'AED', 'USD');

      expect(formatted).toBe('1 AED = 3.6700 USD');
    });

    test('should format rate with 4 decimal places', () => {
      const formatted = exchangeRateService.formatRate(3.6789, 'AED', 'USD');

      expect(formatted).toBe('1 AED = 3.6789 USD');
    });
  });

  describe('Error Handling', () => {
    test('should handle network error in getExchangeRates', async () => {
      api.get.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        exchangeRateService.getExchangeRates(),
      ).rejects.toThrow('Network timeout');
    });

    test('should handle error in getLatestRate', async () => {
      api.get.mockRejectedValueOnce(new Error('Rate not found'));

      await expect(
        exchangeRateService.getLatestRate('XXX', 'YYY'),
      ).rejects.toThrow('Rate not found');
    });

    test('should handle error in createExchangeRate', async () => {
      api.post.mockRejectedValueOnce(new Error('Validation failed'));

      await expect(
        exchangeRateService.createExchangeRate({}),
      ).rejects.toThrow('Validation failed');
    });

    test('should handle error in updateExchangeRate', async () => {
      api.put.mockRejectedValueOnce(new Error('Rate not found'));

      await expect(
        exchangeRateService.updateExchangeRate(999, { rate: 4.0 }),
      ).rejects.toThrow('Rate not found');
    });

    test('should handle error in deleteExchangeRate', async () => {
      api.delete.mockRejectedValueOnce(new Error('Rate not found'));

      await expect(
        exchangeRateService.deleteExchangeRate(999),
      ).rejects.toThrow('Rate not found');
    });

    test('should handle error in bulkImportRates', async () => {
      api.post.mockRejectedValueOnce(new Error('Import failed'));

      await expect(
        exchangeRateService.bulkImportRates([]),
      ).rejects.toThrow('Import failed');
    });

    test('should handle error in getCurrencies', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        exchangeRateService.getCurrencies(),
      ).rejects.toThrow('Network error');
    });

    test('should handle error in getRateHistory', async () => {
      api.get.mockRejectedValueOnce(new Error('History not available'));

      await expect(
        exchangeRateService.getRateHistory('AED', 'USD'),
      ).rejects.toThrow('History not available');
    });
  });
});
