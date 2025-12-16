import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Ship,
  FileText,
  Package,
  Upload,
  Calculator,
  Building2,
  Globe,
  Info,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { importOrderService } from "../services/importOrderService";
import { supplierService } from "../services/supplierService";
import { productService } from "../services/productService";
import { notificationService } from "../services/notificationService";

// ============================================================
// CUSTOM UI COMPONENTS
// ============================================================

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  type = "button",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm hover:shadow-md`;
    } else if (variant === "secondary") {
      return `${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-gray-200 hover:bg-gray-300"
      } ${isDarkMode ? "text-white" : "text-gray-800"} disabled:opacity-50`;
    } else if (variant === "danger") {
      return `bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 disabled:opacity-50`;
    } else {
      return `border ${
        isDarkMode
          ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      } focus:ring-teal-500 disabled:opacity-50`;
    }
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
  };

  return (
    <button
      type={type}
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

const Input = ({
  label,
  error,
  className = "",
  required = false,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ""}`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}
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
  className = "",
  required = false,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ""}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full pl-2 pr-8 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 appearance-none ${
            isDarkMode
              ? "border-gray-600 bg-gray-800 text-white disabled:bg-gray-700 disabled:text-gray-500"
              : "border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
          } ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        />
      </div>
      {error && (
        <p
          className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Textarea = ({ label, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 resize-none ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white placeholder-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Card = ({ children, className = "", title, icon: Icon }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-sm ${
        isDarkMode
          ? "bg-gray-800 border border-gray-700"
          : "bg-white border border-gray-200"
      } ${className}`}
    >
      {title && (
        <div
          className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={`h-4 w-4 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
              />
            )}
            <h3
              className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {title}
            </h3>
          </div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const { isDarkMode: _isDarkMode } = useTheme();

  const statusConfig = {
    draft: { bg: "bg-gray-500", text: "Draft" },
    confirmed: { bg: "bg-blue-500", text: "Confirmed" },
    shipped: { bg: "bg-yellow-500", text: "Shipped" },
    in_transit: { bg: "bg-orange-500", text: "In Transit" },
    arrived: { bg: "bg-purple-500", text: "Arrived" },
    customs_clearance: { bg: "bg-indigo-500", text: "Customs Clearance" },
    customs: { bg: "bg-indigo-500", text: "Customs" },
    completed: { bg: "bg-green-500", text: "Completed" },
    cancelled: { bg: "bg-red-500", text: "Cancelled" },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.bg}`}
    >
      {config.text}
    </span>
  );
};

// ============================================================
// CONSTANTS
// ============================================================

// UAE TRN Validation (Federal Decree-Law No. 8 of 2017, Article 65)
// Format: 15 digits exactly (displayed as XXX-XXXX-XXXX-XXXX)
const validateTRN = (trn) => {
  if (!trn)
    return { valid: false, message: "TRN is required for import orders" };
  const cleanTRN = String(trn).replace(/[\s-]/g, "");
  if (!/^\d+$/.test(cleanTRN))
    return { valid: false, message: "TRN must contain only digits" };
  if (cleanTRN.length !== 15)
    return {
      valid: false,
      message: `TRN must be exactly 15 digits (${cleanTRN.length}/15)`,
    };
  return { valid: true, message: "Valid TRN" };
};

// Emirate mapping from destination port (for Form 201 VAT Return)
const EMIRATE_PORT_MAP = {
  AEJEA: { code: "DXB", name: "Dubai", port: "Jebel Ali" },
  AESHJ: { code: "SHJ", name: "Sharjah", port: "Sharjah" },
  AEAUH: { code: "AUH", name: "Abu Dhabi", port: "Abu Dhabi" },
  AEKLF: { code: "FUJ", name: "Fujairah", port: "Khor Fakkan" },
};

// Get emirate from destination port
const getEmirateFromPort = (portCode) => {
  return (
    EMIRATE_PORT_MAP[portCode] || {
      code: "DXB",
      name: "Dubai",
      port: "Unknown",
    }
  );
};

const INCOTERMS_OPTIONS = [
  { value: "EXW", label: "EXW - Ex Works" },
  { value: "FOB", label: "FOB - Free On Board" },
  { value: "CFR", label: "CFR - Cost & Freight" },
  { value: "CIF", label: "CIF - Cost, Insurance & Freight" },
  { value: "DAP", label: "DAP - Delivered At Place" },
  { value: "DDP", label: "DDP - Delivered Duty Paid" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "tt_advance", label: "TT Advance" },
  { value: "tt_30_days", label: "TT 30 Days" },
  { value: "tt_60_days", label: "TT 60 Days" },
  { value: "lc_at_sight", label: "LC at Sight" },
  { value: "lc_30_days", label: "LC 30 Days" },
  { value: "lc_60_days", label: "LC 60 Days" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_transit", label: "In Transit" },
  { value: "customs", label: "Customs Clearance" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: "sea", label: "Sea Freight" },
  { value: "air", label: "Air Freight" },
  { value: "land", label: "Land Transport" },
  { value: "multimodal", label: "Multimodal" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "AED", label: "AED - UAE Dirham", symbol: "د.إ" },
  { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
  { value: "INR", label: "INR - Indian Rupee", symbol: "₹" },
  { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
];

const UNIT_OPTIONS = [
  { value: "MT", label: "MT (Metric Ton)" },
  { value: "KG", label: "KG (Kilogram)" },
  { value: "PCS", label: "PCS (Pieces)" },
  { value: "LM", label: "LM (Linear Meter)" },
  { value: "SQM", label: "SQM (Square Meter)" },
];

// UAE Designated Zones (FTA-approved free zones where goods can enter without VAT)
const UAE_DESIGNATED_ZONES = [
  {
    code: "JAFZA",
    name: "Jebel Ali Free Zone",
    emirate: "Dubai",
    port: "AEJEA",
  },
  {
    code: "DAFZA",
    name: "Dubai Airport Free Zone",
    emirate: "Dubai",
    port: "AEDXB",
  },
  {
    code: "SAIF",
    name: "Sharjah Airport Int'l Free Zone",
    emirate: "Sharjah",
    port: "AESHJ",
  },
  {
    code: "KIZAD",
    name: "Khalifa Industrial Zone",
    emirate: "Abu Dhabi",
    port: "AEAUH",
  },
  { code: "AFZA", name: "Ajman Free Zone", emirate: "Ajman", port: "AEAJM" },
  {
    code: "RAK_FTZ",
    name: "RAK Free Trade Zone",
    emirate: "Ras Al Khaimah",
    port: "AERAK",
  },
  {
    code: "HFZA",
    name: "Hamriyah Free Zone",
    emirate: "Sharjah",
    port: "AESHJ",
  },
];

// Movement types for VAT treatment (UAE VAT Law Article 51)
const MOVEMENT_TYPES = [
  {
    value: "mainland",
    label: "Direct to Mainland (5% VAT)",
    vat_treatment: "standard",
  },
  {
    value: "dz_entry",
    label: "Entry to Designated Zone (0% VAT)",
    vat_treatment: "zero_rated",
  },
  {
    value: "dz_to_mainland",
    label: "DZ to Mainland (5% VAT on exit)",
    vat_treatment: "deferred",
  },
  {
    value: "dz_to_dz",
    label: "DZ to DZ Transfer (0% VAT)",
    vat_treatment: "zero_rated",
  },
];

// Supplier VAT Status options
const SUPPLIER_VAT_STATUS_OPTIONS = [
  { value: "non_resident", label: "Non-Resident (Outside UAE)" },
  { value: "uae_registered", label: "UAE VAT Registered" },
  { value: "gcc_registered", label: "GCC VAT Registered" },
  { value: "non_vat_registered", label: "UAE Non-VAT Registered" },
];

// Exchange Rate Source options (for audit trail)
const EXCHANGE_RATE_SOURCE_OPTIONS = [
  { value: "uae_central_bank", label: "UAE Central Bank" },
  { value: "commercial_bank", label: "Commercial Bank Rate" },
  { value: "manual", label: "Manual Entry" },
];

const COMMON_PORTS = [
  // UAE Ports (with designated zone indicator)
  {
    value: "AEJEA",
    label: "Jebel Ali, UAE",
    country: "UAE",
    has_designated_zone: true,
    zone_code: "JAFZA",
  },
  {
    value: "AESHJ",
    label: "Sharjah, UAE",
    country: "UAE",
    has_designated_zone: true,
    zone_code: "SAIF",
  },
  {
    value: "AEAUH",
    label: "Abu Dhabi, UAE",
    country: "UAE",
    has_designated_zone: true,
    zone_code: "KIZAD",
  },
  {
    value: "AEKLF",
    label: "Khor Fakkan, UAE",
    country: "UAE",
    has_designated_zone: false,
    zone_code: null,
  },
  // China Ports
  { value: "CNSHA", label: "Shanghai, China", country: "China" },
  { value: "CNNGB", label: "Ningbo, China", country: "China" },
  { value: "CNTAO", label: "Qingdao, China", country: "China" },
  { value: "CNSZX", label: "Shenzhen, China", country: "China" },
  { value: "CNTXG", label: "Tianjin, China", country: "China" },
  // India Ports
  { value: "INNSA", label: "Nhava Sheva (JNPT), India", country: "India" },
  { value: "INMUN", label: "Mundra, India", country: "India" },
  { value: "INCHE", label: "Chennai, India", country: "India" },
  // Other Asian Ports
  { value: "KRPUS", label: "Busan, South Korea", country: "South Korea" },
  { value: "JPYOK", label: "Yokohama, Japan", country: "Japan" },
  { value: "SGSIN", label: "Singapore", country: "Singapore" },
  // European Ports
  { value: "NLRTM", label: "Rotterdam, Netherlands", country: "Netherlands" },
  { value: "DEHAM", label: "Hamburg, Germany", country: "Germany" },
  { value: "BEANR", label: "Antwerp, Belgium", country: "Belgium" },
];

// ============================================================
// INITIAL STATE
// ============================================================

const createEmptyLineItem = () => ({
  id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  product_id: "",
  product_name: "",
  description: "",
  grade: "",
  finish: "",
  thickness: "",
  width: "",
  length: "",
  outer_diameter: "",
  quantity: 0,
  unit: "MT",
  unit_price: 0,
  total_price: 0,
  hs_code: "",
  mill_name: "",
  heat_number: "",
  country_of_origin: "",
});

const createEmptyOrder = () => ({
  // Header
  order_number: "",
  status: "draft",
  order_date: new Date().toISOString().split("T")[0],
  importer_trn: "",
  emirate: "Dubai", // Auto-derived from destination port for Form 201

  // Supplier & Trade Terms
  supplier_id: "",
  supplier_name: "",
  supplier_trn: "", // Supplier TRN (if UAE/GCC registered)
  supplier_vat_status: "non_resident", // non_resident, uae_registered, gcc_registered, non_vat_registered
  pi_number: "",
  po_number: "",
  incoterm: "CIF",
  payment_terms: "lc_at_sight",
  lc_number: "",

  // Shipping Details
  origin_port: "",
  destination_port: "AEJEA",
  shipping_method: "sea",
  vessel_name: "",
  bl_number: "",
  container_numbers: "",
  etd: "",
  eta: "",

  // UAE Designated Zone Fields (VAT Law Article 51)
  designated_zone_entry: false, // Is goods entering a designated zone?
  designated_zone_name: "", // JAFZA, DAFZA, SAIF, etc.
  movement_type: "mainland", // mainland, dz_entry, dz_to_mainland, dz_to_dz

  // Line Items
  items: [createEmptyLineItem()],

  // Cost Breakdown
  currency: "USD",
  exchange_rate: 3.6725,
  exchange_rate_source: "uae_central_bank", // For FTA audit trail
  exchange_rate_date: new Date().toISOString().split("T")[0], // Date of rate
  exchange_rate_reference: "", // Central Bank bulletin number
  subtotal: 0,
  freight_cost: 0,
  insurance_cost: 0,
  cif_value: 0,
  customs_duty_rate: 5,
  customs_duty: 0,
  vat_rate: 5,
  vat_amount: 0,
  other_charges: 0,
  grand_total: 0,

  // Form 201 VAT Return Fields (FTA Compliance)
  reverse_charge_output: 0, // Box 9 - Supplies subject to reverse charge (output)
  reverse_charge_input: 0, // Box 15 - Supplies subject to reverse charge (input/recoverable)
  goods_imported_value: 0, // Box 12 - Value of goods imported
  import_adjustments: 0, // Box 13 - Adjustments to goods imported
  import_declaration_number: "", // BOE number for VAT return reference
  customs_assessment_date: "", // Tax point determination
  vat_return_period: "", // YYYY-MM format for VAT return filing

  // Notes & Documents
  notes: "",
  internal_notes: "",
});

// ============================================================
// MAIN COMPONENT
// ============================================================

const ImportOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const _location = useLocation();
  const { isDarkMode } = useTheme();

  const isEditMode = Boolean(id);

  // Form State
  const [order, setOrder] = useState(createEmptyOrder);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Reference Data
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [_loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [_loadingProducts, setLoadingProducts] = useState(false);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await supplierService.getSuppliers();
        setSuppliers(response.suppliers || []);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        notificationService.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productService.getProducts({ limit: 1000 });
        setProducts(response.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        notificationService.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch existing order for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const response = await importOrderService.getImportOrder(id);
          const orderData = response.importOrder || response;

          // Ensure items array exists
          if (!orderData.items || orderData.items.length === 0) {
            orderData.items = [createEmptyLineItem()];
          }

          setOrder(orderData);
        } catch (error) {
          console.error("Failed to fetch order:", error);
          notificationService.error("Failed to load import order");
          navigate("/import-export");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, isEditMode, navigate]);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  // Calculate line item total
  const calculateItemTotal = useCallback((item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    return quantity * unitPrice;
  }, []);

  // Calculate all totals including Form 201 VAT Return fields
  const calculations = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item);
    }, 0);

    const freight = parseFloat(order.freight_cost) || 0;
    const insurance = parseFloat(order.insurance_cost) || 0;
    const exchangeRate = parseFloat(order.exchange_rate) || 1;
    const customsDutyRate = parseFloat(order.customs_duty_rate) || 5;
    const vatRate = parseFloat(order.vat_rate) || 5;
    const otherCharges = parseFloat(order.other_charges) || 0;

    // CIF Value = (Subtotal + Freight + Insurance) * Exchange Rate
    const cifValue = (subtotal + freight + insurance) * exchangeRate;

    // Customs Duty = CIF Value * Duty Rate
    const customsDuty = cifValue * (customsDutyRate / 100);

    // Determine effective VAT rate based on movement type (UAE VAT Law Article 51)
    const movementType = order.movement_type || "mainland";
    const isDesignatedZone =
      movementType === "dz_entry" || movementType === "dz_to_dz";
    const effectiveVatRate = isDesignatedZone ? 0 : vatRate;

    // VAT = (CIF Value + Customs Duty) * Effective VAT Rate
    const vatAmount = (cifValue + customsDuty) * (effectiveVatRate / 100);

    // Form 201 Box Calculations
    // Box 9: Reverse charge output (VAT on imports - standard rated)
    const reverseChargeOutput = !isDesignatedZone ? vatAmount : 0;
    // Box 15: Reverse charge input (recoverable VAT for VAT-registered importers)
    const reverseChargeInput = !isDesignatedZone ? vatAmount : 0;
    // Box 12: Goods imported value (CIF + Duty)
    const goodsImportedValue = cifValue + customsDuty;

    // Grand Total = CIF Value + Customs Duty + Other Charges (VAT is usually recoverable for registered)
    const grandTotal = cifValue + customsDuty + otherCharges;

    return {
      subtotal,
      cifValue,
      customsDuty,
      vatAmount,
      effectiveVatRate,
      isDesignatedZone,
      reverseChargeOutput,
      reverseChargeInput,
      goodsImportedValue,
      grandTotal,
    };
  }, [
    order.items,
    order.freight_cost,
    order.insurance_cost,
    order.exchange_rate,
    order.customs_duty_rate,
    order.vat_rate,
    order.other_charges,
    order.movement_type,
    calculateItemTotal,
  ]);

  // Update order with calculated values including Form 201 fields
  useEffect(() => {
    setOrder((prev) => ({
      ...prev,
      subtotal: calculations.subtotal,
      cif_value: calculations.cifValue,
      customs_duty: calculations.customsDuty,
      vat_amount: calculations.vatAmount,
      grand_total: calculations.grandTotal,
      // Form 201 VAT Return Fields
      reverse_charge_output: calculations.reverseChargeOutput,
      reverse_charge_input: calculations.reverseChargeInput,
      goods_imported_value: calculations.goodsImportedValue,
    }));
  }, [calculations]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFieldChange = useCallback(
    (field, value) => {
      setOrder((prev) => {
        const updated = { ...prev, [field]: value };
        // Auto-update emirate when destination port changes (for Form 201 VAT Return)
        if (field === "destination_port") {
          const emirateInfo = getEmirateFromPort(value);
          updated.emirate = emirateInfo.name;
          // Check if port has designated zone
          const portInfo = COMMON_PORTS.find((p) => p.value === value);
          if (portInfo?.has_designated_zone) {
            // Suggest designated zone but don&apos;t auto-enable
            updated.designated_zone_name = portInfo.zone_code || "";
          }
        }
        // Auto-update designated zone fields when movement type changes
        if (field === "movement_type") {
          const isDesignatedZoneEntry =
            value === "dz_entry" || value === "dz_to_dz";
          updated.designated_zone_entry = isDesignatedZoneEntry;
          // Clear designated zone name if not entering designated zone
          if (!isDesignatedZoneEntry && value === "mainland") {
            updated.designated_zone_name = "";
          }
        }
        // Auto-update supplier TRN requirement when supplier VAT status changes
        if (field === "supplier_vat_status") {
          // Clear TRN if non-resident (TRN not applicable)
          if (value === "non_resident") {
            updated.supplier_trn = "";
          }
        }
        return updated;
      });
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  const handleSupplierChange = useCallback(
    (supplierId) => {
      const supplier = suppliers.find(
        (s) => s.id === supplierId || s.id === parseInt(supplierId),
      );
      setOrder((prev) => ({
        ...prev,
        supplier_id: supplierId,
        supplier_name: supplier?.name || supplier?.company_name || "",
        // Auto-populate supplier TRN if available
        supplier_trn: supplier?.trn_number || supplier?.vat_number || "",
        // Determine supplier VAT status based on country
        supplier_vat_status:
          supplier?.country === "UAE"
            ? supplier?.trn_number
              ? "uae_registered"
              : "non_vat_registered"
            : supplier?.country &&
                ["Saudi Arabia", "Bahrain", "Oman", "Kuwait", "Qatar"].includes(
                  supplier.country,
                )
              ? "gcc_registered"
              : "non_resident",
      }));
    },
    [suppliers],
  );

  // Line Item Handlers
  const handleItemChange = useCallback((index, field, value) => {
    setOrder((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate total price
      if (field === "quantity" || field === "unit_price") {
        const qty =
          field === "quantity"
            ? parseFloat(value) || 0
            : parseFloat(newItems[index].quantity) || 0;
        const price =
          field === "unit_price"
            ? parseFloat(value) || 0
            : parseFloat(newItems[index].unit_price) || 0;
        newItems[index].total_price = qty * price;
      }

      return { ...prev, items: newItems };
    });
  }, []);

  const handleProductSelect = useCallback(
    (index, productId) => {
      const product = products.find(
        (p) => p.id === productId || p.id === parseInt(productId),
      );
      if (product) {
        setOrder((prev) => {
          const newItems = [...prev.items];
          newItems[index] = {
            ...newItems[index],
            product_id: productId,
            product_name:
              product.displayName ||
              product.display_name ||
              product.uniqueName ||
              product.unique_name ||
              "",
            description: product.description || "",
            grade: product.grade || "",
            finish: product.finish || "",
            hs_code: product.hs_code || "",
          };
          return { ...prev, items: newItems };
        });
      }
    },
    [products],
  );

  const addLineItem = useCallback(() => {
    setOrder((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyLineItem()],
    }));
  }, []);

  const removeLineItem = useCallback((index) => {
    setOrder((prev) => {
      if (prev.items.length <= 1) {
        notificationService.warning("At least one line item is required");
        return prev;
      }
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  }, []);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required fields validation
    if (!order.supplier_id) {
      newErrors.supplier_id = "Supplier is required";
    }

    if (!order.incoterm) {
      newErrors.incoterm = "Incoterm is required";
    }

    if (!order.payment_terms) {
      newErrors.payment_terms = "Payment terms are required";
    }

    if (!order.destination_port) {
      newErrors.destination_port = "Destination port is required";
    }

    // Validate line items
    const hasValidItem = order.items.some(
      (item) =>
        item.product_name &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unit_price) > 0,
    );

    if (!hasValidItem) {
      newErrors.items = "At least one complete line item is required";
    }

    // Validate exchange rate
    if (!order.exchange_rate || parseFloat(order.exchange_rate) <= 0) {
      newErrors.exchange_rate = "Valid exchange rate is required";
    }

    // Validate exchange rate source (FTA audit trail requirement)
    if (!order.exchange_rate_source) {
      newErrors.exchange_rate_source =
        "Exchange rate source required for FTA compliance";
    }

    // UAE VAT Compliance Validations (stricter for non-draft orders)
    if (order.status !== "draft") {
      // Importer TRN validation
      const trnValidation = validateTRN(order.importer_trn);
      if (!trnValidation.valid) {
        newErrors.importer_trn = trnValidation.message;
      }

      // Supplier TRN validation (required for UAE/GCC registered suppliers)
      if (
        order.supplier_vat_status === "uae_registered" ||
        order.supplier_vat_status === "gcc_registered"
      ) {
        if (!order.supplier_trn) {
          newErrors.supplier_trn = `TRN required for ${order.supplier_vat_status === "uae_registered" ? "UAE" : "GCC"} registered supplier`;
        } else if (order.supplier_vat_status === "uae_registered") {
          // Validate UAE TRN format for UAE registered suppliers
          const supplierTrnValidation = validateTRN(order.supplier_trn);
          if (!supplierTrnValidation.valid) {
            newErrors.supplier_trn = supplierTrnValidation.message;
          }
        }
      }

      // Movement type validation (required for VAT treatment)
      if (!order.movement_type) {
        newErrors.movement_type =
          "Movement type required for VAT treatment determination";
      }

      // Designated zone name required if entering designated zone
      if (
        (order.movement_type === "dz_entry" ||
          order.movement_type === "dz_to_dz") &&
        !order.designated_zone_name
      ) {
        newErrors.designated_zone_name =
          "Designated zone name required for zero-rated VAT treatment";
      }

      // Tax point validation: Customs assessment date required for completed/customs status
      if (
        (order.status === "completed" || order.status === "customs") &&
        !order.customs_assessment_date
      ) {
        newErrors.customs_assessment_date =
          "Customs assessment date required for VAT tax point determination (UAE VAT Law Article 25)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [order]);

  // ============================================================
  // SUBMIT HANDLERS
  // ============================================================

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      if (!validateForm()) {
        notificationService.error("Please fix the validation errors");
        return;
      }

      setIsSubmitting(true);

      try {
        // Prepare data for submission
        const submitData = {
          ...order,
          // Ensure numeric fields are numbers
          exchange_rate: parseFloat(order.exchange_rate) || 1,
          freight_cost: parseFloat(order.freight_cost) || 0,
          insurance_cost: parseFloat(order.insurance_cost) || 0,
          customs_duty_rate: parseFloat(order.customs_duty_rate) || 5,
          vat_rate: parseFloat(order.vat_rate) || 5,
          other_charges: parseFloat(order.other_charges) || 0,
          subtotal: calculations.subtotal,
          cif_value: calculations.cifValue,
          customs_duty: calculations.customsDuty,
          vat_amount: calculations.vatAmount,
          grand_total: calculations.grandTotal,
          // Clean up items
          items: order.items
            .map((item) => ({
              ...item,
              quantity: parseFloat(item.quantity) || 0,
              unit_price: parseFloat(item.unit_price) || 0,
              total_price: calculateItemTotal(item),
            }))
            .filter((item) => item.product_name && item.quantity > 0),
        };

        let _response;
        if (isEditMode) {
          _response = await importOrderService.updateImportOrder(
            id,
            submitData,
          );
          notificationService.success("Import order updated successfully");
        } else {
          _response = await importOrderService.createImportOrder(submitData);
          notificationService.success("Import order created successfully");
        }

        // Navigate to import/export dashboard
        navigate("/import-export");
      } catch (error) {
        console.error("Failed to save import order:", error);
        notificationService.error(
          error.message || "Failed to save import order",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      order,
      calculations,
      validateForm,
      isEditMode,
      id,
      navigate,
      calculateItemTotal,
    ],
  );

  const handleSaveDraft = useCallback(async () => {
    setOrder((prev) => ({ ...prev, status: "draft" }));
    await handleSubmit();
  }, [handleSubmit]);

  // ============================================================
  // CURRENCY FORMATTING
  // ============================================================

  const formatCurrency = useCallback(
    (amount, currency = order.currency) => {
      const currencyConfig = CURRENCY_OPTIONS.find((c) => c.value === currency);
      const symbol = currencyConfig?.symbol || "$";
      return `${symbol}${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [order.currency],
  );

  const formatAED = useCallback((amount) => {
    return `AED ${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  // ============================================================
  // RENDER LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className={isDarkMode ? "text-white" : "text-gray-900"}>
            Loading import order...
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER FORM
  // ============================================================

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/import-export")}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {isEditMode ? "Edit Import Order" : "Create Import Order"}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {order.order_number && (
                    <span
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      #{order.order_number}
                    </span>
                  )}
                  <StatusBadge status={order.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/import-export")}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? "Update Order" : "Create Order"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Order Header Section */}
        <Card title="Order Information" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Order Number"
              value={order.order_number || "(Auto-assigned on save)"}
              disabled
              placeholder="Auto-generated"
            />
            <Input
              label="Order Date"
              type="date"
              value={order.order_date}
              onChange={(e) => handleFieldChange("order_date", e.target.value)}
              required
            />
            <Select
              label="Status"
              value={order.status}
              onChange={(e) => handleFieldChange("status", e.target.value)}
              required
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Input
              label="PI Number"
              value={order.pi_number}
              onChange={(e) => handleFieldChange("pi_number", e.target.value)}
              placeholder="Proforma Invoice #"
            />
            <div>
              <Input
                label="Importer TRN"
                value={order.importer_trn}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 15);
                  handleFieldChange("importer_trn", value);
                }}
                placeholder="100XXXXXXXXX5 (15 digits)"
                error={errors.importer_trn}
                helperText={
                  order.status !== "draft"
                    ? "Required for confirmed orders"
                    : "Tax Registration Number for VAT-registered importers"
                }
              />
              {order.importer_trn && order.importer_trn.length > 0 && (
                <div
                  className={`text-xs mt-1 ${validateTRN(order.importer_trn).valid ? "text-green-500" : "text-amber-500"}`}
                >
                  {validateTRN(order.importer_trn).message}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Supplier & Trade Terms Section */}
        <Card title="Supplier & Trade Terms" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Supplier"
              value={order.supplier_id}
              onChange={(e) => handleSupplierChange(e.target.value)}
              error={errors.supplier_id}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name || supplier.company_name}
                </option>
              ))}
            </Select>
            <Select
              label="Supplier VAT Status"
              value={order.supplier_vat_status}
              onChange={(e) =>
                handleFieldChange("supplier_vat_status", e.target.value)
              }
            >
              {SUPPLIER_VAT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {(order.supplier_vat_status === "uae_registered" ||
              order.supplier_vat_status === "gcc_registered") && (
              <div>
                <Input
                  label="Supplier TRN"
                  value={order.supplier_trn}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 15);
                    handleFieldChange("supplier_trn", value);
                  }}
                  placeholder={
                    order.supplier_vat_status === "uae_registered"
                      ? "100XXXXXXXXXX (15 digits)"
                      : "GCC Tax Registration Number"
                  }
                  error={errors.supplier_trn}
                  required={order.status !== "draft"}
                />
                {order.supplier_trn &&
                  order.supplier_vat_status === "uae_registered" && (
                    <div
                      className={`text-xs mt-1 ${validateTRN(order.supplier_trn).valid ? "text-green-500" : "text-amber-500"}`}
                    >
                      {validateTRN(order.supplier_trn).message}
                    </div>
                  )}
              </div>
            )}
            <Input
              label="PO Number"
              value={order.po_number}
              onChange={(e) => handleFieldChange("po_number", e.target.value)}
              placeholder="Purchase Order #"
            />
            <Select
              label="Incoterm"
              value={order.incoterm}
              onChange={(e) => handleFieldChange("incoterm", e.target.value)}
              error={errors.incoterm}
              required
            >
              {INCOTERMS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              label="Payment Terms"
              value={order.payment_terms}
              onChange={(e) =>
                handleFieldChange("payment_terms", e.target.value)
              }
              error={errors.payment_terms}
              required
            >
              {PAYMENT_TERMS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Input
              label="LC Number"
              value={order.lc_number}
              onChange={(e) => handleFieldChange("lc_number", e.target.value)}
              placeholder="Letter of Credit #"
            />
          </div>
        </Card>

        {/* Shipping Details Section */}
        <Card title="Shipping Details" icon={Ship}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Origin Port"
              value={order.origin_port}
              onChange={(e) => handleFieldChange("origin_port", e.target.value)}
            >
              <option value="">Select Origin Port</option>
              {COMMON_PORTS.map((port) => (
                <option key={port.value} value={port.value}>
                  {port.label}
                </option>
              ))}
            </Select>
            <Select
              label="Destination Port"
              value={order.destination_port}
              onChange={(e) =>
                handleFieldChange("destination_port", e.target.value)
              }
              error={errors.destination_port}
              required
            >
              <option value="">Select Destination Port</option>
              {COMMON_PORTS.filter((p) => p.country === "UAE").map((port) => (
                <option key={port.value} value={port.value}>
                  {port.label}
                </option>
              ))}
            </Select>
            <div>
              <Input
                label="Emirate (Form 201)"
                value={
                  order.emirate ||
                  getEmirateFromPort(order.destination_port).name
                }
                disabled
              />
              <span
                className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Auto-derived for VAT return Box 1-7
              </span>
            </div>
            <Select
              label="Shipping Method"
              value={order.shipping_method}
              onChange={(e) =>
                handleFieldChange("shipping_method", e.target.value)
              }
            >
              {SHIPPING_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Input
              label="Vessel Name"
              value={order.vessel_name}
              onChange={(e) => handleFieldChange("vessel_name", e.target.value)}
              placeholder="Ship/Aircraft name"
            />
            <Input
              label="B/L Number"
              value={order.bl_number}
              onChange={(e) => handleFieldChange("bl_number", e.target.value)}
              placeholder="Bill of Lading #"
            />
            <Input
              label="Container Numbers"
              value={order.container_numbers}
              onChange={(e) =>
                handleFieldChange("container_numbers", e.target.value)
              }
              placeholder="CONT123, CONT456"
            />
            <Input
              label="ETD (Estimated Departure)"
              type="date"
              value={order.etd}
              onChange={(e) => handleFieldChange("etd", e.target.value)}
            />
            <Input
              label="ETA (Estimated Arrival)"
              type="date"
              value={order.eta}
              onChange={(e) => handleFieldChange("eta", e.target.value)}
            />
          </div>

          {/* UAE Designated Zone & VAT Treatment Section */}
          <div
            className={`mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <h4
              className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              <Globe className="h-4 w-4" />
              UAE VAT Treatment (Article 51)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Movement Type"
                value={order.movement_type}
                onChange={(e) =>
                  handleFieldChange("movement_type", e.target.value)
                }
                error={errors.movement_type}
                required={order.status !== "draft"}
              >
                {MOVEMENT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {(order.movement_type === "dz_entry" ||
                order.movement_type === "dz_to_dz" ||
                order.movement_type === "dz_to_mainland") && (
                <Select
                  label="Designated Zone"
                  value={order.designated_zone_name}
                  onChange={(e) =>
                    handleFieldChange("designated_zone_name", e.target.value)
                  }
                  error={errors.designated_zone_name}
                  required={order.movement_type !== "mainland"}
                >
                  <option value="">Select Zone</option>
                  {UAE_DESIGNATED_ZONES.map((zone) => (
                    <option key={zone.code} value={zone.code}>
                      {zone.name} ({zone.emirate})
                    </option>
                  ))}
                </Select>
              )}
              <Input
                label="Customs Assessment Date"
                type="date"
                value={order.customs_assessment_date}
                onChange={(e) =>
                  handleFieldChange("customs_assessment_date", e.target.value)
                }
                error={errors.customs_assessment_date}
                required={
                  order.status === "customs" || order.status === "completed"
                }
              />
              <Input
                label="BOE Number"
                value={order.import_declaration_number}
                onChange={(e) =>
                  handleFieldChange("import_declaration_number", e.target.value)
                }
                placeholder="Bill of Entry #"
              />
            </div>
            {/* VAT Treatment Alert */}
            {calculations.isDesignatedZone && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs ${isDarkMode ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200"}`}
              >
                <div className="flex items-start gap-2">
                  <Info
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? "text-green-400" : "text-green-600"}`}
                  />
                  <div>
                    <p
                      className={`font-semibold mb-1 ${isDarkMode ? "text-green-300" : "text-green-800"}`}
                    >
                      Zero-Rated VAT Treatment Applied
                    </p>
                    <p
                      className={
                        isDarkMode ? "text-green-200" : "text-green-700"
                      }
                    >
                      Goods entering{" "}
                      {order.designated_zone_name || "Designated Zone"} qualify
                      for 0% VAT under UAE VAT Law Article 51. VAT will apply
                      when goods move from the designated zone to mainland UAE.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Line Items Section */}
        <Card title="Line Items" icon={Package}>
          {errors.items && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                isDarkMode
                  ? "bg-red-900/20 text-red-400"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{errors.items}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr
                  className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  <th className="text-left pb-2 pr-2 w-8">#</th>
                  <th className="text-left pb-2 pr-2 min-w-[180px]">Product</th>
                  <th className="text-left pb-2 pr-2 w-20">Grade</th>
                  <th className="text-left pb-2 pr-2 w-20">Finish</th>
                  <th className="text-left pb-2 pr-2 w-28">Dimensions</th>
                  <th className="text-right pb-2 pr-2 w-20">Qty</th>
                  <th className="text-left pb-2 pr-2 w-16">Unit</th>
                  <th className="text-right pb-2 pr-2 w-24">Unit Price</th>
                  <th className="text-left pb-2 pr-2 w-24">HS Code</th>
                  <th className="text-left pb-2 pr-2 w-24">Mill</th>
                  <th className="text-left pb-2 pr-2 w-24">Heat #</th>
                  <th className="text-right pb-2 pr-2 w-28">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}
              >
                {order.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                  >
                    <td className="py-2 pr-2">
                      <span
                        className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="space-y-1">
                        <Select
                          value={item.product_id}
                          onChange={(e) =>
                            handleProductSelect(index, e.target.value)
                          }
                          className="text-xs"
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.displayName ||
                                product.display_name ||
                                product.uniqueName ||
                                product.unique_name ||
                                "N/A"}
                            </option>
                          ))}
                        </Select>
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "product_name",
                              e.target.value,
                            )
                          }
                          placeholder="Or enter name"
                          className={`w-full px-2 py-1 text-xs border rounded ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-800 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.grade}
                        onChange={(e) =>
                          handleItemChange(index, "grade", e.target.value)
                        }
                        placeholder="304, 316L"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.finish}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "finish",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder="2B, BA"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={item.thickness}
                          onChange={(e) =>
                            handleItemChange(index, "thickness", e.target.value)
                          }
                          placeholder="T"
                          title="Thickness"
                          className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-800 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                        />
                        <input
                          type="text"
                          value={item.width}
                          onChange={(e) =>
                            handleItemChange(index, "width", e.target.value)
                          }
                          placeholder="W"
                          title="Width"
                          className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-800 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                        />
                        <input
                          type="text"
                          value={item.length}
                          onChange={(e) =>
                            handleItemChange(index, "length", e.target.value)
                          }
                          placeholder="L"
                          title="Length"
                          className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-800 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        min="0"
                        step="0.001"
                        className={`w-full px-2 py-1 text-xs border rounded text-right ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                        className={`w-full px-1 py-1 text-xs border rounded ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      >
                        {UNIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(index, "unit_price", e.target.value)
                        }
                        min="0"
                        step="0.01"
                        className={`w-full px-2 py-1 text-xs border rounded text-right ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.hs_code}
                        onChange={(e) =>
                          handleItemChange(index, "hs_code", e.target.value)
                        }
                        placeholder="72XX.XX"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.mill_name}
                        onChange={(e) =>
                          handleItemChange(index, "mill_name", e.target.value)
                        }
                        placeholder="Mill name"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.heat_number}
                        onChange={(e) =>
                          handleItemChange(index, "heat_number", e.target.value)
                        }
                        placeholder="Heat #"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <span
                        className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {formatCurrency(calculateItemTotal(item))}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors ${
                          order.items.length <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={order.items.length <= 1}
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4" />
              Add Line Item
            </Button>
            <div
              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} |
              Subtotal:{" "}
              <span className="font-medium">
                {formatCurrency(calculations.subtotal)}
              </span>
            </div>
          </div>
        </Card>

        {/* Cost Breakdown Section */}
        <Card title="Cost Breakdown" icon={Calculator}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Input Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Currency"
                  value={order.currency}
                  onChange={(e) =>
                    handleFieldChange("currency", e.target.value)
                  }
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Exchange Rate to AED"
                  type="number"
                  value={order.exchange_rate}
                  onChange={(e) =>
                    handleFieldChange("exchange_rate", e.target.value)
                  }
                  min="0"
                  step="0.0001"
                  error={errors.exchange_rate}
                  required
                />
              </div>
              {/* Exchange Rate Source (FTA Audit Trail) */}
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Rate Source"
                  value={order.exchange_rate_source}
                  onChange={(e) =>
                    handleFieldChange("exchange_rate_source", e.target.value)
                  }
                  error={errors.exchange_rate_source}
                  required
                >
                  {EXCHANGE_RATE_SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Rate Date"
                  type="date"
                  value={order.exchange_rate_date}
                  onChange={(e) =>
                    handleFieldChange("exchange_rate_date", e.target.value)
                  }
                />
                <Input
                  label="Reference #"
                  value={order.exchange_rate_reference}
                  onChange={(e) =>
                    handleFieldChange("exchange_rate_reference", e.target.value)
                  }
                  placeholder="Central Bank bulletin #"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Freight Cost (${order.currency})`}
                  type="number"
                  value={order.freight_cost}
                  onChange={(e) =>
                    handleFieldChange("freight_cost", e.target.value)
                  }
                  min="0"
                  step="0.01"
                />
                <Input
                  label={`Insurance Cost (${order.currency})`}
                  type="number"
                  value={order.insurance_cost}
                  onChange={(e) =>
                    handleFieldChange("insurance_cost", e.target.value)
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Customs Duty Rate (%)"
                  type="number"
                  value={order.customs_duty_rate}
                  onChange={(e) =>
                    handleFieldChange("customs_duty_rate", e.target.value)
                  }
                  min="0"
                  max="100"
                  step="0.1"
                />
                <Input
                  label="VAT Rate (%)"
                  type="number"
                  value={order.vat_rate}
                  onChange={(e) =>
                    handleFieldChange("vat_rate", e.target.value)
                  }
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <Input
                label="Other Charges (AED)"
                type="number"
                value={order.other_charges}
                onChange={(e) =>
                  handleFieldChange("other_charges", e.target.value)
                }
                min="0"
                step="0.01"
                placeholder="Clearing, handling, etc."
              />
            </div>

            {/* Right Column - Calculation Summary */}
            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
            >
              <h4
                className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Cost Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Subtotal ({order.currency})
                  </span>
                  <span
                    className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {formatCurrency(calculations.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    + Freight
                  </span>
                  <span
                    className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {formatCurrency(parseFloat(order.freight_cost) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    + Insurance
                  </span>
                  <span
                    className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {formatCurrency(parseFloat(order.insurance_cost) || 0)}
                  </span>
                </div>
                <div
                  className={`border-t pt-3 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      CIF Value (AED)
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatAED(calculations.cifValue)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Customs Duty ({order.customs_duty_rate}%)
                  </span>
                  <span
                    className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {formatAED(calculations.customsDuty)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    VAT ({calculations.effectiveVatRate}%){" "}
                    {calculations.isDesignatedZone
                      ? "(Zero-Rated)"
                      : "- Reverse Charge"}
                  </span>
                  <span
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {calculations.isDesignatedZone
                      ? formatAED(0)
                      : `(${formatAED(calculations.vatAmount)})`}
                  </span>
                </div>
                {/* Form 201 VAT Return Box Mapping */}
                <div
                  className={`mt-3 p-3 rounded-lg text-xs ${isDarkMode ? "bg-indigo-900/30 border border-indigo-700" : "bg-indigo-50 border border-indigo-200"}`}
                >
                  <p
                    className={`font-semibold mb-2 ${isDarkMode ? "text-indigo-300" : "text-indigo-800"}`}
                  >
                    FTA Form 201 VAT Return Mapping
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? "text-indigo-200" : "text-indigo-700"
                        }
                      >
                        Box 12: Goods Imported
                      </span>
                      <span
                        className={`font-medium ${isDarkMode ? "text-indigo-100" : "text-indigo-900"}`}
                      >
                        {formatAED(calculations.goodsImportedValue)}
                      </span>
                    </div>
                    {!calculations.isDesignatedZone && (
                      <>
                        <div className="flex justify-between">
                          <span
                            className={
                              isDarkMode ? "text-indigo-200" : "text-indigo-700"
                            }
                          >
                            Box 9: Reverse Charge (Output)
                          </span>
                          <span
                            className={`font-medium ${isDarkMode ? "text-indigo-100" : "text-indigo-900"}`}
                          >
                            {formatAED(calculations.reverseChargeOutput)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              isDarkMode ? "text-indigo-200" : "text-indigo-700"
                            }
                          >
                            Box 15: Reverse Charge (Input)
                          </span>
                          <span
                            className={`font-medium ${isDarkMode ? "text-indigo-100" : "text-indigo-900"}`}
                          >
                            {formatAED(calculations.reverseChargeInput)}
                          </span>
                        </div>
                      </>
                    )}
                    {calculations.isDesignatedZone && (
                      <div
                        className={`text-xs ${isDarkMode ? "text-indigo-300" : "text-indigo-600"}`}
                      >
                        Zero-rated entry - No VAT boxes applicable until goods
                        move to mainland
                      </div>
                    )}
                  </div>
                </div>
                {/* UAE VAT Reverse Charge Explanation */}
                {!calculations.isDesignatedZone && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-xs ${isDarkMode ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}
                  >
                    <div className="flex items-start gap-2">
                      <Info
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                      />
                      <div>
                        <p
                          className={`font-semibold mb-1 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}
                        >
                          UAE VAT Treatment (Reverse Charge)
                        </p>
                        <ul
                          className={`space-y-1 ${isDarkMode ? "text-blue-200" : "text-blue-700"}`}
                        >
                          <li>
                            • <strong>VAT-Registered:</strong> No VAT payment at
                            customs. Declare in Form 201 Box 9 (Output) & Box 15
                            (Input).
                          </li>
                          <li>
                            • <strong>Non-Registered:</strong> Pay{" "}
                            {formatAED(calculations.vatAmount)} at customs
                            clearance.
                          </li>
                          <li>
                            • <strong>Net Effect:</strong> Zero VAT cash outflow
                            for registered businesses.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {parseFloat(order.other_charges) > 0 && (
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      + Other Charges
                    </span>
                    <span
                      className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatAED(parseFloat(order.other_charges) || 0)}
                    </span>
                  </div>
                )}
                <div
                  className={`border-t pt-3 mt-3 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      Grand Total (AED)
                    </span>
                    <span
                      className={`text-lg font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
                    >
                      {formatAED(calculations.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes Section */}
        <Card title="Notes & Documents" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Notes (visible on documents)"
              value={order.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows={4}
              placeholder="Enter any notes to appear on documents..."
            />
            <Textarea
              label="Internal Notes (not visible on documents)"
              value={order.internal_notes}
              onChange={(e) =>
                handleFieldChange("internal_notes", e.target.value)
              }
              rows={4}
              placeholder="Internal comments, reminders..."
            />
          </div>

          {/* Document Upload Section */}
          <div className="mt-6">
            <h4
              className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Attached Documents
            </h4>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDarkMode
                  ? "border-gray-600 hover:border-gray-500"
                  : "border-gray-300 hover:border-gray-400"
              } transition-colors cursor-pointer`}
            >
              <Upload
                className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              />
              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Drag and drop files here, or click to select
              </p>
              <p
                className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Supports: PDF, images, Excel files (max 10MB each)
              </p>
            </div>
          </div>
        </Card>

        {/* Bottom Action Bar */}
        <div
          className={`sticky bottom-0 py-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
        >
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate("/import-export")}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? "Update Order" : "Create Order"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportOrderForm;
