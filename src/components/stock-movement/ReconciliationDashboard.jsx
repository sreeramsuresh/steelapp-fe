/**
 * ReconciliationDashboard Component
 * Phase 7: Reporting & Reconciliation
 *
 * Dashboard for stock reconciliation and audit trail
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  History,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import { stockMovementService } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';

/**
 * Format date for display
 */
const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  const date =
    typeof dateValue === 'object' && dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = 'KG') => {
  const num = parseFloat(qty) || 0;
  const sign = num >= 0 ? '' : '-';
  return `${sign}${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
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
 * Map MUI chip colors to Tailwind badge classes (Light theme)
 */
const getStatusBadgeClasses = (color) => {
  const colorMap = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };
  return colorMap[color] || colorMap.success;
};

const ReconciliationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
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
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');

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
        console.error('Error loading warehouses:', err);
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
      console.error('Error loading reconciliation:', err);
      setReconciliationError(
        err.message || 'Failed to load reconciliation report',
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
      console.error('Error loading audit trail:', err);
      setAuditError(err.message || 'Failed to load audit trail');
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
  const handleAuditPageChange = (_event, newPage) => {
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
          <FileText className="text-teal-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Reconciliation & Audit
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border overflow-hidden bg-white border-gray-200 mb-4">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab(0)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 0
                ? 'text-teal-600 border-b-2 border-teal-600 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} />
            Reconciliation Report
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 1
                ? 'text-teal-600 border-b-2 border-teal-600 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
            className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[250px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} {wh.code ? `(${wh.code})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={loadReconciliation}
            disabled={loadingReconciliation || !selectedWarehouseId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
          >
            <RotateCcw size={18} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {reconciliationError && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <span>{reconciliationError}</span>
            <button
              onClick={() => setReconciliationError(null)}
              className="text-red-600 hover:text-red-800"
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
              <div className="rounded-xl border bg-white border-gray-200 p-4">
                <div className="text-sm text-gray-500 mb-1">Warehouse</div>
                <div className="text-xl font-semibold text-gray-900">
                  {reconciliationData.warehouseName}
                </div>
              </div>
              <div className="rounded-xl border bg-white border-gray-200 p-4">
                <div className="text-sm text-gray-500 mb-1">Total Products</div>
                <div className="text-xl font-semibold text-gray-900">
                  {reconciliationData.items?.length || 0}
                </div>
              </div>
              <div className="rounded-xl border bg-white border-gray-200 p-4">
                <div className="text-sm text-gray-500 mb-1">Total Quantity</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatQuantity(reconciliationData.totalSystemValue)}
                </div>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  reconciliationData.discrepancyCount > 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="text-sm text-gray-500 mb-1">Discrepancies</div>
                <div className="flex items-center gap-2">
                  {reconciliationData.discrepancyCount > 0 ? (
                    <AlertTriangle className="text-yellow-600" size={20} />
                  ) : (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                  <div className="text-xl font-semibold text-gray-900">
                    {reconciliationData.discrepancyCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border overflow-hidden bg-white border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        System Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Count
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discrepancy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Count Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(reconciliationData.items || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
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
                            className={`hover:bg-gray-50 ${
                              hasDiscrepancy ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.productSku || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {formatQuantity(item.systemQuantity)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {formatQuantity(item.lastPhysicalCount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span
                                className={`${
                                  hasDiscrepancy
                                    ? 'text-red-600 font-bold'
                                    : 'text-green-600'
                                }`}
                              >
                                {formatQuantity(discrepancy)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(item.lastCountDate)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(
                                  hasDiscrepancy ? 'warning' : 'success',
                                )}`}
                              >
                                {hasDiscrepancy ? 'Discrepancy' : 'OK'}
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
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
            Please select a warehouse to view the reconciliation report.
          </div>
        )}
      </TabPanel>

      {/* Audit Trail Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Filters */}
        <div className="rounded-xl border overflow-hidden bg-white border-gray-200 p-4 mb-4">
          <div className="flex gap-4 flex-wrap items-center">
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setAuditPage(0);
              }}
              className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[200px]"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>

            <div>
              <label
                htmlFor="audit-start-date"
                className="block text-xs text-gray-500 mb-1"
              >
                Start Date
              </label>
              <input
                id="audit-start-date"
                type="date"
                value={auditStartDate}
                onChange={(e) => {
                  setAuditStartDate(e.target.value);
                  setAuditPage(0);
                }}
                className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label
                htmlFor="audit-end-date"
                className="block text-xs text-gray-500 mb-1"
              >
                End Date
              </label>
              <input
                id="audit-end-date"
                type="date"
                value={auditEndDate}
                onChange={(e) => {
                  setAuditEndDate(e.target.value);
                  setAuditPage(0);
                }}
                className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={loadAuditTrail}
              disabled={loadingAudit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              <RotateCcw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {auditError && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <span>{auditError}</span>
            <button
              onClick={() => setAuditError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Audit Trail Table */}
        <div className="rounded-xl border overflow-hidden bg-white border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Before
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    After
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
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
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {!selectedWarehouseId
                        ? 'Please select a warehouse to view audit history'
                        : 'No audit entries found for the selected warehouse and date range'}
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry) => {
                    const change = parseFloat(entry.quantityChange) || 0;
                    const isIncrease =
                      change > 0 ||
                      ['IN', 'TRANSFER_IN', 'RELEASE'].includes(entry.action);

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(
                              isIncrease ? 'success' : 'error',
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.warehouseName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          <span
                            className={
                              isIncrease ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {isIncrease ? '+' : '-'}
                            {formatQuantity(Math.abs(change))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatQuantity(entry.balanceBefore)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatQuantity(entry.balanceAfter)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.referenceNumber || entry.referenceType || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.userName || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <select
                value={auditRowsPerPage}
                onChange={handleAuditRowsPerPageChange}
                className="px-2 py-1 rounded border bg-white border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {auditPage * auditRowsPerPage + 1}-
                {Math.min((auditPage + 1) * auditRowsPerPage, auditTotalCount)}{' '}
                of {auditTotalCount}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleAuditPageChange(e, auditPage - 1)}
                  disabled={auditPage === 0}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={(e) => handleAuditPageChange(e, auditPage + 1)}
                  disabled={
                    auditPage >=
                    Math.ceil(auditTotalCount / auditRowsPerPage) - 1
                  }
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm"
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
