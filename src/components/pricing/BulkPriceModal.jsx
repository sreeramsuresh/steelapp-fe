import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

/**
 * BulkPriceModal - Dialog for bulk percentage price adjustments
 *
 * Allows applying +/- percentage to multiple selected products
 */
export default function BulkPriceModal({
  isOpen,
  onClose,
  selectedCount,
  isDarkMode,
  onApply,
}) {
  const [percentage, setPercentage] = useState(5);
  const [operation, setOperation] = useState("multiply");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    if (!percentage || Number(percentage) === 0) {
      alert("Please enter a percentage");
      return;
    }

    try {
      setIsLoading(true);
      await onApply(percentage, operation);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-lg max-w-md w-full p-6 border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Adjust Prices
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

        {/* Selected Count */}
        <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-300"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>
            {selectedCount} products selected
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-blue-200/70" : "text-blue-700"}`}>
            This will update the base prices for all selected products
          </p>
        </div>

        {/* Operation Selection */}
        <fieldset className="mb-6">
          <legend className={`block text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Operation
          </legend>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="operation"
                value="multiply"
                checked={operation === "multiply"}
                onChange={(e) => setOperation(e.target.value)}
                disabled={isLoading}
                className="w-4 h-4"
              />
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Increase (+)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="operation"
                value="divide"
                checked={operation === "divide"}
                onChange={(e) => setOperation(e.target.value)}
                disabled={isLoading}
                className="w-4 h-4"
              />
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Decrease (-)
              </span>
            </label>
          </div>
        </fieldset>

        {/* Percentage Input */}
        <div className="mb-6">
          <label
            htmlFor="percentage-input"
            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Percentage (%)
          </label>
          <input
            id="percentage-input"
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value === "" ? "" : Number(e.target.value))}
            step="0.1"
            min="0"
            max="100"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-teal-500 focus:ring-teal-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            } focus:outline-none focus:ring-1 disabled:opacity-50`}
          />
          <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {operation === "multiply" ? "Prices will increase" : "Prices will decrease"} by{" "}
            {percentage || 0}%
          </p>
        </div>

        {/* Warning */}
        <div
          className={`mb-6 p-3 rounded-lg flex gap-3 ${
            isDarkMode
              ? "bg-yellow-900/20 border border-yellow-700"
              : "bg-yellow-50 border border-yellow-300"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className={`font-medium ${isDarkMode ? "text-yellow-100" : "text-yellow-900"}`}>
              Action cannot be undone
            </p>
            <p className={`mt-1 ${isDarkMode ? "text-yellow-200/70" : "text-yellow-700"}`}>
              Updated prices will be saved immediately to the database
            </p>
          </div>
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
            onClick={handleApply}
            disabled={isLoading || !percentage || Number(percentage) === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              isDarkMode
                ? "bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:opacity-50"
                : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:opacity-50"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Updating..." : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
