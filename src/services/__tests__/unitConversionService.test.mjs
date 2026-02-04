/**
 * Unit Conversion Service Unit Tests (Node Native Test Runner)
 * Tests unit conversion formulas and weight calculations
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { api } from '../api.js';
import { unitConversionService } from '../unitConversionService.js';

describe('unitConversionService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('listConversionFormulas', () => {
    test('should fetch all conversion formulas', async () => {
      const mockResponse = {
        formulas: [
          {
            category: 'sheet',
            formula: 'weight = width * thickness * length * density',
          },
          {
            category: 'pipe',
            formula: 'weight = length * (diameter^2 - inner_diameter^2) * density',
          },
        ],
      };

      sinon.stub(api, 'get').resolves({ data: mockResponse });

      const result = await unitConversionService.listConversionFormulas();

      assert.strictEqual(result.formulas.length, 2);
      assert.ok(api.get.calledWith('/unit-conversions/formulas'));
    });
  });

  describe('getConversionFormula', () => {
    test('should fetch conversion formula for specific category', async () => {
      const mockResponse = {
        formula: 'weight = width * thickness * length * density',
        category: 'sheet',
        variables: ['width', 'thickness', 'length', 'density'],
      };

      sinon.stub(api, 'get').resolves({ data: mockResponse });

      const result = await unitConversionService.getConversionFormula('sheet');

      assert.ok(result.formula.includes('weight'));
      assert.ok(result.variables.includes('width'));
      assert.ok(api.get.calledWith('/unit-conversions/formulas/sheet'));
    });
  });

  describe('calculateWeight', () => {
    test('should calculate weight for product with quantity and unit', async () => {
      const mockResponse = {
        weight_kg: 100,
        weight_mt: 0.1,
        formula_type: 'dimension_based',
        is_theoretical: true,
      };

      sinon.stub(api, 'post').resolves({ data: mockResponse });

      const result = await unitConversionService.calculateWeight(1, 10, 'PCS');

      assert.strictEqual(result.weight_kg, 100);
      assert.strictEqual(result.weight_mt, 0.1);
      assert.ok(api.post.calledWith('/unit-conversions/calculate-weight', sinon.match.any));
    });
  });

  describe('convertUnits', () => {
    test('should convert between units for a product', async () => {
      const mockResponse = {
        to_quantity: 0.5,
        conversion_factor: 0.5,
        success: true,
        display_only: false,
      };

      sinon.stub(api, 'post').resolves({ data: mockResponse });

      const result = await unitConversionService.convertUnits(1, 1000, 'KG', 'MT');

      assert.strictEqual(result.to_quantity, 0.5);
      assert.strictEqual(result.success, true);
      assert.ok(api.post.calledWith('/unit-conversions/convert', sinon.match.any));
    });

    test('should handle conversion errors gracefully', async () => {
      const mockResponse = {
        to_quantity: null,
        success: false,
        error_code: 'MISSING_DIMENSIONS',
        message: 'Product dimensions not found',
        missing_fields: ['width', 'thickness'],
      };

      sinon.stub(api, 'post').resolves({ data: mockResponse });

      const result = await unitConversionService.convertUnits(1, 100, 'PCS', 'KG');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.missing_fields.length, 2);
    });
  });
});
