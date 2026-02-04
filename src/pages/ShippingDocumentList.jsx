import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  MapPin,
  Package,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Ship,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { exportOrderService } from "../services/exportOrderService";
import { importOrderService } from "../services/importOrderService";
import { shippingDocumentService } from "../services/shippingDocumentService";

// Document Type Configuration
const DOCUMENT_TYPES = [
  {
    value: "bill_of_lading",
    label: "Bill of Lading (BOL)",
    icon: Ship,
    color: "blue",
  },
  {
    value: "airway_bill",
    label: "Airway Bill (AWB)",
    icon: Plane,
    color: "purple",
  },
  {
    value: "packing_list",
    label: "Packing List",
    icon: Package,
    color: "green",
  },
  {
    value: "shipping_instruction",
    label: "Shipping Instruction",
    icon: FileText,
    color: "yellow",
  },
  {
    value: "delivery_order",
    label: "Delivery Order",
    icon: Truck,
    color: "orange",
  },
];

// Status Configuration
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "gray",
    bgLight: "bg-gray-100",
    bgDark: "bg-gray-700",
    textLight: "text-gray-700",
    textDark: "text-gray-300",
  },
  shipped: {
    label: "Shipped",
    color: "blue",
    bgLight: "bg-blue-100",
    bgDark: "bg-blue-900/30",
    textLight: "text-blue-700",
    textDark: "text-blue-300",
  },
  in_transit: {
    label: "In Transit",
    color: "yellow",
    bgLight: "bg-yellow-100",
    bgDark: "bg-yellow-900/30",
    textLight: "text-yellow-700",
    textDark: "text-yellow-300",
  },
  arrived: {
    label: "Arrived",
    color: "orange",
    bgLight: "bg-orange-100",
    bgDark: "bg-orange-900/30",
    textLight: "text-orange-700",
    textDark: "text-orange-300",
  },
  delivered: {
    label: "Delivered",
    color: "green",
    bgLight: "bg-green-100",
    bgDark: "bg-green-900/30",
    textLight: "text-green-700",
    textDark: "text-green-300",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
    bgLight: "bg-red-100",
    bgDark: "bg-red-900/30",
    textLight: "text-red-700",
    textDark: "text-red-300",
  },
};

// Tracking Milestones
const TRACKING_MILESTONES = [
  { key: "pending", label: "Document Created", icon: FileText },
  { key: "shipped", label: "Departed", icon: Ship },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "arrived", label: "Arrived", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: Check },
];

// Empty form state
// Freight VAT treatment options (UAE VAT Law Article 45)
const FREIGHT_VAT_TREATMENT_OPTIONS = [
  { value: "zero_rated", label: "Zero-Rated (0%) - International Transport" },
  { value: "standard", label: "Standard (5%) - Domestic Transport" },
  { value: "exempt", label: "Exempt - Certain Passenger Transport" },
];

const EMPTY_FORM = {
  document_type: "bill_of_lading",
  document_number: "",
  import_order_id: "",
  export_order_id: "",
  vessel_name: "",
  voyage_number: "",
  container_numbers: "",
  seal_numbers: "",
  origin_port: "",
  destination_port: "",
  etd: "",
  eta: "",
  actual_departure: "",
  actual_arrival: "",
  carrier_name: "",
  shipper_name: "",
  consignee_name: "",
  notify_party: "",
  freight_terms: "prepaid",
  // UAE VAT Compliance - Freight VAT Treatment (Article 45)
  freight_vat_treatment: "zero_rated", // zero_rated (international), standard (domestic), exempt
  freight_value: "",
  freight_vat_amount: 0,
  weight_kg: "",
  volume_cbm: "",
  number_of_packages: "",
  goods_description: "",
  notes: "",
  status: "pending",
};

const ShippingDocumentList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // List State
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 25,
    total: 0,
    total_pages: 0,
  });

  // Filter State
  const [filters, setFilters] = useState({
    search: "",
    document_type: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Tracking Modal State
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Orders for linking
  const [importOrders, setImportOrders] = useState([]);
  const [exportOrders, setExportOrders] = useState([]);

  // Load documents
  const loadDocuments = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit: pagination.per_page,
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
        };

        const response = await shippingDocumentService.getShippingDocuments(params);
        setDocuments(response.documents || response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
        setError(err.message || "Failed to load shipping documents");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  // Load orders for linking
  const loadOrders = useCallback(async () => {
    try {
      const [importRes, exportRes] = await Promise.all([
        importOrderService.getImportOrders({ limit: 100 }),
        exportOrderService.getExportOrders({ limit: 100 }),
      ]);
      setImportOrders(importRes.orders || []);
      setExportOrders(exportRes.orders || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    loadDocuments(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: "",
      document_type: "",
      status: "",
      start_date: "",
      end_date: "",
    });
    setTimeout(() => loadDocuments(1), 0);
  };

  // Open modal for create
  const handleCreate = () => {
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
    setSelectedDocument(null);
    setModalMode("create");
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (doc) => {
    setFormData({
      document_type: doc.document_type || "bill_of_lading",
      document_number: doc.document_number || "",
      import_order_id: doc.import_order_id || "",
      export_order_id: doc.export_order_id || "",
      vessel_name: doc.vessel_name || "",
      voyage_number: doc.voyage_number || "",
      container_numbers: doc.container_numbers || "",
      seal_numbers: doc.seal_numbers || "",
      origin_port: doc.origin_port || "",
      destination_port: doc.destination_port || "",
      etd: doc.etd ? doc.etd.split("T")[0] : "",
      eta: doc.eta ? doc.eta.split("T")[0] : "",
      actual_departure: doc.actual_departure ? doc.actual_departure.split("T")[0] : "",
      actual_arrival: doc.actual_arrival ? doc.actual_arrival.split("T")[0] : "",
      carrier_name: doc.carrier_name || "",
      shipper_name: doc.shipper_name || "",
      consignee_name: doc.consignee_name || "",
      notify_party: doc.notify_party || "",
      freight_terms: doc.freight_terms || "prepaid",
      weight_kg: doc.weight_kg || "",
      volume_cbm: doc.volume_cbm || "",
      number_of_packages: doc.number_of_packages || "",
      goods_description: doc.goods_description || "",
      notes: doc.notes || "",
      status: doc.status || "pending",
    });
    setFormErrors({});
    setSelectedDocument(doc);
    setModalMode("edit");
    setShowModal(true);
  };

  // Open modal for view
  const handleView = (doc) => {
    setSelectedDocument(doc);
    setModalMode("view");
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.document_number.trim()) {
      errors.document_number = "Document number is required";
    }
    if (!formData.document_type) {
      errors.document_type = "Document type is required";
    }
    if (!formData.origin_port.trim()) {
      errors.origin_port = "Origin port is required";
    }
    if (!formData.destination_port.trim()) {
      errors.destination_port = "Destination port is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        volume_cbm: formData.volume_cbm ? parseFloat(formData.volume_cbm) : null,
        number_of_packages: formData.number_of_packages ? parseInt(formData.number_of_packages, 10) : null,
      };

      if (modalMode === "create") {
        await shippingDocumentService.createShippingDocument(dataToSend);
        setSuccessMessage("Shipping document created successfully");
      } else if (modalMode === "edit") {
        await shippingDocumentService.updateShippingDocument(selectedDocument.id, dataToSend);
        setSuccessMessage("Shipping document updated successfully");
      }

      handleCloseModal();
      loadDocuments(pagination.current_page);
    } catch (err) {
      console.error("Error saving document:", err);
      setError(err.message || "Failed to save shipping document");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (doc) => {
    const confirmed = await confirm({
      title: "Delete Shipping Document?",
      message: `Are you sure you want to delete document "${doc.document_number}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await shippingDocumentService.deleteShippingDocument(doc.id);
      setSuccessMessage("Shipping document deleted successfully");
      loadDocuments(pagination.current_page);
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err.message || "Failed to delete shipping document");
    }
  };

  // Handle tracking
  const handleTrack = async (doc) => {
    setSelectedDocument(doc);
    setShowTrackingModal(true);
    setTrackingLoading(true);

    try {
      const tracking = await shippingDocumentService.trackShipment(doc.id);
      setTrackingData(tracking);
    } catch (err) {
      console.error("Error fetching tracking:", err);
      // Use document status as fallback
      setTrackingData({
        status: doc.status,
        milestones: [],
        lastUpdate: doc.updated_at,
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  // Get status milestone index
  const getStatusIndex = (status) => {
    const index = TRACKING_MILESTONES.findIndex((m) => m.key === status);
    return index >= 0 ? index : 0;
  };

  // Get document type config
  const getDocTypeConfig = (type) => {
    return DOCUMENT_TYPES.find((t) => t.value === type) || DOCUMENT_TYPES[0];
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          isDarkMode ? `${config.bgDark} ${config.textDark}` : `${config.bgLight} ${config.textLight}`
        }`}
      >
        {config.label}
      </span>
    );
  };

  // Document Type Icon Component
  const DocTypeIcon = ({ type, size = 16 }) => {
    const config = getDocTypeConfig(type);
    const Icon = config.icon;
    return <Icon size={size} className={`text-${config.color}-500`} />;
  };

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="text-teal-600" size={28} />
            Shipping Documents
          </h1>
          <p className="text-gray-500 mt-1">Manage Bills of Lading, Airway Bills, and track shipments</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Document
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
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
                placeholder="Search by document number, vessel name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 placeholder-gray-500"
                } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"
            } ${showFilters ? "bg-teal-50 border-teal-500 text-teal-600" : ""}`}
          >
            <Filter size={20} />
            Filters
            {(filters.document_type || filters.status || filters.start_date || filters.end_date) && (
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
            )}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadDocuments(pagination.current_page)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Document Type */}
              <div>
                <label htmlFor="filter-document-type" className="block text-sm font-medium mb-1">
                  Document Type
                </label>
                <select
                  id="filter-document-type"
                  value={filters.document_type}
                  onChange={(e) => handleFilterChange("document_type", e.target.value)}
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

              {/* Status */}
              <div>
                <label htmlFor="filter-status" className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label htmlFor="filter-start-date" className="block text-sm font-medium mb-1">
                  From Date
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange("start_date", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label htmlFor="filter-end-date" className="block text-sm font-medium mb-1">
                  To Date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange("end_date", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className={`px-4 py-2 border rounded-lg ${
                  isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <Ship className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 mb-2">No shipping documents found</p>
            <button type="button" onClick={handleCreate} className="text-teal-600 hover:text-teal-700">
              Create your first shipping document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel / Flight
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETD / ETA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {documents.map((doc) => (
                  <tr key={doc.id} className={`hover:${isDarkMode ? "bg-gray-700" : "bg-gray-50"} transition-colors`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <DocTypeIcon type={doc.document_type} size={20} />
                        <div>
                          <div className="font-medium">{doc.document_number}</div>
                          {doc.import_order_number && (
                            <div className="text-xs text-gray-500">Order: {doc.import_order_number}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm">{getDocTypeConfig(doc.document_type).label}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">{doc.vessel_name || "-"}</div>
                      {doc.voyage_number && <div className="text-xs text-gray-500">Voyage: {doc.voyage_number}</div>}
                      {doc.container_numbers && (
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={doc.container_numbers}>
                          Container: {doc.container_numbers.split("\n")[0]}
                          {doc.container_numbers.includes("\n") && "..."}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium">{doc.origin_port || "-"}</span>
                        <ArrowRight size={14} className="text-gray-400" />
                        <span className="font-medium">{doc.destination_port || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          ETD: {formatDate(doc.etd)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock size={12} className="text-gray-400" />
                          ETA: {formatDate(doc.eta)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleView(doc)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-teal-600"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(doc)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTrack(doc)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-purple-600"
                          title="Track Shipment"
                        >
                          <MapPin size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </button>
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
            className={`px-6 py-3 flex items-center justify-between border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="text-sm text-gray-500">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => loadDocuments(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode ? "border-gray-600" : "border-gray-300"
                }`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => loadDocuments(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode ? "border-gray-600" : "border-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (modalMode === "create" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`sticky top-0 flex items-center justify-between p-6 border-b ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Ship className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {modalMode === "create" ? "New Shipping Document" : "Edit Shipping Document"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {modalMode === "create"
                      ? "Create a new BOL, AWB or shipping document"
                      : `Editing ${selectedDocument?.document_number}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Document Type & Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-document-type" className="block text-sm font-medium mb-1">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-document-type"
                    value={formData.document_type}
                    onChange={(e) => handleInputChange("document_type", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    } ${formErrors.document_type ? "border-red-500" : ""}`}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.document_type && <p className="text-red-500 text-xs mt-1">{formErrors.document_type}</p>}
                </div>

                <div>
                  <label htmlFor="modal-document-number" className="block text-sm font-medium mb-1">
                    Document Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-document-number"
                    type="text"
                    value={formData.document_number}
                    onChange={(e) => handleInputChange("document_number", e.target.value)}
                    placeholder="e.g., BOL-2024-001"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 placeholder-gray-500"
                    } ${formErrors.document_number ? "border-red-500" : ""}`}
                  />
                  {formErrors.document_number && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.document_number}</p>
                  )}
                </div>
              </div>

              {/* Linked Orders & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="modal-import-order" className="block text-sm font-medium mb-1">
                    Link to Import Order
                  </label>
                  <select
                    id="modal-import-order"
                    value={formData.import_order_id}
                    onChange={(e) => handleInputChange("import_order_id", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="">No linked order</option>
                    {importOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.import_order_number || order.importOrderNumber} -{" "}
                        {order.supplier_name || order.supplierName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-export-order" className="block text-sm font-medium mb-1">
                    Link to Export Order
                  </label>
                  <select
                    id="modal-export-order"
                    value={formData.export_order_id}
                    onChange={(e) => handleInputChange("export_order_id", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="">No linked order</option>
                    {exportOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.export_order_number || order.exportOrderNumber} -{" "}
                        {order.customer_name || order.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-status" className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    id="modal-status"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vessel / Flight Details */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Ship size={18} />
                  Vessel / Flight Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="modal-vessel-name" className="block text-sm font-medium mb-1">
                      Vessel / Flight Name
                    </label>
                    <input
                      id="modal-vessel-name"
                      type="text"
                      value={formData.vessel_name}
                      onChange={(e) => handleInputChange("vessel_name", e.target.value)}
                      placeholder="e.g., MSC OSCAR"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-voyage-number" className="block text-sm font-medium mb-1">
                      Voyage / Flight Number
                    </label>
                    <input
                      id="modal-voyage-number"
                      type="text"
                      value={formData.voyage_number}
                      onChange={(e) => handleInputChange("voyage_number", e.target.value)}
                      placeholder="e.g., 2024-V001"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-carrier-name" className="block text-sm font-medium mb-1">
                      Carrier Name
                    </label>
                    <input
                      id="modal-carrier-name"
                      type="text"
                      value={formData.carrier_name}
                      onChange={(e) => handleInputChange("carrier_name", e.target.value)}
                      placeholder="e.g., Maersk Line"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Container & Seal Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-container-numbers" className="block text-sm font-medium mb-1">
                    Container Numbers
                  </label>
                  <textarea
                    id="modal-container-numbers"
                    value={formData.container_numbers}
                    onChange={(e) => handleInputChange("container_numbers", e.target.value)}
                    placeholder="One container number per line"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="modal-seal-numbers" className="block text-sm font-medium mb-1">
                    Seal Numbers
                  </label>
                  <textarea
                    id="modal-seal-numbers"
                    value={formData.seal_numbers}
                    onChange={(e) => handleInputChange("seal_numbers", e.target.value)}
                    placeholder="One seal number per line"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Route */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <MapPin size={18} />
                  Route Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modal-origin-port" className="block text-sm font-medium mb-1">
                      Origin Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modal-origin-port"
                      type="text"
                      value={formData.origin_port}
                      onChange={(e) => handleInputChange("origin_port", e.target.value)}
                      placeholder="e.g., Shanghai, China"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      } ${formErrors.origin_port ? "border-red-500" : ""}`}
                    />
                    {formErrors.origin_port && <p className="text-red-500 text-xs mt-1">{formErrors.origin_port}</p>}
                  </div>
                  <div>
                    <label htmlFor="modal-destination-port" className="block text-sm font-medium mb-1">
                      Destination Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modal-destination-port"
                      type="text"
                      value={formData.destination_port}
                      onChange={(e) => handleInputChange("destination_port", e.target.value)}
                      placeholder="e.g., Mombasa, Kenya"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      } ${formErrors.destination_port ? "border-red-500" : ""}`}
                    />
                    {formErrors.destination_port && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.destination_port}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Calendar size={18} />
                  Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="modal-etd" className="block text-sm font-medium mb-1">
                      ETD
                    </label>
                    <input
                      id="modal-etd"
                      type="date"
                      value={formData.etd}
                      onChange={(e) => handleInputChange("etd", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-eta" className="block text-sm font-medium mb-1">
                      ETA
                    </label>
                    <input
                      id="modal-eta"
                      type="date"
                      value={formData.eta}
                      onChange={(e) => handleInputChange("eta", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-actual-departure" className="block text-sm font-medium mb-1">
                      Actual Departure
                    </label>
                    <input
                      id="modal-actual-departure"
                      type="date"
                      value={formData.actual_departure}
                      onChange={(e) => handleInputChange("actual_departure", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-actual-arrival" className="block text-sm font-medium mb-1">
                      Actual Arrival
                    </label>
                    <input
                      id="modal-actual-arrival"
                      type="date"
                      value={formData.actual_arrival}
                      onChange={(e) => handleInputChange("actual_arrival", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Parties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modal-shipper" className="block text-sm font-medium mb-1">
                      Shipper
                    </label>
                    <input
                      id="modal-shipper"
                      type="text"
                      value={formData.shipper_name}
                      onChange={(e) => handleInputChange("shipper_name", e.target.value)}
                      placeholder="Shipper name"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-consignee" className="block text-sm font-medium mb-1">
                      Consignee
                    </label>
                    <input
                      id="modal-consignee"
                      type="text"
                      value={formData.consignee_name}
                      onChange={(e) => handleInputChange("consignee_name", e.target.value)}
                      placeholder="Consignee name"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-notify-party" className="block text-sm font-medium mb-1">
                      Notify Party
                    </label>
                    <input
                      id="modal-notify-party"
                      type="text"
                      value={formData.notify_party}
                      onChange={(e) => handleInputChange("notify_party", e.target.value)}
                      placeholder="Notify party"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-freight-terms" className="block text-sm font-medium mb-1">
                      Freight Terms
                    </label>
                    <select
                      id="modal-freight-terms"
                      value={formData.freight_terms}
                      onChange={(e) => handleInputChange("freight_terms", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="prepaid">Prepaid</option>
                      <option value="collect">Collect</option>
                      <option value="third_party">Third Party</option>
                    </select>
                  </div>
                </div>

                {/* UAE VAT Treatment for Freight - Article 45 */}
                <div
                  className={`mt-4 p-3 rounded-lg ${isDarkMode ? "bg-indigo-900/30 border border-indigo-700" : "bg-indigo-50 border border-indigo-200"}`}
                >
                  <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? "text-indigo-300" : "text-indigo-800"}`}>
                    UAE VAT Treatment (Article 45)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="modal-freight-vat-treatment"
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-indigo-200" : "text-indigo-700"}`}
                      >
                        Freight VAT Treatment
                      </label>
                      <select
                        id="modal-freight-vat-treatment"
                        value={formData.freight_vat_treatment || "zero_rated"}
                        onChange={(e) => handleInputChange("freight_vat_treatment", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          isDarkMode ? "bg-gray-700 border-indigo-600 text-white" : "bg-white border-indigo-300"
                        }`}
                      >
                        {FREIGHT_VAT_TREATMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="modal-freight-value"
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-indigo-200" : "text-indigo-700"}`}
                      >
                        Freight Value (AED)
                      </label>
                      <input
                        id="modal-freight-value"
                        type="number"
                        value={formData.freight_value || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const vatRate = formData.freight_vat_treatment === "standard" ? 0.05 : 0;
                          handleInputChange("freight_value", e.target.value);
                          handleInputChange("freight_vat_amount", value * vatRate);
                        }}
                        placeholder="0.00"
                        step="0.01"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          isDarkMode
                            ? "bg-gray-700 border-indigo-600 text-white placeholder-gray-400"
                            : "bg-white border-indigo-300 placeholder-gray-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="modal-freight-vat-amount"
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-indigo-200" : "text-indigo-700"}`}
                      >
                        VAT Amount (AED)
                      </label>
                      <input
                        id="modal-freight-vat-amount"
                        type="number"
                        value={formData.freight_vat_amount || 0}
                        disabled
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          isDarkMode
                            ? "bg-gray-600 border-indigo-600 text-gray-300"
                            : "bg-gray-100 border-indigo-200 text-gray-600"
                        }`}
                      />
                    </div>
                  </div>
                  <p className={`mt-2 text-xs ${isDarkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                    International transport of goods is zero-rated under UAE VAT Law Article 45. Domestic transport
                    within UAE is standard-rated at 5%.
                  </p>
                </div>
              </div>

              {/* Cargo Details */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Package size={18} />
                  Cargo Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="modal-weight-kg" className="block text-sm font-medium mb-1">
                      Weight (KG)
                    </label>
                    <input
                      id="modal-weight-kg"
                      type="number"
                      value={formData.weight_kg}
                      onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-volume-cbm" className="block text-sm font-medium mb-1">
                      Volume (CBM)
                    </label>
                    <input
                      id="modal-volume-cbm"
                      type="number"
                      value={formData.volume_cbm}
                      onChange={(e) => handleInputChange("volume_cbm", e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-num-packages" className="block text-sm font-medium mb-1">
                      Number of Packages
                    </label>
                    <input
                      id="modal-num-packages"
                      type="number"
                      value={formData.number_of_packages}
                      onChange={(e) => handleInputChange("number_of_packages", e.target.value)}
                      placeholder="0"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="modal-goods-description" className="block text-sm font-medium mb-1">
                    Goods Description
                  </label>
                  <textarea
                    id="modal-goods-description"
                    value={formData.goods_description}
                    onChange={(e) => handleInputChange("goods_description", e.target.value)}
                    placeholder="Describe the goods being shipped"
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="modal-notes" className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  id="modal-notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes or remarks"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`sticky bottom-0 flex gap-3 p-6 border-t ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {saving ? "Saving..." : modalMode === "create" ? "Create Document" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showModal && modalMode === "view" && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            {/* Header */}
            <div
              className={`sticky top-0 flex items-center justify-between p-6 border-b ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <DocTypeIcon type={selectedDocument.document_type} size={28} />
                <div>
                  <h2 className="text-xl font-semibold">{selectedDocument.document_number}</h2>
                  <p className="text-sm text-gray-500">{getDocTypeConfig(selectedDocument.document_type).label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedDocument.status} />
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Route Summary */}
              <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-teal-50"}`}>
                <div className="flex items-center justify-center gap-4 text-lg">
                  <div className="text-center">
                    <div className="font-bold">{selectedDocument.origin_port || "-"}</div>
                    <div className="text-sm text-gray-500">Origin</div>
                  </div>
                  <ArrowRight size={24} className="text-teal-600" />
                  <div className="text-center">
                    <div className="font-bold">{selectedDocument.destination_port || "-"}</div>
                    <div className="text-sm text-gray-500">Destination</div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vessel Info */}
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Ship size={16} />
                    Vessel Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vessel Name:</span>
                      <span className="font-medium">{selectedDocument.vessel_name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Voyage Number:</span>
                      <span className="font-medium">{selectedDocument.voyage_number || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carrier:</span>
                      <span className="font-medium">{selectedDocument.carrier_name || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar size={16} />
                    Schedule
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ETD:</span>
                      <span className="font-medium">{formatDate(selectedDocument.etd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ETA:</span>
                      <span className="font-medium">{formatDate(selectedDocument.eta)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Departure:</span>
                      <span className="font-medium">{formatDate(selectedDocument.actual_departure)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Arrival:</span>
                      <span className="font-medium">{formatDate(selectedDocument.actual_arrival)}</span>
                    </div>
                  </div>
                </div>

                {/* Container Info */}
                {selectedDocument.container_numbers && (
                  <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Package size={16} />
                      Container Info
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Containers:</span>
                        <pre className="mt-1 font-mono text-xs">{selectedDocument.container_numbers}</pre>
                      </div>
                      {selectedDocument.seal_numbers && (
                        <div>
                          <span className="text-gray-500">Seals:</span>
                          <pre className="mt-1 font-mono text-xs">{selectedDocument.seal_numbers}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cargo */}
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Truck size={16} />
                    Cargo Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Weight:</span>
                      <span className="font-medium">
                        {selectedDocument.weight_kg ? `${selectedDocument.weight_kg} KG` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume:</span>
                      <span className="font-medium">
                        {selectedDocument.volume_cbm ? `${selectedDocument.volume_cbm} CBM` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Packages:</span>
                      <span className="font-medium">{selectedDocument.number_of_packages || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goods Description */}
              {selectedDocument.goods_description && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <h3 className="font-medium mb-2">Goods Description</h3>
                  <p className="text-sm">{selectedDocument.goods_description}</p>
                </div>
              )}

              {/* Notes */}
              {selectedDocument.notes && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm">{selectedDocument.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`sticky bottom-0 flex gap-3 p-6 border-t ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  handleEdit(selectedDocument);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700"
              >
                Edit Document
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  handleTrack(selectedDocument);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
              >
                Track Shipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-2xl rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Shipment Tracking</h2>
                  <p className="text-sm text-gray-500">{selectedDocument.document_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingData(null);
                }}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {trackingLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading tracking information...</p>
                </div>
              ) : (
                <>
                  {/* Route Summary */}
                  <div className={`p-4 mb-6 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-purple-50"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">From</div>
                        <div className="font-bold">{selectedDocument.origin_port || "-"}</div>
                      </div>
                      <div className="flex-1 mx-4 border-t-2 border-dashed border-purple-300"></div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">To</div>
                        <div className="font-bold">{selectedDocument.destination_port || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="mb-6">
                    <div className="text-center">
                      <StatusBadge status={selectedDocument.status} />
                      <p className="mt-2 text-sm text-gray-500">
                        Last Updated: {formatDate(selectedDocument.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Milestones Timeline */}
                  <div className="relative">
                    {TRACKING_MILESTONES.map((milestone, index) => {
                      const currentIndex = getStatusIndex(selectedDocument.status);
                      const isCompleted = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      const Icon = milestone.icon;

                      return (
                        <div key={milestone.key} className="flex items-start mb-6 last:mb-0">
                          {/* Timeline Line */}
                          {index < TRACKING_MILESTONES.length - 1 && (
                            <div
                              className={`absolute left-5 mt-10 w-0.5 h-12 ${
                                isCompleted && index < currentIndex
                                  ? "bg-green-500"
                                  : isDarkMode
                                    ? "bg-gray-600"
                                    : "bg-gray-300"
                              }`}
                            ></div>
                          )}

                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? isCurrent
                                  ? "bg-purple-500 text-white"
                                  : "bg-green-500 text-white"
                                : isDarkMode
                                  ? "bg-gray-700 text-gray-500"
                                  : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {isCompleted && !isCurrent ? <Check size={18} /> : <Icon size={18} />}
                          </div>

                          {/* Content */}
                          <div className="ml-4 flex-1">
                            <div
                              className={`font-medium ${
                                isCompleted
                                  ? isCurrent
                                    ? "text-purple-600 dark:text-purple-400"
                                    : ""
                                  : "text-gray-400"
                              }`}
                            >
                              {milestone.label}
                            </div>
                            {isCompleted && trackingData?.milestones?.[index] && (
                              <div className="text-sm text-gray-500">
                                {formatDate(trackingData.milestones[index].date)}
                                {trackingData.milestones[index].location && (
                                  <span> - {trackingData.milestones[index].location}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className={`flex gap-3 p-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <button
                type="button"
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingData(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleTrack(selectedDocument)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={trackingLoading ? "animate-spin" : ""} />
                Refresh
              </button>
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

export default ShippingDocumentList;
