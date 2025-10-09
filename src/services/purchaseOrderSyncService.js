import { inventoryService } from './inventoryService';
import { stockMovementService } from './stockMovementService';
import { notificationService } from './notificationService';

/**
 * Service to handle synchronization between Purchase Orders, Inventory, and Stock Movement
 */
class PurchaseOrderSyncService {
  
  /**
   * Handle PO status change and sync with inventory/stock movement
   * @param {Object} po - Purchase Order object
   * @param {string} newStatus - New status ('received', 'cancelled', etc.)
   * @param {string} newStockStatus - New stock status ('transit', 'retain')
   */
  async handlePOStatusChange(po, newStatus, newStockStatus) {
    try {
      console.log('Handling PO status change:', { po, newStatus, newStockStatus });
      
      // If PO is marked as received, add items to inventory
      if (newStatus === 'received' && po.items && po.items.length > 0) {
        await this.addPOItemsToInventory(po);
      }
      
      // If stock status changes from transit to retain for a received PO
      if (newStockStatus === 'retain' && po.stock_status === 'transit' && po.status === 'received') {
        await this.movePOFromTransitToStock(po);
      }
      
      return true;
    } catch (error) {
      console.error('Error handling PO status change:', error);
      notificationService.error('Failed to sync PO with inventory');
      throw error;
    }
  }
  
  /**
   * Add PO items to inventory when PO is received
   * @param {Object} po - Purchase Order object
   */
  async addPOItemsToInventory(po) {
    try {
      for (const item of po.items) {
        if ((item.product_type || item.name) && item.quantity > 0) {
          // Check if inventory item already exists
          const existingItems = await this.findExistingInventoryItem(item, po.warehouse_id);
          
          if (existingItems.length > 0) {
            // Update existing inventory item quantity
            const existingItem = existingItems[0];
            const newQuantity = existingItem.quantity + item.quantity;
            
            await inventoryService.updateItem(existingItem.id, {
              ...existingItem,
              quantity: newQuantity
            });
            
            console.log(`Updated existing inventory item ${existingItem.id} with additional quantity ${item.quantity}`);
          } else {
            // Create new inventory item
            const inventoryItem = {
              productType: item.product_type || item.name,
              grade: item.grade || '',
              thickness: item.thickness || '',
              size: item.size || '',
              finish: item.finish || '',
              quantity: item.quantity,
              pricePurchased: item.rate || 0,
              sellingPrice: 0, // To be set later
              landedCost: item.rate || 0,
              warehouseId: po.warehouse_id,
              warehouseName: po.warehouse_name || '',
              location: `From PO #${po.po_number}`,
              description: this.generateItemDescription(item)
            };

            await inventoryService.createItem(inventoryItem);
            console.log('Created new inventory item:', inventoryItem);
          }
          
          // Create stock movement
          await this.createStockMovement(po, item, 'IN', `Received from PO #${po.po_number}`);
        }
      }
      
      notificationService.success(`Added ${po.items.length} items to inventory from PO #${po.po_number}`);
    } catch (error) {
      console.error('Error adding PO items to inventory:', error);
      throw error;
    }
  }
  
  /**
   * Move items from transit to actual stock
   * @param {Object} po - Purchase Order object
   */
  async movePOFromTransitToStock(po) {
    try {
      // This will be handled by the stock movement filtering logic
      // Transit items will automatically disappear from stock movement view
      // when stock_status changes from 'transit' to 'retain'
      
      notificationService.success(`PO #${po.po_number} items moved from transit to stock`);
    } catch (error) {
      console.error('Error moving PO from transit to stock:', error);
      throw error;
    }
  }
  
  /**
   * Find existing inventory item that matches the PO item
   * @param {Object} item - PO item
   * @param {string} warehouseId - Warehouse ID
   * @returns {Array} - Array of matching inventory items
   */
  async findExistingInventoryItem(item, warehouseId) {
    try {
      // This would ideally use a search API endpoint
      // For now, we'll create new items to avoid complexity
      return [];
    } catch (error) {
      console.warn('Error finding existing inventory item:', error);
      return [];
    }
  }
  
  /**
   * Create stock movement record
   * @param {Object} po - Purchase Order object
   * @param {Object} item - PO item
   * @param {string} movement - 'IN' or 'OUT'
   * @param {string} notes - Movement notes
   */
  async createStockMovement(po, item, movement, notes) {
    try {
      const stockMovement = {
        date: new Date().toISOString().split("T")[0],
        movement: movement,
        productType: item.product_type || item.name,
        grade: item.grade || '',
        thickness: item.thickness || '',
        size: item.size || '',
        finish: item.finish || '',
        invoiceNo: po.po_number,
        quantity: movement === 'OUT' ? -item.quantity : item.quantity,
        currentStock: 0, // Will be calculated by backend
        seller: po.supplier_name,
        notes: notes
      };
      
      await stockMovementService.createMovement(stockMovement);
      console.log('Created stock movement:', stockMovement);
    } catch (error) {
      console.error('Error creating stock movement:', error);
      throw error;
    }
  }
  
  /**
   * Generate item description from PO item details
   * @param {Object} item - PO item
   * @returns {string} - Generated description
   */
  generateItemDescription(item) {
    const parts = [];
    if (item.product_type || item.name) parts.push(`SS ${(item.product_type || item.name).toUpperCase()}`);
    if (item.grade) parts.push(`GR${item.grade}`);
    if (item.finish) parts.push(`${item.finish} finish`);
    if (item.size) parts.push(item.size);
    if (item.thickness) parts.push(`${item.thickness}MM`);
    
    return parts.join(' ') || 'Steel Product';
  }
  
  /**
   * Get PO items that should appear in stock movement as transit
   * @param {Array} purchaseOrders - Array of POs
   * @returns {Array} - Array of transit stock movements
   */
  generateTransitStockMovements(purchaseOrders) {
    const transitMovements = [];
    
    for (const po of purchaseOrders) {
      // Only show as transit if stock_status is 'transit' and not yet received/cancelled
      if (po.stock_status === 'transit' && po.status !== 'received' && po.status !== 'cancelled') {
        if (po.items && Array.isArray(po.items)) {
          for (const item of po.items) {
            if ((item.product_type || item.name) && item.quantity > 0) {
              transitMovements.push({
                id: `transit_${po.id}_${item.id || Math.random()}`,
                date: po.expected_delivery_date || po.po_date,
                movement: "OUT",
                productType: item.product_type || item.name,
                grade: item.grade || '',
                thickness: item.thickness || '',
                size: item.size || '',
                finish: item.finish || '',
                invoiceNo: po.po_number,
                quantity: -item.quantity, // Negative for transit
                currentStock: 0,
                seller: po.supplier_name,
                notes: `In Transit from PO #${po.po_number}`,
                isTransit: true
              });
            }
          }
        }
      }
    }
    
    return transitMovements;
  }
}

export const purchaseOrderSyncService = new PurchaseOrderSyncService();