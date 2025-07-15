import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  LocalShipping as TruckIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { deliveryNotesAPI, invoicesAPI } from '../services/api';

const DeliveryNoteForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  // Check if invoice was pre-selected from InvoiceList
  const preSelectedInvoiceId = location.state?.selectedInvoiceId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    delivery_note_number: '',
    invoice_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_address: {
      street: '',
      city: '',
      po_box: ''
    },
    vehicle_number: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    items: []
  });

  // Invoice selection
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Load delivery note for editing
  useEffect(() => {
    if (isEdit) {
      loadDeliveryNote();
    } else {
      generateDeliveryNoteNumber();
    }
  }, [id, isEdit]);

  // Load invoices for selection
  useEffect(() => {
    loadInvoices();
  }, []);

  // Auto-select invoice if pre-selected
  useEffect(() => {
    if (preSelectedInvoiceId && !isEdit && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === preSelectedInvoiceId);
      if (invoice) {
        handleInvoiceSelect(invoice);
      }
    }
  }, [preSelectedInvoiceId, invoices, isEdit]);

  const loadDeliveryNote = async () => {
    try {
      setLoading(true);
      const deliveryNote = await deliveryNotesAPI.getById(id);
      
      setFormData({
        delivery_note_number: deliveryNote.delivery_note_number,
        invoice_id: deliveryNote.invoice_id,
        delivery_date: deliveryNote.delivery_date,
        delivery_address: deliveryNote.delivery_address || {
          street: '',
          city: '',
          po_box: ''
        },
        vehicle_number: deliveryNote.vehicle_number || '',
        driver_name: deliveryNote.driver_name || '',
        driver_phone: deliveryNote.driver_phone || '',
        notes: deliveryNote.notes || '',
        items: deliveryNote.items || []
      });

      // Load the related invoice
      if (deliveryNote.invoice_id) {
        const invoice = await invoicesAPI.getById(deliveryNote.invoice_id);
        setSelectedInvoice(invoice);
      }
    } catch (err) {
      setError('Failed to load delivery note: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll({ 
        status: 'paid',
        limit: 100 
      });
      setInvoices(response.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const generateDeliveryNoteNumber = async () => {
    try {
      const response = await deliveryNotesAPI.getNextNumber();
      setFormData(prev => ({
        ...prev,
        delivery_note_number: response.next_delivery_note_number
      }));
    } catch (err) {
      console.error('Failed to generate delivery note number:', err);
    }
  };

  const handleInvoiceSelect = async (invoice) => {
    if (!invoice) return;

    try {
      setSelectedInvoice(invoice);
      setFormData(prev => ({
        ...prev,
        invoice_id: invoice.id,
        delivery_address: invoice.customer_details?.address || prev.delivery_address,
        items: invoice.items?.map(item => ({
          invoice_item_id: item.id,
          name: item.name,
          specification: item.specification,
          unit: item.unit,
          ordered_quantity: item.quantity,
          delivered_quantity: isEdit ? 0 : item.quantity, // For new delivery notes, default to full quantity
          remaining_quantity: isEdit ? item.quantity : 0
        })) || []
      }));
      setShowInvoiceDialog(false);
    } catch (err) {
      setError('Failed to load invoice details: ' + err.message);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleItemQuantityChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const numValue = parseFloat(value) || 0;
    
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numValue
    };

    // Calculate remaining quantity
    if (field === 'delivered_quantity') {
      updatedItems[index].remaining_quantity = 
        updatedItems[index].ordered_quantity - numValue;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.delivery_note_number || !formData.invoice_id || !formData.delivery_date) {
        setError('Please fill in all required fields');
        return;
      }

      if (formData.items.length === 0) {
        setError('Please add at least one item');
        return;
      }

      // Validate delivery quantities
      const invalidItems = formData.items.filter(item => 
        item.delivered_quantity <= 0 || 
        item.delivered_quantity > item.ordered_quantity
      );

      if (invalidItems.length > 0) {
        setError('Please check delivery quantities. They must be greater than 0 and not exceed ordered quantities.');
        return;
      }

      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          invoice_item_id: item.invoice_item_id,
          delivered_quantity: item.delivered_quantity
        }))
      };

      if (isEdit) {
        await deliveryNotesAPI.update(id, submitData);
        setSuccess('Delivery note updated successfully');
      } else {
        await deliveryNotesAPI.create(submitData);
        setSuccess('Delivery note created successfully');
      }

      setTimeout(() => {
        navigate('/delivery-notes');
      }, 2000);
    } catch (err) {
      setError('Failed to save delivery note: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/delivery-notes')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TruckIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          {isEdit ? 'Edit Delivery Note' : 'Create Delivery Note'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Note Number"
                  value={formData.delivery_note_number}
                  onChange={(e) => handleInputChange('delivery_note_number', e.target.value)}
                  required
                  disabled={isEdit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Selected Invoice"
                    value={selectedInvoice ? `${selectedInvoice.invoice_number} - ${selectedInvoice.customer_details?.name}` : ''}
                    InputProps={{ readOnly: true }}
                    required
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setShowInvoiceDialog(true)}
                    disabled={isEdit}
                  >
                    Select Invoice
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Delivery Address */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Delivery Address</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={formData.delivery_address.street}
                  onChange={(e) => handleInputChange('delivery_address.street', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.delivery_address.city}
                  onChange={(e) => handleInputChange('delivery_address.city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PO Box"
                  value={formData.delivery_address.po_box}
                  onChange={(e) => handleInputChange('delivery_address.po_box', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Items */}
          {formData.items.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Items for Delivery</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Specification</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Ordered Qty</TableCell>
                      <TableCell>Deliver Qty</TableCell>
                      <TableCell>Remaining</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {item.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.specification || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.ordered_quantity}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.delivered_quantity || ''}
                            onChange={(e) => handleItemQuantityChange(index, 'delivered_quantity', e.target.value)}
                            inputProps={{ 
                              min: 0, 
                              max: item.ordered_quantity,
                              step: 0.01
                            }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={item.remaining_quantity === 0 ? 'success.main' : 'warning.main'}
                          >
                            {item.remaining_quantity}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        {/* Delivery Details */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Transport Details</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={formData.vehicle_number}
                onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                placeholder="e.g., MH-01-AB-1234"
              />
              <TextField
                fullWidth
                label="Driver Name"
                value={formData.driver_name}
                onChange={(e) => handleInputChange('driver_name', e.target.value)}
              />
              <TextField
                fullWidth
                label="Driver Phone"
                value={formData.driver_phone}
                onChange={(e) => handleInputChange('driver_phone', e.target.value)}
                placeholder="e.g., +91 98765 43210"
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Delivery Notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special instructions, handling notes, etc."
            />
          </Paper>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading || !selectedInvoice}
            sx={{ mb: 2 }}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Delivery Note' : 'Create Delivery Note')}
          </Button>
        </Grid>
      </Grid>

      {/* Invoice Selection Dialog */}
      <Dialog 
        open={showInvoiceDialog} 
        onClose={() => setShowInvoiceDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Invoice</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.customer_details?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.customer_details?.company}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.invoice_date).toLocaleDateString('en-AE')}
                    </TableCell>
                    <TableCell>
                      د.إ{invoice.total?.toLocaleString('en-AE')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleInvoiceSelect(invoice)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
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
    </Box>
  );
};

export default DeliveryNoteForm;