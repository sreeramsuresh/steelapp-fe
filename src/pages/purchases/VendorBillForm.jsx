/**
 * VendorBillForm.jsx - UAE VAT Compliance
 *
 * Form for creating/editing vendor bills (purchase invoices).
 * Supports VAT categories, reverse charge, blocked VAT, and line items.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Building2,
  FileText,
  Package,
  Settings,
  X,
  ChevronDown,
  Pin,
  Link2,
  Ship,
  Scale,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import vendorBillService from '../../services/vendorBillService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { notificationService } from '../../services/notificationService';
import { pinnedProductsService } from '../../services/pinnedProductsService';
import { grnService } from '../../services/grnService';
import { importContainerService } from '../../services/importContainerService';
import {
  formatCurrency,
  formatDateForInput,
  calculateItemAmount,
} from '../../utils/invoiceUtils';

// Procurement channels
const PROCUREMENT_CHANNELS = [
  { value: 'LOCAL', label: 'Local Purchase' },
  { value: 'IMPORTED', label: 'Import Purchase' },
];

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

// VAT categories
const VAT_CATEGORIES = [
  { value: 'STANDARD', label: 'Standard Rate (5%)', rate: 5 },
  { value: 'ZERO_RATED', label: 'Zero Rated (0%)', rate: 0 },
  { value: 'EXEMPT', label: 'Exempt', rate: 0 },
  { value: 'REVERSE_CHARGE', label: 'Reverse Charge', rate: 5 },
  { value: 'BLOCKED', label: 'Blocked (Non-Recoverable)', rate: 5 },
];

// Payment terms
const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_45', label: 'Net 45 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
  { value: 'net_90', label: 'Net 90 Days' },
];

// Blocked VAT reasons (per UAE FTA Article 53)
const BLOCKED_VAT_REASONS = [
  { value: 'entertainment', label: 'Entertainment expenses' },
  { value: 'motor_vehicle', label: 'Motor vehicles (not for business use)' },
  { value: 'personal_use', label: 'Personal use goods/services' },
  { value: 'no_tax_invoice', label: 'No valid tax invoice' },
  { value: 'expired_period', label: 'Claim period expired' },
  { value: 'other', label: 'Other (specify in notes)' },
];

// Empty line item template
const createEmptyItem = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  productId: null,
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  vatRate: 5,
  vatAmount: 0,
  vatCategory: 'STANDARD',
  expenseCategory: '',
  // Pricing & Commercial Fields
  pricingBasis: 'PER_MT',
  unitWeightKg: null,
  quantityUom: 'PCS',
  theoreticalWeightKg: null,
  missingWeightWarning: false,
  // Stock-In Fields (Phase 5)
  procurementChannel: 'LOCAL', // LOCAL or IMPORTED
  importContainerId: null, // Link to import container for imported items
  // Weight Variance Fields
  poWeightKg: null, // Weight from PO
  receivedWeightKg: null, // Actual received weight from GRN
  weightVarianceKg: null, // Calculated variance
  weightVariancePercent: null, // Variance percentage
  // GRN Linkage
  grnLineId: null, // Link to specific GRN line item
  // Batch Creation
  createBatch: true, // Flag to trigger batch creation on approval
  batchNumber: '', // Pre-assigned batch number if any
});

// Custom Tailwind Components
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${
        isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${
        isDarkMode ? 'gray-800' : 'white'
      }`;
    } else if (variant === 'secondary') {
      return `${
        isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-200 hover:bg-gray-300'
      } ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-${
        isDarkMode ? 'gray-500' : 'gray-400'
      } disabled:${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      } focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
          : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
      } focus:ring-teal-500 disabled:${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      } focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? 'cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({
  label,
  error,
  className = '',
  required = false,
  validationState = null,
  showValidation = true,
  id,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const getValidationClasses = () => {
    if (!showValidation) {
      return isDarkMode
        ? 'border-gray-600 bg-gray-800'
        : 'border-gray-300 bg-white';
    }

    if (error || validationState === 'invalid') {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    if (validationState === 'valid') {
      return isDarkMode
        ? 'border-green-500 bg-green-900/10'
        : 'border-green-500 bg-green-50';
    }
    if (required && validationState === null) {
      return isDarkMode
        ? 'border-yellow-600/50 bg-yellow-900/5'
        : 'border-yellow-400/50 bg-yellow-50/30';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-2 py-2 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 h-[38px] ${
          isDarkMode
            ? 'text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
            : 'text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${getValidationClasses()} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Select = ({
  label,
  children,
  error,
  className = '',
  required = false,
  validationState = null,
  showValidation = true,
  id,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const getValidationClasses = () => {
    if (!showValidation) {
      return isDarkMode
        ? 'border-gray-600 bg-gray-800'
        : 'border-gray-300 bg-white';
    }

    if (error || validationState === 'invalid') {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    if (validationState === 'valid') {
      return isDarkMode
        ? 'border-green-500 bg-green-900/10'
        : 'border-green-500 bg-green-50';
    }
    if (required && validationState === null) {
      return isDarkMode
        ? 'border-yellow-600/50 bg-yellow-900/5'
        : 'border-yellow-400/50 bg-yellow-50/30';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full pl-2 pr-8 py-2 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 appearance-none h-[38px] ${
            isDarkMode
              ? 'text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'text-gray-900 disabled:bg-gray-100 disabled:text-gray-400'
          } ${getValidationClasses()} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        />
      </div>
      {error && (
        <p
          className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Card = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-600'
          : 'bg-white border border-gray-200'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Form Settings Panel Component
const FormSettingsPanel = ({
  isOpen,
  onClose,
  preferences,
  onPreferenceChange,
}) => {
  const { isDarkMode } = useTheme();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <p
          className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
        >
          {label}
        </p>
        <p
          className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {description}
        </p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          enabled ? 'bg-teal-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg border z-50 ${
        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
      }`}
    >
      <div
        className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
          >
            Form Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 divide-y divide-gray-200 dark:divide-gray-700">
        <ToggleSwitch
          enabled={preferences.showValidationHighlighting}
          onChange={() =>
            onPreferenceChange(
              'showValidationHighlighting',
              !preferences.showValidationHighlighting,
            )
          }
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
        />
        <ToggleSwitch
          enabled={preferences.showSpeedButtons}
          onChange={() =>
            onPreferenceChange(
              'showSpeedButtons',
              !preferences.showSpeedButtons,
            )
          }
          label="Quick Add Speed Buttons"
          description="Show pinned & top products for quick adding"
        />
      </div>

      <div
        className={`px-4 py-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
      >
        Settings are saved automatically
      </div>
    </div>
  );
};

const VendorBillForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [pinnedProductIds, setPinnedProductIds] = useState(() => {
    const saved = localStorage.getItem('vendorBillPinnedProducts');
    return saved ? JSON.parse(saved) : [];
  });

  // Form preferences
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem('vendorBillFormPreferences');
    return saved
      ? JSON.parse(saved)
      : {
        showValidationHighlighting: true,
        showSpeedButtons: true,
      };
  });

  // Bill data state
  const [bill, setBill] = useState({
    vendorId: null,
    vendor: null,
    billNumber: '',
    vendorInvoiceNumber: '',
    billDate: formatDateForInput(new Date()),
    dueDate: '',
    receivedDate: formatDateForInput(new Date()),
    vatCategory: 'STANDARD',
    placeOfSupply: 'AE-DU',
    isReverseCharge: false,
    reverseChargeAmount: 0,
    blockedVatReason: '',
    paymentTerms: 'net_30',
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    status: 'draft',
    notes: '',
    terms: '',
    items: [createEmptyItem()],
    // Additional charges (Landed Cost Components)
    freightCharges: 0,
    customsDuty: 0,
    insuranceCharges: 0,
    handlingCharges: 0,
    otherCharges: 0,
    // GRN Matching (3-way match: PO -> GRN -> Bill)
    grnId: null,
    grnNumber: '',
    purchaseOrderId: null,
    poNumber: '',
    // Procurement Channel (affects VAT treatment)
    procurementChannel: 'LOCAL', // LOCAL = input VAT, IMPORTED = reverse charge
    // Import Reference
    importContainerId: null,
    importContainerNumber: '',
    // Landed Cost Calculation
    totalLandedCost: 0, // subtotal + all charges
    landedCostPerUnit: 0, // For allocation to inventory
    // Batch Creation Control
    triggerBatchCreation: true, // On approval, create/update stock batches
  });

  // GRN/Import Container selection state
  const [availableGRNs, setAvailableGRNs] = useState([]);
  const [availableContainers, setAvailableContainers] = useState([]);
  const [showGRNMatchModal, setShowGRNMatchModal] = useState(false);
  const [loadingGRNs, setLoadingGRNs] = useState(false);

  // Load initial data
  useEffect(() => {
    loadVendors();
    loadProducts();
    if (isEditMode) {
      loadBill();
    } else {
      loadNextBillNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // loadVendorBill and loadNextBillNumber are stable

  // Calculate due date when bill date or payment terms change
  useEffect(() => {
    if (bill.billDate && bill.paymentTerms) {
      const billDate = new Date(bill.billDate);
      let daysToAdd = 0;
      switch (bill.paymentTerms) {
        case 'net_7':
          daysToAdd = 7;
          break;
        case 'net_15':
          daysToAdd = 15;
          break;
        case 'net_30':
          daysToAdd = 30;
          break;
        case 'net_45':
          daysToAdd = 45;
          break;
        case 'net_60':
          daysToAdd = 60;
          break;
        case 'net_90':
          daysToAdd = 90;
          break;
        default:
          daysToAdd = 0;
      }
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      setBill((prev) => ({ ...prev, dueDate: formatDateForInput(dueDate) }));
    }
  }, [bill.billDate, bill.paymentTerms]);

  // Save form preferences to localStorage
  useEffect(() => {
    localStorage.setItem(
      'vendorBillFormPreferences',
      JSON.stringify(formPreferences),
    );
  }, [formPreferences]);

  const loadVendors = async () => {
    try {
      const response = await supplierService.getSuppliers();
      setVendors(response.suppliers || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.products || response || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadBill = async () => {
    try {
      setLoading(true);
      const data = await vendorBillService.getById(id);
      setBill({
        ...data,
        items: data.items?.length > 0 ? data.items : [createEmptyItem()],
      });
    } catch (error) {
      console.error('Error loading vendor bill:', error);
      notificationService.error('Failed to load vendor bill');
      navigate('/purchases/vendor-bills');
    } finally {
      setLoading(false);
    }
  };

  const loadNextBillNumber = async () => {
    try {
      const response = await vendorBillService.getNextNumber();
      setBill((prev) => ({
        ...prev,
        billNumber: response.billNumber || 'VB-0001',
      }));
    } catch (error) {
      console.error('Error loading next bill number:', error);
    }
  };

  // Load unbilled GRNs for the selected vendor
  const loadUnbilledGRNs = async (vendorId) => {
    if (!vendorId) {
      setAvailableGRNs([]);
      return;
    }
    try {
      setLoadingGRNs(true);
      const grns = await grnService.getUnbilled({ vendorId });
      setAvailableGRNs(grns || []);
    } catch (error) {
      console.error('Failed to load unbilled GRNs:', error);
      setAvailableGRNs([]);
    } finally {
      setLoadingGRNs(false);
    }
  };

  // Load available import containers for the selected vendor
  const loadImportContainers = async (vendorId) => {
    if (!vendorId) {
      setAvailableContainers([]);
      return;
    }
    try {
      const response = await importContainerService.getBySupplier(vendorId);
      const containers = response.data || response.containers || response || [];
      setAvailableContainers(Array.isArray(containers) ? containers : []);
    } catch (error) {
      console.error('Failed to load import containers:', error);
      setAvailableContainers([]);
    }
  };

  // Handle GRN selection for 3-way match
  const handleGRNSelect = (grn) => {
    if (!grn) {
      // Clear GRN linkage
      setBill((prev) => ({
        ...prev,
        grnId: null,
        grnNumber: '',
        purchaseOrderId: null,
        poNumber: '',
      }));
      return;
    }

    // Pre-fill line items from GRN
    const grnItems = (grn.items || []).map((grnItem) => ({
      ...createEmptyItem(),
      productId: grnItem.productId,
      description: grnItem.description || grnItem.productName || '',
      quantity: grnItem.acceptedQuantity || grnItem.receivedQuantity || 0,
      unitPrice: grnItem.unitPrice || 0,
      pricingBasis: grnItem.pricingBasis || 'PER_MT',
      unitWeightKg: grnItem.unitWeightKg || null,
      quantityUom: grnItem.quantityUom || 'PCS',
      // Stock-in fields from GRN
      poWeightKg: grnItem.poWeightKg || null,
      receivedWeightKg: grnItem.receivedWeightKg || null,
      weightVarianceKg: grnItem.weightVarianceKg || null,
      weightVariancePercent: grnItem.weightVariancePercent || null,
      grnLineId: grnItem.id,
      procurementChannel: grn.procurementChannel || 'LOCAL',
      importContainerId: grn.importContainerId || null,
      batchNumber: grnItem.batchNumber || '',
    }));

    // Determine procurement channel and VAT category
    const isImported =
      grn.procurementChannel === 'IMPORTED' || grn.importContainerId;
    const vatCategory = isImported ? 'REVERSE_CHARGE' : 'STANDARD';

    setBill((prev) => ({
      ...prev,
      grnId: grn.id,
      grnNumber: grn.grnNumber,
      purchaseOrderId: grn.purchaseOrderId,
      poNumber: grn.poNumber || '',
      procurementChannel: grn.procurementChannel || 'LOCAL',
      importContainerId: grn.importContainerId || null,
      importContainerNumber: grn.containerNumber || '',
      vatCategory,
      isReverseCharge: isImported,
      items: grnItems.length > 0 ? grnItems : prev.items,
    }));

    // Recalculate totals
    if (grnItems.length > 0) {
      recalculateTotals(grnItems);
    }

    setShowGRNMatchModal(false);
    notificationService.success(`Linked to GRN ${grn.grnNumber}`);
  };

  // Handle procurement channel change (affects VAT treatment)
  const handleProcurementChannelChange = (channel) => {
    const isImported = channel === 'IMPORTED';
    const vatCategory = isImported ? 'REVERSE_CHARGE' : 'STANDARD';

    setBill((prev) => ({
      ...prev,
      procurementChannel: channel,
      vatCategory,
      isReverseCharge: isImported,
    }));

    // Update VAT rate on all items
    const newVatRate = isImported ? 5 : 5; // Both are 5%, but reverse charge treatment differs
    recalculateAllItems(newVatRate);
  };

  // Calculate landed cost
  const calculateLandedCost = useCallback(() => {
    const additionalCharges =
      (parseFloat(bill.freightCharges) || 0) +
      (parseFloat(bill.customsDuty) || 0) +
      (parseFloat(bill.insuranceCharges) || 0) +
      (parseFloat(bill.handlingCharges) || 0) +
      (parseFloat(bill.otherCharges) || 0);

    const totalLandedCost = bill.subtotal + additionalCharges;

    // Calculate per-unit landed cost for allocation
    const totalUnits = bill.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      // For weight-based items, use theoretical weight
      if (item.quantityUom === 'MT') return sum + qty * 1000;
      if (item.quantityUom === 'KG') return sum + qty;
      if (item.unitWeightKg) return sum + qty * item.unitWeightKg;
      return sum + qty;
    }, 0);

    const landedCostPerUnit = totalUnits > 0 ? totalLandedCost / totalUnits : 0;

    return { totalLandedCost, landedCostPerUnit };
  }, [
    bill.subtotal,
    bill.freightCharges,
    bill.customsDuty,
    bill.insuranceCharges,
    bill.handlingCharges,
    bill.otherCharges,
    bill.items,
  ]);

  // Update landed cost when relevant fields change
  useEffect(() => {
    const { totalLandedCost, landedCostPerUnit } = calculateLandedCost();
    setBill((prev) => ({
      ...prev,
      totalLandedCost,
      landedCostPerUnit,
    }));
  }, [calculateLandedCost]);

  // Handle vendor selection
  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(
      (v) => v.id === vendorId || v.id === parseInt(vendorId),
    );
    setBill((prev) => ({
      ...prev,
      vendorId: vendorId || null,
      vendor: vendor || null,
      // Clear GRN linkage when vendor changes
      grnId: null,
      grnNumber: '',
      purchaseOrderId: null,
      poNumber: '',
      importContainerId: null,
      importContainerNumber: '',
    }));

    // Load unbilled GRNs and import containers for this vendor
    if (vendorId) {
      loadUnbilledGRNs(vendorId);
      loadImportContainers(vendorId);
    } else {
      setAvailableGRNs([]);
      setAvailableContainers([]);
    }
  };

  // Handle VAT category change
  const handleVatCategoryChange = (category) => {
    const vatConfig = VAT_CATEGORIES.find((c) => c.value === category);
    const isReverseCharge = category === 'REVERSE_CHARGE';
    setBill((prev) => ({
      ...prev,
      vatCategory: category,
      isReverseCharge,
      blockedVatReason: category === 'BLOCKED' ? prev.blockedVatReason : '',
    }));
    // Update all items with new VAT rate
    recalculateAllItems(vatConfig?.rate || 5);
  };

  // Add new line item
  const handleAddItem = () => {
    setBill((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  // Remove line item
  const handleRemoveItem = (index) => {
    if (bill.items.length <= 1) {
      notificationService.warning('At least one item is required');
      return;
    }
    const updatedItems = bill.items.filter((_, i) => i !== index);
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Update line item
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...bill.items];
    const item = { ...updatedItems[index] };

    if (field === 'productId' && value) {
      const product = products.find(
        (p) => p.id === value || p.id === parseInt(value),
      );
      if (product) {
        item.productId = product.id;
        item.description =
          product.displayName ||
          product.display_name ||
          product.uniqueName ||
          product.unique_name ||
          product.description ||
          '';
        item.unitPrice =
          product.purchasePrice || product.cost || product.price || 0;

        // Determine quantityUom from product's primary_uom or fallback to category detection
        const primaryUom = (
          product.primaryUom ||
          product.primary_uom ||
          ''
        ).toUpperCase();
        let quantityUom;
        if (primaryUom === 'MT' || primaryUom === 'KG') {
          quantityUom = primaryUom;
        } else {
          const category = (product.category || '').toLowerCase();
          const isCoil = category.includes('coil');
          quantityUom = isCoil ? 'MT' : 'PCS';
        }

        // Get pricing basis and unit weight from product
        item.pricingBasis =
          product.pricingBasis || product.pricing_basis || 'PER_MT';
        item.unitWeightKg =
          product.unitWeightKg || product.unit_weight_kg || null;
        item.quantityUom = quantityUom;

        // Flag if weight is missing for weight-based pricing
        item.missingWeightWarning =
          (item.pricingBasis === 'PER_MT' || item.pricingBasis === 'PER_KG') &&
          quantityUom === 'PCS' &&
          !item.unitWeightKg;
      }
    } else {
      item[field] = value;
    }

    // Recalculate item amounts when pricing fields change
    if (
      [
        'quantity',
        'unitPrice',
        'vatRate',
        'unitWeightKg',
        'pricingBasis',
      ].includes(field) ||
      field === 'productId'
    ) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 0;
      const pricingBasis = item.pricingBasis || 'PER_MT';
      const unitWeightKg = item.unitWeightKg;
      const quantityUom = item.quantityUom || 'PCS';

      // Use calculateItemAmount for proper pricing calculation
      item.amount = calculateItemAmount(
        qty,
        price,
        pricingBasis,
        unitWeightKg,
        quantityUom,
      );
      item.vatAmount = (item.amount * vatRate) / 100;

      // Update theoretical weight when quantity or unitWeightKg changes
      if (
        field === 'quantity' ||
        field === 'unitWeightKg' ||
        field === 'productId'
      ) {
        if (quantityUom === 'MT') {
          item.theoreticalWeightKg = qty * 1000;
        } else if (quantityUom === 'KG') {
          item.theoreticalWeightKg = qty;
        } else if (unitWeightKg) {
          item.theoreticalWeightKg = qty * unitWeightKg;
        }
      }

      // Update missing weight warning
      if (field === 'unitWeightKg' || field === 'pricingBasis') {
        item.missingWeightWarning =
          (pricingBasis === 'PER_MT' || pricingBasis === 'PER_KG') &&
          quantityUom === 'PCS' &&
          !unitWeightKg;
      }
    }

    updatedItems[index] = item;
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Recalculate all items with new VAT rate
  const recalculateAllItems = (newVatRate) => {
    const updatedItems = bill.items.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const pricingBasis = item.pricingBasis || 'PER_MT';
      const unitWeightKg = item.unitWeightKg;
      const quantityUom = item.quantityUom || 'PCS';

      const amount = calculateItemAmount(
        qty,
        price,
        pricingBasis,
        unitWeightKg,
        quantityUom,
      );
      const vatAmount = (amount * newVatRate) / 100;
      return { ...item, vatRate: newVatRate, amount, vatAmount };
    });
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Recalculate totals
  const recalculateTotals = (items) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0,
    );
    const vatAmount = items.reduce(
      (sum, item) => sum + (parseFloat(item.vatAmount) || 0),
      0,
    );

    setBill((prev) => {
      const allCharges =
        (parseFloat(prev.freightCharges) || 0) +
        (parseFloat(prev.customsDuty) || 0) +
        (parseFloat(prev.insuranceCharges) || 0) +
        (parseFloat(prev.handlingCharges) || 0) +
        (parseFloat(prev.otherCharges) || 0);

      const total = subtotal + vatAmount + allCharges;

      return {
        ...prev,
        subtotal,
        vatAmount,
        total,
        reverseChargeAmount: prev.isReverseCharge ? vatAmount : 0,
      };
    });
  };

  // Quick add product handler
  const handleQuickAddProduct = useCallback(
    (product) => {
      const newItem = {
        ...createEmptyItem(),
        productId: product.id,
        description:
          product.displayName ||
          product.display_name ||
          product.uniqueName ||
          product.unique_name ||
          product.description ||
          '',
        unitPrice: product.purchasePrice || product.cost || product.price || 0,
        pricingBasis: product.pricingBasis || product.pricing_basis || 'PER_MT',
        unitWeightKg: product.unitWeightKg || product.unit_weight_kg || null,
        quantityUom: product.primaryUom || product.primary_uom || 'PCS',
      };

      // Calculate amount and VAT
      const qty = 1;
      const price = newItem.unitPrice;
      newItem.amount = calculateItemAmount(
        qty,
        price,
        newItem.pricingBasis,
        newItem.unitWeightKg,
        newItem.quantityUom,
      );
      newItem.vatAmount = (newItem.amount * 5) / 100;

      setBill((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      recalculateTotals([...bill.items, newItem]);
    },
    [bill.items],
  );

  // Toggle pin product
  const togglePinProduct = async (e, productId) => {
    e.stopPropagation();
    try {
      if (pinnedProductIds.includes(productId)) {
        await pinnedProductsService.unpinProduct(productId);
        setPinnedProductIds((prev) => prev.filter((pid) => pid !== productId));
        localStorage.setItem(
          'vendorBillPinnedProducts',
          JSON.stringify(pinnedProductIds.filter((pid) => pid !== productId)),
        );
      } else {
        if (pinnedProductIds.length >= 10) {
          notificationService.error('Maximum 10 pinned products allowed');
          return;
        }
        await pinnedProductsService.pinProduct(productId);
        const newPinned = [...pinnedProductIds, productId];
        setPinnedProductIds(newPinned);
        localStorage.setItem(
          'vendorBillPinnedProducts',
          JSON.stringify(newPinned),
        );
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  // Sort products: pinned first, then by purchase frequency
  const sortedProducts = useMemo(() => {
    const pinned = products.filter((p) => pinnedProductIds.includes(p.id));
    const unpinned = products
      .filter((p) => !pinnedProductIds.includes(p.id))
      .sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
    return [...pinned, ...unpinned];
  }, [products, pinnedProductIds]);

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!bill.vendorId) {
      errors.push('Please select a vendor');
    }
    if (!bill.billNumber) {
      errors.push('Bill number is required');
    }
    if (!bill.billDate) {
      errors.push('Bill date is required');
    }
    if (bill.vatCategory === 'BLOCKED' && !bill.blockedVatReason) {
      errors.push('Blocked VAT reason is required');
    }

    const validItems = bill.items.filter(
      (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
    );
    if (validItems.length === 0) {
      errors.push('At least one valid line item is required');
    }

    // CRITICAL: Block save when unit weight is missing for weight-based pricing
    bill.items.forEach((item, index) => {
      if (item.missingWeightWarning) {
        errors.push(
          `Item ${index + 1}: Unit weight is missing for "${item.description}". This product has weight-based pricing (${item.pricingBasis}) but no unit weight. Please contact admin to add unit weight to the product master.`,
        );
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle save
  const handleSave = async (status = 'draft') => {
    if (!validateForm()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);

      // Filter valid items only
      const validItems = bill.items.filter(
        (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
      );

      const billData = {
        ...bill,
        status,
        items: validItems,
      };

      if (isEditMode) {
        await vendorBillService.update(id, billData);
        notificationService.success('Vendor bill updated successfully');
      } else {
        await vendorBillService.create(billData);
        notificationService.success('Vendor bill created successfully');
      }

      navigate('/purchases/vendor-bills');
    } catch (error) {
      console.error('Error saving vendor bill:', error);
      notificationService.error(error.message || 'Failed to save vendor bill');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Loading vendor bill...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-20 border-b shadow-sm ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/purchases/vendor-bills')}
                className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Back to vendor bills"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1
                  className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {isEditMode ? 'Edit Vendor Bill' : 'New Vendor Bill'}
                </h1>
                <p
                  className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {bill.billNumber || 'Bill #'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-start relative">
              {/* Match to GRN Button */}
              {bill.vendorId && !bill.grnId && (
                <Button
                  variant="outline"
                  onClick={() => setShowGRNMatchModal(true)}
                  disabled={loadingGRNs || !bill.vendorId}
                  title="Link this bill to a Goods Receipt Note for 3-way matching"
                >
                  {loadingGRNs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Match to GRN
                </Button>
              )}

              {/* Show linked GRN/PO badge */}
              {bill.grnId && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    isDarkMode
                      ? 'bg-teal-900/30 text-teal-300 border border-teal-700'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  <span>GRN: {bill.grnNumber}</span>
                  {bill.poNumber && (
                    <span className="text-xs opacity-75">
                      | PO: {bill.poNumber}
                    </span>
                  )}
                  <button
                    onClick={() => handleGRNSelect(null)}
                    className="ml-1 p-0.5 hover:bg-teal-600/20 rounded"
                    title="Unlink GRN"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowFormSettings(!showFormSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Form settings"
                title="Form Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <FormSettingsPanel
                isOpen={showFormSettings}
                onClose={() => setShowFormSettings(false)}
                preferences={formPreferences}
                onPreferenceChange={(key, value) => {
                  setFormPreferences((prev) => ({ ...prev, [key]: value }));
                }}
              />

              <Button
                variant="secondary"
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>

              <Button onClick={() => handleSave('approved')} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save & Approve
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              isDarkMode
                ? 'bg-red-900/20 border-red-600 text-red-200'
                : 'bg-red-50 border-red-500 text-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={isDarkMode ? 'text-red-400' : 'text-red-600'}
                size={24}
              />
              <div>
                <h4 className="font-bold mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor & Bill Info */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <Building2 className="h-5 w-5" />
                Vendor Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Selection */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bill.vendorId || ''}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bill Number */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bill.billNumber}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        billNumber: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Vendor Invoice Number */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Vendor Invoice # (Reference)
                  </label>
                  <input
                    type="text"
                    value={bill.vendorInvoiceNumber}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        vendorInvoiceNumber: e.target.value,
                      }))
                    }
                    placeholder="Vendor's invoice number"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Bill Date */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Bill Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bill.billDate}
                    onChange={(e) =>
                      setBill((prev) => ({ ...prev, billDate: e.target.value }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Payment Terms
                  </label>
                  <select
                    value={bill.paymentTerms}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        paymentTerms: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {PAYMENT_TERMS.map((term) => (
                      <option key={term.value} value={term.value}>
                        {term.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={bill.dueDate}
                    onChange={(e) =>
                      setBill((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Procurement Channel */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Procurement Channel
                  </label>
                  <select
                    value={bill.procurementChannel}
                    onChange={(e) =>
                      handleProcurementChannelChange(e.target.value)
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {PROCUREMENT_CHANNELS.map((channel) => (
                      <option key={channel.value} value={channel.value}>
                        {channel.label}
                      </option>
                    ))}
                  </select>
                  <p
                    className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {bill.procurementChannel === 'IMPORTED'
                      ? 'Reverse charge VAT applies'
                      : 'Standard input VAT'}
                  </p>
                </div>

                {/* Import Container (shown for import purchases) */}
                {bill.procurementChannel === 'IMPORTED' && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Import Container
                    </label>
                    <select
                      value={bill.importContainerId || ''}
                      onChange={(e) => {
                        const container = availableContainers.find(
                          (c) => c.id === parseInt(e.target.value),
                        );
                        setBill((prev) => ({
                          ...prev,
                          importContainerId: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                          importContainerNumber:
                            container?.containerNumber || '',
                        }));
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="">Select Container...</option>
                      {availableContainers.map((container) => (
                        <option key={container.id} value={container.id}>
                          {container.containerNumber} - {container.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* VAT Details */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <FileText className="h-5 w-5" />
                VAT Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* VAT Category */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    VAT Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bill.vatCategory}
                    onChange={(e) => handleVatCategoryChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {VAT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Place of Supply */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Place of Supply
                  </label>
                  <select
                    value={bill.placeOfSupply}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        placeOfSupply: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {EMIRATES.map((emirate) => (
                      <option key={emirate.value} value={emirate.value}>
                        {emirate.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blocked VAT Reason - only shown for BLOCKED category */}
                {bill.vatCategory === 'BLOCKED' && (
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Blocked VAT Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bill.blockedVatReason}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          blockedVatReason: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="">Select reason...</option>
                      {BLOCKED_VAT_REASONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                    <p
                      className={`mt-1 text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                    >
                      Blocked VAT cannot be recovered per UAE FTA Article 53
                    </p>
                  </div>
                )}

                {/* Reverse Charge Notice */}
                {bill.isReverseCharge && (
                  <div
                    className={`md:col-span-2 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-600' : 'bg-blue-50 border border-blue-200'}`}
                  >
                    <p
                      className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}
                    >
                      <strong>Reverse Charge:</strong> You will account for VAT
                      of {formatCurrency(bill.vatAmount)} on this purchase. This
                      will be shown as both input and output VAT on your VAT
                      return.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Add Speed Buttons */}
            {formPreferences.showSpeedButtons && sortedProducts.length > 0 && (
              <Card className="p-3 md:p-4 mb-6">
                <p
                  className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Quick Add (Pinned & Top Products)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sortedProducts.slice(0, 8).map((product) => {
                    const isPinned = pinnedProductIds.includes(product.id);
                    return (
                      <div key={product.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleQuickAddProduct(product)}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-white'
                              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                          }`}
                        >
                          <div className="font-medium truncate">
                            {product.displayName ||
                              product.display_name ||
                              product.uniqueName ||
                              product.unique_name ||
                              product.name}
                          </div>
                          <div
                            className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            {formatCurrency(
                              product.purchasePrice ||
                                product.cost ||
                                product.price ||
                                0,
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => togglePinProduct(e, product.id)}
                          className={`absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            isPinned
                              ? 'text-teal-500'
                              : isDarkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                          }`}
                          title={isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin
                            className={`h-3 w-3 ${isPinned ? 'fill-current' : ''}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Line Items */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  <Package className="h-5 w-5" />
                  Line Items
                </h2>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {bill.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                  >
                    <div className="grid grid-cols-12 gap-4">
                      {/* Product/Description */}
                      <div className="col-span-12 md:col-span-4">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Product / Description
                        </label>
                        <select
                          value={item.productId || ''}
                          onChange={(e) =>
                            handleItemChange(index, 'productId', e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <option value="">
                            Select or type description...
                          </option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.displayName ||
                                product.display_name ||
                                product.uniqueName ||
                                product.unique_name ||
                                'N/A'}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'description',
                              e.target.value,
                            )
                          }
                          placeholder="Description"
                          className={`w-full mt-2 px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3 md:col-span-1">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Qty ({item.quantityUom || 'PCS'})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={
                            item.quantityUom === 'MT' ||
                            item.quantityUom === 'KG'
                              ? '0.001'
                              : '1'
                          }
                          value={item.quantity}
                          onChange={(e) => {
                            const allowDecimal =
                              item.quantityUom === 'MT' ||
                              item.quantityUom === 'KG';
                            const val = allowDecimal
                              ? parseFloat(e.target.value)
                              : parseInt(e.target.value, 10);
                            handleItemChange(
                              index,
                              'quantity',
                              isNaN(val) ? '' : val,
                            );
                          }}
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>

                      {/* Unit Weight */}
                      <div className="col-span-3 md:col-span-1">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Unit Wt (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitWeightKg || ''}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'unitWeightKg',
                              e.target.value === ''
                                ? null
                                : parseFloat(e.target.value),
                            )
                          }
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } ${item.missingWeightWarning ? 'border-red-500' : ''} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>

                      {/* Total Weight */}
                      <div className="col-span-3 md:col-span-1">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Total Wt
                        </label>
                        <div
                          className={`px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700/50 text-gray-300'
                              : 'border-gray-300 bg-gray-100 text-gray-600'
                          }`}
                        >
                          {(() => {
                            const totalWt =
                              item.theoreticalWeightKg ||
                              item.quantity * (item.unitWeightKg || 0);
                            return totalWt ? totalWt.toFixed(2) : '-';
                          })()}
                        </div>
                      </div>

                      {/* Unit Price with Pricing Basis */}
                      <div className="col-span-3 md:col-span-2">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Unit Price
                        </label>
                        <div
                          className={`flex rounded overflow-hidden border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'unitPrice',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`flex-1 px-3 py-2 text-sm border-0 outline-none ${
                              isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-white text-gray-900'
                            }`}
                          />
                          <select
                            value={item.pricingBasis || 'PER_MT'}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'pricingBasis',
                                e.target.value,
                              )
                            }
                            className={`text-xs font-bold px-1.5 border-l cursor-pointer outline-none ${
                              item.pricingBasis === 'PER_KG'
                                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700'
                                : item.pricingBasis === 'PER_PCS'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700'
                                  : 'bg-gray-50 text-gray-600 border-gray-300'
                            }`}
                          >
                            <option value="PER_MT">/MT</option>
                            <option value="PER_KG">/kg</option>
                            <option value="PER_PCS">/pc</option>
                          </select>
                        </div>
                      </div>

                      {/* VAT Rate */}
                      <div className="col-span-4 md:col-span-1">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          VAT %
                        </label>
                        <input
                          type="number"
                          value={item.vatRate}
                          disabled
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-500'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                          }`}
                        />
                      </div>

                      {/* VAT Amount */}
                      <div className="col-span-6 md:col-span-1">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          VAT
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(item.vatAmount)}
                          disabled
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-500'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                          }`}
                        />
                      </div>

                      {/* Amount */}
                      <div className="col-span-6 md:col-span-1">
                        <label
                          className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Amount
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(item.amount)}
                          disabled
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-500'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                          }`}
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Missing Weight Warning */}
                      {item.missingWeightWarning && (
                        <div
                          className={`col-span-12 p-2 rounded-md border ${isDarkMode ? 'bg-amber-900/30 border-amber-600' : 'bg-amber-50 border-amber-200'}`}
                        >
                          <p
                            className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}
                          >
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            Unit weight missing for weight-based pricing (
                            {item.pricingBasis}). Contact admin to update
                            product master.
                          </p>
                        </div>
                      )}

                      {/* Stock-In Fields Row (Phase 5) */}
                      <div
                        className={`col-span-12 mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <div className="grid grid-cols-12 gap-3">
                          {/* Line Procurement Channel */}
                          <div className="col-span-6 md:col-span-2">
                            <label
                              className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                            >
                              <Ship className="inline h-3 w-3 mr-1" />
                              Source
                            </label>
                            <select
                              value={
                                item.procurementChannel ||
                                bill.procurementChannel ||
                                'LOCAL'
                              }
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'procurementChannel',
                                  e.target.value,
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded border text-xs ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-700 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                            >
                              <option value="LOCAL">Local</option>
                              <option value="IMPORTED">Import</option>
                            </select>
                          </div>

                          {/* PO Weight */}
                          <div className="col-span-6 md:col-span-2">
                            <label
                              className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                            >
                              <Scale className="inline h-3 w-3 mr-1" />
                              PO Wt (kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="-"
                              value={item.poWeightKg || ''}
                              onChange={(e) => {
                                const poWt =
                                  e.target.value === ''
                                    ? null
                                    : parseFloat(e.target.value);
                                const recvWt = item.receivedWeightKg || 0;
                                const variance =
                                  poWt && recvWt ? recvWt - poWt : null;
                                const variancePercent =
                                  poWt && variance
                                    ? (variance / poWt) * 100
                                    : null;
                                handleItemChange(index, 'poWeightKg', poWt);
                                if (variance !== null) {
                                  handleItemChange(
                                    index,
                                    'weightVarianceKg',
                                    variance,
                                  );
                                  handleItemChange(
                                    index,
                                    'weightVariancePercent',
                                    variancePercent,
                                  );
                                }
                              }}
                              className={`w-full px-2 py-1.5 rounded border text-xs ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-700 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                            />
                          </div>

                          {/* Received Weight */}
                          <div className="col-span-6 md:col-span-2">
                            <label
                              className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                            >
                              Recv Wt (kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="-"
                              value={item.receivedWeightKg || ''}
                              onChange={(e) => {
                                const recvWt =
                                  e.target.value === ''
                                    ? null
                                    : parseFloat(e.target.value);
                                const poWt = item.poWeightKg || 0;
                                const variance =
                                  poWt && recvWt ? recvWt - poWt : null;
                                const variancePercent =
                                  poWt && variance
                                    ? (variance / poWt) * 100
                                    : null;
                                handleItemChange(
                                  index,
                                  'receivedWeightKg',
                                  recvWt,
                                );
                                if (variance !== null) {
                                  handleItemChange(
                                    index,
                                    'weightVarianceKg',
                                    variance,
                                  );
                                  handleItemChange(
                                    index,
                                    'weightVariancePercent',
                                    variancePercent,
                                  );
                                }
                              }}
                              className={`w-full px-2 py-1.5 rounded border text-xs ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-700 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                            />
                          </div>

                          {/* Weight Variance */}
                          <div className="col-span-6 md:col-span-2">
                            <label
                              className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                            >
                              Variance
                            </label>
                            <div
                              className={`px-2 py-1.5 rounded border text-xs ${
                                item.weightVarianceKg
                                  ? item.weightVarianceKg > 0
                                    ? isDarkMode
                                      ? 'border-green-600 bg-green-900/20 text-green-400'
                                      : 'border-green-300 bg-green-50 text-green-700'
                                    : item.weightVarianceKg < 0
                                      ? isDarkMode
                                        ? 'border-red-600 bg-red-900/20 text-red-400'
                                        : 'border-red-300 bg-red-50 text-red-700'
                                      : isDarkMode
                                        ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                                        : 'border-gray-300 bg-gray-100 text-gray-500'
                                  : isDarkMode
                                    ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                                    : 'border-gray-300 bg-gray-100 text-gray-500'
                              }`}
                            >
                              {item.weightVarianceKg
                                ? `${item.weightVarianceKg > 0 ? '+' : ''}${item.weightVarianceKg.toFixed(2)} kg (${item.weightVariancePercent?.toFixed(1) || 0}%)`
                                : '-'}
                            </div>
                          </div>

                          {/* Batch Number */}
                          <div className="col-span-6 md:col-span-2">
                            <label
                              className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                            >
                              <Layers className="inline h-3 w-3 mr-1" />
                              Batch #
                            </label>
                            <input
                              type="text"
                              placeholder="Auto"
                              value={item.batchNumber || ''}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'batchNumber',
                                  e.target.value,
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded border text-xs ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                            />
                          </div>

                          {/* Create Batch Toggle */}
                          <div className="col-span-6 md:col-span-2 flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.createBatch !== false}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'createBatch',
                                    e.target.checked,
                                  )
                                }
                                className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span
                                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                              >
                                Create Batch
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Charges */}
            <Card className="p-3 md:p-4 mt-6">
              <h3
                className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Freight and Duty Charges
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Freight Charges"
                  type="number"
                  value={bill.freightCharges || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setBill((prev) => ({ ...prev, freightCharges: amount }));
                    recalculateTotals(bill.items);
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <Input
                  label="Customs Duty"
                  type="number"
                  value={bill.customsDuty || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setBill((prev) => ({ ...prev, customsDuty: amount }));
                    recalculateTotals(bill.items);
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <Input
                  label="Insurance Charges"
                  type="number"
                  value={bill.insuranceCharges || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setBill((prev) => ({ ...prev, insuranceCharges: amount }));
                    recalculateTotals(bill.items);
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <Input
                  label="Handling Charges"
                  type="number"
                  value={bill.handlingCharges || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setBill((prev) => ({ ...prev, handlingCharges: amount }));
                    recalculateTotals(bill.items);
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <Input
                  label="Other Charges"
                  type="number"
                  value={bill.otherCharges || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setBill((prev) => ({ ...prev, otherCharges: amount }));
                    recalculateTotals(bill.items);
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </Card>

            {/* Notes and Terms - 2 Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="p-3 md:p-4">
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Bill Notes
                </label>
                <textarea
                  value={bill.notes || ''}
                  onChange={(e) =>
                    setBill((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any notes about this vendor bill..."
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </Card>

              <Card className="p-3 md:p-4">
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Payment Terms
                </label>
                <textarea
                  value={bill.terms || ''}
                  onChange={(e) =>
                    setBill((prev) => ({ ...prev, terms: e.target.value }))
                  }
                  placeholder="Enter payment terms..."
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </Card>
            </div>
          </div>

          {/* Sidebar - Totals & Notes */}
          <div className="space-y-6">
            {/* Totals */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                  >
                    Subtotal:
                  </span>
                  <span
                    className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {formatCurrency(bill.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                  >
                    VAT (
                    {VAT_CATEGORIES.find((c) => c.value === bill.vatCategory)
                      ?.rate || 5}
                    %):
                  </span>
                  <span
                    className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {formatCurrency(bill.vatAmount)}
                  </span>
                </div>
                {(bill.freightCharges > 0 ||
                  bill.customsDuty > 0 ||
                  bill.insuranceCharges > 0 ||
                  bill.handlingCharges > 0 ||
                  bill.otherCharges > 0) && (
                  <div
                    className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <span>Additional Charges:</span>
                    <span>
                      {formatCurrency(
                        (parseFloat(bill.freightCharges) || 0) +
                          (parseFloat(bill.customsDuty) || 0) +
                          (parseFloat(bill.insuranceCharges) || 0) +
                          (parseFloat(bill.handlingCharges) || 0) +
                          (parseFloat(bill.otherCharges) || 0),
                      )}
                    </span>
                  </div>
                )}
                {bill.isReverseCharge && (
                  <div
                    className={`flex justify-between text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    <span>Reverse Charge VAT:</span>
                    <span>{formatCurrency(bill.reverseChargeAmount)}</span>
                  </div>
                )}
                <div
                  className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <span
                    className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Total:
                  </span>
                  <span className="text-lg font-bold text-teal-600">
                    {formatCurrency(bill.total)}
                  </span>
                </div>

                {/* Landed Cost Section */}
                {bill.totalLandedCost > 0 &&
                  bill.totalLandedCost !== bill.total && (
                  <div
                    className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between">
                      <span
                        className={`text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                      >
                          Total Landed Cost:
                      </span>
                      <span
                        className={`text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                      >
                        {formatCurrency(bill.totalLandedCost)}
                      </span>
                    </div>
                    {bill.landedCostPerUnit > 0 && (
                      <div
                        className={`flex justify-between text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        <span>Landed Cost / KG:</span>
                        <span>{formatCurrency(bill.landedCostPerUnit)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Notes
              </h2>
              <textarea
                value={bill.notes}
                onChange={(e) =>
                  setBill((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
                placeholder="Internal notes about this bill..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>

            {/* Vendor Details (if selected) */}
            {bill.vendor && (
              <div
                className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <h2
                  className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Vendor Details
                </h2>
                <div
                  className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <div>
                    <span className="font-medium">Name:</span>{' '}
                    {bill.vendor.name}
                  </div>
                  {bill.vendor.trn && (
                    <div>
                      <span className="font-medium">TRN:</span>{' '}
                      {bill.vendor.trn}
                    </div>
                  )}
                  {bill.vendor.email && (
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      {bill.vendor.email}
                    </div>
                  )}
                  {bill.vendor.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>{' '}
                      {bill.vendor.phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock-In Information */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <Layers className="h-5 w-5" />
                Stock-In Details
              </h2>
              <div
                className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {/* Procurement Channel */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Procurement:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      bill.procurementChannel === 'IMPORTED'
                        ? isDarkMode
                          ? 'bg-blue-900/50 text-blue-300'
                          : 'bg-blue-100 text-blue-700'
                        : isDarkMode
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {bill.procurementChannel === 'IMPORTED'
                      ? 'Import'
                      : 'Local'}
                  </span>
                </div>

                {/* GRN Link */}
                {bill.grnNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">GRN:</span>
                    <span className="text-teal-600">{bill.grnNumber}</span>
                  </div>
                )}

                {/* PO Link */}
                {bill.poNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">PO:</span>
                    <span>{bill.poNumber}</span>
                  </div>
                )}

                {/* Import Container */}
                {bill.importContainerNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">Container:</span>
                    <span>{bill.importContainerNumber}</span>
                  </div>
                )}

                {/* Landed Cost */}
                {bill.totalLandedCost > 0 && (
                  <>
                    <div
                      className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <span className="font-medium">Total Landed Cost:</span>
                      <span className="font-bold text-teal-600">
                        {formatCurrency(bill.totalLandedCost)}
                      </span>
                    </div>
                    {bill.landedCostPerUnit > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Per KG:</span>
                        <span>{formatCurrency(bill.landedCostPerUnit)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Batch Creation Flag */}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">Create Batches:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bill.triggerBatchCreation}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          triggerBatchCreation: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div
                      className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${
                        isDarkMode
                          ? 'bg-gray-600 peer-checked:bg-teal-600'
                          : 'bg-gray-300 peer-checked:bg-teal-600'
                      }`}
                    ></div>
                  </label>
                </div>
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  When approved, creates inventory batches for each line item
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRN Match Modal */}
      {showGRNMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl shadow-2xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div
              className={`sticky top-0 px-6 py-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Select GRN to Match
                </h3>
                <button
                  onClick={() => setShowGRNMatchModal(false)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p
                className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Link this vendor bill to a Goods Receipt Note for 3-way matching
                (PO - GRN - Bill)
              </p>
            </div>

            <div className="p-6">
              {loadingGRNs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : availableGRNs.length === 0 ? (
                <div
                  className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No unbilled GRNs available for this vendor.</p>
                  <p className="text-sm mt-1">
                    Create a GRN first or select a different vendor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableGRNs.map((grn) => (
                    <button
                      key={grn.id}
                      onClick={() => handleGRNSelect(grn)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isDarkMode
                          ? 'border-gray-600 hover:border-teal-500 hover:bg-gray-700/50'
                          : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div
                            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {grn.grnNumber}
                          </div>
                          <div
                            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            {grn.poNumber && `PO: ${grn.poNumber}`}
                            {grn.receivedDate &&
                              ` | Received: ${grn.receivedDate}`}
                          </div>
                          {grn.items && grn.items.length > 0 && (
                            <div
                              className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                            >
                              {grn.items.length} item
                              {grn.items.length !== 1 ? 's' : ''} | Total:{' '}
                              {formatCurrency(grn.totalAmount || 0)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {grn.procurementChannel === 'IMPORTED' && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              <Ship className="h-3 w-3 inline mr-1" />
                              Import
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isDarkMode
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {grn.status || 'approved'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Skip GRN Matching Option */}
              <div
                className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <button
                  onClick={() => setShowGRNMatchModal(false)}
                  className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Skip - Create bill without GRN link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBillForm;
