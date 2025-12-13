/**
 * TransferForm Component
 * Phase 5: Inter-Warehouse Transfers
 *
 * Form for creating new stock transfers
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { stockMovementService } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/dataService';

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = 'KG') => {
  return `${parseFloat(qty || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

const TransferForm = ({ onCancel, onSuccess }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockLevels, setStockLevels] = useState({});
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
      } catch (err) {
        console.error('Error loading warehouses:', err);
        setError('Failed to load warehouses');
      } finally {
        setLoadingWarehouses(false);
      }
    };
    loadWarehouses();
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const result = await productService.getProducts({ limit: 1000 });
        setProducts(result.data || []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Load stock levels when source warehouse changes
  useEffect(() => {
    const loadStockLevels = async () => {
      if (!sourceWarehouseId) {
        setStockLevels({});
        return;
      }

      try {
        const result = await stockMovementService.getStockLevels({
          warehouseId: sourceWarehouseId,
          limit: 1000,
        });

        const levels = {};
        (result.data || []).forEach((item) => {
          levels[item.productId] = {
            quantityOnHand: parseFloat(item.quantityOnHand) || 0,
            quantityAvailable: parseFloat(item.quantityAvailable) || 0,
            unit: item.unit || 'KG',
          };
        });
        setStockLevels(levels);
      } catch (err) {
        console.error('Error loading stock levels:', err);
      }
    };

    loadStockLevels();
  }, [sourceWarehouseId]);

  // Add new item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        productId: '',
        product: null,
        quantity: '',
        unit: 'KG',
        notes: '',
      },
    ]);
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  // Update item
  const handleItemChange = (itemId, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;

        const updates = { [field]: value };

        // If product changed, update productId and unit
        if (field === 'product' && value) {
          updates.productId = value.id;
          updates.unit = stockLevels[value.id]?.unit || 'KG';
        }

        return { ...item, ...updates };
      }),
    );
  };

  // Validate form
  const validateForm = () => {
    if (!sourceWarehouseId) {
      setError('Please select a source warehouse');
      return false;
    }
    if (!destinationWarehouseId) {
      setError('Please select a destination warehouse');
      return false;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      setError('Source and destination warehouses must be different');
      return false;
    }
    if (items.length === 0) {
      setError('Please add at least one item to transfer');
      return false;
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId) {
        setError('Please select a product for all items');
        return false;
      }
      const qty = parseFloat(item.quantity) || 0;
      if (qty <= 0) {
        setError('Quantity must be greater than 0 for all items');
        return false;
      }
      const available = stockLevels[item.productId]?.quantityAvailable || 0;
      if (qty > available) {
        setError(
          `Insufficient stock for ${item.product?.name || 'product'}. Available: ${formatQuantity(available, item.unit)}`,
        );
        return false;
      }
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const transferData = {
        sourceWarehouseId: parseInt(sourceWarehouseId),
        destinationWarehouseId: parseInt(destinationWarehouseId),
        expectedDate: expectedDate || null,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          notes: item.notes,
        })),
      };

      const result = await stockMovementService.createTransfer(transferData);
      onSuccess?.(result);
    } catch (err) {
      console.error('Error creating transfer:', err);
      setError(err.message || 'Failed to create transfer');
    } finally {
      setSaving(false);
    }
  };

  // Filter out already selected products
  const getAvailableProducts = (currentItemId) => {
    const selectedIds = items
      .filter((item) => item.id !== currentItemId && item.productId)
      .map((item) => item.productId);
    return products.filter((p) => !selectedIds.includes(p.id));
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TransferIcon fontSize="large" color="primary" />
          <Typography variant="h5">Create Stock Transfer</Typography>
        </Box>
        <Button startIcon={<BackIcon />} onClick={onCancel}>
          Back to List
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transfer Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Source Warehouse */}
          <FormControl sx={{ minWidth: 250 }} disabled={loadingWarehouses}>
            <InputLabel>Source Warehouse *</InputLabel>
            <Select
              value={sourceWarehouseId}
              label="Source Warehouse *"
              onChange={(e) => setSourceWarehouseId(e.target.value)}
            >
              {warehouses
                .filter((wh) => wh.id !== parseInt(destinationWarehouseId))
                .map((wh) => (
                  <MenuItem key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Destination Warehouse */}
          <FormControl sx={{ minWidth: 250 }} disabled={loadingWarehouses}>
            <InputLabel>Destination Warehouse *</InputLabel>
            <Select
              value={destinationWarehouseId}
              label="Destination Warehouse *"
              onChange={(e) => setDestinationWarehouseId(e.target.value)}
            >
              {warehouses
                .filter((wh) => wh.id !== parseInt(sourceWarehouseId))
                .map((wh) => (
                  <MenuItem key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Expected Date */}
          <TextField
            label="Expected Arrival Date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            sx={{ minWidth: 180 }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="Notes"
            multiline
            rows={2}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this transfer..."
          />
        </Box>
      </Paper>

      {/* Items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Items to Transfer</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            disabled={!sourceWarehouseId}
          >
            Add Item
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {!sourceWarehouseId ? (
          <Alert severity="info">
            Please select a source warehouse first to add items.
          </Alert>
        ) : items.length === 0 ? (
          <Alert severity="info">
            No items added. Click &quot;Add Item&quot; to add products to this
            transfer.
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ minWidth: 300 }}>Product</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right" sx={{ width: 150 }}>
                    Quantity
                  </TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell sx={{ width: 200 }}>Notes</TableCell>
                  <TableCell sx={{ width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const available =
                    stockLevels[item.productId]?.quantityAvailable || 0;
                  const stockUnit = stockLevels[item.productId]?.unit || 'KG';

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          options={getAvailableProducts(item.id)}
                          getOptionLabel={(option) =>
                            `${option.name} (${option.sku || 'No SKU'})`
                          }
                          value={item.product}
                          onChange={(e, newValue) =>
                            handleItemChange(item.id, 'product', newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select product..."
                            />
                          )}
                          loading={loadingProducts}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {item.productId ? (
                          <Chip
                            label={formatQuantity(available, stockUnit)}
                            size="small"
                            color={available > 0 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'quantity',
                              e.target.value,
                            )
                          }
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 120 }}
                          error={
                            item.productId &&
                            parseFloat(item.quantity) > available
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.unit}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.notes}
                          onChange={(e) =>
                            handleItemChange(item.id, 'notes', e.target.value)
                          }
                          placeholder="Optional..."
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={saving || items.length === 0}
        >
          {saving ? 'Creating...' : 'Create Transfer'}
        </Button>
      </Box>
    </Box>
  );
};

export default TransferForm;
