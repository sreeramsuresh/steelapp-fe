import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiService } from '../axiosApi.js';

vi.mock('../axiosApi.js', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    setAuthToken: vi.fn(),
    removeAuthToken: vi.fn(),
    request: vi.fn(),
  },
}));

vi.mock('../utils/fieldAccessors.js', () => ({
  normalizeProduct: vi.fn((p) => ({ ...p, normalized: true })),
}));

describe('api.js', () => {
  let apiClient, invoicesAPI, customersAPI, productsAPI, suppliersAPI, paymentsAPI;

  beforeEach(async () => {
    vi.restoreAllMocks();
    const mod = await import('../api.js');
    apiClient = mod.apiClient;
    invoicesAPI = mod.invoicesAPI;
    customersAPI = mod.customersAPI;
    productsAPI = mod.productsAPI;
    suppliersAPI = mod.suppliersAPI;
    paymentsAPI = mod.paymentsAPI;
  });

  describe('ApiClient', () => {
    it('should delegate get to apiService', async () => {
      apiService.get.mockResolvedValue({ data: 'ok' });
      const result = await apiClient.get('/test');
      expect(apiService.get).toHaveBeenCalledWith('/test', {});
      expect(result).toEqual({ data: 'ok' });
    });

    it('should delegate post to apiService', async () => {
      apiService.post.mockResolvedValue({ created: true });
      const result = await apiClient.post('/test', { name: 'foo' });
      expect(apiService.post).toHaveBeenCalledWith('/test', { name: 'foo' });
      expect(result).toEqual({ created: true });
    });

    it('should delegate put to apiService', async () => {
      apiService.put.mockResolvedValue({ updated: true });
      const result = await apiClient.put('/test', { name: 'bar' });
      expect(apiService.put).toHaveBeenCalledWith('/test', { name: 'bar' });
      expect(result).toEqual({ updated: true });
    });

    it('should delegate patch to apiService', async () => {
      apiService.patch.mockResolvedValue({ patched: true });
      const result = await apiClient.patch('/test', { name: 'baz' });
      expect(apiService.patch).toHaveBeenCalledWith('/test', { name: 'baz' });
      expect(result).toEqual({ patched: true });
    });

    it('should delegate delete to apiService', async () => {
      apiService.delete.mockResolvedValue({ deleted: true });
      const result = await apiClient.delete('/test');
      expect(apiService.delete).toHaveBeenCalledWith('/test', {});
      expect(result).toEqual({ deleted: true });
    });

    it('should set auth header and delegate to apiService', () => {
      apiClient.setAuthHeader('token123');
      expect(apiService.setAuthToken).toHaveBeenCalledWith('token123');
    });

    it('should remove auth header and delegate to apiService', () => {
      apiClient.removeAuthHeader();
      expect(apiService.removeAuthToken).toHaveBeenCalled();
    });

    it('should delegate request method based on HTTP method', async () => {
      apiService.post.mockResolvedValue({ ok: true });
      const result = await apiClient.request('/test', { method: 'POST', body: JSON.stringify({ a: 1 }) });
      expect(apiService.post).toHaveBeenCalledWith('/test', { a: 1 });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('invoicesAPI', () => {
    it('getAll calls GET /invoices', async () => {
      apiService.get.mockResolvedValue({ invoices: [] });
      await invoicesAPI.getAll({ status: 'pending' });
      expect(apiService.get).toHaveBeenCalledWith('/invoices', { status: 'pending' });
    });

    it('getById calls GET /invoices/:id', async () => {
      apiService.get.mockResolvedValue({ invoice: { id: 1 } });
      await invoicesAPI.getById(1);
      expect(apiService.get).toHaveBeenCalledWith('/invoices/1');
    });

    it('create calls POST /invoices', async () => {
      apiService.post.mockResolvedValue({ invoice: { id: 2 } });
      await invoicesAPI.create({ amount: 100 });
      expect(apiService.post).toHaveBeenCalledWith('/invoices', { amount: 100 });
    });

    it('update calls PUT /invoices/:id', async () => {
      apiService.put.mockResolvedValue({ updated: true });
      await invoicesAPI.update(1, { amount: 200 });
      expect(apiService.put).toHaveBeenCalledWith('/invoices/1', { amount: 200 });
    });

    it('updateStatus calls PATCH /invoices/:id/status', async () => {
      apiService.patch.mockResolvedValue({ status: 'paid' });
      await invoicesAPI.updateStatus(1, 'paid');
      expect(apiService.patch).toHaveBeenCalledWith('/invoices/1/status', { status: 'paid' });
    });

    it('delete calls DELETE /invoices/:id', async () => {
      apiService.delete.mockResolvedValue({ success: true });
      await invoicesAPI.delete(1);
      expect(apiService.delete).toHaveBeenCalledWith('/invoices/1');
    });

    it('getNextNumber calls GET /invoices/number/next', async () => {
      apiService.get.mockResolvedValue({ number: 'INV-100' });
      await invoicesAPI.getNextNumber();
      expect(apiService.get).toHaveBeenCalledWith('/invoices/number/next');
    });

    it('getAnalytics calls GET /invoices/analytics', async () => {
      apiService.get.mockResolvedValue({ total: 5 });
      await invoicesAPI.getAnalytics({ period: '2024' });
      expect(apiService.get).toHaveBeenCalledWith('/invoices/analytics', { period: '2024' });
    });
  });

  describe('customersAPI', () => {
    it('getAll calls GET /customers', async () => {
      apiService.get.mockResolvedValue({ customers: [] });
      await customersAPI.getAll();
      expect(apiService.get).toHaveBeenCalledWith('/customers', {});
    });

    it('getById calls GET /customers/:id', async () => {
      apiService.get.mockResolvedValue({ id: 1, name: 'Acme' });
      await customersAPI.getById(1);
      expect(apiService.get).toHaveBeenCalledWith('/customers/1');
    });

    it('create calls POST /customers', async () => {
      apiService.post.mockResolvedValue({ id: 2 });
      await customersAPI.create({ name: 'New' });
      expect(apiService.post).toHaveBeenCalledWith('/customers', { name: 'New' });
    });

    it('update calls PUT /customers/:id', async () => {
      apiService.put.mockResolvedValue({ updated: true });
      await customersAPI.update(1, { name: 'Updated' });
      expect(apiService.put).toHaveBeenCalledWith('/customers/1', { name: 'Updated' });
    });

    it('delete calls DELETE /customers/:id', async () => {
      apiService.delete.mockResolvedValue({ success: true });
      await customersAPI.delete(1);
      expect(apiService.delete).toHaveBeenCalledWith('/customers/1');
    });

    it('search calls GET /customers/search', async () => {
      apiService.get.mockResolvedValue({ customers: [] });
      await customersAPI.search('acme');
      expect(apiService.get).toHaveBeenCalledWith('/customers/search', { query: 'acme' });
    });
  });

  describe('productsAPI', () => {
    it('getAll normalizes products', async () => {
      apiService.get.mockResolvedValue({ products: [{ id: 1, name: 'Steel' }] });
      const result = await productsAPI.getAll();
      expect(result.products[0].normalized).toBe(true);
    });

    it('getById normalizes product', async () => {
      apiService.get.mockResolvedValue({ product: { id: 1, name: 'Steel' } });
      const result = await productsAPI.getById(1);
      expect(result.product.normalized).toBe(true);
    });

    it('getById normalizes when response has no product wrapper', async () => {
      apiService.get.mockResolvedValue({ id: 1, name: 'Steel' });
      const result = await productsAPI.getById(1);
      expect(result.normalized).toBe(true);
    });

    it('create calls POST /products', async () => {
      apiService.post.mockResolvedValue({ id: 2 });
      await productsAPI.create({ name: 'New Product' });
      expect(apiService.post).toHaveBeenCalledWith('/products', { name: 'New Product' });
    });

    it('search normalizes products', async () => {
      apiService.get.mockResolvedValue({ products: [{ id: 1 }] });
      const result = await productsAPI.search('steel');
      expect(result.products[0].normalized).toBe(true);
    });

    it('getCategories calls GET /products/categories', async () => {
      apiService.get.mockResolvedValue({ categories: ['steel'] });
      await productsAPI.getCategories();
      expect(apiService.get).toHaveBeenCalledWith('/products/categories');
    });

    it('getByCategory normalizes products', async () => {
      apiService.get.mockResolvedValue({ products: [{ id: 1 }] });
      const result = await productsAPI.getByCategory('steel');
      expect(result.products[0].normalized).toBe(true);
    });
  });

  describe('suppliersAPI', () => {
    it('getAll calls GET /suppliers', async () => {
      apiService.get.mockResolvedValue({ suppliers: [] });
      await suppliersAPI.getAll();
      expect(apiService.get).toHaveBeenCalledWith('/suppliers', {});
    });

    it('getById calls GET /suppliers/:id', async () => {
      apiService.get.mockResolvedValue({ id: 1 });
      await suppliersAPI.getById(1);
      expect(apiService.get).toHaveBeenCalledWith('/suppliers/1');
    });

    it('create calls POST /suppliers', async () => {
      apiService.post.mockResolvedValue({ id: 2 });
      await suppliersAPI.create({ name: 'Supplier' });
      expect(apiService.post).toHaveBeenCalledWith('/suppliers', { name: 'Supplier' });
    });

    it('updateStatus calls PATCH /suppliers/:id/status', async () => {
      apiService.patch.mockResolvedValue({ status: 'active' });
      await suppliersAPI.updateStatus(1, 'active');
      expect(apiService.patch).toHaveBeenCalledWith('/suppliers/1/status', { status: 'active' });
    });

    it('getAnalytics calls GET /suppliers/:id/analytics', async () => {
      apiService.get.mockResolvedValue({ analytics: {} });
      await suppliersAPI.getAnalytics(1);
      expect(apiService.get).toHaveBeenCalledWith('/suppliers/1/analytics');
    });

    it('search calls GET /suppliers/search', async () => {
      apiService.get.mockResolvedValue([]);
      await suppliersAPI.search('steel');
      expect(apiService.get).toHaveBeenCalledWith('/suppliers/search', { query: 'steel' });
    });
  });

  describe('paymentsAPI', () => {
    it('getAll calls GET /payments', async () => {
      apiService.get.mockResolvedValue({ payments: [] });
      await paymentsAPI.getAll();
      expect(apiService.get).toHaveBeenCalledWith('/payments', {});
    });

    it('getById calls GET /payments/:id', async () => {
      apiService.get.mockResolvedValue({ id: 1 });
      await paymentsAPI.getById(1);
      expect(apiService.get).toHaveBeenCalledWith('/payments/1');
    });

    it('getByInvoice calls GET /payments/invoice/:id', async () => {
      apiService.get.mockResolvedValue({ payments: [] });
      await paymentsAPI.getByInvoice(5);
      expect(apiService.get).toHaveBeenCalledWith('/payments/invoice/5');
    });

    it('create calls POST /payments', async () => {
      apiService.post.mockResolvedValue({ id: 2 });
      await paymentsAPI.create({ amount: 500 });
      expect(apiService.post).toHaveBeenCalledWith('/payments', { amount: 500 });
    });

    it('void calls POST /payments/:id/void', async () => {
      apiService.post.mockResolvedValue({ voided: true });
      await paymentsAPI.void(1, 'Duplicate');
      expect(apiService.post).toHaveBeenCalledWith('/payments/1/void', { voidReason: 'Duplicate' });
    });

    it('restore calls POST /payments/:id/restore', async () => {
      apiService.post.mockResolvedValue({ restored: true });
      await paymentsAPI.restore(1);
      expect(apiService.post).toHaveBeenCalledWith('/payments/1/restore');
    });
  });
});
