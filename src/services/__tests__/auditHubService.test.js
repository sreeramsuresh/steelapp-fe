/**
 * Audit Hub Service Unit Tests
 * Tests audit hub operations (accounting periods and datasets)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import api from '../api.js';
import { auditHubService } from '../auditHubService.js';

describe('auditHubService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPeriods', () => {
    it('should fetch accounting periods', async () => {
      const mockPeriods = [
        { id: 1, year: 2024, month: 1, status: 'open' },
        { id: 2, year: 2024, month: 2, status: 'closed' },
      ];
      vi.spyOn(api, 'get').mockResolvedValue(mockPeriods);

      const result = await auditHubService.getPeriods(1);

      expect(result.length).toBe(2);
      expect(api.get).toHaveBeenCalled();
    });

    it('should support year filter', async () => {
      vi.spyOn(api, 'get').mockResolvedValue([]);

      await auditHubService.getPeriods(1, { year: 2024 });

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe('getPeriodById', () => {
    it('should fetch single period by ID', async () => {
      const mockPeriod = { id: 1, year: 2024, month: 1, status: 'open' };
      vi.spyOn(api, 'get').mockResolvedValue(mockPeriod);

      const result = await auditHubService.getPeriodById(1, 1);

      expect(result.id).toBe(1);
      expect(api.get).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await auditHubService.getPeriods(1);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });
});
