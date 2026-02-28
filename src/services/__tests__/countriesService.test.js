/**
 * Countries Service Unit Tests (Node Native Test Runner)
 * Tests country and region management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { api } from '../api.js';
import { countriesService } from '../countriesService.js';

describe('countriesService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCountries', () => {
    it('should fetch all countries', async () => {
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

      vi.spyOn(api, 'get').mockResolvedValue(mockResponse);

      const result = await countriesService.getCountries();

      expect(result.length).toBe(3);
      expect(result[0].code).toBe('ARE');
      expect(api.get.calledWith('/countries', { params: {} }).toBeTruthy());
    });

    it('should support pagination parameters', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await countriesService.getCountries({ page: 2, limit: 10 });

      expect(
        api.get.calledWith('/countries', expect.objectContaining.has('params', { page: 2, limit: 10 }).toBeTruthy())
      );
    });

    it('should handle API errors', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('API Error'));

      try {
        await countriesService.getCountries();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('getCountry', () => {
    it('should fetch single country by ID with ports', async () => {
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

      vi.spyOn(api, 'get').mockResolvedValue(mockResponse);

      const result = await countriesService.getCountry(1);

      expect(result.name).toBe('United Arab Emirates');
      expect(result.ports.length).toBe(2);
      expect(api.get.calledWith('/countries/1').toBeTruthy());
    });

    it('should handle country not found', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Country not found'));

      try {
        await countriesService.getCountry(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('getCountriesByRegion', () => {
    it('should fetch countries by region', async () => {
      const mockResponse = {
        data: [
          { id: 2, name: 'China', code: 'CHN', region: 'asia_pacific' },
          { id: 3, name: 'India', code: 'IND', region: 'asia_pacific' },
          { id: 4, name: 'Singapore', code: 'SGP', region: 'asia_pacific' },
        ],
      };

      vi.spyOn(api, 'get').mockResolvedValue(mockResponse);

      const result = await countriesService.getCountriesByRegion('asia_pacific');

      expect(result.length).toBe(3);
      expect(result.every((c).toBeTruthy() => c.region === 'asia_pacific'));
      expect(api.get.calledWith('/countries/region/asia_pacific').toBeTruthy());
    });

    it('should support middle_east region', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await countriesService.getCountriesByRegion('middle_east');

      expect(api.get.calledWith('/countries/region/middle_east').toBeTruthy());
    });
  });

  describe('getCountryExchangeRates', () => {
    it('should fetch exchange rates for country with default AED base', async () => {
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

      vi.spyOn(api, 'get').mockResolvedValue(mockResponse);

      const result = await countriesService.getCountryExchangeRates(2);

      expect(result.base_currency).toBe('AED');
      expect(result.rates.length).toBe(3);
      expect(
        api.get.calledWith('/countries/2/exchange-rates', expect.objectContaining.has('params', { base_currency: 'AED' }).toBeTruthy())
      );
    });

    it('should support custom base currency', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({
        data: { country_id: 2, base_currency: 'USD', rates: [] },
      });

      await countriesService.getCountryExchangeRates(2, 'USD');

      expect(
        api.get.calledWith('/countries/2/exchange-rates', expect.objectContaining.has('params', { base_currency: 'USD' }).toBeTruthy())
      );
    });
  });

  describe('getRegions', () => {
    it('should return all available regions', () => {
      const regions = countriesService.getRegions();

      expect(regions.length).toBe(5);
      expect(regions[0]).toEqual({ value: 'middle_east', label: 'Middle East' });
      expect(regions[1]).toEqual({ value: 'asia_pacific', label: 'Asia Pacific' });
      expect(regions[2]).toEqual({ value: 'europe', label: 'Europe' });
      expect(regions[3]).toEqual({
        value: 'north_america',
        label: 'North America',
      });
      expect(regions[4]).toEqual({ value: 'africa', label: 'Africa' });
    });
  });

  describe('formatCountryDisplay', () => {
    it('should format country with flag emoji', () => {
      const country = { name: 'United Arab Emirates', code: 'ARE' };
      const result = countriesService.formatCountryDisplay(country);

      expect(result).toBe('🇦🇪 United Arab Emirates');
    });

    it('should support multiple flag emojis', () => {
      expect(countriesService.formatCountryDisplay({ name: 'China').toBe(code: 'CHN' }), '🇨🇳 China');
      expect(countriesService.formatCountryDisplay({ name: 'India').toBe(code: 'IND' }), '🇮🇳 India');
      expect(countriesService.formatCountryDisplay({ name: 'Germany').toBe(code: 'DEU' }), '🇩🇪 Germany');
    });

    it('should handle unknown country codes without emoji', () => {
      const country = { name: 'Unknown Country', code: 'ZZZ' };
      const result = countriesService.formatCountryDisplay(country);

      expect(result).toBe('Unknown Country');
    });
  });

  describe('getPortTypes', () => {
    it('should return all available port types', () => {
      const portTypes = countriesService.getPortTypes();

      expect(portTypes.length).toBe(6);
      expect(portTypes[0]).toEqual({ value: 'seaport', label: 'Seaport' });
      expect(portTypes[1]).toEqual({ value: 'airport', label: 'Airport' });
      expect(portTypes[2]).toEqual({ value: 'land_port', label: 'Land Port' });
      expect(portTypes[3]).toEqual({ value: 'dry_port', label: 'Dry Port' });
      expect(portTypes[4]).toEqual({
        value: 'container_port',
        label: 'Container Port',
      });
      expect(portTypes[5]).toEqual({ value: 'bulk_port', label: 'Bulk Port' });
    });
  });
});
