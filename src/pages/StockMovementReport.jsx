import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Stack,
  Chip,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Pagination,
  TableFooter,
} from "@mui/material";
import {
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import {
  stockMovementService,
  MOVEMENT_TYPES,
} from "../services/stockMovementService";
import { warehouseService } from "../services/warehouseService";
import { productService } from "../services/dataService";
import { toast } from "react-toastify";
import { toUAETime } from "../utils/timezone";

const PROCUREMENT_CHANNELS = [
  { value: "ALL", label: "All Channels" },
  { value: "LOCAL", label: "Local" },
  { value: "IMPORTED", label: "Imported" },
];

export default function StockMovementReport() {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedMovementTypes, setSelectedMovementTypes] = useState([]);
  const [procurementChannel, setProcurementChannel] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  // Summary
  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netMovement: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getAll();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to load warehouses");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const fetchMovements = async (pageNum = 1) => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setLoading(true);

      const filters = {
        page: pageNum,
        limit,
        dateFrom,
        dateTo,
        warehouseId: selectedWarehouse || undefined,
        productId: selectedProduct || undefined,
        movementType:
          selectedMovementTypes.length > 0
            ? selectedMovementTypes.join(",")
            : undefined,
      };

      const response = await stockMovementService.getAll(filters);

      let filteredMovements = response.data || [];

      // Apply procurement channel filter if needed (client-side for now)
      if (procurementChannel !== "ALL") {
        filteredMovements = filteredMovements.filter((m) => {
          // This would require product procurement info - placeholder logic
          // In reality, you'd add this to the backend filter
          return true;
        });
      }

      setMovements(filteredMovements);
      setPage(pageNum);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalRecords(response.pagination?.totalRecords || 0);

      // Calculate summary
      calculateSummary(filteredMovements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    data.forEach((movement) => {
      const qty = movement.quantity || 0;
      const cost = movement.totalCost || 0;

      if (
        movement.movementType === "IN" ||
        movement.movementType === "TRANSFER_IN"
      ) {
        totalIn += qty;
      } else if (
        movement.movementType === "OUT" ||
        movement.movementType === "TRANSFER_OUT"
      ) {
        totalOut += qty;
      }

      totalValue += cost;
    });

    setSummary({
      totalIn,
      totalOut,
      netMovement: totalIn - totalOut,
      totalValue,
    });
  };

  const handleSearch = () => {
    setPage(1);
    fetchMovements(1);
  };

  const handlePageChange = (event, value) => {
    fetchMovements(value);
  };

  const handleExportCSV = () => {
    if (movements.length === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      // CSV Headers
      const headers = [
        "Date",
        "Product",
        "SKU",
        "Batch #",
        "Type",
        "Quantity",
        "UOM",
        "Unit Cost",
        "Total Cost",
        "Reference",
        "Warehouse",
        "Notes",
      ];

      // CSV Rows
      const rows = movements.map((m) => [
        toUAETime(m.movementDate || m.createdAt, { format: "datetime" }),
        m.productName || m.productDisplayName || "",
        m.productSku || "",
        m.batchNumber || "",
        MOVEMENT_TYPES[m.movementType]?.label || m.movementType,
        m.quantity?.toFixed(2) || "0.00",
        m.unit || "KG",
        m.unitCost?.toFixed(2) || "0.00",
        m.totalCost?.toFixed(2) || "0.00",
        m.referenceNumber || "",
        m.warehouseName || "",
        m.notes || "",
      ]);

      // Build CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `stock-movements-${dateFrom}-to-${dateTo}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
    // Placeholder for PDF export functionality
  };

  const getMovementTypeColor = (type) => {
    return MOVEMENT_TYPES[type]?.color || "default";
  };

  const getMovementTypeLabel = (type) => {
    return MOVEMENT_TYPES[type]?.label || type;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stock Movement Report
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="End Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Warehouse"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                fullWidth
              >
                <MenuItem value="">All Warehouses</MenuItem>
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                fullWidth
              >
                <MenuItem value="">All Products</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.uniqueName ||
                      product.displayName ||
                      product.name ||
                      "N/A"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Movement Type</InputLabel>
                <Select
                  multiple
                  value={selectedMovementTypes}
                  onChange={(e) => setSelectedMovementTypes(e.target.value)}
                  input={<OutlinedInput label="Movement Type" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={getMovementTypeLabel(value)}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(MOVEMENT_TYPES).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Procurement Channel"
                value={procurementChannel}
                onChange={(e) => setProcurementChannel(e.target.value)}
                fullWidth
              >
                {PROCUREMENT_CHANNELS.map((channel) => (
                  <MenuItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ height: "100%", alignItems: "center" }}
              >
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={loading || !dateFrom || !dateTo}
                  fullWidth
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                  disabled={movements.length === 0}
                >
                  CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={handleExportPDF}
                  disabled={movements.length === 0}
                >
                  PDF
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {movements.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Total In
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {summary.totalIn.toFixed(2)} KG
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Total Out
                </Typography>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  {summary.totalOut.toFixed(2)} KG
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Net Movement
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={
                    summary.netMovement >= 0 ? "success.main" : "error.main"
                  }
                >
                  {summary.netMovement >= 0 ? "+" : ""}
                  {summary.netMovement.toFixed(2)} KG
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  Total Value
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  AED {summary.totalValue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Results Section */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : movements.length === 0 && dateFrom && dateTo ? (
        <Alert severity="info">
          No stock movements found for the selected criteria.
        </Alert>
      ) : movements.length > 0 ? (
        <>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Stock Movements</Typography>
                <Typography variant="body2" color="textSecondary">
                  Showing {movements.length} of {totalRecords} records
                </Typography>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Batch #</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Cost</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Warehouse</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {toUAETime(
                              movement.movementDate || movement.createdAt,
                              {
                                format: "date",
                              },
                            )}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {toUAETime(
                              movement.movementDate || movement.createdAt,
                              {
                                format: "time",
                              },
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {movement.productName ||
                              movement.productDisplayName ||
                              "N/A"}
                          </Typography>
                          {movement.productSku && (
                            <Typography variant="caption" color="textSecondary">
                              SKU: {movement.productSku}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {movement.batchNumber || "-"}
                          </Typography>
                          {movement.coilNumber && (
                            <Typography variant="caption" color="textSecondary">
                              Coil: {movement.coilNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getMovementTypeLabel(movement.movementType)}
                            size="small"
                            color={getMovementTypeColor(movement.movementType)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {movement.quantity?.toFixed(2) || "0.00"}{" "}
                            {movement.unit || "KG"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {movement.unitCost
                              ? `AED ${movement.unitCost.toFixed(2)}`
                              : "-"}
                          </Typography>
                          {movement.totalCost && movement.totalCost > 0 && (
                            <Typography variant="caption" color="textSecondary">
                              Total: AED {movement.totalCost.toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {movement.referenceNumber || "-"}
                          </Typography>
                          {movement.referenceType && (
                            <Typography variant="caption" color="textSecondary">
                              {movement.referenceType}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {movement.warehouseName || "N/A"}
                          </Typography>
                          {movement.destinationWarehouseName && (
                            <Typography variant="caption" color="textSecondary">
                              → {movement.destinationWarehouseName}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box display="flex" justifyContent="center" p={1}>
                          <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            showFirstButton
                            showLastButton
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  );
}
