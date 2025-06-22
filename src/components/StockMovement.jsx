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
  Paper,
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
  Divider,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Plus as Add,
  Edit,
  Trash2 as Delete,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { stockMovementService } from '../services/stockMovementService';
import { createStockMovement, PRODUCT_TYPES, STEEL_GRADES, FINISHES, MOVEMENT_TYPES } from '../types';

const StockContainer = styled(Box)(({ theme }) => ({
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
    backgroundColor: theme.palette.grey[50],
  },
  '& .MuiTableCell-head': {
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.text.secondary,
  },
  '& .MuiTableRow-hover:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const MovementChip = styled(Chip)(({ theme, movement }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  minWidth: '70px',
  ...(movement === 'IN' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    '& .MuiChip-icon': {
      color: theme.palette.success.dark,
    },
  }),
  ...(movement === 'OUT' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    '& .MuiChip-icon': {
      color: theme.palette.error.dark,
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

const StockMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(createStockMovement());

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await stockMovementService.getAllMovements();
      setMovements(response.data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      setError('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (movement = null) => {
    if (movement) {
      setEditingMovement(movement);
      setFormData(movement);
    } else {
      setEditingMovement(null);
      setFormData(createStockMovement());
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMovement(null);
    setFormData(createStockMovement());
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (editingMovement) {
        await stockMovementService.updateMovement(editingMovement.id, formData);
      } else {
        await stockMovementService.createMovement(formData);
      }
      await fetchMovements();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving stock movement:', error);
      setError('Failed to save stock movement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock movement?')) {
      try {
        await stockMovementService.deleteMovement(id);
        await fetchMovements();
      } catch (error) {
        console.error('Error deleting stock movement:', error);
        setError('Failed to delete stock movement');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredMovements = movements.filter(movement =>
    Object.values(movement).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <StockContainer>
        <LoadingContainer>
          <CircularProgress size={32} />
          <Typography color="text.secondary">Loading stock movements...</Typography>
        </LoadingContainer>
      </StockContainer>
    );
  }

  return (
    <StockContainer>
      <SectionHeader>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          📦 Stock Movements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track all incoming and outgoing stock movements
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
              placeholder="Search movements..."
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
              Add Movement
            </Button>
          </Box>
        </CardContent>
      </SearchCard>

      <StyledCard>
        <StyledTableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Movement</TableCell>
                <TableCell>Product Type</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Thickness</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Finish</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMovements.map((movement) => (
                <TableRow key={movement.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(movement.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <MovementChip
                      label={movement.movement}
                      movement={movement.movement}
                      icon={movement.movement === 'IN' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {movement.productType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={movement.grade} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>{movement.thickness}</TableCell>
                  <TableCell>{movement.size}</TableCell>
                  <TableCell>
                    {movement.finish && (
                      <Chip 
                        label={movement.finish} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {movement.invoiceNo && (
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: 'grey.100',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block'
                      }}>
                        {movement.invoiceNo}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {movement.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {movement.currentStock}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {movement.seller}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(movement)}
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
                        onClick={() => handleDelete(movement.id)}
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
              {filteredMovements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
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
                        No stock movements found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 'Try adjusting your search term' : 'Add your first stock movement to get started'}
                      </Typography>
                      {!searchTerm && (
                        <Button
                          variant="contained"
                          startIcon={<Add size={16} />}
                          onClick={() => handleOpenDialog()}
                          sx={{ borderRadius: 2 }}
                        >
                          Add Movement
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
            {editingMovement ? 'Edit Stock Movement' : 'Add Stock Movement'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Movement Type</InputLabel>
                <Select
                  value={formData.movement}
                  label="Movement Type"
                  onChange={(e) => handleInputChange('movement', e.target.value)}
                >
                  {MOVEMENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={formData.grade}
                  label="Grade"
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                >
                  {STEEL_GRADES.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Thickness"
                value={formData.thickness}
                onChange={(e) => handleInputChange('thickness', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Size"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Finish</InputLabel>
                <Select
                  value={formData.finish}
                  label="Finish"
                  onChange={(e) => handleInputChange('finish', e.target.value)}
                >
                  {FINISHES.map((finish) => (
                    <MenuItem key={finish} value={finish}>
                      {finish}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice No"
                value={formData.invoiceNo}
                onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Seller"
                value={formData.seller}
                onChange={(e) => handleInputChange('seller', e.target.value)}
              />
            </Grid>
          </Grid>
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
            {editingMovement ? 'Update Movement' : 'Add Movement'}
          </Button>
        </DialogActions>
      </Dialog>
    </StockContainer>
  );
};

export default StockMovement;