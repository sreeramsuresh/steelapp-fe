import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Truck, Plus, Minus, X, AlertCircle, ChevronDown, CheckCircle } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { deliveryNotesAPI, invoicesAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/invoiceUtils';

const DeliveryNoteForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { isDarkMode } = useTheme();
  
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
    <div className={`p-6 ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/delivery-notes')}
          className={`p-2 rounded-lg mr-4 transition-colors ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Truck size={32} className="text-teal-600" />
          {isEdit ? 'Edit Delivery Note' : 'Create Delivery Note'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <div className={`p-6 mb-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Delivery Note Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.delivery_note_number}
                  onChange={(e) => handleInputChange('delivery_note_number', e.target.value)}
                  required
                  disabled={isEdit}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Selected Invoice <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedInvoice ? `${selectedInvoice.invoice_number} - ${selectedInvoice.customer_details?.name}` : ''}
                    readOnly
                    required
                    className={`flex-grow px-4 py-3 border rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } cursor-not-allowed`}
                  />
                  <button
                    onClick={() => setShowInvoiceDialog(true)}
                    disabled={isEdit}
                    className={`px-4 py-3 border rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                    } ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Select Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className={`p-6 mb-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Delivery Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.delivery_address.street}
                  onChange={(e) => handleInputChange('delivery_address.street', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_address.city}
                    onChange={(e) => handleInputChange('delivery_address.city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PO Box
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_address.po_box}
                    onChange={(e) => handleInputChange('delivery_address.po_box', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items - temporarily commented out to fix syntax error */}
          {formData.items.length > 0 && (
            <div className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Items for Delivery
              </h2>
              {/* Table content will be converted later */}
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
              {/* Table placeholder */}
            </div>
          )}
        </div>

        {/* Delivery Details - Right Column */}
        <div className="md:col-span-1">
          <div className={`p-6 mb-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Transport Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicle_number}
                  onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                  placeholder="e.g., MH-01-AB-1234"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Driver Name
                </label>
                <input
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => handleInputChange('driver_name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Driver Phone
                </label>
                <input
                  type="tel"
                  value={formData.driver_phone}
                  onChange={(e) => handleInputChange('driver_phone', e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`p-6 mb-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Notes
            </h2>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special instructions, handling notes, etc."
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !selectedInvoice}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md mb-4 ${
              (loading || !selectedInvoice) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save size={20} />
            {loading ? 'Saving...' : (isEdit ? 'Update Delivery Note' : 'Create Delivery Note')}
          </button>
        </div>
      </div>

      {/* Invoice Selection Dialog - Temporarily disabled for conversion
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
      */}

      {/* Success/Error Notifications - will be converted later */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg border shadow-lg ${
            isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg border shadow-lg ${
            isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNoteForm;