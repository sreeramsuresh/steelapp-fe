import { AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PriceInheritanceIndicator from "../components/pricing/PriceInheritanceIndicator";
import PriceOverrideModal from "../components/pricing/PriceOverrideModal";
import { useTheme } from "../contexts/ThemeContext";
import { apiService } from "../services/axiosApi";
import { notificationService } from "../services/notificationService";

/**
 * CustomerPricingPage - Display and manage customer pricelist inheritance
 *
 * Shows three-column table: Default Price | Customer Override | Effective Price
 */
export default function CustomerPricingPage() {
  const { customerId } = useParams();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [pricingMeta, setPricingMeta] = useState({}); // holds defaultPricelistId, customerPricelistId
  const [pricingData, setPricingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch pricing overview on mount
  useEffect(() => {
    if (!customerId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch from backend
        const data = await apiService.get(`/customers/${customerId}/pricing-overview`);
        setCustomer(data.customer);
        setPricingMeta({ defaultPricelistId: data.defaultPricelistId, customerPricelistId: data.customerPricelistId });
        setPricingData(data.pricingItems || []);
        setSelectedRows(new Set());
      } catch (error) {
        console.error("Error loading pricing data:", error);
        notificationService.error(`Failed to load customer pricing: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  // Filter and sort data
  useEffect(() => {
    let filtered = pricingData;

    // Search by product name
    if (searchTerm) {
      filtered = filtered.filter((item) => (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = a.productName || "";
          bVal = b.productName || "";
          break;
        case "default_price":
          aVal = a.defaultPrice || 0;
          bVal = b.defaultPrice || 0;
          break;
        case "effective_price":
          aVal = a.effectivePrice || 0;
          bVal = b.effectivePrice || 0;
          break;
        case "updated":
          aVal = new Date(a.lastUpdated || 0).getTime();
          bVal = new Date(b.lastUpdated || 0).getTime();
          break;
        default:
          aVal = a.productName;
          bVal = b.productName;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    setFilteredData(filtered);
  }, [pricingData, searchTerm, sortBy, sortOrder]);

  const reloadData = async () => {
    try {
      setLoading(true);

      // Fetch from backend
      const data = await apiService.get(`/customers/${customerId}/pricing-overview`);
      setCustomer(data.customer);
      setPricingMeta({ defaultPricelistId: data.defaultPricelistId, customerPricelistId: data.customerPricelistId });
      setPricingData(data.pricingItems || []);
      setSelectedRows(new Set());
    } catch (error) {
      console.error("Error reloading pricing data:", error);
      notificationService.error(`Failed to reload pricing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSavePrice = async (newPrice) => {
    if (!editingItem) return;

    try {
      setLoading(true);

      // Update customer price override via the pricing API
      const pricelistId = pricingMeta.customerPricelistId || pricingMeta.defaultPricelistId;
      if (pricelistId && editingItem.productId) {
        await apiService.put(`/pricelists/${pricelistId}/items`, {
          items: [{ productId: editingItem.productId, unitPrice: Number(newPrice) }],
          operation: "upsert",
        });
      }
      notificationService.success(`Price updated to AED ${Number(newPrice).toFixed(2)}`);
      setShowModal(false);
      setEditingItem(null);
      await reloadData();
    } catch (error) {
      console.error("Error updating price:", error);
      notificationService.error(`Failed to update price: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverride = async (item) => {
    if (!window.confirm(`Remove override for ${item.productName}?`)) {
      return;
    }

    try {
      setLoading(true);

      // Delete customer price override via the pricing API
      const pricelistId = pricingMeta.customerPricelistId || pricingMeta.defaultPricelistId;
      if (pricelistId && item.productId) {
        await apiService.delete(`/pricelists/${pricelistId}/items/${item.productId}`);
      }
      notificationService.success("Override removed, using default price");
      await reloadData();
    } catch (error) {
      console.error("Error deleting override:", error);
      notificationService.error(`Failed to remove override: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowSelection = (productId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map((item) => item.productId)));
    }
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  if (loading && !customer) {
    return (
      <div className={`p-8 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading pricing data...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={`p-8 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Customer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Customer Pricing</h1>
        <div className={`flex items-center gap-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          <p className="text-lg font-medium">{customer.name}</p>
          {customer.trn && <p className="text-sm">TRN: {customer.trn}</p>}
        </div>
      </div>

      {/* Info Banner */}
      <div
        className={`mb-6 p-4 rounded-lg flex gap-3 ${
          isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-300"
        }`}
      >
        <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className={`font-medium ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>Pricing Inheritance</p>
          <p className={`mt-1 ${isDarkMode ? "text-blue-200/70" : "text-blue-700"}`}>
            Green prices are customer overrides. Gray prices are inherited from company base prices.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
      </div>

      {/* Table */}
      <div
        className={`rounded-lg border overflow-x-auto ${
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDarkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => handleSortChange("name")}
                  className={`font-semibold flex items-center gap-1 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                >
                  Product <SortIcon field="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSortChange("default_price")}
                  className={`font-semibold flex items-center justify-end gap-1 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Default Price <SortIcon field="default_price" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSortChange("effective_price")}
                  className={`font-semibold flex items-center justify-end gap-1 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Customer Override <SortIcon field="effective_price" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">Effective Price</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center">
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No products found</p>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.productId}
                  className={`border-b transition-colors ${
                    isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.productId)}
                      onChange={() => toggleRowSelection(item.productId)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className={`px-4 py-3 font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                    {item.productName}
                  </td>
                  <td className={`px-4 py-3 text-right ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    AED {Number(item.defaultPrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.isOverride ? (
                      <span className={`font-medium ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                        AED {Number(item.customerPrice).toFixed(2)}
                      </span>
                    ) : (
                      <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    AED {Number(item.effectivePrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PriceInheritanceIndicator isOverride={item.isOverride} isDarkMode={isDarkMode} />
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    {item.isOverride && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditPrice(item)}
                          className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors`}
                          title="Edit Override"
                        >
                          <Plus className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOverride(item)}
                          className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors`}
                          title="Remove Override"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div
          className={`mt-6 p-4 rounded-lg flex items-center justify-between ${
            isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-300"
          }`}
        >
          <span className={isDarkMode ? "text-blue-100" : "text-blue-900"}>{selectedRows.size} products selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedRows(new Set())}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Price Override Modal */}
      {showModal && editingItem && (
        <PriceOverrideModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          product={editingItem}
          defaultPrice={editingItem.defaultPrice}
          currentPrice={editingItem.customerPrice}
          onSave={handleSavePrice}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
