import React, { useState, useEffect } from "react";
import { Edit, Eye, Download, Trash2, Search, Plus, ShoppingCart } from "lucide-react";
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
  Pagination,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { purchaseOrdersAPI } from "../services/api";

const PurchaseOrderListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  background: theme.palette.background.default,
  minHeight: "calc(100vh - 64px)",
  overflow: "auto",
}));

const PurchaseOrderListPaper = styled(Paper)(({ theme }) => ({
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

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getStatusBadge = (status = "draft") => {
    const statusConfig = {
      draft: { color: "default", label: "DRAFT" },
      pending: { color: "warning", label: "PENDING" },
      confirmed: { color: "info", label: "CONFIRMED" },
      received: { color: "success", label: "RECEIVED" },
      cancelled: { color: "error", label: "CANCELLED" },
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

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await purchaseOrdersAPI.getAll(params);
      setPurchaseOrders(response.data || []);
      setTotalPages(Math.ceil((response.total || 0) / 10));
    } catch (err) {
      setError('Failed to fetch purchase orders');
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [page, searchTerm, statusFilter]);

  const handleDownloadPDF = async (id) => {
    try {
      await purchaseOrdersAPI.downloadPDF(id);
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchaseOrdersAPI.delete(id);
        setSuccess('Purchase order deleted successfully');
        fetchPurchaseOrders();
      } catch (err) {
        setError('Failed to delete purchase order');
      }
    }
  };

  if (loading) {
    return (
      <PurchaseOrderListContainer>
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
            Loading purchase orders...
          </Typography>
        </Box>
      </PurchaseOrderListContainer>
    );
  }

  if (purchaseOrders.length === 0 && !loading) {
    return (
      <PurchaseOrderListContainer>
        <EmptyStateContainer>
          <ShoppingCart size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography
            variant="h4"
            component="h2"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            No Purchase Orders Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first purchase order to start tracking procurement
          </Typography>
          <Button
            component={Link}
            to="/purchase-orders/new"
            variant="contained"
            size="large"
            startIcon={<Plus size={20} />}
            sx={{ borderRadius: 2 }}
          >
            Create Purchase Order
          </Button>
        </EmptyStateContainer>
      </PurchaseOrderListContainer>
    );
  }

  return (
    <PurchaseOrderListContainer>
      <PurchaseOrderListPaper sx={{ p: { xs: 0, sm: 3 }, mx: { xs: 0, sm: 0 }, borderRadius: { xs: 0, sm: 2 } }}>
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
              🛒 Purchase Orders
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all your purchase orders
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/purchase-orders/new"
            variant="contained"
            startIcon={<Plus size={18} />}
            sx={{ borderRadius: 2 }}
          >
            Create PO
          </Button>
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
            placeholder="Search purchase orders..."
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
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Purchase Orders Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {po.po_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{po.supplier_name}</TableCell>
                    <TableCell>{formatDate(po.po_date)}</TableCell>
                    <TableCell>{po.items?.length || 0} items</TableCell>
                    <TableCell>
                      {formatCurrency(
                        po.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          title="View"
                        >
                          <Eye size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(po.id)}
                          title="Download PDF"
                          color="primary"
                        >
                          <Download size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(po.id)}
                          title="Delete"
                          color="error"
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </PurchaseOrderListPaper>

      {/* Snackbar for notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </PurchaseOrderListContainer>
  );
};

export default PurchaseOrderList;