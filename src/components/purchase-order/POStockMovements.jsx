/**
 * POStockMovements Component
 * Phase 4: Purchase Order Integration
 *
 * Displays stock movements linked to a purchase order
 * Shows IN movements created when stock is received
 */

import { useState, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  stockMovementService,
  MOVEMENT_TYPES,
} from '../../services/stockMovementService';

/**
 * Format date for display
 */
const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  const date = dateValue.seconds
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
const formatQuantity = (quantity, unit = 'KG') => {
  const num = parseFloat(quantity) || 0;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

/**
 * Get movement type display info
 */
const getMovementTypeDisplay = (type) => {
  const typeInfo = MOVEMENT_TYPES[type] || { label: type, color: 'default' };
  return typeInfo;
};

const POStockMovements = ({
  purchaseOrderId,
  poNumber: _poNumber,
  defaultExpanded = true,
}) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (purchaseOrderId) {
      fetchMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrderId]); // fetchMovements is stable

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const result =
        await stockMovementService.getByPurchaseOrder(purchaseOrderId);
      setMovements(result.data || []);
    } catch (err) {
      console.error('Error fetching PO stock movements:', err);
      setError('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = movements.reduce(
    (acc, m) => {
      const qty = parseFloat(m.quantity) || 0;
      if (m.movementType === 'IN') {
        acc.totalIn += qty;
      }
      return acc;
    },
    { totalIn: 0 },
  );

  if (!purchaseOrderId) {
    return null;
  }

  return (
    <div className="mt-2 p-4 bg-white rounded-lg shadow border border-gray-200">
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); }}}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-base">
            Stock Movements
            {movements.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                {movements.length} movement{movements.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>
        {/* eslint-disable-next-line local-rules/no-dead-button */}
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          ) : movements.length === 0 ? (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-start gap-2">
              <Truck className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p>No stock has been received for this purchase order yet.</p>
                <p className="text-sm mt-1 opacity-75">
                  Stock movements will be created automatically when items are
                  received.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">
                        Balance After
                      </TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const typeDisplay = getMovementTypeDisplay(
                        movement.movementType,
                      );
                      return (
                        <TableRow
                          key={movement.id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <span className="text-xs text-gray-600">
                              {formatDate(movement.movementDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div title={`SKU: ${movement.productSku || 'N/A'}`}>
                              <span className="text-sm">
                                {movement.productName ||
                                  `Product #${movement.productId}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {movement.warehouseName ||
                                movement.warehouseCode ||
                                '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${typeDisplay.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                            >
                              {typeDisplay.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-medium text-green-600">
                              +
                              {formatQuantity(movement.quantity, movement.unit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-gray-600">
                              {formatQuantity(
                                movement.balanceAfter,
                                movement.unit,
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">
                              {movement.notes || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex justify-end gap-6 mt-4 pt-4 border-t border-gray-200">
                <div className="text-right">
                  <p className="text-xs text-gray-600">Total Stock Received</p>
                  <p className="text-lg font-semibold text-green-600">
                    +{formatQuantity(totals.totalIn, 'KG')}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default POStockMovements;
