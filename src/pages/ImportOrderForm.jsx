import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Calculator as _Calculator,
  Building2,
  Globe,
  Info,
  DollarSign,
  StickyNote,
  Settings2 as _Settings2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { importOrderService } from '../services/importOrderService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { notificationService } from '../services/notificationService';
import { FormSelect } from '../components/ui/form-select';
import { SelectItem } from '../components/ui/select';
import { validateSsotPattern } from '../utils/productSsotValidation';

// ==================== DESIGN TOKENS ====================
// eslint-disable-next-line no-unused-vars
const COLORS = {
  bg: '#0b0f14',
  card: '#141a20',
  border: '#2a3640',
  text: '#e6edf3',
  muted: '#93a4b4',
  good: '#2ecc71',
  warn: '#f39c12',
  bad: '#e74c3c',
  accent: '#4aa3ff',
  accentHover: '#5bb2ff',
  inputBg: '#0f151b',
};

// Layout helper classes - eslint-disable-next-line for unused (referenced in JSX via template)
// eslint-disable-next-line no-unused-vars
const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? 'bg-[#141a20] border-[#2a3640]' : 'bg-white border-gray-200'} border rounded-2xl p-4`;

// eslint-disable-next-line no-unused-vars
const INPUT_CLASSES = (isDarkMode) =>
  `w-full ${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3]' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl py-2.5 px-3 text-[13px] outline-none focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20 transition-all`;

// eslint-disable-next-line no-unused-vars
const LABEL_CLASSES = (isDarkMode) =>
  `block text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'} mb-1.5`;

// eslint-disable-next-line no-unused-vars
const BTN_CLASSES = (isDarkMode) =>
  `${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]' : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'} border rounded-xl py-2.5 px-3 text-[13px] cursor-pointer transition-colors`;

// eslint-disable-next-line no-unused-vars
const BTN_PRIMARY =
  'bg-[#4aa3ff] border-transparent text-[#001018] font-extrabold hover:bg-[#5bb2ff] rounded-xl py-2.5 px-3 text-[13px] cursor-pointer';

// eslint-disable-next-line no-unused-vars
const BTN_SMALL = (isDarkMode) =>
  `${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]' : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'} border rounded-[10px] py-2 px-2.5 text-xs cursor-pointer transition-colors`;

const QUICK_LINK_CLASSES = (isDarkMode) =>
  `flex items-center gap-2 w-full py-2 px-2.5 ${isDarkMode ? 'bg-[#0f151b] border-[#2a3640] text-[#e6edf3]' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-[10px] cursor-pointer text-[13px] transition-colors hover:border-[#4aa3ff] hover:text-[#4aa3ff]`;

const DIVIDER_CLASSES = (isDarkMode) =>
  `h-px ${isDarkMode ? 'bg-[#2a3640]' : 'bg-gray-200'} my-3`;

// ============================================================
// CUSTOM UI COMPONENTS
// ============================================================

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm hover:shadow-md`;
    } else if (variant === 'secondary') {
      return `${
        isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-200 hover:bg-gray-300'
      } ${isDarkMode ? 'text-white' : 'text-gray-800'} disabled:opacity-50`;
    } else if (variant === 'danger') {
      return `bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 disabled:opacity-50`;
    } else {
      return `border ${
        isDarkMode
          ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
          : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
      } focus:ring-teal-500 disabled:opacity-50`;
    }
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type={type}
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
  ...props
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${error ? 'border-red-500' : ''} ${className}`}
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

const Textarea = ({ label, error, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 resize-none ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Card = ({ children, className = '', title, icon: Icon }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-sm ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      } ${className}`}
    >
      {title && (
        <div
          className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
              />
            )}
            <h3
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
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
    draft: { bg: 'bg-gray-500', text: 'Draft' },
    confirmed: { bg: 'bg-blue-500', text: 'Confirmed' },
    shipped: { bg: 'bg-yellow-500', text: 'Shipped' },
    in_transit: { bg: 'bg-orange-500', text: 'In Transit' },
    arrived: { bg: 'bg-purple-500', text: 'Arrived' },
    customs_clearance: { bg: 'bg-indigo-500', text: 'Customs Clearance' },
    customs: { bg: 'bg-indigo-500', text: 'Customs' },
    completed: { bg: 'bg-green-500', text: 'Completed' },
    cancelled: { bg: 'bg-red-500', text: 'Cancelled' },
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
    return { valid: false, message: 'TRN is required for import orders' };
  const cleanTRN = String(trn).replace(/[\s-]/g, '');
  if (!/^\d+$/.test(cleanTRN))
    return { valid: false, message: 'TRN must contain only digits' };
  if (cleanTRN.length !== 15)
    return {
      valid: false,
      message: `TRN must be exactly 15 digits (${cleanTRN.length}/15)`,
    };
  return { valid: true, message: 'Valid TRN' };
};

// Emirate mapping from destination port (for Form 201 VAT Return)
const EMIRATE_PORT_MAP = {
  AEJEA: { code: 'DXB', name: 'Dubai', port: 'Jebel Ali' },
  AESHJ: { code: 'SHJ', name: 'Sharjah', port: 'Sharjah' },
  AEAUH: { code: 'AUH', name: 'Abu Dhabi', port: 'Abu Dhabi' },
  AEKLF: { code: 'FUJ', name: 'Fujairah', port: 'Khor Fakkan' },
};

// Get emirate from destination port
const getEmirateFromPort = (portCode) => {
  return (
    EMIRATE_PORT_MAP[portCode] || {
      code: 'DXB',
      name: 'Dubai',
      port: 'Unknown',
    }
  );
};

const INCOTERMS_OPTIONS = [
  { value: 'EXW', label: 'EXW - Ex Works' },
  { value: 'FOB', label: 'FOB - Free On Board' },
  { value: 'CFR', label: 'CFR - Cost & Freight' },
  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
  { value: 'DAP', label: 'DAP - Delivered At Place' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'tt_advance', label: 'TT Advance' },
  { value: 'tt_30_days', label: 'TT 30 Days' },
  { value: 'tt_60_days', label: 'TT 60 Days' },
  { value: 'lc_at_sight', label: 'LC at Sight' },
  { value: 'lc_30_days', label: 'LC 30 Days' },
  { value: 'lc_60_days', label: 'LC 60 Days' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'customs', label: 'Customs Clearance' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: 'sea', label: 'Sea Freight' },
  { value: 'air', label: 'Air Freight' },
  { value: 'land', label: 'Land Transport' },
  { value: 'multimodal', label: 'Multimodal' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
];

const UNIT_OPTIONS = [
  { value: 'MT', label: 'MT (Metric Ton)' },
  { value: 'KG', label: 'KG (Kilogram)' },
  { value: 'PCS', label: 'PCS (Pieces)' },
  { value: 'LM', label: 'LM (Linear Meter)' },
  { value: 'SQM', label: 'SQM (Square Meter)' },
];

// UAE Designated Zones (FTA-approved free zones where goods can enter without VAT)
const UAE_DESIGNATED_ZONES = [
  {
    code: 'JAFZA',
    name: 'Jebel Ali Free Zone',
    emirate: 'Dubai',
    port: 'AEJEA',
  },
  {
    code: 'DAFZA',
    name: 'Dubai Airport Free Zone',
    emirate: 'Dubai',
    port: 'AEDXB',
  },
  {
    code: 'SAIF',
    name: "Sharjah Airport Int'l Free Zone",
    emirate: 'Sharjah',
    port: 'AESHJ',
  },
  {
    code: 'KIZAD',
    name: 'Khalifa Industrial Zone',
    emirate: 'Abu Dhabi',
    port: 'AEAUH',
  },
  { code: 'AFZA', name: 'Ajman Free Zone', emirate: 'Ajman', port: 'AEAJM' },
  {
    code: 'RAK_FTZ',
    name: 'RAK Free Trade Zone',
    emirate: 'Ras Al Khaimah',
    port: 'AERAK',
  },
  {
    code: 'HFZA',
    name: 'Hamriyah Free Zone',
    emirate: 'Sharjah',
    port: 'AESHJ',
  },
];

// Movement types for VAT treatment (UAE VAT Law Article 51)
const MOVEMENT_TYPES = [
  {
    value: 'mainland',
    label: 'Direct to Mainland (5% VAT)',
    vat_treatment: 'standard',
  },
  {
    value: 'dz_entry',
    label: 'Entry to Designated Zone (0% VAT)',
    vat_treatment: 'zero_rated',
  },
  {
    value: 'dz_to_mainland',
    label: 'DZ to Mainland (5% VAT on exit)',
    vat_treatment: 'deferred',
  },
  {
    value: 'dz_to_dz',
    label: 'DZ to DZ Transfer (0% VAT)',
    vat_treatment: 'zero_rated',
  },
];

// Supplier VAT Status options
const SUPPLIER_VAT_STATUS_OPTIONS = [
  { value: 'non_resident', label: 'Non-Resident (Outside UAE)' },
  { value: 'uae_registered', label: 'UAE VAT Registered' },
  { value: 'gcc_registered', label: 'GCC VAT Registered' },
  { value: 'non_vat_registered', label: 'UAE Non-VAT Registered' },
];

// Exchange Rate Source options (for audit trail)
const EXCHANGE_RATE_SOURCE_OPTIONS = [
  { value: 'uae_central_bank', label: 'UAE Central Bank' },
  { value: 'commercial_bank', label: 'Commercial Bank Rate' },
  { value: 'manual', label: 'Manual Entry' },
];

const COMMON_PORTS = [
  // UAE Ports (with designated zone indicator)
  {
    value: 'AEJEA',
    label: 'Jebel Ali, UAE',
    country: 'UAE',
    has_designated_zone: true,
    zone_code: 'JAFZA',
  },
  {
    value: 'AESHJ',
    label: 'Sharjah, UAE',
    country: 'UAE',
    has_designated_zone: true,
    zone_code: 'SAIF',
  },
  {
    value: 'AEAUH',
    label: 'Abu Dhabi, UAE',
    country: 'UAE',
    has_designated_zone: true,
    zone_code: 'KIZAD',
  },
  {
    value: 'AEKLF',
    label: 'Khor Fakkan, UAE',
    country: 'UAE',
    has_designated_zone: false,
    zone_code: null,
  },
  // China Ports
  { value: 'CNSHA', label: 'Shanghai, China', country: 'China' },
  { value: 'CNNGB', label: 'Ningbo, China', country: 'China' },
  { value: 'CNTAO', label: 'Qingdao, China', country: 'China' },
  { value: 'CNSZX', label: 'Shenzhen, China', country: 'China' },
  { value: 'CNTXG', label: 'Tianjin, China', country: 'China' },
  // India Ports
  { value: 'INNSA', label: 'Nhava Sheva (JNPT), India', country: 'India' },
  { value: 'INMUN', label: 'Mundra, India', country: 'India' },
  { value: 'INCHE', label: 'Chennai, India', country: 'India' },
  // Other Asian Ports
  { value: 'KRPUS', label: 'Busan, South Korea', country: 'South Korea' },
  { value: 'JPYOK', label: 'Yokohama, Japan', country: 'Japan' },
  { value: 'SGSIN', label: 'Singapore', country: 'Singapore' },
  // European Ports
  { value: 'NLRTM', label: 'Rotterdam, Netherlands', country: 'Netherlands' },
  { value: 'DEHAM', label: 'Hamburg, Germany', country: 'Germany' },
  { value: 'BEANR', label: 'Antwerp, Belgium', country: 'Belgium' },
];

// ============================================================
// INITIAL STATE
// ============================================================

const createEmptyLineItem = () => ({
  id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  product_id: '',
  unique_name: '', // SSOT product naming
  ssot_override: false, // Allow manager override for import products
  description: '',
  grade: '',
  finish: '',
  thickness: '',
  width: '',
  length: '',
  outer_diameter: '',
  quantity: 0,
  unit: 'MT',
  unit_price: 0,
  total_price: 0,
  hs_code: '',
  mill_name: '',
  heat_number: '',
  country_of_origin: '',
  // Landed Cost Fields (Epic 6 - IMPO-006)
  fob_value: 0, // FOB value for this line
  allocated_freight: 0, // Proportional freight cost
  allocated_insurance: 0, // Proportional insurance cost
  allocated_duty: 0, // Proportional customs duty
  other_allocated_charges: 0, // Proportional other charges
  landed_cost_total: 0, // Total landed cost for this line
  unit_landed_cost: 0, // Landed cost per unit
});

const createEmptyOrder = () => ({
  // Header
  order_number: '',
  status: 'draft',
  order_date: new Date().toISOString().split('T')[0],
  importer_trn: '',
  emirate: 'Dubai', // Auto-derived from destination port for Form 201

  // Supplier & Trade Terms
  supplier_id: '',
  supplier_name: '',
  supplier_trn: '', // Supplier TRN (if UAE/GCC registered)
  supplier_vat_status: 'non_resident', // non_resident, uae_registered, gcc_registered, non_vat_registered
  pi_number: '',
  po_number: '',
  incoterm: 'CIF',
  payment_terms: 'lc_at_sight',
  lc_number: '',

  // Shipping Details
  origin_port: '',
  destination_port: 'AEJEA',
  shipping_method: 'sea',
  vessel_name: '',
  bl_number: '',
  container_numbers: '',
  etd: '',
  eta: '',

  // UAE Designated Zone Fields (VAT Law Article 51)
  designated_zone_entry: false, // Is goods entering a designated zone?
  designated_zone_name: '', // JAFZA, DAFZA, SAIF, etc.
  movement_type: 'mainland', // mainland, dz_entry, dz_to_mainland, dz_to_dz

  // Line Items
  items: [createEmptyLineItem()],

  // GRN Fields (Epic 3 - IMPO-005)
  grnId: null,
  grnNumber: '',
  grnStatus: 'not_created', // not_created, draft, pending_approval, approved
  grnDate: '',
  auto_create_grn: true, // Auto-create GRN on save

  // Batch Creation Fields (Epic 6 - IMPO-008)
  auto_create_batch: true, // Auto-create batch on receipt
  supplier_batch_ref: '', // Supplier's batch reference
  mfg_date: '', // Manufacturing date
  shelf_life_days: 1825, // Default 5 years for steel

  // Cost Breakdown
  currency: 'USD',
  exchange_rate: 3.6725,
  exchange_rate_source: 'uae_central_bank', // For FTA audit trail
  exchange_rate_date: new Date().toISOString().split('T')[0], // Date of rate
  exchange_rate_reference: '', // Central Bank bulletin number
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
  import_declaration_number: '', // BOE number for VAT return reference
  customs_assessment_date: '', // Tax point determination
  vat_return_period: '', // YYYY-MM format for VAT return filing

  // Customs Clearance Documentation (Critical for BOE processing)
  boe_number: '', // Bill of Entry number (customs declaration)
  certificate_of_origin: '', // COO number/reference
  certificate_of_origin_date: '', // COO issue date

  // Notes & Documents
  notes: '',
  internal_notes: '',
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

  // Drawer States
  const [shippingDrawerOpen, setShippingDrawerOpen] = useState(false);
  const [costDrawerOpen, setCostDrawerOpen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);

  // Close drawers on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShippingDrawerOpen(false);
        setCostDrawerOpen(false);
        setNotesDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

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
        console.error('Failed to fetch suppliers:', error);
        notificationService.error('Failed to load suppliers');
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
        console.error('Failed to fetch products:', error);
        notificationService.error('Failed to load products');
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
          console.error('Failed to fetch order:', error);
          notificationService.error('Failed to load import order');
          navigate('/import-export');
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
    const movementType = order.movement_type || 'mainland';
    const isDesignatedZone =
      movementType === 'dz_entry' || movementType === 'dz_to_dz';
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

  // Calculate landed cost allocation per item (Epic 6 - IMPO-006)
  const itemsWithLandedCost = useMemo(() => {
    const subtotal = calculations.subtotal;
    if (subtotal === 0) return order.items;

    const freight = parseFloat(order.freight_cost) || 0;
    const insurance = parseFloat(order.insurance_cost) || 0;
    const customsDuty = calculations.customsDuty;
    const otherCharges = parseFloat(order.other_charges) || 0;

    return order.items.map((item) => {
      const fobValue = calculateItemTotal(item);
      const proportion = subtotal > 0 ? fobValue / subtotal : 0;

      const allocatedFreight = freight * proportion;
      const allocatedInsurance = insurance * proportion;
      const allocatedDuty = customsDuty * proportion;
      const otherAllocatedCharges = otherCharges * proportion;

      const landedCostTotal =
        fobValue +
        allocatedFreight +
        allocatedInsurance +
        allocatedDuty +
        otherAllocatedCharges;

      const quantity = parseFloat(item.quantity) || 0;
      const unitLandedCost = quantity > 0 ? landedCostTotal / quantity : 0;

      return {
        ...item,
        fob_value: fobValue,
        allocated_freight: allocatedFreight,
        allocated_insurance: allocatedInsurance,
        allocated_duty: allocatedDuty,
        other_allocated_charges: otherAllocatedCharges,
        landed_cost_total: landedCostTotal,
        unit_landed_cost: unitLandedCost,
      };
    });
  }, [
    order.items,
    order.freight_cost,
    order.insurance_cost,
    order.other_charges,
    calculations.subtotal,
    calculations.customsDuty,
    calculateItemTotal,
  ]);

  // Update order with calculated values including Form 201 fields and landed costs
  useEffect(() => {
    setOrder((prev) => ({
      ...prev,
      items: itemsWithLandedCost,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculations, itemsWithLandedCost.length]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFieldChange = useCallback(
    (field, value) => {
      setOrder((prev) => {
        const updated = { ...prev, [field]: value };
        // Auto-update emirate when destination port changes (for Form 201 VAT Return)
        if (field === 'destination_port') {
          const emirateInfo = getEmirateFromPort(value);
          updated.emirate = emirateInfo.name;
          // Check if port has designated zone
          const portInfo = COMMON_PORTS.find((p) => p.value === value);
          if (portInfo?.has_designated_zone) {
            // Suggest designated zone but don&apos;t auto-enable
            updated.designated_zone_name = portInfo.zone_code || '';
          }
        }
        // Auto-update designated zone fields when movement type changes
        if (field === 'movement_type') {
          const isDesignatedZoneEntry =
            value === 'dz_entry' || value === 'dz_to_dz';
          updated.designated_zone_entry = isDesignatedZoneEntry;
          // Clear designated zone name if not entering designated zone
          if (!isDesignatedZoneEntry && value === 'mainland') {
            updated.designated_zone_name = '';
          }
        }
        // Auto-update supplier TRN requirement when supplier VAT status changes
        if (field === 'supplier_vat_status') {
          // Clear TRN if non-resident (TRN not applicable)
          if (value === 'non_resident') {
            updated.supplier_trn = '';
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
        supplier_name: supplier?.name || supplier?.company_name || '',
        // Auto-populate supplier TRN if available
        supplier_trn: supplier?.trn_number || supplier?.vat_number || '',
        // Determine supplier VAT status based on country
        supplier_vat_status:
          supplier?.country === 'UAE'
            ? supplier?.trn_number
              ? 'uae_registered'
              : 'non_vat_registered'
            : supplier?.country &&
                ['Saudi Arabia', 'Bahrain', 'Oman', 'Kuwait', 'Qatar'].includes(
                  supplier.country,
                )
              ? 'gcc_registered'
              : 'non_resident',
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
      if (field === 'quantity' || field === 'unit_price') {
        const qty =
          field === 'quantity'
            ? parseFloat(value) || 0
            : parseFloat(newItems[index].quantity) || 0;
        const price =
          field === 'unit_price'
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
        const uniqueName =
          product.uniqueName ||
          product.unique_name ||
          product.displayName ||
          product.display_name ||
          '';

        // SSOT validation (Epic 5 - IMPO-009)
        // Show warning if product doesn't follow SSOT pattern
        const ssotValidation = validateSsotPattern(uniqueName);
        let ssotOverride = false;
        if (!ssotValidation.isValid) {
          // Show warning but allow with override for import products
          notificationService.warning(
            `Product "${uniqueName}" does not follow SSOT naming pattern.\n` +
              `Expected: ${ssotValidation.pattern}\n` +
              `Error: ${ssotValidation.error}\n\n` +
              `Product added with manager override flag. Please update product naming.`,
          );
          ssotOverride = true;
        }

        setOrder((prev) => {
          const newItems = [...prev.items];
          newItems[index] = {
            ...newItems[index],
            product_id: productId,
            unique_name: uniqueName,
            ssot_override: ssotOverride,
            description: product.description || '',
            grade: product.grade || '',
            finish: product.finish || '',
            hs_code: product.hs_code || '',
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
        notificationService.warning('At least one line item is required');
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
      newErrors.supplier_id = 'Supplier is required';
    }

    if (!order.incoterm) {
      newErrors.incoterm = 'Incoterm is required';
    }

    if (!order.payment_terms) {
      newErrors.payment_terms = 'Payment terms are required';
    }

    if (!order.destination_port) {
      newErrors.destination_port = 'Destination port is required';
    }

    // Validate line items
    const hasValidItem = order.items.some(
      (item) =>
        item.unique_name &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unit_price) > 0,
    );

    if (!hasValidItem) {
      newErrors.items = 'At least one complete line item is required';
    }

    // Validate exchange rate
    if (!order.exchange_rate || parseFloat(order.exchange_rate) <= 0) {
      newErrors.exchange_rate = 'Valid exchange rate is required';
    }

    // Validate exchange rate source (FTA audit trail requirement)
    if (!order.exchange_rate_source) {
      newErrors.exchange_rate_source =
        'Exchange rate source required for FTA compliance';
    }

    // UAE VAT Compliance Validations (stricter for non-draft orders)
    if (order.status !== 'draft') {
      // Importer TRN validation
      const trnValidation = validateTRN(order.importer_trn);
      if (!trnValidation.valid) {
        newErrors.importer_trn = trnValidation.message;
      }

      // Supplier TRN validation (required for UAE/GCC registered suppliers)
      if (
        order.supplier_vat_status === 'uae_registered' ||
        order.supplier_vat_status === 'gcc_registered'
      ) {
        if (!order.supplier_trn) {
          newErrors.supplier_trn = `TRN required for ${order.supplier_vat_status === 'uae_registered' ? 'UAE' : 'GCC'} registered supplier`;
        } else if (order.supplier_vat_status === 'uae_registered') {
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
          'Movement type required for VAT treatment determination';
      }

      // Designated zone name required if entering designated zone
      if (
        (order.movement_type === 'dz_entry' ||
          order.movement_type === 'dz_to_dz') &&
        !order.designated_zone_name
      ) {
        newErrors.designated_zone_name =
          'Designated zone name required for zero-rated VAT treatment';
      }

      // Tax point validation: Customs assessment date required for completed/customs status
      if (
        (order.status === 'completed' || order.status === 'customs') &&
        !order.customs_assessment_date
      ) {
        newErrors.customs_assessment_date =
          'Customs assessment date required for VAT tax point determination (UAE VAT Law Article 25)';
      }

      // Customs documentation validation (required for customs clearance)
      if (order.status === 'customs' || order.status === 'completed') {
        if (!order.boe_number) {
          newErrors.boe_number =
            'Bill of Entry number required for customs clearance';
        }
        if (!order.certificate_of_origin) {
          newErrors.certificate_of_origin =
            'Certificate of Origin required for customs clearance';
        }
        if (!order.certificate_of_origin_date) {
          newErrors.certificate_of_origin_date =
            'COO issue date required for customs clearance';
        }
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
        notificationService.error('Please fix the validation errors');
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
            .filter((item) => item.unique_name && item.quantity > 0),
        };

        let _response;
        if (isEditMode) {
          _response = await importOrderService.updateImportOrder(
            id,
            submitData,
          );
          notificationService.success('Import order updated successfully');
        } else {
          _response = await importOrderService.createImportOrder(submitData);
          notificationService.success('Import order created successfully');
        }

        // Navigate to import/export dashboard
        navigate('/import-export');
      } catch (error) {
        console.error('Failed to save import order:', error);
        notificationService.error(
          error.message || 'Failed to save import order',
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
    setOrder((prev) => ({ ...prev, status: 'draft' }));
    await handleSubmit();
  }, [handleSubmit]);

  // ============================================================
  // CURRENCY FORMATTING
  // ============================================================

  const formatCurrency = useCallback(
    (amount, currency = order.currency) => {
      const currencyConfig = CURRENCY_OPTIONS.find((c) => c.value === currency);
      const symbol = currencyConfig?.symbol || '$';
      return `${symbol}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [order.currency],
  );

  const formatAED = useCallback((amount) => {
    return `AED ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  // ============================================================
  // RENDER LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
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
      className={`min-h-screen ${isDarkMode ? 'bg-[#0b0f14]' : 'bg-gray-50'}`}
    >
      {/* Sticky Header with Blur */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-md ${
          isDarkMode
            ? 'bg-[#0f151b]/94 border-b border-[#2a3640]'
            : 'bg-white/94 border-b border-gray-200'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/import-export')}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode
                    ? 'hover:bg-[#141a20] text-[#93a4b4]'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1
                  className={`text-lg font-extrabold ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                >
                  {isEditMode ? 'Edit Import Order' : 'Create Import Order'}
                </h1>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  {order.order_number
                    ? `#${order.order_number}`
                    : 'New import order'}
                  {order.supplier_name && ` - ${order.supplier_name}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/import-export')}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                Save Draft
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 8+4 Grid Layout */}
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-3">
          {/* Left Column - Main Form (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            {/* Order Header Section */}
            <Card title="Order Information" icon={FileText}>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    label="Order Number"
                    value={order.order_number || '(Auto-generated)'}
                    disabled
                    placeholder="Auto-generated"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    label="Order Date"
                    type="date"
                    value={order.order_date}
                    onChange={(e) =>
                      handleFieldChange('order_date', e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Status"
                    value={order.status}
                    onValueChange={(value) =>
                      handleFieldChange('status', value)
                    }
                    required
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    label="PI Number"
                    value={order.pi_number}
                    onChange={(e) =>
                      handleFieldChange('pi_number', e.target.value)
                    }
                    placeholder="Proforma Invoice #"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Importer TRN"
                    value={order.importer_trn}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 15);
                      handleFieldChange('importer_trn', value);
                    }}
                    placeholder="100XXXXXXXXX5 (15 digits)"
                    error={errors.importer_trn}
                  />
                  {order.importer_trn && order.importer_trn.length > 0 && (
                    <div
                      className={`text-xs mt-1 ${validateTRN(order.importer_trn).valid ? 'text-green-500' : 'text-amber-500'}`}
                    >
                      {validateTRN(order.importer_trn).message}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* GRN Status Section (Epic 3 - IMPO-005) */}
            {isEditMode && (
              <Card title="Goods Receipt Note (GRN)" icon={Package}>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 sm:col-span-3">
                    <div
                      className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5`}
                    >
                      GRN Number
                    </div>
                    <div
                      className={`px-3 py-2.5 rounded-lg text-sm font-mono ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {order.grnNumber || 'Not Created'}
                    </div>
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <div
                      className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5`}
                    >
                      GRN Status
                    </div>
                    <div>
                      {order.grnStatus === 'not_created' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                          Not Created
                        </span>
                      )}
                      {order.grnStatus === 'draft' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                          Draft
                        </span>
                      )}
                      {order.grnStatus === 'pending_approval' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
                          Pending Approval
                        </span>
                      )}
                      {order.grnStatus === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                          Approved
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-6">
                    <div
                      className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}
                    >
                      <p
                        className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}
                      >
                        <Info className="w-3 h-3 inline mr-1" />
                        GRN will be created automatically when stock is received
                        via the Stock Receipt workflow.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Supplier & Trade Terms Section */}
            <Card title="Supplier & Trade Terms" icon={Building2}>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-6">
                  <FormSelect
                    label="Supplier"
                    value={order.supplier_id || 'none'}
                    onValueChange={(value) =>
                      handleSupplierChange(value === 'none' ? '' : value)
                    }
                    validationState={errors.supplier_id ? 'invalid' : null}
                    required
                    placeholder="Select Supplier"
                  >
                    <SelectItem value="none">Select Supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name || supplier.company_name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Supplier VAT Status"
                    value={order.supplier_vat_status}
                    onValueChange={(value) =>
                      handleFieldChange('supplier_vat_status', value)
                    }
                  >
                    {SUPPLIER_VAT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                {(order.supplier_vat_status === 'uae_registered' ||
                  order.supplier_vat_status === 'gcc_registered') && (
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      label="Supplier TRN"
                      value={order.supplier_trn}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 15);
                        handleFieldChange('supplier_trn', value);
                      }}
                      placeholder={
                        order.supplier_vat_status === 'uae_registered'
                          ? '100XXXXXXXXXX (15 digits)'
                          : 'GCC Tax Registration Number'
                      }
                      error={errors.supplier_trn}
                      required={order.status !== 'draft'}
                    />
                    {order.supplier_trn &&
                      order.supplier_vat_status === 'uae_registered' && (
                        <div
                          className={`text-xs mt-1 ${validateTRN(order.supplier_trn).valid ? 'text-green-500' : 'text-amber-500'}`}
                        >
                          {validateTRN(order.supplier_trn).message}
                        </div>
                      )}
                  </div>
                )}
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    label="PO Number"
                    value={order.po_number}
                    onChange={(e) =>
                      handleFieldChange('po_number', e.target.value)
                    }
                    placeholder="Purchase Order #"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Incoterm"
                    value={order.incoterm}
                    onValueChange={(value) =>
                      handleFieldChange('incoterm', value)
                    }
                    validationState={errors.incoterm ? 'invalid' : null}
                    required
                  >
                    {INCOTERMS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Payment Terms"
                    value={order.payment_terms}
                    onValueChange={(value) =>
                      handleFieldChange('payment_terms', value)
                    }
                    validationState={errors.payment_terms ? 'invalid' : null}
                    required
                  >
                    {PAYMENT_TERMS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    label="LC Number"
                    value={order.lc_number}
                    onChange={(e) =>
                      handleFieldChange('lc_number', e.target.value)
                    }
                    placeholder="Letter of Credit #"
                  />
                </div>
              </div>
            </Card>

            {/* Shipping Summary Card - Click to open drawer */}
            <div
              className={`${isDarkMode ? 'bg-[#141a20] border-[#2a3640]' : 'bg-white border-gray-200'} border rounded-2xl p-4 cursor-pointer hover:border-[#4aa3ff] transition-colors`}
              onClick={() => setShippingDrawerOpen(true)}
              onKeyDown={(e) =>
                e.key === 'Enter' && setShippingDrawerOpen(true)
              }
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ship
                    className={`h-4 w-4 ${isDarkMode ? 'text-[#4aa3ff]' : 'text-teal-600'}`}
                  />
                  <span
                    className={`text-sm font-semibold ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                  >
                    Shipping & VAT Treatment
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-400'}`}
                />
              </div>
              {/* Quick summary of shipping info */}
              <div className="mt-2 grid grid-cols-4 gap-3">
                <div>
                  <div
                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    Origin
                  </div>
                  <div
                    className={`text-xs font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                  >
                    {COMMON_PORTS.find((p) => p.value === order.origin_port)
                      ?.label || 'Not set'}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    Destination
                  </div>
                  <div
                    className={`text-xs font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                  >
                    {COMMON_PORTS.find(
                      (p) => p.value === order.destination_port,
                    )?.label || 'Not set'}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    Method
                  </div>
                  <div
                    className={`text-xs font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                  >
                    {SHIPPING_METHOD_OPTIONS.find(
                      (o) => o.value === order.shipping_method,
                    )?.label || 'Sea Freight'}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[11px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                  >
                    VAT Treatment
                  </div>
                  <div
                    className={`text-xs font-medium ${calculations.isDesignatedZone ? 'text-green-400' : isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                  >
                    {calculations.isDesignatedZone ? '0% (DZ)' : '5% Standard'}
                  </div>
                </div>
              </div>
              {errors.destination_port && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />{' '}
                  {errors.destination_port}
                </div>
              )}
            </div>

            {/* Line Items Section */}
            <Card title="Line Items" icon={Package}>
              {errors.items && (
                <div
                  className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    isDarkMode
                      ? 'bg-red-900/20 text-red-400'
                      : 'bg-red-50 text-red-600'
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
                      className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      <th className="text-left pb-2 pr-2 w-8">#</th>
                      <th className="text-left pb-2 pr-2 min-w-[180px]">
                        Product
                      </th>
                      <th className="text-left pb-2 pr-2 w-20">Grade</th>
                      <th className="text-left pb-2 pr-2 w-20">Finish</th>
                      <th className="text-left pb-2 pr-2 w-28">Dimensions</th>
                      <th className="text-right pb-2 pr-2 w-20">Qty</th>
                      <th className="text-left pb-2 pr-2 w-16">Unit</th>
                      <th className="text-right pb-2 pr-2 w-24">Unit Price</th>
                      <th className="text-left pb-2 pr-2 w-24">HS Code</th>
                      <th className="text-left pb-2 pr-2 w-24">Mill</th>
                      <th className="text-left pb-2 pr-2 w-24">Heat #</th>
                      <th className="text-right pb-2 pr-2 w-28">FOB Total</th>
                      <th className="text-right pb-2 pr-2 w-28">Landed Cost</th>
                      <th className="text-right pb-2 pr-2 w-28">Unit L/C</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
                  >
                    {order.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="py-2 pr-2">
                          <span
                            className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2 pr-2">
                          <div className="space-y-1">
                            <select
                              value={item.product_id}
                              onChange={(e) =>
                                handleProductSelect(index, e.target.value)
                              }
                              className="text-xs"
                            >
                              <option value="">Select Product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.uniqueName ||
                                    product.unique_name ||
                                    product.displayName ||
                                    product.display_name ||
                                    'N/A'}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.unique_name}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'unique_name',
                                  e.target.value,
                                )
                              }
                              placeholder="SS-304-SHEET-2B-1250mm-2.0mm-2500mm"
                              className={`w-full px-2 py-1 text-xs border rounded ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              }`}
                            />
                            {item.ssot_override && (
                              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                SSOT override - requires manager approval
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.grade}
                            onChange={(e) =>
                              handleItemChange(index, 'grade', e.target.value)
                            }
                            placeholder="304, 316L"
                            className={`w-full px-2 py-1 text-xs border rounded ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
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
                                'finish',
                                e.target.value.toUpperCase(),
                              )
                            }
                            placeholder="2B, BA"
                            className={`w-full px-2 py-1 text-xs border rounded ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={item.thickness}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'thickness',
                                  e.target.value,
                                )
                              }
                              placeholder="T"
                              title="Thickness"
                              className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              }`}
                            />
                            <input
                              type="text"
                              value={item.width}
                              onChange={(e) =>
                                handleItemChange(index, 'width', e.target.value)
                              }
                              placeholder="W"
                              title="Width"
                              className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              }`}
                            />
                            <input
                              type="text"
                              value={item.length}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'length',
                                  e.target.value,
                                )
                              }
                              placeholder="L"
                              title="Length"
                              className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                                isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-white'
                                  : 'border-gray-300 bg-white text-gray-900'
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'quantity',
                                e.target.value,
                              )
                            }
                            min="0"
                            step="0.001"
                            className={`w-full px-2 py-1 text-xs border rounded text-right ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              handleItemChange(index, 'unit', e.target.value)
                            }
                            className={`w-full px-1 py-1 text-xs border rounded ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
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
                              handleItemChange(
                                index,
                                'unit_price',
                                e.target.value,
                              )
                            }
                            min="0"
                            step="0.01"
                            className={`w-full px-2 py-1 text-xs border rounded text-right ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.hs_code}
                            onChange={(e) =>
                              handleItemChange(index, 'hs_code', e.target.value)
                            }
                            placeholder="72XX.XX"
                            className={`w-full px-2 py-1 text-xs border rounded ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.mill_name}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'mill_name',
                                e.target.value,
                              )
                            }
                            placeholder="Mill name"
                            className={`w-full px-2 py-1 text-xs border rounded ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.heat_number}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'heat_number',
                                e.target.value,
                              )
                            }
                            placeholder="Heat #"
                            className={`w-full px-2 py-1 text-xs border rounded ${
                              isDarkMode
                                ? 'border-gray-600 bg-gray-800 text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <span
                            className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {formatCurrency(calculateItemTotal(item))}
                          </span>
                        </td>
                        {/* Landed Cost Columns (Epic 6 - IMPO-006) */}
                        <td className="py-2 pr-2 text-right">
                          <span
                            className={`text-sm font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
                            title={`FOB: ${formatCurrency(item.fob_value || 0)} + Freight: ${formatCurrency(item.allocated_freight || 0)} + Insurance: ${formatCurrency(item.allocated_insurance || 0)} + Duty: ${formatCurrency(item.allocated_duty || 0)} + Other: ${formatCurrency(item.other_allocated_charges || 0)}`}
                          >
                            {formatCurrency(item.landed_cost_total || 0)}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <span
                            className={`text-xs font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            {formatCurrency(item.unit_landed_cost || 0)}
                          </span>
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors ${
                              order.items.length <= 1
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
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
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}{' '}
                  | Subtotal:{' '}
                  <span className="font-medium">
                    {formatCurrency(calculations.subtotal)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          {/* End Left Column */}

          {/* Right Column - Sticky Sidebar (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-[88px] space-y-3">
              {/* Order Summary Card */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div className="text-sm font-extrabold mb-3">Order Summary</div>

                {/* Summary rows */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      Subtotal ({order.currency})
                    </span>
                    <span className="font-mono text-sm">
                      {formatCurrency(calculations.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      + Freight
                    </span>
                    <span className="font-mono text-sm">
                      {formatCurrency(parseFloat(order.freight_cost) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      + Insurance
                    </span>
                    <span className="font-mono text-sm">
                      {formatCurrency(parseFloat(order.insurance_cost) || 0)}
                    </span>
                  </div>

                  <div className={DIVIDER_CLASSES(isDarkMode)} />

                  <div className="flex justify-between items-center py-1">
                    <span
                      className={`font-medium ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                    >
                      CIF Value (AED)
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {formatAED(calculations.cifValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      Customs Duty ({order.customs_duty_rate}%)
                    </span>
                    <span className="font-mono text-sm">
                      {formatAED(calculations.customsDuty)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={
                        isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'
                      }
                    >
                      VAT ({calculations.effectiveVatRate}%)
                      {calculations.isDesignatedZone && (
                        <span className="text-green-400 ml-1">(DZ)</span>
                      )}
                    </span>
                    <span
                      className={`font-mono text-sm ${calculations.isDesignatedZone ? 'text-green-400' : ''}`}
                    >
                      {calculations.isDesignatedZone
                        ? formatAED(0)
                        : `(${formatAED(calculations.vatAmount)})`}
                    </span>
                  </div>

                  <div className={DIVIDER_CLASSES(isDarkMode)} />

                  <div className="flex justify-between items-center py-2">
                    <span
                      className={`font-bold ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                    >
                      Grand Total
                    </span>
                    <span className="font-mono text-lg font-extrabold text-[#4aa3ff]">
                      {formatAED(calculations.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'} mb-2`}
                >
                  Quick Actions
                </div>
                <div className="space-y-1.5">
                  <button
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                    onClick={() => setCostDrawerOpen(true)}
                  >
                    <DollarSign className="h-4 w-4 opacity-60" />
                    <span>Edit Costs & Currency</span>
                  </button>
                  <button
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                    onClick={() => setShippingDrawerOpen(true)}
                  >
                    <Ship className="h-4 w-4 opacity-60" />
                    <span>Shipping & VAT Details</span>
                  </button>
                  <button
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                    onClick={() => setNotesDrawerOpen(true)}
                  >
                    <StickyNote className="h-4 w-4 opacity-60" />
                    <span>Notes & Documents</span>
                  </button>
                </div>
              </div>

              {/* VAT Info Card */}
              {!calculations.isDesignatedZone && (
                <div
                  className={`${isDarkMode ? 'bg-indigo-900/20 border-indigo-700/50' : 'bg-indigo-50 border-indigo-200'} border rounded-[14px] p-3`}
                >
                  <div
                    className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}
                  >
                    FTA Form 201 Mapping
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                        }
                      >
                        Box 12: Goods Imported
                      </span>
                      <span className="font-mono">
                        {formatAED(calculations.goodsImportedValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                        }
                      >
                        Box 9: RC Output
                      </span>
                      <span className="font-mono">
                        {formatAED(calculations.reverseChargeOutput)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                        }
                      >
                        Box 15: RC Input
                      </span>
                      <span className="font-mono">
                        {formatAED(calculations.reverseChargeInput)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {calculations.isDesignatedZone && (
                <div
                  className={`${isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'} border rounded-[14px] p-3`}
                >
                  <div
                    className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}
                  >
                    Zero-Rated VAT (Designated Zone)
                  </div>
                  <div
                    className={`text-xs ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}
                  >
                    Goods entering {order.designated_zone_name || 'DZ'} - 0% VAT
                    applies under Article 51.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DRAWERS */}
      {/* ============================================================ */}

      {/* Shipping & VAT Details Drawer */}
      <>
        <div
          className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${
            shippingDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setShippingDrawerOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShippingDrawerOpen(false)}
          role="button"
          tabIndex={-1}
        />
        <div
          className={`fixed top-0 right-0 h-full w-[min(620px,92vw)] z-[31]
            ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'}
            overflow-auto transition-transform ${
              shippingDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="p-4">
            {/* Drawer Header */}
            <div
              className={`sticky top-0 flex justify-between items-start gap-2.5 mb-4 p-4 -m-4 mb-4
              ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'}
              z-[1]`}
            >
              <div>
                <div className="text-sm font-extrabold flex items-center gap-2">
                  <Ship className="h-4 w-4" /> Shipping & VAT Details
                </div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Ports, vessel, containers, UAE VAT treatment
                </div>
              </div>
              <button
                onClick={() => setShippingDrawerOpen(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#2a3640]' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shipping Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Origin Port"
                  value={order.origin_port || 'none'}
                  onValueChange={(value) =>
                    handleFieldChange(
                      'origin_port',
                      value === 'none' ? '' : value,
                    )
                  }
                  placeholder="Select Origin Port"
                >
                  <SelectItem value="none">Select Origin Port</SelectItem>
                  {COMMON_PORTS.map((port) => (
                    <SelectItem key={port.value} value={port.value}>
                      {port.label}
                    </SelectItem>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Destination Port"
                  value={order.destination_port || 'none'}
                  onValueChange={(value) =>
                    handleFieldChange(
                      'destination_port',
                      value === 'none' ? '' : value,
                    )
                  }
                  validationState={errors.destination_port ? 'invalid' : null}
                  required
                  placeholder="Select Destination Port"
                >
                  <SelectItem value="none">Select Destination Port</SelectItem>
                  {COMMON_PORTS.filter((p) => p.country === 'UAE').map(
                    (port) => (
                      <SelectItem key={port.value} value={port.value}>
                        {port.label}
                      </SelectItem>
                    ),
                  )}
                </FormSelect>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className={`text-[10px] ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-400'}`}
                  >
                    Auto-derived for VAT return
                  </span>
                </div>
                <FormSelect
                  label="Shipping Method"
                  value={order.shipping_method}
                  onValueChange={(value) =>
                    handleFieldChange('shipping_method', value)
                  }
                >
                  {SHIPPING_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </FormSelect>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Vessel Name"
                  value={order.vessel_name}
                  onChange={(e) =>
                    handleFieldChange('vessel_name', e.target.value)
                  }
                  placeholder="Ship/Aircraft name"
                />
                <Input
                  label="B/L Number"
                  value={order.bl_number}
                  onChange={(e) =>
                    handleFieldChange('bl_number', e.target.value)
                  }
                  placeholder="Bill of Lading #"
                />
              </div>

              <Input
                label="Container Numbers"
                value={order.container_numbers}
                onChange={(e) =>
                  handleFieldChange('container_numbers', e.target.value)
                }
                placeholder="CONT123, CONT456"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ETD (Estimated Departure)"
                  type="date"
                  value={order.etd}
                  onChange={(e) => handleFieldChange('etd', e.target.value)}
                />
                <Input
                  label="ETA (Estimated Arrival)"
                  type="date"
                  value={order.eta}
                  onChange={(e) => handleFieldChange('eta', e.target.value)}
                />
              </div>

              {/* Customs Clearance Documentation */}
              <div
                className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-[#2a3640]' : 'border-gray-200'}`}
              >
                <h4
                  className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                >
                  Customs Clearance Documents
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Bill of Entry (BOE) Number"
                    value={order.boe_number}
                    onChange={(e) =>
                      handleFieldChange('boe_number', e.target.value)
                    }
                    placeholder="BOE customs declaration #"
                    error={errors.boe_number}
                  />
                  <Input
                    label="Certificate of Origin"
                    value={order.certificate_of_origin}
                    onChange={(e) =>
                      handleFieldChange('certificate_of_origin', e.target.value)
                    }
                    placeholder="COO number/reference"
                    error={errors.certificate_of_origin}
                  />
                </div>

                <Input
                  label="COO Issue Date"
                  type="date"
                  value={order.certificate_of_origin_date}
                  onChange={(e) =>
                    handleFieldChange(
                      'certificate_of_origin_date',
                      e.target.value,
                    )
                  }
                  error={errors.certificate_of_origin_date}
                />
              </div>

              {/* UAE VAT Treatment Section */}
              <div
                className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-[#2a3640]' : 'border-gray-200'}`}
              >
                <h4
                  className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900'}`}
                >
                  <Globe className="h-4 w-4" /> UAE VAT Treatment (Article 51)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <FormSelect
                    label="Movement Type"
                    value={order.movement_type}
                    onValueChange={(value) =>
                      handleFieldChange('movement_type', value)
                    }
                    validationState={errors.movement_type ? 'invalid' : null}
                  >
                    {MOVEMENT_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                  {(order.movement_type === 'dz_entry' ||
                    order.movement_type === 'dz_to_dz' ||
                    order.movement_type === 'dz_to_mainland') && (
                    <FormSelect
                      label="Designated Zone"
                      value={order.designated_zone_name || 'none'}
                      onValueChange={(value) =>
                        handleFieldChange(
                          'designated_zone_name',
                          value === 'none' ? '' : value,
                        )
                      }
                      validationState={
                        errors.designated_zone_name ? 'invalid' : null
                      }
                      placeholder="Select Zone"
                    >
                      <SelectItem value="none">Select Zone</SelectItem>
                      {UAE_DESIGNATED_ZONES.map((zone) => (
                        <SelectItem key={zone.code} value={zone.code}>
                          {zone.name} ({zone.emirate})
                        </SelectItem>
                      ))}
                    </FormSelect>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Input
                    label="Customs Assessment Date"
                    type="date"
                    value={order.customs_assessment_date}
                    onChange={(e) =>
                      handleFieldChange(
                        'customs_assessment_date',
                        e.target.value,
                      )
                    }
                    error={errors.customs_assessment_date}
                  />
                  <Input
                    label="BOE Number"
                    value={order.import_declaration_number}
                    onChange={(e) =>
                      handleFieldChange(
                        'import_declaration_number',
                        e.target.value,
                      )
                    }
                    placeholder="Bill of Entry #"
                  />
                </div>

                {calculations.isDesignatedZone && (
                  <div
                    className={`mt-3 p-3 rounded-[14px] text-xs ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}
                  >
                    <div className="flex items-start gap-2">
                      <Info
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                      />
                      <div>
                        <p
                          className={`font-semibold mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}
                        >
                          Zero-Rated VAT Treatment
                        </p>
                        <p
                          className={
                            isDarkMode ? 'text-green-200' : 'text-green-700'
                          }
                        >
                          Goods entering{' '}
                          {order.designated_zone_name || 'Designated Zone'}{' '}
                          qualify for 0% VAT under UAE VAT Law Article 51.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className="sticky bottom-0 pt-4 mt-6"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                  : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
              }}
            >
              <div className="flex justify-end">
                <button
                  className={BTN_PRIMARY}
                  onClick={() => setShippingDrawerOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Cost & Currency Drawer */}
      <>
        <div
          className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${
            costDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setCostDrawerOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setCostDrawerOpen(false)}
          role="button"
          tabIndex={-1}
        />
        <div
          className={`fixed top-0 right-0 h-full w-[min(620px,92vw)] z-[31]
            ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'}
            overflow-auto transition-transform ${
              costDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="p-4">
            {/* Drawer Header */}
            <div
              className={`sticky top-0 flex justify-between items-start gap-2.5 mb-4 p-4 -m-4 mb-4
              ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'}
              z-[1]`}
            >
              <div>
                <div className="text-sm font-extrabold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Costs & Currency
                </div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Exchange rates, freight, insurance, customs duty
                </div>
              </div>
              <button
                onClick={() => setCostDrawerOpen(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#2a3640]' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cost Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Currency"
                  value={order.currency}
                  onValueChange={(value) =>
                    handleFieldChange('currency', value)
                  }
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </FormSelect>
                <Input
                  label="Exchange Rate to AED"
                  type="number"
                  value={order.exchange_rate}
                  onChange={(e) =>
                    handleFieldChange('exchange_rate', e.target.value)
                  }
                  min="0"
                  step="0.0001"
                  error={errors.exchange_rate}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormSelect
                  label="Rate Source"
                  value={order.exchange_rate_source}
                  onValueChange={(value) =>
                    handleFieldChange('exchange_rate_source', value)
                  }
                  validationState={
                    errors.exchange_rate_source ? 'invalid' : null
                  }
                >
                  {EXCHANGE_RATE_SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </FormSelect>
                <Input
                  label="Rate Date"
                  type="date"
                  value={order.exchange_rate_date}
                  onChange={(e) =>
                    handleFieldChange('exchange_rate_date', e.target.value)
                  }
                />
                <Input
                  label="Reference #"
                  value={order.exchange_rate_reference}
                  onChange={(e) =>
                    handleFieldChange('exchange_rate_reference', e.target.value)
                  }
                  placeholder="CB bulletin #"
                />
              </div>

              <div className={DIVIDER_CLASSES(isDarkMode)} />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={`Freight Cost (${order.currency})`}
                  type="number"
                  value={order.freight_cost}
                  onChange={(e) =>
                    handleFieldChange('freight_cost', e.target.value)
                  }
                  min="0"
                  step="0.01"
                />
                <Input
                  label={`Insurance Cost (${order.currency})`}
                  type="number"
                  value={order.insurance_cost}
                  onChange={(e) =>
                    handleFieldChange('insurance_cost', e.target.value)
                  }
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Customs Duty Rate (%)"
                  type="number"
                  value={order.customs_duty_rate}
                  onChange={(e) =>
                    handleFieldChange('customs_duty_rate', e.target.value)
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
                    handleFieldChange('vat_rate', e.target.value)
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
                  handleFieldChange('other_charges', e.target.value)
                }
                min="0"
                step="0.01"
                placeholder="Clearing, handling, etc."
              />

              {/* UAE VAT Info */}
              {!calculations.isDesignatedZone && (
                <div
                  className={`p-3 rounded-[14px] text-xs ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex items-start gap-2">
                    <Info
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    />
                    <div>
                      <p
                        className={`font-semibold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}
                      >
                        UAE VAT (Reverse Charge)
                      </p>
                      <ul
                        className={`space-y-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}
                      >
                        <li>
                          VAT-Registered: No VAT at customs. Declare in Form
                          201.
                        </li>
                        <li>
                          Non-Registered: Pay{' '}
                          {formatAED(calculations.vatAmount)} at clearance.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div
              className="sticky bottom-0 pt-4 mt-6"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                  : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
              }}
            >
              <div className="flex justify-end">
                <button
                  className={BTN_PRIMARY}
                  onClick={() => setCostDrawerOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Notes & Documents Drawer */}
      <>
        <div
          className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${
            notesDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setNotesDrawerOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setNotesDrawerOpen(false)}
          role="button"
          tabIndex={-1}
        />
        <div
          className={`fixed top-0 right-0 h-full w-[min(520px,92vw)] z-[31]
            ${isDarkMode ? 'bg-[#141a20] border-l border-[#2a3640]' : 'bg-white border-l border-gray-200'}
            overflow-auto transition-transform ${
              notesDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="p-4">
            {/* Drawer Header */}
            <div
              className={`sticky top-0 flex justify-between items-start gap-2.5 mb-4 p-4 -m-4 mb-4
              ${isDarkMode ? 'bg-[#141a20] border-b border-[#2a3640]' : 'bg-white border-b border-gray-200'}
              z-[1]`}
            >
              <div>
                <div className="text-sm font-extrabold flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Notes & Documents
                </div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Order notes and attached files
                </div>
              </div>
              <button
                onClick={() => setNotesDrawerOpen(false)}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-[#2a3640]' : 'hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notes Fields */}
            <div className="space-y-4">
              <Textarea
                label="Notes (visible on documents)"
                value={order.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={4}
                placeholder="Enter any notes to appear on documents..."
              />
              <Textarea
                label="Internal Notes (not visible on documents)"
                value={order.internal_notes}
                onChange={(e) =>
                  handleFieldChange('internal_notes', e.target.value)
                }
                rows={4}
                placeholder="Internal comments, reminders..."
              />

              {/* Document Upload */}
              <div>
                <div
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'} mb-2`}
                >
                  Attached Documents
                </div>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center ${
                    isDarkMode
                      ? 'border-[#2a3640] hover:border-[#4aa3ff]'
                      : 'border-gray-300 hover:border-blue-400'
                  } transition-colors cursor-pointer`}
                >
                  <Upload
                    className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-400'}`}
                  />
                  <p
                    className={`text-sm ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-600'}`}
                  >
                    Drag and drop files here, or click to select
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]/60' : 'text-gray-400'}`}
                  >
                    Supports: PDF, images, Excel files (max 10MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className="sticky bottom-0 pt-4 mt-6"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                  : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
              }}
            >
              <div className="flex justify-end">
                <button
                  className={BTN_PRIMARY}
                  onClick={() => setNotesDrawerOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default ImportOrderForm;
