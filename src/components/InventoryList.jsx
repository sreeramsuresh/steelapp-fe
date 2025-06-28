import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Toolbar,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  Badge,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Plus as Add,
  Edit,
  Trash2 as Delete,
  Search,
  Package,
  TrendingDown,
  TrendingUp,
  Warehouse,
  DollarSign,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { createInventoryItem, PRODUCT_TYPES, STEEL_GRADES, FINISHES } from '../types';

const InventoryContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  width: '100%',
  overflow: 'auto',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(0, 0, 2, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiTableHead-root': {
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[50],
  },
  '& .MuiTableCell-head': {
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.mode === 'light' ? theme.palette.text.primary : theme.palette.text.secondary,
  },
  '& .MuiTableRow-hover:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StockChip = styled(Chip)(({ theme, stock }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  minWidth: '60px',
  ...(stock <= 5 && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    '& .MuiChip-icon': {
      color: theme.palette.error.dark,
    },
  }),
  ...(stock > 5 && stock <= 10 && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.dark,
    '& .MuiChip-icon': {
      color: theme.palette.warning.dark,
    },
  }),
  ...(stock > 10 && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    '& .MuiChip-icon': {
      color: theme.palette.success.dark,
    },
  }),
}));

const SearchCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: 'none',
}));

const EmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  gap: theme.spacing(2),
}));

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => {
    const item = createInventoryItem();
    return {
      ...item,
      quantity: '',
      pricePurchased: '',
      sellingPrice: '',
      landedCost: ''
    };
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAllItems();
      setInventory(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      const item = createInventoryItem();
      setFormData({
        ...item,
        quantity: '',
        pricePurchased: '',
        sellingPrice: '',
        landedCost: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData(createInventoryItem());
    setError('');
  };

  const handleSubmit = async () => {
    try {
      const itemData = {
        ...formData,
        quantity: formData.quantity === '' ? 0 : Number(formData.quantity),
        pricePurchased: formData.pricePurchased === '' ? 0 : Number(formData.pricePurchased),
        sellingPrice: formData.sellingPrice === '' ? 0 : Number(formData.sellingPrice),
        landedCost: formData.landedCost === '' ? 0 : Number(formData.landedCost)
      };

      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, itemData);
      } else {
        await inventoryService.createItem(itemData);
      }
      await fetchInventory();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      setError('Failed to save inventory item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await inventoryService.deleteItem(id);
        await fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        setError('Failed to delete inventory item');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredInventory = inventory.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const generateDescription = (item) => {
    const parts = [];
    if (item.productType) parts.push(`SS ${item.productType.toUpperCase()}`);
    if (item.grade) parts.push(`GR${item.grade}`);
    if (item.finish) parts.push(`${item.finish} finish`);
    if (item.size) parts.push(item.size);
    if (item.thickness) parts.push(`${item.thickness}MM`);
    return parts.join(' ');
  };

  if (loading) {
    return (
      <InventoryContainer>
        <LoadingContainer>
          <CircularProgress size={32} />
          <Typography color="text.secondary">Loading inventory...</Typography>
        </LoadingContainer>
      </InventoryContainer>
    );
  }

  return (
    <InventoryContainer>
      <SectionHeader>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          📋 Inventory Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your steel inventory and track stock levels
        </Typography>
      </SectionHeader>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <SearchCard>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<Filter size={16} />}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Add size={16} />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Add Item
            </Button>
          </Box>
        </CardContent>
      </SearchCard>

      <StyledCard>
        <StyledTableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Product Type</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Finish</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Thickness</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Purchase Price</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Landed Cost</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {item.description || generateDescription(item)}
                    </Typography>
                    {item.location && (
                      <Chip
                        label={item.location}
                        size="small"
                        icon={<Warehouse size={12} />}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.productType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.grade} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    {item.finish && (
                      <Chip 
                        label={item.finish} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.size}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.thickness}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StockChip
                      label={item.quantity}
                      stock={item.quantity}
                      icon={
                        item.quantity <= 5 ? <AlertTriangle size={14} /> :
                        item.quantity <= 10 ? <Package size={14} /> :
                        <TrendingUp size={14} />
                      }
                      variant="filled"
                    />
                    {item.quantity <= 5 && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                        Low Stock
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.pricePurchased ? formatCurrency(item.pricePurchased) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {item.sellingPrice ? formatCurrency(item.sellingPrice) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.landedCost ? formatCurrency(item.landedCost) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(item)}
                        sx={{ 
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText' }
                        }}
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        sx={{ 
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' }
                        }}
                      >
                        <Delete size={16} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <EmptyState>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          backgroundColor: 'grey.100',
                          color: 'grey.400',
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        <Package size={32} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        No inventory items found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Try adjusting your search term' : 'Add your first inventory item to get started'}
                      </Typography>
                      {!searchTerm && (
                        <Button
                          variant="contained"
                          startIcon={<Add size={16} />}
                          onClick={() => handleOpenDialog()}
                          sx={{ borderRadius: 2 }}
                        >
                          Add Item
                        </Button>
                      )}
                    </EmptyState>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </StyledCard>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            boxShadow: 8
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Auto-generated if empty"
              />
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select
                  value={formData.productType}
                  label="Product Type"
                  onChange={(e) => handleInputChange('productType', e.target.value)}
                >
                  {PRODUCT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Autocomplete
                fullWidth
                freeSolo
                options={STEEL_GRADES}
                value={formData.grade}
                onChange={(event, newValue) => {
                  handleInputChange('grade', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleInputChange('grade', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Grade"
                    helperText="Select from list or type custom grade"
                    placeholder="e.g., 304, 316L"
                  />
                )}
              />
            </Box>
            <Box>
              <Autocomplete
                fullWidth
                freeSolo
                options={FINISHES}
                value={formData.finish}
                onChange={(event, newValue) => {
                  handleInputChange('finish', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleInputChange('finish', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Finish"
                    helperText="Select from list or type custom finish"
                    placeholder="e.g., Mirror, HL, 2B"
                  />
                )}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Size"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="e.g., 4x8"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Thickness"
                value={formData.thickness}
                onChange={(e) => handleInputChange('thickness', e.target.value)}
                placeholder="e.g., 0.8, 1.2"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                value={formData.pricePurchased || ''}
                onChange={(e) => handleInputChange('pricePurchased', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">د.إ</InputAdornment>,
                }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                value={formData.sellingPrice || ''}
                onChange={(e) => handleInputChange('sellingPrice', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">د.إ</InputAdornment>,
                }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Landed Cost"
                type="number"
                value={formData.landedCost || ''}
                onChange={(e) => handleInputChange('landedCost', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">د.إ</InputAdornment>,
                }}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Warehouse A, Section 1"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1
        }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {editingItem ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </InventoryContainer>
  );
};

export default InventoryList;