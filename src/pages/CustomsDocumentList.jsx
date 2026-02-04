import {
  AlertCircle,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  FileText,
  Filter,
  Info,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { customsDocumentService } from "../services/customsDocumentService";
import { importOrderService } from "../services/importOrderService";

// Document type options
const DOCUMENT_TYPES = [
  { value: "import_permit", label: "Import Permit" },
  { value: "export_permit", label: "Export Permit" },
  { value: "customs_declaration", label: "Customs Declaration" },
  { value: "clearance_certificate", label: "Clearance Certificate" },
  { value: "duty_payment_receipt", label: "Duty Payment Receipt" },
];

// Status options with colors - UAE Customs BOE Workflow
const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  },
  {
    value: "submitted",
    label: "Submitted",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  {
    value: "under_review",
    label: "Under Review",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  {
    value: "assessed",
    label: "Assessed",
    color: "purple",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
  },
  {
    value: "payment_pending",
    label: "Payment Pending",
    color: "orange",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
  },
  {
    value: "examination_required",
    label: "Examination Required",
    color: "pink",
    bgColor: "bg-pink-100",
    textColor: "text-pink-800",
  },
  {
    value: "cleared",
    label: "Cleared",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  {
    value: "rejected",
    label: "Rejected",
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
  {
    value: "on_hold",
    label: "On Hold",
    color: "amber",
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
  },
];

// Common HS codes for stainless steel products
const HS_CODES = [
  {
    code: "7219.11",
    description: "Hot-rolled stainless steel coils >10mm thick",
  },
  {
    code: "7219.12",
    description: "Hot-rolled stainless steel coils 4.75-10mm thick",
  },
  {
    code: "7219.13",
    description: "Hot-rolled stainless steel coils 3-4.75mm thick",
  },
  {
    code: "7219.14",
    description: "Hot-rolled stainless steel coils <3mm thick",
  },
  {
    code: "7219.21",
    description: "Hot-rolled stainless steel sheets >10mm thick",
  },
  {
    code: "7219.22",
    description: "Hot-rolled stainless steel sheets 4.75-10mm thick",
  },
  {
    code: "7219.23",
    description: "Hot-rolled stainless steel sheets 3-4.75mm thick",
  },
  {
    code: "7219.24",
    description: "Hot-rolled stainless steel sheets <3mm thick",
  },
  {
    code: "7219.31",
    description: "Cold-rolled stainless steel sheets >4.75mm thick",
  },
  {
    code: "7219.32",
    description: "Cold-rolled stainless steel sheets 3-4.75mm thick",
  },
  {
    code: "7219.33",
    description: "Cold-rolled stainless steel sheets 1-3mm thick",
  },
  {
    code: "7219.34",
    description: "Cold-rolled stainless steel sheets 0.5-1mm thick",
  },
  {
    code: "7219.35",
    description: "Cold-rolled stainless steel sheets <0.5mm thick",
  },
  {
    code: "7220.11",
    description: "Hot-rolled stainless steel strips >4.75mm thick",
  },
  {
    code: "7220.12",
    description: "Hot-rolled stainless steel strips <4.75mm thick",
  },
  { code: "7220.20", description: "Cold-rolled stainless steel strips" },
  { code: "7221.00", description: "Stainless steel bars - hot rolled" },
  {
    code: "7222.11",
    description: "Stainless steel bars - circular cross-section",
  },
  {
    code: "7222.19",
    description: "Stainless steel bars - other cross-sections",
  },
  {
    code: "7222.20",
    description: "Stainless steel angles, shapes and sections",
  },
  { code: "7222.30", description: "Stainless steel bars and rods" },
  { code: "7222.40", description: "Stainless steel profiles" },
  {
    code: "7304.41",
    description: "Stainless steel tubes and pipes - cold drawn",
  },
  { code: "7304.49", description: "Stainless steel tubes and pipes - other" },
  { code: "7306.40", description: "Stainless steel welded tubes and pipes" },
];

// UAE Customs Rules Info
const UAE_CUSTOMS_INFO = {
  standardDutyRate: 5, // 5% on CIF value
  vatRate: 5, // 5% VAT
  gccOriginDuty: 0, // 0% for GCC origin with valid COO
};

// Initial form state
const initialFormState = {
  document_type: "customs_declaration",
  document_number: "",
  import_order_id: "",
  declaration_date: new Date().toISOString().split("T")[0],
  hs_codes: [],
  cif_value: "",
  duty_rate: UAE_CUSTOMS_INFO.standardDutyRate,
  duty_amount: 0,
  vat_rate: UAE_CUSTOMS_INFO.vatRate,
  vat_amount: 0,
  total_payable: 0,
  payment_reference: "",
  clearance_date: "",
  status: "pending",
  notes: "",
  gcc_origin: false,
  certificate_of_origin: "",
  coo_issue_date: "",
  coo_issuing_chamber: "",
  customs_broker_license: "",
  assessed_value: "",
  duty_payment_challan: "",
};

// HS Code format validation (6 or 8 digits with optional dot)
const validateHsCode = (code) => {
  const hsPattern = /^\d{4}\.\d{2}(\.\d{2})?$/;
  return hsPattern.test(code);
};

// GCC COO expiry validation (4 months = 120 days)
const validateCooExpiry = (issueDate) => {
  if (!issueDate) return { valid: false, message: "COO issue date required" };
  const issued = new Date(issueDate);
  const today = new Date();
  const daysDiff = Math.floor((today - issued) / (1000 * 60 * 60 * 24));
  if (daysDiff > 120) {
    return {
      valid: false,
      message: `COO expired. Valid for 4 months. Issued ${daysDiff} days ago.`,
    };
  }
  const daysRemaining = 120 - daysDiff;
  return {
    valid: true,
    message: `COO valid. ${daysRemaining} days remaining.`,
  };
};

const CustomsDocumentList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // State
  const [documents, setDocuments] = useState([]);
  const [importOrders, setImportOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    document_type: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Calculator modal
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    cif_value: "",
    hs_code: "",
    gcc_origin: false,
    duty_rate: UAE_CUSTOMS_INFO.standardDutyRate,
    vat_rate: UAE_CUSTOMS_INFO.vatRate,
  });
  const [calculatorResults, setCalculatorResults] = useState(null);

  // Info panel state
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Load documents
  const loadDocuments = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          page,
          limit: pagination.per_page,
          ...filters,
        };

        const response = await customsDocumentService.getCustomsDocuments(params);
        setDocuments(response.documents || response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  // Load import orders for linking
  const loadImportOrders = useCallback(async () => {
    try {
      const response = await importOrderService.getImportOrders({ limit: 100 });
      setImportOrders(response.orders || response.data || []);
    } catch (err) {
      console.error("Error loading import orders:", err);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadImportOrders();
  }, [loadDocuments, loadImportOrders]);

  // Calculate duties helper
  const calculateDuties = useCallback((cifValue, dutyRate, vatRate, gccOrigin = false) => {
    const cif = parseFloat(cifValue) || 0;
    const effectiveDutyRate = gccOrigin ? 0 : parseFloat(dutyRate) || UAE_CUSTOMS_INFO.standardDutyRate;
    const effectiveVatRate = parseFloat(vatRate) || UAE_CUSTOMS_INFO.vatRate;

    const dutyAmount = cif * (effectiveDutyRate / 100);
    const vatAmount = (cif + dutyAmount) * (effectiveVatRate / 100);
    const totalPayable = cif + dutyAmount + vatAmount;

    return {
      duty_amount: dutyAmount,
      vat_amount: vatAmount,
      total_payable: totalPayable,
      effective_duty_rate: effectiveDutyRate,
    };
  }, []);

  // Handle form field changes
  const handleFormChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Auto-calculate duties when CIF value or rates change
        if (["cif_value", "duty_rate", "vat_rate", "gcc_origin"].includes(field)) {
          const calculations = calculateDuties(
            field === "cif_value" ? value : prev.cif_value,
            field === "duty_rate" ? value : prev.duty_rate,
            field === "vat_rate" ? value : prev.vat_rate,
            field === "gcc_origin" ? value : prev.gcc_origin
          );
          updated.duty_amount = calculations.duty_amount;
          updated.vat_amount = calculations.vat_amount;
          updated.total_payable = calculations.total_payable;
          if (field === "gcc_origin" && value) {
            updated.duty_rate = 0;
          }
        }

        return updated;
      });

      // Clear field error when user modifies it
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [calculateDuties, formErrors]
  );

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.document_type) {
      errors.document_type = "Document type is required";
    }
    if (!formData.document_number?.trim()) {
      errors.document_number = "Document number (BOE) is required";
    }
    if (!formData.declaration_date) {
      errors.declaration_date = "Declaration date is required";
    }
    if (!formData.cif_value || parseFloat(formData.cif_value) <= 0) {
      errors.cif_value = "CIF value must be greater than 0";
    }

    // HS Code format validation
    if (formData.hs_codes && formData.hs_codes.length > 0) {
      const invalidCodes = formData.hs_codes.filter((code) => code && !validateHsCode(code));
      if (invalidCodes.length > 0) {
        errors.hs_codes = `Invalid HS code format: ${invalidCodes.join(", ")}. Use format: XXXX.XX or XXXX.XX.XX`;
      }
    }

    // GCC Origin COO validation
    if (formData.gcc_origin) {
      if (!formData.certificate_of_origin?.trim()) {
        errors.certificate_of_origin = "GCC Form D COO number required for duty exemption";
      }
      if (!formData.coo_issue_date) {
        errors.coo_issue_date = "COO issue date required for GCC origin";
      } else {
        const cooValidation = validateCooExpiry(formData.coo_issue_date);
        if (!cooValidation.valid) {
          errors.coo_issue_date = cooValidation.message;
        }
      }
      if (!formData.coo_issuing_chamber?.trim()) {
        errors.coo_issuing_chamber = "Issuing Chamber of Commerce required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle create/edit document
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        cif_value: parseFloat(formData.cif_value) || 0,
        duty_rate: parseFloat(formData.duty_rate) || 0,
        duty_amount: parseFloat(formData.duty_amount) || 0,
        vat_rate: parseFloat(formData.vat_rate) || 0,
        vat_amount: parseFloat(formData.vat_amount) || 0,
        total_payable: parseFloat(formData.total_payable) || 0,
        import_order_id: formData.import_order_id || null,
      };

      if (modalMode === "edit" && selectedDocument) {
        await customsDocumentService.updateCustomsDocument(selectedDocument.id, payload);
        setSuccessMessage("Document updated successfully");
      } else {
        await customsDocumentService.createCustomsDocument(payload);
        setSuccessMessage("Document created successfully");
      }

      setShowModal(false);
      setFormData(initialFormState);
      loadDocuments(pagination.current_page);

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (document) => {
    const confirmed = await confirm({
      title: "Delete Customs Document?",
      message: `Are you sure you want to delete document ${document.document_number}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await customsDocumentService.deleteCustomsDocument(document.id);
      setSuccessMessage("Document deleted successfully");
      loadDocuments(pagination.current_page);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete document");
    }
  };

  // Handle status update
  // Prefixed with underscore to indicate intentionally unused (future feature)
  const _handleStatusUpdate = async (document, newStatus) => {
    try {
      await customsDocumentService.updateClearance(
        document.id,
        newStatus,
        "",
        newStatus === "cleared" ? new Date().toISOString().split("T")[0] : null
      );
      setSuccessMessage(`Status updated to ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`);
      loadDocuments(pagination.current_page);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update status");
    }
  };

  // Open modal for create/edit/view
  const openModal = (mode, document = null) => {
    setModalMode(mode);
    setSelectedDocument(document);
    setFormErrors({});

    if (document && (mode === "edit" || mode === "view")) {
      setFormData({
        document_type: document.document_type || "customs_declaration",
        document_number: document.document_number || "",
        import_order_id: document.import_order_id || "",
        declaration_date: document.declaration_date ? document.declaration_date.split("T")[0] : "",
        hs_codes: document.hs_codes || [],
        cif_value: document.cif_value || "",
        duty_rate: document.duty_rate ?? UAE_CUSTOMS_INFO.standardDutyRate,
        duty_amount: document.duty_amount || 0,
        vat_rate: document.vat_rate ?? UAE_CUSTOMS_INFO.vatRate,
        vat_amount: document.vat_amount || 0,
        total_payable: document.total_payable || 0,
        payment_reference: document.payment_reference || "",
        clearance_date: document.clearance_date ? document.clearance_date.split("T")[0] : "",
        status: document.status || "pending",
        notes: document.notes || "",
        gcc_origin: document.gcc_origin || false,
        certificate_of_origin: document.certificate_of_origin || "",
      });
    } else {
      setFormData(initialFormState);
    }

    setShowModal(true);
  };

  // Open calculator
  const openCalculator = (document = null) => {
    if (document) {
      setCalculatorData({
        cif_value: document.cif_value || "",
        hs_code: document.hs_codes?.[0] || "",
        gcc_origin: document.gcc_origin || false,
        duty_rate: document.duty_rate ?? UAE_CUSTOMS_INFO.standardDutyRate,
        vat_rate: document.vat_rate ?? UAE_CUSTOMS_INFO.vatRate,
      });
    } else {
      setCalculatorData({
        cif_value: "",
        hs_code: "",
        gcc_origin: false,
        duty_rate: UAE_CUSTOMS_INFO.standardDutyRate,
        vat_rate: UAE_CUSTOMS_INFO.vatRate,
      });
    }
    setCalculatorResults(null);
    setShowCalculator(true);
  };

  // Calculate duties in calculator modal
  const performCalculation = () => {
    const results = calculateDuties(
      calculatorData.cif_value,
      calculatorData.gcc_origin ? 0 : calculatorData.duty_rate,
      calculatorData.vat_rate,
      calculatorData.gcc_origin
    );
    setCalculatorResults({
      ...results,
      cif_value: parseFloat(calculatorData.cif_value) || 0,
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    return (
      <span
        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}
      >
        {statusConfig.label}
      </span>
    );
  };

  // Get document type label
  const getDocumentTypeLabel = (type) => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-teal-600" />
            Customs Documents
          </h1>
          <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage BOE, permits, declarations, and duty calculations
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <Info size={18} />
            UAE Rules
          </button>
          <button
            type="button"
            onClick={() => openCalculator()}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            <Calculator size={18} />
            Duty Calculator
          </button>
          <button
            type="button"
            onClick={() => openModal("create")}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            New Document
          </button>
        </div>
      </div>

      {/* UAE Customs Info Panel */}
      {showInfoPanel && (
        <div
          className={`mb-6 rounded-lg p-6 ${isDarkMode ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
              UAE Customs Rules Reference
            </h3>
            <button type="button" onClick={() => setShowInfoPanel(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className={`font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Standard Duty Rate
              </h4>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>5%</p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Applied on CIF value</p>
            </button>
            <div>
              <h4 className={`font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>VAT Rate</h4>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>5%</p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Applied on (CIF + Duty)</p>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                * Reverse charge for VAT-registered businesses
              </p>
            </div>
            <div>
              <h4 className={`font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>GCC Origin</h4>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>0%</p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Duty exemption with valid COO
              </p>
            </div>
          </div>
          <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-blue-800" : "border-blue-200"}`}>
            <h4 className={`font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Calculation Formula
            </h4>
            <div className={`font-mono text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <p>Duty Amount = CIF Value x 5%</p>
              <p>VAT Amount = (CIF Value + Duty Amount) x 5%</p>
              <p>Total Payable = CIF Value + Duty Amount + VAT Amount</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-4 mb-6 shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by document number..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 placeholder-gray-500"
                }`}
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Filter size={18} />
            Filters
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadDocuments(1)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label
                htmlFor="filter-document-type"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Document Type
              </label>
              <select
                id="filter-document-type"
                value={filters.document_type}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    document_type: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              >
                <option value="">All Types</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-status"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Status
              </label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-start-date"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                From Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="filter-end-date"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                To Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No customs documents found</p>
            <button
              type="button"
              onClick={() => openModal("create")}
              className="text-teal-600 hover:text-teal-700 mt-2 inline-block"
            >
              Create your first customs document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Import Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Declaration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clearance Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CIF Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VAT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`${isDarkMode ? "bg-gray-800" : "bg-white"} divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}
              >
                {documents.map((doc) => (
                  <tr key={doc.id} className={`hover:${isDarkMode ? "bg-gray-700" : "bg-gray-50"} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{doc.document_number || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{getDocumentTypeLabel(doc.document_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{doc.import_order_number || doc.importOrderNumber || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{formatDate(doc.declaration_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{formatDate(doc.clearance_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium">{formatCurrency(doc.cif_value)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm">{formatCurrency(doc.duty_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm">{formatCurrency(doc.vat_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(doc.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openModal("view", doc)}
                          className="text-teal-600 hover:text-teal-800 p-1"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal("edit", doc)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openCalculator(doc)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Calculate Duties"
                        >
                          <Calculator size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div
            className={`px-6 py-3 flex items-center justify-between border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => loadDocuments(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => loadDocuments(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowModal(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          />
          <div
            className={`relative z-10 w-full max-w-4xl mx-4 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`sticky top-0 flex justify-between items-center px-6 py-4 border-b ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <h2 className="text-xl font-semibold">
                {modalMode === "create"
                  ? "New Customs Document"
                  : modalMode === "edit"
                    ? "Edit Customs Document"
                    : "View Customs Document"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Type */}
                <div>
                  <label
                    htmlFor="document-type"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Document Type *
                  </label>
                  <select
                    id="document-type"
                    value={formData.document_type}
                    onChange={(e) => handleFormChange("document_type", e.target.value)}
                    disabled={modalMode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.document_type ? "border-red-500" : isDarkMode ? "border-gray-600" : "border-gray-300"
                    } ${isDarkMode ? "bg-gray-700 text-white" : "bg-white"} ${
                      modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.document_type && <p className="text-red-500 text-sm mt-1">{formErrors.document_type}</p>}
                </div>

                {/* Document Number (BOE) */}
                <div>
                  <label
                    htmlFor="document-number"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Document Number (BOE) *
                  </label>
                  <input
                    id="document-number"
                    type="text"
                    value={formData.document_number}
                    onChange={(e) => handleFormChange("document_number", e.target.value)}
                    disabled={modalMode === "view"}
                    placeholder="e.g., BOE-2024-001234"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.document_number ? "border-red-500" : isDarkMode ? "border-gray-600" : "border-gray-300"
                    } ${isDarkMode ? "bg-gray-700 text-white" : "bg-white"} ${
                      modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  {formErrors.document_number && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.document_number}</p>
                  )}
                </div>

                {/* Link to Import Order */}
                <div>
                  <label
                    htmlFor="import-order-id"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Link to Import Order
                  </label>
                  <select
                    id="import-order-id"
                    value={formData.import_order_id}
                    onChange={(e) => handleFormChange("import_order_id", e.target.value)}
                    disabled={modalMode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">-- Select Import Order --</option>
                    {importOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.importOrderNumber || order.import_order_number} -{" "}
                        {order.supplierName || order.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Declaration Date */}
                <div>
                  <label
                    htmlFor="declaration-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Declaration Date *
                  </label>
                  <input
                    id="declaration-date"
                    type="date"
                    value={formData.declaration_date}
                    onChange={(e) => handleFormChange("declaration_date", e.target.value)}
                    disabled={modalMode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.declaration_date
                        ? "border-red-500"
                        : isDarkMode
                          ? "border-gray-600"
                          : "border-gray-300"
                    } ${isDarkMode ? "bg-gray-700 text-white" : "bg-white"} ${
                      modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  {formErrors.declaration_date && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.declaration_date}</p>
                  )}
                </div>

                {/* HS Code Selection */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="hs-code"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    HS Code
                  </label>
                  <select
                    id="hs-code"
                    value={formData.hs_codes?.[0] || ""}
                    onChange={(e) => handleFormChange("hs_codes", e.target.value ? [e.target.value] : [])}
                    disabled={modalMode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">-- Select HS Code --</option>
                    {HS_CODES.map((hs) => (
                      <option key={hs.code} value={hs.code}>
                        {hs.code} - {hs.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GCC Origin Checkbox */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gcc_origin}
                      onChange={(e) => handleFormChange("gcc_origin", e.target.checked)}
                      disabled={modalMode === "view"}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      GCC Origin (0% duty with valid Certificate of Origin)
                    </span>
                  </label>
                </div>

                {/* Certificate of Origin (if GCC) */}
                {formData.gcc_origin && (
                  <>
                    <div className="md:col-span-2">
                      <label
                        htmlFor="certificate-of-origin"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Certificate of Origin Reference
                      </label>
                      <input
                        id="certificate-of-origin"
                        type="text"
                        value={formData.certificate_of_origin}
                        onChange={(e) => handleFormChange("certificate_of_origin", e.target.value)}
                        disabled={modalMode === "view"}
                        placeholder="GCC Form D COO number"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                        } ${formErrors.certificate_of_origin ? "border-red-500" : ""} ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                      {formErrors.certificate_of_origin && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.certificate_of_origin}</p>
                      )}
                    </div>

                    {/* COO Issue Date */}
                    <div>
                      <label
                        htmlFor="coo-issue-date"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        COO Issue Date *
                      </label>
                      <input
                        id="coo-issue-date"
                        type="date"
                        value={formData.coo_issue_date}
                        onChange={(e) => handleFormChange("coo_issue_date", e.target.value)}
                        disabled={modalMode === "view"}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                        } ${formErrors.coo_issue_date ? "border-red-500" : ""} ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                      {formErrors.coo_issue_date && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.coo_issue_date}</p>
                      )}
                      {formData.coo_issue_date && !formErrors.coo_issue_date && (
                        <p className="text-green-500 text-xs mt-1">
                          {validateCooExpiry(formData.coo_issue_date).message}
                        </p>
                      )}
                    </div>

                    {/* Issuing Chamber */}
                    <div>
                      <label
                        htmlFor="coo-issuing-chamber"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Issuing Chamber *
                      </label>
                      <input
                        id="coo-issuing-chamber"
                        type="text"
                        value={formData.coo_issuing_chamber}
                        onChange={(e) => handleFormChange("coo_issuing_chamber", e.target.value)}
                        disabled={modalMode === "view"}
                        placeholder="e.g., Dubai Chamber of Commerce"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                        } ${formErrors.coo_issuing_chamber ? "border-red-500" : ""} ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                      {formErrors.coo_issuing_chamber && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.coo_issuing_chamber}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Duty Calculation Section */}
                <div className={`md:col-span-2 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                    Duty Calculation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CIF Value */}
                    <div>
                      <label
                        htmlFor="cif-value"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        CIF Value (AED) *
                      </label>
                      <input
                        id="cif-value"
                        type="number"
                        step="0.01"
                        value={formData.cif_value}
                        onChange={(e) => handleFormChange("cif_value", e.target.value)}
                        disabled={modalMode === "view"}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          formErrors.cif_value ? "border-red-500" : isDarkMode ? "border-gray-600" : "border-gray-300"
                        } ${isDarkMode ? "bg-gray-600 text-white" : "bg-white"} ${
                          modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      />
                      {formErrors.cif_value && <p className="text-red-500 text-sm mt-1">{formErrors.cif_value}</p>}
                    </div>

                    {/* Duty Rate */}
                    <div>
                      <label
                        htmlFor="duty-rate"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Duty Rate (%)
                      </label>
                      <input
                        id="duty-rate"
                        type="number"
                        step="0.01"
                        value={formData.duty_rate}
                        onChange={(e) => handleFormChange("duty_rate", e.target.value)}
                        disabled={modalMode === "view" || formData.gcc_origin}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode ? "bg-gray-600 border-gray-600 text-white" : "bg-white border-gray-300"
                        } ${modalMode === "view" || formData.gcc_origin ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                    </div>

                    {/* Duty Amount */}
                    <div>
                      <label
                        htmlFor="duty-amount"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Duty Amount (AED)
                      </label>
                      <input
                        id="duty-amount"
                        type="text"
                        value={formatCurrency(formData.duty_amount)}
                        disabled
                        className={`w-full px-3 py-2 border rounded-lg opacity-60 cursor-not-allowed ${
                          isDarkMode ? "bg-gray-600 border-gray-600 text-white" : "bg-gray-100 border-gray-300"
                        }`}
                      />
                    </div>

                    {/* VAT Rate */}
                    <div>
                      <label
                        htmlFor="vat-rate"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        VAT Rate (%)
                      </label>
                      <input
                        id="vat-rate"
                        type="number"
                        step="0.01"
                        value={formData.vat_rate}
                        onChange={(e) => handleFormChange("vat_rate", e.target.value)}
                        disabled={modalMode === "view"}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode ? "bg-gray-600 border-gray-600 text-white" : "bg-white border-gray-300"
                        } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                    </div>

                    {/* VAT Amount */}
                    <div>
                      <label
                        htmlFor="vat-amount"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        VAT Amount (AED)
                      </label>
                      <input
                        id="vat-amount"
                        type="text"
                        value={formatCurrency(formData.vat_amount)}
                        disabled
                        className={`w-full px-3 py-2 border rounded-lg opacity-60 cursor-not-allowed ${
                          isDarkMode ? "bg-gray-600 border-gray-600 text-white" : "bg-gray-100 border-gray-300"
                        }`}
                      />
                    </div>

                    {/* Total Payable */}
                    <div>
                      <label
                        htmlFor="total-payable"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-green-400" : "text-green-700"}`}
                      >
                        Total Payable (AED)
                      </label>
                      <input
                        id="total-payable"
                        type="text"
                        value={formatCurrency(formData.total_payable)}
                        disabled
                        className={`w-full px-3 py-2 border rounded-lg opacity-60 cursor-not-allowed font-bold ${
                          isDarkMode
                            ? "bg-green-900/30 border-green-600 text-green-400"
                            : "bg-green-100 border-green-300 text-green-700"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Reference */}
                <div>
                  <label
                    htmlFor="payment-reference"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Payment Reference
                  </label>
                  <input
                    id="payment-reference"
                    type="text"
                    value={formData.payment_reference}
                    onChange={(e) => handleFormChange("payment_reference", e.target.value)}
                    disabled={modalMode === "view"}
                    placeholder="Payment transaction reference"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>

                {/* Clearance Date */}
                <div>
                  <label
                    htmlFor="clearance-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Clearance Date
                  </label>
                  <input
                    id="clearance-date"
                    type="date"
                    value={formData.clearance_date}
                    onChange={(e) => handleFormChange("clearance_date", e.target.value)}
                    disabled={modalMode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    disabled={modalMode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="notes"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    disabled={modalMode === "view"}
                    rows={3}
                    placeholder="Additional notes or comments..."
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${modalMode === "view" ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>

                {/* File Upload Placeholder */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="scanned-documents"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Scanned Documents
                  </label>
                  <div
                    id="scanned-documents"
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      isDarkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-300 hover:border-gray-400"
                    } ${modalMode === "view" ? "opacity-60" : "cursor-pointer"}`}
                  >
                    <Upload className={`mx-auto mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} size={32} />
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {modalMode === "view"
                        ? "No documents attached"
                        : "Click to upload or drag and drop scanned documents"}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              {modalMode !== "view" && (
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving && <RefreshCw size={16} className="animate-spin" />}
                    {modalMode === "edit" ? "Update Document" : "Create Document"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Duty Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCalculator(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowCalculator(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close calculator"
          />
          <div
            className={`relative z-10 w-full max-w-lg mx-4 rounded-xl shadow-2xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Calculator Header */}
            <div
              className={`flex justify-between items-center px-6 py-4 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calculator className="text-purple-600" size={24} />
                UAE Customs Duty Calculator
              </h2>
              <button
                type="button"
                onClick={() => setShowCalculator(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            {/* Calculator Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* CIF Value Input */}
                <div>
                  <label
                    htmlFor="calc-cif-value"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    CIF Value (AED)
                  </label>
                  <input
                    id="calc-cif-value"
                    type="number"
                    step="0.01"
                    value={calculatorData.cif_value}
                    onChange={(e) =>
                      setCalculatorData((prev) => ({
                        ...prev,
                        cif_value: e.target.value,
                      }))
                    }
                    placeholder="Enter CIF value"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                {/* HS Code */}
                <div>
                  <label
                    htmlFor="calc-hs-code"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    HS Code (Optional)
                  </label>
                  <select
                    id="calc-hs-code"
                    value={calculatorData.hs_code}
                    onChange={(e) =>
                      setCalculatorData((prev) => ({
                        ...prev,
                        hs_code: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="">-- Select HS Code --</option>
                    {HS_CODES.map((hs) => (
                      <option key={hs.code} value={hs.code}>
                        {hs.code} - {hs.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GCC Origin */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calculatorData.gcc_origin}
                      onChange={(e) =>
                        setCalculatorData((prev) => ({
                          ...prev,
                          gcc_origin: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      GCC Origin (0% duty)
                    </span>
                  </label>
                </div>

                {/* Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="calc-duty-rate"
                      className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Duty Rate (%)
                    </label>
                    <input
                      id="calc-duty-rate"
                      type="number"
                      step="0.01"
                      value={calculatorData.duty_rate}
                      onChange={(e) =>
                        setCalculatorData((prev) => ({
                          ...prev,
                          duty_rate: e.target.value,
                        }))
                      }
                      disabled={calculatorData.gcc_origin}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      } ${calculatorData.gcc_origin ? "opacity-60" : ""}`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="calc-vat-rate"
                      className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      VAT Rate (%)
                    </label>
                    <input
                      id="calc-vat-rate"
                      type="number"
                      step="0.01"
                      value={calculatorData.vat_rate}
                      onChange={(e) =>
                        setCalculatorData((prev) => ({
                          ...prev,
                          vat_rate: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                {/* Calculate Button */}
                <button
                  type="button"
                  onClick={performCalculation}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  Calculate Duties
                </button>

                {/* Results */}
                {calculatorResults && (
                  <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                      Calculation Results
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>CIF Value:</span>
                        <span className="font-medium">{formatCurrency(calculatorResults.cif_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                          Duty ({calculatorData.gcc_origin ? "0" : calculatorData.duty_rate}
                          %):
                        </span>
                        <span className="font-medium">{formatCurrency(calculatorResults.duty_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                          VAT ({calculatorData.vat_rate}%):
                        </span>
                        <span className="font-medium">{formatCurrency(calculatorResults.vat_amount)}</span>
                      </div>
                      <div
                        className={`flex justify-between pt-2 border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                      >
                        <span className={`font-semibold ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
                          Total Payable:
                        </span>
                        <span className={`font-bold text-lg ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
                          {formatCurrency(calculatorResults.total_payable)}
                        </span>
                      </div>
                    </div>

                    {calculatorData.gcc_origin && (
                      <div
                        className={`mt-3 p-2 rounded ${isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}
                      >
                        <p className="text-sm">GCC Origin exemption applied - 0% customs duty</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
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
    </div>
  );
};

export default CustomsDocumentList;
