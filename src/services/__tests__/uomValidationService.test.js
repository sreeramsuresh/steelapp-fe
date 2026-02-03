import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import uomValidationService from '../uomValidationService';
import { apiClient } from '../api';

vi.mock('../api');

describe('uomValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateQuantity', () => {
    it('should validate quantity for PCS unit', async () => {
      apiClient.post.mockResolvedValue({
        valid: true,
        message: 'Valid whole number',
      });

      const result = await uomValidationService.validateQuantity(10, 'PCS');

      expect(result).toHaveProperty('valid', true);
      expect(apiClient.post).toHaveBeenCalledWith('/uom/validate-quantity', {
        quantity: 10,
        unit: 'PCS',
      });
    });

    it('should validate quantity for KG unit', async () => {
      apiClient.post.mockResolvedValue({
        valid: true,
      });

      const result = await uomValidationService.validateQuantity(25.5, 'KG');

      expect(result).toHaveProperty('valid', true);
      expect(apiClient.post).toHaveBeenCalledWith('/uom/validate-quantity', {
        quantity: 25.5,
        unit: 'KG',
      });
    });

    it('should return valid=true on API error (fail open)', async () => {
      apiClient.post.mockRejectedValue(new Error('API Error'));

      const result = await uomValidationService.validateQuantity(10, 'PCS');

      expect(result).toHaveProperty('valid', true);
    });
  });

  describe('convert', () => {
    it('should convert between units', async () => {
      apiClient.post.mockResolvedValue({
        success: true,
        converted: 100,
      });

      const result = await uomValidationService.convert(10, 'PCS', 'KG', 10);

      expect(result).toHaveProperty('success', true);
      expect(apiClient.post).toHaveBeenCalledWith('/uom/convert', {
        quantity: 10,
        fromUnit: 'PCS',
        toUnit: 'KG',
        unitWeightKg: 10,
      });
    });

    it('should handle conversion error', async () => {
      apiClient.post.mockRejectedValue(new Error('Conversion failed'));

      const result = await uomValidationService.convert(10, 'PCS', 'INVALID');

      expect(result).toHaveProperty('success', false);
    });
  });

  describe('validateWeightTolerance', () => {
    it('should validate weight tolerance', async () => {
      apiClient.post.mockResolvedValue({
        valid: true,
        varianceKg: 1.5,
        variancePct: 2.5,
        tolerancePct: 5,
      });

      const result = await uomValidationService.validateWeightTolerance(101.5, 100, 'PLATES');

      expect(result).toHaveProperty('valid', true);
      expect(apiClient.post).toHaveBeenCalledWith('/uom/validate-weight-tolerance', {
        actualWeightKg: 101.5,
        theoreticalWeightKg: 100,
        productCategory: 'PLATES',
      });
    });

    it('should fail open on error', async () => {
      apiClient.post.mockRejectedValue(new Error('Validation failed'));

      const result = await uomValidationService.validateWeightTolerance(101.5, 100);

      expect(result).toHaveProperty('valid', true);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate weight variance', async () => {
      apiClient.post.mockResolvedValue({
        varianceKg: 1.5,
        variancePct: 1.48,
      });

      const result = await uomValidationService.calculateVariance(101.5, 100);

      expect(result).toHaveProperty('varianceKg');
      expect(apiClient.post).toHaveBeenCalledWith('/uom/calculate-variance', {
        actualWeightKg: 101.5,
        theoreticalWeightKg: 100,
      });
    });

    it('should return zero on error', async () => {
      apiClient.post.mockRejectedValue(new Error('Calculation failed'));

      const result = await uomValidationService.calculateVariance(101.5, 100);

      expect(result).toHaveProperty('varianceKg', 0);
    });
  });

  describe('getValidUnits', () => {
    it('should get list of valid units', async () => {
      apiClient.get.mockResolvedValue({
        units: ['PCS', 'KG', 'MT', 'BUNDLE', 'METER'],
      });

      const result = await uomValidationService.getValidUnits();

      expect(result).toHaveProperty('units');
      expect(Array.isArray(result.units)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/uom/valid-units');
    });

    it('should return defaults on error', async () => {
      apiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await uomValidationService.getValidUnits();

      expect(result.units).toContain('PCS');
      expect(result.units).toContain('KG');
    });
  });

  describe('validateInvoiceItems', () => {
    it('should validate multiple invoice items', async () => {
      const items = [
        { name: 'Item1', quantity: 10, unit: 'PCS' },
        { name: 'Item2', quantity: 25.5, unit: 'KG' },
      ];

      apiClient.post.mockResolvedValue({
        valid: true,
        results: [
          { name: 'Item1', valid: true },
          { name: 'Item2', valid: true },
        ],
      });

      const result = await uomValidationService.validateInvoiceItems(items);

      expect(result).toHaveProperty('valid', true);
      expect(apiClient.post).toHaveBeenCalledWith('/uom/validate-invoice-items', { items });
    });

    it('should fail open on error', async () => {
      const items = [{ name: 'Item1', quantity: 10, unit: 'PCS' }];

      apiClient.post.mockRejectedValue(new Error('Validation failed'));

      const result = await uomValidationService.validateInvoiceItems(items);

      expect(result).toHaveProperty('valid', true);
    });
  });
});
