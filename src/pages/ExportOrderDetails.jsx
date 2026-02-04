import {
  AlertCircle,
  AlertTriangle,
  Anchor,
  ArrowLeft,
  ArrowUpRight,
  Award,
  Banknote,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flag,
  Globe,
  Hash,
  Info,
  Mail,
  MapPin,
  Package,
  Phone,
  Plane,
  Printer,
  RefreshCw,
  ShieldCheck,
  Ship,
  Trash2,
  TrendingUp,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { exportOrderService } from "../services/exportOrderService";

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

// Status configuration for export orders
const STATUS_CONFIG = {
  draft: {
    color: "gray",
    bgLight: "bg-gray-100",
    bgDark: "bg-gray-800",
    textLight: "text-gray-800",
    textDark: "text-gray-300",
    borderLight: "border-gray-300",
    borderDark: "border-gray-600",
    icon: FileText,
    label: "Draft",
    description: "Order is being prepared",
  },
  confirmed: {
    color: "blue",
    bgLight: "bg-blue-100",
    bgDark: "bg-blue-900/30",
    textLight: "text-blue-800",
    textDark: "text-blue-300",
    borderLight: "border-blue-300",
    borderDark: "border-blue-600",
    icon: CheckCircle,
    label: "Confirmed",
    description: "Order confirmed by customer",
  },
  preparing: {
    color: "yellow",
    bgLight: "bg-yellow-100",
    bgDark: "bg-yellow-900/30",
    textLight: "text-yellow-800",
    textDark: "text-yellow-300",
    borderLight: "border-yellow-300",
    borderDark: "border-yellow-600",
    icon: Package,
    label: "Preparing Shipment",
    description: "Goods being prepared for export",
  },
  shipped: {
    color: "orange",
    bgLight: "bg-orange-100",
    bgDark: "bg-orange-900/30",
    textLight: "text-orange-800",
    textDark: "text-orange-300",
    borderLight: "border-orange-300",
    borderDark: "border-orange-600",
    icon: Ship,
    label: "Shipped",
    description: "Goods departed from UAE",
  },
  in_transit: {
    color: "purple",
    bgLight: "bg-purple-100",
    bgDark: "bg-purple-900/30",
    textLight: "text-purple-800",
    textDark: "text-purple-300",
    borderLight: "border-purple-300",
    borderDark: "border-purple-600",
    icon: Globe,
    label: "In Transit",
    description: "Goods in transit to destination",
  },
  delivered: {
    color: "teal",
    bgLight: "bg-teal-100",
    bgDark: "bg-teal-900/30",
    textLight: "text-teal-800",
    textDark: "text-teal-300",
    borderLight: "border-teal-300",
    borderDark: "border-teal-600",
    icon: Anchor,
    label: "Delivered",
    description: "Goods delivered to customer",
  },
  completed: {
    color: "green",
    bgLight: "bg-green-100",
    bgDark: "bg-green-900/30",
    textLight: "text-green-800",
    textDark: "text-green-300",
    borderLight: "border-green-300",
    borderDark: "border-green-600",
    icon: CheckCircle,
    label: "Completed",
    description: "Export transaction completed",
  },
  cancelled: {
    color: "red",
    bgLight: "bg-red-100",
    bgDark: "bg-red-900/30",
    textLight: "text-red-800",
    textDark: "text-red-300",
    borderLight: "border-red-300",
    borderDark: "border-red-600",
    icon: XCircle,
    label: "Cancelled",
    description: "Order cancelled",
  },
};

// Status transitions - defines which statuses can follow each status
const STATUS_TRANSITIONS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["preparing", "shipped", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["in_transit", "delivered", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// Status order for timeline display
const STATUS_ORDER = ["draft", "confirmed", "preparing", "shipped", "in_transit", "delivered", "completed"];

// Country flag emojis
const COUNTRY_FLAGS = {
  AE: "🇦🇪",
  UAE: "🇦🇪",
  SA: "🇸🇦",
  KSA: "🇸🇦",
  BH: "🇧🇭",
  KW: "🇰🇼",
  QA: "🇶🇦",
  OM: "🇴🇲",
  IN: "🇮🇳",
  PK: "🇵🇰",
  BD: "🇧🇩",
  US: "🇺🇸",
  UK: "🇬🇧",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  IT: "🇮🇹",
  ES: "🇪🇸",
  NL: "🇳🇱",
  BE: "🇧🇪",
  CN: "🇨🇳",
  JP: "🇯🇵",
  KR: "🇰🇷",
  SG: "🇸🇬",
  MY: "🇲🇾",
  TH: "🇹🇭",
  VN: "🇻🇳",
  ID: "🇮🇩",
  PH: "🇵🇭",
  AU: "🇦🇺",
  NZ: "🇳🇿",
  ZA: "🇿🇦",
  NG: "🇳🇬",
  KE: "🇰🇪",
  EG: "🇪🇬",
  BR: "🇧🇷",
  MX: "🇲🇽",
  AR: "🇦🇷",
  CL: "🇨🇱",
  TR: "🇹🇷",
  RU: "🇷🇺",
  PL: "🇵🇱",
  CZ: "🇨🇿",
  GR: "🇬🇷",
  PT: "🇵🇹",
  SE: "🇸🇪",
  NO: "🇳🇴",
  FI: "🇫🇮",
  DK: "🇩🇰",
  IE: "🇮🇪",
  AT: "🇦🇹",
  CH: "🇨🇭",
};

// GCC countries list
const GCC_COUNTRIES = ["AE", "SA", "BH", "KW", "QA", "OM", "UAE", "KSA"];

// Incoterms descriptions
const INCOTERMS_DESCRIPTIONS = {
  EXW: "Ex Works - Buyer bears all costs and risks from seller's premises",
  FCA: "Free Carrier - Seller delivers goods to carrier at named place",
  CPT: "Carriage Paid To - Seller pays freight to named destination",
  CIP: "Carriage & Insurance Paid - Seller pays freight and insurance to destination",
  DAT: "Delivered At Terminal - Seller delivers unloaded at named terminal",
  DAP: "Delivered At Place - Seller delivers at named place, not unloaded",
  DDP: "Delivered Duty Paid - Seller bears all costs including duties to destination",
  FAS: "Free Alongside Ship - Seller delivers goods alongside vessel at named port",
  FOB: "Free On Board - Seller delivers goods on board vessel at named port",
  CFR: "Cost & Freight - Seller pays freight to destination port",
  CIF: "Cost, Insurance & Freight - Seller pays freight and insurance to destination port",
};

// Payment methods labels
const PAYMENT_METHOD_LABELS = {
  advance: "Advance Payment",
  letter_of_credit: "Letter of Credit (L/C)",
  open_account: "Open Account",
  documents_against_payment: "Documents Against Payment (D/P)",
  documents_against_acceptance: "Documents Against Acceptance (D/A)",
  bank_guarantee: "Bank Guarantee",
  escrow: "Escrow",
};

// Export VAT treatment labels
const VAT_TREATMENT_LABELS = {
  zero_rated: "0% - Zero-Rated (Article 45)",
  exempt: "Exempt",
  re_export: "Re-Export",
  standard: "5% Standard Rate",
};

// Document categories
const DOCUMENT_TABS = [
  { id: "export", label: "Export Documents", icon: FileText },
  { id: "shipping", label: "Shipping Documents", icon: Ship },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "commercial", label: "Commercial", icon: Banknote },
  { id: "customs", label: "Customs", icon: ShieldCheck },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get country flag emoji
const getCountryFlag = (countryCode) => {
  if (!countryCode) return "🌍";
  const code = countryCode.toUpperCase().trim();
  return COUNTRY_FLAGS[code] || "🌍";
};

// Check if country is GCC
const isGCCCountry = (countryCode) => {
  if (!countryCode) return false;
  return GCC_COUNTRIES.includes(countryCode.toUpperCase().trim());
};

// ========================================
// SKELETON LOADER COMPONENTS
// ========================================

const SkeletonCard = ({ isDarkMode, height = "h-40" }) => (
  <div
    className={`animate-pulse rounded-xl border p-6 ${height} ${
      isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
    }`}
  >
    <div className={`h-4 rounded w-1/4 mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    <div className={`h-3 rounded w-3/4 mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    <div className={`h-3 rounded w-1/2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
  </div>
);

const SkeletonHeader = ({ isDarkMode }) => (
  <div className="animate-pulse flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div>
        <div className={`h-8 rounded w-48 mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-4 rounded w-32 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </div>
      <div className={`h-8 rounded-full w-24 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>
    <div className="flex gap-3">
      <div className={`h-10 rounded-lg w-20 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-10 rounded-lg w-20 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-10 rounded-lg w-32 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);

// ========================================
// MAIN COMPONENT
// ========================================

const ExportOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // ========================================
  // STATE
  // ========================================
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeDocTab, setActiveDocTab] = useState("export");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState("");
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    vatCompliance: true,
    reExport: true,
    gcc: true,
    timeline: false,
  });

  // ========================================
  // DATA FETCHING
  // ========================================
  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await exportOrderService.getExportOrder(id);
      setOrder(response.order || response.data || response);
    } catch (err) {
      console.error("Error loading export order:", err);
      if (err.response?.status === 404) {
        setError("Export order not found. It may have been deleted or the ID is invalid.");
      } else {
        setError(err.message || "Failed to load export order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id, loadOrder]);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ========================================
  // FORMATTING FUNCTIONS
  // ========================================
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-AE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  const formatDateShort = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-AE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-AE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  const formatCurrency = useCallback((amount, currency = "USD") => {
    if (amount === null || amount === undefined) return "N/A";
    try {
      return new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${parseFloat(amount).toFixed(2)}`;
    }
  }, []);

  const formatNumber = useCallback((num, decimals = 2) => {
    if (num === null || num === undefined) return "N/A";
    return new Intl.NumberFormat("en-AE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }, []);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const getStatusConfig = useCallback((status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  }, []);

  const getShippingIcon = useCallback((method) => {
    const methodLower = method?.toLowerCase() || "";
    if (methodLower.includes("air")) return Plane;
    if (methodLower.includes("land") || methodLower.includes("road") || methodLower.includes("truck")) return Truck;
    return Ship;
  }, []);

  const copyToClipboard = useCallback(async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Calculate AED value from foreign currency
  const calculateAEDValue = useCallback((value, exchangeRate = 1) => {
    if (!value) return 0;
    return parseFloat(value) * parseFloat(exchangeRate || 1);
  }, []);

  // ========================================
  // EVENT HANDLERS
  // ========================================
  const handleStatusUpdate = useCallback((newStatus) => {
    setStatusDropdownOpen(false);
    setPendingStatus(newStatus);
    setShowStatusNotesModal(true);
  }, []);

  const confirmStatusUpdate = useCallback(async () => {
    if (!pendingStatus) return;

    try {
      await exportOrderService.updateStatus(id, pendingStatus, statusUpdateNotes);
      setSuccess(`Status updated to ${getStatusConfig(pendingStatus).label}`);
      setShowStatusNotesModal(false);
      setStatusUpdateNotes("");
      setPendingStatus(null);
      loadOrder();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }, [id, pendingStatus, statusUpdateNotes, getStatusConfig, loadOrder]);

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: "Delete Export Order?",
      message: `Are you sure you want to delete export order ${order?.exportOrderNumber || order?.export_order_number || id}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await exportOrderService.deleteExportOrder(id);
      setSuccess("Export order deleted successfully");
      setTimeout(() => navigate("/export-orders"), 1500);
    } catch (err) {
      setError(err.message || "Failed to delete export order");
    }
  }, [id, order, confirm, navigate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPDF = useCallback(() => {
    // Placeholder for PDF export functionality
    setSuccess("PDF export feature coming soon");
  }, []);

  const handleGenerateInvoice = useCallback(() => {
    navigate(`/export-orders/${id}/invoice`);
  }, [id, navigate]);

  // ========================================
  // MEMOIZED DATA EXTRACTION
  // ========================================
  const orderData = useMemo(() => {
    if (!order) return null;

    // Normalize field names (handle both camelCase and snake_case)
    return {
      // Order Identification
      orderNumber:
        order.exportOrderNumber || order.export_order_number || order.orderNumber || order.order_number || "N/A",
      orderDate: order.orderDate || order.order_date,
      status: order.status || "draft",

      // Customer Information
      customerId: order.customerId || order.customer_id,
      customerName: order.customerName || order.customer_name || order.customer?.name || "N/A",
      customerAddress: order.customerAddress || order.customer_address || order.customer?.address,
      customerTrn: order.customerTrn || order.customer_trn || order.customer?.trn,
      customerContact: order.customerContact || order.customer_contact || order.customer?.contact,
      customerEmail: order.customerEmail || order.customer_email || order.customer?.email,
      customerPhone: order.customerPhone || order.customer_phone || order.customer?.phone,

      // Destination Details
      destinationCountry: order.destinationCountry || order.destination_country,
      destinationCountryCode: order.destinationCountryCode || order.destination_country_code,
      destinationPort: order.destinationPort || order.destination_port,
      destinationAddress: order.destinationAddress || order.destination_address,
      shippingMethod: order.shippingMethod || order.shipping_method || "sea",

      // Shipping Terms
      incoterms: order.incoterms || "FOB",
      paymentMethod: order.paymentMethod || order.payment_method,
      expectedShipDate: order.expectedShipDate || order.expected_ship_date,
      actualShipDate: order.actualShipDate || order.actual_ship_date,
      estimatedArrival: order.estimatedArrival || order.estimated_arrival || order.eta,

      // UAE VAT Export Compliance
      exportVatTreatment: order.exportVatTreatment || order.export_vat_treatment || "zero_rated",
      exportType: order.exportType || order.export_type || "Direct Export",
      zeroRatedExportValue: order.zeroRatedExportValue || order.zero_rated_export_value,
      isDesignatedZoneExport: order.isDesignatedZoneExport || order.is_designated_zone_export,
      designatedZoneOrigin: order.designatedZoneOrigin || order.designated_zone_origin,

      // Re-Export Details
      isReExport: order.isReExport || order.is_re_export,
      originalImportBoe: order.originalImportBoe || order.original_import_boe,
      originalImportDate: order.originalImportDate || order.original_import_date,
      originalImportValue: order.originalImportValue || order.original_import_value,

      // GCC Export Details
      isGccExport: order.isGccExport || order.is_gcc_export,
      gccCountryCode: order.gccCountryCode || order.gcc_country_code,
      customerGccVatId: order.customerGccVatId || order.customer_gcc_vat_id,

      // Currency & Exchange Rate
      currency: order.currency || "USD",
      exchangeRate: order.exchangeRate || order.exchange_rate || 1,
      exchangeRateSource: order.exchangeRateSource || order.exchange_rate_source,
      exchangeRateDate: order.exchangeRateDate || order.exchange_rate_date,
      exchangeRateReference: order.exchangeRateReference || order.exchange_rate_reference,

      // Line Items
      items: order.items || order.lineItems || order.line_items || [],

      // Totals
      subtotal: order.subtotal || order.sub_total || 0,
      vatAmount: order.vatAmount || order.vat_amount || 0,
      total: order.total || order.grandTotal || order.grand_total || 0,
      totalAed: order.totalAed || order.total_aed,

      // Export Documentation
      exportDeclarationNumber: order.exportDeclarationNumber || order.export_declaration_number,
      exportDeclarationDate: order.exportDeclarationDate || order.export_declaration_date,
      certificateOfOrigin: order.certificateOfOrigin || order.certificate_of_origin,
      commercialInvoiceNumber: order.commercialInvoiceNumber || order.commercial_invoice_number,
      billOfLading: order.billOfLading || order.bill_of_lading || order.blNumber || order.bl_number,
      vesselName: order.vesselName || order.vessel_name,
      containerNumber: order.containerNumber || order.container_number,

      // Documents & History
      documents: order.documents || [],
      statusHistory: order.statusHistory || order.status_history || [],
      notes: order.notes || order.internalNotes || order.internal_notes,

      // Metadata
      createdAt: order.createdAt || order.created_at,
      updatedAt: order.updatedAt || order.updated_at,
      createdBy: order.createdBy || order.created_by,
    };
  }, [order]);

  // ========================================
  // RENDER: LOADING STATE
  // ========================================
  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <SkeletonHeader isDarkMode={isDarkMode} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard isDarkMode={isDarkMode} height="h-32" />
            <SkeletonCard isDarkMode={isDarkMode} height="h-48" />
            <SkeletonCard isDarkMode={isDarkMode} height="h-64" />
            <SkeletonCard isDarkMode={isDarkMode} height="h-48" />
          </div>
          <div className="space-y-6">
            <SkeletonCard isDarkMode={isDarkMode} height="h-80" />
            <SkeletonCard isDarkMode={isDarkMode} height="h-48" />
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: ERROR STATE
  // ========================================
  if (error && !order) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
          }`}
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Error Loading Export Order
          </h2>
          <p className={`mb-6 max-w-md mx-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate("/export-orders")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ArrowLeft className="inline-block w-4 h-4 mr-2" />
              Back to Export Orders
            </button>
            <button
              type="button"
              onClick={loadOrder}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className="inline-block w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: NOT FOUND STATE
  // ========================================
  if (!order || !orderData) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
          }`}
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Export Order Not Found
          </h2>
          <p className={`text-lg mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            The export order you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Link to="/export-orders" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700">
            <ArrowLeft size={18} />
            Back to Export Orders
          </Link>
        </div>
      </div>
    );
  }

  // ========================================
  // DERIVED VALUES
  // ========================================
  const statusConfig = getStatusConfig(orderData.status);
  const StatusIcon = statusConfig.icon;
  const ShippingIcon = getShippingIcon(orderData.shippingMethod);
  const availableTransitions = STATUS_TRANSITIONS[orderData.status] || [];
  const countryFlag = getCountryFlag(orderData.destinationCountryCode);
  const isGCC = isGCCCountry(orderData.destinationCountryCode) || orderData.isGccExport;

  // Calculate totals in AED
  const _subtotalAed = calculateAEDValue(orderData.subtotal, orderData.exchangeRate);
  const totalAed = orderData.totalAed || calculateAEDValue(orderData.total, orderData.exchangeRate);
  const zeroRatedValueAed = orderData.zeroRatedExportValue || totalAed;

  // ========================================
  // RENDER: MAIN CONTENT
  // ========================================
  return (
    <div className={`p-6 min-h-screen print:p-0 print:bg-white ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      {/* ========================================
          HEADER WITH ACTIONS
          ======================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/export-orders")}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1
              className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Ship size={32} className="text-teal-600" />
              {orderData.orderNumber}
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Export Order Details</p>
          </div>
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border ${
              isDarkMode
                ? `${statusConfig.bgDark} ${statusConfig.textDark} ${statusConfig.borderDark}`
                : `${statusConfig.bgLight} ${statusConfig.textLight} ${statusConfig.borderLight}`
            }`}
          >
            <StatusIcon size={16} />
            {statusConfig.label}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Edit Button - Only for draft orders */}
          {orderData.status === "draft" && (
            <Link
              to={`/export-orders/${id}/edit`}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Edit size={18} />
              Edit
            </Link>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Printer size={18} />
            Print
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Download size={18} />
            Export PDF
          </button>

          {/* Status Update Dropdown */}
          {availableTransitions.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <RefreshCw size={18} />
                Update Status
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {statusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStatusDropdownOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setStatusDropdownOpen(false)}
                    role="button"
                    tabIndex={-1}
                  />
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-20 border ${
                      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
                  >
                    {availableTransitions.map((nextStatus) => {
                      const nextConfig = getStatusConfig(nextStatus);
                      const NextIcon = nextConfig.icon;
                      return (
                        <button
                          type="button"
                          key={nextStatus}
                          onClick={() => handleStatusUpdate(nextStatus)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <NextIcon size={18} className={isDarkMode ? nextConfig.textDark : nextConfig.textLight} />
                          <div>
                            <p className="font-medium">{nextConfig.label}</p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {nextConfig.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block mb-8">
        <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4">
          <div>
            <h1 className="text-3xl font-bold">{orderData.orderNumber}</h1>
            <p className="text-gray-600">Export Order</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{statusConfig.label}</p>
            <p className="text-sm text-gray-600">Printed: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      {/* ========================================
          MAIN CONTENT GRID
          ======================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========================================
            LEFT COLUMN - MAIN CONTENT
            ======================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* ========================================
              A. ORDER SUMMARY CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <FileText size={20} className="text-teal-600" />
              Order Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Order Date</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatDate(orderData.orderDate)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Created</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatDate(orderData.createdAt)}
                </p>
              </div>
              {orderData.updatedAt && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Last Modified</p>
                  <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatDate(orderData.updatedAt)}
                  </p>
                </div>
              )}
              {orderData.createdBy && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Created By</p>
                  <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{orderData.createdBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================
              B. CUSTOMER INFORMATION CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Building2 size={20} className="text-teal-600" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Customer Name</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {orderData.customerId ? (
                    <Link
                      to={`/customers/${orderData.customerId}`}
                      className="text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1"
                    >
                      {orderData.customerName}
                      <ExternalLink size={14} />
                    </Link>
                  ) : (
                    orderData.customerName
                  )}
                </p>
              </div>

              {orderData.customerAddress && (
                <div className="md:col-span-2">
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Address</p>
                  <p className={`font-medium flex items-start gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{orderData.customerAddress}</span>
                  </p>
                </div>
              )}

              {orderData.customerTrn && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Customer TRN</p>
                  <p
                    className={`font-medium font-mono flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <Hash size={14} />
                    {orderData.customerTrn}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderData.customerTrn, "customerTrn")}
                      className={`p-1 rounded transition-colors ${
                        copiedField === "customerTrn"
                          ? "text-green-500"
                          : isDarkMode
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Copy TRN"
                    >
                      {copiedField === "customerTrn" ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </button>
                  </p>
                </div>
              )}

              {orderData.customerContact && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Contact Person</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <User size={14} />
                    {orderData.customerContact}
                  </p>
                </div>
              )}

              {orderData.customerEmail && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Email</p>
                  <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <a
                      href={`mailto:${orderData.customerEmail}`}
                      className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                    >
                      <Mail size={14} />
                      {orderData.customerEmail}
                    </a>
                  </p>
                </div>
              )}

              {orderData.customerPhone && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Phone</p>
                  <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <a
                      href={`tel:${orderData.customerPhone}`}
                      className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                    >
                      <Phone size={14} />
                      {orderData.customerPhone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================
              C. DESTINATION DETAILS CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Globe size={20} className="text-teal-600" />
              Destination Details
            </h2>

            {/* Route Visualization */}
            <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl mb-2">🇦🇪</div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>UAE</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Origin</p>
                </div>
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 relative ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}>
                    <ShippingIcon
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 ${
                        isDarkMode ? "text-teal-400" : "text-teal-600"
                      }`}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">{countryFlag}</div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {orderData.destinationCountry || orderData.destinationCountryCode || "Destination"}
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Destination</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Destination Country</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  <span className="text-lg">{countryFlag}</span>
                  {orderData.destinationCountry || orderData.destinationCountryCode || "N/A"}
                  {isGCC && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isDarkMode ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      GCC
                    </span>
                  )}
                </p>
              </div>

              {orderData.destinationPort && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Destination Port</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <Anchor size={14} />
                    {orderData.destinationPort}
                  </p>
                </div>
              )}

              {orderData.destinationAddress && (
                <div className="md:col-span-2">
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Destination Address</p>
                  <p className={`font-medium flex items-start gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{orderData.destinationAddress}</span>
                  </p>
                </div>
              )}

              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Shipping Method</p>
                <p
                  className={`font-medium flex items-center gap-2 capitalize ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  <ShippingIcon size={14} />
                  {orderData.shippingMethod?.replace(/_/g, " ") || "Sea Freight"}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================
              D. SHIPPING TERMS CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <FileCheck size={20} className="text-teal-600" />
              Shipping Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Incoterms</p>
                <div>
                  <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {orderData.incoterms}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {INCOTERMS_DESCRIPTIONS[orderData.incoterms] || "Trade terms"}
                  </p>
                </div>
              </div>

              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Payment Method</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  <CreditCard size={14} />
                  {PAYMENT_METHOD_LABELS[orderData.paymentMethod] || orderData.paymentMethod || "N/A"}
                </p>
              </div>

              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Expected Ship Date</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  <Calendar size={14} />
                  {formatDate(orderData.expectedShipDate)}
                </p>
              </div>

              {orderData.actualShipDate && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Actual Ship Date</p>
                  <p className={`font-medium flex items-center gap-2 text-green-600`}>
                    <CheckCircle size={14} />
                    {formatDate(orderData.actualShipDate)}
                  </p>
                </div>
              )}

              {orderData.estimatedArrival && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Estimated Arrival</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <Clock size={14} />
                    {formatDate(orderData.estimatedArrival)}
                  </p>
                </div>
              )}

              {orderData.vesselName && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Vessel Name</p>
                  <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{orderData.vesselName}</p>
                </div>
              )}

              {orderData.containerNumber && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Container Number</p>
                  <p className={`font-medium font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {orderData.containerNumber}
                  </p>
                </div>
              )}

              {orderData.billOfLading && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Bill of Lading</p>
                  <p className={`font-medium font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {orderData.billOfLading}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================
              E. UAE VAT EXPORT COMPLIANCE SECTION (CRITICAL)
              ======================================== */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            {/* Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("vatCompliance")}
              className={`w-full p-4 flex items-center justify-between transition-colors ${
                isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-green-900/30" : "bg-green-100"}`}>
                  <ShieldCheck size={20} className={isDarkMode ? "text-green-400" : "text-green-600"} />
                </div>
                <div className="text-left">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    UAE VAT Export Treatment
                  </h2>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    FTA Compliance - Article 45 UAE VAT Law
                  </p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`transform transition-transform ${isDarkMode ? "text-gray-400" : "text-gray-500"} ${
                  expandedSections.vatCompliance ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Section Content */}
            {expandedSections.vatCompliance && (
              <div className="px-4 pb-4">
                {/* Main VAT Treatment Box */}
                <div
                  className={`border-l-4 border-green-500 p-4 rounded-r-lg ${
                    isDarkMode ? "bg-green-900/20" : "bg-green-50"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export VAT Treatment */}
                    <div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>VAT Treatment</div>
                      <p
                        className={`font-semibold text-lg ${
                          orderData.exportVatTreatment === "zero_rated"
                            ? "text-green-600"
                            : isDarkMode
                              ? "text-white"
                              : "text-gray-900"
                        }`}
                      >
                        {VAT_TREATMENT_LABELS[orderData.exportVatTreatment] || orderData.exportVatTreatment}
                      </p>
                    </div>

                    {/* Export Type */}
                    <div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Export Type</div>
                      <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {orderData.exportType || "Direct Export"}
                      </p>
                    </div>

                    {/* Form 201 Box Mapping */}
                    <div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Form 201 VAT Return Mapping
                      </div>
                      <p
                        className={`font-mono px-3 py-1.5 rounded inline-block mt-1 ${
                          isDarkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        Box 2: AED {formatNumber(zeroRatedValueAed)}
                      </p>
                    </div>

                    {/* Designated Zone Origin (if applicable) */}
                    {orderData.isDesignatedZoneExport && orderData.designatedZoneOrigin && (
                      <div>
                        <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Designated Zone Origin
                        </div>
                        <p
                          className={`font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          <Flag size={14} />
                          {orderData.designatedZoneOrigin}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Zero-Rated Export Notice */}
                  {orderData.exportVatTreatment === "zero_rated" && (
                    <div
                      className={`mt-4 p-3 rounded-lg flex items-start gap-3 ${
                        isDarkMode ? "bg-green-900/30 border border-green-700" : "bg-green-100 border border-green-300"
                      }`}
                    >
                      <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? "text-green-300" : "text-green-800"}`}>
                          Zero-Rated Export Supply
                        </p>
                        <p className={`text-sm mt-1 ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
                          This export qualifies for 0% VAT under UAE VAT Law Article 45. Ensure all export documentation
                          (customs declaration, BOL, proof of export) is retained for FTA audit purposes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Re-Export Section (conditional) */}
                {orderData.isReExport && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      isDarkMode ? "bg-yellow-900/20 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection("reExport")}
                      className="w-full flex items-center justify-between"
                    >
                      <h4
                        className={`font-semibold flex items-center gap-2 ${
                          isDarkMode ? "text-yellow-400" : "text-yellow-700"
                        }`}
                      >
                        <AlertTriangle size={18} />
                        Re-Export Details
                      </h4>
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform ${
                          isDarkMode ? "text-yellow-400" : "text-yellow-600"
                        } ${expandedSections.reExport ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expandedSections.reExport && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Original Import BOE
                          </div>
                          <p className={`font-mono font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {orderData.originalImportBoe || "N/A"}
                          </p>
                        </div>
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Original Import Date
                          </div>
                          <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatDate(orderData.originalImportDate)}
                          </p>
                        </div>
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Original Import Value
                          </div>
                          <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(orderData.originalImportValue, orderData.currency)}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className={`text-xs mt-3 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                      * Re-exported goods must be linked to original import documentation for VAT recovery purposes
                    </p>
                  </div>
                )}

                {/* GCC Export Section (conditional) */}
                {(orderData.isGccExport || isGCC) && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      isDarkMode ? "bg-purple-900/20 border border-purple-700" : "bg-purple-50 border border-purple-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection("gcc")}
                      className="w-full flex items-center justify-between"
                    >
                      <h4
                        className={`font-semibold flex items-center gap-2 ${
                          isDarkMode ? "text-purple-400" : "text-purple-700"
                        }`}
                      >
                        <Globe size={18} />
                        GCC Export Details
                      </h4>
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform ${
                          isDarkMode ? "text-purple-400" : "text-purple-600"
                        } ${expandedSections.gcc ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expandedSections.gcc && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>GCC Country</div>
                          <p
                            className={`font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                          >
                            <span className="text-lg">
                              {getCountryFlag(orderData.gccCountryCode || orderData.destinationCountryCode)}
                            </span>
                            {orderData.gccCountryCode || orderData.destinationCountryCode || "N/A"}
                          </p>
                        </div>
                        {orderData.customerGccVatId && (
                          <div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Customer GCC VAT ID
                            </div>
                            <p
                              className={`font-mono font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {orderData.customerGccVatId}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(orderData.customerGccVatId, "gccVatId")}
                                className={`p-1 rounded transition-colors ${
                                  copiedField === "gccVatId"
                                    ? "text-green-500"
                                    : isDarkMode
                                      ? "text-gray-400 hover:text-gray-300"
                                      : "text-gray-500 hover:text-gray-700"
                                }`}
                                title="Copy VAT ID"
                              >
                                {copiedField === "gccVatId" ? <CheckCircle size={14} /> : <Copy size={14} />}
                              </button>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-xs mt-3 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                      * GCC exports may have special VAT treatment under inter-GCC trade agreements
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================
              F. CURRENCY & EXCHANGE RATE CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <DollarSign size={20} className="text-teal-600" />
              Currency & Exchange Rate
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Currency</p>
                <p className={`font-semibold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {orderData.currency}
                </p>
              </div>

              {orderData.currency !== "AED" && (
                <>
                  <div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Exchange Rate</p>
                    <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      1 {orderData.currency} = {formatNumber(orderData.exchangeRate, 4)} AED
                    </p>
                  </div>

                  {orderData.exchangeRateSource && (
                    <div>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Rate Source</p>
                      <p className={`font-medium capitalize ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {orderData.exchangeRateSource.replace(/_/g, " ")}
                      </p>
                    </div>
                  )}

                  {orderData.exchangeRateDate && (
                    <div>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Rate Date</p>
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {formatDateShort(orderData.exchangeRateDate)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {orderData.exchangeRateReference && (
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Rate Reference</p>
                  <p className={`font-mono text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {orderData.exchangeRateReference}
                  </p>
                </div>
              )}
            </div>

            {/* Exchange Rate Audit Note */}
            {orderData.currency !== "AED" && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  <Info size={14} className="inline mr-1" />
                  Exchange rate documentation is retained for FTA audit compliance.
                  {orderData.exchangeRateSource === "uae_central_bank" &&
                    " UAE Central Bank rates are the FTA-preferred source for VAT reporting."}
                </p>
              </div>
            )}
          </div>

          {/* ========================================
              G. LINE ITEMS TABLE
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Package size={20} className="text-teal-600" />
              Line Items
              <span className={`text-sm font-normal ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                ({orderData.items.length} {orderData.items.length === 1 ? "item" : "items"})
              </span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Product
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Description
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      HS Code
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Origin
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Qty
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Unit
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Unit Price
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {orderData.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No items in this order
                      </td>
                    </tr>
                  ) : (
                    orderData.items.map((item, index) => {
                      const productName =
                        item.productName || item.product_name || item.name || item.description || "N/A";
                      const description = item.description || item.specification || item.specs || "-";
                      const hsCode = item.hsCode || item.hs_code || "-";
                      const countryOfOrigin = item.countryOfOrigin || item.country_of_origin || item.origin || "-";
                      const quantity = item.quantity || item.qty || 0;
                      const unit = item.unit || "MT";
                      const unitPrice = item.unitPrice || item.unit_price || item.price || 0;
                      const lineTotal = item.total || item.lineTotal || item.line_total || quantity * unitPrice;
                      const originalImportItemId = item.originalImportItemId || item.original_import_item_id;

                      return (
                        <tr
                          key={item.id || index}
                          className={`${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-3">
                            <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {productName}
                            </div>
                            {originalImportItemId && (
                              <div className={`text-xs mt-1 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                                <Link
                                  to={`/import-orders/item/${originalImportItemId}`}
                                  className="hover:underline inline-flex items-center gap-1"
                                >
                                  Re-export from import
                                  <ExternalLink size={10} />
                                </Link>
                              </div>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {description !== productName ? description : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-mono px-2 py-0.5 rounded ${
                                hsCode !== "-"
                                  ? isDarkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-100 text-gray-700"
                                  : isDarkMode
                                    ? "text-gray-500"
                                    : "text-gray-400"
                              }`}
                            >
                              {hsCode}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {countryOfOrigin !== "-" && (
                              <span className="inline-flex items-center gap-1">
                                {getCountryFlag(countryOfOrigin)}
                                {countryOfOrigin}
                              </span>
                            )}
                            {countryOfOrigin === "-" && "-"}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {formatNumber(quantity, 2)}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {unit}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {formatCurrency(unitPrice, orderData.currency)}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-right font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {formatCurrency(lineTotal, orderData.currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================
              I. EXPORT DOCUMENTATION CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <FileCheck size={20} className="text-teal-600" />
              Export Documentation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {orderData.exportDeclarationNumber && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Export Declaration Number
                  </p>
                  <p
                    className={`font-mono font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <Clipboard size={14} />
                    {orderData.exportDeclarationNumber}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderData.exportDeclarationNumber, "exportDecl")}
                      className={`p-1 rounded transition-colors ${
                        copiedField === "exportDecl"
                          ? "text-green-500"
                          : isDarkMode
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {copiedField === "exportDecl" ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </button>
                  </p>
                  {orderData.exportDeclarationDate && (
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Date: {formatDateShort(orderData.exportDeclarationDate)}
                    </p>
                  )}
                </div>
              )}

              {orderData.certificateOfOrigin && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Certificate of Origin</p>
                  <p
                    className={`font-mono font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <Award size={14} />
                    {orderData.certificateOfOrigin}
                  </p>
                </div>
              )}

              {orderData.commercialInvoiceNumber && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Commercial Invoice Number
                  </p>
                  <p
                    className={`font-mono font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <FileSpreadsheet size={14} />
                    {orderData.commercialInvoiceNumber}
                  </p>
                </div>
              )}

              {orderData.billOfLading && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Bill of Lading</p>
                  <p
                    className={`font-mono font-medium flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <Ship size={14} />
                    {orderData.billOfLading}
                  </p>
                </div>
              )}
            </div>

            {/* Document Tabs */}
            <div className={`border-t pt-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex flex-wrap gap-2 mb-4">
                {DOCUMENT_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeDocTab === tab.id;
                  const docCount = orderData.documents.filter(
                    (d) => d.category === tab.id || (!d.category && tab.id === "export")
                  ).length;

                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveDocTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-teal-600 text-white"
                          : isDarkMode
                            ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <TabIcon size={16} />
                      {tab.label}
                      {docCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            isActive
                              ? "bg-teal-500 text-white"
                              : isDarkMode
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {docCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Document List */}
              <div className="space-y-2">
                {orderData.documents.filter(
                  (doc) => doc.category === activeDocTab || (!doc.category && activeDocTab === "export")
                ).length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No documents in this category</p>
                  </div>
                ) : (
                  orderData.documents
                    .filter((doc) => doc.category === activeDocTab || (!doc.category && activeDocTab === "export"))
                    .map((doc, index) => (
                      <div
                        key={doc.id || index}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {doc.name || doc.fileName || doc.file_name}
                            </p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {doc.uploadedAt || doc.uploaded_at
                                ? formatDateShort(doc.uploadedAt || doc.uploaded_at)
                                : "Uploaded"}
                              {doc.size && ` - ${(doc.size / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-600"
                            }`}
                            title="View"
                            onClick={() => {
                              // TODO: Implement document view
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-600"
                            }`}
                            title="Download"
                            onClick={() => {
                              // TODO: Implement document download
                            }}
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* ========================================
              J. STATUS TIMELINE
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection("timeline")}
              className={`w-full flex items-center justify-between mb-4`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <TrendingUp size={20} className="text-teal-600" />
                Order Progress Timeline
              </h2>
              <ChevronDown
                size={20}
                className={`transform transition-transform ${isDarkMode ? "text-gray-400" : "text-gray-500"} ${
                  expandedSections.timeline ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {STATUS_ORDER.map((statusKey, index) => {
                  const config = getStatusConfig(statusKey);
                  const Icon = config.icon;
                  const currentIndex = STATUS_ORDER.indexOf(orderData.status);
                  const isActive = index <= currentIndex;
                  const isCurrent = statusKey === orderData.status;

                  return (
                    <div key={statusKey} className="flex flex-col items-center relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isCurrent
                            ? "bg-teal-600 text-white ring-4 ring-teal-200"
                            : isActive
                              ? isDarkMode
                                ? config.bgDark
                                : config.bgLight
                              : isDarkMode
                                ? "bg-gray-700"
                                : "bg-gray-200"
                        }`}
                      >
                        <Icon
                          size={14}
                          className={
                            isCurrent
                              ? "text-white"
                              : isActive
                                ? isDarkMode
                                  ? config.textDark
                                  : config.textLight
                                : isDarkMode
                                  ? "text-gray-500"
                                  : "text-gray-400"
                          }
                        />
                      </div>
                      <p
                        className={`text-xs mt-1 text-center max-w-[60px] ${
                          isCurrent ? "font-semibold text-teal-600" : isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {config.label}
                      </p>
                      {/* Connector Line */}
                      {index < STATUS_ORDER.length - 1 && (
                        <div
                          className={`absolute top-4 left-8 w-full h-0.5 -translate-y-1/2 ${
                            index < currentIndex ? "bg-teal-500" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                          style={{ width: "calc(100% - 16px)", left: "24px" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Timeline (Expandable) */}
            {expandedSections.timeline && (
              <div className={`pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="space-y-4">
                  {orderData.statusHistory.length === 0 ? (
                    <div className={`text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No status history recorded yet</p>
                    </div>
                  ) : (
                    orderData.statusHistory.map((entry, index) => {
                      const entryConfig = getStatusConfig(entry.status);
                      const EntryIcon = entryConfig.icon;
                      return (
                        <div key={entry.id || entry.name || `entry-${index}`} className="flex gap-3">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isDarkMode ? entryConfig.bgDark : entryConfig.bgLight
                            }`}
                          >
                            <EntryIcon
                              size={14}
                              className={isDarkMode ? entryConfig.textDark : entryConfig.textLight}
                            />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              Status changed to {entryConfig.label}
                            </p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {formatDateTime(entry.timestamp || entry.date || entry.createdAt)}
                              {entry.user && ` by ${entry.user}`}
                            </p>
                            {entry.notes && (
                              <p
                                className={`text-xs mt-1 p-2 rounded ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-600"}`}
                              >
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Created entry */}
                  {orderData.createdAt && (
                    <div className="flex gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      >
                        <FileText size={14} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Order created
                        </p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDateTime(orderData.createdAt)}
                          {orderData.createdBy && ` by ${orderData.createdBy}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================
              K. NOTES & HISTORY
              ======================================== */}
          {orderData.notes && (
            <div
              className={`p-6 rounded-xl border ${
                isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <FileText size={20} className="text-teal-600" />
                Internal Notes
              </h2>
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                <p className={`text-sm whitespace-pre-wrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {orderData.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================
            RIGHT COLUMN - TOTALS & SUMMARY
            ======================================== */}
        <div className="space-y-6">
          {/* ========================================
              H. TOTALS CARD
              ======================================== */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <DollarSign size={20} className="text-teal-600" />
              Order Totals
            </h2>

            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Subtotal</span>
                <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(orderData.subtotal, orderData.currency)}
                </span>
              </div>

              {/* VAT Amount */}
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>VAT Amount</span>
                <div className="text-right">
                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(orderData.vatAmount, orderData.currency)}
                  </span>
                  {orderData.exportVatTreatment === "zero_rated" && (
                    <p className="text-xs text-green-600">(Zero-Rated Export)</p>
                  )}
                </div>
              </div>

              <hr className={isDarkMode ? "border-gray-700" : "border-gray-200"} />

              {/* Grand Total */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-50"}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${isDarkMode ? "text-teal-300" : "text-teal-800"}`}>Total</span>
                  <span className={`text-xl font-bold ${isDarkMode ? "text-teal-300" : "text-teal-800"}`}>
                    {formatCurrency(orderData.total, orderData.currency)}
                  </span>
                </div>
                {orderData.currency !== "AED" && (
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>Total in AED</span>
                    <span className={`font-semibold ${isDarkMode ? "text-teal-300" : "text-teal-700"}`}>
                      {formatCurrency(totalAed, "AED")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================
              FORM 201 VAT RETURN SUMMARY BOX
              ======================================== */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"
            }`}
          >
            <h4 className={`font-bold flex items-center gap-2 mb-3 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
              <FileSpreadsheet size={18} />
              FTA Form 201 VAT Return Mapping
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? "text-blue-200" : "text-blue-700"}`}>
                  Box 2 - Zero-Rated Supplies:
                </span>
                <span className={`font-mono font-bold ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>
                  AED {formatNumber(zeroRatedValueAed)}
                </span>
              </div>

              <div className={`pt-3 border-t ${isDarkMode ? "border-blue-700" : "border-blue-200"}`}>
                <p className={`text-xs ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}>
                  UAE VAT Law Article 45 - Exports of goods outside GCC implementing states are zero-rated. Ensure
                  export evidence (customs declaration, bill of lading, proof of export) is retained.
                </p>
              </div>

              {isGCC && (
                <div
                  className={`p-2 rounded-lg text-xs ${
                    isDarkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  <strong>Note:</strong> GCC export - verify customer VAT registration status in destination country.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGenerateInvoice}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <FileSpreadsheet size={18} className="text-teal-600" />
                <div>
                  <p className="font-medium">Generate Export Invoice</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Create commercial invoice
                  </p>
                </div>
                <ArrowUpRight size={16} className="ml-auto opacity-50" />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Printer size={18} className="text-teal-600" />
                <div>
                  <p className="font-medium">Print Order</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Print-friendly version</p>
                </div>
                <ArrowUpRight size={16} className="ml-auto opacity-50" />
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Download size={18} className="text-teal-600" />
                <div>
                  <p className="font-medium">Export to PDF</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Download as PDF file</p>
                </div>
                <ArrowUpRight size={16} className="ml-auto opacity-50" />
              </button>
            </div>
          </div>

          {/* Activity Timeline - Compact View */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Clock size={20} className="text-teal-600" />
              Recent Activity
            </h3>

            <div className="space-y-3">
              {orderData.statusHistory.slice(0, 3).map((entry, index) => {
                const entryConfig = getStatusConfig(entry.status);
                const EntryIcon = entryConfig.icon;
                return (
                  <div key={entry.id || entry.name || `entry-${index}`} className="flex gap-3 items-start">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isDarkMode ? entryConfig.bgDark : entryConfig.bgLight
                      }`}
                    >
                      <EntryIcon size={12} className={isDarkMode ? entryConfig.textDark : entryConfig.textLight} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>{entryConfig.label}</p>
                      <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDateShort(entry.timestamp || entry.date)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {orderData.statusHistory.length === 0 && orderData.createdAt && (
                <div className="flex gap-3 items-start">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <FileText size={12} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order created</p>
                    <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatDateShort(orderData.createdAt)}
                    </p>
                  </div>
                </div>
              )}

              {orderData.statusHistory.length > 3 && (
                <button
                  type="button"
                  onClick={() => toggleSection("timeline")}
                  className={`text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1`}
                >
                  View all activity
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          STATUS UPDATE NOTES MODAL
          ======================================== */}
      {showStatusNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}>
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Update Status
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusNotesModal(false);
                    setPendingStatus(null);
                    setStatusUpdateNotes("");
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {pendingStatus &&
                  (() => {
                    const pendingConfig = getStatusConfig(pendingStatus);
                    const PendingIcon = pendingConfig.icon;
                    return (
                      <>
                        <div
                          className={`p-2 rounded-full ${isDarkMode ? pendingConfig.bgDark : pendingConfig.bgLight}`}
                        >
                          <PendingIcon
                            size={20}
                            className={isDarkMode ? pendingConfig.textDark : pendingConfig.textLight}
                          />
                        </div>
                        <div>
                          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Update status to</p>
                          <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {pendingConfig.label}
                          </p>
                        </div>
                      </>
                    );
                  })()}
              </div>
              <label
                htmlFor="export-status-update-notes"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Notes (optional)
              </label>
              <textarea
                id="export-status-update-notes"
                value={statusUpdateNotes}
                onChange={(e) => setStatusUpdateNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>
            <div
              className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowStatusNotesModal(false);
                  setPendingStatus(null);
                  setStatusUpdateNotes("");
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusUpdate}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          CONFIRM DIALOG
          ======================================== */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* ========================================
          SUCCESS/ERROR NOTIFICATIONS
          ======================================== */}
      {error && (
        <div className="fixed top-4 right-4 z-50 print:hidden">
          <div
            className={`p-4 rounded-lg border shadow-lg max-w-md ${
              isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50 print:hidden">
          <div
            className={`p-4 rounded-lg border shadow-lg max-w-md ${
              isDarkMode
                ? "bg-green-900/20 border-green-700 text-green-300"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="flex-1">{success}</span>
              <button type="button" onClick={() => setSuccess(null)} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOrderDetails;
