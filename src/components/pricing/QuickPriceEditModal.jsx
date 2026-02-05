import { X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { notificationService } from "../../services/notificationService";
import pricelistService from "../../services/pricelistService";

/**
 * QuickPriceEditModal - Dialog to quickly update product base price
 *
 * Updates the product's selling_price in the default pricelist
 */
export default function QuickPriceEditModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentPrice,
  defaultPricelistId,
  onPriceSaved,
}) {
  const { isDarkMode } = useTheme();
  const [newPrice, setNewPrice] = useState(currentPrice || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!newPrice || Number(newPrice) <= 0) {
      notificationService.error("Please enter a valid price greater than 0");
      return;
    }

    try {
      setIsLoading(true);

      // Update price in default pricelist
      await pricelistService.updateItems(
        defaultPricelistId,
        [
          {
            product_id: productId,
            selling_price: Number(newPrice),
            min_quantity: 1,
          },
        ],
        "upsert"
      );

      notificationService.success(`Price updated to AED ${Number(newPrice).toFixed(2)}`);
      onPriceSaved?.(Number(newPrice));
      onClose();
    } catch (error) {
      console.error("Error updating price:", error);
      notificationService.error(`Failed to update price: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg max-w-md w-full p-6 border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Update Base Price</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Product:</p>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>{productName}</p>
        </div>

        {/* Price Input */}
        <div className="mb-6">
          <label
            htmlFor="price-input"
            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Selling Price (AED)
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>د.إ</span>
            <input
              id="price-input"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter price"
              step="0.01"
              min="0"
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-teal-500 focus:ring-teal-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              } focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
          {currentPrice && Number(newPrice) !== Number(currentPrice) && (
            <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Current: AED {Number(currentPrice).toFixed(2)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !newPrice || Number(newPrice) <= 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              isDarkMode
                ? "bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:opacity-50"
                : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:opacity-50"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Saving..." : "Save Price"}
          </button>
        </div>
      </div>
    </div>
  );
}
