import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoDataService } from '../demoDataService';
import { notificationService } from '../notificationService';
import { productService } from '../productService';

vi.mock("../productService);
vi.mock("../notificationService);

describe('demoDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeDemoProducts', () => {
    it('should initialize demo products in the catalog', async () => {
      productService.createProduct.mockResolvedValue({ id: 1 });

      const result = await demoDataService.initializeDemoProducts();

      expect(productService.createProduct).toHaveBeenCalledTimes(5);
      expect(notificationService.success).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should handle partial product creation failures', async () => {
      productService.createProduct
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValueOnce(new Error('Creation failed'))
        .mockResolvedValue({ id: 2 });

      const result = await demoDataService.initializeDemoProducts();

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('should create stainless steel sheet product', async () => {
      productService.createProduct.mockResolvedValue({ id: 1 });

      await demoDataService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      const steelSheetCall = calls.find(([product]) => product.name === 'Stainless Steel Sheet');

      expect(steelSheetCall).toBeDefined();
      const product = steelSheetCall[0];
      expect(product.category).toBe('sheet');
      expect(product.grade).toBe('304');
    });

    it('should create stainless steel pipe product', async () => {
      productService.createProduct.mockResolvedValue({ id: 2 });

      await demoDataService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      const pipesCall = calls.find(([product]) => product.name === 'Stainless Steel Pipe');

      expect(pipesCall).toBeDefined();
      const product = pipesCall[0];
      expect(product.category).toBe('pipe');
      expect(product.grade).toBe('316L');
    });

    it('should create round bar product', async () => {
      productService.createProduct.mockResolvedValue({ id: 3 });

      await demoDataService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      const barCall = calls.find(([product]) => product.name === 'Round Bar');

      expect(barCall).toBeDefined();
      const product = barCall[0];
      expect(product.category).toBe('bar');
      expect(product.grade).toBe('316');
    });

    it('should create angle bar product', async () => {
      productService.createProduct.mockResolvedValue({ id: 4 });

      await demoDataService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      const angleCall = calls.find(([product]) => product.name === 'Angle Bar');

      expect(angleCall).toBeDefined();
      const product = angleCall[0];
      expect(product.category).toBe('angle');
      expect(product.grade).toBe('304L');
    });

    it('should create flat bar product', async () => {
      productService.createProduct.mockResolvedValue({ id: 5 });

      await demoDataService.initializeDemoProducts();

      const calls = productService.createProduct.mock.calls;
      const flatCall = calls.find(([product]) => product.name === 'Flat Bar');

      expect(flatCall).toBeDefined();
      const product = flatCall[0];
      expect(product.category).toBe('flat');
      expect(product.grade).toBe('316L');
    });

    it('should handle all products failing', async () => {
      productService.createProduct.mockRejectedValue(new Error('API Error'));

      const result = await demoDataService.initializeDemoProducts();

      expect(result).toBe(0);
      expect(notificationService.error).toHaveBeenCalled();
    });

    it('should show success notification when at least one product created', async () => {
      productService.createProduct
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValue(new Error('Failed'));

      await demoDataService.initializeDemoProducts();

      expect(notificationService.success).toHaveBeenCalledWith(
        expect.stringContaining('Initialized'),
      );
    });

    it('should show error notification on general failure', async () => {
      productService.createProduct.mockImplementation(() => {
        throw new Error('Service error');
      });

      const result = await demoDataService.initializeDemoProducts();

      expect(result).toBe(0);
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('checkDemoProductsExist', () => {
    it('should return true when products exist', async () => {
      productService.getProducts.mockResolvedValue({
        products: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ],
      });

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(true);
      expect(productService.getProducts).toHaveBeenCalled();
    });

    it('should return false when no products exist', async () => {
      productService.getProducts.mockResolvedValue({
        products: [],
      });

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(false);
    });

    it('should return false when response has no products array', async () => {
      productService.getProducts.mockResolvedValue({});

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      productService.getProducts.mockRejectedValue(new Error('API Error'));

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(false);
    });

    it('should handle different response formats', async () => {
      productService.getProducts.mockResolvedValue([
        { id: 1, name: 'Product 1' },
      ]);

      const result = await demoDataService.checkDemoProductsExist();

      expect(result).toBe(false);
    });
  });
});
