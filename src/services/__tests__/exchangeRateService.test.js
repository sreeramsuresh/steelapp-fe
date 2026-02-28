/**
 * Exchange Rate Service Unit Tests (Node Native Test Runner)
 * ✅ Tests exchange rate CRUD operations
 * ✅ Tests currency conversion and formatting
 * ✅ Tests rate history and bulk import
 * ✅ 100% coverage target for exchangeRateService.js
 */

// Initialize test environment first
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { api } from '../api.js';
import exchangeRateService from '../exchangeRateService.js';

describe('exchangeRateService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Get Exchange Rates', () => {
    it('should get all exchange rates', async () => {
      const mockRates = [
        { id: 1, fromCurrency: 'AED', toCurrency: 'USD', rate: 3.67 },
        { id: 2, fromCurrency: 'AED', toCurrency: 'EUR', rate: 4.01 },
      ];
      vi.spyOn(api, 'get').mockResolvedValue(mockRates);

      const result = await exchangeRateService.getExchangeRates();

      expect(result).toEqual(mockRates);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates', { params: {} });
    });

    it('should get latest rate for currency pair', async () => {
      const mockRate = { rate: 3.67, from: 'AED', to: 'USD', timestamp: '2026-02-01T09:00:00Z' };
      vi.spyOn(api, 'get').mockResolvedValue(mockRate);

      const result = await exchangeRateService.getLatestRate('AED', 'USD');

      expect(result.rate).toBe(3.67);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/latest/AED/USD');
    });

    it('should get all latest rates for base currency', async () => {
      const mockRates = {
        AED_USD: 3.67,
        AED_EUR: 4.01,
        AED_GBP: 4.58,
      };
      vi.spyOn(api, 'get').mockResolvedValue(mockRates);

      const result = await exchangeRateService.getLatestRatesForBase('AED');

      expect(result.AED_USD).toBe(3.67);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/latest/AED');
    });
  });

  describe('Exchange Rate CRUD', () => {
    it('should create new exchange rate', async () => {
      const newRate = { fromCurrency: 'AED', toCurrency: 'JPY', rate: 2.75 };
      const mockResponse = { id: 100, ...newRate };
      vi.spyOn(api, 'post').mockResolvedValue(mockResponse);

      const result = await exchangeRateService.createExchangeRate(newRate);

      expect(result.id).toBe(100);
      expect(api.post).toHaveBeenCalledWith('/exchange-rates', newRate);
    });

    it('should update exchange rate', async () => {
      const updateData = { rate: 3.7 };
      const mockResponse = { id: 1, fromCurrency: 'AED', toCurrency: 'USD', rate: 3.7 };
      vi.spyOn(api, 'put').mockResolvedValue(mockResponse);

      const result = await exchangeRateService.updateExchangeRate(1, updateData);

      expect(result.rate).toBe(3.7);
      expect(api.put).toHaveBeenCalledWith('/exchange-rates/1', updateData);
    });

    it('should delete exchange rate', async () => {
      vi.spyOn(api, 'delete').mockResolvedValue({ success: true });

      const result = await exchangeRateService.deleteExchangeRate(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith('/exchange-rates/1');
    });
  });

  describe('Currency Conversion', () => {
    it('should convert amount between currencies', async () => {
      const conversionData = { amount: 100, from: 'AED', to: 'USD' };
      const mockResult = { convertedAmount: 27.25, from: 'AED', to: 'USD', rate: 3.67 };
      vi.spyOn(api, 'post').mockResolvedValue(mockResult);

      const result = await exchangeRateService.convertCurrency(conversionData);

      // Check closeness to 2 decimal places (27.25)
      expect(Math.abs(result.convertedAmount - 27.25)).toBeLessThan(0.01);
      expect(api.post).toHaveBeenCalledWith('/exchange-rates/convert', conversionData);
    });

    it('should handle currency conversion error', async () => {
      vi.spyOn(api, 'post').mockRejectedValue(new Error('Invalid currency'));

      try {
        await exchangeRateService.convertCurrency({ amount: 100, from: 'XXX', to: 'YYY' });
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Invalid currency');
      }
    });
  });

  describe('Bulk Import', () => {
    it('should bulk import exchange rates', async () => {
      const importData = [
        { fromCurrency: 'AED', toCurrency: 'USD', rate: 3.67 },
        { fromCurrency: 'AED', toCurrency: 'EUR', rate: 4.01 },
      ];
      const mockResponse = { imported: 2, failed: 0 };
      vi.spyOn(api, 'post').mockResolvedValue(mockResponse);

      const result = await exchangeRateService.bulkImportRates(importData);

      expect(result.imported).toBe(2);
      expect(api.post).toHaveBeenCalledWith('/exchange-rates/bulk-import', importData);
    });
  });

  describe('Supported Currencies', () => {
    it('should get list of supported currencies', async () => {
      const mockCurrencies = ['AED', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'KWD'];
      vi.spyOn(api, 'get').mockResolvedValue(mockCurrencies);

      const result = await exchangeRateService.getCurrencies();

      expect(result).toContain('AED');
      expect(result).toContain('USD');
      expect(result.length).toBe(7);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/currencies/list');
    });
  });

  describe('Rate History', () => {
    it('should get rate history for currency pair', async () => {
      const mockHistory = [
        { rate: 3.67, date: '2026-02-01' },
        { rate: 3.68, date: '2026-01-31' },
        { rate: 3.65, date: '2026-01-30' },
      ];
      vi.spyOn(api, 'get').mockResolvedValue(mockHistory);

      const result = await exchangeRateService.getRateHistory('AED', 'USD', 30);

      expect(result.length).toBe(3);
      expect(result[0].rate).toBe(3.67);
      expect(api.get).toHaveBeenCalledWith('/exchange-rates/history/AED/USD', {
          params: { days: 30 },
        });
    });

    it('should use default days parameter (30)', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await exchangeRateService.getRateHistory('AED', 'USD');

      expect(api.get).toHaveBeenCalledWith('/exchange-rates/history/AED/USD', {
          params: { days: 30 },
        });
    });
  });

  describe('Formatting', () => {
    it('should format amount as currency', () => {
      const formatted = exchangeRateService.formatCurrency(1234.56, 'AED');

      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('AED');
    });

    it('should use AED as default currency for formatting', () => {
      const formatted = exchangeRateService.formatCurrency(100);

      expect(formatted).toContain('100.00');
      expect(formatted).toContain('AED');
    });

    it('should format exchange rate display', () => {
      const formatted = exchangeRateService.formatRate(3.67, 'AED', 'USD');

      expect(formatted).toBe('1 AED = 3.6700 USD');
    });

    it('should format rate with 4 decimal places', () => {
      const formatted = exchangeRateService.formatRate(3.6789, 'AED', 'USD');

      expect(formatted).toBe('1 AED = 3.6789 USD');
    });
  });

  describe('Error Handling', () => {
    it('should handle network error in getExchangeRates', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Network timeout'));

      try {
        await exchangeRateService.getExchangeRates();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network timeout');
      }
    });

    it('should handle error in getLatestRate', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Rate not found'));

      try {
        await exchangeRateService.getLatestRate('XXX', 'YYY');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Rate not found');
      }
    });

    it('should handle error in createExchangeRate', async () => {
      vi.spyOn(api, 'post').mockRejectedValue(new Error('Validation failed'));

      try {
        await exchangeRateService.createExchangeRate({});
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should handle error in updateExchangeRate', async () => {
      vi.spyOn(api, 'put').mockRejectedValue(new Error('Rate not found'));

      try {
        await exchangeRateService.updateExchangeRate(999, { rate: 4.0 });
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Rate not found');
      }
    });

    it('should handle error in deleteExchangeRate', async () => {
      vi.spyOn(api, 'delete').mockRejectedValue(new Error('Rate not found'));

      try {
        await exchangeRateService.deleteExchangeRate(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Rate not found');
      }
    });

    it('should handle error in bulkImportRates', async () => {
      vi.spyOn(api, 'post').mockRejectedValue(new Error('Import failed'));

      try {
        await exchangeRateService.bulkImportRates([]);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Import failed');
      }
    });

    it('should handle error in getCurrencies', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await exchangeRateService.getCurrencies();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle error in getRateHistory', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('History not available'));

      try {
        await exchangeRateService.getRateHistory('AED', 'USD');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('History not available');
      }
    });
  });
});
