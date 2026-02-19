import { AlertTriangle, ArrowUpDown, DollarSign, Download, Search, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import BasePriceRow from "../components/pricing/BasePriceRow";
import BasePricesStatsCard from "../components/pricing/BasePricesStatsCard";
import BulkPriceModal from "../components/pricing/BulkPriceModal";
import { useTheme } from "../contexts/ThemeContext";
import { notificationService } from "../services/notificationService";
import pricelistService from "../services/pricelistService";
import { formatDateDMY } from "../utils/invoiceUtils";

/**
 * BasePricesPage - Dedicated management view for company default pricelist
 *
 * Features:
 * - Stats dashboard showing pricing overview
 * - Searchable/filterable product table
 * - Inline price editing with audit trail
 * - Bulk operations (percentage adjustments)
 * - Export to CSV
 */
export default function BasePricesPage() {
  const { isDarkMode } = useTheme();

  // Data state
  const [defaultPricelist, setDefaultPricelist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [formFilter, setFormFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "productName", direction: "asc" });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");

  // Load default pricelist and items
  const loadPricelistData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get default pricelist
      const response = await pricelistService.getAll({ is_default: true });
      const pricelists = response?.pricelists || [];
      if (!pricelists || pricelists.length === 0) {
        setError("No default pricelist found");
        return;
      }

      const pricelist = pricelists[0];
      setDefaultPricelist(pricelist);

      // Get items for this pricelist
      const itemsData = await pricelistService.getById(pricelist.id);
      if (itemsData?.items) {
        setItems(itemsData.items);
      }
    } catch (err) {
      console.error("Error loading pricelist data:", err);
      setError(err.message || "Failed to load pricing data");
      notificationService.error("Failed to load base prices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPricelistData();
  }, [loadPricelistData]);

  // Extract unique grades and forms for filters
  const { grades, forms } = useMemo(() => {
    const gradeSet = new Set();
    const formSet = new Set();

    items.forEach((item) => {
      if (item.product?.grade) gradeSet.add(item.product.grade);
      if (item.product?.form_type) formSet.add(item.product.form_type);
    });

    return {
      grades: Array.from(gradeSet).sort(),
      forms: Array.from(formSet).sort(),
    };
  }, [items]);

  // Helper function to get sort value (defined outside useMemo)
  const getItemSortValue = (item, key) => {
    const product = item.product || {};
    switch (key) {
      case "productName":
        return product.name || "";
      case "price":
        return Number(item.selling_price) || 0;
      case "updated":
        return new Date(item.updated_at || 0).getTime();
      default:
        return "";
    }
  };

  // Filter and sort items
  // biome-ignore lint/correctness/useExhaustiveDependencies: getItemSortValue is a pure function with no external deps
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const product = item.product || {};
      const productName = (product.name || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Search in product name
      if (searchTerm && !productName.includes(searchLower)) {
        return false;
      }

      // Grade filter
      if (gradeFilter !== "all" && product.grade !== gradeFilter) {
        return false;
      }

      // Form filter
      if (formFilter !== "all" && product.form_type !== formFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = getItemSortValue(a, sortConfig.key);
      const bVal = getItemSortValue(b, sortConfig.key);

      if (sortConfig.direction === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [items, searchTerm, gradeFilter, formFilter, sortConfig]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalWithPrice = items.filter((item) => item.selling_price > 0).length;
    const recentlyUpdated = items.filter((item) => new Date(item.updated_at || 0) > sevenDaysAgo).length;
    const avgPrice =
      items.length > 0 ? items.reduce((sum, item) => sum + (Number(item.selling_price) || 0), 0) / items.length : 0;

    return {
      total: items.length,
      priced: totalWithPrice,
      recentlyUpdated,
      avgPrice,
    };
  }, [items]);

  // Handle inline price edit
  const handleStartEdit = (item) => {
    setEditingRowId(item.id);
    setEditingPrice(item.selling_price || "");
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingPrice("");
  };

  const handleSavePrice = async (item, newPrice) => {
    if (!newPrice || Number(newPrice) <= 0) {
      notificationService.error("Price must be greater than 0");
      return;
    }

    try {
      await pricelistService.updateItems(
        defaultPricelist.id,
        [
          {
            product_id: item.product_id,
            selling_price: Number(newPrice),
            min_quantity: item.min_quantity || 1,
          },
        ],
        "upsert"
      );

      // Update local state
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, selling_price: Number(newPrice) } : i)));

      notificationService.success(`Price updated to AED ${Number(newPrice).toFixed(2)}`);
      setEditingRowId(null);
    } catch (err) {
      console.error("Error updating price:", err);
      notificationService.error(`Failed to update price: ${err.message}`);
    }
  };

  // Toggle row selection
  const toggleRowSelection = (itemId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedRows(newSelected);
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedRows.size === filteredItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredItems.map((item) => item.id)));
    }
  };

  // Handle bulk price update
  const handleBulkUpdate = async (percentage, operation) => {
    if (selectedRows.size === 0) {
      notificationService.error("Select products first");
      return;
    }

    const itemsToUpdate = filteredItems.filter((item) => selectedRows.has(item.id));

    try {
      const updates = itemsToUpdate.map((item) => {
        let newPrice = Number(item.selling_price);
        if (operation === "multiply") {
          newPrice = newPrice * (1 + percentage / 100);
        } else if (operation === "divide") {
          newPrice = newPrice / (1 + percentage / 100);
        }

        return {
          product_id: item.product_id,
          selling_price: Math.round(newPrice * 100) / 100,
          min_quantity: item.min_quantity || 1,
        };
      });

      await pricelistService.updateItems(defaultPricelist.id, updates, "upsert");

      // Update local state
      const updateMap = new Map(updates.map((u) => [u.product_id, u.selling_price]));
      setItems((prev) =>
        prev.map((i) => {
          const newPrice = updateMap.get(i.product_id);
          return newPrice !== undefined ? { ...i, selling_price: newPrice } : i;
        })
      );

      notificationService.success(
        `Updated ${itemsToUpdate.length} prices (${operation === "multiply" ? "+" : "-"}${percentage}%)`
      );
      setSelectedRows(new Set());
      setShowBulkModal(false);
    } catch (err) {
      console.error("Error updating prices:", err);
      notificationService.error(`Failed to update prices: ${err.message}`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Product Name", "Grade", "Form", "Base Price (AED)", "Last Updated"];
    const rows = filteredItems.map((item) => [
      item.product?.name || "",
      item.product?.grade || "",
      item.product?.form_type || "",
      item.selling_price || "",
      item.updated_at ? formatDateDMY(item.updated_at) : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base-prices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    notificationService.success("Prices exported to CSV");
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? "bg-gray-900" : "bg-white"} min-h-screen`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-8 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          <div className={`h-40 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? "bg-gray-900" : "bg-white"} min-h-screen`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Base Prices</h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage company default pricelist
          </p>
        </div>

        {error && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-300"
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`font-medium ${isDarkMode ? "text-red-100" : "text-red-900"}`}>Error Loading Prices</p>
              <p className={`text-sm ${isDarkMode ? "text-red-200/70" : "text-red-700"}`}>{error}</p>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <BasePricesStatsCard icon={DollarSign} label="Total Products" value={stats.total} isDarkMode={isDarkMode} />
          <BasePricesStatsCard icon={Zap} label="With Base Price" value={stats.priced} isDarkMode={isDarkMode} />
          <BasePricesStatsCard
            icon={ArrowUpDown}
            label="Updated (7 days)"
            value={stats.recentlyUpdated}
            isDarkMode={isDarkMode}
          />
          <BasePricesStatsCard
            icon={DollarSign}
            label="Average Price"
            value={`AED ${stats.avgPrice.toFixed(2)}`}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Filter Bar */}
        <div
          className={`mb-6 p-4 rounded-lg border ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search product name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedRows(new Set()); // Clear selection on filter change
                }}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-teal-500 focus:ring-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                } focus:outline-none focus:ring-1`}
              />
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setSelectedRows(new Set());
              }}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              } focus:outline-none focus:ring-1`}
            >
              <option value="all">All Grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Form Filter */}
            <select
              value={formFilter}
              onChange={(e) => {
                setFormFilter(e.target.value);
                setSelectedRows(new Set());
              }}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              } focus:outline-none focus:ring-1`}
            >
              <option value="all">All Forms</option>
              {forms.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortConfig.key}
                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                } focus:outline-none focus:ring-1`}
              >
                <option value="productName">Name</option>
                <option value="price">Price</option>
                <option value="updated">Updated</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setSortConfig({
                    ...sortConfig,
                    direction: sortConfig.direction === "asc" ? "desc" : "asc",
                  })
                }
                className={`p-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                    : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
                }`}
                title={`Sort ${sortConfig.direction === "asc" ? "descending" : "ascending"}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Operations Toolbar */}
        {selectedRows.size > 0 && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
              isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-300"
            }`}
          >
            <p className={`text-sm font-medium ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>
              {selectedRows.size} selected
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Adjust Prices
              </button>
              <button
                type="button"
                onClick={() => setSelectedRows(new Set())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Price Table */}
        <div
          className={`rounded-lg border overflow-hidden ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <table className="w-full">
            <thead>
              <tr
                className={isDarkMode ? "bg-gray-700 border-b border-gray-600" : "bg-gray-100 border-b border-gray-200"}
              >
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Product Name
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Grade
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Form
                </th>
                <th
                  className={`px-4 py-3 text-right text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Base Price (AED)
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className={`px-4 py-8 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <BasePriceRow
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    isSelected={selectedRows.has(item.id)}
                    onToggleSelect={() => toggleRowSelection(item.id)}
                    isEditing={editingRowId === item.id}
                    editingPrice={editingPrice}
                    onStartEdit={() => handleStartEdit(item)}
                    onCancelEdit={handleCancelEdit}
                    onPriceChange={setEditingPrice}
                    onSavePrice={() => handleSavePrice(item, editingPrice)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            }`}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Bulk Price Modal */}
      {showBulkModal && (
        <BulkPriceModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          selectedCount={selectedRows.size}
          isDarkMode={isDarkMode}
          onApply={handleBulkUpdate}
        />
      )}
    </div>
  );
}
