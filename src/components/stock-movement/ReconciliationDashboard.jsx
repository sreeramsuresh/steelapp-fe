/**
 * ReconciliationDashboard Component
 * Phase 7: Reporting & Reconciliation
 *
 * Dashboard for stock reconciliation and audit trail
 */

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  History,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";
import { stockMovementService } from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";

/**
 * Format date for display
 */
const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date =
    typeof dateValue === "object" && dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = "KG") => {
  const num = parseFloat(qty) || 0;
  const sign = num >= 0 ? "" : "-";
  return `${sign}${Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

/**
 * Tab panel component
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <div hidden={value !== index} {...other}>
    {value === index && <div className="pt-4">{children}</div>}
  </div>
);

/**
 * Map MUI chip colors to Tailwind badge classes
 */
const getStatusBadgeClasses = (color) => {
  const colorMap = {
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colorMap[color] || colorMap.success;
};

const ReconciliationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  // Reconciliation state
  const [reconciliationData, setReconciliationData] = useState(null);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [reconciliationError, setReconciliationError] = useState(null);

  // Audit trail state
  const [auditEntries, setAuditEntries] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditPage, setAuditPage] = useState(0);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(50);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
        if (result.data?.length > 0) {
          const defaultWh =
            result.data.find((w) => w.isDefault) || result.data[0];
          setSelectedWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error("Error loading warehouses:", err);
      } finally {
        setLoadingWarehouses(false);
      }
    };
    loadWarehouses();
  }, []);

  // Load reconciliation report
  const loadReconciliation = useCallback(async () => {
    if (!selectedWarehouseId) return;

    try {
      setLoadingReconciliation(true);
      setReconciliationError(null);

      const result =
        await stockMovementService.getReconciliationReport(selectedWarehouseId);
      setReconciliationData(result);
    } catch (err) {
      console.error("Error loading reconciliation:", err);
      setReconciliationError(
        err.message || "Failed to load reconciliation report",
      );
    } finally {
      setLoadingReconciliation(false);
    }
  }, [selectedWarehouseId]);

  // Load audit trail
  const loadAuditTrail = useCallback(async () => {
    try {
      setLoadingAudit(true);
      setAuditError(null);

      const result = await stockMovementService.getAuditTrail({
        page: auditPage + 1,
        limit: auditRowsPerPage,
        warehouseId: selectedWarehouseId || undefined,
        startDate: auditStartDate || undefined,
        endDate: auditEndDate || undefined,
      });

      setAuditEntries(result.entries || []);
      setAuditTotalCount(
        result.pagination?.totalItems || result.entries?.length || 0,
      );
    } catch (err) {
      console.error("Error loading audit trail:", err);
      setAuditError(err.message || "Failed to load audit trail");
    } finally {
      setLoadingAudit(false);
    }
  }, [
    selectedWarehouseId,
    auditPage,
    auditRowsPerPage,
    auditStartDate,
    auditEndDate,
  ]);

  // Load data when warehouse changes or tab changes
  useEffect(() => {
    if (activeTab === 0 && selectedWarehouseId) {
      loadReconciliation();
    }
  }, [activeTab, selectedWarehouseId, loadReconciliation]);

  useEffect(() => {
    if (activeTab === 1) {
      loadAuditTrail();
    }
  }, [activeTab, loadAuditTrail]);

  // Handle audit page change
  const handleAuditPageChange = (event, newPage) => {
    setAuditPage(newPage);
  };

  // Handle audit rows per page change
  const handleAuditRowsPerPageChange = (event) => {
    setAuditRowsPerPage(parseInt(event.target.value, 10));
    setAuditPage(0);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText className="text-teal-500" size={32} />
          <h1 className="text-2xl font-bold text-white">
            Stock Reconciliation & Audit
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border overflow-hidden bg-[#1E2328] border-[#37474F] mb-4">
        <div className="flex border-b border-[#37474F]">
          <button
            onClick={() => setActiveTab(0)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 0
                ? "text-teal-400 border-b-2 border-teal-400 bg-[#252a30]"
                : "text-gray-400 hover:text-gray-300 hover:bg-[#252a30]"
            }`}
          >
            <FileText size={18} />
            Reconciliation Report
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 1
                ? "text-teal-400 border-b-2 border-teal-400 bg-[#252a30]"
                : "text-gray-400 hover:text-gray-300 hover:bg-[#252a30]"
            }`}
          >
            <History size={18} />
            Audit Trail
          </button>
        </div>
      </div>

      {/* Reconciliation Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Warehouse Selection */}
        <div className="flex gap-4 mb-6 items-center">
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={loadingWarehouses}
            className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[250px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} {wh.code ? `(${wh.code})` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={loadReconciliation}
            disabled={loadingReconciliation || !selectedWarehouseId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            <RotateCcw size={18} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {reconciliationError && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <span>{reconciliationError}</span>
            <button
              onClick={() => setReconciliationError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loadingReconciliation ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-teal-500" size={40} />
          </div>
        ) : reconciliationData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border bg-[#1E2328] border-[#37474F] p-4">
                <div className="text-sm text-gray-400 mb-1">Warehouse</div>
                <div className="text-xl font-semibold text-white">
                  {reconciliationData.warehouseName}
                </div>
              </div>
              <div className="rounded-xl border bg-[#1E2328] border-[#37474F] p-4">
                <div className="text-sm text-gray-400 mb-1">Total Products</div>
                <div className="text-xl font-semibold text-white">
                  {reconciliationData.items?.length || 0}
                </div>
              </div>
              <div className="rounded-xl border bg-[#1E2328] border-[#37474F] p-4">
                <div className="text-sm text-gray-400 mb-1">Total Quantity</div>
                <div className="text-xl font-semibold text-white">
                  {formatQuantity(reconciliationData.totalSystemValue)}
                </div>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  reconciliationData.discrepancyCount > 0
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-green-500/10 border-green-500/30"
                }`}
              >
                <div className="text-sm text-gray-400 mb-1">Discrepancies</div>
                <div className="flex items-center gap-2">
                  {reconciliationData.discrepancyCount > 0 ? (
                    <AlertTriangle className="text-yellow-400" size={20} />
                  ) : (
                    <CheckCircle className="text-green-400" size={20} />
                  )}
                  <div className="text-xl font-semibold text-white">
                    {reconciliationData.discrepancyCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border overflow-hidden bg-[#1E2328] border-[#37474F]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-[#37474F]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        System Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Last Count
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Discrepancy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Last Count Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#37474F]">
                    {(reconciliationData.items || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No inventory items found
                        </td>
                      </tr>
                    ) : (
                      reconciliationData.items.map((item, idx) => {
                        const discrepancy = parseFloat(item.discrepancy) || 0;
                        const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-[#252a30] ${
                              hasDiscrepancy ? "bg-yellow-500/5" : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-white">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {item.productSku || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 text-right">
                              {formatQuantity(item.systemQuantity)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 text-right">
                              {formatQuantity(item.lastPhysicalCount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span
                                className={`${
                                  hasDiscrepancy
                                    ? "text-red-400 font-bold"
                                    : "text-green-400"
                                }`}
                              >
                                {formatQuantity(discrepancy)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {formatDate(item.lastCountDate)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(
                                  hasDiscrepancy ? "warning" : "success",
                                )}`}
                              >
                                {hasDiscrepancy ? "Discrepancy" : "OK"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            Select a warehouse to view the reconciliation report.
          </div>
        )}
      </TabPanel>

      {/* Audit Trail Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Filters */}
        <div className="rounded-xl border overflow-hidden bg-[#1E2328] border-[#37474F] p-4 mb-4">
          <div className="flex gap-4 flex-wrap items-center">
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setAuditPage(0);
              }}
              className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[200px]"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={auditStartDate}
                onChange={(e) => {
                  setAuditStartDate(e.target.value);
                  setAuditPage(0);
                }}
                className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={auditEndDate}
                onChange={(e) => {
                  setAuditEndDate(e.target.value);
                  setAuditPage(0);
                }}
                className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={loadAuditTrail}
              disabled={loadingAudit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              <RotateCcw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {auditError && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <span>{auditError}</span>
            <button
              onClick={() => setAuditError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Audit Trail Table */}
        <div className="rounded-xl border overflow-hidden bg-[#1E2328] border-[#37474F]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-[#37474F]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Before
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    After
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#37474F]">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <Loader2
                          className="animate-spin text-teal-500"
                          size={32}
                        />
                      </div>
                    </td>
                  </tr>
                ) : auditEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No audit entries found
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry) => {
                    const change = parseFloat(entry.quantityChange) || 0;
                    const isIncrease =
                      change > 0 ||
                      ["IN", "TRANSFER_IN", "RELEASE"].includes(entry.action);

                    return (
                      <tr key={entry.id} className="hover:bg-[#252a30]">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDate(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(
                              isIncrease ? "success" : "error",
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {entry.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.warehouseName || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          <span
                            className={
                              isIncrease ? "text-green-400" : "text-red-400"
                            }
                          >
                            {isIncrease ? "+" : "-"}
                            {formatQuantity(Math.abs(change))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 text-right">
                          {formatQuantity(entry.balanceBefore)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 text-right">
                          {formatQuantity(entry.balanceAfter)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.referenceNumber || entry.referenceType || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.userName || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#37474F] bg-[#1E2328]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Rows per page:</span>
              <select
                value={auditRowsPerPage}
                onChange={handleAuditRowsPerPageChange}
                className="px-2 py-1 rounded border bg-gray-800 border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {auditPage * auditRowsPerPage + 1}-
                {Math.min((auditPage + 1) * auditRowsPerPage, auditTotalCount)}{" "}
                of {auditTotalCount}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleAuditPageChange(e, auditPage - 1)}
                  disabled={auditPage === 0}
                  className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={(e) => handleAuditPageChange(e, auditPage + 1)}
                  disabled={
                    auditPage >=
                    Math.ceil(auditTotalCount / auditRowsPerPage) - 1
                  }
                  className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </div>
  );
};

export default ReconciliationDashboard;
