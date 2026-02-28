/**
 * Company Service Unit Tests (Node Native Test Runner)
 * Tests company CRUD operations
 * Tests file uploads (logo, brandmark, seal)
 * Tests template settings management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { tokenUtils } from '../axiosApi.js';
import { companyService } from '../companyService.js';

describe('companyService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCompany', () => {
    it('should fetch company information', async () => {
      const mockCompany = {
        id: 1,
        name: 'Steel Corp',
        trn: 'UAE123456789',
        country: 'UAE',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockCompany);

      const result = await companyService.getCompany();

      expect(result.name).toBe('Steel Corp');
      expect(apiClient.get.calledWith('/company').toBeTruthy());
    });

    it('should handle fetch error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await companyService.getCompany();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('updateCompany', () => {
    it('should update company with POST', async () => {
      const companyData = { name: 'Updated Steel Corp', country: 'UAE' };
      const mockResponse = { id: 1, ...companyData };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await companyService.updateCompany(companyData);

      expect(result.name).toBe('Updated Steel Corp');
      expect(apiClient.post.calledWith('/company', companyData).toBeTruthy());
    });
  });

  describe('updateCompanyById', () => {
    it('should update company by ID with PUT', async () => {
      const companyData = { name: 'Updated by ID' };
      const mockResponse = { id: 2, ...companyData };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await companyService.updateCompanyById(2, companyData);

      expect(result.id).toBe(2);
      expect(apiClient.put.calledWith('/company/2', companyData).toBeTruthy());
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo file', async () => {
      const mockFile = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const mockResponse = { filename: 'logo-12345.png', url: '/logos/logo-12345.png' };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadLogo(mockFile);

      expect(result.filename).toBe('logo-12345.png');
      expect(global.fetch.mock.calls.length > 0).toBeTruthy();
      const call = global.fetch.getCall(0);
      expect(call.args[0]).toBe('http://localhost:3001/api/company/upload-logo');
      expect(call.args[1].method).toBe('POST');
    });

    it('should handle upload failure', async () => {
      const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' });
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'File too large' }),
      });

      try {
        await companyService.uploadLogo(mockFile);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error instanceof Error).toBeTruthy();
      }
    });
  });

  describe('deleteLogo', () => {
    it('should delete logo by filename', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await companyService.deleteLogo('logo-12345.png');

      expect(result.success).toBe(true);
      expect(apiClient.delete.calledWith('/company/logo/logo-12345.png').toBeTruthy());
    });
  });

  describe('cleanupLogos', () => {
    it('should cleanup unused logos', async () => {
      const mockResponse = { deleted: 3, freed: '15MB' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await companyService.cleanupLogos();

      expect(result.deleted).toBe(3);
      expect(apiClient.post.calledWith('/company/cleanup-logos').toBeTruthy());
    });
  });

  describe('uploadBrandmark', () => {
    it('should upload brandmark file', async () => {
      const mockFile = new File(['brandmark'], 'brandmark.png', {
        type: 'image/png',
      });
      const mockResponse = { filename: 'brandmark-12345.png' };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadBrandmark(mockFile);

      expect(result.filename).toBe('brandmark-12345.png');
      const call = global.fetch.getCall(0);
      expect(call.args[0]).toBe('http://localhost:3001/api/company/upload-brandmark');
    });
  });

  describe('deleteBrandmark', () => {
    it('should delete brandmark by filename', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      await companyService.deleteBrandmark('brandmark-12345.png');

      expect(apiClient.delete.calledWith('/company/brandmark/brandmark-12345.png').toBeTruthy());
    });
  });

  describe('uploadSeal', () => {
    it('should upload seal file', async () => {
      const mockFile = new File(['seal'], 'seal.png', { type: 'image/png' });
      const mockResponse = { filename: 'seal-12345.png' };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadSeal(mockFile);

      expect(result.filename).toBe('seal-12345.png');
      const call = global.fetch.getCall(0);
      expect(call.args[0]).toBe('http://localhost:3001/api/company/upload-seal');
    });
  });

  describe('deleteSeal', () => {
    it('should delete seal by filename', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      await companyService.deleteSeal('seal-12345.png');

      expect(apiClient.delete.calledWith('/company/seal/seal-12345.png').toBeTruthy());
    });
  });

  describe('updateTemplateSettings', () => {
    it('should update template settings', async () => {
      const templateSettings = {
        selectedTemplate: 'professional',
        showLogo: true,
        showBrandmark: true,
      };
      const mockResponse = { success: true, settings: templateSettings };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      expect(result.success).toBe(true);
      expect(apiClient.post.calledWith('/company/template-settings', templateSettings).toBeTruthy());
    });
  });

  describe('authentication in uploads', () => {
    it('should include authorization token in upload requests', async () => {
      vi.spyOn(tokenUtils, 'getToken').mockReturnValue('test-token-xyz');
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ filename: 'test.png' }),
      });

      await companyService.uploadLogo(mockFile);

      const call = global.fetch.getCall(0);
      expect(call.args[1].headers.Authorization).toBe('Bearer test-token-xyz');
    });

    it('should set correct content headers for uploads', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ filename: 'test.png' }),
      });

      await companyService.uploadLogo(mockFile);

      const call = global.fetch.getCall(0);
      expect(call.args[1].headers['Content-Type']).toBe(undefined);
    });
  });
});
