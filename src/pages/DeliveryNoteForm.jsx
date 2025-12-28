import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  ArrowLeft,
  Truck,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Package,
  MapPin,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { deliveryNoteService } from '../services/deliveryNoteService';
import { invoicesAPI } from '../services/api';
import {
  formatDateForInput,
  validateWeightTolerance,
  calculateWeightVariance,
} from '../utils/invoiceUtils';
import DeliveryNotePreview from '../components/delivery-notes/DeliveryNotePreview';
import AllocationPanel from '../components/invoice/AllocationPanel';

// ==================== DESIGN TOKENS ====================
// const COLORS = {
//   bg: '#0b0f14',
//   card: '#141a20',
//   border: '#2a3640',
//   text: '#e6edf3',
//   muted: '#93a4b4',
//   good: '#2ecc71',
//   warn: '#f39c12',
//   bad: '#e74c3c',
//   accent: '#4aa3ff',
//   accentHover: '#5bb2ff',
//   inputBg: '#0f151b',
// };

// Layout classes (use with isDarkMode ternary)
const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? 'bg-[#141a20] border-[#2a3640]' : 'bg-white border-gray-200'} border rounded-2xl p-4`;

const INPUT_CLASSES = (isDarkMode) =>
  `w-full ${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3]' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl py-2.5 px-3 text-[13px] outline-none focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20`;

const LABEL_CLASSES = (isDarkMode) =>
  `block text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'} mb-1.5`;

const BTN_CLASSES = (isDarkMode) =>
  `${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]' : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'} border rounded-xl py-2.5 px-3 text-[13px] cursor-pointer transition-colors`;

const BTN_PRIMARY =
  'bg-[#4aa3ff] border-transparent text-[#001018] font-extrabold hover:bg-[#5bb2ff] rounded-xl py-2.5 px-3 text-[13px] cursor-pointer';

const QUICK_LINK_CLASSES = (isDarkMode) =>
  `flex items-center gap-2 py-2 px-2.5 ${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3]' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-[10px] cursor-pointer text-[13px] transition-colors hover:border-[#4aa3ff] hover:text-[#4aa3ff]`;

const DIVIDER_CLASSES = (isDarkMode) =>
  `h-px ${isDarkMode ? 'bg-[#2a3640]' : 'bg-gray-200'} my-3`;

// ==================== COMPONENT ====================
const DeliveryNoteForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { isDarkMode } = useTheme();

  // Check if invoice was pre-selected from InvoiceList
  const preSelectedInvoiceId = location.state?.selectedInvoiceId;

  const [_loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validation state - MANDATORY for all forms
  const [validationErrors, setValidationErrors] = useState([]);
  const [_invalidFields, setInvalidFields] = useState(new Set());

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  // Drawer states
  const [showDeliveryAddressDrawer, setShowDeliveryAddressDrawer] =
    useState(false);
  const [showTransportDrawer, setShowTransportDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  // Form data - use camelCase for state (API Gateway handles conversion)
  const [formData, setFormData] = useState({
    deliveryNoteNumber: '',
    invoiceId: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    // Phase 4: GRN dates
    goodsReceiptDate: new Date().toISOString().split('T')[0],
    inspectionDate: new Date().toISOString().split('T')[0],
    deliveryAddress: {
      street: '',
      city: '',
      poBox: '',
    },
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    notes: '',
    items: [],
    stockDeducted: false,
    stockDeductedAt: null,
  });

  // Expanded item state for showing allocation details
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Invoice selection
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Define handleInvoiceSelect BEFORE the useEffect that uses it
  const handleInvoiceSelect = useCallback(
    async (invoice) => {
      if (!invoice) return;

      try {
        setSelectedInvoice(invoice);

        // Parse address if string
        let invoiceAddress = invoice.customerDetails?.address || {};
        if (typeof invoiceAddress === 'string') {
          try {
            invoiceAddress = JSON.parse(invoiceAddress);
          } catch {
            invoiceAddress = { street: invoiceAddress };
          }
        }

        setFormData((prev) => ({
          ...prev,
          invoiceId: invoice.id,
          deliveryAddress: {
            street: invoiceAddress.street || prev.deliveryAddress.street,
            city: invoiceAddress.city || prev.deliveryAddress.city,
            poBox:
              invoiceAddress.poBox ||
              invoiceAddress.po_box ||
              prev.deliveryAddress.poBox,
          },
          items:
            invoice.items?.map((item) => {
              // Calculate theoretical weight based on unit and quantity
              const qty = item.quantity || 0;
              const unitWeight = item.unitWeightKg || item.unit_weight_kg || 0;
              let theoreticalWeightKg = 0;
              if (item.unit === 'KG') {
                theoreticalWeightKg = qty;
              } else if (item.unit === 'MT') {
                theoreticalWeightKg = qty * 1000;
              } else if (item.unit === 'PCS' && unitWeight > 0) {
                theoreticalWeightKg = qty * unitWeight;
              }

              return {
                invoiceItemId: item.id,
                productId: item.productId || item.product_id,
                name: item.name,
                specification: item.specification,
                hsnCode: item.hsnCode || item.hsn_code,
                unit: item.unit,
                orderedQuantity: item.quantity,
                deliveredQuantity: isEdit ? 0 : item.quantity, // For new delivery notes, default to full quantity
                remainingQuantity: isEdit ? item.quantity : 0,
                // Weight tracking fields
                unitWeightKg: unitWeight,
                theoreticalWeightKg,
                actualWeightKg: isEdit ? null : theoreticalWeightKg, // Default to theoretical for new
                productCategory:
                  item.productCategory || item.product_category || 'DEFAULT',
              };
            }) || [],
        }));
        setShowInvoiceDialog(false);
      } catch (err) {
        setError(`Failed to load invoice details: ${err.message}`);
      }
    },
    [isEdit],
  );

  // Load delivery note for editing
  useEffect(() => {
    if (isEdit) {
      loadDeliveryNote();
    } else {
      generateDeliveryNoteNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // Load invoices for selection
  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount

  // Auto-select invoice if pre-selected
  useEffect(() => {
    if (preSelectedInvoiceId && !isEdit && invoices.length > 0) {
      const invoice = invoices.find((inv) => inv.id === preSelectedInvoiceId);
      if (invoice) {
        handleInvoiceSelect(invoice);
      }
    }
  }, [preSelectedInvoiceId, invoices, isEdit, handleInvoiceSelect]);

  // Escape key handler for drawers
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowDeliveryAddressDrawer(false);
        setShowTransportDrawer(false);
        setShowNotesDrawer(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const loadDeliveryNote = useCallback(async () => {
    try {
      setLoading(true);
      const deliveryNote = await deliveryNoteService.getById(id);

      // Parse delivery address if it's a string
      let parsedAddress =
        deliveryNote.deliveryAddress || deliveryNote.delivery_address || {};
      if (typeof parsedAddress === 'string') {
        try {
          parsedAddress = JSON.parse(parsedAddress);
        } catch {
          parsedAddress = { street: parsedAddress };
        }
      }

      // Map items to camelCase and include allocation/warehouse data
      const mappedItems = (deliveryNote.items || []).map((item) => ({
        invoiceItemId: item.invoiceItemId || item.invoice_item_id,
        productId: item.productId || item.product_id,
        name: item.name,
        specification: item.specification,
        hsnCode: item.hsnCode || item.hsn_code,
        unit: item.unit,
        orderedQuantity: item.orderedQuantity || item.ordered_quantity || 0,
        deliveredQuantity:
          item.deliveredQuantity || item.delivered_quantity || 0,
        remainingQuantity:
          item.remainingQuantity || item.remaining_quantity || 0,
        isFullyDelivered:
          item.isFullyDelivered || item.is_fully_delivered || false,
        allocations: item.allocations || [],
        warehouseId: item.warehouseId || item.warehouse_id,
        warehouseName: item.warehouseName || item.warehouse_name,
        allocationStatus: item.allocationStatus || item.allocation_status,
        // Weight tracking fields
        unitWeightKg: item.unitWeightKg || item.unit_weight_kg || 0,
        theoreticalWeightKg:
          item.theoreticalWeightKg || item.theoretical_weight_kg || 0,
        actualWeightKg: item.actualWeightKg || item.actual_weight_kg || null,
        weightVarianceKg:
          item.weightVarianceKg || item.weight_variance_kg || null,
        weightVariancePct:
          item.weightVariancePct || item.weight_variance_pct || null,
        productCategory:
          item.productCategory || item.product_category || 'DEFAULT',
      }));

      setFormData({
        deliveryNoteNumber:
          deliveryNote.deliveryNoteNumber ||
          deliveryNote.delivery_note_number ||
          '',
        invoiceId: deliveryNote.invoiceId || deliveryNote.invoice_id || '',
        deliveryDate:
          deliveryNote.deliveryDate || deliveryNote.delivery_date
            ? formatDateForInput(
              new Date(
                deliveryNote.deliveryDate || deliveryNote.delivery_date,
              ),
            )
            : '',
        // Phase 4: GRN date fields
        goodsReceiptDate:
          deliveryNote.goodsReceiptDate || deliveryNote.goods_receipt_date
            ? formatDateForInput(
              new Date(
                deliveryNote.goodsReceiptDate ||
                    deliveryNote.goods_receipt_date,
              ),
            )
            : formatDateForInput(new Date()),
        inspectionDate:
          deliveryNote.inspectionDate || deliveryNote.inspection_date
            ? formatDateForInput(
              new Date(
                deliveryNote.inspectionDate || deliveryNote.inspection_date,
              ),
            )
            : formatDateForInput(new Date()),
        deliveryAddress: {
          street: parsedAddress.street || '',
          city: parsedAddress.city || '',
          poBox: parsedAddress.poBox || parsedAddress.po_box || '',
        },
        vehicleNumber:
          deliveryNote.vehicleNumber || deliveryNote.vehicle_number || '',
        driverName: deliveryNote.driverName || deliveryNote.driver_name || '',
        driverPhone:
          deliveryNote.driverPhone || deliveryNote.driver_phone || '',
        notes: deliveryNote.notes || '',
        items: mappedItems,
        stockDeducted:
          deliveryNote.stockDeducted || deliveryNote.stock_deducted || false,
        stockDeductedAt:
          deliveryNote.stockDeductedAt ||
          deliveryNote.stock_deducted_at ||
          null,
      });

      // Load the related invoice
      const invoiceId = deliveryNote.invoiceId || deliveryNote.invoice_id;
      if (invoiceId) {
        const invoice = await invoicesAPI.getById(invoiceId);
        setSelectedInvoice(invoice);
      }
    } catch (err) {
      setError(`Failed to load delivery note: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadInvoices = async () => {
    try {
      // Load invoices that can have delivery notes created (issued or paid)
      const response = await invoicesAPI.getAll({
        limit: 100,
      });
      // Filter to only show issued or paid invoices
      const eligibleInvoices = (response.invoices || []).filter(
        (inv) => inv.status === 'issued' || inv.status === 'paid',
      );
      setInvoices(eligibleInvoices);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const generateDeliveryNoteNumber = async () => {
    try {
      const response = await deliveryNoteService.getNextNumber();
      setFormData((prev) => ({
        ...prev,
        deliveryNoteNumber:
          response.nextDeliveryNoteNumber || response.deliveryNoteNumber,
      }));
    } catch (err) {
      console.error('Failed to generate delivery note number:', err);
    }
  };

  // NOTE: handleInvoiceSelect is defined at the top of the component (before the useEffects that use it)

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleItemQuantityChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const numValue = parseFloat(value) || 0;

    // Map snake_case field to camelCase
    const camelCaseField =
      field === 'delivered_quantity' ? 'deliveredQuantity' : field;

    updatedItems[index] = {
      ...updatedItems[index],
      [camelCaseField]: numValue,
    };

    // Calculate remaining quantity
    if (camelCaseField === 'deliveredQuantity') {
      updatedItems[index].remainingQuantity =
        updatedItems[index].orderedQuantity - numValue;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Handle actual weight change with variance calculation
  const handleActualWeightChange = (index, value) => {
    const updatedItems = [...formData.items];
    const actualWeight = parseFloat(value) || 0;
    const item = updatedItems[index];

    // Calculate variance
    const variance = calculateWeightVariance(
      actualWeight,
      item.theoreticalWeightKg,
    );

    updatedItems[index] = {
      ...item,
      actualWeightKg: actualWeight,
      weightVarianceKg: variance.varianceKg,
      weightVariancePct: variance.variancePct,
    };

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Get weight variance status for UI
  const getWeightVarianceStatus = (item) => {
    if (!item.actualWeightKg || !item.theoreticalWeightKg) {
      return { severity: 'none', message: 'Enter actual weight' };
    }
    return validateWeightTolerance(
      item.actualWeightKg,
      item.theoreticalWeightKg,
      item.productCategory,
    );
  };

  const toggleItemExpansion = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  /**
   * Get stock deduction status badge
   */
  const getStockStatusBadge = () => {
    if (formData.stockDeducted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border border-green-500/35 text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Stock Deducted
        </span>
      );
    }

    if (
      formData.deliveryDate &&
      new Date(formData.deliveryDate) <= new Date()
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border border-yellow-500/35 text-yellow-400">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Pending Deduction
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border ${isDarkMode ? 'border-[#2a3640] text-[#93a4b4]' : 'border-gray-300 text-gray-500'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Not Delivered
      </span>
    );
  };

  const handleSubmit = async () => {
    // STEP 1: Validate all required fields
    const errors = [];
    const invalidFieldsSet = new Set();

    // Delivery note number validation
    if (
      !formData.deliveryNoteNumber ||
      formData.deliveryNoteNumber.trim() === ''
    ) {
      errors.push('Delivery note number is required');
      invalidFieldsSet.add('deliveryNoteNumber');
    }

    // Invoice selection validation
    if (!formData.invoiceId) {
      errors.push('Please select an invoice');
      invalidFieldsSet.add('invoiceId');
    }

    // Delivery date validation
    if (!formData.deliveryDate) {
      errors.push('Delivery date is required');
      invalidFieldsSet.add('deliveryDate');
    }

    // Vehicle number validation (optional but recommended)
    if (!formData.vehicleNumber || formData.vehicleNumber.trim() === '') {
      errors.push('Vehicle number is required');
      invalidFieldsSet.add('vehicleNumber');
    }

    // Driver name validation (optional but recommended)
    if (!formData.driverName || formData.driverName.trim() === '') {
      errors.push('Driver name is required');
      invalidFieldsSet.add('driverName');
    }

    // Items validation
    if (!formData.items || formData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      formData.items.forEach((item, index) => {
        if (!item.deliveredQuantity || item.deliveredQuantity <= 0) {
          errors.push(
            `Item ${index + 1}: Delivered quantity must be greater than 0`,
          );
          invalidFieldsSet.add(`item.${index}.deliveredQuantity`);
        }
        if (item.deliveredQuantity > item.orderedQuantity) {
          errors.push(
            `Item ${index + 1}: Delivered quantity cannot exceed ordered quantity (${item.orderedQuantity})`,
          );
          invalidFieldsSet.add(`item.${index}.deliveredQuantity`);
        }
        // Weight tolerance validation - block if variance exceeds 2x tolerance
        if (item.theoreticalWeightKg > 0 && item.actualWeightKg > 0) {
          const weightStatus = validateWeightTolerance(
            item.actualWeightKg,
            item.theoreticalWeightKg,
            item.productCategory,
          );
          if (weightStatus.severity === 'error') {
            errors.push(
              `Item ${index + 1}: ${weightStatus.message}. Supervisor override required.`,
            );
            invalidFieldsSet.add(`item.${index}.actualWeightKg`);
          }
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
      // Prepare data for API (API Gateway handles camelCase to snake_case conversion)
      const submitData = {
        deliveryNoteNumber: formData.deliveryNoteNumber,
        invoiceId: formData.invoiceId,
        deliveryDate: formData.deliveryDate,
        // Phase 4: GRN date fields
        goodsReceiptDate: formData.goodsReceiptDate,
        inspectionDate: formData.inspectionDate,
        deliveryAddress: JSON.stringify(formData.deliveryAddress),
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        notes: formData.notes,
        customerId: selectedInvoice?.customerId || selectedInvoice?.customer_id,
        customerDetails: JSON.stringify(selectedInvoice?.customerDetails || {}),
        items: formData.items.map((item) => ({
          invoiceItemId: item.invoiceItemId,
          productId: item.productId,
          name: item.name,
          specification: item.specification,
          hsnCode: item.hsnCode,
          unit: item.unit,
          orderedQuantity: item.orderedQuantity,
          deliveredQuantity: item.deliveredQuantity,
          remainingQuantity: item.remainingQuantity,
          isFullyDelivered: item.deliveredQuantity >= item.orderedQuantity,
          // Weight tracking fields
          theoreticalWeightKg: item.theoreticalWeightKg || null,
          actualWeightKg: item.actualWeightKg || null,
          weightVarianceKg: item.weightVarianceKg || null,
          weightVariancePct: item.weightVariancePct || null,
        })),
      };

      if (isEdit) {
        await deliveryNoteService.update(id, submitData);
        setSuccess('Delivery note updated successfully');
      } else {
        await deliveryNoteService.create(submitData);
        setSuccess('Delivery note created successfully');
      }

      setTimeout(() => {
        navigate('/delivery-notes');
      }, 2000);
    } catch (err) {
      setError(`Failed to save delivery note: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to check if delivery address is filled
  const hasDeliveryAddress =
    formData.deliveryAddress.street || formData.deliveryAddress.city;

  // Helper to check if transport details are filled
  const hasTransportDetails = formData.vehicleNumber || formData.driverName;

  // Compute summary stats
  const totalItems = formData.items.length;
  const totalDeliveredQty = formData.items.reduce(
    (sum, item) => sum + (item.deliveredQuantity || 0),
    0,
  );
  const totalOrderedQty = formData.items.reduce(
    (sum, item) => sum + (item.orderedQuantity || 0),
    0,
  );

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-[#0b0f14]' : 'bg-[#FAFAFA]'}`}
    >
      {/* ==================== STICKY HEADER ==================== */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-md ${isDarkMode ? 'bg-[#0f151b]/94 border-b border-[#2a3640]' : 'bg-white/94 border-b border-gray-200'} px-4 py-3`}
      >
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/delivery-notes')}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-[#141a20] text-[#93a4b4]' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1
                className={`text-lg font-extrabold flex items-center gap-2 ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
              >
                <Truck size={24} className="text-teal-500" />
                {isEdit ? 'Edit Delivery Note' : 'Create Delivery Note'}
              </h1>
              <div
                className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                {formData.deliveryNoteNumber || 'New'}{' '}
                {selectedInvoice &&
                  `| Invoice: ${selectedInvoice.invoiceNumber}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStockStatusBadge()}
            <button
              onClick={() => setShowPreview(true)}
              className={BTN_CLASSES(isDarkMode)}
            >
              <Eye size={16} className="inline mr-1.5" />
              Preview
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !selectedInvoice}
              className={`${BTN_PRIMARY} ${isSaving || !selectedInvoice ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="inline mr-1.5" />
                  {isEdit ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT (8+4 GRID) ==================== */}
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="grid grid-cols-12 gap-3">
          {/* ==================== LEFT COLUMN (8 cols) ==================== */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            {/* Document Details Card */}
            <div className={CARD_CLASSES(isDarkMode)}>
              <div className="text-sm font-extrabold mb-3">
                Document Details
              </div>
              <div className="grid grid-cols-12 gap-3">
                {/* DN Number */}
                <div className="col-span-12 sm:col-span-3">
                  <label className={LABEL_CLASSES(isDarkMode)}>
                    DN Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryNoteNumber}
                    onChange={(e) =>
                      handleInputChange('deliveryNoteNumber', e.target.value)
                    }
                    disabled={isEdit}
                    className={`${INPUT_CLASSES(isDarkMode)} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Delivery Date */}
                <div className="col-span-12 sm:col-span-3">
                  <label className={LABEL_CLASSES(isDarkMode)}>
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) =>
                      handleInputChange('deliveryDate', e.target.value)
                    }
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>

                {/* GRN Date */}
                <div className="col-span-12 sm:col-span-3">
                  <label className={LABEL_CLASSES(isDarkMode)}>
                    Goods Receipt Date
                  </label>
                  <input
                    type="date"
                    value={formData.goodsReceiptDate}
                    onChange={(e) =>
                      handleInputChange('goodsReceiptDate', e.target.value)
                    }
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>

                {/* Inspection Date */}
                <div className="col-span-12 sm:col-span-3">
                  <label className={LABEL_CLASSES(isDarkMode)}>
                    Inspection Date
                  </label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) =>
                      handleInputChange('inspectionDate', e.target.value)
                    }
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>

                {/* Invoice Selection */}
                <div className="col-span-12">
                  <label className={LABEL_CLASSES(isDarkMode)}>
                    Invoice <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={
                        selectedInvoice
                          ? `${selectedInvoice.invoiceNumber} - ${selectedInvoice.customerDetails?.name}`
                          : ''
                      }
                      readOnly
                      placeholder="Select an invoice..."
                      className={`flex-1 ${INPUT_CLASSES(isDarkMode)} cursor-not-allowed`}
                    />
                    <button
                      onClick={() => setShowInvoiceDialog(true)}
                      disabled={isEdit}
                      className={`${BTN_CLASSES(isDarkMode)} ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Variance Display (if applicable) */}
              {selectedInvoice && selectedInvoice.expectedDeliveryDate && (
                <div
                  className={`mt-3 p-3 rounded-[14px] ${isDarkMode ? 'bg-[#0f151b] border border-[#2a3640]' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                      >
                        Delivery Variance
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-lg font-extrabold ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-600'}`}
                        >
                          {formData.goodsReceiptDate &&
                          selectedInvoice.expectedDeliveryDate
                            ? Math.ceil(
                              (new Date(formData.goodsReceiptDate) -
                                  new Date(
                                    selectedInvoice.expectedDeliveryDate,
                                  )) /
                                  (1000 * 60 * 60 * 24),
                            )
                            : 0}{' '}
                          days
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            formData.goodsReceiptDate &&
                            selectedInvoice.expectedDeliveryDate
                              ? Math.ceil(
                                (new Date(formData.goodsReceiptDate) -
                                    new Date(
                                      selectedInvoice.expectedDeliveryDate,
                                    )) /
                                    (1000 * 60 * 60 * 24),
                              ) <= (selectedInvoice.gracePeriodDays || 5)
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {formData.goodsReceiptDate &&
                          selectedInvoice.expectedDeliveryDate
                            ? Math.ceil(
                              (new Date(formData.goodsReceiptDate) -
                                  new Date(
                                    selectedInvoice.expectedDeliveryDate,
                                  )) /
                                  (1000 * 60 * 60 * 24),
                            ) <= (selectedInvoice.gracePeriodDays || 5)
                              ? 'ON TIME'
                              : 'LATE'
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                      >
                        Expected: {selectedInvoice.expectedDeliveryDate}
                      </div>
                      <div
                        className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                      >
                        Received: {formData.goodsReceiptDate}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items Card */}
            {formData.items.length > 0 && (
              <div className={CARD_CLASSES(isDarkMode)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-extrabold">
                    Items for Delivery
                  </div>
                  <div
                    className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-[14px] border ${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'}`}
                    >
                      {/* Item Header - Clickable to expand */}
                      <div
                        className={`p-3 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#141a20]' : 'hover:bg-gray-100'}`}
                        onClick={() => toggleItemExpansion(index)}
                      >
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-5">
                            <div className="flex items-start gap-2">
                              <Package
                                size={16}
                                className="text-teal-500 mt-0.5 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-[13px] font-medium truncate ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                                >
                                  {item.name}
                                </p>
                                <p
                                  className={`text-[11px] truncate ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                                >
                                  {item.specification || 'No specification'}
                                </p>
                                {item.warehouseName && (
                                  <p
                                    className={`text-[11px] ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-600'}`}
                                  >
                                    {item.warehouseName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-1 text-center">
                            <div
                              className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                            >
                              Unit
                            </div>
                            <div
                              className={`text-[13px] font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                            >
                              {item.unit}
                            </div>
                          </div>

                          <div className="col-span-2 text-right">
                            <div
                              className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                            >
                              Ordered
                            </div>
                            <div
                              className={`text-[13px] font-medium font-mono ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                            >
                              {item.orderedQuantity}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div
                              className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                            >
                              Deliver
                            </div>
                            <input
                              type="number"
                              value={item.deliveredQuantity || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleItemQuantityChange(
                                  index,
                                  'delivered_quantity',
                                  e.target.value,
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              min={0}
                              max={item.orderedQuantity}
                              step={0.01}
                              className={`w-full px-2 py-1.5 border rounded-[10px] text-right text-[13px] font-mono ${isDarkMode ? 'bg-[#141a20] border-[#2a3640] text-[#e6edf3]' : 'bg-white border-gray-300 text-gray-900'} focus:border-[#5bb2ff] focus:ring-1 focus:ring-[#4aa3ff]/20 outline-none`}
                            />
                          </div>

                          <div className="col-span-2 text-right">
                            <div
                              className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                            >
                              Remaining
                            </div>
                            <div
                              className={`text-[13px] font-bold font-mono ${item.remainingQuantity === 0 ? 'text-green-400' : 'text-yellow-400'}`}
                            >
                              {item.remainingQuantity}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Allocation Details - Expandable */}
                      {expandedItems.has(index) && (
                        <div
                          className={`p-3 border-t ${isDarkMode ? 'border-[#2a3640]' : 'border-gray-200'} space-y-3`}
                        >
                          {/* Weight Tracking Section */}
                          {item.theoreticalWeightKg > 0 && (
                            <div
                              className={`p-3 rounded-[12px] ${isDarkMode ? 'bg-[#141a20] border border-[#2a3640]' : 'bg-blue-50 border border-blue-200'}`}
                            >
                              <div
                                className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-700'}`}
                              >
                                Weight Verification
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <div
                                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                                  >
                                    Theoretical
                                  </div>
                                  <div
                                    className={`text-[13px] font-medium font-mono ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                                  >
                                    {item.theoreticalWeightKg?.toFixed(2)} kg
                                  </div>
                                </div>
                                <div>
                                  <div
                                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                                  >
                                    Actual Weight
                                  </div>
                                  <input
                                    type="number"
                                    value={item.actualWeightKg || ''}
                                    onChange={(e) =>
                                      handleActualWeightChange(
                                        index,
                                        e.target.value,
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    min={0}
                                    step={0.01}
                                    placeholder="Enter"
                                    className={`w-full px-2 py-1.5 border rounded-[10px] text-right text-[13px] font-mono ${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3]' : 'bg-white border-gray-300 text-gray-900'} focus:border-[#5bb2ff] outline-none`}
                                  />
                                </div>
                                <div>
                                  <div
                                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                                  >
                                    Variance
                                  </div>
                                  {item.actualWeightKg ? (
                                    <div
                                      className={`text-[13px] font-medium font-mono ${Math.abs(item.weightVariancePct || 0) > 10 ? 'text-red-400' : Math.abs(item.weightVariancePct || 0) > 5 ? 'text-yellow-400' : 'text-green-400'}`}
                                    >
                                      {item.weightVarianceKg > 0 ? '+' : ''}
                                      {item.weightVarianceKg?.toFixed(2)} kg
                                      <span className="text-[11px] ml-1">
                                        ({item.weightVariancePct > 0 ? '+' : ''}
                                        {item.weightVariancePct?.toFixed(1)}%)
                                      </span>
                                    </div>
                                  ) : (
                                    <div
                                      className={`text-[13px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-400'}`}
                                    >
                                      -
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div
                                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                                  >
                                    Status
                                  </div>
                                  {(() => {
                                    const status =
                                      getWeightVarianceStatus(item);
                                    const colorMap = {
                                      success: 'text-green-400',
                                      caution: 'text-yellow-400',
                                      warning: 'text-orange-400',
                                      error: 'text-red-400',
                                      none: isDarkMode
                                        ? 'text-[#93a4b4]'
                                        : 'text-gray-400',
                                    };
                                    return (
                                      <div
                                        className={`text-[11px] font-medium flex items-center gap-1 ${colorMap[status.severity]}`}
                                      >
                                        {status.severity === 'error' && (
                                          <AlertTriangle size={12} />
                                        )}
                                        {status.severity === 'warning' && (
                                          <AlertCircle size={12} />
                                        )}
                                        {status.severity === 'success' && (
                                          <CheckCircle size={12} />
                                        )}
                                        {status.message}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Allocation Panel */}
                          {item.allocations && item.allocations.length > 0 ? (
                            <AllocationPanel
                              productId={item.productId}
                              warehouseId={item.warehouseId}
                              requiredQty={item.deliveredQuantity || 0}
                              allocations={item.allocations}
                              disabled={true}
                            />
                          ) : (
                            <div
                              className={`p-3 rounded-[12px] border text-center ${isDarkMode ? 'bg-[#141a20] border-[#2a3640] text-[#93a4b4]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                            >
                              <p className="text-xs">
                                {formData.stockDeducted
                                  ? 'Stock deducted but allocation details not available.'
                                  : 'Batch allocations will be computed when processed.'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <div
                id="validation-errors-alert"
                className={`p-4 rounded-2xl border-2 ${isDarkMode ? 'bg-red-900/20 border-red-600 text-red-200' : 'bg-red-50 border-red-500 text-red-800'}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                    size={20}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-2">
                      Please fix the following errors:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {validationErrors.map((validationError, index) => (
                        <li key={index}>{validationError}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        setValidationErrors([]);
                        setInvalidFields(new Set());
                      }}
                      className={`mt-2 px-2.5 py-1.5 rounded-[10px] text-xs font-medium transition-colors ${isDarkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==================== RIGHT COLUMN (4 cols) - STICKY SIDEBAR ==================== */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-[88px] space-y-3">
              {/* Delivery Summary Card */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div className="text-sm font-extrabold mb-3">
                  Delivery Summary
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  <div
                    className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-2.5`}
                  >
                    <div
                      className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Items
                    </div>
                    <div className="text-sm font-extrabold mt-1 font-mono">
                      {totalItems}
                    </div>
                  </div>
                  <div
                    className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-2.5`}
                  >
                    <div
                      className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Ordered
                    </div>
                    <div className="text-sm font-extrabold mt-1 font-mono">
                      {totalOrderedQty.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-2.5`}
                  >
                    <div
                      className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Delivering
                    </div>
                    <div
                      className={`text-sm font-extrabold mt-1 font-mono ${totalDeliveredQty === totalOrderedQty ? 'text-green-400' : 'text-yellow-400'}`}
                    >
                      {totalDeliveredQty.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className={DIVIDER_CLASSES(isDarkMode)} />

                {/* Customer Info */}
                {selectedInvoice?.customerDetails && (
                  <div className="mb-3">
                    <div
                      className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Customer
                    </div>
                    <div
                      className={`text-[13px] font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                    >
                      {selectedInvoice.customerDetails.name}
                    </div>
                    {selectedInvoice.customerDetails.trn && (
                      <div
                        className={`text-[11px] font-mono ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                      >
                        TRN: {selectedInvoice.customerDetails.trn}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Delivery Address Preview */}
                {hasDeliveryAddress && (
                  <div className="mb-3">
                    <div
                      className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Delivery To
                    </div>
                    <div
                      className={`text-[13px] ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                    >
                      {formData.deliveryAddress.street && (
                        <span>{formData.deliveryAddress.street}</span>
                      )}
                      {formData.deliveryAddress.city && (
                        <span>, {formData.deliveryAddress.city}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Transport Preview */}
                {hasTransportDetails && (
                  <div className="mb-3">
                    <div
                      className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Transport
                    </div>
                    <div
                      className={`text-[13px] ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                    >
                      {formData.vehicleNumber && (
                        <span>{formData.vehicleNumber}</span>
                      )}
                      {formData.driverName && (
                        <span> | {formData.driverName}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Card */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'} mb-2`}
                >
                  Quick Actions
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowDeliveryAddressDrawer(true)}
                    className={`${QUICK_LINK_CLASSES(isDarkMode)} w-full justify-between`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={16} className="opacity-60" />
                      Delivery Address
                    </span>
                    <ChevronRight size={16} className="opacity-40" />
                  </button>
                  <button
                    onClick={() => setShowTransportDrawer(true)}
                    className={`${QUICK_LINK_CLASSES(isDarkMode)} w-full justify-between`}
                  >
                    <span className="flex items-center gap-2">
                      <Truck size={16} className="opacity-60" />
                      Transport Details
                    </span>
                    <ChevronRight size={16} className="opacity-40" />
                  </button>
                  <button
                    onClick={() => setShowNotesDrawer(true)}
                    className={`${QUICK_LINK_CLASSES(isDarkMode)} w-full justify-between`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={16} className="opacity-60" />
                      Notes
                    </span>
                    <ChevronRight size={16} className="opacity-40" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== DELIVERY ADDRESS DRAWER ==================== */}
      <>
        <div
          className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${showDeliveryAddressDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowDeliveryAddressDrawer(false)}
        />
        <div
          className={`fixed top-0 right-0 h-full w-[min(520px,92vw)] z-[31] ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'} overflow-auto transition-transform ${showDeliveryAddressDrawer ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4">
            {/* Drawer Header */}
            <div
              className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'} z-[1]`}
            >
              <div>
                <div className="text-sm font-extrabold">Delivery Address</div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Where should goods be delivered?
                </div>
              </div>
              <button
                onClick={() => setShowDeliveryAddressDrawer(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#0f151b] text-[#93a4b4]' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASSES(isDarkMode)}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.street}
                  onChange={(e) =>
                    handleInputChange('deliveryAddress.street', e.target.value)
                  }
                  placeholder="Enter street address"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASSES(isDarkMode)}>City</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.city}
                    onChange={(e) =>
                      handleInputChange('deliveryAddress.city', e.target.value)
                    }
                    placeholder="Enter city"
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASSES(isDarkMode)}>PO Box</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.poBox}
                    onChange={(e) =>
                      handleInputChange('deliveryAddress.poBox', e.target.value)
                    }
                    placeholder="Enter PO Box"
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className="sticky bottom-0 pt-4 mt-4"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                  : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
              }}
            >
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeliveryAddressDrawer(false)}
                  className={BTN_CLASSES(isDarkMode)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* ==================== TRANSPORT DETAILS DRAWER ==================== */}
      <>
        <div
          className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${showTransportDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowTransportDrawer(false)}
        />
        <div
          className={`fixed top-0 right-0 h-full w-[min(520px,92vw)] z-[31] ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'} overflow-auto transition-transform ${showTransportDrawer ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4">
            {/* Drawer Header */}
            <div
              className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'} z-[1]`}
            >
              <div>
                <div className="text-sm font-extrabold">Transport Details</div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Vehicle and driver information
                </div>
              </div>
              <button
                onClick={() => setShowTransportDrawer(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#0f151b] text-[#93a4b4]' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASSES(isDarkMode)}>
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    handleInputChange('vehicleNumber', e.target.value)
                  }
                  placeholder="e.g., MH-01-AB-1234"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label className={LABEL_CLASSES(isDarkMode)}>
                  Driver Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) =>
                    handleInputChange('driverName', e.target.value)
                  }
                  placeholder="Enter driver name"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label className={LABEL_CLASSES(isDarkMode)}>
                  Driver Phone
                </label>
                <input
                  type="tel"
                  value={formData.driverPhone}
                  onChange={(e) =>
                    handleInputChange('driverPhone', e.target.value)
                  }
                  placeholder="e.g., +971 50 123 4567"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className="sticky bottom-0 pt-4 mt-4"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                  : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
              }}
            >
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTransportDrawer(false)}
                  className={BTN_CLASSES(isDarkMode)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* ==================== NOTES DRAWER ==================== */}
      <>
        <div
          className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${showNotesDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowNotesDrawer(false)}
        />
        <div
          className={`fixed top-0 right-0 h-full w-[min(520px,92vw)] z-[31] ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'} overflow-auto transition-transform ${showNotesDrawer ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4">
            {/* Drawer Header */}
            <div
              className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'} z-[1]`}
            >
              <div>
                <div className="text-sm font-extrabold">Notes</div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Special instructions and handling notes
                </div>
              </div>
              <button
                onClick={() => setShowNotesDrawer(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#0f151b] text-[#93a4b4]' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div>
              <label className={LABEL_CLASSES(isDarkMode)}>
                Delivery Notes
              </label>
              <textarea
                rows={6}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Special instructions, handling notes, etc."
                className={`${INPUT_CLASSES(isDarkMode)} min-h-[150px] resize-y`}
              />
            </div>

            {/* Drawer Footer */}
            <div
              className="sticky bottom-0 pt-4 mt-4"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                  : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
              }}
            >
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNotesDrawer(false)}
                  className={BTN_CLASSES(isDarkMode)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* ==================== INVOICE SELECTION MODAL ==================== */}
      {showInvoiceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55">
          <div
            className={`${isDarkMode ? 'bg-[#141a20] border-[#2a3640]' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col`}
          >
            <div
              className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-[#2a3640]' : 'border-gray-200'}`}
            >
              <div className="text-sm font-extrabold">Select Invoice</div>
              <button
                type="button"
                onClick={() => setShowInvoiceDialog(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#0f151b] text-[#93a4b4]' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {invoices.length === 0 ? (
                <p
                  className={`text-center py-4 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  No invoices available for delivery
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => handleInvoiceSelect(invoice)}
                      className={`w-full p-3 text-left border rounded-[14px] transition-colors ${isDarkMode ? 'border-[#2a3640] hover:bg-[#0f151b] hover:border-[#4aa3ff]' : 'border-gray-200 hover:bg-gray-50 hover:border-blue-500'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p
                            className={`text-[13px] font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                          >
                            {invoice.invoiceNumber || invoice.invoice_number}
                          </p>
                          <p
                            className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                          >
                            {invoice.customerDetails?.name ||
                              invoice.customer_name ||
                              'Unknown Customer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-[13px] font-medium font-mono ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                          >
                            {new Intl.NumberFormat('en-AE', {
                              style: 'currency',
                              currency: 'AED',
                            }).format(
                              invoice.grandTotal || invoice.grand_total || 0,
                            )}
                          </p>
                          <p
                            className={`text-[11px] px-2 py-0.5 rounded-full inline-block ${
                              invoice.status === 'paid'
                                ? 'bg-green-500/20 text-green-400'
                                : invoice.status === 'issued'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {invoice.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PREVIEW MODAL ==================== */}
      {showPreview && (
        <DeliveryNotePreview
          deliveryNote={{
            deliveryNoteNumber: formData.deliveryNoteNumber,
            invoiceNumber: selectedInvoice?.invoiceNumber,
            invoiceId: formData.invoiceId,
            deliveryDate: formData.deliveryDate,
            deliveryAddress: formData.deliveryAddress,
            vehicleNumber: formData.vehicleNumber,
            driverName: formData.driverName,
            driverPhone: formData.driverPhone,
            notes: formData.notes,
            items: formData.items,
            status: 'pending',
            customerDetails: selectedInvoice?.customerDetails,
          }}
          company={{}}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* ==================== SUCCESS/ERROR NOTIFICATIONS ==================== */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-[13px]">{error}</span>
              <button onClick={() => setError('')} className="ml-2">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800'}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={18} />
              <span className="text-[13px]">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-2">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNoteForm;
