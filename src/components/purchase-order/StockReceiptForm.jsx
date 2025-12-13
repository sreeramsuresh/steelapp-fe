/**
 * StockReceiptForm Component
 * Phase 4.4: PO Stock Receiving with Partial Support
 *
 * A dialog/drawer component for receiving stock from a purchase order.
 * Supports:
 * - Full receiving (all pending items)
 * - Partial receiving (selected items with custom quantities)
 * - Warehouse selection
 * - Notes and batch/coil/heat tracking
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
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
    return { status: 'complete', label: 'Complete', color: 'success' };
  } else if (received > 0) {
    return { status: 'partial', label: 'Partial', color: 'warning' };
  }
  return { status: 'pending', label: 'Pending', color: 'default' };
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
  }, [open]); // fetchWarehouses is stable

  // Initialize selected items and quantities when poItems change
  useEffect(() => {
    if (poItems && poItems.length > 0) {
      const initialSelected = {};
      const initialQuantities = {};

      poItems.forEach((item) => {
        const pending =
          parseFloat(item.pendingQuantity) ||
          parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);

        // Only select items with pending quantities
        if (pending > 0) {
          initialSelected[item.id] = true;
          initialQuantities[item.id] = pending;
        }
      });

      setSelectedItems(initialSelected);
      setQuantities(initialQuantities);
    }
  }, [poItems]);

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

  // Handle submit
  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Validate
      if (!selectedWarehouseId) {
        setError('Please select a warehouse');
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
              itemsToReceive.push({
                itemId: parseInt(itemId),
                productId: item.productId || item.product_id,
                receivedQuantity: qty,
              });
            }
          }
        }
      });

      if (itemsToReceive.length === 0) {
        setError('No items selected for receiving');
        return;
      }

      // Call API
      const result = await stockMovementService.createFromPurchaseOrder(
        purchaseOrderId,
        selectedWarehouseId,
        itemsToReceive,
        notes,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShippingIcon color="primary" />
            <Typography variant="h6">Receive Stock - {poNumber}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Error/Success Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            {success}
          </Alert>
        )}

        {/* Warehouse Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="warehouse-select-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarehouseIcon fontSize="small" />
                Destination Warehouse
              </Box>
            </InputLabel>
            <Select
              labelId="warehouse-select-label"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              label="Destination Warehouse"
              disabled={loadingWarehouses}
            >
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ''}{' '}
                  {wh.isDefault && '(Default)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* No receivable items warning */}
        {receivableItems.length === 0 ? (
          <Alert severity="warning" icon={<WarningIcon />}>
            No items with linked products found. Stock movements can only be
            created for items that are linked to products in inventory.
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Total Ordered
                </Typography>
                <Typography variant="h6">
                  {formatQuantity(totals.totalOrdered)}
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Already Received
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatQuantity(totals.totalReceived)}
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatQuantity(totals.totalPending)}
                </Typography>
              </Paper>
              <Paper
                sx={{
                  p: 2,
                  flex: '1 1 150px',
                  textAlign: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <Typography variant="caption">To Receive Now</Typography>
                <Typography variant="h6">
                  {formatQuantity(totals.totalToReceive)}
                </Typography>
              </Paper>
            </Box>

            {/* Items Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={hasSelectedItems && !allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right" sx={{ minWidth: 150 }}>
                      Qty to Receive
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receivableItems.map((item) => {
                    const ordered = parseFloat(item.quantity) || 0;
                    const received = parseFloat(item.receivedQuantity) || 0;
                    const pending =
                      parseFloat(item.pendingQuantity) || ordered - received;
                    const status = getReceivingStatus(item);
                    const isComplete = pending <= 0;

                    return (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{
                          opacity: isComplete ? 0.5 : 1,
                          bgcolor: selectedItems[item.id]
                            ? 'action.selected'
                            : 'inherit',
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={!!selectedItems[item.id]}
                            onChange={(e) =>
                              handleSelectItem(item.id, e.target.checked)
                            }
                            disabled={isComplete}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.name ||
                              item.productName ||
                              `Product #${item.productId}`}
                          </Typography>
                          {item.productSku && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              SKU: {item.productSku}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {formatQuantity(ordered, item.unit)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="success.main">
                            {formatQuantity(received, item.unit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={
                              pending > 0 ? 'warning.main' : 'text.secondary'
                            }
                          >
                            {formatQuantity(pending, item.unit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={status.label}
                            size="small"
                            color={status.color}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {!isComplete ? (
                            <TextField
                              type="number"
                              size="small"
                              value={quantities[item.id] || ''}
                              onChange={(e) =>
                                handleQuantityChange(item.id, e.target.value)
                              }
                              disabled={!selectedItems[item.id]}
                              sx={{ width: 120 }}
                              inputProps={{
                                min: 0,
                                max: pending,
                                step: 0.01,
                              }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Tooltip title="Set max quantity">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleSetMaxQuantity(item.id)
                                        }
                                        disabled={!selectedItems[item.id]}
                                      >
                                        <InventoryIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Notes Field */}
            <Box sx={{ mt: 3 }}>
              <TextField
                label="Notes"
                multiline
                rows={2}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this stock receipt..."
                size="small"
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !hasSelectedItems || totals.totalToReceive <= 0}
          startIcon={
            loading ? <CircularProgress size={16} /> : <CheckCircleIcon />
          }
        >
          {loading
            ? 'Receiving...'
            : `Receive ${formatQuantity(totals.totalToReceive)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockReceiptForm;
