import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiClient } from '../api.js';
import { documentLinkService } from '../documentLinkService.js';

vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('documentLinkService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCorrectionChain', () => {
    it('should fetch correction chain for a document', async () => {
      const mockChain = {
        root: { id: 1, type: 'invoice' },
        nodes: [{ id: 1 }, { id: 2 }],
        edges: [{ source: 1, target: 2 }],
        computed: { totalAdjustment: 500 },
      };
      apiClient.get.mockResolvedValue(mockChain);

      const result = await documentLinkService.getCorrectionChain('invoice', 1);

      expect(result).toEqual(mockChain);
      expect(apiClient.get).toHaveBeenCalledWith('/documents/invoice/1/correction-chain');
    });

    it('should handle different document types', async () => {
      apiClient.get.mockResolvedValue({ root: null, nodes: [], edges: [] });

      await documentLinkService.getCorrectionChain('credit_note', 42);

      expect(apiClient.get).toHaveBeenCalledWith('/documents/credit_note/42/correction-chain');
    });

    it('should propagate API errors', async () => {
      apiClient.get.mockRejectedValue(new Error('Not found'));

      await expect(documentLinkService.getCorrectionChain('invoice', 999)).rejects.toThrow('Not found');
    });
  });

  describe('createLink', () => {
    it('should create a document link', async () => {
      const payload = {
        sourceType: 'invoice',
        sourceId: 1,
        targetType: 'credit_note',
        targetId: 2,
        linkType: 'correction',
      };
      const mockResult = { id: 10, ...payload };
      apiClient.post.mockResolvedValue(mockResult);

      const result = await documentLinkService.createLink(payload);

      expect(result).toEqual(mockResult);
      expect(apiClient.post).toHaveBeenCalledWith('/documents/links', payload);
    });

    it('should propagate API errors on creation', async () => {
      apiClient.post.mockRejectedValue(new Error('Conflict'));

      await expect(documentLinkService.createLink({})).rejects.toThrow('Conflict');
    });
  });
});
