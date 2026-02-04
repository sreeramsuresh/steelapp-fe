import { AlertCircle, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { productsAPI } from "../../services/api";

export default function AlternativeProductsModal({ isOpen, onClose, alternatives, onSave, currentProductId }) {
  const { isDarkMode } = useTheme();
  const [localAlternatives, setLocalAlternatives] = useState(alternatives || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLocalAlternatives(alternatives || []);
      setValidationError("");
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, alternatives]);

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await productsAPI.list({
        search: searchQuery,
        limit: 20,
      });
      // Filter out current product and already added alternatives
      const filtered = (response.data.products || []).filter(
        (p) => p.id !== currentProductId && !localAlternatives.some((alt) => alt.productId === p.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("Error searching products:", err);
    } finally {
      setSearching(false);
    }
  };

  const addAlternative = (product) => {
    if (localAlternatives.length >= 3) {
      setValidationError("Maximum 3 alternative products allowed");
      return;
    }

    setLocalAlternatives([
      ...localAlternatives,
      {
        productId: product.id,
        productName: product.name,
        priceDifference: 0,
        notes: "",
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
    setValidationError("");
  };

  const removeAlternative = (index) => {
    setLocalAlternatives(localAlternatives.filter((_, i) => i !== index));
    setValidationError("");
  };

  const updateAlternative = (index, field, value) => {
    const updated = [...localAlternatives];
    updated[index] = { ...updated[index], [field]: value };
    setLocalAlternatives(updated);
  };

  const handleSave = () => {
    onSave(localAlternatives);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onClose();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        />

        <div
          className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Alternative Products
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Add up to 3 substitute products if primary is unavailable
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800">{validationError}</p>
              </div>
            )}

            {/* Search Section */}
            {localAlternatives.length < 3 && (
              <div className="mb-4">
                <label
                  htmlFor="search-alternatives"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Search for Alternative Products
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="search-alternatives"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                      placeholder="Search by name, grade, specification..."
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchProducts}
                    disabled={searching || !searchQuery.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div
                    className={`mt-2 max-h-48 overflow-y-auto rounded-lg border ${
                      isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-white"
                    }`}
                  >
                    {searchResults.map((product) => (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => addAlternative(product)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                          isDarkMode ? "hover:bg-gray-600" : ""
                        } border-b ${isDarkMode ? "border-gray-600" : "border-gray-200"} last:border-0`}
                      >
                        <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {product.name}
                        </div>
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {product.specifications}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alternative Products List */}
            <div className="space-y-3 mb-4">
              {localAlternatives.map((alt, index) => (
                <div
                  key={alt}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <div>
                        <label
                          htmlFor={`product-name-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Product
                        </label>
                        <input
                          id={`product-name-${index}`}
                          type="text"
                          value={alt.productName}
                          disabled
                          className={`w-full px-2 py-1.5 text-sm rounded border ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-gray-400"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`price-diff-${index}`}
                            className={`block text-xs font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Price Difference (%)
                          </label>
                          <input
                            id={`price-diff-${index}`}
                            type="number"
                            step="0.1"
                            value={alt.priceDifference}
                            onChange={(e) =>
                              updateAlternative(index, "priceDifference", parseFloat(e.target.value) || 0)
                            }
                            className={`w-full px-2 py-1.5 text-sm rounded border ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                            placeholder="0"
                          />
                          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {alt.priceDifference > 0 ? "+" : ""}
                            {alt.priceDifference}% vs. primary
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor={`notes-${index}`}
                            className={`block text-xs font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Notes (optional)
                          </label>
                          <input
                            id={`notes-${index}`}
                            type="text"
                            value={alt.notes}
                            onChange={(e) => updateAlternative(index, "notes", e.target.value)}
                            className={`w-full px-2 py-1.5 text-sm rounded border ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                            placeholder="Similar quality"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAlternative(index)}
                      className="mt-5 p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {localAlternatives.length === 0 && (
                <div className="text-center py-8">
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No alternative products added yet. Search and add up to 3 alternatives.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t ${
              isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Save Alternatives
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
