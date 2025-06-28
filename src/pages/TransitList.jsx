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
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState(0);

  const getStatusBadge = (status) => {
    const statusConfig = {
      dispatched: { color: "info", label: "DISPATCHED" },
      in_transit: { color: "warning", label: "IN TRANSIT" },
      delivered: { color: "success", label: "DELIVERED" },
      delayed: { color: "error", label: "DELAYED" },
    };

    const config = statusConfig[status] || statusConfig.dispatched;

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

  const getTransitTypeBadge = (type) => {
    const typeConfig = {
      purchase_order: { color: "primary", label: "PURCHASE ORDER", icon: Package },
      invoice: { color: "secondary", label: "INVOICE", icon: FileText },
    };

    const config = typeConfig[type] || typeConfig.invoice;
    const Icon = config.icon;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={<Icon size={12} />}
        sx={{ fontWeight: 600, fontSize: "0.75rem" }}
      />
    );
  };

  // Mock data for demonstration
  const mockTransitData = [
    {
      id: 1,
      type: 'invoice',
      reference_number: 'INV-0001',
      description: 'Steel Rods delivery to ABC Construction',
      dispatch_date: '2024-01-15',
      expected_delivery: '2024-01-18',
      actual_delivery: null,
      status: 'in_transit',
      destination: 'Mumbai, Maharashtra',
      tracking_number: 'TRK-2024-001',
      value: 150000,
      items_count: 3
    },
    {
      id: 2,
      type: 'purchase_order',
      reference_number: 'PO-0001',
      description: 'Raw materials from XYZ Suppliers',
      dispatch_date: '2024-01-14',
      expected_delivery: '2024-01-17',
      actual_delivery: null,
      status: 'dispatched',
      destination: 'Delhi, India',
      tracking_number: 'TRK-2024-002',
      value: 75000,
      items_count: 5
    }
  ];

  useEffect(() => {
    setLoading(false);
    setTransitItems(mockTransitData);
  }, []);

  const filteredItems = transitItems.filter(item => {
    const matchesSearch = item.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
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
            No Items in Transit
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Items will appear here when they are dispatched but not yet received
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
              🚛 Transit Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track goods in transit - dispatched but not yet received
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
                {transitItems.filter(item => item.status === 'in_transit').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Transit
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
                {transitItems.filter(item => item.status === 'dispatched').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dispatched
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
                {transitItems.filter(item => item.status === 'delayed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Delayed
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
                {formatCurrency(transitItems.reduce((sum, item) => sum + item.value, 0))}
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
            placeholder="Search by reference or description..."
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
            <InputLabel>Type Filter</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type Filter"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="invoice">Invoices</MenuItem>
              <MenuItem value="purchase_order">Purchase Orders</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Transit Items Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Dispatch Date</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Status</TableCell>
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
                      {item.reference_number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.tracking_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getTransitTypeBadge(item.type)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.items_count} items
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.dispatch_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.expected_delivery)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.destination}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.value)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      title="View Details"
                      color="info"
                      onClick={() => {
                        // Navigate to appropriate detail page based on type
                        const path = item.type === 'invoice' 
                          ? `/invoices/${item.id}` 
                          : `/purchase-orders/${item.id}`;
                        navigate(path);
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