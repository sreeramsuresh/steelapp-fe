import React, { useState, useEffect } from "react";
import { Eye, Navigation, Package, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
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
  Tabs,
  Tab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";

const TransitListContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  background: theme.palette.background.default,
  minHeight: "calc(100vh - 64px)",
  overflow: "auto",
}));

const TransitListPaper = styled(Paper)(({ theme }) => ({
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

const TransitList = () => {
  const navigate = useNavigate();
  const [transitItems, setTransitItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "default", label: "DRAFT" },
      pending: { color: "info", label: "PENDING" },
      confirmed: { color: "warning", label: "CONFIRMED" },
      received: { color: "success", label: "RECEIVED" },
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

  const getStockStatusBadge = (stockStatus) => {
    const statusConfig = {
      retain: { color: "success", label: "RETAIN" },
      transit: { color: "warning", label: "TRANSIT" },
    };

    const config = statusConfig[stockStatus] || statusConfig.retain;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={<Navigation size={12} />}
        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
      />
    );
  };

  // Fetch Purchase Orders with Transit status
  const fetchTransitPurchaseOrders = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/purchase-orders?stock_status=transit`);
      
      if (response.ok) {
        const data = await response.json();
        setTransitItems(data.purchase_orders || data || []);
      } else {
        console.error('Failed to fetch transit purchase orders');
        setTransitItems([]);
      }
    } catch (error) {
      console.error('Error fetching transit purchase orders:', error);
      setTransitItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitPurchaseOrders();
  }, []);

  const filteredItems = transitItems.filter(item => {
    const matchesSearch = (item.po_number && item.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.supplier_name && item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <TransitListContainer>
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
            Loading transit items...
          </Typography>
        </Box>
      </TransitListContainer>
    );
  }

  if (transitItems.length === 0 && !loading) {
    return (
      <TransitListContainer>
        <EmptyStateContainer>
          <Navigation size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography
            variant="h4"
            component="h2"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            No Transit Purchase Orders
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Purchase orders with "Transit" stock status will appear here
          </Typography>
        </EmptyStateContainer>
      </TransitListContainer>
    );
  }

  return (
    <TransitListContainer>
      <TransitListPaper sx={{ p: { xs: 0, sm: 3 }, mx: { xs: 0, sm: 0 }, borderRadius: { xs: 0, sm: 2 } }}>
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
              🚛 Transit Purchase Orders
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Purchase orders marked as Transit - not yet added to stock
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          <StatsCard>
            <CardContent sx={{ py: 2 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 700, color: "warning.main" }}
              >
                {transitItems.filter(item => item.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </StatsCard>
          <StatsCard>
            <CardContent sx={{ py: 2 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 700, color: "info.main" }}
              >
                {transitItems.filter(item => item.status === 'confirmed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed
              </Typography>
            </CardContent>
          </StatsCard>
          <StatsCard>
            <CardContent sx={{ py: 2 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 700, color: "error.main" }}
              >
                {transitItems.filter(item => item.status === 'draft').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Draft
              </Typography>
            </CardContent>
          </StatsCard>
          <StatsCard>
            <CardContent sx={{ py: 2 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 700, color: "success.main" }}
              >
                {formatCurrency(transitItems.reduce((sum, item) => sum + (item.total || 0), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </StatsCard>
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
            placeholder="Search by PO number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Navigation size={20} />
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
            </Select>
          </FormControl>
        </Box>

        {/* Transit Items Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>PO Date</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Stock Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      {item.po_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.supplier_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.supplier_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.po_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.expected_delivery_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.total)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{getStockStatusBadge(item.stock_status)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      title="Edit Purchase Order"
                      color="info"
                      onClick={() => {
                        navigate(`/purchase-orders/${item.id}/edit`);
                      }}
                    >
                      <Eye size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TransitListPaper>
    </TransitListContainer>
  );
};

export default TransitList;