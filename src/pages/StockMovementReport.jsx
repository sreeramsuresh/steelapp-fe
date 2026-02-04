import { AlertCircle, Check, Download, FileText, Loader2, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productService } from "../services/dataService";
import { MOVEMENT_TYPES, stockMovementService } from "../services/stockMovementService";
import { warehouseService } from "../services/warehouseService";
import { toUAETime } from "../utils/timezone";

const PROCUREMENT_CHANNELS = [
  { value: "ALL", label: "All Channels" },
  { value: "LOCAL", label: "Local" },
  { value: "IMPORTED", label: "Imported" },
];

/**
 * Clean warehouse name by removing timestamps and test suffixes
 */
const cleanWarehouseName = (name) => {
  if (!name) return "Unknown Warehouse";
  // Remove timestamp suffixes (e.g., "Warehouse 1768234260965")
  return name.replace(/\s+\d{10,}$/, "").trim();
};

/**
 * Deduplicate warehouses by name, keeping the first occurrence
 */
const deduplicateWarehouses = (warehouses) => {
  const seen = new Map();
  return warehouses.filter((warehouse) => {
    const cleanedName = cleanWarehouseName(warehouse.name);
    if (seen.has(cleanedName)) {
      return false;
    }
    seen.set(cleanedName, warehouse.id);
    return true;
  });
};

export default function StockMovementReport() {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Loading states for dropdowns
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [warehouseError, setWarehouseError] = useState(null);
  const [productError, setProductError] = useState(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedMovementTypes, setSelectedMovementTypes] = useState([]);
  const [procurementChannel, setProcurementChannel] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  // Summary
  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netMovement: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, [fetchProducts, fetchWarehouses]);

  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      setWarehouseError(null);
      const response = await warehouseService.getAll();
      const rawWarehouses = response.data || [];
      // Deduplicate warehouses by cleaned name
      const uniqueWarehouses = deduplicateWarehouses(rawWarehouses);
      setWarehouses(uniqueWarehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      setWarehouseError("Failed to load warehouses");
      toast.error("Failed to load warehouses");
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError(null);
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProductError("Failed to load products");
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchMovements = async (pageNum = 1) => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const filters = {
        page: pageNum,
        limit,
        dateFrom,
        dateTo,
        warehouseId: selectedWarehouse || undefined,
        productId: selectedProduct || undefined,
        movementType: selectedMovementTypes.length > 0 ? selectedMovementTypes.join(",") : undefined,
      };

      const response = await stockMovementService.getAll(filters);

      let filteredMovements = response.data || [];

      // Apply procurement channel filter if needed (client-side for now)
      if (procurementChannel !== "ALL") {
        filteredMovements = filteredMovements.filter(() => {
          // This would require product procurement info - placeholder logic
          // In reality, you'd add this to the backend filter
          return true;
        });
      }

      setMovements(filteredMovements);
      setPage(pageNum);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalRecords(response.pagination?.totalRecords || 0);

      // Calculate summary
      calculateSummary(filteredMovements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    data.forEach((movement) => {
      const qty = movement.quantity || 0;
      const cost = movement.totalCost || 0;

      if (movement.movementType === "IN" || movement.movementType === "TRANSFER_IN") {
        totalIn += qty;
      } else if (movement.movementType === "OUT" || movement.movementType === "TRANSFER_OUT") {
        totalOut += qty;
      }

      totalValue += cost;
    });

    setSummary({
      totalIn,
      totalOut,
      netMovement: totalIn - totalOut,
      totalValue,
    });
  };

  const handleSearch = () => {
    setPage(1);
    fetchMovements(1);
  };

  const handlePageChange = (_event, value) => {
    fetchMovements(value);
  };

  const toggleMovementType = (type) => {
    setSelectedMovementTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const selectAllMovementTypes = () => {
    if (selectedMovementTypes.length === Object.keys(MOVEMENT_TYPES).length) {
      setSelectedMovementTypes([]);
    } else {
      setSelectedMovementTypes(Object.keys(MOVEMENT_TYPES));
    }
  };

  const handleExportCSV = () => {
    if (movements.length === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      // CSV Headers
      const headers = [
        "Date",
        "Product",
        "SKU",
        "Batch #",
        "Type",
        "Quantity",
        "UOM",
        "Unit Cost",
        "Total Cost",
        "Reference",
        "Warehouse",
        "Notes",
      ];

      // CSV Rows
      const rows = movements.map((m) => [
        toUAETime(m.movementDate || m.createdAt, { format: "datetime" }),
        m.productName || m.productDisplayName || "",
        m.productSku || "",
        m.batchNumber || "",
        MOVEMENT_TYPES[m.movementType]?.label || m.movementType,
        m.quantity?.toFixed(2) || "0.00",
        m.unit || "KG",
        m.unitCost?.toFixed(2) || "0.00",
        m.totalCost?.toFixed(2) || "0.00",
        m.referenceNumber || "",
        m.warehouseName || "",
        m.notes || "",
      ]);

      // Build CSV content
      const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `stock-movements-${dateFrom}-to-${dateTo}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
    // Placeholder for PDF export functionality
  };

  const getMovementTypeColor = (type) => {
    return MOVEMENT_TYPES[type]?.color || "default";
  };

  const getMovementTypeLabel = (type) => {
    return MOVEMENT_TYPES[type]?.label || type;
  };

  return (
    <div className="p-6">
      {/* Header with description */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stock Movement Report</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and analyze inventory movements across warehouses. Select a date range to search for stock ins, outs, and
          transfers.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label htmlFor="stock-movement-start-date" className="block text-sm font-medium mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              id="stock-movement-start-date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="stock-movement-end-date" className="block text-sm font-medium mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              id="stock-movement-end-date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Warehouse */}
          <div>
            <label htmlFor="stock-movement-warehouse" className="block text-sm font-medium mb-2">
              Warehouse
            </label>
            <div className="relative">
              <select
                id="stock-movement-warehouse"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                disabled={loadingWarehouses}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {cleanWarehouseName(warehouse.name)}
                    {warehouse.code ? ` (${warehouse.code})` : ""}
                    {warehouse.location ? ` - ${warehouse.location}` : ""}
                  </option>
                ))}
              </select>
              {loadingWarehouses && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {warehouseError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {warehouseError}
              </p>
            )}
          </div>

          {/* Product */}
          <div>
            <label htmlFor="stock-movement-product" className="block text-sm font-medium mb-2">
              Product
            </label>
            <div className="relative">
              <select
                id="stock-movement-product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                disabled={loadingProducts}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.uniqueName || product.displayName || product.name || "N/A"}
                  </option>
                ))}
              </select>
              {loadingProducts && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {productError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {productError}
              </p>
            )}
            {!loadingProducts && !productError && products.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No products available</p>
            )}
          </div>

          {/* Movement Type - Checkbox style */}
          <div className="lg:col-span-2">
            <span className="block text-sm font-medium mb-2">
              Movement Type
              <span className="text-gray-500 font-normal ml-1">(select multiple)</span>
            </span>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
              <div className="flex flex-wrap gap-2">
                {/* Select All button */}
                <button type="button" onClick={selectAllMovementTypes}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    selectedMovementTypes.length === Object.keys(MOVEMENT_TYPES).length
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                  }`}
                >
                  {selectedMovementTypes.length === Object.keys(MOVEMENT_TYPES).length ? "Deselect All" : "Select All"}
                </button>
                <div className="w-px bg-gray-300 dark:bg-gray-500 mx-1" />
                {Object.entries(MOVEMENT_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMovementType(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      selectedMovementTypes.includes(key)
                        ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                    }`}
                  >
                    {selectedMovementTypes.includes(key) && <Check className="w-3.5 h-3.5" />}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            {selectedMovementTypes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedMovementTypes.length} type
                {selectedMovementTypes.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Procurement Channel */}
          <div>
            <label htmlFor="stock-movement-procurement-channel" className="block text-sm font-medium mb-2">
              Procurement Channel
            </label>
            <select
              id="stock-movement-procurement-channel"
              value={procurementChannel}
              onChange={(e) => setProcurementChannel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              {PROCUREMENT_CHANNELS.map((channel) => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-end gap-2">
            <Button onClick={handleSearch} disabled={loading || !dateFrom || !dateTo} className="flex-1 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={movements.length === 0}
              className="gap-2"
              title={movements.length === 0 ? "Search for data first to export" : "Export to CSV"}
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={movements.length === 0}
              className="gap-2"
              title={movements.length === 0 ? "Search for data first to export" : "Export to PDF"}
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {movements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total In</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalIn.toFixed(2)} KG</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Out</p>
            <p className="text-2xl font-bold text-red-600">{summary.totalOut.toFixed(2)} KG</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Movement</p>
            <p className={`text-2xl font-bold ${summary.netMovement >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.netMovement >= 0 ? "+" : ""}
              {summary.netMovement.toFixed(2)} KG
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Value</p>
            <p className="text-2xl font-bold text-blue-600">AED {summary.totalValue.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading stock movements...</p>
          </div>
        </div>
      ) : !hasSearched ? (
        /* Initial state - prompt user to search */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select Date Range to Get Started
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Choose a start and end date above, then click <strong>Search</strong> to view stock movements. You can
              optionally filter by warehouse, product, or movement type.
            </p>
          </div>
        </div>
      ) : movements.length === 0 ? (
        /* Empty state after search */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Stock Movements Found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
              No movements match your search criteria for <strong>{dateFrom}</strong> to <strong>{dateTo}</strong>.
            </p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 text-left list-disc list-inside">
              <li>Try expanding the date range</li>
              <li>Remove or change warehouse/product filters</li>
              <li>Check if movement types are selected</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Results table */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Stock Movements</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {movements.length} of {totalRecords} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost/PCS</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Warehouse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell>
                      <div className="text-sm">
                        {toUAETime(movement.movementDate || movement.createdAt, {
                          format: "date",
                        })}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {toUAETime(movement.movementDate || movement.createdAt, {
                          format: "time",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {movement.productName || movement.productDisplayName || "N/A"}
                      </div>
                      {movement.productSku && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">SKU: {movement.productSku}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{movement.batchNumber || "-"}</div>
                      {movement.coilNumber && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">Coil: {movement.coilNumber}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          getMovementTypeColor(movement.movementType) === "success"
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {getMovementTypeLabel(movement.movementType)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-sm">
                        {movement.quantity?.toFixed(2) || "0.00"} {movement.unit || "KG"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">{movement.unitCost ? `AED ${movement.unitCost.toFixed(2)}` : "-"}</div>
                      {movement.totalCost && movement.totalCost > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Total: AED {movement.totalCost.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{movement.referenceNumber || "-"}</div>
                      {movement.referenceType && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">{movement.referenceType}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{cleanWarehouseName(movement.warehouseName) || "N/A"}</div>
                      {movement.destinationWarehouseName && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          → {cleanWarehouseName(movement.destinationWarehouseName)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <button type="button" onClick={() => handlePageChange(null, 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  First
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  return pageNum <= totalPages ? (
                    <button type="button" key={pageNum}
                      onClick={() => handlePageChange(null, pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ) : null;
                })}
                <button type="button" onClick={() => handlePageChange(null, totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
