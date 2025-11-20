import { stockMovementService } from '../services/stockMovementService';
import { inventoryService } from '../services/inventoryService';

/**
 * Creates stock movements from an invoice
 * @param {Object} invoice - The invoice object
 * @returns {Promise<Array>} Array of created stock movements
 */
export const createStockMovementsFromInvoice = async (invoice) => {
  const movements = [];
  
  try {
    for (const item of invoice.items) {
      // Extract product details from item specification or name
      const productDetails = parseProductSpecification(item.specification || item.name);
      
      const movement = {
        date: invoice.date || new Date().toISOString().split('T')[0],
        movement: 'OUT', // Invoice items are outgoing
        productType: productDetails.productType || '',
        grade: productDetails.grade || '',
        thickness: productDetails.thickness || '',
        size: productDetails.size || '',
        finish: productDetails.finish || '',
        invoiceNo: invoice.invoiceNumber,
        quantity: item.quantity,
        currentStock: 0, // Will be updated after checking current inventory
        seller: invoice.customer?.name || '',
      };

      // Get current stock for this product
      try {
        const stockResponse = await stockMovementService.getCurrentStock(
          movement.productType,
          movement.grade,
          movement.size,
          movement.thickness,
          movement.finish,
        );
        movement.currentStock = Math.max(0, (stockResponse.currentStock || 0) - movement.quantity);
      } catch (error) {
        console.warn('Could not fetch current stock:', error);
      }

      const createdMovement = await stockMovementService.createMovement(movement);
      movements.push(createdMovement);

      // Update inventory quantity if matching item exists
      try {
        await updateInventoryFromMovement(movement);
      } catch (error) {
        console.warn('Could not update inventory:', error);
      }
    }
  } catch (error) {
    console.error('Error creating stock movements from invoice:', error);
    throw error;
  }
  
  return movements;
};

/**
 * Updates inventory quantity based on stock movement
 * @param {Object} movement - The stock movement object
 */
export const updateInventoryFromMovement = async (movement) => {
  try {
    // Find matching inventory items
    const inventoryResponse = await inventoryService.getItemsByProduct(
      movement.productType,
      movement.grade,
    );
    
    const matchingItems = inventoryResponse.data?.filter(item => 
      item.size === movement.size && 
      item.thickness === movement.thickness &&
      item.finish === movement.finish,
    ) || [];

    for (const item of matchingItems) {
      const quantityChange = movement.movement === 'IN' ? movement.quantity : -movement.quantity;
      const newQuantity = Math.max(0, item.quantity + quantityChange);
      
      await inventoryService.updateQuantity(item.id, newQuantity, 'set');
    }
  } catch (error) {
    console.error('Error updating inventory from movement:', error);
    throw error;
  }
};

/**
 * Parses product specification string to extract product details
 * @param {string} specification - Product specification string
 * @returns {Object} Parsed product details
 */
export const parseProductSpecification = (specification) => {
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

  // Thickness detection (e.g., 0.8mm, 1.2, 2.0mm)
  const thicknessMatch = spec.match(/(\d+\.?\d*)\s*mm|\b(\d+\.?\d*)\b(?=\s*(mm|thick))/);
  if (thicknessMatch) details.thickness = thicknessMatch[1] || thicknessMatch[2];

  // Size detection (e.g., 4x8, 4x10)
  const sizeMatch = spec.match(/(\d+)\s*[x×]\s*(\d+)/);
  if (sizeMatch) details.size = `${sizeMatch[1]}x${sizeMatch[2]}`;

  // Finish detection
  if (spec.includes('brush')) details.finish = 'Brush';
  else if (spec.includes('mirror')) details.finish = 'Mirror';
  else if (spec.includes('hl') || spec.includes('hair line')) details.finish = 'HL';
  else if (spec.includes('ba')) details.finish = 'BA';
  else if (spec.includes('matt')) details.finish = 'Matt';

  return details;
};

/**
 * Gets low stock alerts for inventory items
 * @param {number} threshold - Stock threshold for low stock alert
 * @returns {Promise<Array>} Array of low stock items
 */
export const getLowStockAlerts = async (threshold = 5) => {
  try {
    const response = await inventoryService.getLowStockItems(threshold);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return [];
  }
};

/**
 * Generates inventory summary with totals and categories
 * @returns {Promise<Object>} Inventory summary object
 */
export const getInventorySummary = async () => {
  try {
    const response = await inventoryService.getInventorySummary();
    return response.data || {
      totalItems: 0,
      totalValue: 0,
      lowStockCount: 0,
      categories: [],
    };
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    return {
      totalItems: 0,
      totalValue: 0,
      lowStockCount: 0,
      categories: [],
    };
  }
};
