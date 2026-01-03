/**
 * StockReceiptForm Component
 * Phase 4.4: PO Stock Receiving with Partial Support
 *
 * A modal component for receiving stock from a purchase order.
 * Supports:
 * - Full receiving (all pending items)
 * - Partial receiving (selected items with custom quantities)
 * - Warehouse selection
 * - Notes and batch/coil/heat tracking
 *
 * Refactored: Tailwind CSS with dark mode support
 */

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  X,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Warehouse,
  ChevronDown,
  FileText,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { stockMovementService } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';

/**
 * Format quantity with unit
 */
const formatQuantity = (quantity, unit = 'KG') => {
  const num = parseFloat(quantity) || 0;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

/**
 * Calculate receiving status for an item
 */
const getReceivingStatus = (item) => {
  const ordered = parseFloat(item.quantity) || 0;
  const received = parseFloat(item.receivedQuantity) || 0;

  if (received >= ordered) {
    return { status: 'complete', label: 'Complete', color: 'green' };
  } else if (received > 0) {
    return { status: 'partial', label: 'Partial', color: 'yellow' };
  }
  return { status: 'pending', label: 'Pending', color: 'gray' };
};

const StockReceiptForm = ({
  open,
  onClose,
  purchaseOrderId,
  poNumber,
  poItems = [],
  defaultWarehouseId = null,
  onSuccess,
}) => {
  const { isDarkMode } = useTheme();

  // Theme classes
  const overlayBg = 'bg-black/60';
  const modalBg = isDarkMode ? 'bg-[#141a20]' : 'bg-white';
  const modalBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const cardBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50';
  const cardBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-300';
  const textPrimary = isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500';
  const tableBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const tableHeaderBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50';
  const tableRowHover = isDarkMode ? 'hover:bg-[#1a2129]' : 'hover:bg-gray-50';
  const inputFocus =
    'focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20';

  // State
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    defaultWarehouseId || '',
  );
  const [selectedItems, setSelectedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // GRN State (Epic 3 - RECV-001)
  const [grnNumber, setGrnNumber] = useState('');
  const [grnStatus, setGrnStatus] = useState('draft'); // draft, pending_approval, approved
  const [grnDate, setGrnDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalDate, setApprovalDate] = useState('');

  // Weight Variance State (Epic 3 - RECV-002)
  const [expectedWeights, setExpectedWeights] = useState({});
  const [actualWeights, setActualWeights] = useState({});
  const [varianceReasons, setVarianceReasons] = useState({});

  // Batch Association State (Epic 6 - RECV-003)
  const [batchNumbers, setBatchNumbers] = useState({});
  const [supplierBatchRefs, setSupplierBatchRefs] = useState({});
  const [mfgDates, setMfgDates] = useState({});

  // PCS-Centric Tracking State (Industry Standard - Phase 5)
  // Core Doctrine: PCS is the unit of truth. Weight describes the piece.
  const [pcsReceived, setPcsReceived] = useState({});
  const [weightSources, setWeightSources] = useState({});

  // Load warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);

        // Set default warehouse
        if (!selectedWarehouseId && result.data?.length > 0) {
          const defaultWh =
            result.data.find((w) => w.isDefault) || result.data[0];
          setSelectedWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error('Error fetching warehouses:', err);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    if (open) {
      fetchWarehouses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Initialize selected items and quantities when poItems change
  useEffect(() => {
    if (poItems && poItems.length > 0) {
      const initialSelected = {};
      const initialQuantities = {};
      const initialExpectedWeights = {};
      const initialActualWeights = {};
      const initialBatchNumbers = {};
      const initialSupplierBatchRefs = {};
      const initialMfgDates = {};
      // PCS-Centric Tracking (Phase 5)
      const initialPcsReceived = {};
      const initialWeightSources = {};

      const today = new Date().toISOString().split('T')[0];

      poItems.forEach((item) => {
        const pending =
          parseFloat(item.pendingQuantity) ||
          parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);

        // Only select items with pending quantities
        if (pending > 0) {
          initialSelected[item.id] = true;
          initialQuantities[item.id] = pending;
          // Initialize expected weight from order quantity
          initialExpectedWeights[item.id] = pending;
          initialActualWeights[item.id] = pending;
          // Auto-generate batch number (Epic 6 - RECV-003)
          const _timestamp = Date.now();
          const randomSuffix = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();
          initialBatchNumbers[item.id] =
            `IMP-${purchaseOrderId || 'PO'}-${item.id}-${randomSuffix}`;
          initialSupplierBatchRefs[item.id] = '';
          initialMfgDates[item.id] = today;
          // PCS-Centric: Default PCS to pending quantity (assume 1 PCS per unit if not specified)
          const itemPcs =
            parseInt(item.pcsOrdered || item.orderedPcs || pending) || 1;
          initialPcsReceived[item.id] = itemPcs;
          initialWeightSources[item.id] = 'ACTUAL'; // Default to actual (weighed)
        }
      });

      setSelectedItems(initialSelected);
      setQuantities(initialQuantities);
      setExpectedWeights(initialExpectedWeights);
      setActualWeights(initialActualWeights);
      setBatchNumbers(initialBatchNumbers);
      setSupplierBatchRefs(initialSupplierBatchRefs);
      setMfgDates(initialMfgDates);
      setPcsReceived(initialPcsReceived);
      setWeightSources(initialWeightSources);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poItems]);

  // Generate GRN number on mount (Epic 3 - RECV-001)
  useEffect(() => {
    if (open && !grnNumber) {
      const timestamp = new Date().getTime();
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      setGrnNumber(`GRN-${timestamp}-${randomSuffix}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, loading]);

  // Filter items to only those with products (can create stock movements)
  const receivableItems = useMemo(() => {
    return poItems.filter((item) => item.productId || item.product_id);
  }, [poItems]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalOrdered = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let totalToReceive = 0;

    receivableItems.forEach((item) => {
      const ordered = parseFloat(item.quantity) || 0;
      const received = parseFloat(item.receivedQuantity) || 0;
      const pending = parseFloat(item.pendingQuantity) || ordered - received;

      totalOrdered += ordered;
      totalReceived += received;
      totalPending += pending;

      if (selectedItems[item.id]) {
        totalToReceive += parseFloat(quantities[item.id]) || 0;
      }
    });

    return { totalOrdered, totalReceived, totalPending, totalToReceive };
  }, [receivableItems, selectedItems, quantities]);

  // Handle select all
  const handleSelectAll = (checked) => {
    const newSelected = {};
    if (checked) {
      receivableItems.forEach((item) => {
        const pending =
          parseFloat(item.pendingQuantity) ||
          parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);
        if (pending > 0) {
          newSelected[item.id] = true;
        }
      });
    }
    setSelectedItems(newSelected);
  };

  // Handle individual item selection
  const handleSelectItem = (itemId, checked) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, value) => {
    const item = receivableItems.find((i) => i.id === itemId);
    if (!item) return;

    const maxQty =
      parseFloat(item.pendingQuantity) ||
      parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);
    const newValue = Math.min(Math.max(0, parseFloat(value) || 0), maxQty);

    setQuantities((prev) => ({
      ...prev,
      [itemId]: newValue,
    }));
  };

  // Set quantity to max (pending)
  const handleSetMaxQuantity = (itemId) => {
    const item = receivableItems.find((i) => i.id === itemId);
    if (!item) return;

    const maxQty =
      parseFloat(item.pendingQuantity) ||
      parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);

    setQuantities((prev) => ({
      ...prev,
      [itemId]: maxQty,
    }));
  };

  // Handle actual weight change (Epic 3 - RECV-002)
  const handleActualWeightChange = (itemId, value) => {
    const numValue = parseFloat(value) || 0;
    setActualWeights((prev) => ({
      ...prev,
      [itemId]: numValue,
    }));
  };

  // Handle variance reason change (Epic 3 - RECV-002)
  const handleVarianceReasonChange = (itemId, reason) => {
    setVarianceReasons((prev) => ({
      ...prev,
      [itemId]: reason,
    }));
  };

  // PCS-Centric Tracking Handlers (Phase 5)
  // Core Doctrine: PCS is the unit of truth - integer only
  const handlePcsReceivedChange = (itemId, value) => {
    const pcs = parseInt(value, 10);
    if (value === '' || (Number.isInteger(pcs) && pcs >= 0)) {
      setPcsReceived((prev) => ({
        ...prev,
        [itemId]: value === '' ? '' : pcs,
      }));
    }
  };

  // Handle weight source change (ACTUAL = weighed, CALCULATED = nominal)
  const handleWeightSourceChange = (itemId, source) => {
    setWeightSources((prev) => ({
      ...prev,
      [itemId]: source,
    }));
  };

  // Calculate weight per piece (derived from PCS and actual weight)
  const calculateWeightPerPiece = (itemId) => {
    const pcs = parseInt(pcsReceived[itemId]) || 0;
    const weight = parseFloat(actualWeights[itemId]) || 0;
    if (pcs > 0 && weight > 0) {
      return (weight / pcs).toFixed(3);
    }
    return '0.000';
  };

  // Check if item is a single piece (coil)
  const isSinglePiece = (itemId) => {
    return parseInt(pcsReceived[itemId]) === 1;
  };

  // Calculate weight variance for an item (Epic 3 - RECV-002)
  const calculateWeightVariance = (itemId) => {
    const expected = parseFloat(expectedWeights[itemId]) || 0;
    const actual = parseFloat(actualWeights[itemId]) || 0;
    if (expected === 0) return { variance: 0, percentage: 0 };
    const variance = actual - expected;
    const percentage = (variance / expected) * 100;
    return { variance, percentage };
  };

  // Handle GRN approval (Epic 3 - RECV-001)
  const handleApproveGRN = () => {
    setGrnStatus('approved');
    setApprovedBy('Current User'); // TODO: Get from auth context
    setApprovalDate(new Date().toISOString().split('T')[0]);
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Validate GRN approval (Epic 3 - RECV-001)
      if (grnStatus !== 'approved') {
        setError('GRN must be approved before receiving stock');
        setLoading(false);
        return;
      }

      // Validate
      if (!selectedWarehouseId) {
        setError('Please select a warehouse');
        setLoading(false);
        return;
      }

      // Build items to receive
      const itemsToReceive = [];
      Object.entries(selectedItems).forEach(([itemId, isSelected]) => {
        if (isSelected) {
          const qty = parseFloat(quantities[itemId]) || 0;
          if (qty > 0) {
            const item = receivableItems.find((i) => i.id === parseInt(itemId));
            if (item) {
              const { variance, percentage } = calculateWeightVariance(
                parseInt(itemId),
              );
              // PCS-Centric Tracking (Phase 5)
              const itemPcs = parseInt(pcsReceived[itemId]) || 1;
              const itemWeightKg = parseFloat(actualWeights[itemId]) || qty;
              const weightPerPieceKg = itemPcs > 0 ? itemWeightKg / itemPcs : 0;
              const isSinglePieceItem = itemPcs === 1;

              itemsToReceive.push({
                itemId: parseInt(itemId),
                productId: item.productId || item.product_id,
                receivedQuantity: qty,
                // Weight variance data (Epic 3 - RECV-002)
                expectedWeight: parseFloat(expectedWeights[itemId]) || qty,
                actualWeight: itemWeightKg,
                weightVariance: variance,
                variancePercentage: percentage,
                varianceReason: varianceReasons[itemId] || 'accepted_tolerance',
                // Batch data (Epic 6 - RECV-003)
                batchNumber: batchNumbers[itemId] || '',
                supplierBatchRef: supplierBatchRefs[itemId] || '',
                mfgDate: mfgDates[itemId] || '',
                // PCS-Centric Tracking (Phase 5 - Industry Standard)
                pcsReceived: itemPcs,
                weightKgReceived: itemWeightKg,
                weightPerPieceKg,
                weightSource: weightSources[itemId] || 'ACTUAL',
                isSinglePiece: isSinglePieceItem,
                isUniformWeight: true, // GRN assumes uniform for simplicity
                pcsTrackingComplete: true, // Complete from day 1
              });
            }
          }
        }
      });

      if (itemsToReceive.length === 0) {
        setError('No items selected for receiving');
        setLoading(false);
        return;
      }

      // Call API with GRN data (Epic 3 - RECV-001)
      const result = await stockMovementService.createFromPurchaseOrder(
        purchaseOrderId,
        selectedWarehouseId,
        itemsToReceive,
        notes,
        {
          grnNumber,
          grnStatus,
          grnDate,
          approvedBy,
          approvalDate,
        },
      );

      if (result.success || result.totalCreated > 0) {
        setSuccess(
          `Successfully received ${result.totalCreated} item(s) into stock`,
        );

        // Call success callback after short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result);
          }
          onClose();
        }, 1500);
      } else if (result.errors && result.errors.length > 0) {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      console.error('Error receiving stock:', err);
      setError(err.message || 'Failed to receive stock');
    } finally {
      setLoading(false);
    }
  };

  // Check if any items are selected
  const hasSelectedItems = Object.values(selectedItems).some((v) => v);
  const allSelected =
    receivableItems.length > 0 &&
    receivableItems
      .filter((i) => {
        const pending =
          parseFloat(i.pendingQuantity) ||
          parseFloat(i.quantity) - parseFloat(i.receivedQuantity || 0);
        return pending > 0;
      })
      .every((i) => selectedItems[i.id]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 ${overlayBg} z-40 transition-opacity`}
        onClick={() => !loading && onClose()}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !loading) onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
      >
        <div
          className={`${modalBg} border ${modalBorder} rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between p-4 border-b ${modalBorder}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${cardBg}`}>
                <Truck className="w-5 h-5 text-[#4aa3ff]" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${textPrimary}`}>
                  Receive Stock
                </h2>
                <p className={`text-xs ${textMuted}`}>PO: {poNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className={`p-2 rounded-xl ${cardBg} ${textMuted} hover:${textPrimary} transition-colors disabled:opacity-50`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            {/* GRN Section (Epic 3 - RECV-001) */}
            <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`text-xs font-medium ${textMuted} flex items-center gap-2`}
                >
                  <FileText className="w-4 h-4" />
                  Goods Receipt Note (GRN)
                </div>
                {grnStatus === 'draft' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                    Draft
                  </span>
                )}
                {grnStatus === 'pending_approval' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
                    Pending Approval
                  </span>
                )}
                {grnStatus === 'approved' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label
                    htmlFor="grn-number"
                    className={`text-xs ${textMuted} mb-1 block`}
                  >
                    GRN Number
                  </label>
                  <input
                    id="grn-number"
                    type="text"
                    value={grnNumber}
                    disabled
                    className={`w-full ${inputBg} border ${inputBorder} rounded-lg py-2 px-3 text-sm ${textPrimary} disabled:opacity-70`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="grn-date"
                    className={`text-xs ${textMuted} mb-1 block`}
                  >
                    GRN Date
                  </label>
                  <input
                    id="grn-date"
                    type="date"
                    value={grnDate}
                    onChange={(e) => setGrnDate(e.target.value)}
                    disabled={grnStatus === 'approved'}
                    className={`w-full ${inputBg} border ${inputBorder} rounded-lg py-2 px-3 text-sm ${textPrimary} ${inputFocus} outline-none disabled:opacity-70`}
                  />
                </div>
              </div>

              {grnStatus === 'approved' && approvedBy && (
                <div
                  className={`p-3 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} border ${isDarkMode ? 'border-green-700/30' : 'border-green-200'} rounded-lg flex items-center gap-2`}
                >
                  <Shield className="w-4 h-4 text-green-500" />
                  <div className="flex-1">
                    <p className={`text-xs ${textPrimary} font-medium`}>
                      Approved by {approvedBy} on {approvalDate}
                    </p>
                  </div>
                </div>
              )}

              {grnStatus !== 'approved' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApproveGRN}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve GRN
                  </button>
                </div>
              )}

              {grnStatus !== 'approved' && (
                <div
                  className={`mt-3 p-2.5 ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDarkMode ? 'border-yellow-700/30' : 'border-yellow-200'} rounded-lg flex items-start gap-2`}
                >
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    GRN must be approved before stock can be received.
                  </p>
                </div>
              )}
            </div>

            {/* Warehouse Selection */}
            <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
              <label
                htmlFor="destination-warehouse"
                className={`text-xs font-medium ${textMuted} mb-2 flex items-center gap-2`}
              >
                <Warehouse className="w-4 h-4" />
                Destination Warehouse
              </label>
              <div className="relative">
                <select
                  id="destination-warehouse"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  disabled={loadingWarehouses}
                  className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-2.5 px-3 pr-10 text-sm ${textPrimary} ${inputFocus} outline-none appearance-none disabled:opacity-50`}
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.code ? `(${wh.code})` : ''}{' '}
                      {wh.isDefault && '(Default)'}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted} pointer-events-none`}
                />
              </div>
            </div>

            {/* No receivable items warning */}
            {receivableItems.length === 0 ? (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${textPrimary}`}>
                    No Receivable Items
                  </p>
                  <p className={`text-xs ${textMuted} mt-1`}>
                    No items with linked products found. Stock movements can
                    only be created for items that are linked to products in
                    inventory.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div
                    className={`${cardBg} border ${cardBorder} rounded-xl p-3 text-center`}
                  >
                    <p className={`text-xs ${textMuted}`}>Total Ordered</p>
                    <p
                      className={`text-base font-bold ${textPrimary} font-mono mt-1`}
                    >
                      {formatQuantity(totals.totalOrdered)}
                    </p>
                  </div>
                  <div
                    className={`${cardBg} border ${cardBorder} rounded-xl p-3 text-center`}
                  >
                    <p className={`text-xs ${textMuted}`}>Already Received</p>
                    <p className="text-base font-bold text-green-400 font-mono mt-1">
                      {formatQuantity(totals.totalReceived)}
                    </p>
                  </div>
                  <div
                    className={`${cardBg} border ${cardBorder} rounded-xl p-3 text-center`}
                  >
                    <p className={`text-xs ${textMuted}`}>Pending</p>
                    <p className="text-base font-bold text-yellow-400 font-mono mt-1">
                      {formatQuantity(totals.totalPending)}
                    </p>
                  </div>
                  <div className="bg-[#4aa3ff]/20 border border-[#4aa3ff]/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-[#4aa3ff]">To Receive Now</p>
                    <p className="text-base font-bold text-[#4aa3ff] font-mono mt-1">
                      {formatQuantity(totals.totalToReceive)}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div
                  className={`border ${tableBorder} rounded-xl overflow-hidden`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={tableHeaderBg}>
                          <th className={`p-3 border-b ${tableBorder} w-10`}>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el)
                                  el.indeterminate =
                                    hasSelectedItems && !allSelected;
                              }}
                              onChange={(e) =>
                                handleSelectAll(e.target.checked)
                              }
                              className="w-4 h-4 rounded border-gray-400 text-[#4aa3ff] focus:ring-[#4aa3ff]/20"
                            />
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-left ${textMuted} font-medium`}
                          >
                            Product
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium`}
                          >
                            Ordered
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium`}
                          >
                            Received
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium`}
                          >
                            Pending
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-center ${textMuted} font-medium`}
                          >
                            Status
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium min-w-[140px]`}
                          >
                            Qty to Receive
                          </th>
                          {/* PCS-Centric Tracking Columns (Phase 5) */}
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium min-w-[100px]`}
                          >
                            PCS
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium min-w-[120px]`}
                          >
                            Weight (KG)
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium min-w-[100px]`}
                          >
                            KG/PCS
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-center ${textMuted} font-medium min-w-[100px]`}
                          >
                            Weight Src
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-center ${textMuted} font-medium min-w-[100px]`}
                          >
                            Variance %
                          </th>
                          <th
                            className={`p-3 border-b ${tableBorder} text-left ${textMuted} font-medium min-w-[150px]`}
                          >
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivableItems.map((item) => {
                          const ordered = parseFloat(item.quantity) || 0;
                          const received =
                            parseFloat(item.receivedQuantity) || 0;
                          const pending =
                            parseFloat(item.pendingQuantity) ||
                            ordered - received;
                          const status = getReceivingStatus(item);
                          const isComplete = pending <= 0;
                          const isSelected = selectedItems[item.id];

                          const statusColors = {
                            green:
                              'bg-green-500/15 text-green-400 border-green-500/30',
                            yellow:
                              'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                            gray: isDarkMode
                              ? 'bg-[#2a3640] text-[#93a4b4] border-[#3a4650]'
                              : 'bg-gray-100 text-gray-500 border-gray-300',
                          };

                          return (
                            <tr
                              key={item.id}
                              className={`${isComplete ? 'opacity-50' : ''} ${isSelected && !isComplete ? (isDarkMode ? 'bg-[#4aa3ff]/5' : 'bg-blue-50') : ''} ${tableRowHover} transition-colors`}
                            >
                              <td className={`p-3 border-b ${tableBorder}`}>
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={(e) =>
                                    handleSelectItem(item.id, e.target.checked)
                                  }
                                  disabled={isComplete}
                                  className="w-4 h-4 rounded border-gray-400 text-[#4aa3ff] focus:ring-[#4aa3ff]/20 disabled:opacity-50"
                                />
                              </td>
                              <td className={`p-3 border-b ${tableBorder}`}>
                                <p className={`font-medium ${textPrimary}`}>
                                  {item.name ||
                                    item.productName ||
                                    `Product #${item.productId}`}
                                </p>
                                {item.productSku && (
                                  <p
                                    className={`text-xs ${textMuted} font-mono`}
                                  >
                                    SKU: {item.productSku}
                                  </p>
                                )}
                              </td>
                              <td
                                className={`p-3 border-b ${tableBorder} text-right font-mono ${textPrimary}`}
                              >
                                {formatQuantity(ordered, item.unit)}
                              </td>
                              <td
                                className={`p-3 border-b ${tableBorder} text-right font-mono text-green-400`}
                              >
                                {formatQuantity(received, item.unit)}
                              </td>
                              <td
                                className={`p-3 border-b ${tableBorder} text-right font-mono ${pending > 0 ? 'text-yellow-400' : textMuted}`}
                              >
                                {formatQuantity(pending, item.unit)}
                              </td>
                              <td
                                className={`p-3 border-b ${tableBorder} text-center`}
                              >
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusColors[status.color]}`}
                                >
                                  {status.label}
                                </span>
                              </td>
                              <td className={`p-3 border-b ${tableBorder}`}>
                                {!isComplete ? (
                                  <div className="flex items-center gap-2 justify-end">
                                    <input
                                      type="number"
                                      value={quantities[item.id] || ''}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          item.id,
                                          e.target.value,
                                        )
                                      }
                                      disabled={!isSelected}
                                      min={0}
                                      max={pending}
                                      step={0.01}
                                      className={`w-24 ${inputBg} border ${inputBorder} rounded-xl py-1.5 px-2 text-sm text-right font-mono ${textPrimary} ${inputFocus} outline-none disabled:opacity-50`}
                                    />
                                    <button
                                      onClick={() =>
                                        handleSetMaxQuantity(item.id)
                                      }
                                      disabled={!isSelected}
                                      title="Set max quantity"
                                      className={`p-1.5 rounded-lg ${cardBg} ${textMuted} hover:text-[#4aa3ff] transition-colors disabled:opacity-50`}
                                    >
                                      <Package className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    className={`text-center block ${textMuted}`}
                                  >
                                    -
                                  </span>
                                )}
                              </td>
                              {/* PCS-Centric Tracking Columns (Phase 5 - Industry Standard) */}
                              {/* PCS Input - Integer Only */}
                              <td className={`p-3 border-b ${tableBorder}`}>
                                {!isComplete && isSelected ? (
                                  <input
                                    type="number"
                                    value={pcsReceived[item.id] ?? ''}
                                    onChange={(e) =>
                                      handlePcsReceivedChange(
                                        item.id,
                                        e.target.value,
                                      )
                                    }
                                    min={1}
                                    step={1}
                                    className={`w-20 ${inputBg} border ${inputBorder} rounded-xl py-1.5 px-2 text-sm text-right font-mono ${textPrimary} ${inputFocus} outline-none`}
                                    title="Pieces received (integer only)"
                                  />
                                ) : (
                                  <span
                                    className={`text-center block ${textMuted}`}
                                  >
                                    -
                                  </span>
                                )}
                              </td>
                              {/* Weight (KG) Input */}
                              <td className={`p-3 border-b ${tableBorder}`}>
                                {!isComplete && isSelected ? (
                                  <input
                                    type="number"
                                    value={actualWeights[item.id] || ''}
                                    onChange={(e) =>
                                      handleActualWeightChange(
                                        item.id,
                                        e.target.value,
                                      )
                                    }
                                    min={0}
                                    step={0.001}
                                    className={`w-28 ${inputBg} border ${inputBorder} rounded-xl py-1.5 px-2 text-sm text-right font-mono ${textPrimary} ${inputFocus} outline-none`}
                                    title="Total weight received (KG)"
                                  />
                                ) : (
                                  <span
                                    className={`text-center block ${textMuted}`}
                                  >
                                    -
                                  </span>
                                )}
                              </td>
                              {/* KG/PCS - Auto-calculated, Read-only */}
                              <td
                                className={`p-3 border-b ${tableBorder} text-right font-mono ${textMuted}`}
                              >
                                {!isComplete && isSelected ? (
                                  <span
                                    title={
                                      isSinglePiece(item.id)
                                        ? 'Single piece (coil)'
                                        : 'Weight per piece'
                                    }
                                  >
                                    {calculateWeightPerPiece(item.id)}
                                    {isSinglePiece(item.id) && (
                                      <span className="ml-1 text-xs text-yellow-400">
                                        🔶
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                              {/* Weight Source Dropdown */}
                              <td className={`p-3 border-b ${tableBorder}`}>
                                {!isComplete && isSelected ? (
                                  <select
                                    value={weightSources[item.id] || 'ACTUAL'}
                                    onChange={(e) =>
                                      handleWeightSourceChange(
                                        item.id,
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-1.5 px-2 text-xs ${textPrimary} ${inputFocus} outline-none`}
                                    title="Weight source: ACTUAL (weighed) or CALCULATED (nominal)"
                                  >
                                    <option value="ACTUAL">Actual</option>
                                    <option value="CALCULATED">Calc</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`text-center block ${textMuted}`}
                                  >
                                    -
                                  </span>
                                )}
                              </td>
                              {/* Weight Variance % (Epic 3 - RECV-002) */}
                              <td
                                className={`p-3 border-b ${tableBorder} text-center`}
                              >
                                {!isComplete && isSelected ? (
                                  (() => {
                                    const { percentage } =
                                      calculateWeightVariance(item.id);
                                    const isHighVariance =
                                      Math.abs(percentage) > 5;
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isHighVariance ? 'bg-red-500/15 text-red-400' : percentage === 0 ? 'bg-gray-500/15 text-gray-400' : 'bg-blue-500/15 text-blue-400'}`}
                                      >
                                        {isHighVariance && (
                                          <AlertTriangle className="w-3 h-3" />
                                        )}
                                        {percentage > 0 ? '+' : ''}
                                        {percentage.toFixed(2)}%
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className={textMuted}>-</span>
                                )}
                              </td>
                              <td className={`p-3 border-b ${tableBorder}`}>
                                {!isComplete && isSelected ? (
                                  <select
                                    value={
                                      varianceReasons[item.id] ||
                                      'accepted_tolerance'
                                    }
                                    onChange={(e) =>
                                      handleVarianceReasonChange(
                                        item.id,
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-1.5 px-2 text-xs ${textPrimary} ${inputFocus} outline-none`}
                                  >
                                    <option value="accepted_tolerance">
                                      Accepted Tolerance
                                    </option>
                                    <option value="shortage">Shortage</option>
                                    <option value="damage_weight_loss">
                                      Damage/Weight Loss
                                    </option>
                                    <option value="measurement_difference">
                                      Measurement Difference
                                    </option>
                                  </select>
                                ) : (
                                  <span
                                    className={`text-center block ${textMuted}`}
                                  >
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes Accordion */}
                <details
                  className={`${cardBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
                >
                  <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                    <div>
                      <div className={`text-sm font-bold ${textPrimary}`}>
                        Receipt Notes
                      </div>
                      <div className={`text-xs ${textMuted}`}>
                        Optional notes about this stock receipt
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                    />
                  </summary>
                  <div className={`p-3 border-t ${cardBorder}`}>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this stock receipt..."
                      rows={3}
                      className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-2.5 px-3 text-sm ${textPrimary} ${inputFocus} outline-none resize-none`}
                    />
                  </div>
                </details>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between gap-3 p-4 border-t ${modalBorder}`}
          >
            <div className={`text-xs ${textMuted}`}>
              {hasSelectedItems ? (
                <span>
                  {Object.values(selectedItems).filter(Boolean).length} item(s)
                  selected
                </span>
              ) : (
                <span>Select items to receive</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className={`px-4 py-2.5 rounded-xl border ${cardBorder} ${textPrimary} text-sm font-medium hover:${cardBg} transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading || !hasSelectedItems || totals.totalToReceive <= 0
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4aa3ff] text-white text-sm font-medium hover:bg-[#3d8ee6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Receiving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Receive {formatQuantity(totals.totalToReceive)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StockReceiptForm;
