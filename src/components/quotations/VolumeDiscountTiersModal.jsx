import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

export default function VolumeDiscountTiersModal({ isOpen, onClose, tiers, onSave }) {
  const { isDarkMode } = useTheme();
  const [localTiers, setLocalTiers] = useState(tiers || []);

  const addTier = () => {
    setLocalTiers([...localTiers, { minQuantity: 0, discountPercentage: 0, description: "" }]);
  };

  const removeTier = (index) => {
    setLocalTiers(localTiers.filter((_, i) => i !== index));
  };

  const updateTier = (index, field, value) => {
    const updated = [...localTiers];
    updated[index] = { ...updated[index], [field]: value };
    setLocalTiers(updated);
  };

  const handleSave = () => {
    const sortedTiers = localTiers.filter((t) => t.minQuantity > 0).sort((a, b) => a.minQuantity - b.minQuantity);
    onSave(sortedTiers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <button
          type="button"
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-label="Close modal"
        />

        <div
          className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Volume Discount Tiers
              </h3>
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-lg hover:bg-gray-100 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
                aria-label="Close volume discount tiers modal"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Define pricing breaks based on order quantity. Customers will see these tiers on the quotation.
              </p>
              <div
                className={`p-3 rounded-lg border text-xs ${isDarkMode ? "bg-gray-900/30 border-amber-700 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900"}`}
              >
                <p className="font-medium mb-1">Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Minimum quantity must be greater than 0</li>
                  <li>Discount percentage must be between 0 and 100</li>
                  <li>Tiers are automatically sorted by minimum quantity</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {localTiers.map((tier, index) => (
                <div
                  key={tier}
                  className={`flex gap-3 items-start p-3 rounded-lg border ${
                    isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor={`min-quantity-${index}`}
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Min Quantity (kg/MT)
                      </label>
                      <input
                        id={`min-quantity-${index}`}
                        type="number"
                        value={tier.minQuantity}
                        onChange={(e) => updateTier(index, "minQuantity", parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm rounded border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`discount-pct-${index}`}
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Discount %
                      </label>
                      <input
                        id={`discount-pct-${index}`}
                        type="number"
                        step="0.1"
                        value={tier.discountPercentage}
                        onChange={(e) => updateTier(index, "discountPercentage", parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm rounded border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`tier-description-${index}`}
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Description (optional)
                      </label>
                      <input
                        id={`tier-description-${index}`}
                        type="text"
                        value={tier.description}
                        onChange={(e) => updateTier(index, "description", e.target.value)}
                        className={`w-full px-2 py-1 text-sm rounded border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Bulk order"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    className="mt-6 p-1.5 text-red-600 hover:bg-red-50 rounded"
                    aria-label={`Delete tier ${index + 1}`}
                    title="Delete tier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg"
              aria-label="Add new volume discount tier"
              title="Add new tier"
            >
              <Plus className="h-4 w-4" />
              Add Tier
            </button>
          </div>

          <div
            className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t ${
              isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
            >
              Save Tiers
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 sm:mt-0 sm:mr-3 w-full sm:w-auto px-4 py-2 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
