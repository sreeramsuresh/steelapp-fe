import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Package, Ship, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '../ui/table';

/**
 * AllocationPanel Component
 * 
 * Displays FIFO batch allocations for an invoice line item.
 * Shows read-only allocation details computed by the backend.
 * 
 * Props:
 * - productId: Product ID
 * - warehouseId: Warehouse ID
 * - requiredQty: Required quantity for the line item
 * - allocations: Array of batch allocations from backend
 * - onAllocationsChange: Optional callback when allocations change
 * - disabled: Whether the panel is in view-only mode
 */
const AllocationPanel = ({
  productId,
  warehouseId,
  requiredQty,
  allocations = [],
  onAllocationsChange,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();
  const [totalAllocated, setTotalAllocated] = useState(0);

  // Calculate total allocated quantity
  useEffect(() => {
    const total = allocations.reduce((sum, allocation) => sum + (allocation.quantity || 0), 0);
    setTotalAllocated(total);
  }, [allocations]);

  // Check if allocation is complete
  const isComplete = totalAllocated >= requiredQty;
  const isShortfall = totalAllocated < requiredQty && allocations.length > 0;

  /**
   * Get procurement channel badge styling
   */
  const getProcurementBadge = (channel) => {
    if (channel === 'IMPORTED') {
      return (
        <Badge
          className={`inline-flex items-center gap-1 ${
            isDarkMode
              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <Ship size={12} />
          IMPORTED
        </Badge>
      );
    }

    return (
      <Badge
        className={`inline-flex items-center gap-1 ${
          isDarkMode
            ? 'bg-blue-900/40 text-blue-300 border-blue-700'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}
      >
        <Package size={12} />
        LOCAL
      </Badge>
    );
  };

  /**
   * Format currency for unit cost display
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value || 0);
  };

  /**
   * Format quantity with commas
   */
  const formatQty = (qty) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  // If no allocations, show empty state
  if (allocations.length === 0) {
    return (
      <div
        className={`p-4 rounded-lg border ${
          isDarkMode
            ? 'bg-gray-800/50 border-gray-700 text-gray-400'
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}
      >
        <p className="text-sm text-center">
          No batch allocations available. FIFO allocation will be computed on save.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h4
          className={`text-sm font-semibold ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}
        >
          Batch Allocations (FIFO)
        </h4>

        {isComplete && (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle size={16} />
            <span>Fully Allocated</span>
          </div>
        )}
      </div>

      {/* Allocations Table */}
      <div
        className={`rounded-lg border ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <Table>
          <TableHeader>
            <TableRow className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
              <TableHead className="w-[140px]">Batch #</TableHead>
              <TableHead className="w-[160px]">Procurement</TableHead>
              <TableHead className="text-right w-[120px]">Available Qty</TableHead>
              <TableHead className="text-right w-[120px]">Allocated Qty</TableHead>
              <TableHead className="text-right w-[120px]">Unit Cost</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {allocations.map((allocation, index) => (
              <TableRow
                key={allocation.batchId || index}
                className={
                  isDarkMode
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }
              >
                <TableCell className="font-mono text-sm">
                  {allocation.batchNumber || allocation.batch_number || '-'}
                </TableCell>
                <TableCell>
                  {getProcurementBadge(
                    allocation.procurementChannel || allocation.procurement_channel || 'LOCAL'
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatQty(allocation.availableQty || allocation.available_qty || 0)}
                </TableCell>
                <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                  {formatQty(allocation.quantity || 0)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatCurrency(allocation.unitCost || allocation.unit_cost || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow className={isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
              <TableCell colSpan={3} className="font-semibold">
                Total Allocated
              </TableCell>
              <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                {formatQty(totalAllocated)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Shortfall Warning */}
      {isShortfall && (
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-amber-900/20 border-amber-700 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold">Insufficient Stock</p>
            <p className="text-sm">
              Required: <span className="font-semibold">{formatQty(requiredQty)}</span> | 
              Allocated: <span className="font-semibold">{formatQty(totalAllocated)}</span> | 
              Shortfall: <span className="font-semibold text-red-600 dark:text-red-400">
                {formatQty(requiredQty - totalAllocated)}
              </span>
            </p>
            <p className="text-xs opacity-80">
              This line item cannot be fully fulfilled with current stock levels.
            </p>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div
        className={`text-xs p-2 rounded ${
          isDarkMode
            ? 'bg-gray-800/50 text-gray-400'
            : 'bg-gray-50 text-gray-600'
        }`}
      >
        <p>
          Allocations are computed automatically using FIFO (First-In-First-Out) logic based on batch creation dates.
          {!disabled && ' Changes will be applied when the invoice is saved.'}
        </p>
      </div>
    </div>
  );
};

AllocationPanel.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  warehouseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  requiredQty: PropTypes.number.isRequired,
  allocations: PropTypes.arrayOf(
    PropTypes.shape({
      batchId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      batch_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      batchNumber: PropTypes.string,
      batch_number: PropTypes.string,
      quantity: PropTypes.number,
      unitCost: PropTypes.number,
      unit_cost: PropTypes.number,
      procurementChannel: PropTypes.oneOf(['LOCAL', 'IMPORTED']),
      procurement_channel: PropTypes.oneOf(['LOCAL', 'IMPORTED']),
      availableQty: PropTypes.number,
      available_qty: PropTypes.number,
    })
  ),
  onAllocationsChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default AllocationPanel;
