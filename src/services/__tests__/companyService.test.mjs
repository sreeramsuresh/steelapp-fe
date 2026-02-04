/**
 * Company Service Unit Tests (Node Native Test Runner)
 * Tests company CRUD operations
 * Tests file uploads (logo, brandmark, seal)
 * Tests template settings management
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { tokenUtils } from '../axiosApi.js';
import { companyService } from '../companyService.js';

describe('companyService', () => {
  beforeEach(() => {
    sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getCompany', () => {
    test('should fetch company information', async () => {
      const mockCompany = {
        id: 1,
        name: 'Steel Corp',
        trn: 'UAE123456789',
        country: 'UAE',
      };
      sinon.stub(apiClient, 'get').resolves(mockCompany);

      const result = await companyService.getCompany();

      assert.strictEqual(result.name, 'Steel Corp');
      assert.ok(apiClient.get.calledWith('/company'));
    });

    test('should handle fetch error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await companyService.getCompany();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });
  });

  describe('updateCompany', () => {
    test('should update company with POST', async () => {
      const companyData = { name: 'Updated Steel Corp', country: 'UAE' };
      const mockResponse = { id: 1, ...companyData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await companyService.updateCompany(companyData);

      assert.strictEqual(result.name, 'Updated Steel Corp');
      assert.ok(apiClient.post.calledWith('/company', companyData));
    });
  });

  describe('updateCompanyById', () => {
    test('should update company by ID with PUT', async () => {
      const companyData = { name: 'Updated by ID' };
      const mockResponse = { id: 2, ...companyData };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await companyService.updateCompanyById(2, companyData);

      assert.strictEqual(result.id, 2);
      assert.ok(apiClient.put.calledWith('/company/2', companyData));
    });
  });

  describe('uploadLogo', () => {
    test('should upload logo file', async () => {
      const mockFile = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const mockResponse = { filename: 'logo-12345.png', url: '/logos/logo-12345.png' };

      global.fetch.resolves({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadLogo(mockFile);

      assert.strictEqual(result.filename, 'logo-12345.png');
      assert.ok(global.fetch.called);
      const call = global.fetch.getCall(0);
      assert.strictEqual(call.args[0], 'http://localhost:3001/api/company/upload-logo');
      assert.strictEqual(call.args[1].method, 'POST');
    });

    test('should handle upload failure', async () => {
      const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' });
      global.fetch.resolves({
        ok: false,
        json: async () => ({ error: 'File too large' }),
      });

      try {
        await companyService.uploadLogo(mockFile);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('deleteLogo', () => {
    test('should delete logo by filename', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await companyService.deleteLogo('logo-12345.png');

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.calledWith('/company/logo/logo-12345.png'));
    });
  });

  describe('cleanupLogos', () => {
    test('should cleanup unused logos', async () => {
      const mockResponse = { deleted: 3, freed: '15MB' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await companyService.cleanupLogos();

      assert.strictEqual(result.deleted, 3);
      assert.ok(apiClient.post.calledWith('/company/cleanup-logos'));
    });
  });

  describe('uploadBrandmark', () => {
    test('should upload brandmark file', async () => {
      const mockFile = new File(['brandmark'], 'brandmark.png', {
        type: 'image/png',
      });
      const mockResponse = { filename: 'brandmark-12345.png' };

      global.fetch.resolves({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadBrandmark(mockFile);

      assert.strictEqual(result.filename, 'brandmark-12345.png');
      const call = global.fetch.getCall(0);
      assert.strictEqual(call.args[0], 'http://localhost:3001/api/company/upload-brandmark');
    });
  });

  describe('deleteBrandmark', () => {
    test('should delete brandmark by filename', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      await companyService.deleteBrandmark('brandmark-12345.png');

      assert.ok(apiClient.delete.calledWith('/company/brandmark/brandmark-12345.png'));
    });
  });

  describe('uploadSeal', () => {
    test('should upload seal file', async () => {
      const mockFile = new File(['seal'], 'seal.png', { type: 'image/png' });
      const mockResponse = { filename: 'seal-12345.png' };

      global.fetch.resolves({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await companyService.uploadSeal(mockFile);

      assert.strictEqual(result.filename, 'seal-12345.png');
      const call = global.fetch.getCall(0);
      assert.strictEqual(call.args[0], 'http://localhost:3001/api/company/upload-seal');
    });
  });

  describe('deleteSeal', () => {
    test('should delete seal by filename', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      await companyService.deleteSeal('seal-12345.png');

      assert.ok(apiClient.delete.calledWith('/company/seal/seal-12345.png'));
    });
  });

  describe('updateTemplateSettings', () => {
    test('should update template settings', async () => {
      const templateSettings = {
        selectedTemplate: 'professional',
        showLogo: true,
        showBrandmark: true,
      };
      const mockResponse = { success: true, settings: templateSettings };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await companyService.updateTemplateSettings(templateSettings);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.post.calledWith('/company/template-settings', templateSettings));
    });
  });

  describe('authentication in uploads', () => {
    test('should include authorization token in upload requests', async () => {
      sinon.stub(tokenUtils, 'getToken').returns('test-token-xyz');
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      global.fetch.resolves({
        ok: true,
        json: async () => ({ filename: 'test.png' }),
      });

      await companyService.uploadLogo(mockFile);

      const call = global.fetch.getCall(0);
      assert.strictEqual(call.args[1].headers.Authorization, 'Bearer test-token-xyz');
    });

    test('should set correct content headers for uploads', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      global.fetch.resolves({
        ok: true,
        json: async () => ({ filename: 'test.png' }),
      });

      await companyService.uploadLogo(mockFile);

      const call = global.fetch.getCall(0);
      assert.strictEqual(call.args[1].headers['Content-Type'], undefined);
    });
  });
});
