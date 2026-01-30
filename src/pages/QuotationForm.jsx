import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  User,
  FileText,
  Calculator,
  AlertCircle,
  CheckCircle,
  X,
  Pin,
  Settings,
  Loader2,
  Eye,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { quotationService } from '../services/quotationService';
import { productsAPI, apiClient } from '../services/api';
import { customerService } from '../services/customerService';
import pricelistService from '../services/pricelistService';
import { formatCurrency, calculateItemAmount } from '../utils/invoiceUtils';
import { STEEL_GRADES, FINISHES } from '../types';
import QuotationPreview from '../components/quotations/QuotationPreview';
import StockAvailabilityIndicator from '../components/invoice/StockAvailabilityIndicator';
import SourceTypeSelector from '../components/invoice/SourceTypeSelector';
import { FormSelect } from '../components/ui/form-select';
import { SelectItem } from '../components/ui/select';
// Steel industry specific components (STEEL-FORMS-PHASE1 Priority 2)
import PriceValiditySelector from '../components/quotations/PriceValiditySelector';
import VolumeDiscountTiersModal from '../components/quotations/VolumeDiscountTiersModal';
import BatchesModal from '../components/quotations/BatchesModal';
import DeliveryScheduleModal from '../components/quotations/DeliveryScheduleModal';
import AlternativeProductsModal from '../components/quotations/AlternativeProductsModal';
import StockReservationToggle from '../components/quotations/StockReservationToggle';
import LeadTimeInput from '../components/quotations/LeadTimeInput';

// Toggle Switch Component (extracted to avoid creating components during render)
const ToggleSwitchQuotation = ({ enabled, onChange, label, description, isDarkMode }) => (
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
        <ToggleSwitchQuotation
          enabled={preferences.showValidationHighlighting}
          onChange={() =>
            onPreferenceChange(
              'showValidationHighlighting',
              !preferences.showValidationHighlighting,
            )
          }
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
          isDarkMode={isDarkMode}
        />
        <ToggleSwitchQuotation
          enabled={preferences.showSpeedButtons}
          onChange={() =>
            onPreferenceChange(
              'showSpeedButtons',
              !preferences.showSpeedButtons,
            )
          }
          isDarkMode={isDarkMode}
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

// ==================== DESIGN TOKENS ====================
// const COLORS = {
//   bg: '#0b0f14',
//   card: '#141a20',
//   border: '#2a3640',
//   text: '#e6edf3',
//   muted: '#93a4b4',
//   accent: '#0d9488', // teal-600
//   accentHover: '#14b8a6', // teal-500
//   inputBg: '#0f151b',
// };

// Drawer Component for secondary content
const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  isDarkMode,
  width = 'w-[min(620px,92vw)]',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        onKeyDown={handleOverlayKeyDown}
        role="button"
        tabIndex={0}
      />
      <div
        className={`fixed top-0 right-0 h-full ${width} z-[31]
          ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'}
          overflow-auto transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-4">
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3
            ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'}
            z-[1]`}
          >
            <div>
              <div className="text-sm font-extrabold">{title}</div>
              {subtitle && (
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  {subtitle}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#2a3640]' : 'hover:bg-gray-100'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
};

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const isEdit = Boolean(id);

  // Drawer states
  const [chargesDrawerOpen, setChargesDrawerOpen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);

  // Steel industry feature states (STEEL-FORMS-PHASE1 Priority 2)
  const [batchesModalOpen, setBatchesModalOpen] = useState(false);
  const [selectedItemForBatches, setSelectedItemForBatches] = useState(null);
  const [deliveryScheduleModalOpen, setDeliveryScheduleModalOpen] =
    useState(false);
  const [selectedItemForDelivery, setSelectedItemForDelivery] = useState(null);
  const [alternativeProductsModalOpen, setAlternativeProductsModalOpen] =
    useState(false);
  const [selectedItemForAlternatives, setSelectedItemForAlternatives] =
    useState(null);
  const [volumeDiscountModalOpen, setVolumeDiscountModalOpen] = useState(false);

  // Form preferences (with localStorage persistence)
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem('quotationFormPreferences');
    return saved
      ? JSON.parse(saved)
      : {
          showSpeedButtons: true,
          showValidationHighlighting: true,
        };
  });

  const [formData, setFormData] = useState({
    quotationNumber: 'QT-DRAFT',
    customerId: '',
    customerDetails: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        emirate: '',
        country: 'UAE',
      },
      vatNumber: '',
    },
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    // Customer PO fields
    customerPurchaseOrderNumber: '',
    customerPurchaseOrderDate: '',
    // Warehouse
    warehouseId: '',
    warehouseName: '',
    warehouseCode: '',
    warehouseCity: '',
    // Currency
    currency: 'AED',
    exchangeRate: 1,
    deliveryTerms: '',
    paymentTerms: '',
    notes: '',
    termsAndConditions: '',
    items: [],
    subtotal: 0,
    vatAmount: 0,
    totalQuantity: 0,
    totalWeight: 0,
    // All charges
    packingCharges: 0,
    freightCharges: 0,
    insuranceCharges: 0,
    loadingCharges: 0,
    otherCharges: 0,
    // Discount (invoice-level, optional)
    discountType: 'amount',
    discountPercentage: 0,
    discountAmount: 0,
    total: 0,
    status: 'draft',
    // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
    priceValidityCondition: '',
    volumeDiscountTiers: [],
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Customer input for autocomplete
  const [customerInputValue, setCustomerInputValue] = useState('');

  // Pricelist state
  const [selectedPricelistId, setSelectedPricelistId] = useState(null);
  const [_pricelistName, setPricelistName] = useState(null);

  // Pinned products (localStorage)
  const [pinnedProductIds, setPinnedProductIds] = useState(() => {
    const saved = localStorage.getItem('quotationPinnedProducts');
    return saved ? JSON.parse(saved) : [];
  });

  // Field validation state (real-time)
  const [fieldValidation, setFieldValidation] = useState({});

  // Auto-clear success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear non-critical errors
  useEffect(() => {
    if (error && !error.includes('not found') && !error.includes('permission') && !error.includes('not have')) {
      const timer = setTimeout(() => {
        setError('');
      }, 10000); // Clear after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-save functionality
  useEffect(() => {
    if (!isEdit && formData.items.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        const draftKey = `quotation-draft-${Date.now()}`;
        localStorage.setItem(draftKey, JSON.stringify(formData));
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, isEdit]);

  // Validation function
  const validateField = useCallback(
    (fieldName, value) => {
      let isValid = true;

      switch (fieldName) {
        case 'quotationNumber':
          isValid = value && String(value).trim() !== '';
          break;
        case 'customerName':
          isValid = value && String(value).trim() !== '';
          break;
        case 'quotationDate':
          isValid = value && String(value).trim() !== '';
          // Warn if date is in the future
          if (isValid && new Date(value) > new Date()) {
            console.warn('Quotation date is in the future');
          }
          break;
        case 'validUntil':
          isValid = true; // Optional field
          if (value && formData.quotationDate && value < formData.quotationDate) {
            isValid = false;
          }
          break;
        case 'exchangeRate':
          // Required if currency is not AED, must be positive
          if (formData.currency !== 'AED') {
            isValid = value && Number(value) > 0;
          } else {
            isValid = !value || Number(value) > 0;
          }
          break;
        case 'warehouse':
          // Warehouse is optional for drafts, required for others
          if (formData.status === 'draft') {
            isValid = true;
          } else {
            isValid = value && String(value).trim() !== '';
          }
          break;
        case 'currency':
          isValid = value && String(value).trim() !== '';
          break;
        default:
          isValid = true;
      }

      setFieldValidation((prev) => ({
        ...prev,
        [fieldName]: isValid ? 'valid' : 'invalid',
      }));

      return isValid;
    },
    [formData.status],
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, productsResponse, warehousesResponse] =
          await Promise.all([
            customerService.getCustomers({ status: 'active', limit: 1000 }),
            productsAPI.getAll({ limit: 1000 }),
            apiClient.get('/warehouses'),
          ]);

        setCustomers(customersResponse.customers || []);
        setProducts(productsResponse.products || []);

        const warehouseList =
          warehousesResponse?.warehouses ||
          warehousesResponse?.data?.warehouses ||
          [];
        const activeWarehouses = warehouseList.filter(
          (w) => w.isActive !== false,
        );
        setWarehouses(activeWarehouses);

        // Set default warehouse (Sharjah) for new quotations
        if (!isEdit && activeWarehouses.length > 0 && !formData.warehouseId) {
          const sharjahWarehouse = activeWarehouses.find(
            (w) =>
              w.city?.toLowerCase().includes('sharjah') ||
              w.name?.toLowerCase().includes('sharjah'),
          );
          const defaultWarehouse = sharjahWarehouse || activeWarehouses[0];

          setFormData((prev) => ({
            ...prev,
            warehouseId: defaultWarehouse.id.toString(),
            warehouseName: defaultWarehouse.name || '',
            warehouseCode: defaultWarehouse.code || '',
            warehouseCity: defaultWarehouse.city || '',
          }));
        }

        if (!isEdit) {
          // Get next quotation number
          const nextNumberResponse = await quotationService.getNextNumber();
          setFormData((prev) => ({
            ...prev,
            quotationNumber: nextNumberResponse.nextQuotationNumber,
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load initial data');
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // Fetch quotation data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchQuotation = async () => {
        try {
          setLoading(true);
          const response = await quotationService.getById(id);

          // Transform snake_case to camelCase
          // Parse customerDetails safely with better error handling
          const defaultCustomerDetails = {
            name: '',
            company: '',
            email: '',
            phone: '',
            address: {
              street: '',
              city: '',
              emirate: '',
              country: 'UAE',
            },
            vatNumber: '',
          };

          let parsedCustomerDetails = defaultCustomerDetails;

          if (typeof response.customerDetails === 'string' && response.customerDetails?.trim()) {
            try {
              const parsed = JSON.parse(response.customerDetails);
              // Validate parsed object has required structure
              if (typeof parsed === 'object' && parsed !== null) {
                parsedCustomerDetails = {
                  ...defaultCustomerDetails,
                  ...parsed,
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse customerDetails JSON:', parseError);
              // Use defaults - don't throw or propagate parse error
              parsedCustomerDetails = defaultCustomerDetails;
            }
          } else if (typeof response.customerDetails === 'object' && response.customerDetails) {
            parsedCustomerDetails = {
              ...defaultCustomerDetails,
              ...response.customerDetails,
            };
          }

          // Helper function to safely parse numbers
          const safeNumber = (value, defaultValue = 0) => {
            const num = Number(value);
            return isNaN(num) ? defaultValue : num;
          };

          // Helper function to safely extract date (YYYY-MM-DD format)
          const safeDate = (dateString) => {
            if (!dateString) return '';
            if (typeof dateString === 'string' && dateString.includes('T')) {
              return dateString.split('T')[0];
            }
            return dateString || '';
          };

          setFormData({
            quotationNumber: response.quotationNumber && String(response.quotationNumber).trim() ? String(response.quotationNumber) : '',
            customerId: response.customerId ? String(response.customerId) : '',
            customerDetails: parsedCustomerDetails,
            quotationDate: safeDate(response.quotationDate),
            validUntil: safeDate(response.validUntil),
            customerPurchaseOrderNumber:
              response.customerPurchaseOrderNumber || '',
            customerPurchaseOrderDate:
              safeDate(response.customerPurchaseOrderDate),
            warehouseId: response.warehouseId ? String(response.warehouseId) : '',
            warehouseName: response.warehouseName || '',
            warehouseCode: response.warehouseCode || '',
            warehouseCity: response.warehouseCity || '',
            currency: response.currency || 'AED',
            exchangeRate: safeNumber(response.exchangeRate, 1),
            deliveryTerms: response.deliveryTerms || '',
            paymentTerms: response.paymentTerms || '',
            notes: response.notes || '',
            termsAndConditions: response.termsAndConditions || '',
            items: (response.items || []).map((item) => {
              // Safe JSON parsing helper for item fields
              const safeJsonParse = (value, defaultValue = []) => {
                if (typeof value === 'string') {
                  try {
                    return JSON.parse(value) || defaultValue;
                  } catch (parseError) {
                    console.warn('Failed to parse item field:', parseError);
                    return defaultValue;
                  }
                }
                return value || defaultValue;
              };

              return {
                productId: item.productId ? String(item.productId) : '',
                name: item.name || '',
                specification: item.specification || '',
                grade: item.grade || '',
                finish: item.finish || '',
                size: item.size || '',
                thickness: item.thickness || '',
                description: item.description || '',
                hsnCode: item.hsnCode || '',
                unit: item.unit || 'pcs',
                quantity: safeNumber(item.quantity),
                rate: safeNumber(item.rate),
                discount: safeNumber(item.discount),
                discountType: item.discountType || 'amount',
                taxableAmount: safeNumber(item.taxableAmount),
                vatRate: safeNumber(item.vatRate, 5),
                amount: safeNumber(item.amount),
                netAmount: safeNumber(item.netAmount),
                // Pricing & Commercial Fields
                pricingBasis: item.pricingBasis || 'PER_MT',
                unitWeightKg: safeNumber(item.unitWeightKg, null),
                quantityUom: item.quantityUom || 'PCS',
                theoreticalWeightKg: safeNumber(item.theoreticalWeightKg, null),
                missingWeightWarning: false,
                // Stock & Source Fields (Phase 3)
                sourceType: item.sourceType || 'WAREHOUSE',
                // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
                stockReserved: Boolean(item.stockReserved),
                reservationExpiry: safeDate(item.reservationExpiry),
                estimatedLeadTimeDays: safeNumber(item.estimatedLeadTimeDays),
                deliverySchedule: safeJsonParse(item.deliverySchedule, []),
                alternativeProducts: safeJsonParse(item.alternativeProducts, []),
              };
            }),
            subtotal: safeNumber(response.subtotal),
            vatAmount: safeNumber(response.vatAmount),
            totalQuantity: safeNumber(response.totalQuantity),
            totalWeight: safeNumber(response.totalWeight),
            packingCharges: safeNumber(response.packingCharges),
            freightCharges: safeNumber(response.freightCharges),
            insuranceCharges: safeNumber(response.insuranceCharges),
            loadingCharges: safeNumber(response.loadingCharges),
            otherCharges: safeNumber(response.otherCharges),
            discountType: response.discountType || 'amount',
            discountPercentage: safeNumber(response.discountPercentage),
            discountAmount: safeNumber(response.discountAmount),
            total: safeNumber(response.total),
            status: response.status || 'draft',
            // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
            priceValidityCondition: response.priceValidityCondition || '',
            volumeDiscountTiers: (() => {
              try {
                // Handle null/undefined first
                if (!response.volumeDiscountTiers) {
                  return [];
                }
                // Handle array directly
                if (Array.isArray(response.volumeDiscountTiers)) {
                  return response.volumeDiscountTiers;
                }
                // Handle string JSON parsing
                if (typeof response.volumeDiscountTiers === 'string') {
                  const trimmed = response.volumeDiscountTiers.trim();
                  // Empty strings are valid (no tiers)
                  if (!trimmed) {
                    return [];
                  }
                  // Parse JSON safely
                  const parsed = JSON.parse(trimmed);
                  // Validate parsed result is array
                  return Array.isArray(parsed) ? parsed : [];
                }
                // Unexpected type - return empty
                console.warn('Unexpected volumeDiscountTiers type:', typeof response.volumeDiscountTiers);
                return [];
              } catch (parseError) {
                // volumeDiscountTiers is optional - log detailed error for debugging
                console.warn(
                  'Failed to parse volumeDiscountTiers: ',
                  parseError.message,
                  'Raw value:',
                  response.volumeDiscountTiers
                );
                return [];
              }
            })(),
          });

          // Set customer input value for autocomplete and load pricelist
          if (response.customerId && parsedCustomerDetails?.name) {
            setCustomerInputValue(parsedCustomerDetails.name);

            // Try to find and load customer's pricelist
            const customer = customers.find((c) => String(c.id) === String(response.customerId));
            if (customer && (customer.pricelistId || customer.pricelist_id)) {
              try {
                const pricelistId = customer.pricelistId || customer.pricelist_id;
                const pricelistResponse = await pricelistService.getById(pricelistId);
                setSelectedPricelistId(pricelistId);
                setPricelistName(
                  pricelistResponse.pricelist?.name ||
                    pricelistResponse.data?.name ||
                    'Custom Price List',
                );
              } catch (_priceError) {
                // Silently ignore - pricelist is optional
                setSelectedPricelistId(null);
                setPricelistName(null);
              }
            } else if (customer) {
              setSelectedPricelistId(null);
              setPricelistName('Default Price List');
            }
          }
        } catch (err) {
          console.error('Error fetching quotation:', err);

          // Provide specific error messages based on error type
          let errorMessage = 'Failed to load quotation data.';
          if (err.response?.status === 404) {
            errorMessage = `Quotation #${id} not found. It may have been deleted.`;
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            errorMessage = 'You do not have permission to view this quotation.';
          } else if (err.message?.includes('JSON')) {
            errorMessage = 'Server returned invalid data. Please try again.';
          }

          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      fetchQuotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]); // quotationService and setState functions are stable

  // Run field validation when key fields change
  useEffect(() => {
    if (formData.quotationNumber)
      validateField('quotationNumber', formData.quotationNumber);
    if (formData.customerDetails.name)
      validateField('customerName', formData.customerDetails.name);
    if (formData.quotationDate)
      validateField('quotationDate', formData.quotationDate);
    if (formData.warehouseId) validateField('warehouse', formData.warehouseId);
    if (formData.currency) validateField('currency', formData.currency);
  }, [
    formData.quotationNumber,
    formData.customerDetails.name,
    formData.quotationDate,
    formData.warehouseId,
    formData.currency,
    formData.status,
    validateField,
  ]);

  const handleCustomerChange = async (customerId, selectedOption = null) => {
    // If called from Autocomplete (selectedOption provided), use that info
    if (selectedOption) {
      const customer = customers.find(
        (c) => String(c.id) === String(selectedOption.id),
      ) || selectedOption; // Fallback to selectedOption if not found in array
      customerId = selectedOption.id;

      if (customer) {
        setCustomerInputValue(customer.name);
        setFormData((prev) => ({
          ...prev,
          customerId: String(customerId),
          customerDetails: {
            name: customer.name,
            company: customer.company || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || {
              street: '',
              city: '',
              emirate: '',
              country: 'UAE',
            },
            vatNumber: customer.vatNumber || '',
          },
        }));

        // Fetch customer's pricelist
        if (customer.pricelistId || customer.pricelist_id) {
          try {
            const pricelistId = customer.pricelistId || customer.pricelist_id;
            const response = await pricelistService.getById(pricelistId);
            setSelectedPricelistId(pricelistId);
            setPricelistName(
              response.pricelist?.name ||
                response.data?.name ||
                'Custom Price List',
            );
          } catch (_fetchError) {
            // Silently ignore - pricelist is optional
            setSelectedPricelistId(null);
            setPricelistName(null);
          }
        } else {
          // Use default pricelist
          setSelectedPricelistId(null);
          setPricelistName('Default Price List');
        }
        return;
      }
    }

    // Original logic for direct customerId (or when selectedOption not found)
    const customer = customers.find(
      (c) => String(c.id) === String(customerId),
    );
    if (customer) {
      setCustomerInputValue(customer.name || '');
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerDetails: {
          name: customer.name,
          company: customer.company || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || {
            street: '',
            city: '',
            emirate: '',
            country: 'UAE',
          },
          vatNumber: customer.vatNumber || '',
        },
      }));

      // Fetch customer's pricelist
      if (customer.pricelistId || customer.pricelist_id) {
        try {
          const pricelistId = customer.pricelistId || customer.pricelist_id;
          const response = await pricelistService.getById(pricelistId);
          setSelectedPricelistId(pricelistId);
          setPricelistName(
            response.pricelist?.name ||
              response.data?.name ||
              'Custom Price List',
          );
        } catch (_fetchError) {
          // Silently ignore - pricelist is optional
          setSelectedPricelistId(null);
          setPricelistName(null);
        }
      } else {
        // Use default pricelist
        setSelectedPricelistId(null);
        setPricelistName('Default Price List');
      }
    } else {
      // Clear customer - reset everything
      setCustomerInputValue('');
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerDetails: {
          name: '',
          company: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            emirate: '',
            country: 'UAE',
          },
          vatNumber: '',
        },
      }));
      setSelectedPricelistId(null);
      setPricelistName(null);
    }
  };

  // Pin/Unpin product
  const handleTogglePin = (e, productId) => {
    e.stopPropagation();
    setPinnedProductIds((prev) => {
      const newPinned = prev.includes(productId)
        ? prev.filter((pinnedId) => pinnedId !== productId)
        : [...prev, productId];
      localStorage.setItem(
        'quotationPinnedProducts',
        JSON.stringify(newPinned),
      );
      return newPinned;
    });
  };

  // Sort products: pinned first, then by most quoted
  const sortedProducts = useMemo(() => {
    const pinned = products.filter((p) => pinnedProductIds.includes(p.id));
    const unpinned = products
      .filter((p) => !pinnedProductIds.includes(p.id))
      .sort((a, b) => (b.timesQuoted || 0) - (a.timesQuoted || 0))
      .slice(0, 10 - pinned.length);
    return [...pinned, ...unpinned];
  }, [products, pinnedProductIds]);

  // Quick add item from speed button
  const quickAddItem = async (product) => {
    // Handle both camelCase and snake_case field names
    const productDisplayName =
      product.displayName ||
      product.display_name ||
      product.uniqueName ||
      product.unique_name ||
      '';

    // Fetch price from pricelist if available
    let sellingPrice = parseFloat(product.sellingPrice || product.price) || 0;
    if (selectedPricelistId) {
      try {
        const priceResponse = await pricelistService.getPriceForQuantity(
          product.id,
          selectedPricelistId,
          1,
        );
        sellingPrice =
          priceResponse.price || priceResponse.data?.price || sellingPrice;
      } catch (_priceError) {
        // Fallback to default product price
      }
    }

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
    const pricingBasis =
      product.pricingBasis || product.pricing_basis || 'PER_MT';
    const unitWeightKg = product.unitWeightKg || product.unit_weight_kg || null;
    const quantity = 1;

    // Flag if weight is missing for weight-based pricing
    const missingWeightWarning =
      (pricingBasis === 'PER_MT' || pricingBasis === 'PER_KG') &&
      quantityUom === 'PCS' &&
      !unitWeightKg;

    // Calculate theoretical weight
    let theoreticalWeightKg = null;
    if (quantityUom === 'MT') {
      theoreticalWeightKg = quantity * 1000;
    } else if (quantityUom === 'KG') {
      theoreticalWeightKg = quantity;
    } else if (unitWeightKg) {
      theoreticalWeightKg = quantity * unitWeightKg;
    }

    // Calculate amount using pricing-aware function
    const grossAmount = calculateItemAmount(
      quantity,
      sellingPrice,
      pricingBasis,
      unitWeightKg,
      quantityUom,
    );

    const newItem = {
      productId: product.id || '',
      name: productDisplayName,
      specification:
        product.specifications?.specification ||
        product.specifications?.size ||
        '',
      grade: product.specifications?.grade || product.grade || '',
      finish: product.specifications?.finish || product.finish || '',
      size: product.specifications?.size || product.size || '',
      thickness: product.specifications?.thickness || product.thickness || '',
      description: product.description || '',
      hsnCode: product.hsnCode || '',
      unit: product.unit || 'kg',
      quantity,
      rate: sellingPrice,
      discount: 0,
      discountType: 'amount',
      taxableAmount: grossAmount,
      vatRate: 5,
      amount: grossAmount,
      netAmount: grossAmount + (grossAmount * 5) / 100,
      // Pricing & Commercial Fields
      pricingBasis,
      unitWeightKg,
      quantityUom,
      theoreticalWeightKg,
      missingWeightWarning,
      // Stock & Source Fields (Phase 3)
      sourceType: 'WAREHOUSE',
      // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
      stockReserved: false,
      reservationExpiry: null,
      estimatedLeadTimeDays: null,
      deliverySchedule: [],
      alternativeProducts: [],
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setTimeout(calculateTotals, 0);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          name: '',
          specification: '',
          grade: '',
          finish: '',
          size: '',
          thickness: '',
          description: '',
          hsnCode: '',
          unit: 'pcs',
          quantity: 1,
          rate: 0,
          discount: 0,
          discountType: 'amount',
          taxableAmount: 0,
          vatRate: 5,
          amount: 0,
          netAmount: 0,
          // Pricing & Commercial Fields
          pricingBasis: 'PER_MT',
          unitWeightKg: null,
          quantityUom: 'PCS',
          theoreticalWeightKg: null,
          missingWeightWarning: false,
          // Stock & Source Fields (Phase 3)
          sourceType: 'WAREHOUSE',
          // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
          stockReserved: false,
          reservationExpiry: null,
          estimatedLeadTimeDays: null,
          deliverySchedule: [],
          alternativeProducts: [],
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setTimeout(calculateTotals, 0);
  };

  // Steel industry specific handlers (STEEL-FORMS-PHASE1 Priority 2)
  const handleToggleStockReservation = (index, reserved, expiryTime) => {
    const newItems = [...formData.items];
    newItems[index].stockReserved = reserved;
    newItems[index].reservationExpiry = expiryTime;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleViewBatches = (index) => {
    const item = formData.items[index];
    setSelectedItemForBatches(item);
    setBatchesModalOpen(true);
  };

  const handleSaveDeliverySchedule = (index, schedule) => {
    const newItems = [...formData.items];
    newItems[index].deliverySchedule = schedule;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleSaveAlternativeProducts = (index, alternatives) => {
    const newItems = [...formData.items];
    newItems[index].alternativeProducts = alternatives;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleOpenDeliverySchedule = (index) => {
    setSelectedItemForDelivery(index);
    setDeliveryScheduleModalOpen(true);
  };

  const handleOpenAlternativeProducts = (index) => {
    setSelectedItemForAlternatives(index);
    setAlternativeProductsModalOpen(true);
  };

  const handleSaveVolumeDiscountTiers = (tiers) => {
    setFormData((prev) => ({ ...prev, volumeDiscountTiers: tiers }));
  };

  const updateItem = async (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // If product is selected, populate item details
    if (field === 'productId' && value) {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        const productDisplayName =
          product.displayName ||
          product.display_name ||
          product.uniqueName ||
          product.unique_name;

        // Fetch price from pricelist if available
        let sellingPrice = product.sellingPrice || product.price || 0;
        if (selectedPricelistId) {
          try {
            const priceResponse = await pricelistService.getPriceForQuantity(
              product.id,
              selectedPricelistId,
              1,
            );
            sellingPrice =
              priceResponse.price || priceResponse.data?.price || sellingPrice;
          } catch (_priceError) {
            // Fallback to default product price
          }
        }

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
        const pricingBasis =
          product.pricingBasis || product.pricing_basis || 'PER_MT';
        const unitWeightKg =
          product.unitWeightKg || product.unit_weight_kg || null;

        // Flag if weight is missing for weight-based pricing
        const missingWeightWarning =
          (pricingBasis === 'PER_MT' || pricingBasis === 'PER_KG') &&
          quantityUom === 'PCS' &&
          !unitWeightKg;

        newItems[index] = {
          ...newItems[index],
          name: productDisplayName,
          specification:
            product.specifications?.specification ||
            product.specifications?.size ||
            newItems[index].specification ||
            '',
          grade:
            product.specifications?.grade ||
            product.grade ||
            newItems[index].grade ||
            '',
          finish:
            product.specifications?.finish ||
            product.finish ||
            newItems[index].finish ||
            '',
          size:
            product.specifications?.size ||
            product.size ||
            newItems[index].size ||
            '',
          thickness:
            product.specifications?.thickness ||
            product.thickness ||
            newItems[index].thickness ||
            '',
          description: product.description || '',
          hsnCode: product.hsnCode || '',
          unit: product.unit || 'pcs',
          rate: sellingPrice,
          // Pricing & Commercial Fields
          pricingBasis,
          unitWeightKg,
          quantityUom,
          missingWeightWarning,
        };
      }
    }

    // Calculate item totals using pricing-aware calculation
    const item = newItems[index];
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const vatRate = parseFloat(item.vatRate) || 0;

    // Use calculateItemAmount for proper pricing calculation
    const grossAmount = calculateItemAmount(
      quantity,
      rate,
      item.pricingBasis || 'PER_MT',
      item.unitWeightKg,
      item.quantityUom || 'PCS',
    );
    const discountAmount =
      item.discountType === 'percentage'
        ? (grossAmount * discount) / 100
        : discount;
    const taxableAmount = grossAmount - discountAmount;

    const vatAmountItem = (taxableAmount * vatRate) / 100;
    const netAmount = taxableAmount + vatAmountItem;

    // Update theoretical weight when quantity changes
    let theoreticalWeightKg = item.theoreticalWeightKg;
    if (
      field === 'quantity' ||
      field === 'unitWeightKg' ||
      field === 'productId'
    ) {
      if (item.quantityUom === 'MT') {
        theoreticalWeightKg = quantity * 1000;
      } else if (item.quantityUom === 'KG') {
        theoreticalWeightKg = quantity;
      } else if (item.unitWeightKg) {
        theoreticalWeightKg = quantity * item.unitWeightKg;
      }
    }

    newItems[index] = {
      ...item,
      taxableAmount,
      amount: taxableAmount,
      netAmount,
      theoreticalWeightKg,
    };

    setFormData((prev) => ({ ...prev, items: newItems }));

    setTimeout(calculateTotals, 0);
  };

  const calculateTotals = useCallback(() => {
    // Use functional setState to always read fresh state (fixes stale closure bug)
    setFormData((prev) => {
      const items = prev.items;

      // Calculate subtotal (sum of all item amounts before VAT)
      const subtotal = items.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
      );

      // Calculate total quantity
      const totalQuantity = items.reduce(
        (sum, item) => sum + (parseFloat(item.quantity) || 0),
        0,
      );

      // Apply invoice-level discount
      const discountAmount =
        prev.discountType === 'percentage'
          ? (subtotal * (parseFloat(prev.discountPercentage) || 0)) / 100
          : parseFloat(prev.discountAmount) || 0;

      const subtotalAfterDiscount = subtotal - discountAmount;

      // Recalculate VAT on discounted subtotal
      const vatAfterDiscount = subtotalAfterDiscount * 0.05; // Assuming 5% VAT

      // Add all charges
      const allCharges =
        (parseFloat(prev.packingCharges) || 0) +
        (parseFloat(prev.freightCharges) || 0) +
        (parseFloat(prev.insuranceCharges) || 0) +
        (parseFloat(prev.loadingCharges) || 0) +
        (parseFloat(prev.otherCharges) || 0);

      // Calculate total
      const total = subtotalAfterDiscount + vatAfterDiscount + allCharges;

      return {
        ...prev,
        subtotal,
        totalQuantity,
        vatAmount: vatAfterDiscount,
        total,
      };
    });
  }, []);

  // Recalculate when charges, discount, or items change
  useEffect(() => {
    calculateTotals();
  }, [
    formData.packingCharges,
    formData.freightCharges,
    formData.insuranceCharges,
    formData.loadingCharges,
    formData.otherCharges,
    formData.discountType,
    formData.discountPercentage,
    formData.discountAmount,
    formData.items.length, // Use items.length instead of items to avoid array reference changes
    calculateTotals,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const errors = [];
    if (!formData.quotationNumber || formData.quotationNumber.trim() === '') {
      errors.push('Quotation number is required');
    }
    if (
      !formData.customerDetails.name ||
      formData.customerDetails.name.trim() === ''
    ) {
      errors.push('Customer name is required');
    }
    if (!formData.quotationDate) {
      errors.push('Quotation date is required');
    }
    // Validate dates
    if (formData.validUntil && formData.quotationDate && formData.validUntil < formData.quotationDate) {
      errors.push('Valid Until date must be after Quotation Date');
    }
    // Validate exchange rate
    if (formData.currency !== 'AED' && (!formData.exchangeRate || formData.exchangeRate <= 0)) {
      errors.push('Exchange Rate is required and must be greater than 0 for non-AED currencies');
    }
    if (!formData.items || formData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      formData.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Product name is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        // CRITICAL: Block save when unit weight is missing for weight-based pricing
        if (item.missingWeightWarning) {
          errors.push(
            `Item ${index + 1}: Unit weight is missing for "${item.name}". This product has weight-based pricing (${item.pricingBasis}) but no unit weight. Please contact admin to add unit weight to the product master.`,
          );
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
        }
      });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);

    try {
      setError('');

      // Transform to backend format (snake_case)
      const dataToSubmit = {
        quotation_number: formData.quotationNumber,
        customer_id: formData.customerId ? Number(formData.customerId) : null,
        customer_details: formData.customerDetails,
        quotation_date: formData.quotationDate,
        valid_until: formData.validUntil || null,
        customer_purchase_order_number:
          formData.customerPurchaseOrderNumber || '',
        customer_purchase_order_date:
          formData.customerPurchaseOrderDate || null,
        warehouse_id: formData.warehouseId
          ? Number(formData.warehouseId)
          : null,
        warehouse_name: formData.warehouseName || '',
        warehouse_code: formData.warehouseCode || '',
        warehouse_city: formData.warehouseCity || '',
        currency: formData.currency || 'AED',
        exchange_rate: formData.exchangeRate || 1,
        delivery_terms: formData.deliveryTerms || '',
        payment_terms: formData.paymentTerms || '',
        notes: formData.notes || '',
        terms_and_conditions: formData.termsAndConditions || '',
        items: formData.items.map((item) => ({
          product_id: item.productId ? Number(item.productId) : null,
          name: item.name,
          specification: item.specification || '',
          grade: item.grade || '',
          finish: item.finish || '',
          size: item.size || '',
          thickness: item.thickness || '',
          description: item.description || '',
          hsn_code: item.hsnCode || '',
          unit: item.unit || 'pcs',
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          discount: parseFloat(item.discount) || 0,
          discount_type: item.discountType || 'amount',
          taxable_amount: parseFloat(item.taxableAmount) || 0,
          vat_rate: parseFloat(item.vatRate) || 0,
          amount: parseFloat(item.amount) || 0,
          net_amount: parseFloat(item.netAmount) || 0,
          // Pricing & Commercial Fields
          pricing_basis: item.pricingBasis || 'PER_MT',
          unit_weight_kg: item.unitWeightKg
            ? parseFloat(item.unitWeightKg)
            : null,
          quantity_uom: item.quantityUom || 'PCS',
          theoretical_weight_kg: item.theoreticalWeightKg
            ? parseFloat(item.theoreticalWeightKg)
            : null,
          // Stock & Source Fields (Phase 3)
          source_type: item.sourceType || 'WAREHOUSE',
          // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
          stock_reserved: item.stockReserved || false,
          reservation_expiry: item.reservationExpiry || null,
          estimated_lead_time_days: item.estimatedLeadTimeDays || null,
          delivery_schedule:
            item.deliverySchedule?.length > 0
              ? JSON.stringify(item.deliverySchedule)
              : null,
          alternative_products:
            item.alternativeProducts?.length > 0
              ? JSON.stringify(item.alternativeProducts)
              : null,
        })),
        subtotal: parseFloat(formData.subtotal) || 0,
        vat_amount: parseFloat(formData.vatAmount) || 0,
        total_quantity: parseFloat(formData.totalQuantity) || 0,
        total_weight: parseFloat(formData.totalWeight) || 0,
        packing_charges: parseFloat(formData.packingCharges) || 0,
        freight_charges: parseFloat(formData.freightCharges) || 0,
        insurance_charges: parseFloat(formData.insuranceCharges) || 0,
        loading_charges: parseFloat(formData.loadingCharges) || 0,
        other_charges: parseFloat(formData.otherCharges) || 0,
        discount_type: formData.discountType || 'amount',
        discount_percentage: parseFloat(formData.discountPercentage) || 0,
        discount_amount: parseFloat(formData.discountAmount) || 0,
        total: parseFloat(formData.total) || 0,
        status: formData.status || 'draft',
        // Steel industry specific fields (STEEL-FORMS-PHASE1 Priority 2)
        price_validity_condition: formData.priceValidityCondition || null,
        volume_discount_tiers:
          formData.volumeDiscountTiers?.length > 0
            ? JSON.stringify(formData.volumeDiscountTiers)
            : null,
      };

      if (isEdit) {
        await quotationService.update(id, dataToSubmit);
        setSuccess('Quotation updated successfully');
      } else {
        await quotationService.create(dataToSubmit);
        setSuccess('Quotation created successfully');
      }

      // Standardized smooth transition delay (300ms)
      setTimeout(() => {
        navigate('/quotations');
      }, 300);
    } catch (err) {
      console.error('Error saving quotation:', err);
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const msgs = apiErrors.map((apiErr) =>
          typeof apiErr === 'string'
            ? apiErr
            : apiErr.message || JSON.stringify(apiErr),
        );
        setError(msgs.join('\n'));
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Failed to save quotation');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div
        className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  // Input component with validation
  const Input = ({
    label,
    inputError,
    className = '',
    required = false,
    validationState = null,
    showValidation = true,
    id: elementId,
    helperText,
    ...props
  }) => {
    const inputId =
      elementId || `input-${Math.random().toString(36).substring(2, 11)}`;

    const getValidationClasses = () => {
      if (!showValidation) {
        return isDarkMode
          ? 'border-gray-600 bg-gray-800'
          : 'border-gray-300 bg-white';
      }
      if (inputError || validationState === 'invalid') {
        return isDarkMode
          ? 'border-red-500 bg-red-900/10'
          : 'border-red-500 bg-red-50';
      }
      if (validationState === 'valid') {
        // Subtle teal border for valid fields, no background color change
        return isDarkMode
          ? 'border-teal-500/50 bg-gray-800'
          : 'border-teal-500/50 bg-white';
      }
      if (required && validationState === null) {
        // Required but untouched - use neutral styling, no yellow
        return isDarkMode
          ? 'border-gray-600 bg-gray-800'
          : 'border-gray-300 bg-white';
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
          className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
            isDarkMode
              ? 'text-white placeholder-gray-500'
              : 'text-gray-900 placeholder-gray-400'
          } ${getValidationClasses()} ${className}`}
          {...props}
        />
        {helperText && !inputError && (
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
          >
            {helperText}
          </p>
        )}
        {inputError && (
          <p
            className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
          >
            {inputError}
          </p>
        )}
      </div>
    );
  };

  // Autocomplete component with fuzzy search
  const Autocomplete = ({
    options = [],
    value: _value,
    onChange,
    onInputChange,
    inputValue,
    placeholder,
    label,
    disabled = false,
    renderOption,
    noOptionsText = 'No options',
    className = '',
    title,
    inputError,
    required = false,
    validationState = null,
    showValidation = true,
    'data-testid': dataTestId,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
      setHighlightedIndex(-1);
    }, [filteredOptions]);

    // Fuzzy match helpers
    const norm = (s) => (s || '').toString().toLowerCase().trim();
    const ed1 = (a, b) => {
      if (a === b) return 0;
      const la = a.length,
        lb = b.length;
      if (Math.abs(la - lb) > 1) return 2;
      let dpPrev = new Array(lb + 1);
      let dpCurr = new Array(lb + 1);
      for (let j = 0; j <= lb; j++) dpPrev[j] = j;
      for (let i = 1; i <= la; i++) {
        dpCurr[0] = i;
        const ca = a.charCodeAt(i - 1);
        for (let j = 1; j <= lb; j++) {
          const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
          dpCurr[j] = Math.min(
            dpPrev[j] + 1,
            dpCurr[j - 1] + 1,
            dpPrev[j - 1] + cost,
          );
        }
        const tmp = dpPrev;
        dpPrev = dpCurr;
        dpCurr = tmp;
      }
      return dpPrev[lb];
    };

    const tokenMatch = useCallback((token, optLabel) => {
      const t = norm(token);
      const l = norm(optLabel);
      if (!t) return true;
      if (l.includes(t)) return true;
      const words = l.split(/\s+/);
      for (const w of words) {
        if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
      }
      return false;
    }, []);

    const fuzzyFilter = useCallback(
      (opts, query) => {
        const q = norm(query);
        if (!q) return opts;
        const tokens = q.split(/\s+/).filter(Boolean);
        const scored = [];
        for (const o of opts) {
          const optLabel = norm(o.label || o.name || '');
          if (!optLabel) continue;
          let ok = true;
          let score = 0;
          for (const t of tokens) {
            if (!tokenMatch(t, optLabel)) {
              ok = false;
              break;
            }
            const idx = optLabel.indexOf(norm(t));
            score += idx >= 0 ? 0 : 1;
          }
          if (ok) scored.push({ o, score });
        }
        scored.sort((a, b) => a.score - b.score);
        return scored.map((s) => s.o);
      },
      [tokenMatch],
    );

    useEffect(() => {
      if (inputValue) {
        const filtered = fuzzyFilter(options, inputValue);
        setFilteredOptions(filtered.slice(0, 20));
      } else {
        setFilteredOptions(options);
      }
    }, [options, inputValue, fuzzyFilter]);

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      onInputChange?.(e, newValue);
      setIsOpen(true);
    };

    const handleOptionSelect = (option) => {
      onChange?.(null, option);
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          setIsOpen(true);
          return;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        default:
          break;
      }
    };

    const updateDropdownPosition = useCallback(() => {
      if (dropdownRef.current && inputRef.current && isOpen) {
        const inputRect = inputRef.current.getBoundingClientRect();
        const dropdown = dropdownRef.current;

        dropdown.style.position = 'fixed';
        dropdown.style.top = `${inputRect.bottom + 4}px`;
        dropdown.style.left = `${inputRect.left}px`;
        dropdown.style.minWidth = `${inputRect.width}px`;
        dropdown.style.width = 'auto';
        dropdown.style.maxWidth = '90vw';
        dropdown.style.zIndex = '9999';
      }
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
        updateDropdownPosition();
        const handleScroll = () => updateDropdownPosition();
        const handleResize = () => updateDropdownPosition();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('scroll', handleScroll, true);
          window.removeEventListener('resize', handleResize);
        };
      }
    }, [isOpen, updateDropdownPosition]);

    return (
      <div className="relative">
        <div ref={inputRef}>
          <Input
            label={label}
            value={inputValue || ''}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            title={title}
            inputError={inputError}
            required={required}
            validationState={validationState}
            showValidation={showValidation}
            data-testid={dataTestId}
          />
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            data-testid={dataTestId ? `${dataTestId}-listbox` : undefined}
            role="listbox"
            className={`border rounded-lg shadow-xl max-h-60 overflow-auto ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-gray-200'
            }`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id || index}
                  data-testid={
                    dataTestId ? `${dataTestId}-option-${index}` : undefined
                  }
                  className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                    index === highlightedIndex
                      ? isDarkMode
                        ? 'bg-teal-700 text-white border-gray-700'
                        : 'bg-teal-100 text-gray-900 border-gray-100'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-white border-gray-700'
                        : 'hover:bg-gray-50 text-gray-900 border-gray-100'
                  }`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  tabIndex={-1}
                  onMouseDown={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <div>
                      <div className="font-medium">{option.name}</div>
                      {option.subtitle && (
                        <div
                          className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                className={`px-3 py-2 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {noOptionsText}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'} p-2 md:p-4`}
      data-testid="quotation-form"
    >
      {/* Header - Compact on mobile */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
          <button
            onClick={() => navigate('/quotations')}
            className={`p-1.5 md:p-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft size={18} className="md:hidden" />
            <ArrowLeft size={20} className="hidden md:block" />
          </button>
          <div className="flex-1">
            <h1
              className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {isEdit ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            <p
              className={`text-xs md:text-sm mt-0.5 md:mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {isEdit
                ? 'Update quotation details'
                : 'Create a new quotation for your customer'}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFormSettings(!showFormSettings)}
              className={`p-1.5 md:p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Form Settings"
            >
              <Settings size={18} className="md:hidden" />
              <Settings size={20} className="hidden md:block" />
            </button>

            <FormSettingsPanel
              isOpen={showFormSettings}
              onClose={() => setShowFormSettings(false)}
              preferences={formPreferences}
              onPreferenceChange={(key, value) => {
                setFormPreferences((prev) => ({ ...prev, [key]: value }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div className="flex-1 whitespace-pre-line">{error}</div>
          <div className="flex gap-2">
            {isEdit && (error.includes('not found') || error.includes('permission')) && (
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
        {/* Main Content - 8 columns */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Basic Information - Compact */}
          <div
            className={`p-3 md:p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <FileText size={18} className="text-teal-600 md:hidden" />
              <FileText size={20} className="text-teal-600 hidden md:block" />
              <h2
                className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <Input
                data-testid="quotation-number"
                name="quotationNumber"
                label="Quotation Number"
                type="text"
                value={formData.quotationNumber || 'QT-DRAFT'}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    quotationNumber: e.target.value,
                  }));
                  validateField('quotationNumber', e.target.value);
                }}
                required
                validationState={fieldValidation.quotationNumber}
                showValidation={formPreferences.showValidationHighlighting}
              />

              <Input
                data-testid="quotation-date"
                name="quotationDate"
                label="Quotation Date"
                type="date"
                value={formData.quotationDate}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    quotationDate: e.target.value,
                  }));
                  validateField('quotationDate', e.target.value);
                }}
                required
                validationState={fieldValidation.quotationDate}
                showValidation={formPreferences.showValidationHighlighting}
              />

              <Input
                data-testid="valid-until"
                label="Valid Until"
                type="date"
                value={formData.validUntil}
                onChange={(e) => {
                  const newDate = e.target.value;
                  // Validate: Valid Until should be after Quotation Date
                  if (newDate && formData.quotationDate) {
                    if (newDate < formData.quotationDate) {
                      setError('Valid Until date must be after Quotation Date');
                      return;
                    }
                  }
                  setFormData((prev) => ({
                    ...prev,
                    validUntil: newDate,
                  }));
                  setError('');
                }}
                helperText={
                  formData.validUntil &&
                  new Date(formData.validUntil) < new Date()
                    ? 'This date is in the past'
                    : ''
                }
              />

              <FormSelect
                label="Currency"
                value={formData.currency || 'AED'}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    currency: value,
                  }));
                  validateField('currency', value);
                }}
                required
                validationState={fieldValidation.currency}
                showValidation={formPreferences.showValidationHighlighting}
              >
                <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
              </FormSelect>

              <Input
                label="Exchange Rate"
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.exchangeRate || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  // Validate: must be a positive number if provided
                  if (value === '' || (numValue > 0 && !isNaN(numValue))) {
                    setFormData((prev) => ({
                      ...prev,
                      exchangeRate: value === '' ? 1 : numValue,
                    }));
                  }
                }}
                placeholder="1.0000"
                required={formData.currency !== 'AED'}
                validationState={
                  formData.currency !== 'AED' && (!formData.exchangeRate || formData.exchangeRate <= 0)
                    ? 'invalid'
                    : null
                }
                helperText={
                  formData.currency !== 'AED'
                    ? `Rate to convert ${formData.currency} to AED (must be > 0)`
                    : 'Default currency (1.0000)'
                }
              />
            </div>
          </div>

          {/* Customer Information - Compact */}
          <div
            className={`p-3 md:p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <User size={18} className="text-teal-600 md:hidden" />
              <User size={20} className="text-teal-600 hidden md:block" />
              <h2
                className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Customer Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Autocomplete
                label="Select Customer"
                placeholder="Search or enter manually"
                options={customers.map((c) => ({
                  id: c.id,
                  label: c.name,
                  name: c.name,
                  company: c.company,
                  email: c.email,
                  phone: c.phone,
                  address: c.address,
                  vatNumber: c.vatNumber,
                  pricelistId: c.pricelistId,
                  pricelist_id: c.pricelist_id,
                }))}
                value={
                  formData.customerId
                    ? customers.find(
                        (c) => String(c.id) === String(formData.customerId),
                      )
                    : null
                }
                inputValue={customerInputValue}
                onInputChange={(_e, newValue) => {
                  setCustomerInputValue(newValue || '');
                }}
                onChange={(_e, selected) => {
                  if (selected) {
                    handleCustomerChange(selected.id, selected);
                  } else {
                    handleCustomerChange('');
                    setCustomerInputValue('');
                  }
                }}
                noOptionsText="No customers found"
                data-testid="customer-autocomplete"
              />

              <Input
                label="Customer Name"
                type="text"
                value={formData.customerDetails.name}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    customerDetails: {
                      ...prev.customerDetails,
                      name: e.target.value,
                    },
                  }));
                  validateField('customerName', e.target.value);
                }}
                required
                validationState={fieldValidation.customerName}
                showValidation={formPreferences.showValidationHighlighting}
              />

              <Input
                label="Company"
                type="text"
                value={formData.customerDetails.company}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerDetails: {
                      ...prev.customerDetails,
                      company: e.target.value,
                    },
                  }))
                }
              />

              <Input
                label="Email"
                type="email"
                value={formData.customerDetails.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerDetails: {
                      ...prev.customerDetails,
                      email: e.target.value,
                    },
                  }))
                }
              />

              <Input
                label="Phone"
                type="tel"
                value={formData.customerDetails.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerDetails: {
                      ...prev.customerDetails,
                      phone: e.target.value,
                    },
                  }))
                }
              />

              <Input
                label="VAT Number"
                type="text"
                value={formData.customerDetails.vatNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerDetails: {
                      ...prev.customerDetails,
                      vatNumber: e.target.value,
                    },
                  }))
                }
              />

              <Input
                label="Customer PO Number"
                type="text"
                value={formData.customerPurchaseOrderNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerPurchaseOrderNumber: e.target.value,
                  }))
                }
              />

              <Input
                label="Customer PO Date"
                type="date"
                value={formData.customerPurchaseOrderDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerPurchaseOrderDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Warehouse & Delivery - New Section */}
          <div
            className={`p-3 md:p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Package size={18} className="text-teal-600 md:hidden" />
              <Package size={20} className="text-teal-600 hidden md:block" />
              <h2
                className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Warehouse & Delivery
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <FormSelect
                label="Warehouse"
                value={formData.warehouseId || 'none'}
                onValueChange={(warehouseId) => {
                  if (warehouseId === 'none') {
                    setFormData((prev) => ({
                      ...prev,
                      warehouseId: '',
                      warehouseName: '',
                      warehouseCode: '',
                      warehouseCity: '',
                    }));
                    validateField('warehouse', '');
                  } else {
                    const w = warehouses.find(
                      (wh) => wh.id.toString() === warehouseId,
                    );
                    setFormData((prev) => ({
                      ...prev,
                      warehouseId,
                      warehouseName: w ? w.name : '',
                      warehouseCode: w ? w.code : '',
                      warehouseCity: w ? w.city : '',
                    }));
                    validateField('warehouse', warehouseId);
                  }
                }}
                required={formData.status !== 'draft'}
                validationState={fieldValidation.warehouse}
                showValidation={formPreferences.showValidationHighlighting}
              >
                <SelectItem value="none">Select warehouse</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id.toString()}>
                    {wh.name} ({wh.city})
                  </SelectItem>
                ))}
              </FormSelect>

              <Input
                label="Delivery Terms"
                type="text"
                value={formData.deliveryTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deliveryTerms: e.target.value,
                  }))
                }
                placeholder="e.g., FOB Destination"
              />

              <Input
                label="Payment Terms"
                type="text"
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentTerms: e.target.value,
                  }))
                }
                placeholder="e.g., 30 days from invoice"
              />

              {/* Price Validity Condition (STEEL-FORMS-PHASE1 Priority 2) */}
              <PriceValiditySelector
                value={formData.priceValidityCondition}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    priceValidityCondition: value,
                  }))
                }
              />
            </div>
          </div>

          {/* Items Section with Speed Buttons */}
          <div
            className={`p-3 md:p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-teal-600 md:hidden" />
                <Package size={20} className="text-teal-600 hidden md:block" />
                <h2
                  className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Items ({formData.items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                data-testid="add-item"
              >
                <Plus size={14} className="md:hidden" />
                <Plus size={16} className="hidden md:block" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Speed Buttons */}
            {formPreferences.showSpeedButtons && sortedProducts.length > 0 && (
              <div className="mb-4">
                <p
                  className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Quick Add (Pinned & Top Products)
                </p>
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                  {sortedProducts.map((product) => {
                    const isPinned = pinnedProductIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        className="relative group flex-shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => quickAddItem(product)}
                          className={`px-2 md:px-3 py-1.5 md:py-2 pr-6 md:pr-8 rounded-lg border-2 text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                            isPinned
                              ? isDarkMode
                                ? 'border-teal-700 bg-teal-900/40 text-teal-300 hover:bg-teal-900/60 shadow-md hover:shadow-lg'
                                : 'border-teal-600 bg-teal-100 text-teal-800 hover:bg-teal-200 shadow-md hover:shadow-lg'
                              : isDarkMode
                                ? 'border-teal-600 bg-teal-900/20 text-teal-400 hover:bg-teal-900/40 hover:shadow-md'
                                : 'border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:shadow-md'
                          }`}
                        >
                          {product.displayName ||
                            product.display_name ||
                            product.uniqueName ||
                            product.unique_name ||
                            'N/A'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(e, product.id)}
                          className={`absolute right-0.5 md:right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 hover:scale-110 ${
                            isPinned
                              ? isDarkMode
                                ? 'text-teal-300 hover:text-teal-200'
                                : 'text-teal-700 hover:text-teal-800'
                              : isDarkMode
                                ? 'text-gray-400 hover:text-teal-400'
                                : 'text-gray-500 hover:text-teal-600'
                          }`}
                          title={isPinned ? 'Unpin product' : 'Pin product'}
                        >
                          {isPinned ? (
                            <Pin
                              size={12}
                              fill="currentColor"
                              className="md:hidden"
                            />
                          ) : (
                            <Pin size={12} className="md:hidden" />
                          )}
                          {isPinned ? (
                            <Pin
                              size={14}
                              fill="currentColor"
                              className="hidden md:block"
                            />
                          ) : (
                            <Pin size={14} className="hidden md:block" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.items.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package
                  size={40}
                  className={`mx-auto mb-3 md:mb-4 md:hidden ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                />
                <Package
                  size={48}
                  className={`mx-auto mb-3 md:mb-4 hidden md:block ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                />
                <p
                  className={`text-sm md:text-lg font-medium mb-1 md:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  No items added yet
                </p>
                <p
                  className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Click &quot;Add Item&quot; or use Quick Add buttons
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 md:p-4 border rounded-lg ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-800/50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Stock Availability & Source Type Row */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Stock Availability Indicator - icon-only compact mode */}
                      {item.productId && formData.warehouseId && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            Stock:
                          </span>
                          <StockAvailabilityIndicator
                            productId={item.productId}
                            warehouseId={formData.warehouseId}
                            requiredQty={item.quantity || 0}
                            compact
                            iconOnly
                          />
                        </div>
                      )}

                      {/* Source Type Selector */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Source:
                        </span>
                        <SourceTypeSelector
                          value={item.sourceType || 'WAREHOUSE'}
                          onChange={(value) =>
                            updateItem(index, 'sourceType', value)
                          }
                          id={`source-type-${index}`}
                        />
                      </div>
                    </div>

                    {/* Steel Industry Action Buttons (STEEL-FORMS-PHASE1 Priority 2) */}
                    <div
                      className="flex flex-wrap items-center gap-2 mb-3 border-t border-b py-2 mt-2"
                      style={{
                        borderColor: isDarkMode ? '#37474F' : '#e5e7eb',
                      }}
                    >
                      {/* Stock Reservation */}
                      <StockReservationToggle
                        item={item}
                        index={index}
                        onToggleReservation={handleToggleStockReservation}
                      />

                      {/* View Batches */}
                      {item.productId && (
                        <button
                          type="button"
                          onClick={() => handleViewBatches(index)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-teal-900/30 text-teal-300 hover:bg-teal-900/50'
                              : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                          }`}
                        >
                          <Package className="h-4 w-4" />
                          Batches
                        </button>
                      )}

                      {/* Delivery Schedule */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeliverySchedule(index)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-teal-900/30 text-teal-300 hover:bg-teal-900/50'
                            : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule{' '}
                        {item.deliverySchedule?.length > 0 &&
                          `(${item.deliverySchedule.length})`}
                      </button>

                      {/* Alternative Products */}
                      <button
                        type="button"
                        onClick={() => handleOpenAlternativeProducts(index)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          isDarkMode
                            ? 'bg-gray-800 text-gray-300 border-gray-600 hover:border-teal-500 hover:text-teal-400'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                        }`}
                      >
                        <Layers className="h-4 w-4" />
                        Alternatives{' '}
                        {item.alternativeProducts?.length > 0 &&
                          `(${item.alternativeProducts.length})`}
                      </button>

                      {/* Lead Time Input */}
                      <LeadTimeInput
                        item={item}
                        index={index}
                        onUpdate={updateItem}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                      <div className="sm:col-span-2">
                        <FormSelect
                          label="Product"
                          value={item.productId || 'none'}
                          onValueChange={(value) =>
                            updateItem(
                              index,
                              'productId',
                              value === 'none' ? '' : value,
                            )
                          }
                        >
                          <SelectItem value="none">
                            Select or enter manually
                          </SelectItem>
                          {products.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              {product.displayName ||
                                product.display_name ||
                                product.uniqueName ||
                                product.unique_name ||
                                'N/A'}
                            </SelectItem>
                          ))}
                        </FormSelect>
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, 'name', e.target.value)
                          }
                          required
                          className="mt-2"
                        />
                      </div>

                      <FormSelect
                        label="Grade"
                        value={item.grade || 'none'}
                        onValueChange={(value) =>
                          updateItem(
                            index,
                            'grade',
                            value === 'none' ? '' : value,
                          )
                        }
                      >
                        <SelectItem value="none">Select Grade</SelectItem>
                        {STEEL_GRADES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </FormSelect>

                      <FormSelect
                        label="Finish"
                        value={item.finish || 'none'}
                        onValueChange={(value) =>
                          updateItem(
                            index,
                            'finish',
                            value === 'none' ? '' : value,
                          )
                        }
                      >
                        <SelectItem value="none">Select Finish</SelectItem>
                        {FINISHES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </FormSelect>

                      <Input
                        label="Size"
                        type="text"
                        value={item.size || ''}
                        onChange={(e) =>
                          updateItem(index, 'size', e.target.value)
                        }
                        placeholder="e.g., 1220x2440"
                      />

                      <Input
                        label="Thickness"
                        type="text"
                        value={item.thickness || ''}
                        onChange={(e) =>
                          updateItem(index, 'thickness', e.target.value)
                        }
                        placeholder="e.g., 1.2mm"
                      />

                      <div>
                        <label
                          htmlFor={`item-quantity-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Quantity ({item.quantityUom || 'PCS'})
                        </label>
                        <input
                          id={`item-quantity-${index}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const allowDecimal =
                              item.quantityUom === 'MT' ||
                              item.quantityUom === 'KG';
                            const val = allowDecimal
                              ? parseFloat(e.target.value)
                              : parseInt(e.target.value, 10);
                            updateItem(
                              index,
                              'quantity',
                              isNaN(val) ? '' : val,
                            );
                          }}
                          min="0"
                          step={
                            item.quantityUom === 'MT' ||
                            item.quantityUom === 'KG'
                              ? '0.001'
                              : '1'
                          }
                          className={`w-full px-3 py-2 text-sm border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`item-unit-weight-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Unit Wt (kg)
                        </label>
                        <input
                          id={`item-unit-weight-${index}`}
                          type="number"
                          value={item.unitWeightKg || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'unitWeightKg',
                              e.target.value === ''
                                ? null
                                : parseFloat(e.target.value),
                            )
                          }
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className={`w-full px-3 py-2 text-sm border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } ${item.missingWeightWarning ? 'border-red-500' : ''}`}
                        />
                      </div>

                      <div>
                        <div
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Total Wt (kg)
                        </div>
                        <div
                          className={`px-3 py-2 text-sm border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                              : 'bg-gray-100 border-gray-300 text-gray-600'
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

                      <div>
                        <label
                          htmlFor={`item-rate-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Rate ({formData.currency})
                        </label>
                        <div
                          className={`flex rounded-md overflow-hidden border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                        >
                          <input
                            id={`item-rate-${index}`}
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(
                                index,
                                'rate',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            min="0"
                            step="0.01"
                            className={`flex-1 px-3 py-2 text-sm border-0 ${
                              isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-white text-gray-900'
                            }`}
                            required
                          />
                          <select
                            value={item.pricingBasis || 'PER_MT'}
                            onChange={(e) =>
                              updateItem(index, 'pricingBasis', e.target.value)
                            }
                            className={`text-[10px] font-bold px-1.5 border-l cursor-pointer outline-none ${
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

                      <Input
                        label="VAT (%)"
                        type="number"
                        value={item.vatRate}
                        onChange={(e) =>
                          updateItem(index, 'vatRate', e.target.value)
                        }
                        min="0"
                        max="100"
                        step="0.01"
                      />

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <div
                            className={`block text-xs font-medium mb-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            Total
                          </div>
                          <div
                            className={`px-2 py-1.5 text-sm border rounded-md ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-300'
                                : 'bg-gray-100 border-gray-300 text-gray-600'
                            }`}
                          >
                            {formatCurrency(item.netAmount)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="md:hidden" />
                          <Trash2 size={16} className="hidden md:block" />
                        </button>
                      </div>
                    </div>

                    {/* Missing Weight Warning */}
                    {item.missingWeightWarning && (
                      <div
                        className={`mt-2 p-2 rounded-md border ${isDarkMode ? 'bg-amber-900/30 border-amber-600' : 'bg-amber-50 border-amber-200'}`}
                      >
                        <p
                          className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}
                        >
                          <AlertCircle className="inline h-3 w-3 mr-1" />
                          Unit weight missing for weight-based pricing (
                          {item.pricingBasis}). Contact admin to update product
                          master.
                        </p>
                      </div>
                    )}

                    {/* Additional fields - collapsible on mobile */}
                    <details className="mt-2 md:mt-3">
                      <summary
                        className={`text-xs cursor-pointer ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        More details
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 mt-2">
                        <Input
                          label="Specification"
                          type="text"
                          value={item.specification}
                          onChange={(e) =>
                            updateItem(index, 'specification', e.target.value)
                          }
                        />

                        <FormSelect
                          label="Unit"
                          value={item.unit || 'pcs'}
                          onValueChange={(value) =>
                            updateItem(index, 'unit', value)
                          }
                        >
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="meters">Meters</SelectItem>
                          <SelectItem value="sqm">Square Meters</SelectItem>
                          <SelectItem value="feet">Feet</SelectItem>
                          <SelectItem value="sqft">Square Feet</SelectItem>
                        </FormSelect>

                        <Input
                          label="HSN Code"
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) =>
                            updateItem(index, 'hsnCode', e.target.value)
                          }
                        />
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* End Main Content 8 columns */}

        {/* Sidebar - 4 columns, sticky */}
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Summary */}
            <div
              className={`p-4 rounded-2xl border ${
                isDarkMode
                  ? 'bg-[#141a20] border-[#2a3640]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={18} className="text-teal-600" />
                <h3
                  className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Summary
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span
                    className={isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}
                  >
                    Subtotal
                  </span>
                  <span
                    className={`font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    data-testid="subtotal"
                  >
                    {formatCurrency(formData.subtotal)}
                  </span>
                </div>

                {formData.vatAmount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      VAT
                    </span>
                    <span
                      className={`font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      data-testid="vat-amount"
                    >
                      {formatCurrency(formData.vatAmount)}
                    </span>
                  </div>
                )}

                {(parseFloat(formData.packingCharges) || 0) +
                  (parseFloat(formData.freightCharges) || 0) +
                  (parseFloat(formData.insuranceCharges) || 0) +
                  (parseFloat(formData.loadingCharges) || 0) +
                  (parseFloat(formData.otherCharges) || 0) >
                  0 && (
                  <div className="flex justify-between text-[13px]">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      Charges
                    </span>
                    <span
                      className={`font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {formatCurrency(
                        (parseFloat(formData.packingCharges) || 0) +
                          (parseFloat(formData.freightCharges) || 0) +
                          (parseFloat(formData.insuranceCharges) || 0) +
                          (parseFloat(formData.loadingCharges) || 0) +
                          (parseFloat(formData.otherCharges) || 0),
                      )}
                    </span>
                  </div>
                )}

                <div
                  className={`h-px my-2 ${isDarkMode ? 'bg-[#2a3640]' : 'bg-gray-200'}`}
                />

                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Total
                  </span>
                  <span
                    className="text-lg font-extrabold text-teal-600 font-mono"
                    data-testid="total"
                  >
                    {formatCurrency(formData.total)}
                  </span>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span
                    className={isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}
                  >
                    {formData.items.length} items
                  </span>
                  <span
                    className={isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}
                  >
                    Qty: {formData.totalQuantity}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className={`p-4 rounded-2xl border ${
                isDarkMode
                  ? 'bg-[#141a20] border-[#2a3640]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div
                className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Quick Actions
              </div>
              <div className="space-y-1.5">
                {/* Volume Discount Tiers Button (STEEL-FORMS-PHASE1 Priority 2) */}
                <button
                  type="button"
                  onClick={() => setVolumeDiscountModalOpen(true)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all flex items-center gap-2 border ${
                    isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 hover:border-teal-500 hover:text-teal-400'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  <span>
                    Volume Discounts{' '}
                    {formData.volumeDiscountTiers?.length > 0 &&
                      `(${formData.volumeDiscountTiers.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setChargesDrawerOpen(true)}
                  className={`w-full flex items-center gap-2 py-2 px-2.5 text-sm rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-teal-500 hover:text-teal-400'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600'
                  }`}
                >
                  <Package className="h-4 w-4 opacity-60" />
                  Edit Charges
                  {(parseFloat(formData.packingCharges) || 0) +
                    (parseFloat(formData.freightCharges) || 0) +
                    (parseFloat(formData.insuranceCharges) || 0) +
                    (parseFloat(formData.loadingCharges) || 0) +
                    (parseFloat(formData.otherCharges) || 0) >
                    0 && (
                    <span
                      className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-100 text-teal-700'}`}
                    >
                      {formatCurrency(
                        (parseFloat(formData.packingCharges) || 0) +
                          (parseFloat(formData.freightCharges) || 0) +
                          (parseFloat(formData.insuranceCharges) || 0) +
                          (parseFloat(formData.loadingCharges) || 0) +
                          (parseFloat(formData.otherCharges) || 0),
                      )}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setNotesDrawerOpen(true)}
                  className={`w-full flex items-center gap-2 py-2 px-2.5 text-sm rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-teal-500 hover:text-teal-400'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600'
                  }`}
                >
                  <FileText className="h-4 w-4 opacity-60" />
                  Notes & Terms
                  {(formData.notes || formData.termsAndConditions) && (
                    <span
                      className={`ml-auto w-2 h-2 rounded-full ${isDarkMode ? 'bg-teal-400' : 'bg-teal-500'}`}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-teal-500 hover:text-teal-400'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600'
                }`}
              >
                <Eye size={16} />
                Preview
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-br from-teal-600 to-teal-700 text-white font-medium hover:from-teal-500 hover:to-teal-600 rounded-lg text-sm transition-all duration-300 shadow-sm hover:shadow-md ${
                  isSaving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                data-testid="save-quotation"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isEdit ? 'Update Quotation' : 'Create Quotation'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/quotations')}
                className={`w-full py-2 text-[13px] text-center ${
                  isDarkMode
                    ? 'text-[#93a4b4] hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Charges Drawer */}
      <Drawer
        isOpen={chargesDrawerOpen}
        onClose={() => setChargesDrawerOpen(false)}
        title="Additional Charges"
        subtitle="Packing, freight, insurance, and other charges"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="quotation-packing-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Packing Charges
              </label>
              <input
                id="quotation-packing-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.packingCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packingCharges: e.target.value,
                  }))
                }
                className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                } focus:ring-2 focus:ring-teal-500/20`}
              />
            </div>
            <div>
              <label
                htmlFor="quotation-freight-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Freight Charges
              </label>
              <input
                id="quotation-freight-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.freightCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    freightCharges: e.target.value,
                  }))
                }
                className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                } focus:ring-2 focus:ring-teal-500/20`}
              />
            </div>
            <div>
              <label
                htmlFor="quotation-insurance-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Insurance Charges
              </label>
              <input
                id="quotation-insurance-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.insuranceCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    insuranceCharges: e.target.value,
                  }))
                }
                className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                } focus:ring-2 focus:ring-teal-500/20`}
              />
            </div>
            <div>
              <label
                htmlFor="quotation-loading-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Loading Charges
              </label>
              <input
                id="quotation-loading-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.loadingCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    loadingCharges: e.target.value,
                  }))
                }
                className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                } focus:ring-2 focus:ring-teal-500/20`}
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="quotation-other-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Other Charges
              </label>
              <input
                id="quotation-other-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.otherCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    otherCharges: e.target.value,
                  }))
                }
                className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                } focus:ring-2 focus:ring-teal-500/20`}
              />
            </div>
          </div>

          {/* Discount Section */}
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div
              className={`block text-xs font-semibold ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-600'}`}
            >
              Discount
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={formData.discountType === 'percentage'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountType: e.target.value,
                    }))
                  }
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <span
                  className={`text-sm ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-700'}`}
                >
                  Percentage
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={formData.discountType === 'fixed'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountType: e.target.value,
                    }))
                  }
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <span
                  className={`text-sm ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-700'}`}
                >
                  Fixed Amount
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {formData.discountType === 'percentage' && (
                <div>
                  <label
                    htmlFor="discountPercentage"
                    className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    Discount Percentage (%)
                  </label>
                  <input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.discountPercentage || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountPercentage: e.target.value,
                      }))
                    }
                    className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                    } focus:ring-2 focus:ring-teal-500/20`}
                  />
                </div>
              )}

              {formData.discountType === 'fixed' && (
                <div>
                  <label
                    htmlFor="discountAmount"
                    className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    Discount Amount
                  </label>
                  <input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.discountAmount || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: e.target.value,
                      }))
                    }
                    className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-teal-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
                    } focus:ring-2 focus:ring-teal-500/20`}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            className={`p-3 rounded-[14px] ${isDarkMode ? 'bg-[#0f151b] border border-[#2a3640]' : 'bg-gray-50 border border-gray-200'}`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-sm ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                Total Charges
              </span>
              <span className="text-sm font-bold font-mono">
                {formatCurrency(
                  (parseFloat(formData.packingCharges) || 0) +
                    (parseFloat(formData.freightCharges) || 0) +
                    (parseFloat(formData.insuranceCharges) || 0) +
                    (parseFloat(formData.loadingCharges) || 0) +
                    (parseFloat(formData.otherCharges) || 0),
                )}
              </span>
            </div>
          </div>
        </div>

        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
              : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
          }}
        >
          <button
            type="button"
            onClick={() => setChargesDrawerOpen(false)}
            className="w-full bg-gradient-to-br from-teal-600 to-teal-700 text-white font-medium hover:from-teal-500 hover:to-teal-600 rounded-lg py-2.5 px-3 text-sm transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Notes & Terms Drawer */}
      <Drawer
        isOpen={notesDrawerOpen}
        onClose={() => setNotesDrawerOpen(false)}
        title="Notes & Terms"
        subtitle="Internal notes and terms for this quotation"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label
              htmlFor="quotation-notes"
              className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              Notes
            </label>
            <textarea
              id="quotation-notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any notes about this quotation..."
              rows={4}
              className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none resize-none ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500'
              } focus:ring-2 focus:ring-teal-500/20`}
            />
          </div>
          <div>
            <label
              htmlFor="quotation-terms"
              className={`block text-xs mb-1.5 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              Terms & Conditions
            </label>
            <textarea
              id="quotation-terms"
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  termsAndConditions: e.target.value,
                }))
              }
              placeholder="Enter terms and conditions..."
              rows={5}
              className={`w-full py-2.5 px-3 text-[13px] rounded-xl border outline-none resize-none ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500'
              } focus:ring-2 focus:ring-teal-500/20`}
            />
          </div>
        </div>

        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
              : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
          }}
        >
          <button
            type="button"
            onClick={() => setNotesDrawerOpen(false)}
            className="w-full bg-gradient-to-br from-teal-600 to-teal-700 text-white font-medium hover:from-teal-500 hover:to-teal-600 rounded-lg py-2.5 px-3 text-sm transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Preview Modal */}
      {showPreview && (
        <QuotationPreview
          quotation={formData}
          company={{}}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Steel Industry Modals (STEEL-FORMS-PHASE1 Priority 2) */}
      <VolumeDiscountTiersModal
        isOpen={volumeDiscountModalOpen}
        onClose={() => setVolumeDiscountModalOpen(false)}
        tiers={formData.volumeDiscountTiers}
        onSave={handleSaveVolumeDiscountTiers}
      />

      <BatchesModal
        isOpen={batchesModalOpen}
        onClose={() => setBatchesModalOpen(false)}
        productId={selectedItemForBatches?.productId}
        productName={selectedItemForBatches?.name}
        warehouseId={formData.warehouseId}
      />

      {selectedItemForDelivery !== null && (
        <DeliveryScheduleModal
          isOpen={deliveryScheduleModalOpen}
          onClose={() => {
            setDeliveryScheduleModalOpen(false);
            setSelectedItemForDelivery(null);
          }}
          schedule={
            formData.items[selectedItemForDelivery]?.deliverySchedule || []
          }
          lineQuantity={formData.items[selectedItemForDelivery]?.quantity || 0}
          onSave={(schedule) =>
            handleSaveDeliverySchedule(selectedItemForDelivery, schedule)
          }
        />
      )}

      {selectedItemForAlternatives !== null && (
        <AlternativeProductsModal
          isOpen={alternativeProductsModalOpen}
          onClose={() => {
            setAlternativeProductsModalOpen(false);
            setSelectedItemForAlternatives(null);
          }}
          alternatives={
            formData.items[selectedItemForAlternatives]?.alternativeProducts ||
            []
          }
          currentProductId={
            formData.items[selectedItemForAlternatives]?.productId
          }
          onSave={(alternatives) =>
            handleSaveAlternativeProducts(
              selectedItemForAlternatives,
              alternatives,
            )
          }
        />
      )}
    </div>
  );
};

export default QuotationForm;
