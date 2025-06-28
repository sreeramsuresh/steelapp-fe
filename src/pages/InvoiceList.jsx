import React, { useState, useEffect } from "react";
import { Edit, Eye, Download, Trash2, Search, FileDown, Truck, Link as LinkIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { createCompany } from "../types";
import { invoiceService } from "../services/invoiceService";
import { deliveryNotesAPI } from "../services/api";

// Styled Components
const InvoiceListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  background: theme.palette.background.default,
  minHeight: "calc(100vh - 64px)",
  overflow: "auto",
}));

const InvoiceListPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  overflow: "hidden",
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  textAlign: "center",
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(6),
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const InvoiceList = ({ defaultStatusFilter = "all" }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [poFormData, setPoFormData] = useState({
    purchaseOrderNumber: '',
    purchaseOrderDate: '',
    adjustmentNotes: ''
  });
  const [poLoading, setPOLoading] = useState(false);
  const [deliveryNoteStatus, setDeliveryNoteStatus] = useState({});

  const company = createCompany();

  // Fetch delivery note status for invoices
  const fetchDeliveryNoteStatus = async (invoices) => {
    const statusMap = {};
    
    for (const invoice of invoices) {
      try {
        const response = await deliveryNotesAPI.getAll({ invoice_id: invoice.id, limit: 1 });
        const hasDeliveryNotes = response.delivery_notes && response.delivery_notes.length > 0;
        statusMap[invoice.id] = {
          hasNotes: hasDeliveryNotes,
          count: response.delivery_notes ? response.delivery_notes.length : 0
        };
      } catch (error) {
        console.error(`Error fetching delivery notes for invoice ${invoice.id}:`, error);
        statusMap[invoice.id] = { hasNotes: false, count: 0 };
      }
    }
    
    setDeliveryNoteStatus(statusMap);
  };

  // Fetch invoices with pagination
  const fetchInvoices = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        ...params,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key]
      );

      const response = await invoiceService.getInvoices(queryParams);

      if (response.invoices) {
        setInvoices(response.invoices);
        setPagination(response.pagination);
        
        // Fetch delivery note status for each invoice
        fetchDeliveryNoteStatus(response.invoices);
      } else {
        // Fallback for non-paginated response
        setInvoices(response);
        setPagination(null);
        
        // Fetch delivery note status for each invoice
        fetchDeliveryNoteStatus(response);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices when component mounts or dependencies change
  useEffect(() => {
    fetchInvoices();
  }, [currentPage, pageSize]);

  // Debounced search and filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchInvoices();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status = "draft") => {
    const statusConfig = {
      draft: { color: "default", label: "DRAFT" },
      sent: { color: "info", label: "SENT" },
      paid: { color: "success", label: "PAID" },
      overdue: { color: "error", label: "OVERDUE" },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
      />
    );
  };

  const getTotalAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const handleDownloadPDF = async (invoice) => {
    if (downloadingIds.has(invoice.id)) return;

    setDownloadingIds((prev) => new Set(prev).add(invoice.id));

    try {
      await generateInvoicePDF(invoice, company);
    } catch (error) {
      alert(error.message);
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleBulkDownload = async () => {
    if (invoices.length === 0) return;

    const confirmed = window.confirm(
      `Download PDFs for all ${invoices.length} invoices on this page?`
    );
    if (!confirmed) return;

    for (const invoice of invoices) {
      try {
        await generateInvoicePDF(invoice, company);
        // Add a small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${invoice.invoiceNumber}:`, error);
      }
    }

    alert(`Downloaded ${invoices.length} invoice PDFs`);
  };

  const handleCreateDeliveryNote = async (invoice) => {
    try {
      // Create delivery note by calling the API to generate one for this invoice
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/invoices/${invoice.id}/generate-delivery-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create delivery note');
      }

      alert('Delivery note created successfully!');
      
      // Refresh the delivery note status
      fetchDeliveryNoteStatus([invoice]);
    } catch (error) {
      console.error('Error creating delivery note:', error);
      alert(error.message || 'Failed to create delivery note');
    }
  };


  // Purchase Order functions
  const handleOpenPODialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPoFormData({
      purchaseOrderNumber: invoice.purchaseOrderNumber || '',
      purchaseOrderDate: invoice.purchaseOrderDate || '',
      adjustmentNotes: ''
    });
    setPoDialogOpen(true);
  };

  const handleClosePODialog = () => {
    setPoDialogOpen(false);
    setSelectedInvoice(null);
    setPoFormData({
      purchaseOrderNumber: '',
      purchaseOrderDate: '',
      adjustmentNotes: ''
    });
  };

  const handlePOReconciliation = async () => {
    if (!selectedInvoice) return;

    try {
      setPOLoading(true);
      
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/reconcile-po`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchase_order_number: poFormData.purchaseOrderNumber,
          purchase_order_date: poFormData.purchaseOrderDate,
          adjustment_notes: poFormData.adjustmentNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reconcile invoice with purchase order');
      }

      // Refresh the invoice list
      await fetchInvoices();
      handleClosePODialog();
      
      alert('Invoice successfully reconciled with purchase order!');
    } catch (error) {
      console.error('Error reconciling PO:', error);
      alert('Failed to reconcile purchase order');
    } finally {
      setPOLoading(false);
    }
  };

  const getPOStatus = (invoice) => {
    if (invoice.purchaseOrderNumber) {
      return (
        <Chip 
          label="Linked" 
          color="success" 
          size="small" 
          icon={<LinkIcon size={14} />}
        />
      );
    } else {
      return (
        <Chip 
          label="No PO" 
          color="warning" 
          size="small" 
          variant="outlined"
        />
      );
    }
  };

  if (loading) {
    return (
      <InvoiceListContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading invoices...
          </Typography>
        </Box>
      </InvoiceListContainer>
    );
  }

  if (invoices.length === 0 && !loading) {
    return (
      <InvoiceListContainer>
        <EmptyStateContainer>
          <Typography
            variant="h4"
            component="h2"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            📄 No Invoices Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || statusFilter !== "all"
              ? "No invoices match your search criteria"
              : "Create your first invoice to get started"}
          </Typography>
          <Button
            component={Link}
            to="/create-invoice"
            variant="contained"
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Create Invoice
          </Button>
        </EmptyStateContainer>
      </InvoiceListContainer>
    );
  }

  return (
    <InvoiceListContainer>
      <InvoiceListPaper sx={{ p: { xs: 0, sm: 3 }, mx: { xs: 0, sm: 0 }, borderRadius: { xs: 0, sm: 2 } }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: { xs: 1, sm: 3 },
            px: { xs: 2, sm: 0 },
            pt: { xs: 2, sm: 0 },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 600, mb: 1 }}
            >
              📄 All Invoices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all your invoices
            </Typography>
          </Box>
          {invoices.length > 0 && (
            <Button
              onClick={handleBulkDownload}
              variant="outlined"
              startIcon={<FileDown size={18} />}
              sx={{ borderRadius: 2 }}
            >
              Download Page PDFs
            </Button>
          )}
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          <Box>
            <StatsCard>
              <CardContent sx={{ py: 2 }}>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {pagination ? pagination.total : invoices.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Invoices
                </Typography>
              </CardContent>
            </StatsCard>
          </Box>
          <Box>
            <StatsCard>
              <CardContent sx={{ py: 2 }}>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 700, color: "success.main" }}
                >
                  {formatCurrency(getTotalAmount())}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Page Value
                </Typography>
              </CardContent>
            </StatsCard>
          </Box>
          <Box>
            <StatsCard>
              <CardContent sx={{ py: 2 }}>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 700, color: "info.main" }}
                >
                  {pagination ? pagination.current_page : 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Page
                </Typography>
              </CardContent>
            </StatsCard>
          </Box>
          <Box>
            <StatsCard>
              <CardContent sx={{ py: 2 }}>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 700, color: "warning.main" }}
                >
                  {pagination ? pagination.total_pages : 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Pages
                </Typography>
              </CardContent>
            </StatsCard>
          </Box>
        </Box>

        {/* Filters Section */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Per Page</InputLabel>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              label="Per Page"
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Invoices Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>PO Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {invoice.customer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.customer.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(invoice.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(invoice.total)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPOStatus(invoice)}
                      {!invoice.purchaseOrderNumber && (
                        <IconButton
                          size="small"
                          title="Link Purchase Order"
                          color="primary"
                          onClick={() => handleOpenPODialog(invoice)}
                        >
                          <LinkIcon size={14} />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        component={Link}
                        to={`/edit/${invoice.id}`}
                        size="small"
                        title="Edit Invoice"
                        color="primary"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="View Invoice"
                        color="info"
                        onClick={() => {
                          /* TODO: Implement view */
                        }}
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Download PDF"
                        color="success"
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={downloadingIds.has(invoice.id)}
                      >
                        {downloadingIds.has(invoice.id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Download size={16} />
                        )}
                      </IconButton>
                      {invoice.status === 'paid' && (
                        <IconButton
                          size="small"
                          title={
                            deliveryNoteStatus[invoice.id]?.hasNotes 
                              ? `View Delivery Notes (${deliveryNoteStatus[invoice.id]?.count})` 
                              : "Create delivery note"
                          }
                          color={deliveryNoteStatus[invoice.id]?.hasNotes ? "warning" : "success"}
                          onClick={() => 
                            deliveryNoteStatus[invoice.id]?.hasNotes 
                              ? navigate(`/delivery-notes?invoice_id=${invoice.id}`)
                              : handleCreateDeliveryNote(invoice)
                          }
                        >
                          <Truck size={16} />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        title="Delete Invoice"
                        color="error"
                        onClick={() => {
                          /* TODO: Implement delete */
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 3,
              pt: 2,
              borderTop: `1px solid`,
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}{" "}
              to{" "}
              {Math.min(
                pagination.current_page * pagination.per_page,
                pagination.total
              )}{" "}
              of {pagination.total} invoices
            </Typography>
            <Stack spacing={2} direction="row" alignItems="center">
              <Pagination
                count={pagination.total_pages}
                page={pagination.current_page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Stack>
          </Box>
        )}
      </InvoiceListPaper>

      {/* Purchase Order Reconciliation Dialog */}
      <Dialog
        open={poDialogOpen}
        onClose={handleClosePODialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Link Purchase Order
          {selectedInvoice && (
            <Typography variant="body2" color="text.secondary">
              Invoice: {selectedInvoice.invoiceNumber}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info">
              Link this invoice to a purchase order. This will update inventory tracking and provide better reconciliation.
            </Alert>
            
            <TextField
              label="Purchase Order Number"
              value={poFormData.purchaseOrderNumber}
              onChange={(e) => setPoFormData(prev => ({
                ...prev,
                purchaseOrderNumber: e.target.value
              }))}
              fullWidth
              required
              placeholder="PO-2024-001"
            />
            
            <TextField
              label="Purchase Order Date"
              type="date"
              value={poFormData.purchaseOrderDate}
              onChange={(e) => setPoFormData(prev => ({
                ...prev,
                purchaseOrderDate: e.target.value
              }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Adjustment Notes"
              value={poFormData.adjustmentNotes}
              onChange={(e) => setPoFormData(prev => ({
                ...prev,
                adjustmentNotes: e.target.value
              }))}
              fullWidth
              multiline
              rows={3}
              placeholder="Optional notes about the reconciliation..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePODialog}>
            Cancel
          </Button>
          <Button
            onClick={handlePOReconciliation}
            variant="contained"
            disabled={!poFormData.purchaseOrderNumber || poLoading}
            startIcon={poLoading ? <CircularProgress size={16} /> : <LinkIcon size={16} />}
          >
            {poLoading ? 'Linking...' : 'Link Purchase Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </InvoiceListContainer>
  );
};

export default InvoiceList;
