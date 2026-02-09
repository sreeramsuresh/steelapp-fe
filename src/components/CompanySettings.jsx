import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Box,
  Briefcase,
  Building,
  Calculator,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Crown,
  DollarSign,
  Download,
  Edit,
  Eye,
  EyeOff,
  FilePlus,
  FileText,
  Globe,
  History,
  Key,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Save,
  Settings,
  Shield,
  ShoppingBag,
  Tag,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApi, useApiData } from "../hooks/useApi";
import FTAIntegrationSettings from "../pages/FTAIntegrationSettings";
import { apiClient as apiService } from "../services/api";
import { authService } from "../services/axiosAuthService";
import { companyService } from "../services/companyService";
import { notificationService } from "../services/notificationService";
import { roleService } from "../services/roleService";
import { userAdminAPI } from "../services/userAdminApi";
import vatRateService from "../services/vatRateService";
import ConfirmDialog from "./ConfirmDialog";
import InvoiceTemplateSettings from "./InvoiceTemplateSettings";
import ProductNamingHelpPanel from "./ProductNamingHelpPanel";
import RolesHelpPanel from "./RolesHelpPanel";
import PhoneInput from "./shared/PhoneInput";
import VATRulesHelpPanel from "./VATRulesHelpPanel";

// Custom Tailwind Components
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  startIcon,
  as = "button",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 ${
        isDarkMode ? "disabled:bg-gray-600 focus:ring-offset-gray-800" : "disabled:bg-gray-400 focus:ring-offset-white"
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:bg-gray-50 focus:ring-offset-white"
      } focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const Component = as;
  const componentProps = as === "button" ? { disabled, onClick, ...props } : { ...props };

  return (
    <Component
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? "cursor-not-allowed" : ""} ${className}`}
      {...componentProps}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
    </Component>
  );
};

const Input = ({ label, error, className = "", type = "text", startIcon, endIcon, id, ...props }) => {
  const { isDarkMode } = useTheme();
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {startIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full ${startIcon ? "pl-10" : "pl-3"} ${endIcon ? "pr-10" : "pr-3"} py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            isDarkMode
              ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          } ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {endIcon && <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{endIcon}</div>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const Select = ({ label, options, value, onChange, placeholder = "Select...", className = "", id }) => {
  const { isDarkMode } = useTheme();
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
        } ${className}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const SettingsPaper = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
        isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const SettingsCard = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-lg border transition-all duration-300 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={24} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />}
        <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-6 border-b last:border-b-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
      {title && (
        <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{title}</h4>
      )}
      {children}
    </div>
  );
};

const LogoContainer = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`w-40 h-40 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden ${
        isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-50"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const CircularProgress = ({ size = 20, className = "" }) => {
  return (
    <svg
      aria-label="icon"
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <title>Loading spinner</title>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows,
  startAdornment,
  endAdornment,
  error,
  helperText,
  disabled = false,
  readOnly = false,
  type = "text",
  className = "",
  id,
}) => {
  const { isDarkMode } = useTheme();
  const fieldId = id || `textfield-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={fieldId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {startAdornment && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{startAdornment}</div>
        )}
        {multiline ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows || 3}
            disabled={disabled}
            readOnly={readOnly}
            className={`w-full px-3 ${startAdornment ? "pl-10" : ""} ${endAdornment ? "pr-10" : ""} py-2 border rounded-lg resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? "border-red-500" : isDarkMode ? "border-gray-600" : "border-gray-300"
            } ${
              isDarkMode ? "bg-gray-800 text-white placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${readOnly ? (isDarkMode ? "bg-gray-700/50 cursor-default border-dashed" : "bg-gray-100 cursor-default border-dashed") : ""} ${className}`}
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={`w-full px-3 ${startAdornment ? "pl-10" : ""} ${endAdornment ? "pr-10" : ""} py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? "border-red-500" : isDarkMode ? "border-gray-600" : "border-gray-300"
            } ${
              isDarkMode ? "bg-gray-800 text-white placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${readOnly ? (isDarkMode ? "bg-gray-700/50 cursor-default border-dashed" : "bg-gray-100 cursor-default border-dashed") : ""} ${className}`}
          />
        )}
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">{endAdornment}</div>
        )}
      </div>
      {helperText && (
        <p className={`text-sm ${error ? "text-red-500" : isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// Checkbox component removed - unused

const Switch = ({ checked, onChange, label, disabled = false }) => {
  const { isDarkMode } = useTheme();

  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-200 ${
            checked ? "bg-teal-600" : isDarkMode ? "bg-gray-700" : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
              checked ? "transform translate-x-4" : ""
            }`}
          />
        </div>
      </div>
      {label && <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</span>}
    </label>
  );
};

const CompanySettings = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null, // 'logo', 'brandmark', 'seal', 'vat', 'user', 'role'
    itemId: null,
    itemName: null,
  });

  // Role icon mapping
  const getRoleIcon = (roleName) => {
    const name = (roleName || "").toLowerCase().replace(/\s+/g, "_");
    const iconMap = {
      managing_director: Crown,
      operations_manager: Activity,
      finance_manager: DollarSign,
      sales_manager: TrendingUp,
      purchase_manager: ShoppingBag,
      warehouse_manager: Warehouse,
      accounts_manager: Calculator,
      sales_executive: Users,
      purchase_executive: ClipboardList,
      stock_keeper: Box,
      accounts_executive: Receipt,
      logistics_coordinator: Truck,
    };
    return iconMap[name] || Briefcase;
  };

  // Permission action icon mapping
  const getPermissionIcon = (permissionKey) => {
    const key = (permissionKey || "").toLowerCase();
    if (key.includes("create") || key.includes("add")) return FilePlus;
    if (key.includes("edit") || key.includes("update")) return Pencil;
    if (key.includes("delete") || key.includes("remove")) return Trash2;
    if (key.includes("view") || key.includes("read")) return Eye;
    if (key.includes("approve")) return ThumbsUp;
    if (key.includes("export")) return Download;
    if (key.includes("print")) return Printer;
    if (key.includes("manage") || key.includes("access")) return Key;
    return Shield;
  };

  const {
    data: companyData,
    loading: _loadingCompany,
    refetch: refetchCompany,
  } = useApiData(companyService.getCompany, []);

  const { execute: updateCompany, loading: updatingCompany } = useApi(companyService.updateCompany);
  const { execute: uploadLogo, loading: uploadingLogo } = useApi(companyService.uploadLogo);
  const { execute: deleteLogo } = useApi(companyService.deleteLogo);
  const { execute: deleteBrandmark } = useApi(companyService.deleteBrandmark);
  const { execute: deleteSeal } = useApi(companyService.deleteSeal);

  // Upload functions called directly, not through useApi hook
  const [uploadingBrandmark, setUploadingBrandmark] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);

  const logoInputRef = useRef(null);
  const brandmarkInputRef = useRef(null);
  const sealInputRef = useRef(null);

  const [companyProfile, setCompanyProfile] = useState({
    name: "",
    address: "",
    city: "",
    country: "India",
    phone: "",
    email: "",
    website: "",
    vatNumber: "",
    logo: null,
    bankDetails: {
      bankName: "",
      accountNumber: "",
      iban: "",
    },
    documentImageSettings: {
      invoice: { showLogo: true, showSeal: true },
      quotation: { showLogo: true, showSeal: false },
      purchaseOrder: { showLogo: true, showSeal: true },
      creditNote: { showLogo: false, showSeal: true },
      deliveryNote: { showLogo: true, showSeal: false },
      paymentReceipt: { showLogo: true, showSeal: true },
      accountStatement: { showLogo: false, showSeal: false },
    },
  });

  useEffect(() => {
    if (companyData) {
      // console.log('Loading company data:', companyData);

      // Extract address fields from JSONB or keep as string for backwards compatibility
      const addressData = companyData.address;
      let addressStr = "";
      let city = "";
      let country = "";

      if (typeof addressData === "object" && addressData !== null) {
        addressStr = addressData.street || "";
        city = addressData.city || "";
        country = addressData.country || "";
      } else if (typeof addressData === "string") {
        addressStr = addressData;
      }

      // Map API fields to component state (API returns camelCase)
      const mappedData = {
        ...companyData,
        address: addressStr,
        city,
        country,
        website: companyData.website || "",
        // Logos - API returns camelCase, treat empty strings as null
        logoUrl: companyData.logoUrl || null,
        brandmarkUrl: companyData.brandmarkUrl || null,
        pdfLogoUrl: companyData.pdfLogoUrl || null,
        pdfSealUrl: companyData.pdfSealUrl || null,
        bankDetails: {
          bankName: companyData.bankDetails?.bankName || "",
          accountNumber: companyData.bankDetails?.accountNumber || "",
          iban: companyData.bankDetails?.iban || "",
        },
        // Load document image settings from API (nested in settings object)
        documentImageSettings: companyData.settings?.documentImages || {
          invoice: { showLogo: true, showSeal: true },
          quotation: { showLogo: true, showSeal: false },
          purchaseOrder: { showLogo: true, showSeal: true },
          creditNote: { showLogo: false, showSeal: true },
          deliveryNote: { showLogo: true, showSeal: false },
          paymentReceipt: { showLogo: true, showSeal: true },
          accountStatement: { showLogo: false, showSeal: false },
        },
      };

      // console.log('Mapped company profile:', mappedData);
      // console.log('Logo URL:', mappedData.logoUrl);
      setCompanyProfile(mappedData);
    }
  }, [companyData]);

  const [vatRates, setVatRates] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState({
    open: false,
    user: null,
  });
  const [showAddVatModal, setShowAddVatModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
    permissions: {
      invoices: { create: false, read: false, update: false, delete: false },
      customers: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: false, update: false, delete: false },
      analytics: { read: false },
      settings: { read: false, update: false },
      payables: { create: false, read: false, update: false, delete: false },
      invoices_all: {
        create: false,
        read: false,
        update: false,
        delete: false,
      },
      quotations: { create: false, read: false, update: false, delete: false },
      delivery_notes: {
        create: false,
        read: false,
        update: false,
        delete: false,
      },
      purchase_orders: {
        create: false,
        read: false,
        update: false,
        delete: false,
      },
    },
  });

  // RBAC State
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [showManageRolesModal, setShowManageRolesModal] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    isDirector: false,
  });
  const [customPermissionModal, setCustomPermissionModal] = useState({
    open: false,
    userId: null,
  });
  const [auditLogModal, setAuditLogModal] = useState({
    open: false,
    userId: null,
    logs: [],
  });
  const [viewPermissionsModal, setViewPermissionsModal] = useState({
    open: false,
    userId: null,
    userName: "",
    rolePermissions: [],
    customGrants: [],
    loading: false,
  });
  const [isDirector, setIsDirector] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [customPermission, setCustomPermission] = useState({
    permission_keys: [], // Changed to array for multiple selections
    reason: "",
    expires_at: null,
  });
  const [permissionSearch, setPermissionSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState({});

  // Password change modal state
  const [passwordChangeModal, setPasswordChangeModal] = useState({
    open: false,
    userId: null,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    loading: false,
    error: null,
  });

  const [newVatRate, setNewVatRate] = useState({
    name: "",
    rate: "",
    type: "percentage",
    description: "",
    active: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  // User management filters and validation
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userValidationErrors, setUserValidationErrors] = useState({});
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // User list pagination and error handling
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize] = useState(20);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userLoadingError, setUserLoadingError] = useState(null);

  // Product naming system - templates handled in renderProductNamingSystem()

  // Printing settings state
  const [printingSettings, setPrintingSettings] = useState({
    receipt_size: "A5",
    print_on_paper_size: "A4",
    receipt_printer: "default",
    invoice_printer: "default",
    receipt_copies: 1,
    invoice_copies: 1,
    auto_print_receipts: false,
    auto_print_invoices: false,
  });

  const [savingPrintingSettings, setSavingPrintingSettings] = useState(false);

  // Image section collapse state
  const [imagesExpanded, setImagesExpanded] = useState(false);

  // Product Naming Templates State (must be at top level for hooks)
  const [displayTemplates, setDisplayTemplates] = useState({
    product_dropdown_template: "{unique_name}",
    document_line_template: "{unique_name}",
    report_template: "{unique_name}",
  });
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [sampleProduct, _setSampleProduct] = useState({
    grade: "316",
    form: "Sheet",
    finish: "2B",
    width: "1220",
    thickness: "1.5",
    length: "2440",
    origin: "UAE",
    mill: "Emirates Steel",
  });
  const [productVerificationStatus, _setProductVerificationStatus] = useState({});

  // Formatters
  const formatDateTime = (value) => {
    if (!value) return "Never";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString("en-AE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  };
  const formatDateOnly = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString("en-AE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return String(value);
    }
  };

  // Permission module label mapping - currently unused
  // const moduleLabel = (module) => {
  //   const map = {
  //     invoices: 'Create Invoices',
  //     invoices_all: 'All Invoices',
  //     purchase_orders: 'Purchase Orders',
  //     delivery_notes: 'Delivery Notes',
  //     quotations: 'Quotations',
  //     payables: 'Payables',
  //   };
  //   return map[module] || module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // };

  // User validation helpers
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password && password.length >= 8;
  };

  const validateUserForm = (user, isEdit = false) => {
    const errors = {};

    if (!user.name || user.name.trim().length === 0) {
      errors.name = "Name is required";
    }

    if (!user.email || user.email.trim().length === 0) {
      errors.email = "Email is required";
    } else if (!validateEmail(user.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!isEdit) {
      if (!user.password || user.password.length === 0) {
        errors.password = "Password is required";
      } else if (!validatePassword(user.password)) {
        errors.password = "Password must be at least 8 characters";
      }
    }

    if (selectedUserRoles.length === 0) {
      errors.roles = "Please assign at least one role";
    }

    return errors;
  };

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.roles?.some((role) => role.displayName?.toLowerCase().includes(searchLower))
    );
  });

  // Set up theme integration for notifications
  useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);

  // Template styles - currently unused
  // const templateStyles = [
  //   { id: 'modern', name: 'Modern', description: 'Clean and professional design' },
  //   { id: 'classic', name: 'Classic', description: 'Traditional business format' },
  //   { id: 'minimal', name: 'Minimal', description: 'Simple and elegant layout' },
  //   { id: 'detailed', name: 'Detailed', description: 'Comprehensive information display' },
  // ];

  // User roles - currently unused (using RBAC instead)
  // const userRoles = [
  //   { id: 'admin', name: 'Administrator', description: 'Full system access' },
  //   { id: 'manager', name: 'Manager', description: 'Manage operations and view reports' },
  //   { id: 'user', name: 'User', description: 'Basic access to create invoices' },
  //   { id: 'viewer', name: 'Viewer', description: 'Read-only access' },
  // ];

  // Load VAT rates once on mount
  useEffect(() => {
    (async () => {
      try {
        const rates = await vatRateService.getAll();
        // Transform database format to match component format
        if (rates && Array.isArray(rates)) {
          const transformedRates = rates.map((rate) => ({
            id: String(rate.id),
            name: rate.name,
            rate: Number(rate.rate),
            type: rate.type,
            description: rate.description,
            active: rate.isActive,
          }));
          setVatRates(transformedRates);
        } else {
          console.warn("VAT rates response is not an array:", rates);
          setVatRates([]);
        }
      } catch (error) {
        console.error("Error loading VAT rates:", error);
        notificationService.error("Failed to load VAT rates");
        setVatRates([]);
      }
    })();
  }, []); // Run once on mount - vatRateService and notificationService are stable imports

  // Load users with pagination
  useEffect(() => {
    (async () => {
      try {
        const response = await userAdminAPI.list({
          page: userCurrentPage,
          limit: userPageSize,
        });

        // Handle both array response and paginated response format
        const remoteUsers = Array.isArray(response) ? response : response.data || [];
        const pageInfo = response.page_info || { total_pages: 1 };

        const mapped = remoteUsers.map((u) => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status || "active",
          createdAt: (u.createdAt || u.createdAt || "").toString().substring(0, 10),
          lastLogin: u.lastLogin || u.lastLogin || null,
          permissions: typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions || {},
        }));
        setUsers(mapped);
        setUserTotalPages(pageInfo.total_pages || 1);
        setUserLoadingError(null);
      } catch (e) {
        const errorMsg = e?.response?.data?.message || e?.message || "Failed to load users from backend";
        console.warn("Failed to load users from backend:", errorMsg);
        setUsers([]);
        setUserTotalPages(1);
        setUserLoadingError(errorMsg);
        notificationService.error(`User Management: ${errorMsg}`);
      }
    })();
  }, [userCurrentPage, userPageSize]); // Load when page changes

  // Reset pagination when search term changes
  useEffect(() => {
    setUserCurrentPage(1);
  }, []);

  // Load printing settings once on mount
  useEffect(() => {
    (async () => {
      try {
        const settings = await apiService.get("/company/printing-settings");
        if (settings) {
          setPrintingSettings(settings);
        }
      } catch (error) {
        console.error("Error loading printing settings:", error);
        // Use defaults if error
      }
    })();
  }, []); // Run once on mount

  // Fetch printing settings when printing tab is active
  useEffect(() => {
    if (activeTab === "printing") {
      (async () => {
        try {
          const settings = await apiService.get("/company/printing-settings");
          if (settings) {
            setPrintingSettings(settings);
          }
        } catch (error) {
          console.error("Error loading printing settings:", error);
          notificationService.error("Failed to load printing settings");
        }
      })();
    }
  }, [activeTab]);

  // Load RBAC data (roles, permissions, check if director)
  useEffect(() => {
    if (activeTab === "users") {
      (async () => {
        try {
          // Fetch available roles
          const roles = await roleService.getAvailableRoles();
          setAvailableRoles(roles);

          // Fetch all permissions
          const permissions = await roleService.getAllPermissions();
          setAllPermissions(permissions);

          // Check if current user is Director
          const currentUser = authService.getUser();
          if (currentUser?.id) {
            const userPermissions = await roleService.getUserPermissions(currentUser.id);
            setIsDirector(userPermissions.isDirector || false);
          }
        } catch (error) {
          console.error("Error loading RBAC data:", error);
          notificationService.error("Failed to load role configuration");
        }
      })();
    }
  }, [activeTab]);

  // Role Management Handlers
  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const roles = await roleService.getRoles();
      setAvailableRoles(roles);
    } catch (error) {
      console.error("Error loading roles:", error);
      notificationService.error("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Load roles when Manage Roles modal opens
  useEffect(() => {
    if (showManageRolesModal) {
      loadRoles();
    }
  }, [showManageRolesModal, loadRoles]);

  // Load product naming templates from company data
  useEffect(() => {
    if (companyData) {
      setDisplayTemplates({
        product_dropdown_template: companyData.product_dropdown_template || "{unique_name}",
        document_line_template: companyData.document_line_template || "{unique_name}",
        report_template: companyData.report_template || "{unique_name}",
      });
    }
  }, [companyData]);

  const saveCompanyProfile = async () => {
    try {
      // Validate required fields
      if (!companyProfile.name || companyProfile.name.trim() === "") {
        notificationService.warning("Company name is required");
        return;
      }

      const updateData = {
        name: companyProfile.name.trim().replace(/\s+/g, " "),
        address: {
          street: companyProfile.address || "",
          city: companyProfile.city || "",
          country: companyProfile.country || "UAE",
        },
        phone: companyProfile.phone || "",
        email: companyProfile.email || "",
        website: companyProfile.website || "",
        vat_number: "104858252000003",
        logo_url: companyProfile.logoUrl || null,
        brandmark_url: companyProfile.brandmarkUrl || null,
        pdf_logo_url: companyProfile.pdfLogoUrl || null,
        pdf_seal_url: companyProfile.pdfSealUrl || null,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
        settings: {
          documentImages: companyProfile.documentImageSettings || {
            invoice: { showLogo: true, showSeal: true },
            quotation: { showLogo: true, showSeal: false },
            purchaseOrder: { showLogo: true, showSeal: true },
            creditNote: { showLogo: false, showSeal: true },
            deliveryNote: { showLogo: true, showSeal: false },
            paymentReceipt: { showLogo: true, showSeal: true },
            accountStatement: { showLogo: false, showSeal: false },
          },
        },
      };

      // console.log('Sending company data:', updateData);

      await updateCompany(updateData);
      notificationService.success("Company profile saved successfully!");
      refetchCompany();
    } catch (error) {
      console.error("Error saving company profile:", error);
      notificationService.error("Failed to save company profile. Please try again.");
    }
  };

  // Invoice settings save function - currently unused (using InvoiceTemplateSettings component)
  // const saveInvoiceSettings = async () => {
  //   try {
  //     const templateData = {
  //       template_name: 'Default',
  //       template_style: invoiceSettings.templateStyle,
  //       primary_color: invoiceSettings.primaryColor,
  //       show_logo: invoiceSettings.showLogo,
  //       show_bank_details: invoiceSettings.showBankDetails,
  //       invoice_number_format: invoiceSettings.invoiceNumberFormat,
  //       default_due_days: invoiceSettings.dueDays === '' ? 30 : Number(invoiceSettings.dueDays),
  //       footer_text: invoiceSettings.footer,
  //       terms_and_conditions: invoiceSettings.terms,
  //       is_default: true,
  //     };
  //
  //     if (templatesData && templatesData.length > 0) {
  //       const defaultTemplate = templatesData.find(t => t.isDefault) || templatesData[0];
  //       await updateTemplate(defaultTemplate.id, templateData);
  //     } else {
  //       await createTemplate(templateData);
  //     }
  //
  //     notificationService.success('Invoice settings saved successfully!');
  //     refetchTemplates();
  //   } catch (error) {
  //     console.error('Error saving invoice settings:', error);
  //     notificationService.error('Failed to save invoice settings. Please try again.');
  //   }
  // };

  // No longer needed - using database directly
  // const saveVatRates = () => {
  //   localStorage.setItem('steel-app-vat-rates', JSON.stringify(vatRates));
  // };

  // const saveUsers = () => {}; // Unused - users are saved via API directly

  const savePrintingSettings = async () => {
    try {
      setSavingPrintingSettings(true);

      await apiService.put("/company/printing-settings", printingSettings);

      notificationService.success("Printing settings saved successfully");
    } catch (error) {
      console.error("Error saving printing settings:", error);
      notificationService.error("Failed to save printing settings");
    } finally {
      setSavingPrintingSettings(false);
    }
  };

  const resetPrintingSettings = () => {
    setPrintingSettings({
      receipt_size: "A5",
      print_on_paper_size: "A4",
      receipt_printer: "default",
      invoice_printer: "default",
      receipt_copies: 1,
      invoice_copies: 1,
      auto_print_receipts: false,
      auto_print_invoices: false,
    });
    notificationService.info("Settings reset to defaults");
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      notificationService.warning("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (50KB limit)
    if (file.size > 50 * 1024) {
      notificationService.warning(`File size must be less than 50KB. Your file is ${(file.size / 1024).toFixed(2)}KB`);
      return;
    }

    try {
      const response = await uploadLogo(file);

      // Handle different possible response structures
      const logoUrl = response?.logo_url || response?.logoUrl || response?.url || response?.path;

      if (!logoUrl) {
        console.error("No logo URL found in response. Response structure:", response);
        throw new Error("Invalid response from server - no logo URL received");
      }

      // Update company profile with new logo URL
      let newLogoUrl = logoUrl;
      if (logoUrl.includes("localhost:5000")) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
        newLogoUrl = logoUrl.replace("http://localhost:3000", baseUrl);
      }
      setCompanyProfile((prev) => ({ ...prev, logoUrl: newLogoUrl }));

      // Save to database
      const logoUpdateData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: newLogoUrl,
        pdf_logo_url: companyProfile.useLogoInPdf ? newLogoUrl : companyProfile.pdfLogoUrl,
        brandmark_url: companyProfile.brandmarkUrl,
        pdf_seal_url: companyProfile.pdfSealUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
      };
      await updateCompany(logoUpdateData);

      notificationService.success("Logo uploaded successfully!");
      refetchCompany();
    } catch (error) {
      console.error("Error uploading logo:", error);
      notificationService.error("Failed to upload logo. Please try again.");
    }
  };

  const handleLogoDelete = async () => {
    if (!companyProfile.logoUrl) return;

    setDeleteConfirm({
      open: true,
      type: "logo",
      itemId: null,
      itemName: "company logo",
    });
  };

  const confirmLogoDelete = async () => {
    if (!companyProfile.logoUrl) return;

    try {
      // Extract filename from URL
      const filename = companyProfile.logoUrl.split("/").pop();

      if (filename) {
        await deleteLogo(filename);
      }

      // Update company profile
      setCompanyProfile((prev) => ({ ...prev, logoUrl: null }));

      // Save to database
      const logoDeleteData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: null,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
      };
      await updateCompany(logoDeleteData);

      notificationService.success("Logo deleted successfully!");
      refetchCompany();
    } catch (error) {
      console.error("Error deleting logo:", error);
      notificationService.error("Failed to delete logo. Please try again.");
    }
  };

  const handleBrandmarkUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      notificationService.warning("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (50KB limit)
    if (file.size > 50 * 1024) {
      notificationService.warning(`File size must be less than 50KB. Your file is ${(file.size / 1024).toFixed(2)}KB`);
      return;
    }

    try {
      setUploadingBrandmark(true);
      const response = await companyService.uploadBrandmark(file);

      // Handle different possible response structures
      const brandmarkUrl = response?.brandmarkUrl || response?.pdf_brandmark_url || response?.url || response?.path;

      if (!brandmarkUrl) {
        console.error("No brandmark URL found in response. Response structure:", response);
        throw new Error("Invalid response from server - no brandmark URL received");
      }

      // console.log('[Brandmark Upload] Brandmark URL from server:', brandmarkUrl);

      // Save only the relative path to database (not the full URL)
      const relativeBrandmarkUrl = brandmarkUrl.startsWith("/uploads/")
        ? brandmarkUrl
        : brandmarkUrl.replace(/^https?:\/\/[^/]+/, "");

      // console.log('[Brandmark Upload] Relative path for database:', relativeBrandmarkUrl);

      // Update company profile immediately with relative path
      setCompanyProfile((prev) => ({
        ...prev,
        brandmarkUrl: relativeBrandmarkUrl,
      }));

      // Save to database (store relative path only)
      const brandmarkUpdateData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: relativeBrandmarkUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
      };
      await updateCompany(brandmarkUpdateData);

      notificationService.success("Brandmark uploaded successfully!");
      refetchCompany();
    } catch (error) {
      console.error("Error uploading brandmark:", error);
      notificationService.error(`Failed to upload brandmark: ${error.message}`);
    } finally {
      setUploadingBrandmark(false);
    }
  };

  const handleBrandmarkDelete = async () => {
    if (!companyProfile.brandmarkUrl) return;

    setDeleteConfirm({
      open: true,
      type: "brandmark",
      itemId: null,
      itemName: "company brandmark",
    });
  };

  const confirmBrandmarkDelete = async () => {
    if (!companyProfile.brandmarkUrl) return;

    try {
      // Extract filename from URL
      const filename = companyProfile.brandmarkUrl.split("/").pop();

      if (filename) {
        await deleteBrandmark(filename);
      }

      // Update company profile
      setCompanyProfile((prev) => ({ ...prev, brandmarkUrl: null }));

      // Save to database
      const brandmarkDeleteData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: null,
        pdf_logo_url: companyProfile.pdfLogoUrl,
        pdf_seal_url: companyProfile.pdfSealUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
      };
      await updateCompany(brandmarkDeleteData);

      notificationService.success("Brandmark deleted successfully!");
      refetchCompany();
    } catch (error) {
      console.error("Error deleting brandmark:", error);
      notificationService.error("Failed to delete brandmark. Please try again.");
    }
  };

  const handleSealUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      notificationService.warning("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (50KB limit)
    if (file.size > 50 * 1024) {
      notificationService.warning(`File size must be less than 50KB. Your file is ${(file.size / 1024).toFixed(2)}KB`);
      return;
    }

    try {
      // console.log('[Seal Upload] Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      setUploadingSeal(true);
      const response = await companyService.uploadSeal(file);
      // console.log('[Seal Upload] Response received:', response);

      // Handle different possible response structures
      const sealUrl = response?.pdfSealUrl || response?.pdf_seal_url || response?.url || response?.path;

      if (!sealUrl) {
        console.error("No seal URL found in response. Response structure:", response);
        throw new Error("Invalid response from server - no seal URL received");
      }

      // console.log('[Seal Upload] Seal URL from server:', sealUrl);

      // Save only the relative path to database (not the full URL)
      // This ensures consistency when fetching from database later
      const relativeSealUrl = sealUrl.startsWith("/uploads/") ? sealUrl : sealUrl.replace(/^https?:\/\/[^/]+/, "");

      // console.log('[Seal Upload] Relative path for database:', relativeSealUrl);

      // Update company profile immediately with relative path
      setCompanyProfile((prev) => ({ ...prev, pdfSealUrl: relativeSealUrl }));

      // Save to database (store relative path only)
      const sealUpdateData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: companyProfile.brandmarkUrl,
        pdf_logo_url: companyProfile.pdfLogoUrl,
        pdf_seal_url: relativeSealUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
      };
      await updateCompany(sealUpdateData);

      notificationService.success("Company seal uploaded successfully!");
      refetchCompany();
    } catch (error) {
      console.error("=== SEAL UPLOAD ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      console.error("Error response headers:", error.response?.headers);
      console.error("Request config:", error.config);
      console.error("========================");
      notificationService.error(`Failed to upload seal: ${error.message}`);
    } finally {
      setUploadingSeal(false);
    }
  };

  const handleSealDelete = async () => {
    if (!companyProfile.pdfSealUrl) return;

    setDeleteConfirm({
      open: true,
      type: "seal",
      itemId: null,
      itemName: "company seal",
    });
  };

  const confirmSealDelete = async () => {
    if (!companyProfile.pdfSealUrl) return;

    try {
      // Extract filename from URL
      const filename = companyProfile.pdfSealUrl.split("/").pop();

      if (filename) {
        await deleteSeal(filename);
      }

      // Update company profile
      setCompanyProfile((prev) => ({ ...prev, pdfSealUrl: null }));

      // Save to database
      const sealDeleteData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: companyProfile.brandmarkUrl,
        pdf_logo_url: companyProfile.pdfLogoUrl,
        pdf_seal_url: null,
        bankDetails: companyProfile.bankDetails || {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
      };
      await updateCompany(sealDeleteData);

      notificationService.success("Company seal deleted successfully!");
      refetchCompany();
    } catch (error) {
      console.error("Error deleting seal:", error);
      notificationService.error("Failed to delete seal. Please try again.");
    }
  };

  const handleAddVatRate = async () => {
    try {
      const rateValue = newVatRate.rate === "" ? 0 : Number(newVatRate.rate);

      if (!newVatRate.name || !newVatRate.name.trim()) {
        notificationService.error("VAT rate name is required");
        return;
      }

      if (Number.isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
        notificationService.error("VAT rate must be between 0 and 100");
        return;
      }

      const vatRateData = {
        name: newVatRate.name,
        rate: rateValue,
        type: newVatRate.type,
        description: newVatRate.description,
        is_active: newVatRate.active,
      };

      const createdRate = await vatRateService.create(vatRateData);

      // Transform and add to local state
      const transformedRate = {
        id: String(createdRate.id),
        name: createdRate.name,
        rate: Number(createdRate.rate),
        type: createdRate.type,
        description: createdRate.description,
        active: createdRate.isActive,
      };

      setVatRates([...vatRates, transformedRate]);
      setNewVatRate({
        name: "",
        rate: "",
        type: "percentage",
        description: "",
        active: true,
      });
      setShowAddVatModal(false);
      notificationService.success("VAT rate added successfully!");
    } catch (error) {
      console.error("Error adding VAT rate:", error);
      notificationService.error("Failed to add VAT rate");
    }
  };

  const toggleVatRateActive = async (vatRateId) => {
    try {
      const updatedRate = await vatRateService.toggle(vatRateId);

      // Update local state
      const updatedVatRates = vatRates.map((vatRate) =>
        vatRate.id === vatRateId ? { ...vatRate, active: updatedRate.isActive } : vatRate
      );
      setVatRates(updatedVatRates);
      notificationService.success(`VAT rate ${updatedRate.isActive ? "activated" : "deactivated"}!`);
    } catch (error) {
      console.error("Error toggling VAT rate:", error);
      notificationService.error("Failed to toggle VAT rate");
    }
  };

  const deleteVatRate = async (vatRateId) => {
    const vatRate = vatRates.find((r) => r.id === vatRateId);
    setDeleteConfirm({
      open: true,
      type: "vat",
      itemId: vatRateId,
      itemName: vatRate ? `${vatRate.rate}% VAT rate` : "VAT rate",
    });
  };

  const confirmVatDelete = async () => {
    const vatRateId = deleteConfirm.itemId;
    if (!vatRateId) return;

    try {
      await vatRateService.delete(vatRateId);

      // Update local state
      const updatedVatRates = vatRates.filter((vatRate) => vatRate.id !== vatRateId);
      setVatRates(updatedVatRates);
      notificationService.success("VAT rate deleted successfully!");
    } catch (error) {
      console.error("Error deleting VAT rate:", error);
      notificationService.error("Failed to delete VAT rate");
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const u = users.find((x) => x.id === userId);
      if (!u) return;
      const newStatus = u.status === "active" ? "inactive" : "active";
      await userAdminAPI.update(userId, { status: newStatus });
      const remoteUsers = await userAdminAPI.list();
      const mapped = remoteUsers.map((user) => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        createdAt: (user.createdAt || user.createdAt || "").toString().substring(0, 10),
        lastLogin: user.lastLogin || user.lastLogin || null,
        permissions: typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions || {},
      }));
      setUsers(mapped);
      notificationService.success("User status updated");
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || "Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    const user = users.find((u) => u.id === userId);
    setDeleteConfirm({
      open: true,
      type: "user",
      itemId: userId,
      itemName: user ? user.name : "user",
    });
  };

  const confirmUserDelete = async () => {
    const userId = deleteConfirm.itemId;
    if (!userId) return;

    try {
      await userAdminAPI.remove(userId);
      const remoteUsers = await userAdminAPI.list();
      const mapped = remoteUsers.map((u) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || "active",
        createdAt: (u.createdAt || u.createdAt || "").toString().substring(0, 10),
        lastLogin: u.lastLogin || u.lastLogin || null,
        permissions: typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions || {},
      }));
      setUsers(mapped);
      notificationService.success("User deleted successfully!");
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || "Failed to delete user");
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChangeModal.newPassword) {
      setPasswordChangeModal((prev) => ({
        ...prev,
        error: "New password is required",
      }));
      return;
    }

    if (passwordChangeModal.newPassword.length < 8) {
      setPasswordChangeModal((prev) => ({
        ...prev,
        error: "Password must be at least 8 characters",
      }));
      return;
    }

    if (passwordChangeModal.newPassword !== passwordChangeModal.confirmPassword) {
      setPasswordChangeModal((prev) => ({
        ...prev,
        error: "Passwords do not match",
      }));
      return;
    }

    try {
      setPasswordChangeModal((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));
      await userAdminAPI.changePassword(passwordChangeModal.userId, {
        current_password: passwordChangeModal.currentPassword,
        new_password: passwordChangeModal.newPassword,
      });
      notificationService.success("Password changed successfully");
      setPasswordChangeModal({
        open: false,
        userId: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        loading: false,
        error: null,
      });
    } catch (error) {
      setPasswordChangeModal((prev) => ({
        ...prev,
        error: error?.response?.data?.message || error?.message || "Failed to change password",
        loading: false,
      }));
    }
  };

  const handleSaveRole = async () => {
    try {
      if (!roleFormData.name || !roleFormData.displayName) {
        notificationService.warning("Please fill in all required fields");
        return;
      }

      const payload = {
        name: roleFormData.name,
        display_name: roleFormData.displayName,
        description: roleFormData.description,
        is_director: roleFormData.isDirector,
      };

      if (editingRole) {
        await roleService.updateRole(editingRole.id, payload);
        notificationService.success("Role updated successfully");
      } else {
        await roleService.createRole(payload);
        notificationService.success("Role created successfully");
      }

      setShowRoleDialog(false);
      await loadRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      notificationService.error("Failed to save role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = availableRoles.find((r) => r.id === roleId);
    setDeleteConfirm({
      open: true,
      type: "role",
      itemId: roleId,
      itemName: role ? role.name : "role",
    });
  };

  const confirmRoleDelete = async () => {
    const roleId = deleteConfirm.itemId;
    if (!roleId) return;

    try {
      await roleService.deleteRole(roleId);
      notificationService.success("Role deleted successfully");
      await loadRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      notificationService.error("Failed to delete role");
    }
  };

  const renderProfile = () => (
    <SettingsPaper className="max-w-3xl">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Company Profile</h3>
          <Button
            variant="primary"
            startIcon={updatingCompany ? <CircularProgress size={16} /> : <Save size={16} />}
            onClick={saveCompanyProfile}
            disabled={updatingCompany}
          >
            {updatingCompany ? "Saving..." : "Save Profile"}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Basic Information */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Basic Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Company Name"
                  value={companyProfile.name || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter company name"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={companyProfile.email || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  startAdornment={<Mail size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />}
                />
                <PhoneInput
                  label="Phone / Mobile Number"
                  value={companyProfile.phone || ""}
                  onChange={(phone) =>
                    setCompanyProfile({
                      ...companyProfile,
                      phone,
                    })
                  }
                  disabled={false}
                />
                <TextField
                  label="Website"
                  type="url"
                  value={companyProfile.website || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      website: e.target.value,
                    })
                  }
                  placeholder="Enter website URL"
                  startAdornment={<Globe size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />}
                />
              </div>
            </div>
          </SettingsCard>

          {/* Address Information */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Address Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <TextField
                    label="Street Address"
                    value={
                      typeof companyProfile.address === "string"
                        ? companyProfile.address
                        : companyProfile.address?.street || ""
                    }
                    onChange={(e) =>
                      setCompanyProfile({
                        ...companyProfile,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter street address"
                    startAdornment={<MapPin size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />}
                  />
                </div>
                <TextField
                  label="City"
                  value={companyProfile.city || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      city: e.target.value,
                    })
                  }
                  placeholder="Enter city"
                />
                <Select
                  label="Country"
                  value={companyProfile.country || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      country: e.target.value,
                    })
                  }
                  options={[
                    { value: "UAE", label: "UAE" },
                    { value: "India", label: "India" },
                    { value: "United States", label: "United States" },
                    { value: "United Kingdom", label: "United Kingdom" },
                    { value: "Canada", label: "Canada" },
                    { value: "Australia", label: "Australia" },
                  ]}
                />
              </div>
            </div>
          </SettingsCard>

          {/* VAT Registration */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                VAT Registration
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="VAT REG NO (TRN)"
                  value="104858252000003"
                  readOnly
                  placeholder="VAT Registration Number"
                  helperText="Read-only. Contact admin to update."
                />
              </div>
            </div>
          </SettingsCard>

          {/* Bank Details */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Bank Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Bank Name"
                  value={companyProfile.bankDetails?.bankName || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {
                        ...(companyProfile.bankDetails || {}),
                        bankName: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter bank name"
                />
                <TextField
                  label="Account Number"
                  value={companyProfile.bankDetails?.accountNumber || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {
                        ...(companyProfile.bankDetails || {}),
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter account number"
                />
                <TextField
                  label="IBAN"
                  value={companyProfile.bankDetails?.iban || ""}
                  onChange={(e) =>
                    setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {
                        ...(companyProfile.bankDetails || {}),
                        iban: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter IBAN"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Company Images - Collapsible */}
          <SettingsCard>
            <div className="p-4">
              <button
                type="button"
                onClick={() => setImagesExpanded(!imagesExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Company Images (Logo, Brandmark, Seal)
                </h4>
                {imagesExpanded ? (
                  <ChevronUp size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                ) : (
                  <ChevronDown size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                )}
              </button>

              {imagesExpanded && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Logo Section */}
                  <div className="flex flex-col">
                    <h5 className={`text-md font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Company Logo
                    </h5>
                    <div className="flex flex-col space-y-4">
                      <LogoContainer>
                        {uploadingLogo ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CircularProgress size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Uploading...
                            </span>
                          </div>
                        ) : companyProfile.logoUrl ? (
                          <div className="relative w-full h-full">
                            {/* {console.log('Rendering logo with URL:', companyProfile.logoUrl)} */}
                            <img
                              src={`${companyProfile.logoUrl.startsWith("/") ? (import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000") + companyProfile.logoUrl : companyProfile.logoUrl}?t=${Date.now()}`}
                              alt="Company Logo"
                              className="w-full h-full object-contain rounded-lg"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                if (e.target.src.includes("?t=")) {
                                  const baseUrl =
                                    import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";
                                  e.target.src = companyProfile.logoUrl.startsWith("/")
                                    ? baseUrl + companyProfile.logoUrl
                                    : companyProfile.logoUrl;
                                } else {
                                  setCompanyProfile((prev) => ({
                                    ...prev,
                                    logoUrl: null,
                                  }));
                                }
                              }}
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              onClick={handleLogoDelete}
                              title="Delete logo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Camera size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Upload Logo
                            </span>
                          </div>
                        )}
                      </LogoContainer>

                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={logoInputRef}
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={
                            uploadingLogo ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />
                          }
                          disabled={uploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          {uploadingLogo ? "Uploading..." : "Upload"}
                        </Button>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Max: 50KB</p>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={companyProfile.useLogoInPdf || false}
                            onChange={(e) => {
                              const useInPdf = e.target.checked;
                              setCompanyProfile((prev) => ({
                                ...prev,
                                useLogoInPdf: useInPdf,
                                pdfLogoUrl: useInPdf ? prev.logoUrl : null,
                              }));
                            }}
                            className="mr-2"
                          />
                          <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Use in PDFs
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Brandmark Section */}
                  <div className="flex flex-col">
                    <h5 className={`text-md font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Company Brandmark
                    </h5>
                    <div className="flex flex-col space-y-4">
                      <LogoContainer>
                        {uploadingBrandmark ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CircularProgress size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Uploading...
                            </span>
                          </div>
                        ) : companyProfile.brandmarkUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={`${companyProfile.brandmarkUrl.startsWith("/") ? (import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000") + companyProfile.brandmarkUrl : companyProfile.brandmarkUrl}?t=${Date.now()}`}
                              alt="Company Brandmark"
                              className="w-full h-full object-contain rounded-lg"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                if (e.target.src.includes("?t=")) {
                                  const baseUrl =
                                    import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";
                                  e.target.src = companyProfile.brandmarkUrl.startsWith("/")
                                    ? baseUrl + companyProfile.brandmarkUrl
                                    : companyProfile.brandmarkUrl;
                                } else {
                                  setCompanyProfile((prev) => ({
                                    ...prev,
                                    brandmarkUrl: null,
                                  }));
                                }
                              }}
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              onClick={handleBrandmarkDelete}
                              title="Delete brandmark"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Camera size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Upload Brandmark
                            </span>
                          </div>
                        )}
                      </LogoContainer>

                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={brandmarkInputRef}
                          accept="image/*"
                          onChange={handleBrandmarkUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={
                            uploadingBrandmark ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />
                          }
                          disabled={uploadingBrandmark}
                          onClick={() => brandmarkInputRef.current?.click()}
                        >
                          {uploadingBrandmark ? "Uploading..." : "Upload"}
                        </Button>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Max: 50KB</p>
                      </div>
                    </div>
                  </div>

                  {/* Seal Section */}
                  <div className="flex flex-col">
                    <h5 className={`text-md font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Company Seal
                    </h5>
                    <div className="flex flex-col space-y-4">
                      <LogoContainer>
                        {uploadingSeal ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CircularProgress size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Uploading...
                            </span>
                          </div>
                        ) : companyProfile.pdfSealUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={`${companyProfile.pdfSealUrl.startsWith("/") ? (import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000") + companyProfile.pdfSealUrl : companyProfile.pdfSealUrl}?t=${Date.now()}`}
                              alt="Company Seal"
                              className="w-full h-full object-contain rounded-lg"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                if (e.target.src.includes("?t=")) {
                                  const baseUrl =
                                    import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";
                                  e.target.src = companyProfile.pdfSealUrl.startsWith("/")
                                    ? baseUrl + companyProfile.pdfSealUrl
                                    : companyProfile.pdfSealUrl;
                                } else {
                                  setCompanyProfile((prev) => ({
                                    ...prev,
                                    pdfSealUrl: null,
                                  }));
                                }
                              }}
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              onClick={handleSealDelete}
                              title="Delete seal"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Camera size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Upload Seal
                            </span>
                          </div>
                        )}
                      </LogoContainer>

                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={sealInputRef}
                          accept="image/*"
                          onChange={handleSealUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={
                            uploadingSeal ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />
                          }
                          disabled={uploadingSeal}
                          onClick={() => sealInputRef.current?.click()}
                        >
                          {uploadingSeal ? "Uploading..." : "Upload"}
                        </Button>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Max: 50KB</p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>For PDFs</p>
                      </div>
                    </div>
                  </div>

                  {/* Document Types - Logo & Seal Settings */}
                  <div className="mt-8 pt-8 border-t border-gray-300">
                    <h4 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Enable Logos in Document Types
                    </h4>

                    <div className="overflow-x-auto">
                      <table className={`w-full text-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                        <thead>
                          <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                            <th
                              className={`text-left py-2 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Document Type
                            </th>
                            <th
                              className={`text-center py-2 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Logo
                            </th>
                            <th
                              className={`text-center py-2 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Seal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "invoice", label: "Invoice" },
                            { key: "quotation", label: "Quotation" },
                            { key: "purchaseOrder", label: "Purchase Order" },
                            { key: "creditNote", label: "Credit Note" },
                            { key: "deliveryNote", label: "Delivery Note" },
                            { key: "paymentReceipt", label: "Payment Receipt" },
                            {
                              key: "accountStatement",
                              label: "Account Statement",
                            },
                          ].map((doc) => (
                            <tr
                              key={doc.key}
                              className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                            >
                              <td className={`py-3 px-4 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                                {doc.label}
                              </td>
                              <td className="text-center py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={companyProfile.documentImageSettings?.[doc.key]?.showLogo ?? true}
                                  onChange={(e) => {
                                    setCompanyProfile((prev) => ({
                                      ...prev,
                                      documentImageSettings: {
                                        ...prev.documentImageSettings,
                                        [doc.key]: {
                                          ...prev.documentImageSettings?.[doc.key],
                                          showLogo: e.target.checked,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-4 h-4 rounded"
                                  aria-label={`Show logo on ${doc.label}`}
                                />
                              </td>
                              <td className="text-center py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={companyProfile.documentImageSettings?.[doc.key]?.showSeal ?? true}
                                  onChange={(e) => {
                                    setCompanyProfile((prev) => ({
                                      ...prev,
                                      documentImageSettings: {
                                        ...prev.documentImageSettings,
                                        [doc.key]: {
                                          ...prev.documentImageSettings?.[doc.key],
                                          showSeal: e.target.checked,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-4 h-4 rounded"
                                  aria-label={`Show seal on ${doc.label}`}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>
        </div>
      </div>
    </SettingsPaper>
  );

  const renderInvoiceTemplates = () => (
    <InvoiceTemplateSettings
      company={companyProfile}
      onSave={async (templateSettings) => {
        try {
          // Save template settings to company.settings
          // templateSettings contains: invoiceTemplate (unified format), documentTemplates
          // invoiceTemplate format: { id, name, colors, settings }
          // Backend PDF generation reads: company.settings.invoiceTemplate.colors.primary
          const updatedProfile = {
            ...companyProfile,
            settings: {
              ...companyProfile.settings,
              invoiceTemplate: templateSettings.invoiceTemplate,
              documentTemplates: templateSettings.documentTemplates,
            },
          };

          await companyService.updateCompany(updatedProfile);
          setCompanyProfile(updatedProfile);
          notificationService.success("Invoice template settings saved successfully!");
        } catch (error) {
          console.error("Error saving template settings:", error);
          notificationService.error("Failed to save template settings");
          throw error;
        }
      }}
    />
  );

  const renderVatSettings = () => {
    // console.log('renderVatSettings called - VATRulesHelpPanel should render');
    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[600px]">
        {/* Left Column - VAT Configuration (60%) */}
        <div className="lg:w-3/5 flex-shrink-0">
          <div
            className={`rounded-2xl border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"} shadow-sm`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  VAT Rates Configuration
                </h3>
                <Button onClick={() => setShowAddVatModal(true)} startIcon={<Plus size={16} />}>
                  Add VAT Rate
                </Button>
              </div>

              {/* UAE VAT Compliance Info Banner */}
              <div
                className={`mb-6 p-4 rounded-lg border-l-4 ${
                  isDarkMode
                    ? "bg-blue-900/20 border-blue-500 text-blue-300"
                    : "bg-blue-50 border-blue-500 text-blue-800"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg aria-label="icon" className="h-5 w-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <title>Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-semibold mb-2">UAE Federal Tax Authority (FTA) VAT Compliance</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>
                        <strong>Standard Rated (5%):</strong> Default rate for most goods and services in UAE
                      </li>
                      <li>
                        <strong>Zero Rated (0%):</strong> Exports, international transport, specified medicines &
                        education
                      </li>
                      <li>
                        <strong>Exempt:</strong> Financial services, residential properties, bare land (no input tax
                        recovery)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {vatRates.length === 0 ? (
                  <div
                    className={`text-center py-12 rounded-lg border-2 border-dashed ${
                      isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <Calculator
                      size={48}
                      className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
                    />
                    <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      No VAT Rates Configured
                    </h4>
                    <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Get started by adding your first VAT rate. Common rates in UAE are 5% (Standard) and 0% (Zero
                      Rated).
                    </p>
                    <Button onClick={() => setShowAddVatModal(true)} startIcon={<Plus size={16} />}>
                      Add Your First VAT Rate
                    </Button>
                  </div>
                ) : (
                  vatRates.map((vatRate) => (
                    <div
                      key={vatRate.id}
                      className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
                      } ${vatRate.active ? "opacity-100" : "opacity-60"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {vatRate.name}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${
                                isDarkMode
                                  ? "text-teal-400 border-teal-600 bg-teal-900/20"
                                  : "text-teal-600 border-teal-300 bg-teal-50"
                              }`}
                            >
                              {vatRate.rate}%
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${
                                isDarkMode
                                  ? "text-gray-400 border-gray-600 bg-gray-800"
                                  : "text-gray-600 border-gray-300 bg-gray-50"
                              }`}
                            >
                              {vatRate.type}
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {vatRate.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <label
                            className="relative inline-flex items-center cursor-pointer"
                            aria-label={`Toggle ${vatRate.name} active status`}
                          >
                            <input
                              type="checkbox"
                              checked={vatRate.active}
                              onChange={() => toggleVatRateActive(vatRate.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                          </label>
                          <span
                            className={`text-sm font-medium ${
                              vatRate.active ? "text-green-500" : isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {vatRate.active ? "Active" : "Inactive"}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteVatRate(vatRate.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add VAT Rate Modal */}
            {showAddVatModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}>
                  <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Add VAT Rate
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddVatModal(false)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}
                      >
                        <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="VAT Rate Name"
                        value={newVatRate.name}
                        onChange={(e) => setNewVatRate({ ...newVatRate, name: e.target.value })}
                        placeholder="e.g., Standard Rated, Zero Rated"
                      />
                      <Input
                        label="VAT Percentage (%)"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={newVatRate.rate || ""}
                        onChange={(e) =>
                          setNewVatRate({
                            ...newVatRate,
                            rate: e.target.value === "" ? "" : Number(e.target.value) || "",
                          })
                        }
                        placeholder="Enter VAT rate (0, 5, etc.)"
                      />
                      <Select
                        label="Type"
                        value={newVatRate.type}
                        onChange={(e) => setNewVatRate({ ...newVatRate, type: e.target.value })}
                        options={[
                          { value: "percentage", label: "Percentage" },
                          { value: "fixed", label: "Fixed Amount" },
                        ]}
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Description"
                          value={newVatRate.description}
                          onChange={(e) =>
                            setNewVatRate({
                              ...newVatRate,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe when this VAT rate applies"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
                  >
                    <Button variant="outline" onClick={() => setShowAddVatModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddVatRate} startIcon={<Save size={20} />}>
                      Add VAT Rate
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Help Panel (40%) - Full height from top */}
        <div className="lg:w-2/5 lg:self-stretch lg:min-h-[600px]">
          <div
            className={`h-full rounded-xl shadow-sm border overflow-hidden ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto lg:sticky lg:top-6">
              <VATRulesHelpPanel />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserManagement = () => (
    <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[600px]">
      {/* Left Column - User Management (60%) */}
      <div className="lg:w-3/5 flex-shrink-0">
        <SettingsPaper>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                User Management
              </h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  startIcon={<Shield size={16} />}
                  onClick={() => setShowManageRolesModal(true)}
                >
                  Manage Roles
                </Button>
                <Button
                  variant="primary"
                  startIcon={<UserPlus size={16} />}
                  onClick={() => {
                    setNewUser({
                      name: "",
                      email: "",
                      password: "",
                      role_ids: [],
                    });
                    setSelectedUserRoles([]);
                    setShowAddUserModal(true);
                  }}
                >
                  Add User
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <Input
                placeholder="Search users by name, email, or role..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                startIcon={<Users size={16} />}
                className="max-w-md"
              />
            </div>

            {/* User Count */}
            {filteredUsers.length > 0 && (
              <div className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
                {userSearchTerm && " (filtered)"}
              </div>
            )}

            {/* User List */}
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <div className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {userLoadingError ? (
                      <>
                        <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                        <div className="text-red-600 font-semibold mb-2">Failed to load users</div>
                        <div className="text-sm text-gray-600">{userLoadingError}</div>
                      </>
                    ) : userSearchTerm ? (
                      <div>No users found matching your search</div>
                    ) : (
                      <div>No users yet. Add your first user to get started.</div>
                    )}
                  </div>
                </div>
              ) : null}
              {filteredUsers.map((user) => (
                <SettingsCard key={user.id} className={user.status === "active" ? "" : "opacity-60"}>
                  <div className="p-6">
                    {/* User Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                            isDarkMode ? "bg-teal-600" : "bg-teal-500"
                          }`}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {user.name || "Unnamed User"}
                          </h4>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {user.email || "No email"}
                          </p>
                          {/* Display Roles */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role, idx) => (
                                <span
                                  key={role.id || role.name || `role-${idx}`}
                                  className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                                    role.isDirector
                                      ? isDarkMode
                                        ? "text-purple-400 border-purple-600 bg-purple-900/20"
                                        : "text-purple-600 border-purple-300 bg-purple-50"
                                      : isDarkMode
                                        ? "text-teal-400 border-teal-600 bg-teal-900/20"
                                        : "text-teal-600 border-teal-300 bg-teal-50"
                                  }`}
                                >
                                  {role.displayName}
                                </span>
                              ))
                            ) : (
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                                  isDarkMode
                                    ? "text-gray-400 border-gray-600 bg-gray-800"
                                    : "text-gray-600 border-gray-300 bg-gray-50"
                                }`}
                              >
                                No roles assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={user.status === "active"}
                          onChange={() => toggleUserStatus(user.id)}
                          label={user.status === "active" ? "Active" : "Inactive"}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setViewPermissionsModal({
                                open: true,
                                userId: user.id,
                                userName: user.name,
                                rolePermissions: [],
                                customGrants: [],
                                loading: true,
                              });

                              const userPermissions = await roleService.getUserPermissions(user.id);

                              setViewPermissionsModal((prev) => ({
                                ...prev,
                                rolePermissions: userPermissions.roles || [],
                                customGrants: userPermissions.customPermissions || [],
                                loading: false,
                              }));
                            } catch (error) {
                              console.error("Error loading permissions:", error);
                              notificationService.error("Failed to load permissions");
                              setViewPermissionsModal((prev) => ({
                                ...prev,
                                loading: false,
                              }));
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            isDarkMode ? "hover:bg-gray-700 text-green-400" : "hover:bg-gray-100 text-green-600"
                          }`}
                          title="View All Permissions"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const userPermissions = await roleService.getUserPermissions(user.id);
                              setEditUserModal({
                                open: true,
                                user: {
                                  ...user,
                                  role_ids: userPermissions.roles.map((r) => r.id),
                                  roles: userPermissions.roles,
                                },
                              });
                              setSelectedUserRoles(userPermissions.roles.map((r) => r.id));
                            } catch (error) {
                              console.error("Error loading user data:", error);
                              notificationService.error("Failed to load user data");
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordChangeModal({
                              open: true,
                              userId: user.id,
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                              loading: false,
                              error: null,
                            })
                          }
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            isDarkMode ? "hover:bg-gray-700 text-orange-400" : "hover:bg-gray-100 text-orange-600"
                          }`}
                          title="Change Password"
                        >
                          <Key size={16} />
                        </button>
                        {isDirector && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const logs = await roleService.getAuditLog(user.id, 50);
                                  setAuditLogModal({
                                    open: true,
                                    userId: user.id,
                                    logs,
                                  });
                                } catch (error) {
                                  console.error("Error loading audit log:", error);
                                  notificationService.error("Failed to load audit log");
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? "hover:bg-gray-700 text-blue-400" : "hover:bg-gray-100 text-blue-600"
                              }`}
                              title="View Audit Log"
                            >
                              <History size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPermissionModal({
                                  open: true,
                                  userId: user.id,
                                });
                                setCustomPermission({
                                  permission_keys: [],
                                  reason: "",
                                  expires_at: null,
                                });
                                setPermissionSearch("");
                                setExpandedModules({});
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? "hover:bg-gray-700 text-yellow-400" : "hover:bg-gray-100 text-yellow-600"
                              }`}
                              title="Grant Custom Permissions"
                            >
                              <UserCheck size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <hr className={`my-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Created</p>
                        <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {formatDateOnly(user.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Last Login</p>
                        <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {formatDateTime(user.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </SettingsCard>
              ))}
            </div>

            {/* Pagination Controls */}
            {userTotalPages > 1 && (
              <div
                className={`flex items-center justify-between mt-6 pt-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Page {userCurrentPage} of {userTotalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUserCurrentPage(Math.max(1, userCurrentPage - 1))}
                    disabled={userCurrentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      userCurrentPage === 1
                        ? isDarkMode
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserCurrentPage(Math.min(userTotalPages, userCurrentPage + 1))}
                    disabled={userCurrentPage === userTotalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      userCurrentPage === userTotalPages
                        ? isDarkMode
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingsPaper>
      </div>

      {/* Right Column - Help Panel (40%) */}
      <div className="lg:w-2/5 lg:self-stretch lg:min-h-[600px]">
        <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto lg:sticky lg:top-6">
          <RolesHelpPanel />
        </div>
      </div>
    </div>
  );

  const renderUserManagementModals = () => (
    <>
      {/* Manage Roles Modal */}
      {showManageRolesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] flex flex-col`}
          >
            {/* Modal Header */}
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Shield className={isDarkMode ? "text-teal-400" : "text-teal-600"} size={24} />
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Manage Roles
                  </h3>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => {
                      setEditingRole(null);
                      setRoleFormData({
                        name: "",
                        displayName: "",
                        description: "",
                        isDirector: false,
                      });
                      setShowRoleDialog(true);
                    }}
                  >
                    Create Role
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowManageRolesModal(false)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                  </button>
                </div>
              </div>
            </div>

            {/* Roles List */}
            <div className="flex-1 overflow-y-auto p-6">
              {rolesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <CircularProgress size={32} />
                </div>
              ) : availableRoles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No roles found. Create your first role to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRoles.map((role) => (
                    <SettingsCard key={role.id}>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {role.displayName || role.display_name}
                              </h4>
                              {role.isDirector || role.is_director ? (
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    isDarkMode
                                      ? "bg-purple-900/30 text-purple-400 border border-purple-600"
                                      : "bg-purple-100 text-purple-700 border border-purple-300"
                                  }`}
                                >
                                  Director
                                </span>
                              ) : null}
                              {role.isSystem || role.is_system ? (
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    isDarkMode
                                      ? "bg-blue-900/30 text-blue-400 border border-blue-600"
                                      : "bg-blue-100 text-blue-700 border border-blue-300"
                                  }`}
                                >
                                  System
                                </span>
                              ) : null}
                            </div>
                            <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                              {role.name}
                            </p>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {role.description || "No description"}
                            </p>
                            <div className="flex gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <Users size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {role.userCount || role.user_count || 0} users
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {role.permissionCount || role.permission_count || 0} permissions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRole(role);
                                setRoleFormData({
                                  name: role.name,
                                  displayName: role.displayName || role.display_name,
                                  description: role.description || "",
                                  isDirector: role.isDirector || role.is_director || false,
                                });
                                setShowRoleDialog(true);
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                              }`}
                              title="Edit Role"
                            >
                              <Edit size={16} />
                            </button>
                            {!(role.isSystem || role.is_system) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                title="Delete Role"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SettingsCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Role Dialog */}
      {showRoleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}>
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {editingRole ? "Edit Role" : "Create New Role"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRoleDialog(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <TextField
                label="Role Name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="e.g., sales_manager"
                helperText="Unique identifier (lowercase, underscores allowed)"
              />
              <TextField
                label="Display Name"
                value={roleFormData.displayName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    displayName: e.target.value,
                  })
                }
                placeholder="e.g., Sales Manager"
                helperText="Friendly name shown to users"
              />
              <TextField
                label="Description"
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of this role's purpose"
                multiline
                rows={3}
              />
              <div className="flex items-center gap-3">
                <Switch
                  checked={roleFormData.isDirector}
                  onChange={(e) =>
                    setRoleFormData({
                      ...roleFormData,
                      isDirector: e.target.checked,
                    })
                  }
                  label="Director Role"
                />
                <div>
                  <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Director Role
                  </span>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Grants elevated privileges and access to sensitive operations
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>{editingRole ? "Update" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Add New User</h3>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            <form className="p-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => {
                    setNewUser({ ...newUser, name: e.target.value });
                    if (userValidationErrors.name) {
                      setUserValidationErrors({
                        ...userValidationErrors,
                        name: null,
                      });
                    }
                  }}
                  placeholder="Enter full name"
                  error={userValidationErrors.name}
                  helperText={userValidationErrors.name}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (userValidationErrors.email) {
                      setUserValidationErrors({
                        ...userValidationErrors,
                        email: null,
                      });
                    }
                  }}
                  placeholder="Enter email address"
                  error={userValidationErrors.email}
                  helperText={userValidationErrors.email}
                />
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({ ...newUser, password: e.target.value });
                    if (userValidationErrors.password) {
                      setUserValidationErrors({
                        ...userValidationErrors,
                        password: null,
                      });
                    }
                  }}
                  placeholder="Minimum 8 characters"
                  error={userValidationErrors.password}
                  helperText={userValidationErrors.password || "Must be at least 8 characters"}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`p-1 ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* Multi-Role Selection */}
              <div className="mt-6">
                <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Assign Roles (select multiple) <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        selectedUserRoles.includes(role.id)
                          ? isDarkMode
                            ? "border-teal-500 bg-teal-900/20"
                            : "border-teal-500 bg-teal-50"
                          : isDarkMode
                            ? "border-gray-600 bg-gray-800 hover:border-gray-500"
                            : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserRoles.includes(role.id)}
                        onChange={() => {
                          const isSelected = selectedUserRoles.includes(role.id);
                          if (isSelected) {
                            setSelectedUserRoles(selectedUserRoles.filter((id) => id !== role.id));
                          } else {
                            setSelectedUserRoles([...selectedUserRoles, role.id]);
                          }
                          if (userValidationErrors.roles) {
                            setUserValidationErrors({
                              ...userValidationErrors,
                              roles: null,
                            });
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <h5 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {role.displayName}
                        </h5>
                        {role.description && (
                          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {role.description}
                          </p>
                        )}
                      </div>
                      {selectedUserRoles.includes(role.id) && (
                        <CheckCircle size={20} className="text-teal-500 flex-shrink-0 ml-2" />
                      )}
                    </label>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Click on roles to select/deselect. Users can have multiple roles.
                </p>
                {userValidationErrors.roles && (
                  <p className="text-red-500 text-sm mt-2">{userValidationErrors.roles}</p>
                )}
              </div>
            </form>

            <div
              className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUserModal(false);
                  setUserValidationErrors({});
                }}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Validate form
                  const errors = validateUserForm(newUser, false);
                  if (Object.keys(errors).length > 0) {
                    setUserValidationErrors(errors);
                    notificationService.warning("Please fix the validation errors");
                    return;
                  }

                  try {
                    setIsSubmittingUser(true);

                    // 1. Create user via existing API
                    const userData = {
                      name: newUser.name.trim(),
                      email: newUser.email.trim(),
                      password: newUser.password,
                    };
                    const createdUser = await userAdminAPI.create(userData);

                    // 2. Assign selected roles
                    if (selectedUserRoles.length > 0) {
                      await roleService.assignRoles(createdUser.id, selectedUserRoles);
                    }

                    notificationService.success("User created successfully!");
                    setShowAddUserModal(false);
                    setUserValidationErrors({});
                    setNewUser({
                      name: "",
                      email: "",
                      password: "",
                      role_ids: [],
                    });
                    setSelectedUserRoles([]);

                    // Refresh user list
                    const remoteUsers = await userAdminAPI.list();
                    const mapped = await Promise.all(
                      remoteUsers.map(async (u) => {
                        const userPerms = await roleService.getUserPermissions(u.id);
                        return {
                          id: String(u.id),
                          name: u.name,
                          email: u.email,
                          role: u.role,
                          status: u.status || "active",
                          createdAt: (u.createdAt || u.createdAt || "").toString().substring(0, 10),
                          lastLogin: u.lastLogin || u.lastLogin || null,
                          roles: userPerms.roles || [],
                        };
                      })
                    );
                    setUsers(mapped);
                  } catch (error) {
                    console.error("Error creating user:", error);
                    notificationService.error(error.response?.data?.error || "Failed to create user");
                  } finally {
                    setIsSubmittingUser(false);
                  }
                }}
                disabled={isSubmittingUser}
                startIcon={isSubmittingUser ? <CircularProgress size={16} /> : <Save size={20} />}
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal.open && editUserModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Edit User</h3>
                <button
                  type="button"
                  onClick={() => setEditUserModal({ open: false, user: null })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={editUserModal.user.name}
                  onChange={(e) => {
                    setEditUserModal((prev) => ({
                      ...prev,
                      user: { ...prev.user, name: e.target.value },
                    }));
                    if (userValidationErrors.name) {
                      setUserValidationErrors({
                        ...userValidationErrors,
                        name: null,
                      });
                    }
                  }}
                  placeholder="Enter full name"
                  error={userValidationErrors.name}
                  helperText={userValidationErrors.name}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editUserModal.user.email}
                  onChange={(e) => {
                    setEditUserModal((prev) => ({
                      ...prev,
                      user: { ...prev.user, email: e.target.value },
                    }));
                    if (userValidationErrors.email) {
                      setUserValidationErrors({
                        ...userValidationErrors,
                        email: null,
                      });
                    }
                  }}
                  placeholder="Enter email address"
                  error={userValidationErrors.email}
                  helperText={userValidationErrors.email}
                />
              </div>

              {/* Multi-Role Selection */}
              <div className="mt-6">
                <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Assigned Roles (select multiple) <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role) => (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => {
                        const isSelected = selectedUserRoles.includes(role.id);
                        if (isSelected) {
                          setSelectedUserRoles(selectedUserRoles.filter((id) => id !== role.id));
                        } else {
                          setSelectedUserRoles([...selectedUserRoles, role.id]);
                        }
                      }}
                      aria-pressed={selectedUserRoles.includes(role.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-left ${
                        selectedUserRoles.includes(role.id)
                          ? isDarkMode
                            ? "border-teal-500 bg-teal-900/20"
                            : "border-teal-500 bg-teal-50"
                          : isDarkMode
                            ? "border-gray-600 bg-gray-800 hover:border-gray-500"
                            : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {role.displayName}
                          </h5>
                          {role.description && (
                            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {role.description}
                            </p>
                          )}
                        </div>
                        {selectedUserRoles.includes(role.id) && (
                          <CheckCircle size={20} className="text-teal-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {userValidationErrors.roles && (
                  <p className="text-red-500 text-sm mt-2">{userValidationErrors.roles}</p>
                )}
              </div>
            </div>

            <div
              className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setEditUserModal({ open: false, user: null });
                  setUserValidationErrors({});
                }}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Validate form
                  const errors = validateUserForm(editUserModal.user, true);
                  if (Object.keys(errors).length > 0) {
                    setUserValidationErrors(errors);
                    notificationService.warning("Please fix the validation errors");
                    return;
                  }

                  try {
                    setIsSubmittingUser(true);

                    // 1. Update user basic info
                    const userData = {
                      name: editUserModal.user.name.trim(),
                      email: editUserModal.user.email.trim(),
                    };
                    await userAdminAPI.update(editUserModal.user.id, userData);

                    // 2. Replace all roles
                    await roleService.replaceUserRoles(editUserModal.user.id, selectedUserRoles);

                    notificationService.success("User updated successfully!");
                    setEditUserModal({ open: false, user: null });
                    setUserValidationErrors({});

                    // Refresh user list
                    const remoteUsers = await userAdminAPI.list();
                    const mapped = await Promise.all(
                      remoteUsers.map(async (u) => {
                        const userPerms = await roleService.getUserPermissions(u.id);
                        return {
                          id: String(u.id),
                          name: u.name,
                          email: u.email,
                          role: u.role,
                          status: u.status || "active",
                          createdAt: (u.createdAt || u.createdAt || "").toString().substring(0, 10),
                          lastLogin: u.lastLogin || u.lastLogin || null,
                          roles: userPerms.roles || [],
                        };
                      })
                    );
                    setUsers(mapped);
                  } catch (error) {
                    console.error("Error updating user:", error);
                    notificationService.error(error.response?.data?.error || "Failed to update user");
                  } finally {
                    setIsSubmittingUser(false);
                  }
                }}
                disabled={isSubmittingUser}
                startIcon={isSubmittingUser ? <CircularProgress size={16} /> : <Save size={20} />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Permission Modal (Director Only) */}
      {customPermissionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}
          >
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Grant Custom Permissions
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Select multiple permissions to grant temporary access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomPermissionModal({ open: false, userId: null })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div
                className={`mb-4 p-4 rounded-lg border-l-4 ${
                  isDarkMode
                    ? "bg-yellow-900/20 border-yellow-500 text-yellow-300"
                    : "bg-yellow-50 border-yellow-500 text-yellow-800"
                }`}
              >
                <div className="flex items-start">
                  <Shield size={20} className="mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Director Override</p>
                    <p>
                      Grant one or more permissions to users temporarily. Use the search box to find permissions
                      quickly, or select entire modules at once.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Selected Permissions Count */}
                {customPermission.permission_keys.length > 0 && (
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-teal-900/20 border border-teal-700/30" : "bg-teal-50 border border-teal-200"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                      {customPermission.permission_keys.length} permission
                      {customPermission.permission_keys.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                )}

                {/* Search Box */}
                <div>
                  <label
                    htmlFor="permission-search"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Search Permissions
                  </label>
                  <input
                    id="permission-search"
                    type="text"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder="Search by permission name or description..."
                    className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>

                {/* Permission Checklist */}
                <div>
                  <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                    Select Permissions
                  </div>
                  <div
                    className={`border rounded-lg max-h-64 overflow-y-auto ${
                      isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"
                    }`}
                  >
                    {Object.keys(allPermissions).length === 0 ? (
                      <div className="p-4 text-center">
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Loading permissions...
                        </p>
                      </div>
                    ) : (
                      Object.entries(allPermissions)
                        .filter(([module, permissions]) => {
                          if (!permissionSearch) return true;
                          const search = permissionSearch.toLowerCase();
                          return (
                            module.toLowerCase().includes(search) ||
                            permissions.some(
                              (p) =>
                                p.description.toLowerCase().includes(search) || p.key.toLowerCase().includes(search)
                            )
                          );
                        })
                        .map(([module, permissions]) => {
                          const filteredPerms = permissions.filter((p) => {
                            if (!permissionSearch) return true;
                            const search = permissionSearch.toLowerCase();
                            return p.description.toLowerCase().includes(search) || p.key.toLowerCase().includes(search);
                          });

                          if (filteredPerms.length === 0) return null;

                          const isExpanded = expandedModules[module] !== false; // Default to expanded
                          const modulePerms = filteredPerms.map((p) => p.key);
                          const allSelected = modulePerms.every((k) => customPermission.permission_keys.includes(k));
                          const someSelected = modulePerms.some((k) => customPermission.permission_keys.includes(k));

                          return (
                            <div
                              key={module}
                              className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} last:border-b-0`}
                            >
                              {/* Module Header */}
                              <button
                                type="button"
                                className={`w-full flex items-center justify-between p-3 cursor-pointer transition-colors border-0 bg-transparent text-left ${
                                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setExpandedModules((prev) => ({
                                    ...prev,
                                    [module]: !isExpanded,
                                  }))
                                }
                                aria-expanded={isExpanded}
                              >
                                <div className="flex items-center flex-1">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                      if (input) {
                                        input.indeterminate = someSelected && !allSelected;
                                      }
                                    }}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const newKeys = e.target.checked
                                        ? [...new Set([...customPermission.permission_keys, ...modulePerms])]
                                        : customPermission.permission_keys.filter((k) => !modulePerms.includes(k));
                                      setCustomPermission({
                                        ...customPermission,
                                        permission_keys: newKeys,
                                      });
                                    }}
                                    aria-label={`Select all ${module} permissions`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mr-3 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                  />
                                  <span
                                    className={`font-medium uppercase text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                  >
                                    {module}
                                  </span>
                                  <span className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    ({filteredPerms.length})
                                  </span>
                                </div>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>

                              {/* Module Permissions */}
                              {isExpanded && (
                                <div className={`${isDarkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
                                  {filteredPerms.map((perm) => (
                                    <label
                                      key={perm.key}
                                      className={`flex items-start p-3 pl-10 cursor-pointer transition-colors ${
                                        isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                                      }`}
                                      aria-label={perm.description}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={customPermission.permission_keys.includes(perm.key)}
                                        onChange={(e) => {
                                          const newKeys = e.target.checked
                                            ? [...customPermission.permission_keys, perm.key]
                                            : customPermission.permission_keys.filter((k) => k !== perm.key);
                                          setCustomPermission({
                                            ...customPermission,
                                            permission_keys: newKeys,
                                          });
                                        }}
                                        className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      <div className="flex-1">
                                        <div
                                          className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                        >
                                          {perm.description}
                                        </div>
                                        <div
                                          className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                                        >
                                          {perm.key}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                <TextField
                  label="Reason (required)"
                  value={customPermission.reason}
                  onChange={(e) =>
                    setCustomPermission({
                      ...customPermission,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Explain why this permission is needed"
                  multiline
                  rows={2}
                />

                <div>
                  <label
                    htmlFor="permission-expires-at"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Expires At (optional)
                  </label>
                  <input
                    id="permission-expires-at"
                    type="datetime-local"
                    value={customPermission.expires_at || ""}
                    onChange={(e) =>
                      setCustomPermission({
                        ...customPermission,
                        expires_at: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Leave blank for permanent access
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-6 border-t flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button variant="outline" onClick={() => setCustomPermissionModal({ open: false, userId: null })}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (customPermission.permission_keys.length === 0 || !customPermission.reason) {
                      notificationService.warning("Please select at least one permission and provide a reason");
                      return;
                    }

                    // Grant all selected permissions
                    const results = await Promise.allSettled(
                      customPermission.permission_keys.map((permKey) =>
                        roleService.grantCustomPermission(
                          customPermissionModal.userId,
                          permKey,
                          customPermission.reason,
                          customPermission.expires_at || null
                        )
                      )
                    );

                    const succeeded = results.filter((r) => r.status === "fulfilled").length;
                    const failed = results.filter((r) => r.status === "rejected").length;

                    if (failed === 0) {
                      notificationService.success(
                        `Successfully granted ${succeeded} permission${succeeded !== 1 ? "s" : ""}!`
                      );
                    } else if (succeeded > 0) {
                      notificationService.warning(
                        `Granted ${succeeded} permission${succeeded !== 1 ? "s" : ""}, but ${failed} failed`
                      );
                    } else {
                      notificationService.error("Failed to grant permissions");
                    }

                    setCustomPermissionModal({ open: false, userId: null });
                  } catch (error) {
                    console.error("Error granting permissions:", error);
                    notificationService.error(error.response?.data?.error || "Failed to grant permissions");
                  }
                }}
                startIcon={<Shield size={20} />}
                disabled={customPermission.permission_keys.length === 0}
              >
                Grant {customPermission.permission_keys.length > 0 ? `${customPermission.permission_keys.length} ` : ""}
                Permission
                {customPermission.permission_keys.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditLogModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-4xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Permission Audit Log
                </h3>
                <button
                  type="button"
                  onClick={() => setAuditLogModal({ open: false, userId: null, logs: [] })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {auditLogModal.logs.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No audit log entries found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogModal.logs.map((log, index) => (
                    <div
                      key={log.id || log.name || `log-${index}`}
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                          <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            log.action === "grant"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : log.action === "revoke"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          }`}
                        >
                          {log.action.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <strong>Changed by:</strong> {log.changedByName}
                      </p>
                      {log.details && (
                        <div className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex justify-end`}>
              <Button variant="outline" onClick={() => setAuditLogModal({ open: false, userId: null, logs: [] })}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View All Permissions Modal */}
      {viewPermissionsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] flex flex-col`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    User Permissions
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {viewPermissionsModal.userName || "User"} - Complete Permission Breakdown
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setViewPermissionsModal({
                      open: false,
                      userId: null,
                      userName: "",
                      rolePermissions: [],
                      customGrants: [],
                      loading: false,
                    })
                  }
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {viewPermissionsModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Permissions from Roles */}
                  {viewPermissionsModal.rolePermissions.length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <Shield className={`mr-2 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} size={20} />
                        <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          From Assigned Roles
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {viewPermissionsModal.rolePermissions.map((role, idx) => (
                          <div
                            key={role.id || role.name || `role-${idx}`}
                            className={`rounded-lg border ${
                              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
                            } p-3`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const RoleIcon = getRoleIcon(role.name);
                                  return (
                                    <RoleIcon size={18} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
                                  );
                                })()}
                                <h5 className={`font-medium text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {role.displayName}
                                </h5>
                              </div>
                              {role.isDirector && (
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    isDarkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  Director
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <p
                                className={`text-sm leading-snug mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {role.description}
                              </p>
                            )}
                            {role.permissions && role.permissions.length > 0 ? (
                              <div className="grid grid-cols-1 gap-1.5">
                                {role.permissions.map((perm, permIdx) => {
                                  const PermIcon = getPermissionIcon(perm.permissionKey || perm.description);
                                  return (
                                    <div
                                      key={perm.id || perm.name || `perm-${permIdx}`}
                                      className={`flex items-center text-sm leading-tight ${
                                        isDarkMode ? "text-gray-300" : "text-gray-700"
                                      }`}
                                    >
                                      <PermIcon size={13} className="mr-1.5 text-green-500 flex-shrink-0" />
                                      <span className="truncate" title={perm.description}>
                                        {perm.description || perm.permissionKey}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                No specific permissions defined (may have full access)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Permission Grants */}
                  {viewPermissionsModal.customGrants && viewPermissionsModal.customGrants.length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <UserCheck className={`mr-2 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`} size={20} />
                        <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Custom Permission Grants
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {viewPermissionsModal.customGrants.map((grant, idx) => (
                          <div
                            key={grant.id || grant.name || `grant-${idx}`}
                            className={`rounded-lg border ${
                              isDarkMode ? "bg-yellow-900/10 border-yellow-700/30" : "bg-yellow-50 border-yellow-200"
                            } p-4`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <CheckCircle size={14} className="mr-2 text-yellow-500" />
                                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {grant.permissionKey}
                                  </span>
                                </div>
                                {grant.reason && (
                                  <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <strong>Reason:</strong> {grant.reason}
                                  </p>
                                )}
                                {grant.grantedByName && (
                                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <strong>Granted by:</strong> {grant.grantedByName}
                                  </p>
                                )}
                              </div>
                              {grant.expires_at && (
                                <div className="ml-4">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                                      new Date(grant.expires_at) < new Date()
                                        ? isDarkMode
                                          ? "bg-red-900/30 text-red-400"
                                          : "bg-red-100 text-red-700"
                                        : isDarkMode
                                          ? "bg-blue-900/30 text-blue-400"
                                          : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    <Clock size={12} className="mr-1" />
                                    Expires: {new Date(grant.expires_at).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Permissions */}
                  {viewPermissionsModal.rolePermissions.length === 0 &&
                    (!viewPermissionsModal.customGrants || viewPermissionsModal.customGrants.length === 0) && (
                      <div className="text-center py-12">
                        <Shield
                          size={48}
                          className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
                        />
                        <h4 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          No Permissions Assigned
                        </h4>
                        <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          This user has no roles or custom permissions assigned.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex justify-end`}>
              <Button
                variant="outline"
                onClick={() =>
                  setViewPermissionsModal({
                    open: false,
                    userId: null,
                    userName: "",
                    rolePermissions: [],
                    customGrants: [],
                    loading: false,
                  })
                }
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordChangeModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}>
            {/* Modal Header */}
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Key className={isDarkMode ? "text-teal-400" : "text-teal-600"} size={24} />
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Change Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPasswordChangeModal({
                      open: false,
                      userId: null,
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                      loading: false,
                      error: null,
                    })
                  }
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {passwordChangeModal.error && (
                <div
                  className={`p-3 rounded-lg ${
                    isDarkMode
                      ? "bg-red-900/20 text-red-400 border border-red-900"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {passwordChangeModal.error}
                </div>
              )}

              <div>
                <label
                  htmlFor="current-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordChangeModal.currentPassword}
                  onChange={(e) =>
                    setPasswordChangeModal((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-600"
                  } focus:outline-none`}
                  placeholder="Enter current password"
                  disabled={passwordChangeModal.loading}
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordChangeModal.newPassword}
                  onChange={(e) =>
                    setPasswordChangeModal((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-600"
                  } focus:outline-none`}
                  placeholder="Enter new password (min 8 chars)"
                  disabled={passwordChangeModal.loading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordChangeModal.confirmPassword}
                  onChange={(e) =>
                    setPasswordChangeModal((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-600"
                  } focus:outline-none`}
                  placeholder="Confirm new password"
                  disabled={passwordChangeModal.loading}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
            >
              <button
                type="button"
                onClick={() =>
                  setPasswordChangeModal({
                    open: false,
                    userId: null,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                    loading: false,
                    error: null,
                  })
                }
                disabled={passwordChangeModal.loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                }`}
              >
                Cancel
              </button>
              <Button onClick={handleChangePassword} disabled={passwordChangeModal.loading}>
                {passwordChangeModal.loading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Printing & Documents Settings
  const renderPrintingSettings = () => {
    // Guard: Ensure printingSettings is loaded
    if (!printingSettings || Object.keys(printingSettings).length === 0) {
      return (
        <SettingsPaper>
          <div className="p-6 text-center">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading printing settings...</p>
          </div>
        </SettingsPaper>
      );
    }

    return (
      <SettingsPaper className="max-w-3xl">
        <SectionHeader icon={Printer} title="Printing & Document Settings" />

        {/* Receipt Settings */}
        <SectionCard title="Payment Receipt Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receipt Size */}
            <div>
              <label
                htmlFor="receipt-size"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Receipt Size
              </label>
              <select
                id="receipt-size"
                value={printingSettings.receipt_size || "A5"}
                onChange={(e) =>
                  setPrintingSettings({
                    ...printingSettings,
                    receipt_size: e.target.value,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="A5">A5 (148mm x 210mm) - Recommended</option>
                <option value="A6">A6 (105mm x 148mm) - Compact</option>
                <option value="A4">A4 (210mm x 297mm) - Full Page</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Select the size for payment receipt PDFs
              </p>
            </div>

            {/* Print On Paper Size */}
            <div>
              <label
                htmlFor="print-on-paper-size"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Print On Paper Size
              </label>
              <select
                id="print-on-paper-size"
                value={printingSettings.print_on_paper_size || "A4"}
                onChange={(e) =>
                  setPrintingSettings({
                    ...printingSettings,
                    print_on_paper_size: e.target.value,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="A4">A4 (210mm x 297mm)</option>
                <option value="A5">A5 (148mm x 210mm)</option>
                <option value="A6">A6 (105mm x 148mm)</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Physical paper size loaded in printer
              </p>
            </div>
          </div>

          <div
            className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-teal-900/20 border-teal-700" : "bg-teal-50 border-teal-200"} border`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className={`${isDarkMode ? "text-teal-400" : "text-teal-600"} flex-shrink-0 mt-0.5`}
              />
              <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                <strong className={isDarkMode ? "text-teal-300" : "text-teal-700"}>Example:</strong> If Receipt Size =
                A5 and Print On = A4, the receipt will be A5 size centered on A4 paper. This is the most economical
                setting for standard printers.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Printer Selection */}
        <SectionCard title="Printer Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receipt Printer */}
            <div>
              <label
                htmlFor="receipt-printer"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Receipt Printer
              </label>
              <select
                id="receipt-printer"
                value={printingSettings.receipt_printer || "default"}
                onChange={(e) =>
                  setPrintingSettings({
                    ...printingSettings,
                    receipt_printer: e.target.value,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="default">Default Printer</option>
                <option value="receipt_printer">Receipt Printer (if available)</option>
                <option value="pdf_only">Save as PDF Only (No Print)</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Printer for payment receipts
              </p>
            </div>

            {/* Invoice Printer */}
            <div>
              <label
                htmlFor="invoice-printer"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Invoice Printer
              </label>
              <select
                id="invoice-printer"
                value={printingSettings.invoice_printer || "default"}
                onChange={(e) =>
                  setPrintingSettings({
                    ...printingSettings,
                    invoice_printer: e.target.value,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="default">Default Printer</option>
                <option value="main_printer">Main Office Printer</option>
                <option value="pdf_only">Save as PDF Only (No Print)</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Printer for invoices and documents
              </p>
            </div>
          </div>

          <div
            className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-teal-900/20 border-teal-700" : "bg-teal-50 border-teal-200"} border`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className={`${isDarkMode ? "text-teal-400" : "text-teal-600"} flex-shrink-0 mt-0.5`}
              />
              <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                <strong className={isDarkMode ? "text-teal-300" : "text-teal-700"}>Note:</strong> Printer selection
                works when using the browser&apos;s print dialog. For automatic printing, configure your browser&apos;s
                default printer settings.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Document Copies */}
        <SectionCard title="Document Copies">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Receipt Copies */}
            <div>
              <label
                htmlFor="receipt-copies"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Receipt Copies
              </label>
              <input
                id="receipt-copies"
                type="number"
                min="1"
                max="5"
                value={printingSettings.receipt_copies || 1}
                onChange={(e) =>
                  setPrintingSettings({
                    ...printingSettings,
                    receipt_copies: parseInt(e.target.value, 10) || 1,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Number of copies to print
              </p>
            </div>

            {/* Invoice Copies */}
            <div>
              <label
                htmlFor="invoice-copies"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Invoice Copies
              </label>
              <input
                id="invoice-copies"
                type="number"
                min="1"
                max="5"
                value={printingSettings.invoice_copies || 1}
                onChange={(e) =>
                  setPrintingSettings({
                    ...printingSettings,
                    invoice_copies: parseInt(e.target.value, 10) || 1,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Number of copies to print
              </p>
            </div>

            {/* Auto Print */}
            <div>
              <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Auto Print
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printingSettings.auto_print_receipts || false}
                    onChange={(e) =>
                      setPrintingSettings({
                        ...printingSettings,
                        auto_print_receipts: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Auto print receipts
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printingSettings.auto_print_invoices || false}
                    onChange={(e) =>
                      setPrintingSettings({
                        ...printingSettings,
                        auto_print_invoices: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Auto print invoices
                  </span>
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={resetPrintingSettings}>
            Reset to Defaults
          </Button>
          <Button startIcon={<Save size={20} />} onClick={savePrintingSettings} disabled={savingPrintingSettings}>
            {savingPrintingSettings ? "Saving..." : "Save Printing Settings"}
          </Button>
        </div>
      </SettingsPaper>
    );
  };

  const renderProductNamingSystem = () => {
    // Template renderer
    const renderTemplate = (template, product) => {
      const uniqueName = `SS-${product.grade}-${product.form}-${product.finish}-${product.width}mm-${product.thickness}mm-${product.length}mm`;

      let result = template;
      result = result.replace(/{unique_name}/g, uniqueName);
      result = result.replace(/{Grade}/g, product.grade);
      result = result.replace(/{Form}/g, product.form);
      result = result.replace(/{Finish}/g, product.finish);
      result = result.replace(/{Width}/g, product.width);
      result = result.replace(/{Thickness}/g, product.thickness);
      result = result.replace(/{Length}/g, product.length);
      result = result.replace(/{Origin}/g, product.origin);
      result = result.replace(/{Mill}/g, product.mill);

      return result;
    };

    const saveTemplates = async () => {
      try {
        setSavingTemplates(true);
        await updateCompany({
          name: companyProfile.name,
          address: companyProfile.address,
          product_dropdown_template: displayTemplates.product_dropdown_template,
          document_line_template: displayTemplates.document_line_template,
          report_template: displayTemplates.report_template,
        });
        notificationService.success("Display templates saved successfully");
        refetchCompany();
      } catch (error) {
        console.error("Failed to save templates:", error);
        notificationService.error("Failed to save templates");
      } finally {
        setSavingTemplates(false);
      }
    };

    return (
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Column - Actionable Content (60%) */}
        <div className="lg:w-3/5 space-y-4">
          <div
            className={`rounded-xl shadow-sm border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h3 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  📘 Product Naming System
                </h3>
                <p className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Configure how products are identified (fixed SSOT pattern) and displayed (customizable templates). The
                  identity pattern ensures data consistency, while display templates control presentation.
                </p>
              </div>

              {/* SSOT Product Identity Pattern (Read-Only) */}
              <div
                className={`mb-6 p-6 rounded-lg border-2 ${
                  isDarkMode ? "bg-teal-900/10 border-teal-700" : "bg-teal-50 border-teal-300"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}>
                    <Shield size={24} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Product Identity (SSOT - Fixed Pattern)
                    </h4>
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      This is the canonical product identifier used across the system.{" "}
                      <strong>It cannot be changed</strong> as it ensures data consistency.
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        PATTERN:
                      </p>
                      <code
                        className={`block p-3 rounded font-mono text-sm ${
                          isDarkMode ? "bg-gray-900 text-teal-300" : "bg-gray-50 text-teal-700"
                        }`}
                      >
                        SS-{"{Grade}"}-{"{Form}"}-{"{Finish}"}-{"{Width}"}mm-
                        {"{Thickness}"}mm-{"{Length}"}mm
                      </code>
                    </div>

                    <div>
                      <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        EXAMPLES:
                      </p>
                      <ul className={`space-y-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <li className="font-mono">• SS-316-Sheet-2B-1220mm-1.5mm-2440mm</li>
                        <li className="font-mono">• SS-304-Pipe-Polished-2inch-SCH40-6000mm</li>
                        <li className="font-mono">• SS-316L-Coil-2B-1000mm-1.2mm-0mm</li>
                      </ul>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${isDarkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-300"} border`}
                    >
                      <p className={`text-xs font-medium ${isDarkMode ? "text-yellow-300" : "text-yellow-800"}`}>
                        ⚠️ <strong>Important:</strong> Origin, mill, and supplier info are stored separately and NOT part
                        of product identity. Same material spec = same product, regardless of source.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Templates (User Configurable) */}
              <div
                className={`mb-4 p-6 rounded-lg border ${
                  isDarkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-900/30" : "bg-purple-100"}`}>
                    <Edit size={24} className={isDarkMode ? "text-purple-400" : "text-purple-600"} />
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Display Templates (Editable)
                    </h4>
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Control how products appear in different contexts. Templates can include both product AND
                      batch-level info.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Product Dropdown Template */}
                  <div>
                    <label
                      htmlFor="productDropdownTemplate"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Product Dropdown Template
                    </label>
                    <input
                      type="text"
                      id="productDropdownTemplate"
                      value={displayTemplates.product_dropdown_template}
                      onChange={(e) =>
                        setDisplayTemplates({
                          ...displayTemplates,
                          product_dropdown_template: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="{unique_name}"
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      How products appear in selection lists (product-level only)
                    </p>
                    <div className={`mt-2 p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Preview:</p>
                      <code className={`text-sm ${isDarkMode ? "text-teal-300" : "text-teal-700"}`}>
                        {renderTemplate(displayTemplates.product_dropdown_template, sampleProduct)}
                      </code>
                    </div>
                  </div>

                  {/* Document Line Template */}
                  <div>
                    <label
                      htmlFor="documentLineTemplate"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Document Line Template
                    </label>
                    <input
                      type="text"
                      id="documentLineTemplate"
                      value={displayTemplates.document_line_template}
                      onChange={(e) =>
                        setDisplayTemplates({
                          ...displayTemplates,
                          document_line_template: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="{unique_name} | {Origin} | {Mill}"
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      How products appear on invoices/delivery notes (can include batch info)
                    </p>
                    <div className={`mt-2 p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Preview:</p>
                      <code className={`text-sm ${isDarkMode ? "text-teal-300" : "text-teal-700"}`}>
                        {renderTemplate(displayTemplates.document_line_template, sampleProduct)}
                      </code>
                    </div>
                  </div>

                  {/* Report Template */}
                  <div>
                    <label
                      htmlFor="reportTemplate"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Report Template
                    </label>
                    <input
                      type="text"
                      id="reportTemplate"
                      value={displayTemplates.report_template}
                      onChange={(e) =>
                        setDisplayTemplates({
                          ...displayTemplates,
                          report_template: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="SS {Grade} {Form} {Finish} - {Origin} ({Mill})"
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      How products appear in reports and analytics
                    </p>
                    <div className={`mt-2 p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Preview:</p>
                      <code className={`text-sm ${isDarkMode ? "text-teal-300" : "text-teal-700"}`}>
                        {renderTemplate(displayTemplates.report_template, sampleProduct)}
                      </code>
                    </div>
                  </div>

                  {/* Available Placeholders Help */}
                  <div
                    className={`p-4 rounded-lg border ${isDarkMode ? "bg-blue-900/10 border-blue-700" : "bg-blue-50 border-blue-200"}`}
                  >
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                      Available Placeholders:
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <div>
                        <p className="font-semibold mb-1">Product-Level:</p>
                        <ul className="space-y-0.5 font-mono">
                          <li>{"{unique_name}"}</li>
                          <li>{"{Grade}"}</li>
                          <li>{"{Form}"}</li>
                          <li>{"{Finish}"}</li>
                          <li>
                            {"{Width}"}, {"{Thickness}"}, {"{Length}"}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Batch-Level:</p>
                        <ul className="space-y-0.5 font-mono">
                          <li>{"{Origin}"}</li>
                          <li>{"{Mill}"}</li>
                          <li>{"{MillCountry}"}</li>
                          <li>{"{BatchNumber}"}</li>
                          <li>{"{Container}"}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button startIcon={<Save size={20} />} onClick={saveTemplates} disabled={savingTemplates}>
                      {savingTemplates ? "Saving..." : "Save Templates"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documentation/Help (40%) */}
        <div className="lg:w-2/5 lg:self-stretch">
          <div
            className={`h-full rounded-xl shadow-sm border overflow-hidden ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <ProductNamingHelpPanel
              hasMismatch={Object.values(productVerificationStatus).some((status) => status.status === "error")}
            />
          </div>
        </div>
      </div>
    );
  };

  const isAdmin = authService.hasRole("admin");
  const tabs = [
    { id: "profile", label: "Company Profile", icon: Building },
    { id: "templates", label: "Document Templates", icon: FileText },
    { id: "printing", label: "Printing & Documents", icon: Printer },
    { id: "tax", label: "VAT Rates", icon: Calculator },
    { id: "fta", label: "FTA Integration", icon: Key },
    { id: "product-naming", label: "Product Naming System", icon: Tag },
    ...(isAdmin ? [{ id: "users", label: "User Management", icon: Users }] : []),
  ];

  // Debug logging
  // console.log('CompanySettings isDarkMode:', isDarkMode);

  return (
    <div
      className={`p-4 md:p-6 lg:p-8 min-h-screen w-full overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      {/* Back Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/app/dashboard")}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
          aria-label="Back to dashboard"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Header Section */}
      <div
        className={`mb-6 rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"} shadow-sm`}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Settings size={28} className={isDarkMode ? "text-gray-300" : "text-gray-700"} />
            <div>
              <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                ⚙️ Company Settings
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage your company profile, invoice templates, taxes, and users
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - Pill style for clarity, wraps on small screens */}
        <div
          className={`${isDarkMode ? "bg-gray-800 border-y border-[#37474F]" : "bg-white border-y border-gray-200"}`}
        >
          <div className={`flex flex-wrap gap-2 p-2 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors duration-200 ${
                    isDarkMode
                      ? isActive
                        ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                        : "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : isActive
                        ? "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                        : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "profile" && renderProfile()}
        {activeTab === "templates" && renderInvoiceTemplates()}
        {activeTab === "printing" && renderPrintingSettings()}
        {activeTab === "tax" && renderVatSettings()}
        {activeTab === "fta" && <FTAIntegrationSettings embedded />}
        {activeTab === "product-naming" && renderProductNamingSystem()}
        {isAdmin && activeTab === "users" && (
          <>
            {renderUserManagement()}
            {renderUserManagementModals()}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <ConfirmDialog
          open={deleteConfirm.open}
          title={`Delete ${deleteConfirm.itemName}?`}
          message={`Are you sure you want to delete this ${deleteConfirm.itemName}? This action cannot be undone.`}
          variant="danger"
          onConfirm={() => {
            const handlers = {
              logo: confirmLogoDelete,
              brandmark: confirmBrandmarkDelete,
              seal: confirmSealDelete,
              vat: confirmVatDelete,
              user: confirmUserDelete,
              role: confirmRoleDelete,
            };
            const handler = handlers[deleteConfirm.type];
            if (handler) {
              handler().finally(() =>
                setDeleteConfirm({
                  open: false,
                  type: null,
                  itemId: null,
                  itemName: null,
                })
              );
            }
          }}
          onCancel={() =>
            setDeleteConfirm({
              open: false,
              type: null,
              itemId: null,
              itemName: null,
            })
          }
        />
      )}
    </div>
  );
};

export default CompanySettings;
