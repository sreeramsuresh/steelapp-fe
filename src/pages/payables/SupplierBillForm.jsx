import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, Save, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import supplierBillService from '../../services/supplierBillService';
import { suppliersAPI, purchaseOrderService } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// UAE Emirates for place of supply
const EMIRATES = [
  { value: 'AE-AZ', label: 'Abu Dhabi' },
  { value: 'AE-DU', label: 'Dubai' },
  { value: 'AE-SH', label: 'Sharjah' },
  { value: 'AE-AJ', label: 'Ajman' },
  { value: 'AE-UQ', label: 'Umm Al Quwain' },
  { value: 'AE-RK', label: 'Ras Al Khaimah' },
  { value: 'AE-FU', label: 'Fujairah' },
];

// VAT Categories (from proto)
const VAT_CATEGORIES = [
  { value: 'STANDARD_RATED', label: 'Standard Rated (5%)', rate: 5 },
  { value: 'ZERO_RATED', label: 'Zero Rated (0%)', rate: 0 },
  { value: 'EXEMPT', label: 'Exempt', rate: 0 },
  { value: 'OUT_OF_SCOPE', label: 'Out of Scope', rate: 0 },
  { value: 'REVERSE_CHARGE', label: 'Reverse Charge', rate: 5 },
  { value: 'BLOCKED', label: 'Blocked (Non-Recoverable)', rate: 5 },
];

// Supplier Bill Status (from proto)
const SUPPLIER_BILL_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DISPUTED', label: 'Disputed' },
];

// Currencies
const CURRENCIES = [
  { value: 'AED', label: 'AED' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'INR', label: 'INR' },
];

// Units of measure
const UNITS = [
  { value: 'PCS', label: 'PCS' },
  { value: 'MT', label: 'MT' },
  { value: 'KG', label: 'KG' },
  { value: 'M', label: 'M' },
  { value: 'SQM', label: 'SQM' },
  { value: 'BOX', label: 'BOX' },
];

// Blocked VAT Reasons (from proto)
const BLOCKED_VAT_REASONS = [
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EMPLOYEE_BENEFITS', label: 'Employee Benefits' },
  { value: 'MOTOR_VEHICLE', label: 'Motor Vehicle' },
  { value: 'NON_BUSINESS', label: 'Non-Business' },
  { value: 'MISSING_DOCUMENTATION', label: 'Missing Documentation' },
  { value: 'OTHER_BLOCKED', label: 'Other' },
];

// Empty item template
const createEmptyItem = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  productId: null,
  productName: '',
  description: '',
  quantity: 1,
  unit: 'PCS',
  unitPrice: 0,
  amount: 0,
  vatRate: 5,
  vatAmount: 0,
  vatCategory: 'STANDARD_RATED',
  isBlockedVat: false,
  blockedReason: '',
  costCenter: '',
  glAccount: '',
});

/**
 * SupplierBillForm - Modal form for create/edit supplier bills (Phase 2c)
 * Follows ContainerForm pattern with accordion sections
 */
export function SupplierBillForm({ supplierBill, companyId, onSave, onClose }) {
  const { isDarkMode } = useTheme();
  const isEditing = Boolean(supplierBill?.id);

  const [formData, setFormData] = useState({
    billNumber: '',
    vendorInvoiceNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    supplierTrn: '',
    supplierAddress: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    purchaseOrderNumber: '',
    purchaseOrderId: '',
    importOrderId: '',
    placeOfSupply: 'AE-DU',
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    primaryVatCategory: 'STANDARD_RATED',
    standardRatedAmount: 0,
    standardRatedVat: 0,
    zeroRatedAmount: 0,
    exemptAmount: 0,
    blockedVatAmount: 0,
    recoverableVat: 0,
    isReverseCharge: false,
    reverseChargeVat: 0,
    currency: 'AED',
    exchangeRate: 1,
    totalAed: 0,
    attachmentUrl: '',
    status: 'DRAFT',
    approvalNotes: '',
    notes: '',
    internalNotes: '',
    items: [createEmptyItem()],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load suppliers, purchase orders, and products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [suppliersRes, posRes] = await Promise.all([
          suppliersAPI.getAll(),
          purchaseOrderService.getAll({ companyId }),
        ]);
        setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : []);
        const poArray = posRes?.purchaseOrders || posRes;
        setPurchaseOrders(Array.isArray(poArray) ? poArray : []);
      } catch (err) {
        console.error('Failed to load form data:', err);
        setSuppliers([]);
        setPurchaseOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  // Auto-calculate due date (30 days from bill date)
  useEffect(() => {
    if (formData.billDate && !isEditing) {
      const billDate = new Date(formData.billDate);
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData((prev) => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.billDate, isEditing]);

  // Auto-calculate item amounts and VAT breakdown
  useEffect(() => {
    let subtotal = 0;
    let totalVatAmount = 0;
    let standardRatedAmount = 0;
    let standardRatedVat = 0;
    let zeroRatedAmount = 0;
    let exemptAmount = 0;
    let blockedVatAmount = 0;

    formData.items.forEach((item) => {
      const amount = item.quantity * item.unitPrice;
      const vatAmount = (amount * item.vatRate) / 100;
      subtotal += amount;
      totalVatAmount += vatAmount;

      // Categorize by VAT type
      if (item.vatCategory === 'STANDARD_RATED') {
        standardRatedAmount += amount;
        standardRatedVat += vatAmount;
      } else if (item.vatCategory === 'ZERO_RATED') {
        zeroRatedAmount += amount;
      } else if (item.vatCategory === 'EXEMPT') {
        exemptAmount += amount;
      }

      if (item.isBlockedVat) {
        blockedVatAmount += vatAmount;
      }
    });

    const recoverableVat = totalVatAmount - blockedVatAmount;
    const reverseChargeVat = formData.isReverseCharge ? totalVatAmount : 0;
    const total = subtotal + totalVatAmount;
    const totalAed =
      formData.currency === 'AED' ? total : total * formData.exchangeRate;

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vatAmount: parseFloat(totalVatAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      standardRatedAmount: parseFloat(standardRatedAmount.toFixed(2)),
      standardRatedVat: parseFloat(standardRatedVat.toFixed(2)),
      zeroRatedAmount: parseFloat(zeroRatedAmount.toFixed(2)),
      exemptAmount: parseFloat(exemptAmount.toFixed(2)),
      blockedVatAmount: parseFloat(blockedVatAmount.toFixed(2)),
      recoverableVat: parseFloat(recoverableVat.toFixed(2)),
      reverseChargeVat: parseFloat(reverseChargeVat.toFixed(2)),
      totalAed: parseFloat(totalAed.toFixed(2)),
    }));
  }, [
    formData.items,
    formData.isReverseCharge,
    formData.currency,
    formData.exchangeRate,
  ]);

  // Populate form when editing
  useEffect(() => {
    if (supplierBill) {
      setFormData({
        billNumber: supplierBill.billNumber || '',
        vendorInvoiceNumber: supplierBill.vendorInvoiceNumber || '',
        receivedDate: supplierBill.receivedDate?.split('T')[0] || '',
        supplierId: supplierBill.supplierId?.toString() || '',
        supplierName: supplierBill.supplierName || '',
        supplierTrn: supplierBill.supplierTrn || '',
        supplierAddress: supplierBill.supplierAddress || '',
        billDate: supplierBill.billDate?.split('T')[0] || '',
        dueDate: supplierBill.dueDate?.split('T')[0] || '',
        purchaseOrderNumber: supplierBill.purchaseOrderNumber || '',
        purchaseOrderId: supplierBill.purchaseOrderId?.toString() || '',
        importOrderId: supplierBill.importOrderId?.toString() || '',
        placeOfSupply: supplierBill.placeOfSupply || 'AE-DU',
        subtotal: supplierBill.subtotal || 0,
        vatAmount: supplierBill.vatAmount || 0,
        total: supplierBill.total || 0,
        primaryVatCategory: supplierBill.primaryVatCategory || 'STANDARD_RATED',
        standardRatedAmount: supplierBill.standardRatedAmount || 0,
        standardRatedVat: supplierBill.standardRatedVat || 0,
        zeroRatedAmount: supplierBill.zeroRatedAmount || 0,
        exemptAmount: supplierBill.exemptAmount || 0,
        blockedVatAmount: supplierBill.blockedVatAmount || 0,
        recoverableVat: supplierBill.recoverableVat || 0,
        isReverseCharge: supplierBill.isReverseCharge || false,
        reverseChargeVat: supplierBill.reverseChargeVat || 0,
        currency: supplierBill.currency || 'AED',
        exchangeRate: supplierBill.exchangeRate || 1,
        totalAed: supplierBill.totalAed || 0,
        attachmentUrl: supplierBill.attachmentUrl || '',
        status: supplierBill.status || 'DRAFT',
        approvalNotes: supplierBill.approvalNotes || '',
        notes: supplierBill.notes || '',
        internalNotes: supplierBill.internalNotes || '',
        items:
          supplierBill.items && supplierBill.items.length > 0
            ? supplierBill.items
            : [createEmptyItem()],
      });
    }
  }, [supplierBill]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle supplier selection
  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find((s) => s.id.toString() === supplierId);
    if (supplier) {
      setFormData((prev) => ({
        ...prev,
        supplierId,
        supplierName: supplier.name || '',
        supplierTrn: supplier.trnNumber || '',
        supplierAddress: supplier.address || '',
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate amount and VAT
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
        newItems[index].amount = quantity * unitPrice;
        newItems[index].vatAmount =
          (newItems[index].amount * newItems[index].vatRate) / 100;
      }

      if (field === 'vatRate') {
        newItems[index].vatAmount =
          (newItems[index].amount * parseFloat(value)) / 100;
      }

      if (field === 'vatCategory') {
        const category = VAT_CATEGORIES.find((c) => c.value === value);
        if (category) {
          newItems[index].vatRate = category.rate;
          newItems[index].vatAmount =
            (newItems[index].amount * category.rate) / 100;
        }
      }

      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      setError('At least one item is required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.vendorInvoiceNumber.trim()) {
      errors.vendorInvoiceNumber = 'Vendor invoice number is required';
    }
    if (!formData.supplierId) {
      errors.supplierId = 'Supplier is required';
    }
    if (!formData.billDate) {
      errors.billDate = 'Bill date is required';
    }
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
    }
    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    }
    if (formData.total <= 0) {
      errors.total = 'Total must be greater than zero';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        companyId,
        vendorInvoiceNumber: formData.vendorInvoiceNumber.trim(),
        receivedDate: formData.receivedDate || null,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        billDate: formData.billDate || null,
        dueDate: formData.dueDate || null,
        purchaseOrderNumber: formData.purchaseOrderNumber.trim(),
        purchaseOrderId: formData.purchaseOrderId
          ? parseInt(formData.purchaseOrderId)
          : null,
        importOrderId: formData.importOrderId
          ? parseInt(formData.importOrderId)
          : null,
        placeOfSupply: formData.placeOfSupply,
        primaryVatCategory: formData.primaryVatCategory,
        isReverseCharge: formData.isReverseCharge,
        currency: formData.currency,
        exchangeRate: parseFloat(formData.exchangeRate),
        attachmentUrl: formData.attachmentUrl.trim(),
        status: formData.status,
        approvalNotes: formData.approvalNotes.trim(),
        notes: formData.notes.trim(),
        internalNotes: formData.internalNotes.trim(),
        items: formData.items.map((item) => ({
          productId: item.productId ? parseInt(item.productId) : null,
          productName: item.productName.trim(),
          description: item.description.trim(),
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: parseFloat(item.unitPrice),
          vatRate: parseFloat(item.vatRate),
          vatCategory: item.vatCategory,
          isBlockedVat: item.isBlockedVat,
          blockedReason: item.blockedReason,
          costCenter: item.costCenter.trim(),
          glAccount: item.glAccount.trim(),
        })),
      };

      let result;
      if (isEditing) {
        result = await supplierBillService.updateSupplierBill(
          supplierBill.id,
          payload,
        );
      } else {
        result = await supplierBillService.createSupplierBill(payload);
      }

      onSave(result);
    } catch (err) {
      console.error('Failed to save supplier bill:', err);
      setError(err.message || 'Failed to save supplier bill');
    } finally {
      setSaving(false);
    }
  };

  // CSS classes for consistent styling
  const labelClass = `text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className={`p-8 rounded-xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'}`}
        >
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ${
          isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${
            isDarkMode
              ? 'bg-[#1E2328] border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Supplier Bill' : 'Create Supplier Bill'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${
              isDarkMode ? 'hover:bg-gray-700' : ''
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Bill Identification - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Bill Identification
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>
                    Bill Number {isEditing && '(readonly)'}
                  </Label>
                  <Input
                    value={formData.billNumber}
                    disabled={true}
                    placeholder="Auto-generated"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Vendor Invoice Number{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="vendorInvoiceNumber"
                    data-testid="vendor-invoice-number"
                    value={formData.vendorInvoiceNumber}
                    onChange={(e) =>
                      handleChange('vendorInvoiceNumber', e.target.value)
                    }
                    placeholder="Supplier's invoice number"
                    className={inputClass}
                  />
                  {validationErrors.vendorInvoiceNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.vendorInvoiceNumber}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Received Date</Label>
                  <Input
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) =>
                      handleChange('receivedDate', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Supplier Details - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Supplier Details
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className={labelClass}>
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={handleSupplierChange}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.id.toString()}
                        >
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.supplierId && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.supplierId}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Supplier Name</Label>
                  <Input
                    value={formData.supplierName}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Supplier TRN</Label>
                  <Input
                    value={formData.supplierTrn}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className={labelClass}>Supplier Address</Label>
                  <Input
                    value={formData.supplierAddress}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Purchase Order</Label>
                  <Select
                    value={formData.purchaseOrderId}
                    onValueChange={(value) =>
                      handleChange('purchaseOrderId', value)
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select PO (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((po) => (
                        <SelectItem key={po.id} value={po.id.toString()}>
                          {po.poNumber || po.po_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </details>

          {/* Dates & References - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Dates & References
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>
                    Bill Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="billDate"
                    data-testid="bill-date"
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => handleChange('billDate', e.target.value)}
                    className={inputClass}
                  />
                  {validationErrors.billDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.billDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="dueDate"
                    data-testid="due-date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    className={inputClass}
                  />
                  {validationErrors.dueDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.dueDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Purchase Order Number</Label>
                  <Input
                    value={formData.purchaseOrderNumber}
                    onChange={(e) =>
                      handleChange('purchaseOrderNumber', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Import Order ID</Label>
                  <Input
                    type="number"
                    value={formData.importOrderId}
                    onChange={(e) =>
                      handleChange('importOrderId', e.target.value)
                    }
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Place of Supply</Label>
                  <Select
                    value={formData.placeOfSupply}
                    onValueChange={(value) =>
                      handleChange('placeOfSupply', value)
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMIRATES.map((emirate) => (
                        <SelectItem key={emirate.value} value={emirate.value}>
                          {emirate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </details>

          {/* Bill Items - Expanded by default */}
          <details open className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Bill Items
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <Label className={labelClass}>Product Name</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) =>
                          handleItemChange(index, 'productName', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className={labelClass}>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Unit</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(value) =>
                          handleItemChange(index, 'unit', value)
                        }
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={labelClass}>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>VAT Category</Label>
                      <Select
                        value={item.vatCategory}
                        onValueChange={(value) =>
                          handleItemChange(index, 'vatCategory', value)
                        }
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VAT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={labelClass}>VAT Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.vatRate}
                        onChange={(e) =>
                          handleItemChange(index, 'vatRate', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Amount (readonly)</Label>
                      <Input
                        value={item.amount.toFixed(2)}
                        disabled
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>
                        VAT Amount (readonly)
                      </Label>
                      <Input
                        value={item.vatAmount.toFixed(2)}
                        disabled
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={item.isBlockedVat}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'isBlockedVat',
                            e.target.checked,
                          )
                        }
                      />
                      <span className="text-sm">Blocked VAT</span>
                    </div>
                    {item.isBlockedVat && (
                      <div className="md:col-span-2">
                        <Label className={labelClass}>Blocked Reason</Label>
                        <Select
                          value={item.blockedReason}
                          onValueChange={(value) =>
                            handleItemChange(index, 'blockedReason', value)
                          }
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOCKED_VAT_REASONS.map((reason) => (
                              <SelectItem
                                key={reason.value}
                                value={reason.value}
                              >
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label className={labelClass}>Cost Center</Label>
                      <Input
                        value={item.costCenter}
                        onChange={(e) =>
                          handleItemChange(index, 'costCenter', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>GL Account</Label>
                      <Input
                        value={item.glAccount}
                        onChange={(e) =>
                          handleItemChange(index, 'glAccount', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </details>

          {/* VAT Breakdown - Expanded */}
          <details open className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                VAT Breakdown
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Primary VAT Category</Label>
                  <Select
                    value={formData.primaryVatCategory}
                    onValueChange={(value) =>
                      handleChange('primaryVatCategory', value)
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>
                    Standard Rated Amount (readonly)
                  </Label>
                  <Input
                    value={formData.standardRatedAmount.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Standard Rated VAT (readonly)
                  </Label>
                  <Input
                    value={formData.standardRatedVat.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Zero Rated Amount (readonly)
                  </Label>
                  <Input
                    value={formData.zeroRatedAmount.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Exempt Amount (readonly)</Label>
                  <Input
                    value={formData.exemptAmount.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Blocked VAT Amount (readonly)
                  </Label>
                  <Input
                    value={formData.blockedVatAmount.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Recoverable VAT (readonly)
                  </Label>
                  <Input
                    value={formData.recoverableVat.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Financial Summary - Expanded */}
          <details open className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Financial Summary
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Subtotal (readonly)</Label>
                  <Input
                    data-testid="subtotal"
                    value={formData.subtotal.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Total VAT (readonly)</Label>
                  <Input
                    data-testid="vat-amount"
                    value={formData.vatAmount.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Total (readonly)</Label>
                  <Input
                    data-testid="total"
                    value={formData.total.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.isReverseCharge}
                    onChange={(e) =>
                      handleChange('isReverseCharge', e.target.checked)
                    }
                  />
                  <span className="text-sm font-medium">
                    Reverse Charge (Import)
                  </span>
                </div>
                {formData.isReverseCharge && (
                  <div>
                    <Label className={labelClass}>
                      Reverse Charge VAT (readonly)
                    </Label>
                    <Input
                      value={formData.reverseChargeVat.toFixed(2)}
                      disabled
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
              {formData.currency !== 'AED' && (
                <div>
                  <Label className={labelClass}>Total AED (readonly)</Label>
                  <Input
                    value={formData.totalAed.toFixed(2)}
                    disabled
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </details>

          {/* Currency & Exchange - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Currency & Exchange
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.exchangeRate}
                    onChange={(e) =>
                      handleChange('exchangeRate', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Attachments - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Attachments
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div>
                <Label className={labelClass}>Attachment URL</Label>
                <Input
                  value={formData.attachmentUrl}
                  onChange={(e) =>
                    handleChange('attachmentUrl', e.target.value)
                  }
                  placeholder="URL or file path"
                  className={inputClass}
                />
              </div>
            </div>
          </details>

          {/* Approval Workflow - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Approval & Status
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_BILL_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Approval Notes</Label>
                  <Textarea
                    value={formData.approvalNotes}
                    onChange={(e) =>
                      handleChange('approvalNotes', e.target.value)
                    }
                    className={inputClass}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Notes - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Notes
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div>
                <Label className={labelClass}>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Public notes"
                  className={inputClass}
                  rows={3}
                />
              </div>
              <div>
                <Label className={labelClass}>Internal Notes</Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={(e) =>
                    handleChange('internalNotes', e.target.value)
                  }
                  placeholder="Internal notes (not visible to vendor)"
                  className={inputClass}
                  rows={3}
                />
              </div>
            </div>
          </details>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

SupplierBillForm.propTypes = {
  supplierBill: PropTypes.object,
  companyId: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
