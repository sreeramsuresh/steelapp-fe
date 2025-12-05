import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as IncreaseIcon,
  TrendingDown as DecreaseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import pricelistService from '../services/pricelistService';
import { productService } from '../services/dataService';
import { toast } from 'react-toastify';

export default function PriceListForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get('copy_from');
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    currency: 'AED',
    isActive: true,
    isDefault: false,
    effectiveFrom: '',
    effectiveTo: '',
    items: [],
  });

  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState({
    type: 'increase',
    percentage: 0,
  });

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchPricelist();
    } else if (copyFromId) {
      copyPricelist(copyFromId);
    }
  }, [id, copyFromId]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchPricelist = async () => {
    try {
      setLoading(true);
      const response = await pricelistService.getById(id);
      const pricelist = response.data;

      setFormData({
        name: pricelist.name,
        description: pricelist.description || '',
        currency: pricelist.currency || 'AED',
        isActive: pricelist.isActive,
        isDefault: pricelist.isDefault,
        effectiveFrom: pricelist.effectiveFrom || '',
        effectiveTo: pricelist.effectiveTo || '',
        items: pricelist.items || [],
      });
    } catch (error) {
      console.error('Error fetching pricelist:', error);
      toast.error('Failed to load price list');
    } finally {
      setLoading(false);
    }
  };

  const copyPricelist = async (sourceId) => {
    try {
      setLoading(true);
      const response = await pricelistService.getById(sourceId);
      const source = response.data;

      setFormData({
        name: `${source.name} (Copy)`,
        description: source.description || '',
        currency: source.currency || 'AED',
        isActive: true,
        isDefault: false,
        effectiveFrom: '',
        effectiveTo: '',
        items: source.items || [],
      });
    } catch (error) {
      console.error('Error copying pricelist:', error);
      toast.error('Failed to copy price list');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (productId, newPrice) => {
    setFormData(prev => {
      const existingIndex = prev.items.findIndex(item => item.productId === productId);

      if (existingIndex >= 0) {
        const updatedItems = [...prev.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          sellingPrice: parseFloat(newPrice) || 0,
        };
        return { ...prev, items: updatedItems };
      } else {
        const product = products.find(p => p.id === productId);
        return {
          ...prev,
          items: [...prev.items, {
            productId,
            productName: product?.displayName || product?.name,
            sellingPrice: parseFloat(newPrice) || 0,
            minQuantity: 1,
          }],
        };
      }
    });
  };

  const handleBulkApply = () => {
    const { type, percentage } = bulkOperation;
    const multiplier = type === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        sellingPrice: parseFloat((item.sellingPrice * multiplier).toFixed(2)),
      })),
    }));

    toast.success(`Applied ${percentage}% ${type} to all prices`);
    setBulkDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Price list name is required');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          product_id: item.productId,
          selling_price: item.sellingPrice,
          min_quantity: item.minQuantity || 1,
        })),
      };

      if (isEdit) {
        await pricelistService.update(id, payload);
        toast.success('Price list updated successfully');
      } else {
        await pricelistService.create(payload);
        toast.success('Price list created successfully');
      }

      navigate('/pricelists');
    } catch (error) {
      console.error('Error saving pricelist:', error);
      toast.error(error.response?.data?.message || 'Failed to save price list');
    } finally {
      setLoading(false);
    }
  };

  const getProductPrice = (productId) => {
    const item = formData.items.find(i => i.productId === productId);
    return item?.sellingPrice || '';
  };

  const getProductCurrentPrice = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.sellingPrice || 0;
  };

  const getPriceDiff = (productId) => {
    const newPrice = getProductPrice(productId);
    const currentPrice = getProductCurrentPrice(productId);

    if (!newPrice || !currentPrice) return null;

    const diff = newPrice - currentPrice;
    const diffPercent = ((diff / currentPrice) * 100).toFixed(1);

    return { diff, diffPercent };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate('/pricelists')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Edit Price List' : 'New Price List'}
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Price List Name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Effective From"
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Effective To"
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => handleChange('effectiveTo', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Currency"
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                    >
                      <MenuItem value="AED">AED</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isDefault}
                          onChange={(e) => handleChange('isDefault', e.target.checked)}
                        />
                      }
                      label="Set as Default"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Product Prices</Typography>
                  <Button
                    startIcon={<IncreaseIcon />}
                    onClick={() => setBulkDialog(true)}
                  >
                    Bulk Price Adjustment
                  </Button>
                </Stack>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Current Price</TableCell>
                        <TableCell>New Price</TableCell>
                        <TableCell>Change</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product) => {
                        const priceDiff = getPriceDiff(product.id);

                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Typography variant="body2">{product.displayName || product.display_name || 'N/A'}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {product.category} | {product.grade}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {formData.currency} {product.sellingPrice?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={getProductPrice(product.id)}
                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      {formData.currency}
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{ width: 150 }}
                              />
                            </TableCell>
                            <TableCell>
                              {priceDiff && (
                                <Chip
                                  size="small"
                                  label={`${priceDiff.diff >= 0 ? '+' : ''}${priceDiff.diffPercent}%`}
                                  color={priceDiff.diff >= 0 ? 'success' : 'error'}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Products with Prices
                    </Typography>
                    <Typography variant="h5">
                      {formData.items.length} / {products.length}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={formData.isActive ? 'Active' : 'Inactive'}
                      color={formData.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {formData.isDefault && (
                      <Chip label="Default" color="primary" size="small" sx={{ ml: 1 }} />
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={2} mt={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Price List'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/pricelists')}
                disabled={loading}
              >
                Cancel
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>

      {/* Bulk Price Adjustment Dialog */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Price Adjustment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Operation"
                value={bulkOperation.type}
                onChange={(e) => setBulkOperation({ ...bulkOperation, type: e.target.value })}
              >
                <MenuItem value="increase">Increase Prices</MenuItem>
                <MenuItem value="decrease">Decrease Prices</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Percentage"
                value={bulkOperation.percentage}
                onChange={(e) => setBulkOperation({ ...bulkOperation, percentage: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkApply} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
