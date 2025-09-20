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
import {
  createInvoice,
  createCompany,
  createSteelItem,
  STEEL_UNITS,
  PAYMENT_MODES,
  DELIVERY_TERMS,
  DISCOUNT_TYPES,
} from "../types";
import {
  generateInvoiceNumber,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotalVAT,
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
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
  const variants = {
    primary:
      "bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-600 disabled:hover:translate-y-0 shadow-sm hover:shadow-md",
    secondary:
      "bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-800",
    outline:
      "border border-gray-600 bg-gray-800 text-white hover:bg-gray-700 focus:ring-teal-500 disabled:bg-gray-800",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
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

const Input = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-400">{label}</label>
    )}
    <input
      className={`w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-500 ${
        error ? "border-red-500" : ""
      } ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-400">{error}</p>}
  </div>
);

const Select = ({ label, children, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-400">{label}</label>
    )}
    <div className="relative">
      <select
        className={`w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-500 appearance-none ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
    {error && <p className="text-sm text-red-400">{error}</p>}
  </div>
);

const Textarea = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-400">{label}</label>
    )}
    <textarea
      className={`w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-500 ${
        error ? "border-red-500" : ""
      } ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-400">{error}</p>}
  </div>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-gray-800 border border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const Alert = ({ variant = "info", children, onClose, className = "" }) => {
  const variants = {
    info: "bg-blue-900/20 border-blue-500/30 text-blue-300",
    warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
    error: "bg-red-900/20 border-red-500/30 text-red-300",
    success: "bg-green-900/20 border-green-500/30 text-green-300",
  };

  return (
    <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === "warning" && <AlertTriangle className="h-5 w-5" />}
          {variant === "info" && <Info className="h-5 w-5" />}
        </div>
        <div className="ml-3 flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-white"
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
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);

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

  return (
    <div className="relative">
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

      {isOpen && (
        <div
          className="fixed z-[9999] bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || index}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-b-0"
                onMouseDown={() => handleOptionSelect(option)}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div className="text-sm text-gray-400">
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">
              {noOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
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
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div
          className={`inline-block align-bottom bg-gray-800 border border-gray-600 rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizes[size]} sm:w-full sm:p-6`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
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
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizes[size]}`}
    ></div>
  );
};

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();

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
  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    newInvoice.invoiceNumber = generateInvoiceNumber();
    return newInvoice;
  });

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
    () => calculateTotalVAT(invoice.items),
    [invoice.items]
  );

  // Parse charges only when calculating final total to avoid blocking on every keystroke
  const computedTotal = useMemo(() => {
    const packingCharges = parseFloat(invoice.packingCharges) || 0;
    const freightCharges = parseFloat(invoice.freightCharges) || 0;
    const loadingCharges = parseFloat(invoice.loadingCharges) || 0;
    const otherCharges = parseFloat(invoice.otherCharges) || 0;
    const additionalCharges =
      packingCharges + freightCharges + loadingCharges + otherCharges;
    return calculateTotal(
      computedSubtotal + additionalCharges,
      computedVatAmount
    );
  }, [
    computedSubtotal,
    computedVatAmount,
    invoice.packingCharges,
    invoice.freightCharges,
    invoice.loadingCharges,
    invoice.otherCharges,
  ]);

  useEffect(() => {
    if (nextInvoiceData && nextInvoiceData.nextNumber && !id) {
      setInvoice((prev) => ({
        ...prev,
        invoiceNumber: nextInvoiceData.nextNumber,
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
      const response = await fetch(
        `/api/customers/${customerId}/trade-license-status`
      );
      if (response.ok) {
        const licenseStatus = await response.json();
        setTradeLicenseStatus(licenseStatus);

        // Show alert for expired or expiring licenses
        if (
          licenseStatus.hasLicense &&
          (licenseStatus.status === "expired" ||
            licenseStatus.status === "expiring_soon")
        ) {
          setShowTradeLicenseAlert(true);
        } else {
          setShowTradeLicenseAlert(false);
        }
      }
    } catch (error) {
      console.error("Error checking trade license status:", error);
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
          specification:
            product.specifications?.standard || product.grade || "",
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
        packingCharges:
          invoice.packingCharges === "" ? 0 : Number(invoice.packingCharges),
        freightCharges:
          invoice.freightCharges === "" ? 0 : Number(invoice.freightCharges),
        loadingCharges:
          invoice.loadingCharges === "" ? 0 : Number(invoice.loadingCharges),
        otherCharges:
          invoice.otherCharges === "" ? 0 : Number(invoice.otherCharges),
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

        alert(
          `✅ Invoice updated successfully!\n\n🔄 Process completed:\n• Original invoice cancelled\n• Inventory movements reversed\n• New invoice created with updated data\n• New inventory movements applied${
            processedInvoice.status === "paid"
              ? "\n• Delivery note auto-generated"
              : ""
          }`
        );
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(processedInvoice);
        if (onSave) onSave(newInvoice);
        alert(
          `✅ Invoice created successfully!${
            processedInvoice.status === "paid"
              ? "\n🚚 Delivery note auto-generated"
              : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!company) {
      alert("Company data is still loading. Please wait...");
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

  if (loadingInvoice) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-300">Loading invoice...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 p-4 overflow-auto">
      <div className="max-w-none">
        <Card className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-600">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-0">
              {id ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  if (!company) {
                    alert("Company data is still loading. Please wait...");
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
                  <br />• Cancel any existing delivery notes (new ones will be
                  created if status = 'paid')
                </p>
              </div>
            </Alert>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Invoice Details */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
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
                  <Input
                    label="Purchase Order Number"
                    value={invoice.purchaseOrderNumber || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        purchaseOrderNumber: e.target.value,
                      }))
                    }
                    placeholder="PO Number (Optional)"
                  />
                  <Input
                    label="PO Date"
                    type="date"
                    value={formatDateForInput(invoice.purchaseOrderDate) || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        purchaseOrderDate: e.target.value,
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
                      }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">
                      Paid (Auto-creates delivery note)
                    </option>
                    <option value="overdue">Overdue</option>
                  </Select>
                  <Select
                    label="Payment Terms"
                    value={invoice.modeOfPayment || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        modeOfPayment: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select payment terms</option>
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </Select>
                </div>
                {invoice.status === "paid" && (
                  <Alert variant="info">
                    <p className="text-sm">
                      🚚 A delivery note will be automatically created when this
                      invoice is saved as 'Paid'
                    </p>
                  </Alert>
                )}
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
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
                  <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <h4 className="font-medium text-white mb-2">
                      Selected Customer:
                    </h4>
                    <div className="space-y-1 text-sm text-gray-300">
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
                          <span className="font-medium">VAT:</span>{" "}
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
                    <span className="text-sm text-gray-400">
                      Loading customers...
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Transport & Delivery Details */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
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

          {/* Items Section */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-0 flex items-center">
                🏗️ Steel Items
              </h2>
              <Button onClick={addItem} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* Items Table - Desktop */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Specification
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      VAT %
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600">
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
                        <Input
                          value={item.specification}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "specification",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 12mm dia"
                          className="w-32"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Input
                          value={item.grade || ""}
                          onChange={(e) =>
                            handleItemChange(index, "grade", e.target.value)
                          }
                          placeholder="e.g., Fe415"
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
                        <span className="font-medium text-white">
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={invoice.items.length === 1}
                          className="text-red-400 hover:text-red-300 disabled:text-gray-600"
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
                    <h4 className="font-medium text-white">
                      Item #{index + 1}
                    </h4>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={invoice.items.length === 1}
                      className="text-red-400 hover:text-red-300 disabled:text-gray-600"
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

                    <Input
                      label="Specification"
                      value={item.specification}
                      onChange={(e) =>
                        handleItemChange(index, "specification", e.target.value)
                      }
                      placeholder="e.g., 12mm dia"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Grade"
                        value={item.grade || ""}
                        onChange={(e) =>
                          handleItemChange(index, "grade", e.target.value)
                        }
                        placeholder="e.g., Fe415"
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

                    <div className="flex justify-end p-3 bg-gray-700 rounded-md">
                      <span className="font-medium text-white">
                        Amount: {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              {deferredItems.length > 10 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Showing first 10 items. Add more items as needed.
                </div>
              )}
            </div>
          </Card>

          {/* Summary and Notes */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
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
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                💰 Invoice Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(computedSubtotal)}
                  </span>
                </div>

                {/* Additional Charges Section */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Packing Charges"
                      type="number"
                      value={invoice.packingCharges || ""}
                      onChange={(e) =>
                        handleChargeChange("packingCharges", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Input
                      label="Freight Charges"
                      type="number"
                      value={invoice.freightCharges || ""}
                      onChange={(e) =>
                        handleChargeChange("freightCharges", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Input
                      label="Loading Charges"
                      type="number"
                      value={invoice.loadingCharges || ""}
                      onChange={(e) =>
                        handleChargeChange("loadingCharges", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Input
                      label="Other Charges"
                      type="number"
                      value={invoice.otherCharges || ""}
                      onChange={(e) =>
                        handleChargeChange("otherCharges", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-white">
                  <span>VAT Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(computedVatAmount)}
                  </span>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Total:</span>
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
                    <div className="flex justify-between items-center p-3 bg-teal-900/20 rounded-md border border-teal-500/30">
                      <span className="font-medium text-white">
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
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              📋 Terms & Conditions
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
        </Card>
      </div>
    </div>
  );
};

export default InvoiceForm;
