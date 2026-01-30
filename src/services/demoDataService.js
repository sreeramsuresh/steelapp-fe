import { productService } from './productService';
import { notificationService } from './notificationService';

/**
 * Service to initialize demo data for testing the complete flow
 */
class DemoDataService {
  /**
   * Initialize demo products in the catalog
   */
  async initializeDemoProducts() {
    const demoProducts = [
      {
        name: 'Stainless Steel Sheet',
        category: 'sheet',
        grade: '304',
        size: '4x8',
        weight: '50',
        unit: 'sheet',
        description:
          'High quality stainless steel sheet for general applications',
        current_stock: 0,
        min_stock: 5,
        max_stock: 100,
        cost_price: 850,
        selling_price: 1200,
        supplier: 'Steel Suppliers LLC',
        location: 'Main Warehouse',
        specifications: {
          length: '2440',
          width: '1220',
          thickness: '1.2',
          tensileStrength: '515 MPa',
          yieldStrength: '205 MPa',
          carbonContent: '0.08%',
          coating: 'None',
          standard: 'ASTM A240',
        },
      },
      {
        name: 'Stainless Steel Pipe',
        category: 'pipe',
        grade: '316L',
        size: '2 inch',
        weight: '25',
        unit: 'meter',
        description: 'Corrosion resistant stainless steel pipe',
        current_stock: 0,
        min_stock: 10,
        max_stock: 200,
        cost_price: 1200,
        selling_price: 1650,
        supplier: 'Industrial Pipes Co',
        location: 'Main Warehouse',
        specifications: {
          diameter: '50.8',
          thickness: '3.0',
          tensileStrength: '485 MPa',
          yieldStrength: '170 MPa',
          carbonContent: '0.03%',
          coating: 'Pickled',
          standard: 'ASTM A312',
        },
      },
      {
        name: 'Round Bar',
        category: 'bar',
        grade: '316',
        size: '25mm',
        weight: '15',
        unit: 'meter',
        description: 'Precision round bar for machining applications',
        current_stock: 0,
        min_stock: 20,
        max_stock: 150,
        cost_price: 950,
        selling_price: 1350,
        supplier: 'Precision Steel Works',
        location: 'Dubai Warehouse',
        specifications: {
          diameter: '25',
          tensileStrength: '520 MPa',
          yieldStrength: '210 MPa',
          carbonContent: '0.08%',
          coating: 'Bright',
          standard: 'ASTM A276',
        },
      },
      {
        name: 'Angle Bar',
        category: 'angle',
        grade: '304L',
        size: '50x50x5',
        weight: '20',
        unit: 'meter',
        description: 'L-shaped structural angle bar',
        current_stock: 0,
        min_stock: 15,
        max_stock: 100,
        cost_price: 720,
        selling_price: 1050,
        supplier: 'Structural Steel Ltd',
        location: 'Abu Dhabi Warehouse',
        specifications: {
          width: '50',
          height: '50',
          thickness: '5',
          tensileStrength: '485 MPa',
          yieldStrength: '170 MPa',
          carbonContent: '0.03%',
          coating: '2B',
          standard: 'ASTM A276',
        },
      },
      {
        name: 'Flat Bar',
        category: 'flat',
        grade: '316L',
        size: '40x10',
        weight: '12',
        unit: 'meter',
        description: 'Flat bar for various fabrication needs',
        current_stock: 0,
        min_stock: 25,
        max_stock: 200,
        cost_price: 890,
        selling_price: 1280,
        supplier: 'Metro Steel Trading',
        location: 'Main Warehouse',
        specifications: {
          width: '40',
          thickness: '10',
          tensileStrength: '485 MPa',
          yieldStrength: '170 MPa',
          carbonContent: '0.03%',
          coating: 'HL',
          standard: 'ASTM A240',
        },
      },
    ];

    try {
      let successCount = 0;
      for (const product of demoProducts) {
        try {
          await productService.createProduct(product);
          successCount++;
        } catch (error) {
          console.warn(`Failed to create product ${product.name}:`, error);
        }
      }

      if (successCount > 0) {
        notificationService.success(
          `Initialized ${successCount} demo products in catalog`,
        );
      }

      return successCount;
    } catch (error) {
      console.error('Error initializing demo products:', error);
      notificationService.error('Failed to initialize demo products');
      return 0;
    }
  }

  /**
   * Check if demo products already exist
   */
  async checkDemoProductsExist() {
    try {
      const response = await productService.getProducts();
      const products = response?.products || [];
      return products.length > 0;
    } catch (_error) {
      return false;
    }
  }
}

export const demoDataService = new DemoDataService();
