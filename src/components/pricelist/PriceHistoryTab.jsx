import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Minus,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import pricelistService from "../../services/pricelistService";

const PriceHistoryTab = ({ pricelistId, products: _products = [] }) => {
  const { isDarkMode } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  // Filters
  const [productSearch, setProductSearch] = useState("");
  const [selectedChangeType, setSelectedChangeType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!pricelistId) return;

    setLoading(true);
    try {
      const response = await pricelistService.getHistory(pricelistId, {
        changeType: selectedChangeType,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setHistory(response.history || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  }, [pricelistId, selectedChangeType, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Filter history by product name (client-side)
  const filteredHistory = history.filter((item) => {
    if (!productSearch) return true;
    return item.productName?.toLowerCase().includes(productSearch.toLowerCase());
  });

  const totalPages = Math.ceil(total / pageSize);

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case "INSERT":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "DELETE":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "UPDATE":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getChangeTypeLabel = (changeType) => {
    switch (changeType) {
      case "INSERT":
        return { label: "Added", color: isDarkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800" };
      case "DELETE":
        return { label: "Removed", color: isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800" };
      case "UPDATE":
        return { label: "Modified", color: isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800" };
      default:
        return { label: changeType, color: isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800" };
    }
  };

  const getPriceChangeIndicator = (oldPrice, newPrice) => {
    if (oldPrice === null || oldPrice === undefined || oldPrice === 0) {
      return null; // New item
    }
    if (newPrice === null || newPrice === undefined || newPrice === 0) {
      return null; // Deleted item
    }

    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    if (change > 0) {
      return (
        <span className="inline-flex items-center text-green-600 text-sm">
          <ArrowUpRight className="h-3 w-3 mr-1" />+{change.toFixed(1)}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center text-red-600 text-sm">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {change.toFixed(1)}%
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "-";
    return `AED ${parseFloat(price).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Product", "Change Type", "Old Price", "New Price", "Changed By"];
    const rows = filteredHistory.map((item) => [
      formatDate(item.changedAt),
      item.productName,
      item.changeType,
      item.oldSellingPrice || "",
      item.newSellingPrice || "",
      item.changedBy || "System",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pricelist_history_${pricelistId}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const handleClearFilters = () => {
    setProductSearch("");
    setSelectedChangeType("");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  if (!pricelistId) {
    return (
      <div className={`text-center py-12 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        Save the pricelist first to view history
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, code, or specification..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border ${showFilters ? "bg-emerald-50 border-emerald-300 text-emerald-600" : isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600"}`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHistory}
            className={`p-2 rounded-lg border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredHistory.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} rounded-lg p-4 border`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="price-history-change-type"
                className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Change Type
              </label>
              <select
                id="price-history-change-type"
                value={selectedChangeType}
                onChange={(e) => {
                  setSelectedChangeType(e.target.value);
                  setPage(0);
                }}
                className={`w-full px-3 py-2 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="">All Changes</option>
                <option value="INSERT">Added</option>
                <option value="UPDATE">Modified</option>
                <option value="DELETE">Removed</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="price-history-from-date"
                className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                From Date
              </label>
              <input
                id="price-history-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
                className={`w-full px-3 py-2 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            <div>
              <label
                htmlFor="price-history-to-date"
                className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                To Date
              </label>
              <input
                id="price-history-to-date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(0);
                }}
                className={`w-full px-3 py-2 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className={`w-full px-4 py-2 ${isDarkMode ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-600 border-gray-300 hover:bg-gray-100"} border rounded-lg`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div
        className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg border overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            <thead className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  Date/Time
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  Product
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  Action
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  Old Price
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  New Price
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  Change
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                >
                  Changed By
                </th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
              {loading ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading history...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No price changes recorded yet
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const changeType = getChangeTypeLabel(item.changeType);
                  return (
                    <tr key={item.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {formatDate(item.changedAt)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                        {item.productName || `Product #${item.productId}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeType.color}`}
                        >
                          {getChangeIcon(item.changeType)}
                          {changeType.label}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {item.changeType === "INSERT" ? "-" : formatPrice(item.oldSellingPrice)}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
                      >
                        {item.changeType === "DELETE" ? "-" : formatPrice(item.newSellingPrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {item.changeType === "UPDATE" &&
                          getPriceChangeIndicator(item.oldSellingPrice, item.newSellingPrice)}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {item.changedBy || "System"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`px-4 py-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}
          >
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`p-2 rounded border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className={`p-2 rounded border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceHistoryTab;
