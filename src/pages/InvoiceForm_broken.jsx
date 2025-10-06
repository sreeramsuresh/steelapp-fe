import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Eye, Download } from 'lucide-react';
import { createInvoice, createCompany, createSteelItem, STEEL_UNITS } from '../types';
import { 
  generateInvoiceNumber, 
  calculateItemAmount, 
  calculateSubtotal, 
  calculateTotalTRN, 
  calculateTotal,
  formatCurrency 
} from '../utils/invoiceUtils';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import InvoicePreview from '../components/InvoicePreview';
import { invoiceService, companyService } from '../services';
import { useApiData, useApi } from '../hooks/useApi';

const InvoiceForm = ({ onSave, existingInvoice }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoice, setInvoice] = useState(() => {
    if (existingInvoice) {
      return existingInvoice;
    }
    
    const newInvoice = createInvoice();
    newInvoice.invoiceNumber = generateInvoiceNumber();
    return newInvoice;
  });

  const { data: company, loading: loadingCompany } = useApiData(companyService.getCompany, [], true);
  const { execute: saveInvoice, loading: savingInvoice } = useApi(invoiceService.createInvoice);
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(invoiceService.updateInvoice);
  const { data: nextInvoiceData } = useApiData(() => invoiceService.getNextInvoiceNumber(), [], !existingInvoice);

  useEffect(() => {
    const subtotal = calculateSubtotal(invoice.items);
    const vatAmount = calculateTotalTRN(invoice.items);
    const total = calculateTotal(subtotal, vatAmount);
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      vatAmount,
      total
    }));
  }, [invoice.items]);

  useEffect(() => {
    if (nextInvoiceData && nextInvoiceData.nextNumber && !existingInvoice) {
      setInvoice(prev => ({
        ...prev,
        invoiceNumber: nextInvoiceData.nextNumber
      }));
    }
  }, [nextInvoiceData, existingInvoice]);

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
      if (existingInvoice) {
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

  return (
    <div className="content-wrapper">
      {/* Header Section */}
      <div className="card mb-3">
        <div className="card-header">
          <div>
            <h1 className="card-title">{existingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h1>
            <p className="card-subtitle">{company?.name || 'Steel Invoice Pro'} - Invoice Management</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              onClick={() => {
                if (!company) {
                  alert('Company data is still loading. Please wait...');
                  return;
                }
                setShowPreview(true);
              }}
              className="btn btn-secondary"
              disabled={loadingCompany}
            >
              <Eye size={18} />
              Preview
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="btn btn-secondary"
              disabled={isGeneratingPDF || loadingCompany}
            >
              {isGeneratingPDF ? (
                <div className="loading-spinner"></div>
              ) : (
                <Download size={18} />
              )}
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button 
              onClick={handleSave}
              className="btn btn-primary"
              disabled={savingInvoice || updatingInvoice}
            >
              {(savingInvoice || updatingInvoice) ? (
                <div className="loading-spinner"></div>
              ) : (
                <Save size={18} />
              )}
              {savingInvoice || updatingInvoice ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Form Fields Section */}
      <div className="dashboard-row">
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Invoice Details</h3>
            </div>
            <div style={{ padding: 'var(--spacing-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  />
                </div>
                <div className="dashboard-row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={invoice.date}
                        onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={invoice.dueDate}
                        onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Customer Details</h3>
              </div>
              <div style={{ padding: 'var(--spacing-lg)' }}>
                <div className="dashboard-row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={invoice.customer.name}
                        onChange={(e) => handleCustomerChange('name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">TRN Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={invoice.customer.gstNumber}
                        onChange={(e) => handleCustomerChange('gstNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="dashboard-row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={invoice.customer.email}
                        onChange={(e) => handleCustomerChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={invoice.customer.phone}
                        onChange={(e) => handleCustomerChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Street Address"
                    value={invoice.customer.address.street}
                    onChange={(e) => handleCustomerChange('address.street', e.target.value)}
                  />
                </div>
                <div className="dashboard-row">
                  <div className="col-4">
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City"
                        value={invoice.customer.address.city}
                        onChange={(e) => handleCustomerChange('address.city', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="State"
                        value={invoice.customer.address.state}
                        onChange={(e) => handleCustomerChange('address.state', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ZIP Code"
                        value={invoice.customer.address.zipCode}
                        onChange={(e) => handleCustomerChange('address.zipCode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Steel Items</h3>
            <button onClick={addItem} className="btn btn-primary">
              <Plus size={18} />
              Add Item
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Specification</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>VAT %</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="e.g., MS Round Bar"
                        style={{ minWidth: '150px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={item.specification}
                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        placeholder="e.g., 12mm dia"
                        style={{ minWidth: '120px' }}
                      />
                    </td>
                    <td>
                      <select
                        className="form-input"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        style={{ width: '80px' }}
                      >
                        {STEEL_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        style={{ width: '80px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={item.vatRate}
                        onChange={(e) => handleItemChange(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        style={{ width: '70px' }}
                      />
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td>
                      <button
                        onClick={() => removeItem(index)}
                        className="btn btn-sm btn-danger"
                        disabled={invoice.items.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="col-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Additional Information</h3>
              </div>
              <div style={{ padding: 'var(--spacing-lg)' }}>
                <div className="dashboard-row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-input"
                        value={invoice.notes}
                        onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows="4"
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Terms & Conditions</label>
                      <textarea
                        className="form-input"
                        value={invoice.terms}
                        onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                        placeholder="Payment terms..."
                        rows="4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Invoice Summary</h3>
              </div>
              <div style={{ padding: 'var(--spacing-lg)' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>VAT Amount:</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(invoice.vatAmount)}</span>
                </div>
                <hr style={{ border: '1px solid var(--border-primary)', margin: 'var(--spacing-md) 0' }} />
                <div className="d-flex justify-content-between">
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Total:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
