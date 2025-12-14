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
  Package,
  AlertCircle,
  CheckCircle,
  X,
  Pin,
  Settings,
  Loader2,
  Eye,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  quotationsAPI,
  productsAPI,
  apiClient,
} from '../services/api';
import { customerService } from '../services/customerService';
import pricelistService from '../services/pricelistService';
import { formatCurrency, calculateItemAmount } from '../utils/invoiceUtils';
import { STEEL_GRADES, FINISHES } from '../types';
import QuotationPreview from '../components/quotations/QuotationPreview';
import StockAvailabilityIndicator from '../components/invoice/StockAvailabilityIndicator';
import SourceTypeSelector from '../components/invoice/SourceTypeSelector';

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

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const isEdit = Boolean(id);

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
    quotationNumber: '',
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
          const nextNumberResponse = await quotationsAPI.getNextNumber();
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
          const response = await quotationsAPI.getById(id);

          // Transform snake_case to camelCase
          setFormData({
            quotationNumber: response.quotationNumber || '',
            customerId: response.customerId || '',
            customerDetails:
              typeof response.customerDetails === 'string'
                ? JSON.parse(response.customerDetails)
                : response.customerDetails || {
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
            quotationDate: response.quotationDate?.split('T')[0] || '',
            validUntil: response.validUntil?.split('T')[0] || '',
            customerPurchaseOrderNumber:
              response.customerPurchaseOrderNumber || '',
            customerPurchaseOrderDate:
              response.customerPurchaseOrderDate?.split('T')[0] || '',
            warehouseId: response.warehouseId?.toString() || '',
            warehouseName: response.warehouseName || '',
            warehouseCode: response.warehouseCode || '',
            warehouseCity: response.warehouseCity || '',
            currency: response.currency || 'AED',
            exchangeRate: response.exchangeRate || 1,
            deliveryTerms: response.deliveryTerms || '',
            paymentTerms: response.paymentTerms || '',
            notes: response.notes || '',
            termsAndConditions: response.termsAndConditions || '',
            items: (response.items || []).map((item) => ({
              productId: item.productId || '',
              name: item.name || '',
              specification: item.specification || '',
              grade: item.grade || '',
              finish: item.finish || '',
              size: item.size || '',
              thickness: item.thickness || '',
              description: item.description || '',
              hsnCode: item.hsnCode || '',
              unit: item.unit || 'pcs',
              quantity: item.quantity || 0,
              rate: item.rate || 0,
              discount: item.discount || 0,
              discountType: item.discountType || 'amount',
              taxableAmount: item.taxableAmount || 0,
              vatRate: item.vatRate || 5,
              amount: item.amount || 0,
              netAmount: item.netAmount || 0,
              // Stock & Source Fields (Phase 3)
              sourceType: item.sourceType || 'WAREHOUSE',
            })),
            subtotal: response.subtotal || 0,
            vatAmount: response.vatAmount || 0,
            totalQuantity: response.totalQuantity || 0,
            totalWeight: response.totalWeight || 0,
            packingCharges: response.packingCharges || 0,
            freightCharges: response.freightCharges || 0,
            insuranceCharges: response.insuranceCharges || 0,
            loadingCharges: response.loadingCharges || 0,
            otherCharges: response.otherCharges || 0,
            discountType: response.discountType || 'amount',
            discountPercentage: response.discountPercentage || 0,
            discountAmount: response.discountAmount || 0,
            total: response.total || 0,
            status: response.status || 'draft',
          });

          // Set customer input value for autocomplete
          if (response.customerId && response.customerDetails?.name) {
            setCustomerInputValue(response.customerDetails.name);
          }
        } catch (err) {
          console.error('Error fetching quotation:', err);
          setError('Failed to load quotation data');
        } finally {
          setLoading(false);
        }
      };

      fetchQuotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]); // quotationsAPI and setState functions are stable

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
      const customer = customers.find((c) => c.id === selectedOption.id);
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
    const customer = customers.find((c) => c.id === parseInt(customerId));
    if (customer) {
      setCustomerInputValue(customer.name);
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

  const calculateTotals = () => {
    const items = formData.items;

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

    // Calculate VAT amount
    const _vatAmount = items.reduce((sum, item) => {
      const rate = parseFloat(item.vatRate) || 0;
      const taxable = parseFloat(item.taxableAmount) || 0;
      return sum + (taxable * rate) / 100;
    }, 0);

    // Apply invoice-level discount
    const discountAmount =
      formData.discountType === 'percentage'
        ? (subtotal * (parseFloat(formData.discountPercentage) || 0)) / 100
        : parseFloat(formData.discountAmount) || 0;

    const subtotalAfterDiscount = subtotal - discountAmount;

    // Recalculate VAT on discounted subtotal
    const vatAfterDiscount = subtotalAfterDiscount * 0.05; // Assuming 5% VAT

    // Add all charges
    const allCharges =
      (parseFloat(formData.packingCharges) || 0) +
      (parseFloat(formData.freightCharges) || 0) +
      (parseFloat(formData.insuranceCharges) || 0) +
      (parseFloat(formData.loadingCharges) || 0) +
      (parseFloat(formData.otherCharges) || 0);

    // Calculate total
    const total = subtotalAfterDiscount + vatAfterDiscount + allCharges;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      totalQuantity,
      vatAmount: vatAfterDiscount,
      total,
    }));
  };

  // Recalculate when charges or discount changes
  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.packingCharges,
    formData.freightCharges,
    formData.insuranceCharges,
    formData.loadingCharges,
    formData.otherCharges,
    formData.discountType,
    formData.discountPercentage,
    formData.discountAmount,
    formData.items,
  ]); // calculateTotals is intentionally not in deps to avoid recreation on every render

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
      };

      if (isEdit) {
        await quotationsAPI.update(id, dataToSubmit);
        setSuccess('Quotation updated successfully');
      } else {
        await quotationsAPI.create(dataToSubmit);
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
    ...props
  }) => {
    const inputId =
      elementId || `input-${Math.random().toString(36).substr(2, 9)}`;

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
          className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
            isDarkMode
              ? 'text-white placeholder-gray-500'
              : 'text-gray-900 placeholder-gray-400'
          } ${getValidationClasses()} ${className}`}
          {...props}
        />
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

  const Select = ({
    label,
    children,
    selectError,
    className = '',
    required = false,
    validationState = null,
    showValidation = true,
    id: elementId,
    ...props
  }) => {
    const selectId =
      elementId || `select-${Math.random().toString(36).substr(2, 9)}`;

    const getValidationClasses = () => {
      if (!showValidation) {
        return isDarkMode
          ? 'border-gray-600 bg-gray-800'
          : 'border-gray-300 bg-white';
      }
      if (selectError || validationState === 'invalid') {
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
        <select
          id={selectId}
          className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          } ${getValidationClasses()} ${className}`}
          {...props}
        >
          {children}
        </select>
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
                  data-testid={dataTestId ? `${dataTestId}-option-${index}` : undefined}
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
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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
              label="Quotation Number"
              type="text"
              value={formData.quotationNumber}
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
              label="Valid Until"
              type="date"
              value={formData.validUntil}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
              }
            />

            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, currency: e.target.value }));
                validateField('currency', e.target.value);
              }}
              required
              validationState={fieldValidation.currency}
              showValidation={formPreferences.showValidationHighlighting}
            >
              <option value="AED">AED (UAE Dirham)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="INR">INR (Indian Rupee)</option>
            </Select>
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
              }))}
              value={formData.customerId ? customers.find((c) => c.id === parseInt(formData.customerId)) : null}
              inputValue={customerInputValue}
              onInputChange={(e, newValue) => {
                setCustomerInputValue(newValue || '');
              }}
              onChange={(e, selected) => {
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
            <Select
              label="Warehouse"
              value={formData.warehouseId}
              onChange={(e) => {
                const warehouseId = e.target.value;
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
              }}
              required={formData.status !== 'draft'}
              validationState={fieldValidation.warehouse}
              showValidation={formPreferences.showValidationHighlighting}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.city})
                </option>
              ))}
            </Select>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                    <div className="sm:col-span-2">
                      <Select
                        label="Product"
                        value={item.productId}
                        onChange={(e) =>
                          updateItem(index, 'productId', e.target.value)
                        }
                      >
                        <option value="">Select or enter manually</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.displayName ||
                              product.display_name ||
                              product.uniqueName ||
                              product.unique_name ||
                              'N/A'}
                          </option>
                        ))}
                      </Select>
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

                    <Select
                      label="Grade"
                      value={item.grade || ''}
                      onChange={(e) =>
                        updateItem(index, 'grade', e.target.value)
                      }
                    >
                      <option value="">Select Grade</option>
                      {STEEL_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Finish"
                      value={item.finish || ''}
                      onChange={(e) =>
                        updateItem(index, 'finish', e.target.value)
                      }
                    >
                      <option value="">Select Finish</option>
                      {FINISHES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>

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
                          updateItem(index, 'quantity', isNaN(val) ? '' : val);
                        }}
                        min="0"
                        step={
                          item.quantityUom === 'MT' || item.quantityUom === 'KG'
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

                      <Select
                        label="Unit"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, 'unit', e.target.value)
                        }
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">Kilograms</option>
                        <option value="tons">Tons</option>
                        <option value="meters">Meters</option>
                        <option value="sqm">Square Meters</option>
                        <option value="feet">Feet</option>
                        <option value="sqft">Square Feet</option>
                      </Select>

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

        {/* Charges & Totals - Side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Charges */}
          <div
            className={`p-3 md:p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <h3
              className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Additional Charges
            </h3>

            <div className="space-y-2 md:space-y-3">
              <Input
                label="Packing Charges"
                type="number"
                value={formData.packingCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    packingCharges: e.target.value,
                  }))
                }
                min="0"
                step="0.01"
              />

              <Input
                label="Freight Charges"
                type="number"
                value={formData.freightCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    freightCharges: e.target.value,
                  }))
                }
                min="0"
                step="0.01"
              />

              <Input
                label="Insurance Charges"
                type="number"
                value={formData.insuranceCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    insuranceCharges: e.target.value,
                  }))
                }
                min="0"
                step="0.01"
              />

              <Input
                label="Loading Charges"
                type="number"
                value={formData.loadingCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    loadingCharges: e.target.value,
                  }))
                }
                min="0"
                step="0.01"
              />

              <Input
                label="Other Charges"
                type="number"
                value={formData.otherCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    otherCharges: e.target.value,
                  }))
                }
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Totals */}
          <div
            className={`p-3 md:p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Calculator size={18} className="text-teal-600 md:hidden" />
              <Calculator size={20} className="text-teal-600 hidden md:block" />
              <h3
                className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Summary
              </h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between text-sm">
                <span
                  className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                >
                  Subtotal:
                </span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {formatCurrency(formData.subtotal)}
                </span>
              </div>

              {formData.vatAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                  >
                    VAT:
                  </span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatCurrency(formData.vatAmount)}
                  </span>
                </div>
              )}

              <div
                className={`pt-2 md:pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Total:
                  </span>
                  <span
                    className={`text-lg md:text-xl font-bold text-teal-600`}
                  >
                    {formatCurrency(formData.total)}
                  </span>
                </div>
              </div>

              <div className="text-xs md:text-sm space-y-1 pt-2">
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                  >
                    Total Items:
                  </span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formData.items.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                  >
                    Total Quantity:
                  </span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formData.totalQuantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms - Collapsible on mobile */}
        <details
          className={`p-3 md:p-6 rounded-xl border ${
            isDarkMode
              ? 'bg-[#1E2328] border-[#37474F]'
              : 'bg-white border-gray-200'
          }`}
          open
        >
          <summary
            className={`text-base md:text-lg font-semibold cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Notes & Terms
          </summary>
          <div className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <div>
              <label
                htmlFor="quotation-notes"
                className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                Notes
              </label>
              <textarea
                id="quotation-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="quotation-terms"
                className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}
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
                rows={3}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </details>

        {/* Submit Buttons - Sticky on mobile */}
        <div className="sticky bottom-0 left-0 right-0 bg-opacity-95 backdrop-blur-sm p-2 md:p-0 md:relative flex justify-end gap-2 md:gap-4 z-10">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className={`px-4 md:px-6 py-2 border rounded-lg transition-colors text-sm md:text-base ${
              isDarkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 bg-[#1E2328]'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 border rounded-lg transition-colors text-sm md:text-base ${
              isDarkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 bg-[#1E2328]'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
            }`}
            title="Preview quotation"
          >
            <Eye size={14} className="md:hidden" />
            <Eye size={16} className="hidden md:block" />
            Preview
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 text-sm md:text-base ${
              isSaving
                ? 'opacity-60 cursor-not-allowed pointer-events-none'
                : ''
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} className="md:hidden" />
                <Save size={16} className="hidden md:block" />
                {isEdit ? 'Update' : 'Create'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <QuotationPreview
          quotation={formData}
          company={{}}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default QuotationForm;
