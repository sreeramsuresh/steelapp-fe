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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";

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

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    setLoading(false);
    setPurchaseOrders([]);
  }, []);

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
      </PurchaseOrderListPaper>
    </PurchaseOrderListContainer>
  );
};

export default PurchaseOrderList;