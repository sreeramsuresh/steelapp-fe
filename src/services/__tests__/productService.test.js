/**
 * Product Service Unit Tests
 * ✅ Comprehensive test coverage for productService
 * ✅ Tests CRUD operations, search, filtering, stock management
 * ✅ Covers data transformation, analytics, and file downloads
 * ✅ 100% coverage target for productService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock API client and file operations
vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../axiosApi', () => ({
  apiService: {
    request: vi.fn(),
  },
}));

// Mock DOM APIs
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
global.document.createElement = vi.fn(() => ({
  click: vi.fn(),
  style: { display: '' },
  href: '',
  download: '',
}));
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

// Import after mocks
import { productService, transformProductFromServer } from '../productService';
import { apiClient } from '../api';

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe('CRUD Operations', () => {
    describe('getAll() / getProducts()', () => {
      test('should fetch all products with pagination', async () => {
        const mockProducts = [
          {
            id: 1,
            name: 'SS-304-Sheet',
            sku: 'SS304-SH-001',
            category: 'Sheet',
            costPrice: 100,
            sellingPrice: 150,
            quantityInStock: 500,
            status: 'ACTIVE',
          },
          {
            id: 2,
            name: 'SS-316-Coil',
            sku: 'SS316-CL-001',
            category: 'Coil',
            costPrice: 120,
            sellingPrice: 180,
            quantityInStock: 300,
            status: 'ACTIVE',
          },
        ];

        apiClient.get.mockResolvedValueOnce(mockProducts);

        const result = await productService.getProducts({ page: 1, limit: 20 });

        expect(apiClient.get).toHaveBeenCalledWith('/products', {
          page: 1,
          limit: 20,
        });
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('SS-304-Sheet');
      });

      test('should fetch products with getAll() alias', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        await productService.getAll({ page: 1 });

        expect(apiClient.get).toHaveBeenCalledWith('/products', { page: 1 });
      });

      test('should filter products by category', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        await productService.getProducts({ category: 'Sheet' });

        expect(apiClient.get).toHaveBeenCalledWith('/products', {
          category: 'Sheet',
        });
      });

      test('should handle empty product list', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        const result = await productService.getProducts();

        expect(result).toEqual([]);
      });
    });

    describe('getProduct()', () => {
      test('should fetch single product by ID', async () => {
        const mockProduct = {
          id: 1,
          name: 'SS-304-Sheet',
          sku: 'SS304-SH-001',
          grade: '304',
          form: 'Sheet',
          finish: 'Brushed',
          thickness: '2mm',
          width: '1000mm',
          costPrice: 100,
          sellingPrice: 150,
          quantityInStock: 500,
          status: 'ACTIVE',
        };

        apiClient.get.mockResolvedValueOnce(mockProduct);

        const result = await productService.getProduct(1);

        expect(apiClient.get).toHaveBeenCalledWith('/products/1');
        expect(result.id).toBe(1);
        expect(result.name).toBe('SS-304-Sheet');
      });

      test('should handle non-existent product', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Not found'));

        await expect(productService.getProduct(999)).rejects.toThrow(
          'Not found'
        );
      });
    });

    describe('createProduct()', () => {
      test('should create new product', async () => {
        const newProduct = {
          name: 'SS-304-Pipe',
          sku: 'SS304-PP-001',
          category: 'Pipe',
          grade: '304',
          form: 'Pipe',
          unit: 'KG',
          costPrice: 80,
          sellingPrice: 120,
          quantityInStock: 0,
          status: 'ACTIVE',
        };

        const created = {
          id: 10,
          ...newProduct,
        };

        apiClient.post.mockResolvedValueOnce(created);

        const result = await productService.createProduct(newProduct);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/products',
          newProduct
        );
        expect(result.id).toBe(10);
        expect(result.name).toBe('SS-304-Pipe');
      });

      test('should validate required fields', async () => {
        apiClient.post.mockRejectedValueOnce(
          new Error('Validation: Name required')
        );

        await expect(
          productService.createProduct({
            sku: 'INCOMPLETE',
          })
        ).rejects.toThrow('Validation');
      });
    });

    describe('updateProduct()', () => {
      test('should update existing product', async () => {
        const updates = {
          sellingPrice: 175,
          quantityInStock: 400,
          status: 'ACTIVE',
        };

        const updated = {
          id: 1,
          name: 'SS-304-Sheet',
          ...updates,
        };

        apiClient.put.mockResolvedValueOnce(updated);

        const result = await productService.updateProduct(1, updates);

        expect(apiClient.put).toHaveBeenCalledWith(
          '/products/1',
          updates
        );
        expect(result.sellingPrice).toBe(175);
      });
    });

    describe('deleteProduct()', () => {
      test('should delete product', async () => {
        apiClient.delete.mockResolvedValueOnce({ success: true });

        const result = await productService.deleteProduct(1);

        expect(apiClient.delete).toHaveBeenCalledWith('/products/1');
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // PRICING & STOCK OPERATIONS
  // ============================================================================

  describe('Pricing & Stock Operations', () => {
    describe('updateProductPrice()', () => {
      test('should update product price', async () => {
        const priceData = {
          costPrice: 95,
          sellingPrice: 160,
          margin: '68.42%',
        };

        apiClient.post.mockResolvedValueOnce({
          id: 1,
          ...priceData,
        });

        const result = await productService.updateProductPrice(1, priceData);

        expect(apiClient.post).toHaveBeenCalledWith(
          '/products/1/price-update',
          priceData
        );
        expect(result.sellingPrice).toBe(160);
      });
    });

    describe('updateStock()', () => {
      test('should update product stock', async () => {
        const stockData = {
          quantityInStock: 450,
          minStock: 100,
          maxStock: 1000,
        };

        apiClient.put.mockResolvedValueOnce({
          id: 1,
          ...stockData,
        });

        const result = await productService.updateStock(1, stockData);

        expect(apiClient.put).toHaveBeenCalledWith(
          '/products/1/stock',
          stockData
        );
        expect(result.quantityInStock).toBe(450);
      });
    });
  });

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  describe('Analytics & Reporting', () => {
    describe('getProductAnalytics()', () => {
      test('should fetch product analytics', async () => {
        const mockAnalytics = {
          totalProducts: 150,
          activeProducts: 145,
          inactiveProducts: 5,
          totalInventoryValue: 500000,
          lowStockItems: 12,
          outOfStockItems: 3,
        };

        apiClient.get.mockResolvedValueOnce(mockAnalytics);

        const result = await productService.getProductAnalytics();

        expect(apiClient.get).toHaveBeenCalledWith(
          '/products/analytics'
        );
        expect(result.totalProducts).toBe(150);
        expect(result.activeProducts).toBe(145);
      });

      test('should handle empty analytics', async () => {
        apiClient.get.mockResolvedValueOnce({
          totalProducts: 0,
          activeProducts: 0,
        });

        const result = await productService.getProductAnalytics();

        expect(result.totalProducts).toBe(0);
      });
    });
  });

  // ============================================================================
  // SEARCH & FILTERING
  // ============================================================================

  describe('Search & Filtering', () => {
    describe('searchProducts()', () => {
      test('should search products by term', async () => {
        const mockResults = [
          {
            id: 1,
            name: 'SS-304-Sheet',
            sku: 'SS304-SH-001',
          },
        ];

        apiClient.get.mockResolvedValueOnce(mockResults);

        const result = await productService.searchProducts('304');

        expect(apiClient.get).toHaveBeenCalledWith('/products', {
          search: '304',
        });
        expect(result).toHaveLength(1);
      });

      test('should search with additional filters', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        await productService.searchProducts('SS-304', { category: 'Sheet' });

        expect(apiClient.get).toHaveBeenCalledWith('/products', {
          search: 'SS-304',
          category: 'Sheet',
        });
      });

      test('should handle no search results', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        const result = await productService.searchProducts('NONEXISTENT');

        expect(result).toEqual([]);
      });
    });

    describe('getProductsByCategory()', () => {
      test('should get products by category', async () => {
        const mockProducts = [
          { id: 1, category: 'Sheet', name: 'Product 1' },
          { id: 2, category: 'Sheet', name: 'Product 2' },
        ];

        apiClient.get.mockResolvedValueOnce(mockProducts);

        const result = await productService.getProductsByCategory('Sheet');

        expect(apiClient.get).toHaveBeenCalledWith('/products', {
          category: 'Sheet',
        });
        expect(result).toHaveLength(2);
      });
    });

    describe('getLowStockProducts()', () => {
      test('should get low stock products', async () => {
        const mockProducts = [
          { id: 3, name: 'Low Stock Item 1', quantityInStock: 10 },
          { id: 4, name: 'Low Stock Item 2', quantityInStock: 5 },
        ];

        apiClient.get.mockResolvedValueOnce(mockProducts);

        const result = await productService.getLowStockProducts();

        expect(apiClient.get).toHaveBeenCalledWith('/products', {
          stock_status: 'low',
        });
        expect(result).toHaveLength(2);
      });

      test('should handle no low stock products', async () => {
        apiClient.get.mockResolvedValueOnce([]);

        const result = await productService.getLowStockProducts();

        expect(result).toEqual([]);
      });
    });
  });

  // ============================================================================
  // WAREHOUSE OPERATIONS
  // ============================================================================

  describe('Warehouse Operations', () => {
    describe('getWarehouseStock()', () => {
      test('should get warehouse stock for product', async () => {
        const mockStock = {
          productId: 1,
          warehouses: [
            {
              warehouseId: 1,
              warehouseName: 'Main Warehouse',
              quantity: 300,
            },
            {
              warehouseId: 2,
              warehouseName: 'Secondary Warehouse',
              quantity: 200,
            },
          ],
          totalStock: 500,
        };

        apiClient.get.mockResolvedValueOnce(mockStock);

        const result = await productService.getWarehouseStock(1);

        expect(apiClient.get).toHaveBeenCalledWith(
          '/products/warehouse-stock',
          { productId: 1 }
        );
        expect(result.totalStock).toBe(500);
        expect(result.warehouses).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  describe('File Operations', () => {
    describe('downloadProducts()', () => {
      test('should download products as file', async () => {
        const mockBlob = new Blob(['product data'], {
          type: 'application/vnd.openxmlformats',
        });

        const { apiService } = await import('../axiosApi');
        apiService.request = vi.fn().mockResolvedValueOnce(mockBlob);

        // Mock document functions
        const mockLink = { click: vi.fn(), style: {}, download: '' };
        vi.mocked(global.document.createElement).mockReturnValueOnce(mockLink);

        await productService.downloadProducts();

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockLink.download).toMatch(/^products_\d{4}-\d{2}-\d{2}\.xlsx$/);
      });
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe('Data Transformation', () => {
    describe('transformProductFromServer()', () => {
      test('should transform product with camelCase conversion', () => {
        const serverData = {
          id: 1,
          name: 'SS-304-Sheet',
          sku: 'SS304-SH-001',
          grade: '304',
          form: 'Sheet',
          finish: 'Brushed',
          size: '1000x2000',
          thickness: '2mm',
          unit: 'KG',
          cost_price: '100.00',
          selling_price: '150.00',
          quantity_in_stock: '500',
          reorder_level: '100',
          status: 'ACTIVE',
        };

        const result = transformProductFromServer(serverData);

        expect(result.id).toBe(1);
        expect(result.name).toBe('SS-304-Sheet');
        expect(result.costPrice).toBe(100);
        expect(result.sellingPrice).toBe(150);
        expect(result.quantityInStock).toBe(500);
        expect(result.reorderLevel).toBe(100);
      });

      test('should handle product naming system fields', () => {
        const serverData = {
          id: 1,
          unique_name: 'SS-304-Sheet-Brushed-1000mm-2mm-2000mm',
          display_name: 'SS-304-Sheet',
          full_name: 'Stainless Steel 304 Grade Sheet Brushed Finish',
        };

        const result = transformProductFromServer(serverData);

        expect(result.uniqueName).toBe(
          'SS-304-Sheet-Brushed-1000mm-2mm-2000mm'
        );
        expect(result.displayName).toBe('SS-304-Sheet');
        expect(result.fullName).toContain('Stainless Steel');
      });

      test('should handle material specifications', () => {
        const serverData = {
          id: 1,
          grade: '304',
          form: 'Pipe',
          finish: 'Polished',
          heat_number: 'HT-2026-001',
          mill_name: 'TATA Steel',
          mill_country: 'India',
          hs_code: '730720',
        };

        const result = transformProductFromServer(serverData);

        expect(result.grade).toBe('304');
        expect(result.form).toBe('Pipe');
        expect(result.heatNumber).toBe('HT-2026-001');
        expect(result.millName).toBe('TATA Steel');
        expect(result.hsCode).toBe('730720');
      });

      test('should handle null input', () => {
        const result = transformProductFromServer(null);
        expect(result).toBeNull();
      });

      test('should provide default values for optional fields', () => {
        const result = transformProductFromServer({});

        expect(result.name).toBe('');
        expect(result.unit).toBe('KG');
        expect(result.costPrice).toBe(0);
        expect(result.sellingPrice).toBe(0);
        expect(result.quantityInStock).toBe(0);
        expect(result.status).toBe('ACTIVE');
      });

      test('should handle various naming system combinations', () => {
        const serverData = {
          id: 1,
          display_name: 'SS-304-Sheet',
          displayName: 'SS-304-Sheet-Alt',
          name: 'SS-304-Sheet-Priority',
        };

        const result = transformProductFromServer(serverData);

        // Should prioritize in order: name -> displayName -> display_name
        expect(result.name).toBe('SS-304-Sheet-Priority');
      });

      test('should handle missing values with fallbacks', () => {
        const result = transformProductFromServer({
          id: 1,
          cost_price: '50',
        });

        expect(result.costPrice).toBe(50);
        expect(result.sellingPrice).toBe(0);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    test('should handle product with very long name', async () => {
      const longName = 'A'.repeat(255);
      const data = {
        name: longName,
        sku: 'LONG-NAME',
        unit: 'KG',
      };

      apiClient.post.mockResolvedValueOnce({ id: 1, ...data });

      const result = await productService.createProduct(data);

      expect(result.name).toBe(longName);
    });

    test('should handle product with special characters', async () => {
      const data = {
        name: 'SS-304™ Sheet © with ® marks',
        sku: 'SPECIAL-CHARS',
        notes: 'Product with é, ñ, ü characters',
      };

      apiClient.post.mockResolvedValueOnce({ id: 1, ...data });

      const result = await productService.createProduct(data);

      expect(result.name).toContain('™');
      expect(result.notes).toContain('é');
    });

    test('should handle zero prices', () => {
      const result = transformProductFromServer({
        cost_price: '0',
        selling_price: '0',
      });

      expect(result.costPrice).toBe(0);
      expect(result.sellingPrice).toBe(0);
    });

    test('should handle very large inventory quantities', () => {
      const result = transformProductFromServer({
        quantity_in_stock: '999999999',
      });

      expect(result.quantityInStock).toBe(999999999);
    });

    test('should handle decimal quantities', () => {
      const result = transformProductFromServer({
        quantity_in_stock: '100.5',
      });

      expect(result.quantityInStock).toBe(100.5);
    });

    test('should handle network timeout', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(productService.getProducts()).rejects.toThrow('timeout');
    });

    test('should handle server errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Server error: 500'));

      await expect(productService.getProducts()).rejects.toThrow('Server error');
    });
  });
});
