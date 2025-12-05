/**
 * TransferList Component
 * Phase 5: Inter-Warehouse Transfers
 * Phase 3 Redesign: Standardized filter bar with search input
 *
 * Lists all stock transfers with filtering and actions
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
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  LocalShipping as ShipIcon,
  Inventory as ReceiveIcon,
  Cancel as CancelIcon,
  SwapHoriz as TransferIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { stockMovementService, TRANSFER_STATUSES } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';

/**
 * Format date for display
 */
const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  const date = typeof dateValue === 'object' && dateValue.seconds
    ? new Date(dateValue.seconds * 1000)
    : new Date(dateValue);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get status chip props
 */
const getStatusChip = (status) => {
  const statusInfo = TRANSFER_STATUSES[status] || { label: status, color: 'default' };
  return statusInfo;
};

const TransferList = ({ onCreateNew, onViewTransfer }) => {
  const [transfers, setTransfers] = useState([]);
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
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState('');
  const [destWarehouseFilter, setDestWarehouseFilter] = useState('');

  // Action dialogs
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, transfer: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Load warehouses for filter dropdowns
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

  // Load transfers
  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await stockMovementService.listTransfers({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        sourceWarehouseId: sourceWarehouseFilter || undefined,
        destinationWarehouseId: destWarehouseFilter || undefined,
        search: searchQuery || undefined,
      });

      // Client-side search filter if API doesn&apos;t support it
      let filteredData = result.data || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(t =>
          (t.transferNumber && t.transferNumber.toLowerCase().includes(query)) ||
          (t.sourceWarehouseName && t.sourceWarehouseName.toLowerCase().includes(query)) ||
          (t.destinationWarehouseName && t.destinationWarehouseName.toLowerCase().includes(query)) ||
          (t.notes && t.notes.toLowerCase().includes(query)),
        );
      }

      setTransfers(filteredData);
      setTotalCount(result.pagination?.totalItems || filteredData.length || 0);
    } catch (err) {
      console.error('Error loading transfers:', err);
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, sourceWarehouseFilter, destWarehouseFilter, searchQuery]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle ship action
  const handleShip = async () => {
    if (!actionDialog.transfer) return;

    try {
      setActionLoading(true);
      await stockMovementService.shipTransfer(actionDialog.transfer.id);
      setActionDialog({ open: false, type: null, transfer: null });
      loadTransfers();
    } catch (err) {
      console.error('Error shipping transfer:', err);
      setError(err.message || 'Failed to ship transfer');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle receive action
  const handleReceive = async () => {
    if (!actionDialog.transfer) return;

    try {
      setActionLoading(true);
      await stockMovementService.receiveTransfer(actionDialog.transfer.id);
      setActionDialog({ open: false, type: null, transfer: null });
      loadTransfers();
    } catch (err) {
      console.error('Error receiving transfer:', err);
      setError(err.message || 'Failed to receive transfer');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = async () => {
    if (!actionDialog.transfer) return;

    try {
      setActionLoading(true);
      await stockMovementService.cancelTransfer(actionDialog.transfer.id);
      setActionDialog({ open: false, type: null, transfer: null });
      loadTransfers();
    } catch (err) {
      console.error('Error cancelling transfer:', err);
      setError(err.message || 'Failed to cancel transfer');
    } finally {
      setActionLoading(false);
    }
  };

  // Get available actions for a transfer
  const getAvailableActions = (transfer) => {
    const actions = [];

    actions.push({ type: 'view', label: 'View', icon: <ViewIcon /> });

    if (transfer.status === 'DRAFT' || transfer.status === 'PENDING') {
      actions.push({ type: 'ship', label: 'Ship', icon: <ShipIcon /> });
      actions.push({ type: 'cancel', label: 'Cancel', icon: <CancelIcon /> });
    }

    if (transfer.status === 'SHIPPED' || transfer.status === 'IN_TRANSIT') {
      actions.push({ type: 'receive', label: 'Receive', icon: <ReceiveIcon /> });
      actions.push({ type: 'cancel', label: 'Cancel', icon: <CancelIcon /> });
    }

    return actions;
  };

  // Handle action click
  const handleActionClick = (type, transfer) => {
    if (type === 'view') {
      onViewTransfer?.(transfer);
      return;
    }

    setActionDialog({ open: true, type, transfer });
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search transfers..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
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
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(TRANSFER_STATUSES).map(status => (
                <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={sourceWarehouseFilter}
              label="Source"
              onChange={(e) => { setSourceWarehouseFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {warehouses.map(wh => (
                <MenuItem key={wh.id} value={wh.id}>{wh.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Destination</InputLabel>
            <Select
              value={destWarehouseFilter}
              label="Destination"
              onChange={(e) => { setDestWarehouseFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {warehouses.map(wh => (
                <MenuItem key={wh.id} value={wh.id}>{wh.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Tooltip title="Refresh">
            <IconButton
              onClick={loadTransfers}
              disabled={loading}
              size="small"
              sx={{ border: 1, borderColor: 'divider' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
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
            New Transfer
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>Transfer #</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Shipped</TableCell>
              <TableCell>Received</TableCell>
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
            ) : transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No transfers found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((transfer) => {
                const statusInfo = getStatusChip(transfer.status);
                const actions = getAvailableActions(transfer);

                return (
                  <TableRow key={transfer.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transfer.transferNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{transfer.sourceWarehouseName || '-'}</TableCell>
                    <TableCell>{transfer.destinationWarehouseName || '-'}</TableCell>
                    <TableCell>{transfer.items?.length || 0} items</TableCell>
                    <TableCell>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(transfer.createdAt)}</TableCell>
                    <TableCell>{formatDate(transfer.shippedDate)}</TableCell>
                    <TableCell>{formatDate(transfer.receivedDate)}</TableCell>
                    <TableCell align="right">
                      {actions.map((action) => (
                        <Tooltip key={action.type} title={action.label}>
                          <IconButton
                            size="small"
                            onClick={() => handleActionClick(action.type, transfer)}
                          >
                            {action.icon}
                          </IconButton>
                        </Tooltip>
                      ))}
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

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, type: null, transfer: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.type === 'ship' && 'Ship Transfer'}
          {actionDialog.type === 'receive' && 'Receive Transfer'}
          {actionDialog.type === 'cancel' && 'Cancel Transfer'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.type === 'ship' && (
            <Typography>
              Are you sure you want to ship transfer <strong>{actionDialog.transfer?.transferNumber}</strong>?
              This will deduct stock from the source warehouse.
            </Typography>
          )}
          {actionDialog.type === 'receive' && (
            <Typography>
              Are you sure you want to receive transfer <strong>{actionDialog.transfer?.transferNumber}</strong>?
              This will add stock to the destination warehouse.
            </Typography>
          )}
          {actionDialog.type === 'cancel' && (
            <Typography>
              Are you sure you want to cancel transfer <strong>{actionDialog.transfer?.transferNumber}</strong>?
              {actionDialog.transfer?.status === 'SHIPPED' && ' Stock will be restored to the source warehouse.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setActionDialog({ open: false, type: null, transfer: null })}
            disabled={actionLoading}
          >
            No, Go Back
          </Button>
          <Button
            variant="contained"
            color={actionDialog.type === 'cancel' ? 'error' : 'primary'}
            onClick={() => {
              if (actionDialog.type === 'ship') handleShip();
              else if (actionDialog.type === 'receive') handleReceive();
              else if (actionDialog.type === 'cancel') handleCancel();
            }}
            disabled={actionLoading}
            startIcon={actionLoading && <CircularProgress size={16} />}
          >
            {actionDialog.type === 'ship' && 'Yes, Ship'}
            {actionDialog.type === 'receive' && 'Yes, Receive'}
            {actionDialog.type === 'cancel' && 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransferList;
