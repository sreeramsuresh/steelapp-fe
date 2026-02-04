import { AlertTriangle, Package, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { creditNoteService } from "../../services/creditNoteService";
import { formatCurrency } from "../../utils/invoiceUtils";

const SCRAP_REASON_LABELS = {
  DAMAGED_IN_TRANSIT: "Damaged in Transit",
  MANUFACTURING_DEFECT: "Manufacturing Defect",
  CUSTOMER_DAMAGE: "Customer Damage",
  EXPIRED: "Expired",
  QUALITY_BELOW_STANDARD: "Quality Below Standard",
  OTHER: "Other",
};

const ScrapItemsList = ({ creditNoteId = null, showFilters = true }) => {
  const { isDarkMode } = useTheme();
  const [scrapItems, setScrapItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchScrapItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (creditNoteId) {
        response = await creditNoteService.getScrapItemsByCreditNote(creditNoteId);
      } else {
        response = await creditNoteService.getScrapItems();
      }

      setScrapItems(response.items || response || []);
    } catch (err) {
      console.error("Error fetching scrap items:", err);
      setError("Failed to load scrap items");
    } finally {
      setLoading(false);
    }
  }, [creditNoteId]);

  useEffect(() => {
    fetchScrapItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchScrapItems]); // fetchScrapItems is stable

  const filteredItems = scrapItems.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.productName?.toLowerCase().includes(term) ||
      item.productCode?.toLowerCase().includes(term) ||
      item.creditNoteNumber?.toLowerCase().includes(term) ||
      item.scrapReason?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
          <span className={`ml-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading scrap items...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <div className="flex items-center justify-center py-8 text-red-500">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchScrapItems}
            className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          <Trash2 className="w-5 h-5 text-red-500" />
          Scrap Items
          {scrapItems.length > 0 && (
            <span
              className={`text-sm font-normal px-2 py-0.5 rounded-full ${
                isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
              }`}
            >
              {scrapItems.length}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={fetchScrapItems}
          className={`p-2 rounded-lg hover:bg-opacity-80 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
        </button>
      </div>

      {showFilters && scrapItems.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search by product, code, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{searchTerm ? "No scrap items match your search" : "No scrap items recorded"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                <th className="text-left py-2 px-3 text-sm font-medium">Product</th>
                <th className="text-center py-2 px-3 text-sm font-medium">Qty</th>
                <th className="text-left py-2 px-3 text-sm font-medium">Reason</th>
                {!creditNoteId && <th className="text-left py-2 px-3 text-sm font-medium">Credit Note</th>}
                <th className="text-right py-2 px-3 text-sm font-medium">Value</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredItems.map((item, index) => (
                <tr key={item.id || index} className={`${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                  <td className="py-3 px-3">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {item.productName || "Unknown Product"}
                      </p>
                      {item.productCode && (
                        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          {item.productCode}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className={`py-3 px-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {SCRAP_REASON_LABELS[item.scrapReason] || item.scrapReason || "Unknown"}
                    </span>
                  </td>
                  {!creditNoteId && (
                    <td className={`py-3 px-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {item.creditNoteNumber || "-"}
                    </td>
                  )}
                  <td className={`py-3 px-3 text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {formatCurrency(item.scrapValue || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className={`border-t-2 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                  <td
                    colSpan={creditNoteId ? 3 : 4}
                    className={`py-3 px-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Total Scrap Value
                  </td>
                  <td className={`py-3 px-3 text-right font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(filteredItems.reduce((sum, item) => sum + (item.scrapValue || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default ScrapItemsList;
