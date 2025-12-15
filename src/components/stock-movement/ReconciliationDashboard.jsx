/**
 * ReconciliationDashboard Component
 * Phase 7: Reporting & Reconciliation
 *
 * Dashboard for stock reconciliation and audit trail
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
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  History as AuditIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
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
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

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
  const handleAuditPageChange = (event, newPage) => {
    setAuditPage(newPage);
  };

  // Handle audit rows per page change
  const handleAuditRowsPerPageChange = (event) => {
    setAuditRowsPerPage(parseInt(event.target.value, 10));
    setAuditPage(0);
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
          <ReportIcon fontSize="large" color="primary" />
          <Typography variant="h5">Stock Reconciliation & Audit</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab
            icon={<ReportIcon />}
            label="Reconciliation Report"
            iconPosition="start"
          />
          <Tab icon={<AuditIcon />} label="Audit Trail" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Reconciliation Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Warehouse Selection */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 250 }} disabled={loadingWarehouses}>
            <InputLabel>Select Warehouse</InputLabel>
            <Select
              value={selectedWarehouseId}
              label="Select Warehouse"
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
            >
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadReconciliation}
            disabled={loadingReconciliation || !selectedWarehouseId}
          >
            Refresh
          </Button>
        </Box>

        {/* Error Alert */}
        {reconciliationError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setReconciliationError(null)}
          >
            {reconciliationError}
          </Alert>
        )}

        {/* Loading */}
        {loadingReconciliation ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : reconciliationData ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Warehouse
                    </Typography>
                    <Typography variant="h6">
                      {reconciliationData.warehouseName}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Products
                    </Typography>
                    <Typography variant="h6">
                      {reconciliationData.items?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Quantity
                    </Typography>
                    <Typography variant="h6">
                      {formatQuantity(reconciliationData.totalSystemValue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    bgcolor:
                      reconciliationData.discrepancyCount > 0
                        ? 'warning.light'
                        : 'success.light',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Discrepancies
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {reconciliationData.discrepancyCount > 0 ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <CheckIcon color="success" />
                      )}
                      <Typography variant="h6">
                        {reconciliationData.discrepancyCount}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Items Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">System Qty</TableCell>
                    <TableCell align="right">Last Count</TableCell>
                    <TableCell align="right">Discrepancy</TableCell>
                    <TableCell>Last Count Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reconciliationData.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No inventory items found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reconciliationData.items.map((item, idx) => {
                      const discrepancy = parseFloat(item.discrepancy) || 0;
                      const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

                      return (
                        <TableRow
                          key={idx}
                          hover
                          sx={{
                            bgcolor: hasDiscrepancy
                              ? 'warning.light'
                              : 'inherit',
                          }}
                        >
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.productSku || '-'}</TableCell>
                          <TableCell align="right">
                            {formatQuantity(item.systemQuantity)}
                          </TableCell>
                          <TableCell align="right">
                            {formatQuantity(item.lastPhysicalCount)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              color={hasDiscrepancy ? 'error' : 'success.main'}
                              fontWeight={hasDiscrepancy ? 'bold' : 'normal'}
                            >
                              {formatQuantity(discrepancy)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(item.lastCountDate)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={hasDiscrepancy ? 'Discrepancy' : 'OK'}
                              color={hasDiscrepancy ? 'warning' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Alert severity="info">
            Select a warehouse to view the reconciliation report.
          </Alert>
        )}
      </TabPanel>

      {/* Audit Trail Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Warehouse</InputLabel>
              <Select
                value={selectedWarehouseId}
                label="Warehouse"
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setAuditPage(0);
                }}
              >
                <MenuItem value="">All Warehouses</MenuItem>
                {warehouses.map((wh) => (
                  <MenuItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Start Date"
              value={auditStartDate}
              onChange={(e) => {
                setAuditStartDate(e.target.value);
                setAuditPage(0);
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="End Date"
              value={auditEndDate}
              onChange={(e) => {
                setAuditEndDate(e.target.value);
                setAuditPage(0);
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <Button
              startIcon={<RefreshIcon />}
              onClick={loadAuditTrail}
              disabled={loadingAudit}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {/* Error Alert */}
        {auditError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setAuditError(null)}
          >
            {auditError}
          </Alert>
        )}

        {/* Audit Trail Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell align="right">Before</TableCell>
                <TableCell align="right">After</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>User</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingAudit ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : auditEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No audit entries found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditEntries.map((entry) => {
                  const change = parseFloat(entry.quantityChange) || 0;
                  const isIncrease =
                    change > 0 ||
                    ['IN', 'TRANSFER_IN', 'RELEASE'].includes(entry.action);

                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>{formatDate(entry.timestamp)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={entry.action}
                          color={isIncrease ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entry.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.warehouseName || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={isIncrease ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {isIncrease ? '+' : '-'}
                          {formatQuantity(Math.abs(change))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatQuantity(entry.balanceBefore)}
                      </TableCell>
                      <TableCell align="right">
                        {formatQuantity(entry.balanceAfter)}
                      </TableCell>
                      <TableCell>
                        {entry.referenceNumber || entry.referenceType || '-'}
                      </TableCell>
                      <TableCell>{entry.userName || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={auditTotalCount}
            page={auditPage}
            onPageChange={handleAuditPageChange}
            rowsPerPage={auditRowsPerPage}
            onRowsPerPageChange={handleAuditRowsPerPageChange}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </TableContainer>
      </TabPanel>
    </Box>
  );
};

export default ReconciliationDashboard;
