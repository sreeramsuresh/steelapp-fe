import {
  ArrowLeft,
  Building,
  Calculator,
  Camera,
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  Globe,
  Key,
  Mail,
  MapPin,
  Plus,
  Printer,
  Save,
  Settings,
  Shield,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApi, useApiData } from "../hooks/useApi";
import FTAIntegrationSettings from "../pages/FTAIntegrationSettings";
import { companyService } from "../services/companyService";
import { notificationService } from "../services/notificationService";
import vatRateService from "../services/vatRateService";
import ConfirmDialog from "./ConfirmDialog";
import ProductNamingHelpPanel from "./ProductNamingHelpPanel";
import PhoneInput from "./shared/PhoneInput";
import VATRulesHelpPanel from "./VATRulesHelpPanel";

// Lazy-loaded heavy tab components (code-split into separate chunks)
const DocumentTemplatesTab = lazy(() => import("./settings/DocumentTemplatesTab"));
const PrintingSettingsTab = lazy(() => import("./settings/PrintingSettingsTab"));

// Tab loading skeleton
const TabSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className={`rounded-2xl shadow-lg border p-8 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
    >
      <div className="animate-pulse space-y-4">
        <div className={`h-6 w-48 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <div className={`h-4 w-full rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <div className={`h-4 w-3/4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <div className={`h-32 w-full rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      </div>
    </div>
  );
};

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
  const [showAddVatModal, setShowAddVatModal] = useState(false);

  const [newVatRate, setNewVatRate] = useState({
    name: "",
    rate: "",
    type: "percentage",
    description: "",
    active: true,
  });

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

  const renderProfile = () => (
    <SettingsPaper className="max-w-3xl">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Company Profile</h2>
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
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Basic Information
              </h3>

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
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Address Information
              </h3>

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
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                VAT Registration
              </h3>

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
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Bank Details
              </h3>

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
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Company Images (Logo, Brandmark, Seal)
                </h3>
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
                    <h4 className={`text-md font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Company Logo
                    </h4>
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

                      <div className="relative space-y-2">
                        <input
                          type="file"
                          id="logo-upload"
                          ref={logoInputRef}
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="sr-only"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={
                            uploadingLogo ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />
                          }
                          disabled={uploadingLogo}
                          onClick={() => {
                            if (logoInputRef.current) {
                              logoInputRef.current.value = "";
                              logoInputRef.current.click();
                            }
                          }}
                          type="button"
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
                    <h4 className={`text-md font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Company Brandmark
                    </h4>
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

                      <div className="relative space-y-2">
                        <input
                          type="file"
                          id="brandmark-upload"
                          ref={brandmarkInputRef}
                          accept="image/*"
                          onChange={handleBrandmarkUpload}
                          className="sr-only"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={
                            uploadingBrandmark ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />
                          }
                          disabled={uploadingBrandmark}
                          onClick={() => {
                            if (brandmarkInputRef.current) {
                              brandmarkInputRef.current.value = "";
                              brandmarkInputRef.current.click();
                            }
                          }}
                          type="button"
                        >
                          {uploadingBrandmark ? "Uploading..." : "Upload"}
                        </Button>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Max: 50KB</p>
                      </div>
                    </div>
                  </div>

                  {/* Seal Section */}
                  <div className="flex flex-col">
                    <h4 className={`text-md font-medium mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Company Seal
                    </h4>
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

                      <div className="relative space-y-2">
                        <input
                          type="file"
                          id="seal-upload"
                          ref={sealInputRef}
                          accept="image/*"
                          onChange={handleSealUpload}
                          className="sr-only"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={
                            uploadingSeal ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />
                          }
                          disabled={uploadingSeal}
                          onClick={() => {
                            if (sealInputRef.current) {
                              sealInputRef.current.value = "";
                              sealInputRef.current.click();
                            }
                          }}
                          type="button"
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
                    <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Enable Logos in Document Types
                    </h3>

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
                <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  VAT Rates Configuration
                </h2>
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
                    <h3 className="font-semibold mb-2">UAE Federal Tax Authority (FTA) VAT Compliance</h3>
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
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      No VAT Rates Configured
                    </h3>
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
                            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {vatRate.name}
                            </h3>
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
                <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  📘 Product Naming System
                </h2>
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
                    <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Product Identity (SSOT - Fixed Pattern)
                    </h3>
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
                    <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Display Templates (Editable)
                    </h3>
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

  const tabs = [
    { id: "profile", label: "Company Profile", icon: Building },
    { id: "templates", label: "Document Templates", icon: FileText },
    { id: "printing", label: "Printing & Documents", icon: Printer },
    { id: "tax", label: "VAT Rates", icon: Calculator },
    { id: "fta", label: "FTA Integration", icon: Key },
    { id: "product-naming", label: "Product Naming System", icon: Tag },
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
                Manage your company profile, invoice templates, taxes, and integrations
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
        {activeTab === "templates" && (
          <Suspense fallback={<TabSkeleton />}>
            <DocumentTemplatesTab />
          </Suspense>
        )}
        {activeTab === "printing" && (
          <Suspense fallback={<TabSkeleton />}>
            <PrintingSettingsTab />
          </Suspense>
        )}
        {activeTab === "tax" && renderVatSettings()}
        {activeTab === "fta" && <FTAIntegrationSettings embedded />}
        {activeTab === "product-naming" && renderProductNamingSystem()}
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
