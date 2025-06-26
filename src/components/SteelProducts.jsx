import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Layers,
  Info,
  Save,
  X,
  Filter,
  BarChart3,
  Package2,
  Ruler,
  Weight,
  Calendar,
  Eye,
  RefreshCw,
  Move,
  Warehouse
} from 'lucide-react';
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Stack,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { productService } from '../services/productService';
import { useApiData, useApi } from '../hooks/useApi';
import StockMovement from './StockMovement';
import InventoryList from './InventoryList';

// Styled Components
const ProductsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
}));

const ProductsPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  overflow: 'hidden',
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  textAlign: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ProductCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const StockProgressBar = styled(LinearProgress)(({ theme, stockstatus }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[300],
  '& .MuiLinearProgress-bar': {
    backgroundColor: 
      stockstatus === 'low' ? theme.palette.error.main :
      stockstatus === 'high' ? theme.palette.success.main :
      theme.palette.info.main,
  },
}));

const SteelProducts = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  const { data: productsData, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useApiData(
    () => productService.getProducts({ 
      search: searchTerm, 
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      stock_status: stockFilter === 'all' ? undefined : stockFilter
    }),
    [searchTerm, categoryFilter, stockFilter]
  );
  
  const { execute: createProduct, loading: creatingProduct } = useApi(productService.createProduct);
  const { execute: updateProduct, loading: updatingProduct } = useApi(productService.updateProduct);
  const { execute: deleteProduct } = useApi(productService.deleteProduct);
  const { execute: updateProductPrice } = useApi(productService.updateProductPrice);
  
  const products = productsData?.products || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'rebar',
    grade: '',
    size: '',
    weight: '',
    unit: 'kg',
    description: '',
    currentStock: 0,
    minStock: 10,
    maxStock: 1000,
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
    location: '',
    specifications: {
      length: '',
      width: '',
      thickness: '',
      diameter: '',
      tensileStrength: '',
      yieldStrength: '',
      carbonContent: '',
      coating: '',
      standard: ''
    }
  });

  const [priceUpdate, setPriceUpdate] = useState({
    newPrice: 0,
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { value: 'rebar', label: 'Rebar & Reinforcement' },
    { value: 'structural', label: 'Structural Steel' },
    { value: 'sheet', label: 'Steel Sheets' },
    { value: 'pipe', label: 'Pipes & Tubes' },
    { value: 'angle', label: 'Angles & Channels' },
    { value: 'round', label: 'Round Bars' },
    { value: 'flat', label: 'Flat Bars' },
    { value: 'wire', label: 'Wire & Mesh' }
  ];

  const grades = [
    'Fe415', 'Fe500', 'Fe550', 'Fe600',
    'IS2062', 'ASTM A36', 'ASTM A572',
    'SS304', 'SS316', 'MS', 'Galvanized'
  ];


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.currentStock <= product.minStock) ||
                        (stockFilter === 'normal' && product.currentStock > product.minStock && product.currentStock < product.maxStock * 0.8) ||
                        (stockFilter === 'high' && product.currentStock >= product.maxStock * 0.8);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddProduct = async () => {
    try {
      await createProduct(newProduct);
      setNewProduct({
        name: '',
        category: 'rebar',
        grade: '',
        size: '',
        weight: '',
        unit: 'kg',
        description: '',
        currentStock: 0,
        minStock: 10,
        maxStock: 1000,
        costPrice: 0,
        sellingPrice: 0,
        supplier: '',
        location: '',
        specifications: {
          length: '', width: '', thickness: '', diameter: '',
          tensileStrength: '', yieldStrength: '', carbonContent: '',
          coating: '', standard: ''
        }
      });
      setShowAddModal(false);
      refetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async () => {
    try {
      await updateProduct(selectedProduct.id, selectedProduct);
      setShowEditModal(false);
      setSelectedProduct(null);
      refetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        refetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handlePriceUpdate = async () => {
    try {
      await updateProductPrice(selectedProduct.id, {
        newPrice: priceUpdate.newPrice,
        reason: priceUpdate.reason,
        effectiveDate: priceUpdate.effectiveDate
      });
      setPriceUpdate({ newPrice: 0, reason: '', effectiveDate: new Date().toISOString().split('T')[0] });
      setShowPriceModal(false);
      setSelectedProduct(null);
      refetchProducts();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const getStockStatus = (product) => {
    if (product.currentStock <= product.minStock) return 'low';
    if (product.currentStock >= product.maxStock * 0.8) return 'high';
    return 'normal';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low': return '#dc2626';
      case 'high': return '#059669';
      default: return '#2563eb';
    }
  };

  const calculateInventoryStats = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => getStockStatus(p) === 'low').length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
    
    return { totalProducts, lowStockProducts, totalValue, totalStock };
  };

  const stats = calculateInventoryStats();

  const renderCatalog = () => (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search products..."
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
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Stock</InputLabel>
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            label="Stock"
          >
            <MenuItem value="all">All Stock</MenuItem>
            <MenuItem value="low">Low Stock</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="high">High Stock</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowAddModal(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Product
        </Button>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {filteredProducts.map(product => {
          const stockStatus = getStockStatus(product);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard>
                <CardContent>
                  {/* Product Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {categories.find(c => c.value === product.category)?.label}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip label={product.grade} size="small" color="primary" variant="outlined" />
                        <Chip label={product.size} size="small" variant="outlined" />
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowSpecModal(true);
                        }}
                        title="View Specifications"
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedProduct(product);
                          setPriceUpdate({ ...priceUpdate, newPrice: product.sellingPrice });
                          setShowPriceModal(true);
                        }}
                        title="Update Price"
                        color="info"
                      >
                        <Tag size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowEditModal(true);
                        }}
                        title="Edit Product"
                        color="primary"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete Product"
                        color="error"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description}
                  </Typography>

                  {/* Product Stats */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Weight:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {product.weight} {product.unit}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Supplier:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {product.supplier}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">Location:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {product.location}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Stock Info */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Stock Level</Typography>
                      <Chip 
                        icon={
                          stockStatus === 'low' ? <AlertTriangle size={14} /> :
                          stockStatus === 'high' ? <Package size={14} /> :
                          <CheckCircle size={14} />
                        }
                        label={stockStatus.toUpperCase()}
                        size="small"
                        color={
                          stockStatus === 'low' ? 'error' :
                          stockStatus === 'high' ? 'success' : 'info'
                        }
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {product.currentStock}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Min: {product.minStock} | Max: {product.maxStock}
                    </Typography>
                    <StockProgressBar 
                      variant="determinate" 
                      value={Math.min((product.currentStock / product.maxStock) * 100, 100)}
                      stockstatus={stockStatus}
                    />
                  </Box>

                  {/* Price Info */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Cost Price</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>₹{product.costPrice}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Selling Price</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        ₹{product.sellingPrice}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Margin</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {product.costPrice > 0 ? 
                          Math.round(((product.sellingPrice - product.costPrice) / product.costPrice) * 100) 
                          : 0}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </ProductCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderStockMovements = () => (
    <StockMovement />
  );

  const renderInventoryManagement = () => (
    <InventoryList />
  );

  const renderInventoryDashboard = () => (
    <div className="inventory-dashboard">
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-header">
            <Package2 size={24} />
            <h3>Total Products</h3>
          </div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-subtitle">In catalog</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <AlertTriangle size={24} />
            <h3>Low Stock Items</h3>
          </div>
          <div className="stat-value">{stats.lowStockProducts}</div>
          <div className="stat-subtitle">Need reorder</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <DollarSign size={24} />
            <h3>Inventory Value</h3>
          </div>
          <div className="stat-value">₹{stats.totalValue.toLocaleString()}</div>
          <div className="stat-subtitle">Total cost value</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <Layers size={24} />
            <h3>Total Stock</h3>
          </div>
          <div className="stat-value">{stats.totalStock}</div>
          <div className="stat-subtitle">Units in stock</div>
        </div>
      </div>

      <div className="inventory-table">
        <h3>Stock Levels Overview</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Stock</th>
                <th>Max Stock</th>
                <th>Status</th>
                <th>Value</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const stockStatus = getStockStatus(product);
                const stockValue = product.currentStock * product.costPrice;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <strong>{product.name}</strong>
                        <span className="product-grade">{product.grade} - {product.size}</span>
                      </div>
                    </td>
                    <td>{categories.find(c => c.value === product.category)?.label}</td>
                    <td className="stock-cell">
                      <span className="stock-number">{product.currentStock}</span>
                      <span className="stock-unit">{product.unit}</span>
                    </td>
                    <td>{product.minStock}</td>
                    <td>{product.maxStock}</td>
                    <td>
                      <span className={`status-badge status-${stockStatus}`}>
                        {stockStatus === 'low' && <AlertTriangle size={14} />}
                        {stockStatus === 'normal' && <CheckCircle size={14} />}
                        {stockStatus === 'high' && <Package size={14} />}
                        {stockStatus.toUpperCase()}
                      </span>
                    </td>
                    <td>₹{stockValue.toLocaleString()}</td>
                    <td>{format(new Date(product.lastUpdated), 'MMM dd, yyyy')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Price Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage product pricing and track price history
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Cost Price</TableCell>
              <TableCell>Selling Price</TableCell>
              <TableCell>Margin</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => {
              const margin = product.costPrice > 0 ? 
                ((product.sellingPrice - product.costPrice) / product.costPrice) * 100 : 0;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.grade} - {product.size}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {categories.find(c => c.value === product.category)?.label}
                  </TableCell>
                  <TableCell>₹{product.costPrice}</TableCell>
                  <TableCell>₹{product.sellingPrice}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${Math.round(margin)}%`}
                      color={margin < 10 ? 'error' : margin > 30 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {product.lastUpdated ? format(new Date(product.lastUpdated), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedProduct(product);
                        setPriceUpdate({ ...priceUpdate, newPrice: product.sellingPrice });
                        setShowPriceModal(true);
                      }}
                      title="Update Price"
                    >
                      <RefreshCw size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <ProductsContainer>
      <ProductsPaper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Package size={28} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              🏗️ Steel Products
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage your steel product catalog, inventory, and pricing
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              value="catalog" 
              label="Product Catalog" 
              icon={<Package size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="stock-movements" 
              label="Stock Movements" 
              icon={<Move size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="inventory" 
              label="Inventory Management" 
              icon={<Warehouse size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="pricing" 
              label="Price Management" 
              icon={<DollarSign size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box>
          {activeTab === 'catalog' && renderCatalog()}
          {activeTab === 'stock-movements' && renderStockMovements()}
          {activeTab === 'inventory' && renderInventoryManagement()}
          {activeTab === 'pricing' && renderPricing()}
        </Box>

      {/* Add Product Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Product</Typography>
            <IconButton onClick={() => setShowAddModal(false)} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Product Name *"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    fullWidth
                    placeholder="Enter product name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newProduct.category}
                      label="Category"
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Grade"
                    value={newProduct.grade}
                    onChange={(e) => setNewProduct({...newProduct, grade: e.target.value})}
                    fullWidth
                    placeholder="Enter grade (e.g., Fe415)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Size"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                    fullWidth
                    placeholder="e.g., 12mm, 50x50x6"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Weight"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                    fullWidth
                    placeholder="Enter weight"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={newProduct.unit}
                      label="Unit"
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    >
                      <MenuItem value="kg">kg</MenuItem>
                      <MenuItem value="kg/m">kg/m</MenuItem>
                      <MenuItem value="kg/sheet">kg/sheet</MenuItem>
                      <MenuItem value="tonnes">tonnes</MenuItem>
                      <MenuItem value="pieces">pieces</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    fullWidth
                    placeholder="Enter product description"
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Inventory Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Inventory Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Current Stock"
                    type="number"
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({...newProduct, currentStock: Number(e.target.value)})}
                    fullWidth
                    placeholder="Enter current stock"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Minimum Stock"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({...newProduct, minStock: Number(e.target.value)})}
                    fullWidth
                    placeholder="Enter minimum stock level"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Maximum Stock"
                    type="number"
                    value={newProduct.maxStock}
                    onChange={(e) => setNewProduct({...newProduct, maxStock: Number(e.target.value)})}
                    fullWidth
                    placeholder="Enter maximum stock level"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Pricing Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Pricing Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cost Price"
                    type="number"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    placeholder="Enter cost price"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Selling Price"
                    type="number"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    placeholder="Enter selling price"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Supplier & Location */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Supplier & Location
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Supplier"
                    value={newProduct.supplier}
                    onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                    fullWidth
                    placeholder="Enter supplier name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Storage Location"
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                    fullWidth
                    placeholder="Enter storage location"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Product Specifications */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Product Specifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Length"
                    value={newProduct.specifications.length}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, length: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter length"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Width"
                    value={newProduct.specifications.width}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, width: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter width"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Thickness"
                    value={newProduct.specifications.thickness}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, thickness: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter thickness"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Diameter"
                    value={newProduct.specifications.diameter}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, diameter: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter diameter"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tensile Strength"
                    value={newProduct.specifications.tensileStrength}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, tensileStrength: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter tensile strength"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Yield Strength"
                    value={newProduct.specifications.yieldStrength}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, yieldStrength: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter yield strength"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Carbon Content"
                    value={newProduct.specifications.carbonContent}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, carbonContent: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter carbon content"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Coating"
                    value={newProduct.specifications.coating}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, coating: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter coating type"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Standard"
                    value={newProduct.specifications.standard}
                    onChange={(e) => setNewProduct({
                      ...newProduct,
                      specifications: {...newProduct.specifications, standard: e.target.value}
                    })}
                    fullWidth
                    placeholder="Enter applicable standard"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            startIcon={<Save size={16} />}
            disabled={!newProduct.name}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={selectedProduct.category}
                    onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Grade</label>
                  <input
                    type="text"
                    value={selectedProduct.grade}
                    onChange={(e) => setSelectedProduct({...selectedProduct, grade: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    value={selectedProduct.size}
                    onChange={(e) => setSelectedProduct({...selectedProduct, size: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Current Stock</label>
                  <input
                    type="number"
                    value={selectedProduct.currentStock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, currentStock: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Stock</label>
                  <input
                    type="number"
                    value={selectedProduct.minStock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, minStock: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Maximum Stock</label>
                  <input
                    type="number"
                    value={selectedProduct.maxStock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, maxStock: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number"
                    value={selectedProduct.costPrice}
                    onChange={(e) => setSelectedProduct({...selectedProduct, costPrice: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={selectedProduct.supplier}
                    onChange={(e) => setSelectedProduct({...selectedProduct, supplier: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Storage Location</label>
                  <input
                    type="text"
                    value={selectedProduct.location}
                    onChange={(e) => setSelectedProduct({...selectedProduct, location: e.target.value})}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={selectedProduct.description}
                    onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleEditProduct}>
                <Save size={20} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Update Modal */}
      {showPriceModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Update Price - {selectedProduct.name}</h2>
              <button className="btn-icon" onClick={() => setShowPriceModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="price-update-form">
                <div className="current-price">
                  <span className="label">Current Price:</span>
                  <span className="price">₹{selectedProduct.sellingPrice}</span>
                </div>
                <div className="form-group">
                  <label>New Price (₹)</label>
                  <input
                    type="number"
                    value={priceUpdate.newPrice}
                    onChange={(e) => setPriceUpdate({...priceUpdate, newPrice: Number(e.target.value)})}
                    placeholder="Enter new price"
                  />
                </div>
                <div className="form-group">
                  <label>Reason for Update</label>
                  <input
                    type="text"
                    value={priceUpdate.reason}
                    onChange={(e) => setPriceUpdate({...priceUpdate, reason: e.target.value})}
                    placeholder="Enter reason for price change"
                  />
                </div>
                <div className="form-group">
                  <label>Effective Date</label>
                  <input
                    type="date"
                    value={priceUpdate.effectiveDate}
                    onChange={(e) => setPriceUpdate({...priceUpdate, effectiveDate: e.target.value})}
                  />
                </div>
                {selectedProduct.priceHistory && selectedProduct.priceHistory.length > 0 && (
                  <div className="price-history">
                    <h4>Price History</h4>
                    <div className="history-list">
                      {selectedProduct.priceHistory.slice(0, 5).map((entry, index) => (
                        <div key={index} className="history-item">
                          <span className="history-date">{format(new Date(entry.date), 'MMM dd, yyyy')}</span>
                          <span className="history-price">₹{entry.price}</span>
                          <span className="history-reason">{entry.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPriceModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handlePriceUpdate}>
                <Save size={20} />
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specifications Modal */}
      {showSpecModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Product Specifications - {selectedProduct.name}</h2>
              <button className="btn-icon" onClick={() => setShowSpecModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="specifications-view">
                <div className="spec-section">
                  <h3>Basic Information</h3>
                  <div className="spec-grid">
                    <div className="spec-item">
                      <span className="spec-label">Product Name:</span>
                      <span className="spec-value">{selectedProduct.name}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Category:</span>
                      <span className="spec-value">{categories.find(c => c.value === selectedProduct.category)?.label}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Grade:</span>
                      <span className="spec-value">{selectedProduct.grade}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Size:</span>
                      <span className="spec-value">{selectedProduct.size}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Weight:</span>
                      <span className="spec-value">{selectedProduct.weight} {selectedProduct.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="spec-section">
                  <h3>Technical Specifications</h3>
                  <div className="spec-grid">
                    {selectedProduct.specifications.length && (
                      <div className="spec-item">
                        <span className="spec-label">Length:</span>
                        <span className="spec-value">{selectedProduct.specifications.length}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.width && (
                      <div className="spec-item">
                        <span className="spec-label">Width:</span>
                        <span className="spec-value">{selectedProduct.specifications.width}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.thickness && (
                      <div className="spec-item">
                        <span className="spec-label">Thickness:</span>
                        <span className="spec-value">{selectedProduct.specifications.thickness}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.diameter && (
                      <div className="spec-item">
                        <span className="spec-label">Diameter:</span>
                        <span className="spec-value">{selectedProduct.specifications.diameter}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.tensileStrength && (
                      <div className="spec-item">
                        <span className="spec-label">Tensile Strength:</span>
                        <span className="spec-value">{selectedProduct.specifications.tensileStrength}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.yieldStrength && (
                      <div className="spec-item">
                        <span className="spec-label">Yield Strength:</span>
                        <span className="spec-value">{selectedProduct.specifications.yieldStrength}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.carbonContent && (
                      <div className="spec-item">
                        <span className="spec-label">Carbon Content:</span>
                        <span className="spec-value">{selectedProduct.specifications.carbonContent}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.coating && (
                      <div className="spec-item">
                        <span className="spec-label">Coating:</span>
                        <span className="spec-value">{selectedProduct.specifications.coating}</span>
                      </div>
                    )}
                    {selectedProduct.specifications.standard && (
                      <div className="spec-item">
                        <span className="spec-label">Standard:</span>
                        <span className="spec-value">{selectedProduct.specifications.standard}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="spec-section">
                  <h3>Description</h3>
                  <p>{selectedProduct.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </ProductsPaper>
    </ProductsContainer>
  );
};

export default SteelProducts;