import React, { useState, useEffect } from "react";
import { Edit, Eye, Download, Trash2, Search, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { createCompany } from "../types";
import { invoiceService } from "../services/invoiceService";

// Styled Components
const InvoiceListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
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
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  const company = createCompany();

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
      } else {
        // Fallback for non-paginated response
        setInvoices(response);
        setPagination(null);
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
      <InvoiceListPaper sx={{ p: 3 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
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
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid xs={12} sm={6} md={3}>
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
          </Grid>
          <Grid xs={12} sm={6} md={3}>
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
          </Grid>
          <Grid xs={12} sm={6} md={3}>
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
          </Grid>
          <Grid xs={12} sm={6} md={3}>
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
          </Grid>
        </Grid>

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
    </InvoiceListContainer>
  );
};

export default InvoiceList;
