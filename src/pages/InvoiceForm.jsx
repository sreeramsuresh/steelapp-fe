import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, Download } from 'lucide-react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { createInvoice, createCompany, createSteelItem, STEEL_UNITS } from '../types';
import { 
  generateInvoiceNumber, 
  calculateItemAmount, 
  calculateSubtotal, 
  calculateTotalGST, 
  calculateTotal,
  formatCurrency 
} from '../utils/invoiceUtils';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import InvoicePreview from '../components/InvoicePreview';
import { invoiceService, companyService } from '../services';
import { customerService } from '../services/customerService';
import { useApiData, useApi } from '../hooks/useApi';

// Styled Components
const InvoiceContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
}));

const InvoiceFormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
}));

const SectionCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    newInvoice.invoiceNumber = generateInvoiceNumber();
    return newInvoice;
  });

  const { data: company, loading: loadingCompany } = useApiData(companyService.getCompany, [], true);
  const { execute: saveInvoice, loading: savingInvoice } = useApi(invoiceService.createInvoice);
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(invoiceService.updateInvoice);
  const { data: existingInvoice, loading: loadingInvoice } = useApiData(() => 
    id ? invoiceService.getInvoice(id) : null, [id], !!id
  );
  const { data: nextInvoiceData } = useApiData(() => invoiceService.getNextInvoiceNumber(), [], !id);
  const { data: customersData, loading: loadingCustomers } = useApiData(
    () => customerService.getCustomers({ status: 'active' }), []
  );

  useEffect(() => {
    const subtotal = calculateSubtotal(invoice.items);
    const gstAmount = calculateTotalGST(invoice.items);
    const total = calculateTotal(subtotal, gstAmount);
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      gstAmount,
      total
    }));
  }, [invoice.items]);

  useEffect(() => {
    if (nextInvoiceData && nextInvoiceData.nextNumber && !id) {
      setInvoice(prev => ({
        ...prev,
        invoiceNumber: nextInvoiceData.nextNumber
      }));
    }
  }, [nextInvoiceData, id]);

  useEffect(() => {
    if (existingInvoice && id) {
      setInvoice(existingInvoice);
    }
  }, [existingInvoice, id]);

  const handleCustomerSelect = (customerId) => {
    const customers = customersData?.customers || [];
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    if (selectedCustomer) {
      setInvoice(prev => ({
        ...prev,
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          email: selectedCustomer.email || '',
          phone: selectedCustomer.phone || '',
          gstNumber: selectedCustomer.gst_number || '',
          address: {
            street: selectedCustomer.address?.street || '',
            city: selectedCustomer.address?.city || '',
            state: selectedCustomer.address?.state || '',
            zipCode: selectedCustomer.address?.zipCode || ''
          }
        }
      }));
    }
  };

  const handleCustomerChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setInvoice(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          [parent]: {
            ...prev.customer[parent],
            [child]: value
          }
        }
      }));
    } else {
      setInvoice(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          [field]: value
        }
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setInvoice(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      if (field === 'quantity' || field === 'rate') {
        newItems[index].amount = calculateItemAmount(newItems[index].quantity, newItems[index].rate);
      }
      
      return {
        ...prev,
        items: newItems
      };
    });
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, createSteelItem()]
    }));
  };

  const removeItem = (index) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      if (id) {
        // Update existing invoice
        const updatedInvoice = await updateInvoice(invoice.id, invoice);
        if (onSave) onSave(updatedInvoice);
        alert('Invoice updated successfully!');
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(invoice);
        if (onSave) onSave(newInvoice);
        alert('Invoice saved successfully!');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!company) {
      alert('Company data is still loading. Please wait...');
      return;
    }
    
    setIsGeneratingPDF(true);
    
    try {
      await generateInvoicePDF(invoice, company);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (showPreview) {
    return (
      <InvoicePreview 
        invoice={invoice} 
        company={company || {}}
        onClose={() => setShowPreview(false)} 
      />
    );
  }

  if (loadingInvoice) {
    return (
      <InvoiceContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>Loading invoice...</Typography>
        </Box>
      </InvoiceContainer>
    );
  }

  return (
    <InvoiceContainer>
      <InvoiceFormPaper>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {id ? 'Edit Invoice' : 'Create New Invoice'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={() => {
                if (!company) {
                  alert('Company data is still loading. Please wait...');
                  return;
                }
                setShowPreview(true);
              }}
              variant="outlined"
              startIcon={<Eye size={18} />}
              disabled={loadingCompany}
              sx={{ borderRadius: 2 }}
            >
              Preview
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              variant="outlined"
              startIcon={isGeneratingPDF ? <CircularProgress size={18} /> : <Download size={18} />}
              disabled={isGeneratingPDF || loadingCompany}
              sx={{ borderRadius: 2 }}
            >
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button 
              onClick={handleSave}
              variant="contained"
              startIcon={(savingInvoice || updatingInvoice) ? <CircularProgress size={18} /> : <Save size={18} />}
              disabled={savingInvoice || updatingInvoice}
              sx={{ borderRadius: 2 }}
            >
              {savingInvoice || updatingInvoice ? 'Saving...' : 'Save Invoice'}
            </Button>
          </Box>
        </Box>

        {/* Form Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Invoice Details */}
          <Grid item xs={12} md={6}>
            <SectionCard>
              <CardContent>
                <SectionHeader variant="h6">📄 Invoice Details</SectionHeader>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Invoice Number"
                    variant="outlined"
                    fullWidth
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Date"
                        type="date"
                        variant="outlined"
                        fullWidth
                        value={invoice.date}
                        onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Due Date"
                        type="date"
                        variant="outlined"
                        fullWidth
                        value={invoice.dueDate}
                        onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </SectionCard>
          </Grid>

          {/* Customer Details */}
          <Grid item xs={12} md={6}>
            <SectionCard>
              <CardContent>
                <SectionHeader variant="h6">👤 Customer Details</SectionHeader>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Customer</InputLabel>
                    <Select
                      value={invoice.customer.id || ''}
                      label="Select Customer"
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      disabled={loadingCustomers}
                    >
                      <MenuItem value="">
                        <em>Select a customer</em>
                      </MenuItem>
                      {(customersData?.customers || []).map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Typography variant="body1">{customer.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.company && `${customer.company} • `}{customer.email}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* Display selected customer details */}
                  {invoice.customer.name && (
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'background.default', 
                      borderRadius: 1, 
                      border: 1, 
                      borderColor: 'divider' 
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Selected Customer Details:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Name:</strong> {invoice.customer.name}
                          </Typography>
                        </Grid>
                        {invoice.customer.email && (
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>Email:</strong> {invoice.customer.email}
                            </Typography>
                          </Grid>
                        )}
                        {invoice.customer.phone && (
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>Phone:</strong> {invoice.customer.phone}
                            </Typography>
                          </Grid>
                        )}
                        {invoice.customer.gstNumber && (
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>GST Number:</strong> {invoice.customer.gstNumber}
                            </Typography>
                          </Grid>
                        )}
                        {(invoice.customer.address.street || invoice.customer.address.city) && (
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>Address:</strong> {[
                                invoice.customer.address.street,
                                invoice.customer.address.city,
                                invoice.customer.address.state,
                                invoice.customer.address.zipCode
                              ].filter(Boolean).join(', ')}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                  
                  {loadingCustomers && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Loading customers...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </SectionCard>
          </Grid>
        </Grid>

        {/* Items Section */}
        <SectionCard sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <SectionHeader variant="h6">🏗️ Steel Items</SectionHeader>
              <Button 
                onClick={addItem} 
                variant="contained" 
                startIcon={<Plus size={18} />}
                sx={{ borderRadius: 2 }}
              >
                Add Item
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Specification</TableCell>
                    <TableCell>HSN Code</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>GST %</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="e.g., MS Round Bar"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.specification}
                          onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                          placeholder="e.g., 12mm dia"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                          placeholder="HSN Code"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          >
                            {STEEL_UNITS.map(unit => (
                              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(item.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => removeItem(index)}
                          disabled={invoice.items.length === 1}
                          color="error"
                          size="small"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </SectionCard>

        {/* Summary and Notes */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SectionCard>
              <CardContent>
                <SectionHeader variant="h6">📝 Notes</SectionHeader>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={invoice.notes}
                  onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  variant="outlined"
                />
              </CardContent>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard>
              <CardContent>
                <SectionHeader variant="h6">💰 Invoice Summary</SectionHeader>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">GST Amount:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatCurrency(invoice.gstAmount)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatCurrency(invoice.total)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </SectionCard>
          </Grid>
        </Grid>

        {/* Terms & Conditions */}
        <SectionCard sx={{ mt: 3 }}>
          <CardContent>
            <SectionHeader variant="h6">📋 Terms & Conditions</SectionHeader>
            <TextField
              multiline
              rows={3}
              fullWidth
              value={invoice.terms}
              onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="Payment terms and conditions..."
              variant="outlined"
            />
          </CardContent>
        </SectionCard>
      </InvoiceFormPaper>
    </InvoiceContainer>
  );
};

export default InvoiceForm;