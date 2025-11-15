import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  Calculator,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  AlertTriangle,
  Pin,
  Settings,
  Loader2
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { quotationsAPI, customersAPI, productsAPI } from "../services/api";
import { apiClient } from "../services/api";
import { formatCurrency } from "../utils/invoiceUtils";
import { STEEL_GRADES, FINISHES } from "../types";

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const isEdit = Boolean(id);

  // Form preferences (with localStorage persistence)
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem('quotationFormPreferences');
    return saved ? JSON.parse(saved) : {
      showSpeedButtons: true,
      showValidationHighlighting: true
    };
  });

  const [formData, setFormData] = useState({
    quotationNumber: "",
    customerId: "",
    customerDetails: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        emirate: "",
        country: "UAE"
      },
      vatNumber: ""
    },
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: "",
    // Customer PO fields
    customerPurchaseOrderNumber: "",
    customerPurchaseOrderDate: "",
    // Warehouse
    warehouseId: "",
    warehouseName: "",
    warehouseCode: "",
    warehouseCity: "",
    // Currency
    currency: "AED",
    exchangeRate: 1,
    deliveryTerms: "",
    paymentTerms: "",
    notes: "",
    termsAndConditions: "",
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
    status: "draft"
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);

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
        console.log('Auto-saved quotation draft');
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, isEdit]);

  // Validation function
  const validateField = useCallback((fieldName, value) => {
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

    setFieldValidation(prev => ({
      ...prev,
      [fieldName]: isValid ? 'valid' : 'invalid'
    }));

    return isValid;
  }, [formData.status]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, productsResponse, warehousesResponse] = await Promise.all([
          customersAPI.getAll({ limit: 1000 }),
          productsAPI.getAll({ limit: 1000 }),
          apiClient.get("/warehouses")
        ]);

        setCustomers(customersResponse.customers || []);
        setProducts(productsResponse.products || []);

        const warehouseList = warehousesResponse?.warehouses || warehousesResponse?.data?.warehouses || [];
        const activeWarehouses = warehouseList.filter((w) => w.is_active !== false);
        setWarehouses(activeWarehouses);

        // Set default warehouse (Sharjah) for new quotations
        if (!isEdit && activeWarehouses.length > 0 && !formData.warehouseId) {
          const sharjahWarehouse = activeWarehouses.find(w =>
            w.city?.toLowerCase().includes('sharjah') ||
            w.name?.toLowerCase().includes('sharjah')
          );
          const defaultWarehouse = sharjahWarehouse || activeWarehouses[0];

          setFormData(prev => ({
            ...prev,
            warehouseId: defaultWarehouse.id.toString(),
            warehouseName: defaultWarehouse.name || "",
            warehouseCode: defaultWarehouse.code || "",
            warehouseCity: defaultWarehouse.city || "",
          }));
        }

        if (!isEdit) {
          // Get next quotation number
          const nextNumberResponse = await quotationsAPI.getNextNumber();
          setFormData(prev => ({
            ...prev,
            quotationNumber: nextNumberResponse.next_quotation_number
          }));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load initial data");
      }
    };

    fetchData();
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
            quotationNumber: response.quotation_number || "",
            customerId: response.customer_id || "",
            customerDetails: typeof response.customer_details === 'string'
              ? JSON.parse(response.customer_details)
              : response.customer_details || {
                  name: "",
                  company: "",
                  email: "",
                  phone: "",
                  address: { street: "", city: "", emirate: "", country: "UAE" },
                  vatNumber: ""
                },
            quotationDate: response.quotation_date?.split('T')[0] || "",
            validUntil: response.valid_until?.split('T')[0] || "",
            customerPurchaseOrderNumber: response.customer_purchase_order_number || "",
            customerPurchaseOrderDate: response.customer_purchase_order_date?.split('T')[0] || "",
            warehouseId: response.warehouse_id?.toString() || "",
            warehouseName: response.warehouse_name || "",
            warehouseCode: response.warehouse_code || "",
            warehouseCity: response.warehouse_city || "",
            currency: response.currency || "AED",
            exchangeRate: response.exchange_rate || 1,
            deliveryTerms: response.delivery_terms || "",
            paymentTerms: response.payment_terms || "",
            notes: response.notes || "",
            termsAndConditions: response.terms_and_conditions || "",
            items: (response.items || []).map(item => ({
              productId: item.product_id || "",
              name: item.name || "",
              specification: item.specification || "",
              grade: item.grade || "",
              finish: item.finish || "",
              size: item.size || "",
              thickness: item.thickness || "",
              description: item.description || "",
              hsnCode: item.hsn_code || "",
              unit: item.unit || "pcs",
              quantity: item.quantity || 0,
              rate: item.rate || 0,
              discount: item.discount || 0,
              discountType: item.discount_type || "amount",
              taxableAmount: item.taxable_amount || 0,
              vatRate: item.vat_rate || 5,
              amount: item.amount || 0,
              netAmount: item.net_amount || 0
            })),
            subtotal: response.subtotal || 0,
            vatAmount: response.vat_amount || 0,
            totalQuantity: response.total_quantity || 0,
            totalWeight: response.total_weight || 0,
            packingCharges: response.packing_charges || 0,
            freightCharges: response.freight_charges || 0,
            insuranceCharges: response.insurance_charges || 0,
            loadingCharges: response.loading_charges || 0,
            otherCharges: response.other_charges || 0,
            discountType: response.discount_type || 'amount',
            discountPercentage: response.discount_percentage || 0,
            discountAmount: response.discount_amount || 0,
            total: response.total || 0,
            status: response.status || "draft"
          });
        } catch (err) {
          console.error("Error fetching quotation:", err);
          setError("Failed to load quotation data");
        } finally {
          setLoading(false);
        }
      };

      fetchQuotation();
    }
  }, [isEdit, id]);

  // Run field validation when key fields change
  useEffect(() => {
    if (formData.quotationNumber) validateField('quotationNumber', formData.quotationNumber);
    if (formData.customerDetails.name) validateField('customerName', formData.customerDetails.name);
    if (formData.quotationDate) validateField('quotationDate', formData.quotationDate);
    if (formData.warehouseId) validateField('warehouse', formData.warehouseId);
    if (formData.currency) validateField('currency', formData.currency);
  }, [formData.quotationNumber, formData.customerDetails.name, formData.quotationDate, formData.warehouseId, formData.currency, formData.status, validateField]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customerId,
        customerDetails: {
          name: customer.name,
          company: customer.company || "",
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || {
            street: "",
            city: "",
            emirate: "",
            country: "UAE"
          },
          vatNumber: customer.vat_number || ""
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: customerId,
        customerDetails: {
          name: "",
          company: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            emirate: "",
            country: "UAE"
          },
          vatNumber: ""
        }
      }));
    }
  };

  // Pin/Unpin product
  const handleTogglePin = (e, productId) => {
    e.stopPropagation();
    setPinnedProductIds(prev => {
      const newPinned = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('quotationPinnedProducts', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  // Sort products: pinned first, then by most quoted
  const sortedProducts = useMemo(() => {
    const pinned = products.filter(p => pinnedProductIds.includes(p.id));
    const unpinned = products
      .filter(p => !pinnedProductIds.includes(p.id))
      .sort((a, b) => (b.times_quoted || 0) - (a.times_quoted || 0))
      .slice(0, 10 - pinned.length);
    return [...pinned, ...unpinned];
  }, [products, pinnedProductIds]);

  // Quick add item from speed button
  const quickAddItem = (product) => {
    const newItem = {
      productId: product.id || "",
      name: product.full_name || product.name || "",
      specification: product.specifications?.specification || product.specifications?.size || "",
      grade: product.specifications?.grade || product.grade || "",
      finish: product.specifications?.finish || product.finish || "",
      size: product.specifications?.size || product.size || "",
      thickness: product.specifications?.thickness || product.thickness || "",
      description: product.description || "",
      hsnCode: product.hsn_code || "",
      unit: product.unit || "kg",
      quantity: 1,
      rate: parseFloat(product.selling_price || product.price) || 0,
      discount: 0,
      discountType: "amount",
      taxableAmount: 0,
      vatRate: 5,
      amount: 0,
      netAmount: 0
    };

    // Calculate amounts
    const qty = newItem.quantity;
    const rate = newItem.rate;
    const grossAmount = qty * rate;
    newItem.taxableAmount = grossAmount;
    newItem.amount = grossAmount;
    newItem.netAmount = grossAmount + (grossAmount * newItem.vatRate / 100);

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setTimeout(calculateTotals, 0);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: "",
        name: "",
        specification: "",
        grade: "",
        finish: "",
        size: "",
        thickness: "",
        description: "",
        hsnCode: "",
        unit: "pcs",
        quantity: 1,
        rate: 0,
        discount: 0,
        discountType: "amount",
        taxableAmount: 0,
        vatRate: 5,
        amount: 0,
        netAmount: 0
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setTimeout(calculateTotals, 0);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // If product is selected, populate item details
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index] = {
          ...newItems[index],
          name: product.full_name || product.name,
          specification: product.specifications?.specification || product.specifications?.size || newItems[index].specification || "",
          grade: product.specifications?.grade || product.grade || newItems[index].grade || "",
          finish: product.specifications?.finish || product.finish || newItems[index].finish || "",
          size: product.specifications?.size || product.size || newItems[index].size || "",
          thickness: product.specifications?.thickness || product.thickness || newItems[index].thickness || "",
          description: product.description || "",
          hsnCode: product.hsn_code || "",
          unit: product.unit || "pcs",
          rate: product.selling_price || product.price || 0
        };
      }
    }

    // Calculate item totals
    const item = newItems[index];
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const vatRate = parseFloat(item.vatRate) || 0;

    const grossAmount = quantity * rate;
    const discountAmount = item.discountType === 'percentage'
      ? (grossAmount * discount / 100)
      : discount;
    const taxableAmount = grossAmount - discountAmount;

    const vatAmountItem = taxableAmount * vatRate / 100;
    const netAmount = taxableAmount + vatAmountItem;

    newItems[index] = {
      ...item,
      taxableAmount: taxableAmount,
      amount: taxableAmount,
      netAmount: netAmount
    };

    setFormData(prev => ({ ...prev, items: newItems }));

    setTimeout(calculateTotals, 0);
  };

  const calculateTotals = () => {
    const items = formData.items;

    // Calculate subtotal (sum of all item amounts before VAT)
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

    // Calculate VAT amount
    const vatAmount = items.reduce((sum, item) => {
      const rate = parseFloat(item.vatRate) || 0;
      const taxable = parseFloat(item.taxableAmount) || 0;
      return sum + (taxable * rate / 100);
    }, 0);

    // Apply invoice-level discount
    const discountAmount = formData.discountType === 'percentage'
      ? (subtotal * (parseFloat(formData.discountPercentage) || 0) / 100)
      : (parseFloat(formData.discountAmount) || 0);

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

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalQuantity,
      vatAmount: vatAfterDiscount,
      total
    }));
  };

  // Recalculate when charges or discount changes
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
    formData.discountAmount
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const errors = [];
    if (!formData.quotationNumber || formData.quotationNumber.trim() === '') {
      errors.push('Quotation number is required');
    }
    if (!formData.customerDetails.name || formData.customerDetails.name.trim() === '') {
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
      setError("");

      // Transform to backend format (snake_case)
      const dataToSubmit = {
        quotation_number: formData.quotationNumber,
        customer_id: formData.customerId ? Number(formData.customerId) : null,
        customer_details: formData.customerDetails,
        quotation_date: formData.quotationDate,
        valid_until: formData.validUntil || null,
        customer_purchase_order_number: formData.customerPurchaseOrderNumber || "",
        customer_purchase_order_date: formData.customerPurchaseOrderDate || null,
        warehouse_id: formData.warehouseId ? Number(formData.warehouseId) : null,
        warehouse_name: formData.warehouseName || "",
        warehouse_code: formData.warehouseCode || "",
        warehouse_city: formData.warehouseCity || "",
        currency: formData.currency || "AED",
        exchange_rate: formData.exchangeRate || 1,
        delivery_terms: formData.deliveryTerms || "",
        payment_terms: formData.paymentTerms || "",
        notes: formData.notes || "",
        terms_and_conditions: formData.termsAndConditions || "",
        items: formData.items.map(item => ({
          product_id: item.productId ? Number(item.productId) : null,
          name: item.name,
          specification: item.specification || "",
          grade: item.grade || "",
          finish: item.finish || "",
          size: item.size || "",
          thickness: item.thickness || "",
          description: item.description || "",
          hsn_code: item.hsnCode || "",
          unit: item.unit || "pcs",
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          discount: parseFloat(item.discount) || 0,
          discount_type: item.discountType || "amount",
          taxable_amount: parseFloat(item.taxableAmount) || 0,
          vat_rate: parseFloat(item.vatRate) || 0,
          amount: parseFloat(item.amount) || 0,
          net_amount: parseFloat(item.netAmount) || 0
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
        status: formData.status || 'draft'
      };

      if (isEdit) {
        await quotationsAPI.update(id, dataToSubmit);
        setSuccess("Quotation updated successfully");
      } else {
        await quotationsAPI.create(dataToSubmit);
        setSuccess("Quotation created successfully");
      }

      // Standardized smooth transition delay (300ms)
      setTimeout(() => {
        navigate("/quotations");
      }, 300);

    } catch (err) {
      console.error("Error saving quotation:", err);
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const msgs = apiErrors.map((e) => (typeof e === 'string' ? e : (e.message || JSON.stringify(e))));
        setError(msgs.join('\n'));
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Failed to save quotation");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Preference toggle
  const togglePreference = (key) => {
    const newPrefs = { ...formPreferences, [key]: !formPreferences[key] };
    setFormPreferences(newPrefs);
    localStorage.setItem('quotationFormPreferences', JSON.stringify(newPrefs));
  };

  if (loading && isEdit) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  // Input component with validation
  const Input = ({ label, error, className = "", required = false, validationState = null, showValidation = true, ...props }) => {
    const getValidationClasses = () => {
      if (!showValidation) {
        return isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white';
      }
      if (error || validationState === 'invalid') {
        return isDarkMode ? 'border-red-500 bg-red-900/10' : 'border-red-500 bg-red-50';
      }
      if (validationState === 'valid') {
        return isDarkMode ? 'border-green-500 bg-green-900/10' : 'border-green-500 bg-green-50';
      }
      if (required && validationState === null) {
        return isDarkMode ? 'border-yellow-600/50 bg-yellow-900/5' : 'border-yellow-400/50 bg-yellow-50/30';
      }
      return isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white';
    };

    return (
      <div className="space-y-0.5">
        {label && (
          <label className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}>
            {label}
          </label>
        )}
        <input
          className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
            isDarkMode ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
          } ${getValidationClasses()} ${className}`}
          {...props}
        />
        {error && <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>}
      </div>
    );
  };

  const Select = ({ label, children, error, className = "", required = false, validationState = null, showValidation = true, ...props }) => {
    const getValidationClasses = () => {
      if (!showValidation) {
        return isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white';
      }
      if (error || validationState === 'invalid') {
        return isDarkMode ? 'border-red-500 bg-red-900/10' : 'border-red-500 bg-red-50';
      }
      if (validationState === 'valid') {
        return isDarkMode ? 'border-green-500 bg-green-900/10' : 'border-green-500 bg-green-50';
      }
      if (required && validationState === null) {
        return isDarkMode ? 'border-yellow-600/50 bg-yellow-900/5' : 'border-yellow-400/50 bg-yellow-50/30';
      }
      return isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white';
    };

    return (
      <div className="space-y-0.5">
        {label && (
          <label className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}>
            {label}
          </label>
        )}
        <select
          className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
            isDarkMode ? "text-white" : "text-gray-900"
          } ${getValidationClasses()} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'} p-2 md:p-4`}>
      {/* Header - Compact on mobile */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
          <button
            onClick={() => navigate("/quotations")}
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
            <h1 className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isEdit ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            <p className={`text-xs md:text-sm mt-0.5 md:mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isEdit ? 'Update quotation details' : 'Create a new quotation for your customer'}
            </p>
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className={`p-1.5 md:p-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Form Preferences"
          >
            <Settings size={18} className="md:hidden" />
            <Settings size={20} className="hidden md:block" />
          </button>
        </div>

        {/* Preferences Panel */}
        {showPreferences && (
          <div className={`p-3 md:p-4 rounded-lg border mb-4 ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Form Preferences
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreferences.showSpeedButtons}
                  onChange={() => togglePreference('showSpeedButtons')}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quick Add Speed Buttons
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreferences.showValidationHighlighting}
                  onChange={() => togglePreference('showValidationHighlighting')}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Real-time Validation Highlighting
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div className="flex-1 whitespace-pre-line">{error}</div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
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
        <div className={`p-3 md:p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <FileText size={18} className="text-teal-600 md:hidden" />
            <FileText size={20} className="text-teal-600 hidden md:block" />
            <h2 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <Input
              label="Quotation Number"
              type="text"
              value={formData.quotationNumber}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, quotationNumber: e.target.value }));
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
                setFormData(prev => ({ ...prev, quotationDate: e.target.value }));
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
              onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
            />

            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, currency: e.target.value }));
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
        <div className={`p-3 md:p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <User size={18} className="text-teal-600 md:hidden" />
            <User size={20} className="text-teal-600 hidden md:block" />
            <h2 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Customer Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Select
              label="Select Customer"
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">Select or enter manually</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.company && `(${customer.company})`}
                </option>
              ))}
            </Select>

            <Input
              label="Customer Name"
              type="text"
              value={formData.customerDetails.name}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  customerDetails: { ...prev.customerDetails, name: e.target.value }
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
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, company: e.target.value }
              }))}
            />

            <Input
              label="Email"
              type="email"
              value={formData.customerDetails.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, email: e.target.value }
              }))}
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.customerDetails.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, phone: e.target.value }
              }))}
            />

            <Input
              label="VAT Number"
              type="text"
              value={formData.customerDetails.vatNumber}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, vatNumber: e.target.value }
              }))}
            />

            <Input
              label="Customer PO Number"
              type="text"
              value={formData.customerPurchaseOrderNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPurchaseOrderNumber: e.target.value }))}
            />

            <Input
              label="Customer PO Date"
              type="date"
              value={formData.customerPurchaseOrderDate}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPurchaseOrderDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Warehouse & Delivery - New Section */}
        <div className={`p-3 md:p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Package size={18} className="text-teal-600 md:hidden" />
            <Package size={20} className="text-teal-600 hidden md:block" />
            <h2 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Warehouse & Delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <Select
              label="Warehouse"
              value={formData.warehouseId}
              onChange={(e) => {
                const id = e.target.value;
                const w = warehouses.find((wh) => wh.id.toString() === id);
                setFormData(prev => ({
                  ...prev,
                  warehouseId: id,
                  warehouseName: w ? w.name : "",
                  warehouseCode: w ? w.code : "",
                  warehouseCity: w ? w.city : "",
                }));
                validateField('warehouse', id);
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
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
              placeholder="e.g., FOB Destination"
            />

            <Input
              label="Payment Terms"
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              placeholder="e.g., 30 days from invoice"
            />
          </div>
        </div>

        {/* Items Section with Speed Buttons */}
        <div className={`p-3 md:p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-teal-600 md:hidden" />
              <Package size={20} className="text-teal-600 hidden md:block" />
              <h2 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
              <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Quick Add (Pinned & Top Products)
              </p>
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {sortedProducts.map((product) => {
                  const isPinned = pinnedProductIds.includes(product.id);
                  return (
                    <div key={product.id} className="relative group flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => quickAddItem(product)}
                        className={`px-2 md:px-3 py-1.5 md:py-2 pr-6 md:pr-8 rounded-lg border-2 text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                          isPinned
                            ? isDarkMode
                              ? "border-teal-700 bg-teal-900/40 text-teal-300 hover:bg-teal-900/60 shadow-md hover:shadow-lg"
                              : "border-teal-600 bg-teal-100 text-teal-800 hover:bg-teal-200 shadow-md hover:shadow-lg"
                            : isDarkMode
                            ? "border-teal-600 bg-teal-900/20 text-teal-400 hover:bg-teal-900/40 hover:shadow-md"
                            : "border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:shadow-md"
                        }`}
                      >
                        {product.full_name || product.name}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, product.id)}
                        className={`absolute right-0.5 md:right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 hover:scale-110 ${
                          isPinned
                            ? isDarkMode
                              ? "text-teal-300 hover:text-teal-200"
                              : "text-teal-700 hover:text-teal-800"
                            : isDarkMode
                            ? "text-gray-400 hover:text-teal-400"
                            : "text-gray-500 hover:text-teal-600"
                        }`}
                        title={isPinned ? "Unpin product" : "Pin product"}
                      >
                        {isPinned ? <Pin size={12} fill="currentColor" className="md:hidden" /> : <Pin size={12} className="md:hidden" />}
                        {isPinned ? <Pin size={14} fill="currentColor" className="hidden md:block" /> : <Pin size={14} className="hidden md:block" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {formData.items.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Package size={40} className={`mx-auto mb-3 md:mb-4 md:hidden ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <Package size={48} className={`mx-auto mb-3 md:mb-4 hidden md:block ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm md:text-lg font-medium mb-1 md:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No items added yet
              </p>
              <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Click "Add Item" or use Quick Add buttons
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className={`p-3 md:p-4 border rounded-lg ${
                  isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                    <div className="sm:col-span-2">
                      <Select
                        label="Product"
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      >
                        <option value="">Select or enter manually</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.full_name || product.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>

                    <Select
                      label="Grade"
                      value={item.grade || ""}
                      onChange={(e) => updateItem(index, 'grade', e.target.value)}
                    >
                      <option value="">Select Grade</option>
                      {STEEL_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </Select>

                    <Select
                      label="Finish"
                      value={item.finish || ""}
                      onChange={(e) => updateItem(index, 'finish', e.target.value)}
                    >
                      <option value="">Select Finish</option>
                      {FINISHES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Select>

                    <Input
                      label="Size"
                      type="text"
                      value={item.size || ""}
                      onChange={(e) => updateItem(index, 'size', e.target.value)}
                      placeholder="e.g., 1220x2440"
                    />

                    <Input
                      label="Thickness"
                      type="text"
                      value={item.thickness || ""}
                      onChange={(e) => updateItem(index, 'thickness', e.target.value)}
                      placeholder="e.g., 1.2mm"
                    />

                    <Input
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />

                    <Input
                      label={`Rate (${formData.currency})`}
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />

                    <Input
                      label="VAT (%)"
                      type="number"
                      value={item.vatRate}
                      onChange={(e) => updateItem(index, 'vatRate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                    />

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Total
                        </label>
                        <div className={`px-2 py-1.5 text-sm border rounded-md ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-300'
                            : 'bg-gray-100 border-gray-300 text-gray-600'
                        }`}>
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

                  {/* Additional fields - collapsible on mobile */}
                  <details className="mt-2 md:mt-3">
                    <summary className={`text-xs cursor-pointer ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      More details
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 mt-2">
                      <Input
                        label="Specification"
                        type="text"
                        value={item.specification}
                        onChange={(e) => updateItem(index, 'specification', e.target.value)}
                      />

                      <Select
                        label="Unit"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
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
                        onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
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
          <div className={`p-3 md:p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Additional Charges
            </h3>

            <div className="space-y-2 md:space-y-3">
              <Input
                label="Packing Charges"
                type="number"
                value={formData.packingCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, packingCharges: e.target.value }))}
                min="0"
                step="0.01"
              />

              <Input
                label="Freight Charges"
                type="number"
                value={formData.freightCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, freightCharges: e.target.value }))}
                min="0"
                step="0.01"
              />

              <Input
                label="Insurance Charges"
                type="number"
                value={formData.insuranceCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, insuranceCharges: e.target.value }))}
                min="0"
                step="0.01"
              />

              <Input
                label="Loading Charges"
                type="number"
                value={formData.loadingCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, loadingCharges: e.target.value }))}
                min="0"
                step="0.01"
              />

              <Input
                label="Other Charges"
                type="number"
                value={formData.otherCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Totals */}
          <div className={`p-3 md:p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Calculator size={18} className="text-teal-600 md:hidden" />
              <Calculator size={20} className="text-teal-600 hidden md:block" />
              <h3 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Summary
              </h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {formatCurrency(formData.subtotal)}
                </span>
              </div>

              {formData.vatAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>VAT:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatCurrency(formData.vatAmount)}
                  </span>
                </div>
              )}

              <div className={`pt-2 md:pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total:
                  </span>
                  <span className={`text-lg md:text-xl font-bold text-teal-600`}>
                    {formatCurrency(formData.total)}
                  </span>
                </div>
              </div>

              <div className="text-xs md:text-sm space-y-1 pt-2">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Items:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formData.items.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Quantity:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formData.totalQuantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms - Collapsible on mobile */}
        <details className={`p-3 md:p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`} open>
          <summary className={`text-base md:text-lg font-semibold cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Notes & Terms
          </summary>
          <div className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>
                Terms & Conditions
              </label>
              <textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
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
            onClick={() => navigate("/quotations")}
            className={`px-4 md:px-6 py-2 border rounded-lg transition-colors text-sm md:text-base ${
              isDarkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 bg-[#1E2328]'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 text-sm md:text-base ${
              isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
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
    </div>
  );
};

export default QuotationForm;
