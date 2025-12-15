/**
 * ReservationList Component
 * Phase 6: Stock Reservations
 * Phase 3 Redesign: Standardized filter bar with search input
 *
 * Lists all stock reservations with filtering and actions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as FulfillIcon,
  Cancel as CancelIcon,
  BookmarkBorder as ReservationIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  stockMovementService,
  RESERVATION_STATUSES,
} from '../../services/stockMovementService';
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
  });
};

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = 'KG') => {
  return `${parseFloat(qty || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

/**
 * Get status chip props
 */
const getStatusChip = (status) => {
  const statusInfo = RESERVATION_STATUSES[status] || {
    label: status,
    color: 'default',
  };
  return statusInfo;
};

const ReservationList = ({ onCreateNew, onViewReservation }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [includeExpired, setIncludeExpired] = useState(false);

  // Action dialogs
  const [fulfillDialog, setFulfillDialog] = useState({
    open: false,
    reservation: null,
  });
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    reservation: null,
  });
  const [fulfillQuantity, setFulfillQuantity] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load warehouses for filter dropdown
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
      } catch (err) {
        console.error('Error loading warehouses:', err);
      }
    };
    loadWarehouses();
  }, []);

  // Load reservations
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await stockMovementService.listReservations({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        includeExpired,
        search: searchQuery || undefined,
      });

      // Client-side search filter if API doesn&apos;t support it
      let filteredData = result.data || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (r) =>
            (r.reservationNumber &&
              r.reservationNumber.toLowerCase().includes(query)) ||
            (r.productName && r.productName.toLowerCase().includes(query)) ||
            (r.productSku && r.productSku.toLowerCase().includes(query)) ||
            (r.warehouseName &&
              r.warehouseName.toLowerCase().includes(query)) ||
            (r.notes && r.notes.toLowerCase().includes(query)),
        );
      }

      setReservations(filteredData);
      setTotalCount(result.pagination?.totalItems || filteredData.length || 0);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    statusFilter,
    warehouseFilter,
    includeExpired,
    searchQuery,
  ]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open fulfill dialog
  const handleOpenFulfillDialog = (reservation) => {
    setFulfillQuantity(reservation.quantityRemaining.toString());
    setFulfillDialog({ open: true, reservation });
  };

  // Handle fulfill action
  const handleFulfill = async () => {
    if (!fulfillDialog.reservation) return;

    try {
      setActionLoading(true);
      await stockMovementService.fulfillReservation(
        fulfillDialog.reservation.id,
        {
          quantity: parseFloat(fulfillQuantity),
        },
      );
      setFulfillDialog({ open: false, reservation: null });
      setFulfillQuantity('');
      loadReservations();
    } catch (err) {
      console.error('Error fulfilling reservation:', err);
      setError(err.message || 'Failed to fulfill reservation');
    } finally {
      setActionLoading(false);
    }
  };

  // Open cancel dialog
  const handleOpenCancelDialog = (reservation) => {
    setCancelReason('');
    setCancelDialog({ open: true, reservation });
  };

  // Handle cancel action
  const handleCancel = async () => {
    if (!cancelDialog.reservation) return;

    try {
      setActionLoading(true);
      await stockMovementService.cancelReservation(
        cancelDialog.reservation.id,
        cancelReason,
      );
      setCancelDialog({ open: false, reservation: null });
      setCancelReason('');
      loadReservations();
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate fulfillment progress
  const getFulfillmentProgress = (reservation) => {
    const reserved = reservation.quantityReserved || 0;
    const fulfilled = reservation.quantityFulfilled || 0;
    if (reserved === 0) return 0;
    return Math.round((fulfilled / reserved) * 100);
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Standardized Filter Bar - Phase 3 Redesign */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search reservations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(RESERVATION_STATUSES).map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Warehouse</InputLabel>
            <Select
              value={warehouseFilter}
              label="Warehouse"
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Show Expired</InputLabel>
            <Select
              value={includeExpired ? 'yes' : 'no'}
              label="Show Expired"
              onChange={(e) => {
                setIncludeExpired(e.target.value === 'yes');
                setPage(0);
              }}
            >
              <MenuItem value="no">No</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
            </Select>
          </FormControl>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Tooltip title="Refresh">
            <span>
              <IconButton
                onClick={loadReservations}
                disabled={loading}
                size="small"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            sx={{
              bgcolor: '#0d9488',
              '&:hover': { bgcolor: '#0f766e' },
              textTransform: 'none',
            }}
          >
            New Reservation
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>Reservation #</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Reserved</TableCell>
              <TableCell align="center">Progress</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No reservations found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation) => {
                const statusInfo = getStatusChip(reservation.status);
                const progress = getFulfillmentProgress(reservation);
                const canFulfill = ['ACTIVE', 'PARTIALLY_FULFILLED'].includes(
                  reservation.status,
                );
                const canCancel = ['ACTIVE', 'PARTIALLY_FULFILLED'].includes(
                  reservation.status,
                );

                return (
                  <TableRow key={reservation.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {reservation.reservationNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {reservation.productName}
                      </Typography>
                      {reservation.productSku && (
                        <Typography variant="caption" color="text.secondary">
                          {reservation.productSku}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{reservation.warehouseName || '-'}</TableCell>
                    <TableCell align="right">
                      {formatQuantity(
                        reservation.quantityReserved,
                        reservation.unit,
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 150 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          color={progress === 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" sx={{ minWidth: 35 }}>
                          {progress}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatQuantity(
                          reservation.quantityFulfilled,
                          reservation.unit,
                        )}{' '}
                        /{' '}
                        {formatQuantity(
                          reservation.quantityReserved,
                          reservation.unit,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(reservation.expiryDate)}</TableCell>
                    <TableCell>{formatDate(reservation.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => onViewReservation?.(reservation)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canFulfill && (
                        <Tooltip title="Fulfill">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenFulfillDialog(reservation)}
                          >
                            <FulfillIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canCancel && (
                        <Tooltip title="Cancel">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenCancelDialog(reservation)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      {/* Fulfill Dialog */}
      <Dialog
        open={fulfillDialog.open}
        onClose={() => setFulfillDialog({ open: false, reservation: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Fulfill Reservation</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Reservation:{' '}
            <strong>{fulfillDialog.reservation?.reservationNumber}</strong>
          </Typography>
          <Typography gutterBottom>
            Product: <strong>{fulfillDialog.reservation?.productName}</strong>
          </Typography>
          <Typography gutterBottom>
            Remaining:{' '}
            <strong>
              {formatQuantity(
                fulfillDialog.reservation?.quantityRemaining,
                fulfillDialog.reservation?.unit,
              )}
            </strong>
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Quantity to Fulfill"
            value={fulfillQuantity}
            onChange={(e) => setFulfillQuantity(e.target.value)}
            inputProps={{
              min: 0,
              max: fulfillDialog.reservation?.quantityRemaining,
              step: 0.01,
            }}
            sx={{ mt: 2 }}
            helperText={`Max: ${fulfillDialog.reservation?.quantityRemaining || 0} ${fulfillDialog.reservation?.unit || 'KG'}`}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFulfillDialog({ open: false, reservation: null })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleFulfill}
            disabled={
              actionLoading ||
              !fulfillQuantity ||
              parseFloat(fulfillQuantity) <= 0
            }
            startIcon={actionLoading && <CircularProgress size={16} />}
          >
            Fulfill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, reservation: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel reservation{' '}
            <strong>{cancelDialog.reservation?.reservationNumber}</strong>?
          </Typography>
          <Typography gutterBottom color="text.secondary">
            This will release{' '}
            {formatQuantity(
              cancelDialog.reservation?.quantityRemaining,
              cancelDialog.reservation?.unit,
            )}{' '}
            of reserved stock.
          </Typography>
          <TextField
            fullWidth
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 2 }}
            placeholder="Optional: Enter reason for cancellation..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCancelDialog({ open: false, reservation: null })}
            disabled={actionLoading}
          >
            No, Go Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={actionLoading}
            startIcon={actionLoading && <CircularProgress size={16} />}
          >
            Yes, Cancel Reservation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationList;
