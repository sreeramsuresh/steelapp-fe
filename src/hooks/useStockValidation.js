import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';

/**
 * Hook for validating stock availability before form submission
 * 
 * Features:
 * - Check stock availability for products
 * - Validate UOM compatibility
 * - Show conversion preview when UOMs differ
 * - Return shortfall warnings
 */
export function useStockValidation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Check if sufficient stock is available for a product
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {number} quantity - Requested quantity
   * @param {string} unit - Unit of measure (KG, MT, PCS, etc.)
   * @returns {Promise<Object>} - { available: boolean, quantityAvailable: number, shortfall: number }
   */
  const checkAvailability = useCallback(async (productId, warehouseId, quantity, unit) => {
    try {
      setLoading(true);
      setError(null);

      // Get inventory items for the product in the specified warehouse
      const response = await inventoryService.getAllItems({
        product_id: productId,
        warehouse_id: warehouseId,
      });

      const items = response?.data || [];
      
      if (items.length === 0) {
        return {
          available: false,
          quantityAvailable: 0,
          shortfall: quantity,
          message: 'Product not found in warehouse',
        };
      }

      // Calculate total available quantity (quantityOnHand - quantityReserved)
      const totalAvailable = items.reduce((sum, item) => {
        return sum + (item.quantityAvailable || (item.quantityOnHand - item.quantityReserved) || 0);
      }, 0);

      // For simplicity, assume same unit (UOM conversion handled separately)
      const shortfall = Math.max(0, quantity - totalAvailable);
      const available = totalAvailable >= quantity;

      return {
        available,
        quantityAvailable: totalAvailable,
        shortfall,
        unit,
        message: available 
          ? `${totalAvailable} ${unit} available` 
          : `Insufficient stock. ${shortfall} ${unit} short`,
      };
    } catch (err) {
      setError(err.message || 'Failed to check stock availability');
      return {
        available: false,
        quantityAvailable: 0,
        shortfall: quantity,
        message: 'Error checking availability',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validate if the requested unit is compatible with the product's stock unit
   * @param {number} productId - Product ID
   * @param {string} requestedUnit - Requested unit (KG, MT, PCS, etc.)
   * @returns {Promise<Object>} - { compatible: boolean, stockUnit: string, message: string }
   */
  const validateUomCompatibility = useCallback(async (productId, requestedUnit) => {
    try {
      setLoading(true);
      setError(null);

      // Get inventory items for the product
      const response = await inventoryService.getAllItems({
        product_id: productId,
      });

      const items = response?.data || [];
      
      if (items.length === 0) {
        return {
          compatible: false,
          stockUnit: null,
          message: 'Product not found in inventory',
        };
      }

      // Get the unit from the first inventory item
      const stockUnit = items[0]?.unit || 'KG';

      // Check if units are compatible (same or convertible)
      const compatible = isUnitCompatible(stockUnit, requestedUnit);

      return {
        compatible,
        stockUnit,
        requestedUnit,
        message: compatible 
          ? 'Units are compatible' 
          : `Unit mismatch: Stock is in ${stockUnit}, requested ${requestedUnit}`,
      };
    } catch (err) {
      setError(err.message || 'Failed to validate UOM compatibility');
      return {
        compatible: false,
        stockUnit: null,
        message: 'Error validating compatibility',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get conversion preview when UOMs differ
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to convert
   * @param {string} fromUnit - Source unit
   * @returns {Promise<Object>} - { convertedQuantity: number, toUnit: string, conversionRate: number }
   */
  const getConversionPreview = useCallback(async (productId, quantity, fromUnit) => {
    try {
      setLoading(true);
      setError(null);

      // Get inventory items to determine stock unit
      const response = await inventoryService.getAllItems({
        product_id: productId,
      });

      const items = response?.data || [];
      
      if (items.length === 0) {
        return {
          convertedQuantity: quantity,
          toUnit: fromUnit,
          conversionRate: 1,
          message: 'No conversion available',
        };
      }

      const stockUnit = items[0]?.unit || 'KG';
      
      // Calculate conversion
      const conversion = convertUnits(quantity, fromUnit, stockUnit);

      return {
        convertedQuantity: conversion.quantity,
        fromUnit,
        toUnit: stockUnit,
        conversionRate: conversion.rate,
        message: `${quantity} ${fromUnit} = ${conversion.quantity} ${stockUnit}`,
      };
    } catch (err) {
      setError(err.message || 'Failed to get conversion preview');
      return {
        convertedQuantity: quantity,
        toUnit: fromUnit,
        conversionRate: 1,
        message: 'Error calculating conversion',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get shortfall warning for a product
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {number} quantity - Requested quantity
   * @returns {Promise<string|null>} - Warning message or null if sufficient stock
   */
  const getShortfallWarning = useCallback(async (productId, warehouseId, quantity) => {
    const result = await checkAvailability(productId, warehouseId, quantity, 'KG');
    
    if (!result.available) {
      return `⚠️ Stock shortfall: ${result.shortfall} ${result.unit}. Only ${result.quantityAvailable} ${result.unit} available.`;
    }
    
    return null;
  }, [checkAvailability]);

  return {
    loading,
    error,
    checkAvailability,
    validateUomCompatibility,
    getConversionPreview,
    getShortfallWarning,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if two units are compatible (same or convertible)
 */
function isUnitCompatible(unit1, unit2) {
  if (unit1 === unit2) return true;
  
  // Weight units are compatible
  const weightUnits = ['KG', 'MT', 'LB', 'TON'];
  if (weightUnits.includes(unit1) && weightUnits.includes(unit2)) return true;
  
  // Length units are compatible
  const lengthUnits = ['MM', 'M', 'FT', 'INCH'];
  if (lengthUnits.includes(unit1) && lengthUnits.includes(unit2)) return true;
  
  return false;
}

/**
 * Convert between units
 */
function convertUnits(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return { quantity, rate: 1 };
  }

  // Weight conversions
  const weightConversions = {
    'KG_TO_MT': 0.001,
    'MT_TO_KG': 1000,
    'LB_TO_KG': 0.453592,
    'KG_TO_LB': 2.20462,
    'MT_TO_LB': 2204.62,
    'LB_TO_MT': 0.000453592,
  };

  // Length conversions
  const lengthConversions = {
    'MM_TO_M': 0.001,
    'M_TO_MM': 1000,
    'INCH_TO_MM': 25.4,
    'MM_TO_INCH': 0.0393701,
    'FT_TO_M': 0.3048,
    'M_TO_FT': 3.28084,
  };

  const conversionKey = `${fromUnit}_TO_${toUnit}`;
  const rate = weightConversions[conversionKey] || lengthConversions[conversionKey] || 1;

  return {
    quantity: quantity * rate,
    rate,
  };
}
