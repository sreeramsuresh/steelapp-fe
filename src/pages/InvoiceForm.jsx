import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Download,
  ChevronDown,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  createInvoice,
  createCompany,
  createSteelItem,
  STEEL_UNITS,
  PAYMENT_MODES,
  DELIVERY_TERMS,
  DISCOUNT_TYPES,
  STEEL_GRADES,
  FINISHES,
} from "../types";
import {
  generateInvoiceNumber,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotalTRN,
  calculateTotal,
  formatCurrency,
  formatDateForInput,
} from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import InvoicePreview from "../components/InvoicePreview";
import { invoiceService, companyService } from "../services";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { useApiData, useApi } from "../hooks/useApi";
import { notificationService } from "../services/notificationService";

// Custom Tailwind Components
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  const { isDarkMode } = useTheme();
  
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const getVariantClasses = () => {
    if (variant === "primary") {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else if (variant === "secondary") {
      return `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-${isDarkMode ? 'gray-500' : 'gray-400'} disabled:${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else { // outline
      return `border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? "cursor-not-allowed" : ""
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{label}</label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500' 
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>}
    </div>
  );
};

const Select = ({ label, children, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{label}</label>
      )}
      <div className="relative">
        <select
          className={`w-full pl-3 pr-9 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 appearance-none ${
            isDarkMode 
              ? 'border-gray-600 bg-gray-800 text-white disabled:bg-gray-700 disabled:text-gray-500' 
              : 'border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400'
          } ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
      {error && <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>}
    </div>
  );
};

const Textarea = ({ label, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{label}</label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500' 
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>}
    </div>
  );
};

const Card = ({ children, className = "" }) => {
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

const Alert = ({ variant = "info", children, onClose, className = "" }) => {
  const { isDarkMode } = useTheme();
  
  const getVariantClasses = () => {
    const darkVariants = {
      info: "bg-blue-900/20 border-blue-500/30 text-blue-300",
      warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
      error: "bg-red-900/20 border-red-500/30 text-red-300",
      success: "bg-green-900/20 border-green-500/30 text-green-300",
    };
    
    const lightVariants = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
      success: "bg-green-50 border-green-200 text-green-800",
    };
    
    return isDarkMode ? darkVariants[variant] : lightVariants[variant];
  };

  return (
    <div className={`border rounded-lg p-4 ${getVariantClasses()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === "warning" && <AlertTriangle className="h-5 w-5" />}
          {variant === "info" && <Info className="h-5 w-5" />}
        </div>
        <div className="ml-3 flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const Autocomplete = ({
  options = [],
  value,
  onChange,
  onInputChange,
  inputValue,
  placeholder,
  label,
  disabled = false,
  renderOption,
  noOptionsText = "No options",
  className = "",
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputValue) {
      const filtered = options.filter((option) =>
        option.name?.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered.slice(0, 20));
    } else {
      setFilteredOptions(options.slice(0, 20));
    }
  }, [options, inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
  };

  const updateDropdownPosition = () => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      dropdown.style.width = `${inputRect.width}px`;
      dropdown.style.zIndex = '9999';
    }
  };

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
  }, [isOpen]);

  return (
    <div className="relative">
      <div ref={inputRef}>
        <Input
          label={label}
          value={inputValue || ""}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
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
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-white border-gray-700' 
                    : 'hover:bg-gray-50 text-gray-900 border-gray-100'
                }`}
                onMouseDown={() => handleOptionSelect(option)}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {noOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-black'} opacity-75`}></div>
        </div>

        <div
          className={`inline-block align-bottom border rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizes[size]} sm:w-full sm:p-6 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <button
              onClick={onClose}
              className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = "md" }) => {
  const { isDarkMode } = useTheme();
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-blue-600 ${sizes[size]} ${
        isDarkMode ? 'border-gray-300' : 'border-gray-200'
      }`}
    ></div>
  );
};

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  

  // Debounce timeout refs for charges fields
  const chargesTimeout = useRef(null);

  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    category: "rebar",
    grade: "",
    size: "",
    weight: "",
    unit: "kg",
    description: "",
    current_stock: "",
    min_stock: "",
    max_stock: "",
    cost_price: "",
    selling_price: "",
    supplier: "",
    location: "",
    specifications: {
      length: "",
      width: "",
      thickness: "",
      diameter: "",
      tensileStrength: "",
      yieldStrength: "",
      carbonContent: "",
      coating: "",
      standard: "",
    },
  });
  const [selectedProductForRow, setSelectedProductForRow] = useState(-1);
  const [searchInputs, setSearchInputs] = useState({});
  const [tradeLicenseStatus, setTradeLicenseStatus] = useState(null);
  const [showTradeLicenseAlert, setShowTradeLicenseAlert] = useState(false);
  
  // Helper to enforce invoice number prefix by status
  const withStatusPrefix = (num, status) => {
    const desired = status === 'draft' ? 'DFT' : status === 'proforma' ? 'PFM' : 'INV';
    if (!num || typeof num !== 'string') return `${desired}-${generateInvoiceNumber().split('-').slice(1).join('-')}`;
    const dashIdx = num.indexOf('-');
    if (dashIdx === -1) {
      // No dash, prepend desired prefix
      // Avoid duplicate desired prefix
      const cleaned = num.replace(/^(INV|DFT|PFM)/, '').replace(/^-/, '');
      return `${desired}-${cleaned || generateInvoiceNumber().split('-').slice(1).join('-')}`;
    }
    return `${desired}${num.slice(dashIdx)}`;
  };
  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    newInvoice.invoiceNumber = withStatusPrefix(generateInvoiceNumber(), newInvoice.status || 'draft');
    return newInvoice;
  });

  // No extra payment terms fields; Due Date remains directly editable

  // Remove deferred value which might be causing delays
  const deferredItems = invoice.items;

  const { data: company, loading: loadingCompany } = useApiData(
    companyService.getCompany,
    [],
    true
  );
  const { execute: saveInvoice, loading: savingInvoice } = useApi(
    invoiceService.createInvoice
  );
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(
    invoiceService.updateInvoice
  );
  const { data: existingInvoice, loading: loadingInvoice } = useApiData(
    () => (id ? invoiceService.getInvoice(id) : null),
    [id],
    !!id
  );
  const { data: nextInvoiceData } = useApiData(
    () => invoiceService.getNextInvoiceNumber(),
    [],
    !id
  );
  const { data: customersData, loading: loadingCustomers } = useApiData(
    () => customerService.getCustomers({ status: "active" }),
    []
  );
  const {
    data: productsData,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useApiData(() => productService.getProducts({}), []);
  const { execute: createProduct, loading: creatingProduct } = useApi(
    productService.createProduct
  );

  // Heavily optimized calculations with minimal dependencies
  const computedSubtotal = useMemo(
    () => calculateSubtotal(invoice.items),
    [invoice.items]
  );
  const computedVatAmount = useMemo(
    () => calculateTotalTRN(invoice.items),
    [invoice.items]
  );

  const computedDiscountAmount = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;
    
    if (invoice.discountType === 'percentage') {
      return (computedSubtotal * discountPercentage) / 100;
    } else {
      return discountAmount;
    }
  }, [computedSubtotal, invoice.discountAmount, invoice.discountPercentage, invoice.discountType]);

  // Parse charges only when calculating final total to avoid blocking on every keystroke
  const computedTotal = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;
    
    let totalDiscount = 0;
    if (invoice.discountType === 'percentage') {
      totalDiscount = (computedSubtotal * discountPercentage) / 100;
    } else {
      totalDiscount = discountAmount;
    }
    
    const subtotalAfterDiscount = Math.max(0, computedSubtotal - totalDiscount);
    return calculateTotal(subtotalAfterDiscount, computedVatAmount);
  }, [
    computedSubtotal,
    computedVatAmount,
    invoice.discountAmount,
    invoice.discountPercentage,
    invoice.discountType,
  ]);

  useEffect(() => {
    if (nextInvoiceData && nextInvoiceData.next_invoice_number && !id) {
      setInvoice((prev) => ({
        ...prev,
        invoiceNumber: withStatusPrefix(nextInvoiceData.next_invoice_number, prev.status || 'draft'),
      }));
    }
  }, [nextInvoiceData, id]);

  useEffect(() => {
    if (existingInvoice && id) {
      setInvoice(existingInvoice);
    }
  }, [existingInvoice, id]);

  const checkTradeLicenseStatus = async (customerId) => {
    try {
      // Use axios-based client to benefit from auth + baseURL
      const { apiClient } = await import('../services/api');
      const licenseStatus = await apiClient.get(`/customers/${customerId}/trade-license-status`);
      if (licenseStatus) {
        setTradeLicenseStatus(licenseStatus);
        // Show alert for expired or expiring licenses
        if (
          licenseStatus.hasLicense &&
          (licenseStatus.status === 'expired' || licenseStatus.status === 'expiring_soon')
        ) {
          setShowTradeLicenseAlert(true);
        } else {
          setShowTradeLicenseAlert(false);
        }
      }
    } catch (error) {
      // Fall back to fetch with defensive parsing to capture server HTML errors
      try {
        const resp = await fetch(`/api/customers/${customerId}/trade-license-status`);
        const ct = resp.headers.get('content-type') || '';
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${txt.slice(0,200)}`);
        }
        if (!ct.includes('application/json')) {
          const txt = await resp.text();
          throw new SyntaxError(`Unexpected content-type: ${ct}. Body starts: ${txt.slice(0,80)}`);
        }
        const licenseStatus = await resp.json();
        setTradeLicenseStatus(licenseStatus);
      } catch (fallbackErr) {
        console.error('Error checking trade license status:', fallbackErr);
      }
    }
  };

  const handleCustomerSelect = useCallback(
    (customerId) => {
      const customers = customersData?.customers || [];
      const selectedCustomer = customers.find((c) => c.id == customerId);

      if (selectedCustomer) {
        setInvoice((prev) => ({
          ...prev,
          customer: {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email || "",
            phone: selectedCustomer.phone || "",
            vatNumber: selectedCustomer.vat_number || "",
            address: {
              street: selectedCustomer.address?.street || "",
              city: selectedCustomer.address?.city || "",
              emirate: selectedCustomer.address?.emirate || "",
              poBox: selectedCustomer.address?.poBox || "",
            },
          },
        }));

        // Check trade license status
        checkTradeLicenseStatus(customerId);
      }
    },
    [customersData]
  );

  const handleProductSelect = useCallback((index, product) => {
    if (product && typeof product === "object") {
      setInvoice((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          name: product.name,
          grade: product.grade || "",
          unit: product.unit,
          rate: product.selling_price || 0,
          amount: calculateItemAmount(
            newItems[index].quantity,
            product.selling_price || 0
          ),
        };

        return {
          ...prev,
          items: newItems,
        };
      });

      // Clear search input for this row
      setSearchInputs((prev) => ({ ...prev, [index]: "" }));
    }
  }, []);

  // No automatic coupling; due date is independently editable by the user

  const handleSearchInputChange = useCallback((index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Update the item name immediately for responsive typing
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        name: value,
        productId: null, // Clear product ID when typing custom name
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  const isProductExisting = useCallback(
    (index) => {
      const searchValue = searchInputs[index] || "";
      const products = productsData?.products || [];
      return products.some(
        (product) => product.name.toLowerCase() === searchValue.toLowerCase()
      );
    },
    [productsData, searchInputs]
  );

  const handleItemChange = useCallback((index, field, value) => {
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      if (field === "quantity" || field === "rate") {
        newItems[index].amount = calculateItemAmount(
          newItems[index].quantity,
          newItems[index].rate
        );
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  const productOptions = useMemo(() => {
    const list = productsData?.products || [];
    return list.map((product) => ({
      ...product,
      label: product.name,
      subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${
        product.selling_price || 0
      }/${product.unit}`,
    }));
  }, [productsData]);

  // Simplified filtering to reduce computation
  const getFilteredOptions = useCallback((options, inputValue) => {
    if (!inputValue) return options.slice(0, 20);
    return options
      .filter((option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase())
      )
      .slice(0, 20);
  }, []);

  // Debounced handler for charges fields to prevent calculation blocking
  const handleChargeChange = useCallback((field, value) => {
    // Update UI immediately for responsive typing
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const addItem = useCallback(() => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, createSteelItem()],
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSave = async () => {
    try {
      // Convert empty string values to numbers before saving
      const processedInvoice = {
        ...invoice,
        discountAmount:
          invoice.discountAmount === "" ? 0 : Number(invoice.discountAmount),
        discountPercentage:
          invoice.discountPercentage === "" ? 0 : Number(invoice.discountPercentage),
        advanceReceived:
          invoice.advanceReceived === "" ? 0 : Number(invoice.advanceReceived),
        items: invoice.items.map((item) => ({
          ...item,
          quantity: item.quantity === "" ? 0 : Number(item.quantity),
          rate: item.rate === "" ? 0 : Number(item.rate),
          discount: item.discount === "" ? 0 : Number(item.discount),
          vatRate: item.vatRate === "" ? 0 : Number(item.vatRate),
        })),
      };

      if (id) {
        // Update existing invoice using cancel and recreate approach
        const updatedInvoice = await updateInvoice(
          invoice.id,
          processedInvoice
        );
        if (onSave) onSave(updatedInvoice);

        notificationService.success(
          'Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data.'
        );
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(processedInvoice);
        if (onSave) onSave(newInvoice);
        notificationService.success('Invoice created successfully!');
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      notificationService.error("Failed to save invoice. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!company) {
      notificationService.warning("Company data is still loading. Please wait...");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      await generateInvoicePDF(invoice, company);
      notificationService.success("PDF generated successfully!");
    } catch (error) {
      notificationService.error(`PDF generation failed: ${error.message}`);
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
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading invoice...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-4 overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-none">
        <Card className="p-4 sm:p-6">
          {/* Header */}
          <div className={`sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 p-4 -m-4 sm:-m-6 sm:p-6 rounded-t-2xl border-b ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <h1 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {id ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  if (!company) {
                    notificationService.warning("Company data is still loading. Please wait...");
                    return;
                  }
                  setShowPreview(true);
                }}
                disabled={loadingCompany}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF || loadingCompany}
                className="w-full sm:w-auto"
              >
                {isGeneratingPDF ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={savingInvoice || updatingInvoice}
                className="w-full sm:w-auto"
              >
                {savingInvoice || updatingInvoice ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingInvoice || updatingInvoice
                  ? "Saving..."
                  : "Save Invoice"}
              </Button>
            </div>
          </div>

          <div className="pt-8">
          {/* Edit Invoice Warning */}
          {id && (
            <Alert variant="warning" className="mb-6">
              <div>
                <h4 className="font-medium mb-2">Invoice Editing Policy</h4>
                <p className="text-sm">
                  🔄 To maintain audit trails and inventory accuracy, editing
                  will:
                  <br />• Cancel the original invoice and reverse its inventory
                  impact
                  <br />• Create a new invoice with your updated data
                  <br />• Apply new inventory movements
                  <br />• Note: Delivery notes are managed separately and are not auto-created on save.
                </p>
              </div>
            </Alert>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Invoice Details */}
            <Card className="p-4 sm:p-6">
              <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📄 Invoice Details
              </h2>
              <div className="space-y-4">
                <Input
                  label="Invoice Number"
                  value={invoice.invoiceNumber}
                  onChange={(e) =>
                    setInvoice((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    value={formatDateForInput(invoice.date)}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={formatDateForInput(invoice.dueDate)}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Invoice Status"
                    value={invoice.status || "draft"}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        status: e.target.value,
                        invoiceNumber: withStatusPrefix(prev.invoiceNumber, e.target.value),
                      }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="proforma">Proforma</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </Select>
                  <Select
                    label="Payment Mode"
                    value={invoice.modeOfPayment || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        modeOfPayment: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select payment mode</option>
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </Select>
                </div>
                
                {/* Customer Purchase Order Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Customer PO Number (Optional)"
                    value={invoice.customerPurchaseOrderNumber || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        customerPurchaseOrderNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter customer PO number"
                  />
                  <Input
                    label="Customer PO Date (Optional)"
                    type="date"
                    value={invoice.customerPurchaseOrderDate || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        customerPurchaseOrderDate: e.target.value,
                      }))
                    }
                  />
                </div>
                
                {/* Delivery notes are created separately from invoice save */}
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-4 sm:p-6">
              <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                👤 Customer Details
              </h2>
              <div className="space-y-4">
                <Select
                  label="Select Customer"
                  value={invoice.customer.id || ""}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  disabled={loadingCustomers}
                >
                  <option value="">Select a customer</option>
                  {(customersData?.customers || []).map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </Select>

                {/* Display selected customer details */}
                {invoice.customer.name && (
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Selected Customer:
                    </h4>
                    <div className={`space-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {invoice.customer.name}
                      </p>
                      {invoice.customer.email && (
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {invoice.customer.email}
                        </p>
                      )}
                      {invoice.customer.phone && (
                        <p>
                          <span className="font-medium">Phone:</span>{" "}
                          {invoice.customer.phone}
                        </p>
                      )}
                      {invoice.customer.vatNumber && (
                        <p>
                          <span className="font-medium">TRN:</span>{" "}
                          {invoice.customer.vatNumber}
                        </p>
                      )}
                      {(invoice.customer.address.street ||
                        invoice.customer.address.city) && (
                        <p>
                          <span className="font-medium">Address:</span>{" "}
                          {[
                            invoice.customer.address.street,
                            invoice.customer.address.city,
                            invoice.customer.address.emirate,
                            invoice.customer.address.poBox,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Trade License Status Alert */}
                {showTradeLicenseAlert && tradeLicenseStatus && (
                  <Alert
                    variant="warning"
                    onClose={() => setShowTradeLicenseAlert(false)}
                  >
                    <div>
                      <h4 className="font-medium mb-1">Trade License Alert</h4>
                      <p className="text-sm">{tradeLicenseStatus.message}</p>
                      {tradeLicenseStatus.licenseNumber && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">License Number:</span>{" "}
                          {tradeLicenseStatus.licenseNumber}
                        </p>
                      )}
                      {tradeLicenseStatus.expiryDate && (
                        <p className="text-sm">
                          <span className="font-medium">Expiry Date:</span>{" "}
                          {new Date(
                            tradeLicenseStatus.expiryDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Alert>
                )}

                {loadingCustomers && (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading customers...
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Transport & Delivery Details (disabled for Phase 1) */}
          {false && (
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🚚 Transport & Delivery Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Despatched Through"
                value={invoice.despatchedThrough || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    despatchedThrough: e.target.value,
                  }))
                }
                placeholder="Transport company/agent"
              />
              <Input
                label="Destination"
                value={invoice.destination || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    destination: e.target.value,
                  }))
                }
                placeholder="Delivery destination"
              />
              <Select
                label="Terms of Delivery"
                value={invoice.termsOfDelivery || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    termsOfDelivery: e.target.value,
                  }))
                }
              >
                <option value="">Select delivery terms</option>
                {DELIVERY_TERMS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Select>
              <Input
                label="Other Reference"
                value={invoice.otherReference || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    otherReference: e.target.value,
                  }))
                }
                placeholder="Additional reference"
              />
            </div>
          </Card>
          )}

          {/* Items Section */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
              <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-0 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🏗️ Steel Items [UPDATED - NOW WITH FINISH, SIZE, THICKNESS]
              </h2>
              <Button onClick={addItem} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* Items Table - Desktop */}
            <div className="hidden xl:block overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Product
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Grade
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'} bg-blue-50`}>
                      Finish
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'} bg-green-50`}>
                      Size
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'} bg-yellow-50`}>
                      Thickness
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Unit
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Qty
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Rate
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      VAT %
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Amount
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-600' : 'bg-white divide-gray-200'}`}>
                  {deferredItems.slice(0, 20).map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="w-48">
                          <Autocomplete
                            options={productOptions}
                            value={
                              item.productId
                                ? productOptions.find(
                                    (p) => p.id === item.productId
                                  )
                                : null
                            }
                            inputValue={searchInputs[index] || item.name || ""}
                            onInputChange={(event, newInputValue) => {
                              handleSearchInputChange(index, newInputValue);
                            }}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleProductSelect(index, newValue);
                              }
                            }}
                            placeholder="Search products..."
                            disabled={loadingProducts}
                            renderOption={(option) => (
                              <div>
                                <div className="font-medium">{option.name}</div>
                                <div className="text-sm text-gray-500">
                                  {option.subtitle}
                                </div>
                              </div>
                            )}
                            noOptionsText="No products found"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Select
                          value={item.grade || ""}
                          onChange={(e) =>
                            handleItemChange(index, "grade", e.target.value)
                          }
                          className="w-24"
                        >
                          <option value="">Select Grade</option>
                          {STEEL_GRADES.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap bg-blue-50">
                        <Select
                          value={item.finish || ""}
                          onChange={(e) =>
                            handleItemChange(index, "finish", e.target.value)
                          }
                          className="w-24"
                        >
                          <option value="">Select Finish</option>
                          {FINISHES.map((finish) => (
                            <option key={finish} value={finish}>
                              {finish}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap bg-green-50">
                        <Input
                          value={item.size || ""}
                          onChange={(e) =>
                            handleItemChange(index, "size", e.target.value)
                          }
                          placeholder="e.g., 4x8"
                          className="w-24"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap bg-yellow-50">
                        <Input
                          value={item.thickness || ""}
                          onChange={(e) =>
                            handleItemChange(index, "thickness", e.target.value)
                          }
                          placeholder="e.g., 1mm"
                          className="w-24"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Select
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="w-20"
                        >
                          {STEEL_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || ""
                            )
                          }
                          min="0"
                          step="0.01"
                          className="w-20"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "rate",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || ""
                            )
                          }
                          min="0"
                          step="0.01"
                          className="w-24"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          value={item.vatRate}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "vatRate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          max="100"
                          className="w-16"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={invoice.items.length === 1}
                          className={`hover:text-red-300 ${isDarkMode ? 'text-red-400 disabled:text-gray-600' : 'text-red-500 disabled:text-gray-400'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Items Cards - Mobile */}
            <div className="xl:hidden space-y-4">
              {deferredItems.slice(0, 10).map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Item #{index + 1}
                    </h4>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={invoice.items.length === 1}
                      className={`hover:text-red-300 ${isDarkMode ? 'text-red-400 disabled:text-gray-600' : 'text-red-500 disabled:text-gray-400'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <Autocomplete
                      options={productOptions}
                      value={
                        item.productId
                          ? productOptions.find((p) => p.id === item.productId)
                          : null
                      }
                      inputValue={searchInputs[index] || item.name || ""}
                      onInputChange={(event, newInputValue) => {
                        handleSearchInputChange(index, newInputValue);
                      }}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          handleProductSelect(index, newValue);
                        }
                      }}
                      label="Product"
                      placeholder="Search products..."
                      disabled={loadingProducts}
                      renderOption={(option) => (
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-sm text-gray-500">
                            {option.subtitle}
                          </div>
                        </div>
                      )}
                      noOptionsText="No products found"
                    />


                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Grade"
                        value={item.grade || ""}
                        onChange={(e) =>
                          handleItemChange(index, "grade", e.target.value)
                        }
                      >
                        <option value="">Select Grade</option>
                        {STEEL_GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </Select>
                      <Select
                        label="Finish"
                        value={item.finish || ""}
                        onChange={(e) =>
                          handleItemChange(index, "finish", e.target.value)
                        }
                      >
                        <option value="">Select Finish</option>
                        {FINISHES.map((finish) => (
                          <option key={finish} value={finish}>
                            {finish}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Size"
                        value={item.size || ""}
                        onChange={(e) =>
                          handleItemChange(index, "size", e.target.value)
                        }
                        placeholder="e.g., 4x8"
                      />
                      <Input
                        label="Thickness"
                        value={item.thickness || ""}
                        onChange={(e) =>
                          handleItemChange(index, "thickness", e.target.value)
                        }
                        placeholder="e.g., 1mm"
                      />
                      <Select
                        label="Unit"
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                      >
                        {STEEL_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Qty"
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || ""
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                      <Input
                        label="Rate"
                        type="number"
                        value={item.rate || ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "rate",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || ""
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                      <Input
                        label="VAT %"
                        type="number"
                        value={item.vatRate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "vatRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className={`flex justify-end p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Amount: {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              {deferredItems.length > 10 && (
                <div className={`text-center py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing first 10 items. Add more items as needed.
                </div>
              )}
            </div>
          </Card>

          {/* Summary and Notes */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📝 Notes
              </h2>
              <Textarea
                value={invoice.notes}
                onChange={(e) =>
                  setInvoice((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
                rows="4"
              />
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                💰 Invoice Summary
              </h2>
              <div className="space-y-4">
                <div className={`flex justify-between items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(computedSubtotal)}
                  </span>
                </div>

                {/* Discount Section */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <Select
                      label="Discount Type"
                      value={invoice.discountType || "amount"}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          discountType: e.target.value,
                          discountAmount: "",
                          discountPercentage: ""
                        }))
                      }
                    >
                      <option value="amount">Amount</option>
                      <option value="percentage">Percentage</option>
                    </Select>
                    
                    {invoice.discountType === "percentage" ? (
                      <Input
                        label="Discount Percentage (%)"
                        type="number"
                        value={invoice.discountPercentage || ""}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            discountPercentage: e.target.value
                          }))
                        }
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <Input
                        label="Discount Amount"
                        type="number"
                        value={invoice.discountAmount || ""}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            discountAmount: e.target.value
                          }))
                        }
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    )}
                  </div>
                </div>

                {computedDiscountAmount > 0 && (
                  <div className={`flex justify-between items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span>Discount:</span>
                    <span className="font-medium text-red-500">
                      -{formatCurrency(computedDiscountAmount)}
                    </span>
                  </div>
                )}

                <div className={`flex justify-between items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span>VAT Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(computedVatAmount)}
                  </span>
                </div>

                <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                    <span className="text-lg font-bold text-teal-400">
                      {formatCurrency(computedTotal)}
                    </span>
                  </div>
                </div>

                {/* Advance and Balance */}
                <div className="space-y-3">
                  <Input
                    label="Advance Received"
                    type="number"
                    value={invoice.advanceReceived || ""}
                    onChange={(e) =>
                      handleChargeChange("advanceReceived", e.target.value)
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {invoice.advanceReceived > 0 && (
                    <div className={`flex justify-between items-center p-3 rounded-md border ${isDarkMode ? 'bg-teal-900/20 border-teal-500/30' : 'bg-teal-50 border-teal-200'}`}>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Balance Amount:
                      </span>
                      <span className="font-medium text-teal-400">
                        {formatCurrency(
                          Math.max(
                            0,
                            computedTotal - (invoice.advanceReceived || 0)
                          )
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Terms & Conditions */}
          <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
            <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📋 Payment as per payment terms
            </h2>
            <Textarea
              value={invoice.terms}
              onChange={(e) =>
                setInvoice((prev) => ({ ...prev, terms: e.target.value }))
              }
              placeholder="Payment terms and conditions..."
              rows="3"
            />
          </Card>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceForm;
