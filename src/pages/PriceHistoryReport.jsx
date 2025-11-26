import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import pricelistService from '../services/pricelistService';
import { productService } from '../services/dataService';
import { toast } from 'react-toastify';
import { toUAETime } from '../utils/timezone';

export default function PriceHistoryReport() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [pricelists, setPricelists] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchPricelists();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchPricelists = async () => {
    try {
      const response = await pricelistService.getAll();
      setPricelists(response.data || []);
    } catch (error) {
      console.error('Error fetching pricelists:', error);
      toast.error('Failed to load price lists');
    }
  };

  const fetchPriceHistory = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    try {
      setLoading(true);
      const history = [];

      // Get price from each pricelist
      for (const pricelist of pricelists) {
        const items = await pricelistService.getItems(pricelist.id);
        const item = items.data?.find(i => i.productId === parseInt(selectedProduct));

        if (item) {
          history.push({
            pricelistId: pricelist.id,
            pricelistName: pricelist.name,
            effectiveFrom: pricelist.effectiveFrom,
            effectiveTo: pricelist.effectiveTo,
            price: item.sellingPrice,
            isActive: pricelist.isActive,
            isDefault: pricelist.isDefault,
          });
        }
      }

      // Sort by effective date
      history.sort((a, b) => {
        if (!a.effectiveFrom) return 1;
        if (!b.effectiveFrom) return -1;
        return new Date(b.effectiveFrom) - new Date(a.effectiveFrom);
      });

      setPriceHistory(history);

    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const getPriceDiff = (index) => {
    if (index === priceHistory.length - 1) return null;

    const current = priceHistory[index].price;
    const previous = priceHistory[index + 1].price;

    const diff = current - previous;
    const diffPercent = ((diff / previous) * 100).toFixed(1);

    return { diff, diffPercent };
  };

  const selectedProductData = products.find(p => p.id === parseInt(selectedProduct));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Price History Report
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Select Product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              sx={{ minWidth: 300 }}
            >
              <MenuItem value="">-- Select Product --</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.displayName || product.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={fetchPriceHistory}
              disabled={loading || !selectedProduct}
            >
              View History
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {selectedProductData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">
                  Product Name
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedProductData.displayName || selectedProductData.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {selectedProductData.category}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">
                  Grade
                </Typography>
                <Typography variant="body1">
                  {selectedProductData.grade}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">
                  Current Price
                </Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">
                  AED {selectedProductData.sellingPrice?.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : priceHistory.length === 0 && selectedProduct ? (
        <Alert severity="info">
          No price history found for the selected product.
        </Alert>
      ) : priceHistory.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Price List</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priceHistory.map((row, index) => {
                const priceDiff = getPriceDiff(index);

                return (
                  <TableRow key={row.pricelistId}>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="body2">{row.pricelistName}</Typography>
                        {row.isDefault && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {row.effectiveFrom
                        ? toUAETime(row.effectiveFrom, { format: 'date' })
                        : 'No date'}
                      {row.effectiveTo && ` - ${toUAETime(row.effectiveTo, { format: 'date' })}`}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        AED {row.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {priceDiff ? (
                        <Chip
                          label={`${priceDiff.diff >= 0 ? '+' : ''}${priceDiff.diffPercent}%`}
                          size="small"
                          color={priceDiff.diff >= 0 ? 'success' : 'error'}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Chip label="Active" size="small" color="success" variant="outlined" />
                      ) : (
                        <Chip label="Inactive" size="small" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Box>
  );
}
