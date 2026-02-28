/**
 * Countries Service Unit Tests
 * Tests country and region management
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import { api } from '../api.js';
import { countriesService } from '../countriesService.js';

describe('countriesService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCountries', () => {
    it('should fetch all countries', async () => {
      const mockData = [
        { id: 1, name: 'United Arab Emirates', code: 'ARE', region: 'middle_east' },
        { id: 2, name: 'China', code: 'CHN', region: 'asia_pacific' },
        { id: 3, name: 'India', code: 'IND', region: 'asia_pacific' },
      ];

      vi.spyOn(api, 'get').mockResolvedValue(mockData);

      const result = await countriesService.getCountries();

      expect(result.length).toBe(3);
      expect(result[0].code).toBe('ARE');
      expect(api.get).toHaveBeenCalledWith('/countries', { params: {} });
    });

    it('should support pagination parameters', async () => {
      vi.spyOn(api, 'get').mockResolvedValue([]);

      await countriesService.getCountries({ page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/countries', { params: { page: 2, limit: 10 } });
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
      const mockData = {
        id: 1,
        name: 'United Arab Emirates',
        code: 'ARE',
        region: 'middle_east',
        ports: [
          { id: 101, name: 'Jebel Ali', type: 'seaport' },
          { id: 102, name: 'Dubai Airport', type: 'airport' },
        ],
      };

      vi.spyOn(api, 'get').mockResolvedValue(mockData);

      const result = await countriesService.getCountry(1);

      expect(result.name).toBe('United Arab Emirates');
      expect(result.ports.length).toBe(2);
      expect(api.get).toHaveBeenCalledWith('/countries/1');
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
      const mockData = [
        { id: 2, name: 'China', code: 'CHN', region: 'asia_pacific' },
        { id: 3, name: 'India', code: 'IND', region: 'asia_pacific' },
        { id: 4, name: 'Singapore', code: 'SGP', region: 'asia_pacific' },
      ];

      vi.spyOn(api, 'get').mockResolvedValue(mockData);

      const result = await countriesService.getCountriesByRegion('asia_pacific');

      expect(result.length).toBe(3);
      expect(result.every((c) => c.region === 'asia_pacific')).toBeTruthy();
      expect(api.get).toHaveBeenCalledWith('/countries/region/asia_pacific');
    });

    it('should support middle_east region', async () => {
      vi.spyOn(api, 'get').mockResolvedValue([]);

      await countriesService.getCountriesByRegion('middle_east');

      expect(api.get).toHaveBeenCalledWith('/countries/region/middle_east');
    });
  });

  describe('getCountryExchangeRates', () => {
    it('should fetch exchange rates for country with default AED base', async () => {
      const mockData = {
        country_id: 2,
        base_currency: 'AED',
        rates: [
          { currency: 'CNY', rate: 0.53 },
          { currency: 'INR', rate: 0.22 },
          { currency: 'USD', rate: 3.67 },
        ],
      };

      vi.spyOn(api, 'get').mockResolvedValue(mockData);

      const result = await countriesService.getCountryExchangeRates(2);

      expect(result.base_currency).toBe('AED');
      expect(result.rates.length).toBe(3);
      expect(api.get).toHaveBeenCalledWith('/countries/2/exchange-rates', {
        params: { base_currency: 'AED' },
      });
    });

    it('should support custom base currency', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({
        country_id: 2,
        base_currency: 'USD',
        rates: [],
      });

      await countriesService.getCountryExchangeRates(2, 'USD');

      expect(api.get).toHaveBeenCalledWith('/countries/2/exchange-rates', {
        params: { base_currency: 'USD' },
      });
    });
  });

  describe('getRegions', () => {
    it('should return all available regions', () => {
      const regions = countriesService.getRegions();

      expect(regions.length).toBe(5);
      expect(regions[0]).toEqual({ value: 'middle_east', label: 'Middle East' });
      expect(regions[1]).toEqual({ value: 'asia_pacific', label: 'Asia Pacific' });
      expect(regions[2]).toEqual({ value: 'europe', label: 'Europe' });
      expect(regions[3]).toEqual({ value: 'north_america', label: 'North America' });
      expect(regions[4]).toEqual({ value: 'africa', label: 'Africa' });
    });
  });

  describe('formatCountryDisplay', () => {
    it('should format country with flag emoji', () => {
      const country = { name: 'United Arab Emirates', code: 'ARE' };
      const result = countriesService.formatCountryDisplay(country);

      expect(result).toContain('United Arab Emirates');
    });

    it('should support multiple flag emojis', () => {
      expect(countriesService.formatCountryDisplay({ name: 'China', code: 'CHN' })).toContain('China');
      expect(countriesService.formatCountryDisplay({ name: 'India', code: 'IND' })).toContain('India');
      expect(countriesService.formatCountryDisplay({ name: 'Germany', code: 'DEU' })).toContain('Germany');
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
      expect(portTypes[4]).toEqual({ value: 'container_port', label: 'Container Port' });
      expect(portTypes[5]).toEqual({ value: 'bulk_port', label: 'Bulk Port' });
    });
  });
});
