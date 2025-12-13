/**
 * ReservationForm Component
 * Phase 6: Stock Reservations
 *
 * Form for creating new stock reservations
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Autocomplete,
} from '@mui/material';
import { BookmarkBorder as ReservationIcon } from '@mui/icons-material';
import { stockMovementService } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/dataService';

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = 'KG') => {
  return `${parseFloat(qty || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

const ReservationForm = ({ open, onClose, onSuccess }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [warehouseId, setWarehouseId] = useState('');
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [availableStock, setAvailableStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
          setWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error('Error loading warehouses:', err);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    if (open) {
      loadWarehouses();
    }
  }, [open]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const result = await productService.getProducts({ limit: 1000 });
        setProducts(result.data || []);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (open) {
      loadProducts();
    }
  }, [open]);

  // Load available stock when product/warehouse changes
  useEffect(() => {
    const loadStock = async () => {
      if (!warehouseId || !product) {
        setAvailableStock(null);
        return;
      }

      try {
        setLoadingStock(true);
        const result = await stockMovementService.getCurrentStock(
          product.id,
          warehouseId,
        );
        const warehouse = result.warehouses?.find(
          (w) => w.warehouseId === warehouseId,
        );
        setAvailableStock({
          quantityOnHand: parseFloat(warehouse?.quantityOnHand) || 0,
          quantityAvailable: parseFloat(warehouse?.quantityAvailable) || 0,
          unit: warehouse?.unit || 'KG',
        });
      } catch (err) {
        console.error('Error loading stock:', err);
        setAvailableStock(null);
      } finally {
        setLoadingStock(false);
      }
    };

    loadStock();
  }, [warehouseId, product]);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setProduct(null);
      setQuantity('');
      setExpiryDate('');
      setNotes('');
      setError(null);
    }
  }, [open]);

  // Validate form
  const validateForm = () => {
    if (!warehouseId) {
      setError('Please select a warehouse');
      return false;
    }
    if (!product) {
      setError('Please select a product');
      return false;
    }
    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) {
      setError('Quantity must be greater than 0');
      return false;
    }
    if (availableStock && qty > availableStock.quantityAvailable) {
      setError(
        `Insufficient available stock. Available: ${formatQuantity(availableStock.quantityAvailable, availableStock.unit)}`,
      );
      return false;
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

      const reservationData = {
        productId: product.id,
        warehouseId: parseInt(warehouseId),
        quantity: parseFloat(quantity),
        expiryDate: expiryDate || null,
        notes,
      };

      const result =
        await stockMovementService.createReservation(reservationData);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Failed to create reservation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReservationIcon color="primary" />
          <Typography variant="h6">Create Stock Reservation</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Warehouse */}
          <FormControl fullWidth disabled={loadingWarehouses}>
            <InputLabel>Warehouse *</InputLabel>
            <Select
              value={warehouseId}
              label="Warehouse *"
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Product */}
          <Autocomplete
            options={products}
            getOptionLabel={(option) =>
              `${option.name} (${option.sku || 'No SKU'})`
            }
            value={product}
            onChange={(e, newValue) => setProduct(newValue)}
            loading={loadingProducts}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product *"
                placeholder="Select product..."
              />
            )}
          />

          {/* Available Stock */}
          {availableStock !== null && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                label={`On Hand: ${formatQuantity(availableStock.quantityOnHand, availableStock.unit)}`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`Available: ${formatQuantity(availableStock.quantityAvailable, availableStock.unit)}`}
                color={
                  availableStock.quantityAvailable > 0 ? 'success' : 'error'
                }
                variant="outlined"
                size="small"
              />
            </Box>
          )}
          {loadingStock && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Loading stock levels...
              </Typography>
            </Box>
          )}

          {/* Quantity */}
          <TextField
            label="Quantity to Reserve *"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            error={
              availableStock &&
              parseFloat(quantity) > availableStock.quantityAvailable
            }
            helperText={
              availableStock
                ? `Max: ${availableStock.quantityAvailable} ${availableStock.unit}`
                : ''
            }
          />

          {/* Expiry Date */}
          <TextField
            label="Expiry Date (Optional)"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for no expiry"
          />

          {/* Notes */}
          <TextField
            label="Notes"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this reservation..."
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !product || !quantity}
          startIcon={saving && <CircularProgress size={16} />}
        >
          {saving ? 'Creating...' : 'Create Reservation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationForm;
