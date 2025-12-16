/**
 * POStockMovements Component
 * Phase 4: Purchase Order Integration
 *
 * Displays stock movements linked to a purchase order
 * Shows IN movements created when stock is received
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
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
    <Paper sx={{ mt: 2, p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6">
            Stock Movements
            {movements.length > 0 && (
              <Chip
                label={`${movements.length} movement${movements.length !== 1 ? 's' : ''}`}
                size="small"
                color="success"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          ) : movements.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }} icon={<ShippingIcon />}>
              No stock has been received for this purchase order yet.
              <br />
              <Typography variant="caption" color="text.secondary">
                Stock movements will be created automatically when items are
                received.
              </Typography>
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Warehouse</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Balance After</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.map((movement) => {
                      const typeDisplay = getMovementTypeDisplay(
                        movement.movementType,
                      );
                      return (
                        <TableRow key={movement.id} hover>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(movement.movementDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              title={`SKU: ${movement.productSku || 'N/A'}`}
                            >
                              <Typography variant="body2">
                                {movement.productName ||
                                  `Product #${movement.productId}`}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {movement.warehouseName ||
                                movement.warehouseCode ||
                                '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={typeDisplay.label}
                              size="small"
                              color={
                                typeDisplay.color === 'green'
                                  ? 'success'
                                  : 'default'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              color="success.main"
                            >
                              +
                              {formatQuantity(movement.quantity, movement.unit)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatQuantity(
                                movement.balanceAfter,
                                movement.unit,
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {movement.notes || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 3,
                  mt: 2,
                  pt: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Stock Received
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    +{formatQuantity(totals.totalIn, 'KG')}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default POStockMovements;
