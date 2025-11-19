import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Truck, Plus, Minus, X, AlertCircle, ChevronDown, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validation state - MANDATORY for all forms
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

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
        delivery_note_number: deliveryNote.deliveryNoteNumber,
        invoice_id: deliveryNote.invoiceId,
        delivery_date: deliveryNote.deliveryDate,
        delivery_address: deliveryNote.deliveryAddress || {
          street: '',
          city: '',
          po_box: ''
        },
        vehicle_number: deliveryNote.vehicleNumber || '',
        driver_name: deliveryNote.driverName || '',
        driver_phone: deliveryNote.driverPhone || '',
        notes: deliveryNote.notes || '',
        items: deliveryNote.items || []
      });

      // Load the related invoice
      if (deliveryNote.invoiceId) {
        const invoice = await invoicesAPI.getById(deliveryNote.invoiceId);
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
        delivery_note_number: response.nextDeliveryNoteNumber
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
        delivery_address: invoice.customerDetails?.address || prev.deliveryAddress,
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
      updatedItems[index].remainingQuantity = 
        updatedItems[index].orderedQuantity - numValue;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleSubmit = async () => {
    // STEP 1: Validate all required fields
    const errors = [];
    const invalidFieldsSet = new Set();

    // Delivery note number validation
    if (!formData.deliveryNoteNumber || formData.deliveryNoteNumber.trim() === '') {
      errors.push('Delivery note number is required');
      invalidFieldsSet.add('delivery_note_number');
    }

    // Invoice selection validation
    if (!formData.invoiceId) {
      errors.push('Please select an invoice');
      invalidFieldsSet.add('invoice_id');
    }

    // Delivery date validation
    if (!formData.deliveryDate) {
      errors.push('Delivery date is required');
      invalidFieldsSet.add('delivery_date');
    }

    // Vehicle number validation (optional but recommended)
    if (!formData.vehicleNumber || formData.vehicleNumber.trim() === '') {
      errors.push('Vehicle number is required');
      invalidFieldsSet.add('vehicle_number');
    }

    // Driver name validation (optional but recommended)
    if (!formData.driverName || formData.driverName.trim() === '') {
      errors.push('Driver name is required');
      invalidFieldsSet.add('driver_name');
    }

    // Items validation
    if (!formData.items || formData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      formData.items.forEach((item, index) => {
        if (!item.deliveredQuantity || item.deliveredQuantity <= 0) {
          errors.push(`Item ${index + 1}: Delivered quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.deliveredQuantity`);
        }
        if (item.deliveredQuantity > item.orderedQuantity) {
          errors.push(`Item ${index + 1}: Delivered quantity cannot exceed ordered quantity (${item.orderedQuantity})`);
          invalidFieldsSet.add(`item.${index}.deliveredQuantity`);
        }
      });
    }

    // If errors exist, show them and STOP
    if (errors.length > 0) {
      setValidationErrors(errors);
      setInvalidFields(invalidFieldsSet);

      // Auto-scroll to error alert
      setTimeout(() => {
        const errorAlert = document.getElementById('validation-errors-alert');
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, 100);

      return; // STOP - do not proceed with save
    }

    // STEP 2: Clear any previous errors
    setValidationErrors([]);
    setInvalidFields(new Set());

    // STEP 3: Proceed with save operation
    setIsSaving(true);

    try {

      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          invoice_item_id: item.invoiceItemId,
          delivered_quantity: item.deliveredQuantity
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
      setIsSaving(false);
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
                  value={formData.deliveryNoteNumber}
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
                  value={formData.deliveryDate}
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
                    value={selectedInvoice ? `${selectedInvoice.invoiceNumber} - ${selectedInvoice.customerDetails?.name}` : ''}
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
                  value={formData.deliveryAddress.street}
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
                    value={formData.deliveryAddress.city}
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
                    value={formData.deliveryAddress.poBox}
                    onChange={(e) => handleInputChange('delivery_address.poBox', e.target.value)}
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Specification</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ordered Qty</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Deliver Qty</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                        <td className="px-4 py-3">
                          <span className="font-medium">{item.name}</span>
                        </td>
                        <td className="px-4 py-3">{item.specification || '-'}</td>
                        <td className="px-4 py-3">{item.unit}</td>
                        <td className="px-4 py-3 text-right">{item.orderedQuantity}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={item.deliveredQuantity || ''}
                            onChange={(e) => handleItemQuantityChange(index, 'delivered_quantity', e.target.value)}
                            min={0}
                            max={item.orderedQuantity}
                            step={0.01}
                            className={`w-24 px-2 py-1 border rounded ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          />
                        </td>
                        <td className={`px-4 py-3 text-right ${item.remainingQuantity === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {item.remainingQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  value={formData.vehicleNumber}
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
                  value={formData.driverName}
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
                  value={formData.driverPhone}
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

          {/* Validation Errors Alert - MANDATORY */}
          {validationErrors.length > 0 && (
            <div
              id="validation-errors-alert"
              className={`mb-6 p-4 rounded-lg border-2 ${
                isDarkMode
                  ? "bg-red-900/20 border-red-600 text-red-200"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`} size={24} />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setValidationErrors([]);
                      setInvalidFields(new Set());
                    }}
                    className={`mt-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isDarkMode
                        ? "bg-red-800 hover:bg-red-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSaving || !selectedInvoice}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md mb-4 ${
              (isSaving || !selectedInvoice) ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                {isEdit ? 'Update Delivery Note' : 'Create Delivery Note'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Selection Dialog removed during UI de-MUI cleanup */}

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
