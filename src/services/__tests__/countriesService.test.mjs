/**
 * Countries Service Unit Tests (Node Native Test Runner)
 * Tests country and region management
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { api } from '../api.js';
import { countriesService } from '../countriesService.js';

describe('countriesService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getCountries', () => {
    test('should fetch all countries', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: 'United Arab Emirates',
            code: 'ARE',
            region: 'middle_east',
          },
          { id: 2, name: 'China', code: 'CHN', region: 'asia_pacific' },
          { id: 3, name: 'India', code: 'IND', region: 'asia_pacific' },
        ],
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await countriesService.getCountries();

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].code, 'ARE');
      assert.ok(api.get.calledWith('/countries', { params: {} }));
    });

    test('should support pagination parameters', async () => {
      sinon.stub(api, 'get').resolves({ data: [] });

      await countriesService.getCountries({ page: 2, limit: 10 });

      assert.ok(
        api.get.calledWith('/countries', sinon.match.has('params', { page: 2, limit: 10 }))
      );
    });

    test('should handle API errors', async () => {
      sinon.stub(api, 'get').rejects(new Error('API Error'));

      try {
        await countriesService.getCountries();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getCountry', () => {
    test('should fetch single country by ID with ports', async () => {
      const mockResponse = {
        data: {
          id: 1,
          name: 'United Arab Emirates',
          code: 'ARE',
          region: 'middle_east',
          ports: [
            { id: 101, name: 'Jebel Ali', type: 'seaport' },
            { id: 102, name: 'Dubai Airport', type: 'airport' },
          ],
        },
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await countriesService.getCountry(1);

      assert.strictEqual(result.name, 'United Arab Emirates');
      assert.strictEqual(result.ports.length, 2);
      assert.ok(api.get.calledWith('/countries/1'));
    });

    test('should handle country not found', async () => {
      sinon.stub(api, 'get').rejects(new Error('Country not found'));

      try {
        await countriesService.getCountry(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('getCountriesByRegion', () => {
    test('should fetch countries by region', async () => {
      const mockResponse = {
        data: [
          { id: 2, name: 'China', code: 'CHN', region: 'asia_pacific' },
          { id: 3, name: 'India', code: 'IND', region: 'asia_pacific' },
          { id: 4, name: 'Singapore', code: 'SGP', region: 'asia_pacific' },
        ],
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await countriesService.getCountriesByRegion('asia_pacific');

      assert.strictEqual(result.length, 3);
      assert.ok(result.every((c) => c.region === 'asia_pacific'));
      assert.ok(api.get.calledWith('/countries/region/asia_pacific'));
    });

    test('should support middle_east region', async () => {
      sinon.stub(api, 'get').resolves({ data: [] });

      await countriesService.getCountriesByRegion('middle_east');

      assert.ok(api.get.calledWith('/countries/region/middle_east'));
    });
  });

  describe('getCountryExchangeRates', () => {
    test('should fetch exchange rates for country with default AED base', async () => {
      const mockResponse = {
        data: {
          country_id: 2,
          base_currency: 'AED',
          rates: [
            { currency: 'CNY', rate: 0.53 },
            { currency: 'INR', rate: 0.22 },
            { currency: 'USD', rate: 3.67 },
          ],
        },
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await countriesService.getCountryExchangeRates(2);

      assert.strictEqual(result.base_currency, 'AED');
      assert.strictEqual(result.rates.length, 3);
      assert.ok(
        api.get.calledWith('/countries/2/exchange-rates', sinon.match.has('params', { base_currency: 'AED' }))
      );
    });

    test('should support custom base currency', async () => {
      sinon.stub(api, 'get').resolves({
        data: { country_id: 2, base_currency: 'USD', rates: [] },
      });

      await countriesService.getCountryExchangeRates(2, 'USD');

      assert.ok(
        api.get.calledWith('/countries/2/exchange-rates', sinon.match.has('params', { base_currency: 'USD' }))
      );
    });
  });

  describe('getRegions', () => {
    test('should return all available regions', () => {
      const regions = countriesService.getRegions();

      assert.strictEqual(regions.length, 5);
      assert.deepStrictEqual(regions[0], { value: 'middle_east', label: 'Middle East' });
      assert.deepStrictEqual(regions[1], { value: 'asia_pacific', label: 'Asia Pacific' });
      assert.deepStrictEqual(regions[2], { value: 'europe', label: 'Europe' });
      assert.deepStrictEqual(regions[3], {
        value: 'north_america',
        label: 'North America',
      });
      assert.deepStrictEqual(regions[4], { value: 'africa', label: 'Africa' });
    });
  });

  describe('formatCountryDisplay', () => {
    test('should format country with flag emoji', () => {
      const country = { name: 'United Arab Emirates', code: 'ARE' };
      const result = countriesService.formatCountryDisplay(country);

      assert.strictEqual(result, '🇦🇪 United Arab Emirates');
    });

    test('should support multiple flag emojis', () => {
      assert.strictEqual(countriesService.formatCountryDisplay({ name: 'China', code: 'CHN' }), '🇨🇳 China');
      assert.strictEqual(countriesService.formatCountryDisplay({ name: 'India', code: 'IND' }), '🇮🇳 India');
      assert.strictEqual(countriesService.formatCountryDisplay({ name: 'Germany', code: 'DEU' }), '🇩🇪 Germany');
    });

    test('should handle unknown country codes without emoji', () => {
      const country = { name: 'Unknown Country', code: 'ZZZ' };
      const result = countriesService.formatCountryDisplay(country);

      assert.strictEqual(result, 'Unknown Country');
    });
  });

  describe('getPortTypes', () => {
    test('should return all available port types', () => {
      const portTypes = countriesService.getPortTypes();

      assert.strictEqual(portTypes.length, 6);
      assert.deepStrictEqual(portTypes[0], { value: 'seaport', label: 'Seaport' });
      assert.deepStrictEqual(portTypes[1], { value: 'airport', label: 'Airport' });
      assert.deepStrictEqual(portTypes[2], { value: 'land_port', label: 'Land Port' });
      assert.deepStrictEqual(portTypes[3], { value: 'dry_port', label: 'Dry Port' });
      assert.deepStrictEqual(portTypes[4], {
        value: 'container_port',
        label: 'Container Port',
      });
      assert.deepStrictEqual(portTypes[5], { value: 'bulk_port', label: 'Bulk Port' });
    });
  });
});
