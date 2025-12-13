import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/invoiceUtils";
import { format } from "date-fns";
import { customerService } from "../services/customerService";
import { supplierService } from "../services/supplierService";
import pricelistService from "../services/pricelistService";
import { useApiData, useApi } from "../hooks/useApi";
import { useTheme } from "../contexts/ThemeContext";
import { notificationService } from "../services/notificationService";
import { authService } from "../services/axiosAuthService";
import ConfirmDialog from "./ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import {
  FaUsers,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaHistory,
  FaChartBar,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaArrowUp,
  FaDollarSign,
  FaCalendarAlt,
  FaUpload,
  FaArchive,
} from "react-icons/fa";
import { ArrowUp, ArrowDown, ArrowUpDown, Settings2 } from "lucide-react";
import CustomerUpload from "./CustomerUpload";

// Column definitions for Customers table
const CUSTOMER_COLUMNS = [
  { key: "name", label: "Customer Name", width: "w-[200px]", required: true },
  { key: "company", label: "Company", width: "w-[150px]" },
  { key: "email", label: "Email", width: "w-[180px]" },
  { key: "phone", label: "Phone", width: "w-[120px]" },
  { key: "creditLimit", label: "Credit Limit", width: "w-[120px]" },
  { key: "creditUsed", label: "Credit Used", width: "w-[120px]" },
  { key: "status", label: "Status", width: "w-[100px]" },
];

// Column definitions for Suppliers table
const SUPPLIER_COLUMNS = [
  { key: "name", label: "Supplier Name", width: "w-[200px]", required: true },
  { key: "company", label: "Company", width: "w-[150px]" },
  { key: "email", label: "Email", width: "w-[180px]" },
  { key: "phone", label: "Phone", width: "w-[120px]" },
  { key: "trnNumber", label: "TRN", width: "w-[140px]" },
  { key: "paymentTerms", label: "Payment Terms", width: "w-[120px]" },
  { key: "status", label: "Status", width: "w-[100px]" },
];

const CustomerManagement = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Set notification service theme
  useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);
  const [activeTab, setActiveTab] = useState("profiles");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  // Table sorting state
  const [customerSortConfig, setCustomerSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [supplierSortConfig, setSupplierSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  // Column visibility state
  const [customerVisibleColumns, setCustomerVisibleColumns] = useState(
    CUSTOMER_COLUMNS.map((col) => col.key),
  );
  const [supplierVisibleColumns, setSupplierVisibleColumns] = useState(
    SUPPLIER_COLUMNS.map((col) => col.key),
  );

  // Column picker visibility
  const [showCustomerColumnPicker, setShowCustomerColumnPicker] =
    useState(false);
  const [showSupplierColumnPicker, setShowSupplierColumnPicker] =
    useState(false);

  const canReadCustomers =
    authService.hasPermission("customers", "read") ||
    authService.hasRole("admin");

  const {
    data: customersData,
    loading: loadingCustomers,
    error: customersError,
    refetch: refetchCustomers,
  } = useApiData(() => {
    if (!canReadCustomers) {
      // Avoid hitting the API if not permitted
      return Promise.resolve({ customers: [] });
    }
    return customerService.getCustomers({
      search: searchTerm,
      status: filterStatus === "all" ? undefined : filterStatus,
    });
  }, [searchTerm, filterStatus, canReadCustomers]);

  // Suppliers API hooks
  const {
    data: suppliersData,
    loading: loadingSuppliers,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useApiData(() => supplierService.getSuppliers(), []);

  // Pricelists API hooks
  const { data: pricelistsData, loading: _loadingPricelists } = useApiData(
    () => pricelistService.getAll({ include_items: false }),
    [],
  );
  const { execute: createSupplier, loading: creatingSupplier } = useApi(
    supplierService.createSupplier,
  );
  const { execute: updateSupplier, loading: updatingSupplier } = useApi(
    supplierService.updateSupplier,
  );
  const { execute: deleteSupplier } = useApi(supplierService.deleteSupplier);

  const { execute: createCustomer, loading: creatingCustomer } = useApi(
    customerService.createCustomer,
  );
  const { execute: updateCustomer, loading: updatingCustomer } = useApi(
    customerService.updateCustomer,
  );
  const { execute: _deleteCustomer } = useApi(customerService.deleteCustomer);
  const { execute: archiveCustomer } = useApi(customerService.archiveCustomer);
  const { execute: addContactHistory } = useApi(
    customerService.addContactHistory,
  );

  const customers = customersData?.customers || [];
  const pricelists = pricelistsData?.data || [];
  const canDeleteCustomers =
    authService.hasPermission("customers", "delete") ||
    authService.hasRole("admin");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // Supplier modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [contactHistoryCustomer, setContactHistoryCustomer] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    website: "",
    address: {
      street: "",
      city: "",
      country: "UAE",
    },
    company: "",
    credit_limit: 0,
    current_credit: 0,
    status: "active",
    vat_number: "",
    trn_number: "",
    trade_license_number: "",
    trade_license_expiry: "",
    pricelist_id: null,
    is_designated_zone: false, // UAE VAT: Customer in Free Zone
  });

  // TRN validation: UAE VAT TRN must start with "100" and be 15 digits.
  // Allow empty (optional), but if provided, enforce the full pattern.
  const validateTRN = (value) => {
    if (!value) return null; // optional
    const digits = String(value).replace(/\s+/g, "");
    if (!/^100\d{12}$/.test(digits))
      return "TRN must start with 100 and be 15 digits";
    return null;
  };

  // Best practice: sanitize input to digits-only and cap length to 15
  const sanitizeTRNInput = (value) =>
    String(value || "")
      .replace(/\D/g, "")
      .slice(0, 15);

  const [newContact, setNewContact] = useState({
    type: "call",
    subject: "",
    notes: "",
    contact_date: new Date().toISOString().split("T")[0],
  });

  const filteredCustomers = customers.filter((c) =>
    showArchived ? true : c.status !== "archived",
  );
  const suppliers = suppliersData?.suppliers || [];

  // Helper to get cell value for customer columns
  const getCustomerCellValue = (customer, columnKey) => {
    switch (columnKey) {
      case "name":
        return customer.name || "N/A";
      case "company":
        return customer.company || "-";
      case "email":
        return customer.email || "-";
      case "phone":
        return customer.phone || "-";
      case "creditLimit":
        return Number(customer.creditLimit) || 0;
      case "creditUsed":
        return Number(customer.currentCredit) || 0;
      case "status":
        return customer.status || "active";
      default:
        return "-";
    }
  };

  // Helper to get cell value for supplier columns
  const getSupplierCellValue = (supplier, columnKey) => {
    switch (columnKey) {
      case "name":
        return supplier.name || "N/A";
      case "company":
        return supplier.company || "-";
      case "email":
        return supplier.email || "-";
      case "phone":
        return supplier.phone || "-";
      case "trnNumber":
        return supplier.trnNumber || "-";
      case "paymentTerms":
        return supplier.paymentTerms || "-";
      case "status":
        return supplier.status || "active";
      default:
        return "-";
    }
  };

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aVal = getCustomerCellValue(a, customerSortConfig.key);
    const bVal = getCustomerCellValue(b, customerSortConfig.key);
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (customerSortConfig.direction === "asc") {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    }
    return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
  });

  // Sort suppliers
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const aVal = getSupplierCellValue(a, supplierSortConfig.key);
    const bVal = getSupplierCellValue(b, supplierSortConfig.key);
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (supplierSortConfig.direction === "asc") {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    }
    return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
  });

  // Handle customer sort
  const handleCustomerSort = (key) => {
    setCustomerSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle supplier sort
  const handleSupplierSort = (key) => {
    setSupplierSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Toggle column visibility
  const toggleCustomerColumn = (key) => {
    const col = CUSTOMER_COLUMNS.find((c) => c.key === key);
    if (col?.required) return;
    setCustomerVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleSupplierColumn = (key) => {
    const col = SUPPLIER_COLUMNS.find((c) => c.key === key);
    if (col?.required) return;
    setSupplierVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Sync search from URL param
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearchTerm(q);
  }, [searchParams]);

  // Navigate to customer detail page
  const handleCustomerClick = (customerId) => {
    navigate(`/customers/${customerId}?tab=overview`);
  };

  const handleAddCustomer = async () => {
    const trnError = validateTRN(newCustomer.trnNumber);
    if (trnError) {
      notificationService.error(trnError);
      return;
    }
    try {
      const customerData = {
        ...newCustomer,
        credit_limit:
          newCustomer.creditLimit === "" ? 0 : Number(newCustomer.creditLimit),
        current_credit:
          newCustomer.currentCredit === ""
            ? 0
            : Number(newCustomer.currentCredit),
      };
      await createCustomer(customerData);
      // TODO: Implement proper cache utility
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        alternate_phone: "",
        website: "",
        address: {
          street: "",
          city: "",
          country: "UAE",
        },
        company: "",
        credit_limit: "",
        current_credit: "",
        status: "active",
        vat_number: "",
        trn_number: "",
        trade_license_number: "",
        trade_license_expiry: "",
        pricelist_id: null,
        is_designated_zone: false,
      });
      setShowAddModal(false);
      refetchCustomers();
      notificationService.createSuccess("Customer");
    } catch (error) {
      notificationService.createError("Customer", error);
    }
  };

  const handleEditCustomer = async () => {
    const trnError = validateTRN(selectedCustomer?.trnNumber);
    if (trnError) {
      notificationService.error(trnError);
      return;
    }
    try {
      const customerData = {
        ...selectedCustomer,
        credit_limit:
          selectedCustomer.creditLimit === ""
            ? 0
            : Number(selectedCustomer.creditLimit),
        current_credit:
          selectedCustomer.currentCredit === ""
            ? 0
            : Number(selectedCustomer.currentCredit),
      };
      await updateCustomer(selectedCustomer.id, customerData);
      // TODO: Implement proper cache utility
      setShowEditModal(false);
      setSelectedCustomer(null);
      refetchCustomers();
      notificationService.updateSuccess("Customer");
    } catch (error) {
      notificationService.updateError("Customer", error);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    // Repurposed as Archive for safety
    const confirmed = await confirm({
      title: "Archive Customer?",
      message: "Archive this customer? You can restore later from the backend.",
      confirmText: "Archive",
      variant: "warning",
    });

    if (!confirmed) return;

    try {
      await archiveCustomer(customerId);
      // TODO: Implement proper cache utility
      refetchCustomers();
      notificationService.success("Customer archived successfully");
    } catch (error) {
      notificationService.apiError("Archive customer", error);
    }
  };

  // Supplier CRUD
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    status: "active",
    trn_number: "",
    payment_terms: "",
    default_currency: "AED",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    is_designated_zone: false, // UAE VAT: Supplier in Free Zone
  });

  const handleAddSupplier = async () => {
    const trnErr = validateTRN(newSupplier.trnNumber);
    if (trnErr) {
      notificationService.error(trnErr);
      return;
    }
    try {
      const data = { ...newSupplier };
      await createSupplier(data);
      setNewSupplier({
        name: "",
        email: "",
        phone: "",
        address: "",
        company: "",
        status: "active",
        trn_number: "",
        payment_terms: "",
        default_currency: "AED",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        is_designated_zone: false,
      });
      setShowAddSupplierModal(false);
      refetchSuppliers();
      notificationService.createSuccess("Supplier");
    } catch (e) {
      notificationService.createError("Supplier", e);
    }
  };

  const handleEditSupplier = async () => {
    const trnErr = validateTRN(selectedSupplier?.trnNumber);
    if (trnErr) {
      notificationService.error(trnErr);
      return;
    }
    try {
      await updateSupplier(selectedSupplier.id, selectedSupplier);
      setShowEditSupplierModal(false);
      setSelectedSupplier(null);
      refetchSuppliers();
      notificationService.updateSuccess("Supplier");
    } catch (e) {
      notificationService.updateError("Supplier", e);
    }
  };

  const handleDeleteSupplier = async (id) => {
    const confirmed = await confirm({
      title: "Delete Supplier?",
      message:
        "Are you sure you want to delete this supplier? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteSupplier(id);
      refetchSuppliers();
      notificationService.deleteSuccess("Supplier");
    } catch (e) {
      notificationService.deleteError("Supplier", e);
    }
  };

  const openContactHistory = (customer) => {
    setContactHistoryCustomer(customer);
    setShowContactHistory(true);
  };

  const addContactEntry = async () => {
    try {
      await addContactHistory(contactHistoryCustomer.id, newContact);

      setContactHistoryCustomer((prev) => ({
        ...prev,
        contactHistory: [
          ...(prev.contactHistory || []),
          {
            ...newContact,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          },
        ],
      }));

      setNewContact({
        type: "call",
        subject: "",
        notes: "",
        contact_date: new Date().toISOString().split("T")[0],
      });

      refetchCustomers();
      notificationService.success("Contact entry added successfully!");
    } catch (error) {
      notificationService.error(
        `Failed to add contact entry: ${error.message || "Unknown error"}`,
      );
    }
  };

  const calculateAnalytics = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(
      (c) => c.status === "active",
    ).length;
    const totalCreditLimit = customers.reduce(
      (sum, c) => sum + (Number(c.creditLimit) || 0),
      0,
    );
    const totalCreditUsed = customers.reduce(
      (sum, c) => sum + (Number(c.currentCredit) || 0),
      0,
    );
    const avgCreditUtilization =
      totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    return {
      totalCustomers,
      activeCustomers,
      totalCreditLimit,
      totalCreditUsed,
      availableCredit: totalCreditLimit - totalCreditUsed,
      avgCreditUtilization,
    };
  };

  const analytics = calculateAnalytics();

  // Common input styles
  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 ${
    isDarkMode
      ? "border-[#37474F] bg-[#1E2328] text-white placeholder-[#78909C]"
      : "border-[#E0E0E0] bg-white text-[#212121] placeholder-[#BDBDBD]"
  }`;

  const cardClasses = `rounded-xl border transition-all duration-300 ${
    isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
  }`;

  const textPrimary = isDarkMode ? "text-white" : "text-[#212121]";
  const textSecondary = isDarkMode ? "text-[#B0BEC5]" : "text-[#757575]";
  const textMuted = isDarkMode ? "text-[#78909C]" : "text-[#BDBDBD]";

  const renderProfiles = () => (
    <div className={`${cardClasses} p-6 mb-6`}>
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex items-center flex-1 max-w-md">
            <FaSearch className={`absolute left-3 ${textMuted}`} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 w-full ${
                isDarkMode
                  ? "border-[#37474F] bg-[#1E2328] text-white placeholder-[#78909C]"
                  : "border-[#E0E0E0] bg-white text-[#212121] placeholder-[#BDBDBD]"
              }`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 min-w-[150px] ${
              isDarkMode
                ? "border-[#37474F] bg-[#1E2328] text-white"
                : "border-[#E0E0E0] bg-white text-[#212121]"
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Show Archived Toggle */}
          <label
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="form-checkbox h-4 w-4 text-teal-600"
            />
            <span className="text-sm">Show archived</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          {/* Column Picker */}
          <div className="relative">
            <button
              onClick={() =>
                setShowCustomerColumnPicker(!showCustomerColumnPicker)
              }
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Configure Columns"
            >
              <Settings2 size={16} />
            </button>
            {showCustomerColumnPicker && (
              <div
                className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border shadow-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-3 py-2 border-b text-sm font-medium ${
                    isDarkMode
                      ? "border-gray-700 text-gray-300"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  Show Columns
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {CUSTOMER_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                        col.required ? "opacity-50 cursor-not-allowed" : ""
                      } ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={customerVisibleColumns.includes(col.key)}
                        onChange={() => toggleCustomerColumn(col.key)}
                        disabled={col.required}
                        className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{col.label}</span>
                      {col.required && (
                        <span className="text-xs text-gray-500">
                          (required)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <FaPlus />
            Add Customer
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-[#4CAF50] to-[#388E3C] text-white rounded-lg hover:from-[#66BB6A] hover:to-[#4CAF50] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <FaUpload />
            Upload Customers
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div
        className={`overflow-x-auto rounded-lg border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <table className="w-full min-w-[800px] table-fixed">
          {/* Table Header */}
          <thead
            className={`sticky top-0 z-10 ${
              isDarkMode ? "bg-gray-800" : "bg-gray-50"
            }`}
          >
            <tr>
              {CUSTOMER_COLUMNS.filter((col) =>
                customerVisibleColumns.includes(col.key),
              ).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleCustomerSort(col.key)}
                  className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors ${col.width} ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {customerSortConfig.key === col.key ? (
                      customerSortConfig.direction === "asc" ? (
                        <ArrowUp size={14} className="text-teal-500" />
                      ) : (
                        <ArrowDown size={14} className="text-teal-500" />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="opacity-40" />
                    )}
                  </div>
                </th>
              ))}
              <th
                className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider w-[100px] ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}
          >
            {sortedCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={customerVisibleColumns.length + 1}
                  className="text-center py-8"
                >
                  <p className={textMuted}>
                    {loadingCustomers
                      ? "Loading..."
                      : customersError
                        ? "Error loading customers."
                        : "No customers found. Try creating a new customer."}
                  </p>
                </td>
              </tr>
            ) : (
              sortedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className={`transition-colors ${
                    isDarkMode
                      ? "bg-gray-900 hover:bg-gray-800"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {CUSTOMER_COLUMNS.filter((col) =>
                    customerVisibleColumns.includes(col.key),
                  ).map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-sm whitespace-nowrap ${col.width} ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {col.key === "name" ? (
                        <div>
                          <button
                            onClick={() => handleCustomerClick(customer.id)}
                            className={`font-medium text-left hover:underline ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                          >
                            {getCustomerCellValue(customer, col.key)}
                          </button>
                          {customer.company && (
                            <div
                              className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                            >
                              {customer.company}
                            </div>
                          )}
                        </div>
                      ) : col.key === "creditLimit" ||
                        col.key === "creditUsed" ? (
                        <span
                          className={
                            col.key === "creditUsed" ? "font-medium" : ""
                          }
                        >
                          {formatCurrency(
                            getCustomerCellValue(customer, col.key),
                          )}
                        </span>
                      ) : col.key === "status" ? (
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            customer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : customer.status === "archived"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {customer.status}
                        </span>
                      ) : (
                        getCustomerCellValue(customer, col.key)
                      )}
                    </td>
                  ))}
                  {/* Actions Column */}
                  <td className="px-3 py-2 text-right w-[100px]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowEditModal(true);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-teal-400 hover:text-teal-300 hover:bg-gray-700"
                            : "text-teal-600 hover:text-teal-700 hover:bg-gray-100"
                        }`}
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => openContactHistory(customer)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                            : "text-blue-600 hover:text-blue-700 hover:bg-gray-100"
                        }`}
                        title="Contact History"
                      >
                        <FaHistory size={14} />
                      </button>
                      {canDeleteCustomers && (
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode
                              ? "text-yellow-400 hover:text-yellow-300 hover:bg-gray-700"
                              : "text-yellow-600 hover:text-yellow-700 hover:bg-gray-100"
                          }`}
                          title="Archive"
                        >
                          <FaArchive size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className={`${cardClasses} p-6 mb-6`}>
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6">
        <h3 className={`text-lg font-semibold ${textPrimary}`}>Suppliers</h3>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          {/* Column Picker */}
          <div className="relative">
            <button
              onClick={() =>
                setShowSupplierColumnPicker(!showSupplierColumnPicker)
              }
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Configure Columns"
            >
              <Settings2 size={16} />
            </button>
            {showSupplierColumnPicker && (
              <div
                className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border shadow-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-3 py-2 border-b text-sm font-medium ${
                    isDarkMode
                      ? "border-gray-700 text-gray-300"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  Show Columns
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {SUPPLIER_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                        col.required ? "opacity-50 cursor-not-allowed" : ""
                      } ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={supplierVisibleColumns.includes(col.key)}
                        onChange={() => toggleSupplierColumn(col.key)}
                        disabled={col.required}
                        className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{col.label}</span>
                      {col.required && (
                        <span className="text-xs text-gray-500">
                          (required)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <FaPlus />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Errors */}
      {suppliersError && (
        <div
          className={`rounded p-3 mb-4 ${isDarkMode ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-700"}`}
        >
          Failed to load suppliers
        </div>
      )}

      {/* Supplier Table */}
      <div
        className={`overflow-x-auto rounded-lg border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <table className="w-full min-w-[800px] table-fixed">
          {/* Table Header */}
          <thead
            className={`sticky top-0 z-10 ${
              isDarkMode ? "bg-gray-800" : "bg-gray-50"
            }`}
          >
            <tr>
              {SUPPLIER_COLUMNS.filter((col) =>
                supplierVisibleColumns.includes(col.key),
              ).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSupplierSort(col.key)}
                  className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors ${col.width} ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {supplierSortConfig.key === col.key ? (
                      supplierSortConfig.direction === "asc" ? (
                        <ArrowUp size={14} className="text-teal-500" />
                      ) : (
                        <ArrowDown size={14} className="text-teal-500" />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="opacity-40" />
                    )}
                  </div>
                </th>
              ))}
              <th
                className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider w-[100px] ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}
          >
            {loadingSuppliers ? (
              <tr>
                <td
                  colSpan={supplierVisibleColumns.length + 1}
                  className="text-center py-8"
                >
                  <p className={textMuted}>Loading suppliers...</p>
                </td>
              </tr>
            ) : sortedSuppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={supplierVisibleColumns.length + 1}
                  className="text-center py-8"
                >
                  <p className={textMuted}>No suppliers yet. Add one.</p>
                </td>
              </tr>
            ) : (
              sortedSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className={`transition-colors ${
                    isDarkMode
                      ? "bg-gray-900 hover:bg-gray-800"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {SUPPLIER_COLUMNS.filter((col) =>
                    supplierVisibleColumns.includes(col.key),
                  ).map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-sm whitespace-nowrap ${col.width} ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {col.key === "name" ? (
                        <div>
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowEditSupplierModal(true);
                            }}
                            className={`font-medium text-left hover:underline ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                          >
                            {getSupplierCellValue(supplier, col.key)}
                          </button>
                          {supplier.company && (
                            <div
                              className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                            >
                              {supplier.company}
                            </div>
                          )}
                        </div>
                      ) : col.key === "status" ? (
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            supplier.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {supplier.status || "active"}
                        </span>
                      ) : (
                        getSupplierCellValue(supplier, col.key)
                      )}
                    </td>
                  ))}
                  {/* Actions Column */}
                  <td className="px-3 py-2 text-right w-[100px]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowEditSupplierModal(true);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-teal-400 hover:text-teal-300 hover:bg-gray-700"
                            : "text-teal-600 hover:text-teal-700 hover:bg-gray-100"
                        }`}
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-red-400 hover:text-red-300 hover:bg-gray-700"
                            : "text-red-500 hover:text-red-600 hover:bg-gray-100"
                        }`}
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className={`${cardClasses} p-6`}>
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaUsers className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>
              Total Customers
            </h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>
            {analytics.totalCustomers}
          </p>
          <p className={`text-sm ${textSecondary}`}>
            {analytics.activeCustomers} active customers
          </p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaCreditCard className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>
              Total Credit Limit
            </h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>
            {formatCurrency(analytics.totalCreditLimit)}
          </p>
          <p className={`text-sm ${textSecondary}`}>Across all customers</p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaDollarSign className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>
              Credit Utilized
            </h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>
            {formatCurrency(analytics.totalCreditUsed)}
          </p>
          <p className={`text-sm ${textSecondary}`}>
            {Math.round(analytics.avgCreditUtilization)}% average utilization
          </p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaArrowUp className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>
              Available Credit
            </h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>
            {formatCurrency(analytics.availableCredit)}
          </p>
          <p className={`text-sm ${textSecondary}`}>Ready to be utilized</p>
        </div>
      </div>

      {/* Credit Utilization Chart */}
      <div className={`${cardClasses} p-6 hover:shadow-lg`}>
        <h3 className={`text-lg font-semibold mb-6 ${textPrimary}`}>
          Credit Utilization by Customer
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-opacity-50 transition-colors ${
                isDarkMode ? "hover:bg-[#37474F]" : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-40 text-sm font-medium truncate ${textPrimary}`}
              >
                {customer.name}
              </span>
              <div className="flex-1 flex items-center gap-3">
                <div
                  className={`flex-1 rounded-full h-3 ${isDarkMode ? "bg-[#37474F]" : "bg-gray-200"}`}
                >
                  <div
                    className="bg-[#008B8B] h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${customer.creditLimit > 0 ? ((customer.currentCredit || 0) / customer.creditLimit) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-sm font-medium w-12 text-right ${textSecondary}`}
                >
                  {customer.creditLimit > 0
                    ? Math.round(
                        ((customer.currentCredit || 0) / customer.creditLimit) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[100vw] overflow-x-hidden">
        {/* Page Header */}
        <div
          className={`mb-8 pb-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className={`text-3xl ${textSecondary}`} />
            <h1 className={`text-3xl font-bold ${textPrimary}`}>
              Customer Management
            </h1>
          </div>
          <p className={textSecondary}>
            Manage customer profiles, contact history, and credit limits
          </p>
        </div>

        {/* Tabs - Pill style */}
        <div
          className={`mb-6 ${isDarkMode ? "bg-transparent" : "bg-transparent"}`}
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("profiles")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === "profiles"
                  ? isDarkMode
                    ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                    : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                  : isDarkMode
                    ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                    : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FaUsers size={18} />
              Customer Profiles
            </button>
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === "suppliers"
                  ? isDarkMode
                    ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                    : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                  : isDarkMode
                    ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                    : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FaUsers size={18} />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === "analytics"
                  ? isDarkMode
                    ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                    : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                  : isDarkMode
                    ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                    : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FaChartBar size={18} />
              Analytics
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingCustomers && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B]"></div>
            <span className={`ml-3 ${textSecondary}`}>
              Loading customers...
            </span>
          </div>
        )}

        {/* Error State */}
        {customersError && (
          <div
            className={`rounded-lg p-4 mb-6 border ${
              isDarkMode
                ? "bg-red-900/20 border-red-800"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <FaExclamationTriangle
                className={isDarkMode ? "text-red-400" : "text-red-600"}
              />
              <span className={isDarkMode ? "text-red-200" : "text-red-800"}>
                Error loading customers: {customersError}
              </span>
              <button
                onClick={refetchCustomers}
                className={`ml-auto px-3 py-1 text-sm rounded transition-colors ${
                  isDarkMode
                    ? "bg-red-800 text-red-200 hover:bg-red-700"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === "profiles" && renderProfiles()}
          {activeTab === "suppliers" && renderSuppliers()}
          {activeTab === "analytics" && renderAnalytics()}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Add New Customer
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="customerName"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    placeholder="Enter customer name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerCompany"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    id="customerCompany"
                    value={newCustomer.company}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        company: e.target.value,
                      })
                    }
                    placeholder="Enter company name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerEmail"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerPhone"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerAlternatePhone"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    id="customerAlternatePhone"
                    value={newCustomer.alternatePhone}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        alternate_phone: e.target.value,
                      })
                    }
                    placeholder="Enter alternate phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerWebsite"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    id="customerWebsite"
                    value={newCustomer.website}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        website: e.target.value,
                      })
                    }
                    placeholder="Enter website URL"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerStreetAddress"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="customerStreetAddress"
                    value={newCustomer.address.street}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: {
                          ...newCustomer.address,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter street address"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerCity"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="customerCity"
                    value={newCustomer.address.city}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: {
                          ...newCustomer.address,
                          city: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter city"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerTRN"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    TRN Number
                  </label>
                  <input
                    type="text"
                    id="customerTRN"
                    inputMode="numeric"
                    pattern="\\d*"
                    maxLength={15}
                    value={newCustomer.trnNumber}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        trn_number: sanitizeTRNInput(e.target.value),
                      })
                    }
                    placeholder="100XXXXXXXXXXXX"
                    className={inputClasses}
                  />
                  {validateTRN(newCustomer.trnNumber) && (
                    <p className="text-xs text-red-600 mt-1">
                      {validateTRN(newCustomer.trnNumber)}
                    </p>
                  )}
                  {!validateTRN(newCustomer.trnNumber) && (
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      15 digits; must start with 100
                    </p>
                  )}
                </div>

                {/* UAE VAT: Designated Zone checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newCustomerDesignatedZone"
                    checked={newCustomer.isDesignatedZone || false}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        is_designated_zone: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="newCustomerDesignatedZone"
                    className={`text-sm font-medium ${textSecondary}`}
                  >
                    Designated Zone (Free Zone) Customer
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="customerTradeLicense"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    id="customerTradeLicense"
                    value={newCustomer.tradeLicenseNumber}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        trade_license_number: e.target.value,
                      })
                    }
                    placeholder="Enter trade license number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerTradeLicenseExpiry"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Trade License Expiry
                  </label>
                  <input
                    type="date"
                    id="customerTradeLicenseExpiry"
                    value={newCustomer.tradeLicenseExpiry}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        trade_license_expiry: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Important: Set expiry date for compliance tracking
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="customerCreditLimit"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Credit Limit (د.إ)
                  </label>
                  <input
                    type="number"
                    id="customerCreditLimit"
                    value={newCustomer.creditLimit || ""}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        credit_limit:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || "",
                      })
                    }
                    placeholder="Enter credit limit"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerCurrentCredit"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Current Credit Used (د.إ)
                  </label>
                  <input
                    type="number"
                    id="customerCurrentCredit"
                    value={newCustomer.currentCredit || ""}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        current_credit:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || "",
                      })
                    }
                    placeholder="Enter current credit used"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerPriceList"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Price List
                  </label>
                  <select
                    id="customerPriceList"
                    value={newCustomer.pricelistId || ""}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        pricelist_id: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value="">-- Use Default Price List --</option>
                    {pricelists.map((pricelist) => (
                      <option key={pricelist.id} value={pricelist.id}>
                        {pricelist.name}{" "}
                        {pricelist.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Optional: Assign a specific price list for this customer
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="customerStatus"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Status
                  </label>
                  <select
                    id="customerStatus"
                    value={newCustomer.status}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, status: e.target.value })
                    }
                    className={inputClasses}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors bg-transparent ${
                  isDarkMode
                    ? "text-[#B0BEC5] hover:text-gray-300"
                    : "text-[#757575] hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={
                  creatingCustomer || !!validateTRN(newCustomer.trnNumber)
                }
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {creatingCustomer ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Add Supplier
              </h2>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="newSupplierName"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="newSupplierName"
                  value={newSupplier.name}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="newSupplierCompany"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Company
                </label>
                <input
                  type="text"
                  id="newSupplierCompany"
                  value={newSupplier.company}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, company: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="newSupplierEmail"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="newSupplierEmail"
                  value={newSupplier.email}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, email: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="newSupplierPhone"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="newSupplierPhone"
                  value={newSupplier.phone}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, phone: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="newSupplierAddress"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Address
                </label>
                <input
                  type="text"
                  id="newSupplierAddress"
                  value={newSupplier.address}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, address: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="newSupplierTRN"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  TRN Number
                </label>
                <input
                  type="text"
                  id="newSupplierTRN"
                  inputMode="numeric"
                  pattern="\\d*"
                  maxLength={15}
                  placeholder="100XXXXXXXXXXXX"
                  value={newSupplier.trnNumber}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      trn_number: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15),
                    })
                  }
                  className={inputClasses}
                />
                {validateTRN(newSupplier.trnNumber) ? (
                  <p className="text-xs text-red-600 mt-1">
                    {validateTRN(newSupplier.trnNumber)}
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    15 digits; must start with 100
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newSupplierDesignatedZone"
                  checked={newSupplier.isDesignatedZone || false}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      is_designated_zone: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label
                  htmlFor="newSupplierDesignatedZone"
                  className={`text-sm font-medium ${textSecondary}`}
                >
                  Designated Zone (Free Zone) Supplier
                </label>
              </div>
              <div>
                <label
                  htmlFor="newSupplierPaymentTerms"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Payment Terms
                </label>
                <input
                  type="text"
                  id="newSupplierPaymentTerms"
                  placeholder="e.g., Net 30"
                  value={newSupplier.paymentTerms}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      payment_terms: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="newSupplierCurrency"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Default Currency
                </label>
                <select
                  id="newSupplierCurrency"
                  value={newSupplier.defaultCurrency}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      default_currency: e.target.value,
                    })
                  }
                  className={inputClasses}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="newSupplierContactName"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="newSupplierContactName"
                    value={newSupplier.contactName}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        contact_name: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label
                    htmlFor="newSupplierContactEmail"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="newSupplierContactEmail"
                    value={newSupplier.contactEmail}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        contact_email: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label
                    htmlFor="newSupplierContactPhone"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="newSupplierContactPhone"
                    value={newSupplier.contactPhone}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        contact_phone: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="newSupplierStatus"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Status
                </label>
                <select
                  id="newSupplierStatus"
                  value={newSupplier.status}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, status: e.target.value })
                  }
                  className={inputClasses}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div
              className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSupplier}
                disabled={
                  creatingSupplier || !!validateTRN(newSupplier.trnNumber)
                }
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg disabled:opacity-50"
              >
                <FaSave /> {creatingSupplier ? "Adding..." : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplierModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Edit Supplier
              </h2>
              <button
                onClick={() => setShowEditSupplierModal(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="editSupplierName"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="editSupplierName"
                  value={selectedSupplier.name}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      name: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="editSupplierCompany"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Company
                </label>
                <input
                  type="text"
                  id="editSupplierCompany"
                  value={selectedSupplier.company || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      company: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="editSupplierEmail"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="editSupplierEmail"
                  value={selectedSupplier.email || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      email: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="editSupplierPhone"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="editSupplierPhone"
                  value={selectedSupplier.phone || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      phone: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="editSupplierAddress"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Address
                </label>
                <input
                  type="text"
                  id="editSupplierAddress"
                  value={selectedSupplier.address || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      address: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="editSupplierTRN"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  TRN Number
                </label>
                <input
                  type="text"
                  id="editSupplierTRN"
                  inputMode="numeric"
                  pattern="\\d*"
                  maxLength={15}
                  placeholder="100XXXXXXXXXXXX"
                  value={selectedSupplier.trnNumber || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      trn_number: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15),
                    })
                  }
                  className={inputClasses}
                />
                {validateTRN(selectedSupplier.trnNumber) ? (
                  <p className="text-xs text-red-600 mt-1">
                    {validateTRN(selectedSupplier.trnNumber)}
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    15 digits; must start with 100
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editSupplierDesignatedZone"
                  checked={selectedSupplier.isDesignatedZone || false}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      is_designated_zone: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label
                  htmlFor="editSupplierDesignatedZone"
                  className={`text-sm font-medium ${textSecondary}`}
                >
                  Designated Zone (Free Zone) Supplier
                </label>
              </div>
              <div>
                <label
                  htmlFor="editSupplierPaymentTerms"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Payment Terms
                </label>
                <input
                  type="text"
                  id="editSupplierPaymentTerms"
                  placeholder="e.g., Net 30"
                  value={selectedSupplier.paymentTerms || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      payment_terms: e.target.value,
                    })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="editSupplierCurrency"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Default Currency
                </label>
                <select
                  id="editSupplierCurrency"
                  value={selectedSupplier.defaultCurrency || "AED"}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      default_currency: e.target.value,
                    })
                  }
                  className={inputClasses}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="editSupplierContactName"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="editSupplierContactName"
                    value={selectedSupplier.contactName || ""}
                    onChange={(e) =>
                      setSelectedSupplier({
                        ...selectedSupplier,
                        contact_name: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label
                    htmlFor="editSupplierContactEmail"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="editSupplierContactEmail"
                    value={selectedSupplier.contactEmail || ""}
                    onChange={(e) =>
                      setSelectedSupplier({
                        ...selectedSupplier,
                        contact_email: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label
                    htmlFor="editSupplierContactPhone"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="editSupplierContactPhone"
                    value={selectedSupplier.contactPhone || ""}
                    onChange={(e) =>
                      setSelectedSupplier({
                        ...selectedSupplier,
                        contact_phone: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="editSupplierStatus"
                  className={`block text-sm font-medium mb-1 ${textSecondary}`}
                >
                  Status
                </label>
                <select
                  id="editSupplierStatus"
                  value={selectedSupplier.status || "active"}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      status: e.target.value,
                    })
                  }
                  className={inputClasses}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div
              className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <button
                onClick={() => setShowEditSupplierModal(false)}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSupplier}
                disabled={
                  updatingSupplier || !!validateTRN(selectedSupplier.trnNumber)
                }
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg disabled:opacity-50"
              >
                <FaSave /> {updatingSupplier ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Edit Customer
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="editCustomerName"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="editCustomerName"
                    value={selectedCustomer.name}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        name: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerCompany"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    id="editCustomerCompany"
                    value={selectedCustomer.company}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        company: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerEmail"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="editCustomerEmail"
                    value={selectedCustomer.email}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        email: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerPhone"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="editCustomerPhone"
                    value={selectedCustomer.phone}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        phone: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerAlternatePhone"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    id="editCustomerAlternatePhone"
                    value={selectedCustomer.alternatePhone || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        alternate_phone: e.target.value,
                      })
                    }
                    placeholder="Enter alternate phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerWebsite"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    id="editCustomerWebsite"
                    value={selectedCustomer.website || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        website: e.target.value,
                      })
                    }
                    placeholder="Enter website URL"
                    className={inputClasses}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="editCustomerAddress"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Address
                  </label>
                  <textarea
                    rows={3}
                    id="editCustomerAddress"
                    value={
                      typeof selectedCustomer.address === "string"
                        ? selectedCustomer.address
                        : selectedCustomer.address
                          ? Object.values(selectedCustomer.address)
                              .filter((v) => v)
                              .join(", ")
                          : ""
                    }
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerTRN"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    TRN Number
                  </label>
                  <input
                    type="text"
                    id="editCustomerTRN"
                    inputMode="numeric"
                    pattern="\\d*"
                    maxLength={15}
                    value={selectedCustomer.trnNumber || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        trn_number: sanitizeTRNInput(e.target.value),
                      })
                    }
                    placeholder="100XXXXXXXXXXXX"
                    className={inputClasses}
                  />
                  {validateTRN(selectedCustomer.trnNumber) && (
                    <p className="text-xs text-red-600 mt-1">
                      {validateTRN(selectedCustomer.trnNumber)}
                    </p>
                  )}
                  {!validateTRN(selectedCustomer.trnNumber) && (
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      15 digits; must start with 100
                    </p>
                  )}
                </div>

                {/* UAE VAT: Designated Zone checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editCustomerDesignatedZone"
                    checked={selectedCustomer.isDesignatedZone || false}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        is_designated_zone: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="editCustomerDesignatedZone"
                    className={`text-sm font-medium ${textSecondary}`}
                  >
                    Designated Zone (Free Zone) Customer
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="editCustomerTradeLicense"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    id="editCustomerTradeLicense"
                    value={selectedCustomer.tradeLicenseNumber || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        trade_license_number: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerTradeLicenseExpiry"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Trade License Expiry
                  </label>
                  <input
                    type="date"
                    id="editCustomerTradeLicenseExpiry"
                    value={selectedCustomer.tradeLicenseExpiry || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        trade_license_expiry: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Important: Set expiry date for compliance tracking
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="editCustomerCreditLimit"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Credit Limit (د.إ)
                  </label>
                  <input
                    type="number"
                    id="editCustomerCreditLimit"
                    value={selectedCustomer.creditLimit || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        credit_limit:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || "",
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerCurrentCredit"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Current Credit Used (د.إ)
                  </label>
                  <input
                    type="number"
                    id="editCustomerCurrentCredit"
                    value={selectedCustomer.currentCredit || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        current_credit:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || "",
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label
                    htmlFor="editCustomerPriceList"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Price List
                  </label>
                  <select
                    id="editCustomerPriceList"
                    value={selectedCustomer.pricelistId || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        pricelist_id: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value="">-- Use Default Price List --</option>
                    {pricelists.map((pricelist) => (
                      <option key={pricelist.id} value={pricelist.id}>
                        {pricelist.name}{" "}
                        {pricelist.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Optional: Assign a specific price list for this customer
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="editCustomerStatus"
                    className={`block text-sm font-medium mb-1 ${textSecondary}`}
                  >
                    Status
                  </label>
                  <select
                    id="editCustomerStatus"
                    value={selectedCustomer.status}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        status: e.target.value,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors bg-transparent ${
                  isDarkMode
                    ? "text-[#B0BEC5] hover:text-gray-300"
                    : "text-[#757575] hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditCustomer}
                disabled={
                  updatingCustomer || !!validateTRN(selectedCustomer.trnNumber)
                }
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {updatingCustomer ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact History Modal */}
      {showContactHistory && contactHistoryCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Contact History - {contactHistoryCustomer.name}
              </h2>
              <button
                onClick={() => setShowContactHistory(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add New Contact Entry */}
              <div
                className={`mb-8 pb-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>
                  Add New Contact Entry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contactType"
                      className={`block text-sm font-medium mb-1 ${textSecondary}`}
                    >
                      Type
                    </label>
                    <select
                      id="contactType"
                      value={newContact.type}
                      onChange={(e) =>
                        setNewContact({ ...newContact, type: e.target.value })
                      }
                      className={inputClasses}
                    >
                      <option value="call">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contactDate"
                      className={`block text-sm font-medium mb-1 ${textSecondary}`}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="contactDate"
                      value={newContact.contactDate}
                      onChange={(e) =>
                        setNewContact({
                          ...newContact,
                          contact_date: e.target.value,
                        })
                      }
                      className={inputClasses}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="contactSubject"
                      className={`block text-sm font-medium mb-1 ${textSecondary}`}
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="contactSubject"
                      value={newContact.subject}
                      onChange={(e) =>
                        setNewContact({
                          ...newContact,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Enter contact subject"
                      className={inputClasses}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="contactNotes"
                      className={`block text-sm font-medium mb-1 ${textSecondary}`}
                    >
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      id="contactNotes"
                      value={newContact.notes}
                      onChange={(e) =>
                        setNewContact({ ...newContact, notes: e.target.value })
                      }
                      placeholder="Enter contact notes"
                      className={inputClasses}
                    />
                  </div>
                </div>
                <button
                  onClick={addContactEntry}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2"
                >
                  <FaPlus />
                  Add Contact Entry
                </button>
              </div>

              {/* Contact History List */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>
                  Contact History
                </h3>
                {contactHistoryCustomer.contactHistory &&
                contactHistoryCustomer.contactHistory.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {contactHistoryCustomer.contactHistory.map((contact) => (
                      <div
                        key={contact.id}
                        className={`${cardClasses} p-4 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-[#008B8B]">
                            {contact.type === "call" && (
                              <FaPhone className="w-4 h-4" />
                            )}
                            {contact.type === "email" && (
                              <FaEnvelope className="w-4 h-4" />
                            )}
                            {contact.type === "meeting" && (
                              <FaCalendarAlt className="w-4 h-4" />
                            )}
                            {contact.type === "other" && (
                              <FaExclamationTriangle className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium capitalize">
                              {contact.type}
                            </span>
                          </div>
                          <span className={`text-sm ${textMuted}`}>
                            {format(
                              new Date(contact.contactDate),
                              "MMM dd, yyyy",
                            )}
                          </span>
                        </div>
                        <h4 className={`font-semibold mb-1 ${textPrimary}`}>
                          {contact.subject}
                        </h4>
                        <p className={`text-sm ${textSecondary}`}>
                          {contact.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaHistory
                      className={`mx-auto text-4xl mb-3 ${textMuted}`}
                    />
                    <p className={textMuted}>No contact history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Upload Modal */}
      {showUploadModal && (
        <CustomerUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false);
            refetchCustomers();
          }}
        />
      )}

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

export default CustomerManagement;
