import { inventoryService } from "../services/inventoryService";
import { stockMovementService } from "../services/stockMovementService";

/**
 * Stock status constants
 */
export const STOCK_STATUS = {
  OUT_OF_STOCK: "out_of_stock",
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
};

/**
 * Calculate stock status based on current stock, min stock, and max stock
 *
 * Logic:
 * - OUT_OF_STOCK: quantity is 0 or negative (always takes priority)
 * - LOW: quantity > 0 but <= minStock (or <= 5 if minStock is 0)
 * - HIGH: quantity >= maxStock * 0.8 (only if maxStock > 0)
 * - NORMAL: everything else
 *
 * @param {number|string} currentStock - Current stock quantity
 * @param {number|string} minStock - Minimum stock threshold
 * @param {number|string} maxStock - Maximum stock threshold
 * @returns {string} Stock status: 'out_of_stock', 'low', 'high', or 'normal'
 */
export const getStockStatus = (currentStock, minStock = 0, maxStock = 0) => {
  const qty = Number(currentStock) || 0;
  const min = Number(minStock) || 0;
  const max = Number(maxStock) || 0;

  // CRITICAL: Out of stock takes priority over everything
  if (qty <= 0) {
    return STOCK_STATUS.OUT_OF_STOCK;
  }

  // Low stock check
  // If minStock is 0 (not set), use 5 as default threshold
  const effectiveMinStock = min > 0 ? min : 5;
  if (qty <= effectiveMinStock) {
    return STOCK_STATUS.LOW;
  }

  // High stock check - only if maxStock is defined and > 0
  // Prevent false positives when maxStock is 0 or undefined
  if (max > 0 && qty >= max * 0.8) {
    return STOCK_STATUS.HIGH;
  }

  return STOCK_STATUS.NORMAL;
};

/**
 * Get display label for stock status
 * @param {string} status - Stock status constant
 * @returns {string} Human-readable label
 */
export const getStockStatusLabel = (status) => {
  switch (status) {
    case STOCK_STATUS.OUT_OF_STOCK:
      return "OUT OF STOCK";
    case STOCK_STATUS.LOW:
      return "LOW";
    case STOCK_STATUS.HIGH:
      return "HIGH";
    default:
      return "NORMAL";
  }
};

/**
 * Get color/style config for stock status
 * @param {string} status - Stock status constant
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Style configuration object
 */
export const getStockStatusStyles = (status, isDarkMode = false) => {
  const styles = {
    [STOCK_STATUS.OUT_OF_STOCK]: {
      bgClass: isDarkMode ? "bg-red-950/50 text-red-400 border-red-800" : "bg-red-100 text-red-800 border-red-300",
      color: "#7f1d1d",
      progressClass: "bg-red-900",
    },
    [STOCK_STATUS.LOW]: {
      bgClass: isDarkMode ? "bg-red-900/30 text-red-300 border-red-700" : "bg-red-50 text-red-700 border-red-200",
      color: "#dc2626",
      progressClass: "bg-red-500",
    },
    [STOCK_STATUS.HIGH]: {
      bgClass: isDarkMode
        ? "bg-green-900/30 text-green-300 border-green-700"
        : "bg-green-50 text-green-700 border-green-200",
      color: "#059669",
      progressClass: "bg-green-500",
    },
    [STOCK_STATUS.NORMAL]: {
      bgClass: isDarkMode ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200",
      color: "#2563eb",
      progressClass: "bg-blue-500",
    },
  };

  return styles[status] || styles[STOCK_STATUS.NORMAL];
};

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
        date: invoice.date || new Date().toISOString().split("T")[0],
        movement: "OUT", // Invoice items are outgoing
        productType: productDetails.productType || "",
        grade: productDetails.grade || "",
        thickness: productDetails.thickness || "",
        size: productDetails.size || "",
        finish: productDetails.finish || "",
        invoiceNo: invoice.invoiceNumber,
        quantity: item.quantity,
        currentStock: 0, // Will be updated after checking current inventory
        seller: invoice.customer?.name || "",
      };

      // Get current stock for this product
      try {
        const stockResponse = await stockMovementService.getCurrentStock(
          movement.productType,
          movement.grade,
          movement.size,
          movement.thickness,
          movement.finish
        );
        movement.currentStock = Math.max(0, (stockResponse.currentStock || 0) - movement.quantity);
      } catch (error) {
        console.warn("Could not fetch current stock:", error);
      }

      const createdMovement = await stockMovementService.createMovement(movement);
      movements.push(createdMovement);

      // Update inventory quantity if matching item exists
      try {
        await updateInventoryFromMovement(movement);
      } catch (error) {
        console.warn("Could not update inventory:", error);
      }
    }
  } catch (error) {
    console.error("Error creating stock movements from invoice:", error);
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
    const inventoryResponse = await inventoryService.getItemsByProduct(movement.productType, movement.grade);

    const matchingItems =
      inventoryResponse.data?.filter(
        (item) =>
          item.size === movement.size && item.thickness === movement.thickness && item.finish === movement.finish
      ) || [];

    for (const item of matchingItems) {
      const quantityChange = movement.movement === "IN" ? movement.quantity : -movement.quantity;
      const newQuantity = Math.max(0, item.quantity + quantityChange);

      await inventoryService.updateQuantity(item.id, newQuantity, "set");
    }
  } catch (error) {
    console.error("Error updating inventory from movement:", error);
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
    productType: "",
    grade: "",
    thickness: "",
    size: "",
    finish: "",
  };

  // Product type detection
  if (spec.includes("sheet")) details.productType = "Sheet";
  else if (spec.includes("round bar") || spec.includes("rod")) details.productType = "Round Bar";
  else if (spec.includes("rect") || spec.includes("rectangular")) details.productType = "Rect. Tube";
  else if (spec.includes("pipe")) details.productType = "Pipe";
  else if (spec.includes("angle")) details.productType = "Angle";
  else if (spec.includes("channel")) details.productType = "Channel";
  else if (spec.includes("flat")) details.productType = "Flat Bar";

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
  if (spec.includes("brush")) details.finish = "Brush";
  else if (spec.includes("mirror")) details.finish = "Mirror";
  else if (spec.includes("hl") || spec.includes("hair line")) details.finish = "HL";
  else if (spec.includes("ba")) details.finish = "BA";
  else if (spec.includes("matt")) details.finish = "Matt";

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
    console.error("Error fetching low stock alerts:", error);
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
    return (
      response.data || {
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        categories: [],
      }
    );
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    return {
      totalItems: 0,
      totalValue: 0,
      lowStockCount: 0,
      categories: [],
    };
  }
};
