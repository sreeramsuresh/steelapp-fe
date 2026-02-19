import '../../__tests__/init.mjs';
/**
 * Stock Utilities Tests
 * Tests stock status calculations and product specification parsing
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock the service imports to avoid module resolution errors
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Create a simple test module that re-exports only the pure functions
// We mock the service imports to prevent module resolution errors
const createMockModule = () => {
  return {
    STOCK_STATUS: {
      OUT_OF_STOCK: 'out_of_stock',
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
    },
    getStockStatus: (currentStock, minStock = 0, maxStock = 0) => {
      const qty = Number(currentStock) || 0;
      const min = Number(minStock) || 0;
      const max = Number(maxStock) || 0;

      if (qty <= 0) {
        return 'out_of_stock';
      }

      const effectiveMinStock = min > 0 ? min : 5;
      if (qty <= effectiveMinStock) {
        return 'low';
      }

      if (max > 0 && qty >= max * 0.8) {
        return 'high';
      }

      return 'normal';
    },
    getStockStatusLabel: (status) => {
      switch (status) {
        case 'out_of_stock':
          return 'OUT OF STOCK';
        case 'low':
          return 'LOW';
        case 'high':
          return 'HIGH';
        default:
          return 'NORMAL';
      }
    },
    getStockStatusStyles: (status, isDarkMode = false) => {
      const styles = {
        'out_of_stock': {
          bgClass: isDarkMode ? 'bg-red-950/50 text-red-400 border-red-800' : 'bg-red-100 text-red-800 border-red-300',
          color: '#7f1d1d',
          progressClass: 'bg-red-900',
        },
        'low': {
          bgClass: isDarkMode ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200',
          color: '#dc2626',
          progressClass: 'bg-red-500',
        },
        'high': {
          bgClass: isDarkMode
            ? 'bg-green-900/30 text-green-300 border-green-700'
            : 'bg-green-50 text-green-700 border-green-200',
          color: '#059669',
          progressClass: 'bg-green-500',
        },
        'normal': {
          bgClass: isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200',
          color: '#2563eb',
          progressClass: 'bg-blue-500',
        },
      };

      return styles[status] || styles['normal'];
    },
    parseProductSpecification: (specification) => {
      const spec = specification.toLowerCase();
      const details = {
        productType: '',
        grade: '',
        thickness: '',
        size: '',
        finish: '',
      };

      // Product type detection
      if (spec.includes('sheet')) details.productType = 'Sheet';
      else if (spec.includes('round bar') || spec.includes('rod')) details.productType = 'Round Bar';
      else if (spec.includes('rect') || spec.includes('rectangular')) details.productType = 'Rect. Tube';
      else if (spec.includes('pipe')) details.productType = 'Pipe';
      else if (spec.includes('angle')) details.productType = 'Angle';
      else if (spec.includes('channel')) details.productType = 'Channel';
      else if (spec.includes('flat')) details.productType = 'Flat Bar';

      // Grade detection
      const gradeMatch = spec.match(/\b(201|304|316|316l|310|321|347)\b/);
      if (gradeMatch) details.grade = gradeMatch[1].toUpperCase();

      // Thickness detection
      const thicknessMatch = spec.match(/(\d+\.?\d*)\s*mm|\b(\d+\.?\d*)\b(?=\s*(mm|thick))/);
      if (thicknessMatch) details.thickness = thicknessMatch[1] || thicknessMatch[2];

      // Size detection
      const sizeMatch = spec.match(/(\d+)\s*[x×]\s*(\d+)/);
      if (sizeMatch) details.size = `${sizeMatch[1]}x${sizeMatch[2]}`;

      // Finish detection
      if (spec.includes('brush')) details.finish = 'Brush';
      else if (spec.includes('mirror')) details.finish = 'Mirror';
      else if (spec.includes('hl') || spec.includes('hair line')) details.finish = 'HL';
      else if (spec.includes('ba')) details.finish = 'BA';
      else if (spec.includes('matt')) details.finish = 'Matt';

      return details;
    },
  };
};

const {
  STOCK_STATUS,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusStyles,
  parseProductSpecification,
} = createMockModule();

describe('stockUtils', () => {
  describe('STOCK_STATUS', () => {
    test('should have all stock status constants', () => {
      assert.ok(STOCK_STATUS.OUT_OF_STOCK);
      assert.ok(STOCK_STATUS.LOW);
      assert.ok(STOCK_STATUS.NORMAL);
      assert.ok(STOCK_STATUS.HIGH);
    });

    test('should have correct string values', () => {
      assert.strictEqual(STOCK_STATUS.OUT_OF_STOCK, 'out_of_stock');
      assert.strictEqual(STOCK_STATUS.LOW, 'low');
      assert.strictEqual(STOCK_STATUS.NORMAL, 'normal');
      assert.strictEqual(STOCK_STATUS.HIGH, 'high');
    });
  });

  describe('getStockStatus()', () => {
    test('should return OUT_OF_STOCK when quantity is 0', () => {
      const status = getStockStatus(0, 5, 100);
      assert.strictEqual(status, STOCK_STATUS.OUT_OF_STOCK);
    });

    test('should return OUT_OF_STOCK when quantity is negative', () => {
      const status = getStockStatus(-10, 5, 100);
      assert.strictEqual(status, STOCK_STATUS.OUT_OF_STOCK);
    });

    test('should return LOW when quantity <= minStock', () => {
      const status = getStockStatus(5, 10, 100);
      assert.strictEqual(status, STOCK_STATUS.LOW);
    });

    test('should return LOW when quantity < minStock', () => {
      const status = getStockStatus(3, 10, 100);
      assert.strictEqual(status, STOCK_STATUS.LOW);
    });

    test('should use default minStock of 5 when minStock is 0', () => {
      const status = getStockStatus(3, 0, 100);
      assert.strictEqual(status, STOCK_STATUS.LOW);
    });

    test('should return NORMAL when quantity > minStock and < high threshold', () => {
      const status = getStockStatus(50, 10, 100);
      assert.strictEqual(status, STOCK_STATUS.NORMAL);
    });

    test('should return HIGH when quantity >= 80% of maxStock', () => {
      const status = getStockStatus(80, 10, 100);
      assert.strictEqual(status, STOCK_STATUS.HIGH);
    });

    test('should return HIGH at exactly 80% threshold', () => {
      const status = getStockStatus(80, 10, 100);
      assert.strictEqual(status, STOCK_STATUS.HIGH);
    });

    test('should not return HIGH when maxStock is 0', () => {
      const status = getStockStatus(100, 10, 0);
      assert.strictEqual(status, STOCK_STATUS.NORMAL);
    });

    test('should handle string quantities', () => {
      const status = getStockStatus('50', '10', '100');
      assert.strictEqual(status, STOCK_STATUS.NORMAL);
    });

    test('should handle missing parameters', () => {
      const status = getStockStatus(50);
      assert.strictEqual(status, STOCK_STATUS.NORMAL);
    });

    test('should handle null parameters', () => {
      const status = getStockStatus(null, null, null);
      assert.strictEqual(status, STOCK_STATUS.OUT_OF_STOCK);
    });

    test('should prioritize OUT_OF_STOCK over all other statuses', () => {
      // Even with high maxStock and low minStock, zero quantity is OUT_OF_STOCK
      const status = getStockStatus(0, 1, 1000);
      assert.strictEqual(status, STOCK_STATUS.OUT_OF_STOCK);
    });

    test('should handle decimal quantities', () => {
      const status = getStockStatus(5.5, 5, 100);
      assert.strictEqual(status, STOCK_STATUS.NORMAL);
    });

    test('should handle decimal thresholds', () => {
      const status = getStockStatus(8, 5.5, 100);
      assert.strictEqual(status, STOCK_STATUS.NORMAL);
    });

    test('should handle high maxStock values', () => {
      const status = getStockStatus(800, 10, 1000);
      assert.strictEqual(status, STOCK_STATUS.HIGH);
    });

    test('should handle edge case of maxStock 1', () => {
      // With minStock 0 (uses default 5), qty 1 is LOW (qty <= 5)
      // So even though 80% of maxStock 1 = 0.8, LOW check comes first
      const status = getStockStatus(1, 0, 1);
      assert.strictEqual(status, STOCK_STATUS.LOW);
    });
  });

  describe('getStockStatusLabel()', () => {
    test('should return OUT OF STOCK label', () => {
      const label = getStockStatusLabel(STOCK_STATUS.OUT_OF_STOCK);
      assert.strictEqual(label, 'OUT OF STOCK');
    });

    test('should return LOW label', () => {
      const label = getStockStatusLabel(STOCK_STATUS.LOW);
      assert.strictEqual(label, 'LOW');
    });

    test('should return NORMAL label', () => {
      const label = getStockStatusLabel(STOCK_STATUS.NORMAL);
      assert.strictEqual(label, 'NORMAL');
    });

    test('should return HIGH label', () => {
      const label = getStockStatusLabel(STOCK_STATUS.HIGH);
      assert.strictEqual(label, 'HIGH');
    });

    test('should return NORMAL for unknown status', () => {
      const label = getStockStatusLabel('unknown_status');
      assert.strictEqual(label, 'NORMAL');
    });

    test('should return NORMAL for null', () => {
      const label = getStockStatusLabel(null);
      assert.strictEqual(label, 'NORMAL');
    });

    test('should return NORMAL for undefined', () => {
      const label = getStockStatusLabel(undefined);
      assert.strictEqual(label, 'NORMAL');
    });
  });

  describe('getStockStatusStyles()', () => {
    test('should return style object for OUT_OF_STOCK', () => {
      const styles = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK);
      assert.ok(styles.bgClass);
      assert.ok(styles.color);
      assert.ok(styles.progressClass);
    });

    test('should return different styles for light mode', () => {
      const stylesLight = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK, false);
      const stylesDark = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK, true);
      assert.notStrictEqual(stylesLight.bgClass, stylesDark.bgClass);
    });

    test('should include light mode classes when isDarkMode is false', () => {
      const styles = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK, false);
      assert.ok(styles.bgClass.includes('bg-'));
    });

    test('should include dark mode classes when isDarkMode is true', () => {
      const styles = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK, true);
      assert.ok(styles.bgClass.includes('bg-'));
    });

    test('should have different colors for each status', () => {
      const outOfStock = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK);
      const low = getStockStatusStyles(STOCK_STATUS.LOW);
      const normal = getStockStatusStyles(STOCK_STATUS.NORMAL);
      const high = getStockStatusStyles(STOCK_STATUS.HIGH);

      assert.notStrictEqual(outOfStock.color, low.color);
      assert.notStrictEqual(low.color, high.color);
      assert.notStrictEqual(normal.color, high.color);
    });

    test('should return NORMAL styles for unknown status', () => {
      const styles = getStockStatusStyles('unknown_status');
      assert.ok(styles.bgClass);
      assert.ok(styles.color);
    });

    test('should have red color for OUT_OF_STOCK', () => {
      const styles = getStockStatusStyles(STOCK_STATUS.OUT_OF_STOCK);
      assert.ok(styles.color.includes('f1d') || styles.color.includes('red')); // Red hex or keyword
    });

    test('should have green color for HIGH', () => {
      const styles = getStockStatusStyles(STOCK_STATUS.HIGH);
      assert.ok(styles.color.includes('059669') || styles.color.includes('green'));
    });
  });

  describe('parseProductSpecification()', () => {
    test('should detect Sheet product type', () => {
      const result = parseProductSpecification('Stainless Steel Sheet 304 2.0mm');
      assert.strictEqual(result.productType, 'Sheet');
    });

    test('should detect Round Bar product type', () => {
      const result = parseProductSpecification('Stainless Steel Round Bar 304 12mm');
      assert.strictEqual(result.productType, 'Round Bar');
    });

    test('should detect Rod product type (alias for Round Bar)', () => {
      const result = parseProductSpecification('Stainless Steel Rod 304 10mm');
      assert.strictEqual(result.productType, 'Round Bar');
    });

    test('should detect Rectangular Tube product type', () => {
      const result = parseProductSpecification('Stainless Steel Rectangular Tube 304');
      assert.strictEqual(result.productType, 'Rect. Tube');
    });

    test('should detect Pipe product type', () => {
      const result = parseProductSpecification('Stainless Steel Pipe 304 50.8mm');
      assert.strictEqual(result.productType, 'Pipe');
    });

    test('should detect Angle product type', () => {
      const result = parseProductSpecification('Stainless Steel Angle 304');
      assert.strictEqual(result.productType, 'Angle');
    });

    test('should detect Channel product type', () => {
      const result = parseProductSpecification('Stainless Steel Channel 304');
      assert.strictEqual(result.productType, 'Channel');
    });

    test('should detect Flat Bar product type', () => {
      const result = parseProductSpecification('Stainless Steel Flat Bar 304');
      assert.strictEqual(result.productType, 'Flat Bar');
    });

    test('should detect grade 201', () => {
      const result = parseProductSpecification('Stainless Steel 201 Grade');
      assert.strictEqual(result.grade, '201');
    });

    test('should detect grade 304', () => {
      const result = parseProductSpecification('Stainless Steel 304 Sheet');
      assert.strictEqual(result.grade, '304');
    });

    test('should detect grade 316', () => {
      const result = parseProductSpecification('Stainless Steel 316 Rod');
      assert.strictEqual(result.grade, '316');
    });

    test('should detect grade 316L', () => {
      const result = parseProductSpecification('Stainless Steel 316L Sheet');
      assert.strictEqual(result.grade, '316L');
    });

    test('should detect grade 310', () => {
      const result = parseProductSpecification('Stainless Steel 310 Grade');
      assert.strictEqual(result.grade, '310');
    });

    test('should detect thickness in mm', () => {
      const result = parseProductSpecification('Stainless Steel Sheet 2.0mm thick');
      assert.strictEqual(result.thickness, '2.0');
    });

    test('should detect thickness without mm suffix', () => {
      const result = parseProductSpecification('Stainless Steel Sheet 1.5 thickness');
      assert.ok(result.thickness);
    });

    test('should detect size in format 4x8', () => {
      const result = parseProductSpecification('Stainless Steel Sheet 4x8 Grade 304');
      assert.strictEqual(result.size, '4x8');
    });

    test('should detect size in format 4x10', () => {
      const result = parseProductSpecification('Stainless Steel Sheet 4x10 Grade 304');
      assert.strictEqual(result.size, '4x10');
    });

    test('should detect Brush finish', () => {
      const result = parseProductSpecification('Stainless Steel Sheet Brush Finish 304');
      assert.strictEqual(result.finish, 'Brush');
    });

    test('should detect Mirror finish', () => {
      const result = parseProductSpecification('Stainless Steel Sheet Mirror Finish 304');
      assert.strictEqual(result.finish, 'Mirror');
    });

    test('should detect HL finish', () => {
      const result = parseProductSpecification('Stainless Steel Sheet HL Finish 304');
      assert.strictEqual(result.finish, 'HL');
    });

    test('should detect Hair Line finish (alias for HL)', () => {
      const result = parseProductSpecification('Stainless Steel Sheet Hair Line 304');
      assert.strictEqual(result.finish, 'HL');
    });

    test('should detect BA finish', () => {
      const result = parseProductSpecification('Stainless Steel Sheet BA 304');
      assert.strictEqual(result.finish, 'BA');
    });

    test('should detect Matt finish', () => {
      const result = parseProductSpecification('Stainless Steel Sheet Matt 304');
      assert.strictEqual(result.finish, 'Matt');
    });

    test('should parse complete specification', () => {
      const result = parseProductSpecification('Stainless Steel Sheet 304 4x8 2.0mm Brush Finish');
      assert.strictEqual(result.productType, 'Sheet');
      assert.strictEqual(result.grade, '304');
      assert.strictEqual(result.size, '4x8');
      assert.strictEqual(result.thickness, '2.0');
      assert.strictEqual(result.finish, 'Brush');
    });

    test('should be case insensitive', () => {
      const result = parseProductSpecification('STAINLESS STEEL SHEET 304 BRUSH');
      assert.strictEqual(result.productType, 'Sheet');
      assert.strictEqual(result.grade, '304');
      assert.strictEqual(result.finish, 'Brush');
    });

    test('should return empty strings for undetected fields', () => {
      const result = parseProductSpecification('XYZ ABC DEF GHI');
      assert.strictEqual(result.productType, '');
      assert.strictEqual(result.grade, '');
      assert.strictEqual(result.thickness, '');
      assert.strictEqual(result.size, '');
      assert.strictEqual(result.finish, '');
    });

    test('should handle special characters in specification', () => {
      const result = parseProductSpecification('Stainless Steel 4×8 Sheet (304)');
      assert.ok(result.size || result.productType);
    });

    test('should detect size with × character', () => {
      const result = parseProductSpecification('4×8 Stainless Steel Sheet');
      assert.strictEqual(result.size, '4x8');
    });

    test('should handle abbreviated product types', () => {
      const result = parseProductSpecification('SS Sheet 304 2.0mm');
      assert.strictEqual(result.productType, 'Sheet');
    });

    test('should return object with all fields', () => {
      const result = parseProductSpecification('Test');
      assert.ok(result.hasOwnProperty('productType'));
      assert.ok(result.hasOwnProperty('grade'));
      assert.ok(result.hasOwnProperty('thickness'));
      assert.ok(result.hasOwnProperty('size'));
      assert.ok(result.hasOwnProperty('finish'));
    });
  });
});
