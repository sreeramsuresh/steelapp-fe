import { X } from "lucide-react";
import { useState } from "react";

/**
 * PriceOverrideModal - Dialog to set/edit customer-specific price override
 *
 * Shows default price for reference and allows customer override entry
 */
export default function PriceOverrideModal({
  isOpen,
  onClose,
  product,
  defaultPrice,
  currentPrice,
  onSave,
  isDarkMode,
}) {
  const [newPrice, setNewPrice] = useState(currentPrice || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!newPrice || Number(newPrice) <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }

    try {
      setIsLoading(true);
      await onSave(Number(newPrice));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const discount = currentPrice ? ((1 - Number(newPrice) / Number(defaultPrice)) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg max-w-md w-full p-6 border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Set Customer Price Override
          </h3>
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
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
            {product.product_name}
          </p>
        </div>

        {/* Default Price Display */}
        <div
          className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-300"}`}
        >
          <p className={`text-xs font-medium mb-1 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
            Company Base Price (Reference)
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>
            AED {Number(defaultPrice).toFixed(2)}
          </p>
        </div>

        {/* Price Input */}
        <div className="mb-6">
          <label
            htmlFor="override-price-input"
            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Customer Override Price (AED)
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>د.إ</span>
            <input
              id="override-price-input"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter override price"
              step="0.01"
              min="0"
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              } focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
          {newPrice && Number(newPrice) !== Number(defaultPrice) && (
            <p
              className={`text-xs mt-2 ${
                Number(newPrice) < Number(defaultPrice)
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                    ? "text-orange-400"
                    : "text-orange-600"
              }`}
            >
              {Number(newPrice) < Number(defaultPrice)
                ? `${discount}% discount from base price`
                : `${Math.abs(discount)}% markup from base price`}
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
                ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50"
                : "bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:opacity-50"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Saving..." : "Save Override"}
          </button>
        </div>
      </div>
    </div>
  );
}
