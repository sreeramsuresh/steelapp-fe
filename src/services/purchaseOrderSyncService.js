import { inventoryService } from "./inventoryService";
import { stockMovementService } from "./stockMovementService";
import { notificationService } from "./notificationService";

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
      // eslint-disable-next-line no-console
      console.log("Handling PO status change:", {
        po,
        newStatus,
        newStockStatus,
      });

      // If PO is marked as received, add items to inventory
      if (newStatus === "received" && po.items && po.items.length > 0) {
        await this.addPOItemsToInventory(po);
      }

      // If stock status changes from transit to retain for a received PO
      if (
        newStockStatus === "retain" &&
        po.stockStatus === "transit" &&
        po.status === "received"
      ) {
        await this.movePOFromTransitToStock(po);
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error handling PO status change:", error);
      notificationService.error("Failed to sync PO with inventory");
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
        if ((item.productType || item.name) && item.quantity > 0) {
          // Check if inventory item already exists
          const existingItems = await this.findExistingInventoryItem(
            item,
            po.warehouseId,
          );

          if (existingItems.length > 0) {
            // Update existing inventory item quantity
            const existingItem = existingItems[0];
            const newQuantity = existingItem.quantity + item.quantity;

            await inventoryService.updateItem(existingItem.id, {
              ...existingItem,
              quantity: newQuantity,
            });

            // eslint-disable-next-line no-console
            console.log(
              `Updated existing inventory item ${existingItem.id} with additional quantity ${item.quantity}`,
            );
          } else {
            // Create new inventory item
            const inventoryItem = {
              productType: item.productType || item.name,
              grade: item.grade || "",
              thickness: item.thickness || "",
              size: item.size || "",
              finish: item.finish || "",
              quantity: item.quantity,
              pricePurchased: item.rate || 0,
              sellingPrice: 0, // To be set later
              landedCost: item.rate || 0,
              warehouseId: po.warehouseId,
              warehouseName: po.warehouseName || "",
              location: `From PO #${po.poNumber}`,
              description: this.generateItemDescription(item),
            };

            await inventoryService.createItem(inventoryItem);
            // eslint-disable-next-line no-console
            console.log("Created new inventory item:", inventoryItem);
          }

          // Create stock movement
          await this.createStockMovement(
            po,
            item,
            "IN",
            `Received from PO #${po.poNumber}`,
          );
        }
      }

      notificationService.success(
        `Added ${po.items.length} items to inventory from PO #${po.poNumber}`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error adding PO items to inventory:", error);
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

      notificationService.success(
        `PO #${po.poNumber} items moved from transit to stock`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error moving PO from transit to stock:", error);
      throw error;
    }
  }

  /**
   * Find existing inventory item that matches the PO item
   * @param {Object} item - PO item
   * @param {string} warehouseId - Warehouse ID
   * @returns {Array} - Array of matching inventory items
   */
  async findExistingInventoryItem(_item, _warehouseId) {
    // This would ideally use a search API endpoint
    // For now, we'll create new items to avoid complexity
    return [];
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
        movement,
        productType: item.productType || item.name,
        grade: item.grade || "",
        thickness: item.thickness || "",
        size: item.size || "",
        finish: item.finish || "",
        invoiceNo: po.poNumber,
        quantity: movement === "OUT" ? -item.quantity : item.quantity,
        currentStock: 0, // Will be calculated by backend
        seller: po.supplierName,
        notes,
      };

      await stockMovementService.createMovement(stockMovement);
      // eslint-disable-next-line no-console
      console.log("Created stock movement:", stockMovement);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating stock movement:", error);
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
    if (item.productType || item.name)
      parts.push(`SS ${(item.productType || item.name).toUpperCase()}`);
    if (item.grade)
      parts.push(item.grade.replace(/^(gr|ss)\s*/i, "").toUpperCase());
    if (item.finish) parts.push(`${item.finish} finish`);
    if (item.size) parts.push(item.size);
    if (item.thickness) parts.push(`${item.thickness}MM`);

    return parts.join(" ") || "Steel Product";
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
      if (
        po.stockStatus === "transit" &&
        po.status !== "received" &&
        po.status !== "cancelled"
      ) {
        if (po.items && Array.isArray(po.items)) {
          for (const item of po.items) {
            if ((item.productType || item.name) && item.quantity > 0) {
              transitMovements.push({
                id: `transit_${po.id}_${item.id || Math.random()}`,
                date: po.expectedDeliveryDate || po.poDate,
                movement: "OUT",
                productType: item.productType || item.name,
                grade: item.grade || "",
                thickness: item.thickness || "",
                size: item.size || "",
                finish: item.finish || "",
                invoiceNo: po.poNumber,
                quantity: -item.quantity, // Negative for transit
                currentStock: 0,
                seller: po.supplierName,
                notes: `In Transit from PO #${po.poNumber}`,
                isTransit: true,
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
