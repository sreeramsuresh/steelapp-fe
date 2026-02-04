import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  FaArchive,
  FaArrowUp,
  FaCalendarAlt,
  FaChartBar,
  FaCreditCard,
  FaDollarSign,
  FaEdit,
  FaEnvelope,
  FaExclamationTriangle,
  FaHistory,
  FaPhone,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUpload,
  FaUsers,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApi, useApiData } from "../hooks/useApi";
import { useConfirm } from "../hooks/useConfirm";
import { authService } from "../services/axiosAuthService";
import { customerService } from "../services/customerService";
import { notificationService } from "../services/notificationService";
import pricelistService from "../services/pricelistService";
import { supplierService } from "../services/supplierService";
import { formatCurrency } from "../utils/invoiceUtils";
import ConfirmDialog from "./ConfirmDialog";
import CustomerUpload from "./CustomerUpload";

// Column definitions for Customers table
const CUSTOMER_COLUMNS = [
  { key: "name", label: "Customer Name", width: "w-[200px]", required: true },
  { key: "company", label: "Company", width: "w-[150px]" },
  { key: "email", label: "Email", width: "w-[180px]" },
  { key: "phone", label: "Phone", width: "w-[120px]" },
  { key: "creditLimit", label: "Credit Limit", width: "w-[120px]" },
  { key: "creditUsed", label: "Credit Used", width: "w-[120px]" },
];

// Column definitions for Suppliers table
const SUPPLIER_COLUMNS = [
  { key: "name", label: "Supplier Name", width: "w-[200px]", required: true },
  { key: "company", label: "Company", width: "w-[150px]" },
  { key: "email", label: "Email", width: "w-[180px]" },
  { key: "phone", label: "Phone", width: "w-[120px]" },
  { key: "trnNumber", label: "TRN", width: "w-[140px]" },
  { key: "paymentTerms", label: "Payment Terms", width: "w-[120px]" },
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
  const [currentPage, setCurrentPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(20);
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1);
  const [supplierPageSize, setSupplierPageSize] = useState(20);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [supplierFilterStatus, setSupplierFilterStatus] = useState("all");
  const [showDeletedSuppliers, setShowDeletedSuppliers] = useState(false);

  // Row selection state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [selectedSupplierIds, setSelectedSupplierIds] = useState(new Set());

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
  const [customerVisibleColumns, setCustomerVisibleColumns] = useState(CUSTOMER_COLUMNS.map((col) => col.key));
  const [supplierVisibleColumns, setSupplierVisibleColumns] = useState(SUPPLIER_COLUMNS.map((col) => col.key));

  // Column picker visibility
  const [showCustomerColumnPicker, setShowCustomerColumnPicker] = useState(false);
  const [showSupplierColumnPicker, setShowSupplierColumnPicker] = useState(false);

  const canReadCustomers = authService.hasPermission("customers", "read") || authService.hasRole("admin");

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
      page: currentPage,
      limit: customerPageSize,
    });
  }, [searchTerm, filterStatus, currentPage, customerPageSize, canReadCustomers]);

  // Suppliers API hooks
  const {
    data: suppliersData,
    loading: loadingSuppliers,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useApiData(
    () =>
      supplierService.getSuppliers({
        query: supplierSearchTerm,
        page: supplierCurrentPage,
        limit: supplierPageSize,
      }),
    [supplierSearchTerm, supplierCurrentPage, supplierPageSize]
  );

  // Pricelists API hooks
  const { data: pricelistsData, loading: _loadingPricelists } = useApiData(
    () => pricelistService.getAll({ include_items: false }),
    []
  );
  const { execute: createSupplier, loading: creatingSupplier } = useApi(supplierService.createSupplier);
  const { execute: updateSupplier, loading: updatingSupplier } = useApi(supplierService.updateSupplier);
  const { execute: deleteSupplier } = useApi(supplierService.deleteSupplier);

  const { execute: createCustomer, loading: creatingCustomer } = useApi(customerService.createCustomer);
  const { execute: updateCustomer, loading: updatingCustomer } = useApi(customerService.updateCustomer);
  const { execute: _deleteCustomer } = useApi(customerService.deleteCustomer);
  const { execute: archiveCustomer } = useApi(customerService.archiveCustomer);
  const { execute: addContactHistory } = useApi(customerService.addContactHistory);

  const customers = customersData?.customers || [];
  const pageInfo = customersData?.pageInfo || {};
  const suppliers = suppliersData?.suppliers || [];
  const supplierPageInfo = suppliersData?.pageInfo || {};
  const pricelists = pricelistsData?.data || [];
  const canDeleteCustomers = authService.hasPermission("customers", "delete") || authService.hasRole("admin");

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, []);

  // Reset supplier page to 1 when search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupplierCurrentPage(1);
  }, []);

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
    if (!/^100\d{12}$/.test(digits)) return "TRN must start with 100 and be 15 digits";
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

  const filteredCustomers = customers.filter((c) => (showArchived ? true : c.status !== "archived"));

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
        return Number(customer.credit_limit) || 0;
      case "creditUsed":
        return Number(customer.current_credit) || 0;
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
        return supplier.trn_number || "-";
      case "paymentTerms":
        return supplier.paymentTerms || "-";
      case "status":
        return supplier.status || "active";
      default:
        return "-";
    }
  };

  // Helper to normalize status for comparison (handles case and numeric)
  const normalizeStatus = (status) => {
    if (status === null || status === undefined) return "active";
    if (typeof status === "number") {
      // Map numeric status: 1 = active, 0 = inactive, etc.
      return status === 1 ? "active" : "inactive";
    }
    return String(status).toLowerCase();
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

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    // Filter by status
    if (supplierFilterStatus !== "all" && normalizeStatus(s.status) !== supplierFilterStatus) {
      return false;
    }
    // Filter out deleted unless showDeletedSuppliers is true
    if (!showDeletedSuppliers && normalizeStatus(s.status) === "deleted") {
      return false;
    }
    return true;
  });

  // Sort suppliers
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
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
    setCustomerVisibleColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleSupplierColumn = (key) => {
    const col = SUPPLIER_COLUMNS.find((c) => c.key === key);
    if (col?.required) return;
    setSupplierVisibleColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // Row selection handlers - Customers
  const toggleCustomerSelection = (id) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllCustomers = () => {
    if (selectedCustomerIds.size === sortedCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(sortedCustomers.map((c) => c.id)));
    }
  };

  // Row selection handlers - Suppliers
  const toggleSupplierSelection = (id) => {
    setSelectedSupplierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllSuppliers = () => {
    if (selectedSupplierIds.size === sortedSuppliers.length) {
      setSelectedSupplierIds(new Set());
    } else {
      setSelectedSupplierIds(new Set(sortedSuppliers.map((s) => s.id)));
    }
  };

  // Bulk action handlers
  const handleBulkArchiveCustomers = async () => {
    if (selectedCustomerIds.size === 0) return;
    const confirmed = await confirm({
      title: "Archive Selected Customers?",
      message: `Archive ${selectedCustomerIds.size} selected customer(s)? You can restore them later.`,
      confirmText: "Archive All",
      variant: "warning",
    });
    if (!confirmed) return;
    try {
      for (const id of selectedCustomerIds) {
        await archiveCustomer(id);
      }
      setSelectedCustomerIds(new Set());
      refetchCustomers();
      notificationService.success(`${selectedCustomerIds.size} customer(s) archived`);
    } catch (error) {
      notificationService.apiError("Bulk archive", error);
    }
  };

  const handleBulkDeleteSuppliers = async () => {
    if (selectedSupplierIds.size === 0) return;
    const confirmed = await confirm({
      title: "Delete Selected Suppliers?",
      message: `Delete ${selectedSupplierIds.size} selected supplier(s)? This cannot be undone.`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      for (const id of selectedSupplierIds) {
        await deleteSupplier(id);
      }
      setSelectedSupplierIds(new Set());
      refetchSuppliers();
      notificationService.success(`${selectedSupplierIds.size} supplier(s) deleted`);
    } catch (error) {
      notificationService.apiError("Bulk delete", error);
    }
  };

  // Sync search from URL param
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("search") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchTerm(q);
  }, [searchParams]);

  // Navigate to customer detail page
  const handleCustomerClick = (customerId) => {
    navigate(`/customers/${customerId}?tab=overview`);
  };

  const handleAddCustomer = async () => {
    const trnError = validateTRN(newCustomer.trn_number);
    if (trnError) {
      notificationService.error(trnError);
      return;
    }

    // Check for duplicate name
    const duplicateName = customers.find(
      (c) => c.name?.toLowerCase().trim() === newCustomer.name?.toLowerCase().trim()
    );
    if (duplicateName) {
      const proceed = await confirm({
        title: "Duplicate Customer Name",
        message: `A customer named "${duplicateName.name}" already exists. Do you want to create another customer with the same name?`,
        confirmText: "Create Anyway",
        variant: "warning",
      });
      if (!proceed) return;
    }

    try {
      const customerData = {
        ...newCustomer,
        credit_limit: newCustomer.credit_limit === "" ? 0 : Number(newCustomer.credit_limit),
        current_credit: newCustomer.current_credit === "" ? 0 : Number(newCustomer.current_credit),
      };

      // Serialize address object to JSON string for API Gateway
      if (customerData.address && typeof customerData.address === "object") {
        const { street, city, state, postalCode, country } = customerData.address;
        customerData.address = JSON.stringify({
          street: street || "",
          city: city || "",
          state: state || "",
          postal_code: postalCode || "",
          country: country || "AE",
        });
      }

      // Remove camelCase variants to avoid case conversion collision
      delete customerData.credit_limit;
      delete customerData.current_credit;

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
    const trnError = validateTRN(selectedCustomer?.trn_number);
    if (trnError) {
      notificationService.error(trnError);
      return;
    }
    try {
      const customerData = {
        ...selectedCustomer,
        credit_limit: selectedCustomer.credit_limit === "" ? 0 : Number(selectedCustomer.credit_limit),
        current_credit: selectedCustomer.current_credit === "" ? 0 : Number(selectedCustomer.current_credit),
      };

      // Serialize address object to JSON string for API Gateway
      if (customerData.address && typeof customerData.address === "object") {
        const { street, city, state, postalCode, country } = customerData.address;
        customerData.address = JSON.stringify({
          street: street || "",
          city: city || "",
          state: state || "",
          postal_code: postalCode || "",
          country: country || "AE",
        });
      }

      // Remove camelCase variants to avoid case conversion collision
      delete customerData.credit_limit;
      delete customerData.current_credit;

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
    const trnErr = validateTRN(newSupplier.trn_number);
    if (trnErr) {
      notificationService.error(trnErr);
      return;
    }

    // Check for duplicate name
    const duplicateName = suppliers.find(
      (s) => s.name?.toLowerCase().trim() === newSupplier.name?.toLowerCase().trim()
    );
    if (duplicateName) {
      const proceed = await confirm({
        title: "Duplicate Supplier Name",
        message: `A supplier named "${duplicateName.name}" already exists. Do you want to create another supplier with the same name?`,
        confirmText: "Create Anyway",
        variant: "warning",
      });
      if (!proceed) return;
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
    const trnErr = validateTRN(selectedSupplier?.trn_number);
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
      message: "Are you sure you want to delete this supplier? This action cannot be undone.",
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
      notificationService.error(`Failed to add contact entry: ${error.message || "Unknown error"}`);
    }
  };

  // Helper to format address object as string
  const formatAddress = (address) => {
    if (!address) return "";
    if (typeof address === "string") {
      // Try to parse JSON string
      try {
        const parsed = JSON.parse(address);
        return formatAddress(parsed);
      } catch {
        return address;
      }
    }
    // Format object as readable string
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postal_code || address.postalCode) parts.push(address.postal_code || address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.filter(Boolean).join(", ");
  };

  const calculateAnalytics = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => normalizeStatus(c.status) === "active").length;
    const totalCreditLimit = customers.reduce((sum, c) => sum + (Number(c.credit_limit) || 0), 0);
    const totalCreditUsed = customers.reduce((sum, c) => sum + (Number(c.current_credit) || 0), 0);
    const avgCreditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

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
              placeholder="Search customers by name, email, or phone..."
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
              isDarkMode ? "border-[#37474F] bg-[#1E2328] text-white" : "border-[#E0E0E0] bg-white text-[#212121]"
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
              onClick={() => setShowCustomerColumnPicker(!showCustomerColumnPicker)}
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
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-3 py-2 border-b text-sm font-medium ${
                    isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"
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
                      {col.required && <span className="text-xs text-gray-500">(required)</span>}
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

          {/* Bulk Archive Button - shown when customers selected */}
          {selectedCustomerIds.size > 0 && (
            <button
              onClick={handleBulkArchiveCustomers}
              className="px-4 py-2 bg-gradient-to-r from-[#FFA726] to-[#F57C00] text-white rounded-lg hover:from-[#FFB74D] hover:to-[#FFA726] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <FaArchive />
              Archive ({selectedCustomerIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Record Count Header */}
      <div className={`flex items-center justify-between mb-3 px-1 ${textSecondary}`}>
        <span className="text-sm">
          Showing {Math.min(sortedCustomers.length, customers.length)} of {customers.length} customer
          {customers.length !== 1 ? "s" : ""}
          {pageInfo.totalItems &&
            pageInfo.totalItems > customers.length &&
            ` (Page ${pageInfo.currentPage || 1} of ${pageInfo.totalPages || 1})`}
          {filterStatus !== "all" && ` (filtered by ${filterStatus})`}
        </span>
        {selectedCustomerIds.size > 0 && (
          <span className="text-sm text-teal-600 font-medium">{selectedCustomerIds.size} selected</span>
        )}
      </div>

      {/* Customer Table */}
      <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <table className="w-full min-w-[800px] table-fixed">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <tr>
              {/* Select All Checkbox */}
              <th className={`px-3 py-2 w-[40px] ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <input
                  type="checkbox"
                  checked={sortedCustomers.length > 0 && selectedCustomerIds.size === sortedCustomers.length}
                  onChange={toggleAllCustomers}
                  className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                />
              </th>
              {CUSTOMER_COLUMNS.filter((col) => customerVisibleColumns.includes(col.key)).map((col) => (
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
          <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {sortedCustomers.length === 0 ? (
              <tr>
                <td colSpan={customerVisibleColumns.length + 2} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <FaUsers className={`text-4xl ${textMuted}`} />
                    <p className={`text-lg font-medium ${textSecondary}`}>
                      {loadingCustomers
                        ? "Loading customers..."
                        : customersError
                          ? "Error loading customers"
                          : searchTerm || filterStatus !== "all"
                            ? "No customers match your filters"
                            : "No customers yet"}
                    </p>
                    <p className={`text-sm ${textMuted}`}>
                      {loadingCustomers
                        ? "Please wait..."
                        : customersError
                          ? "Please try again or contact support"
                          : searchTerm || filterStatus !== "all"
                            ? "Try adjusting your search or filters"
                            : 'Click "Add Customer" to create your first customer'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className={`transition-colors ${
                    selectedCustomerIds.has(customer.id)
                      ? isDarkMode
                        ? "bg-teal-900/20"
                        : "bg-teal-50"
                      : isDarkMode
                        ? "bg-gray-900 hover:bg-gray-800"
                        : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="px-3 py-2 w-[40px]">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.has(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  {CUSTOMER_COLUMNS.filter((col) => customerVisibleColumns.includes(col.key)).map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-sm whitespace-nowrap ${col.width} ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {col.key === "name" ? (
                        <div className="space-y-1">
                          <button
                            onClick={() => handleCustomerClick(customer.id)}
                            className={`font-medium text-left hover:underline block truncate max-w-[180px] ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                            title={getCustomerCellValue(customer, col.key)}
                          >
                            {getCustomerCellValue(customer, col.key)}
                          </button>
                          {customer.company && (
                            <div
                              className={`text-xs truncate max-w-[180px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                              title={customer.company}
                            >
                              {customer.company}
                            </div>
                          )}
                        </div>
                      ) : col.key === "creditLimit" || col.key === "creditUsed" ? (
                        <span className={col.key === "creditUsed" ? "font-medium" : ""}>
                          {formatCurrency(getCustomerCellValue(customer, col.key))}
                        </span>
                      ) : col.key === "email" ? (
                        <span className="block truncate max-w-[180px]" title={customer.email || "-"}>
                          {customer.email || "-"}
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
                          title="Archive customer (can be restored)"
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

      {/* Pagination Controls */}
      {pageInfo.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className={textSecondary}>
            Showing page {pageInfo.currentPage} of {pageInfo.totalPages} ({pageInfo.totalItems} total customers)
          </div>
          <div className="flex gap-4 items-center">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="customer-page-size" className={textSecondary}>
                Per page:
              </label>
              <select
                id="customer-page-size"
                value={customerPageSize}
                onChange={(e) => {
                  setCustomerPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white focus:border-teal-600 focus:ring-teal-600/20"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20"
                }`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={!pageInfo.hasPrev}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pageInfo.hasPrev
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border border-teal-600 hover:bg-teal-900/30"
                      : "bg-teal-50 text-teal-700 border border-teal-300 hover:bg-teal-100"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!pageInfo.hasNext}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pageInfo.hasNext
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border border-teal-600 hover:bg-teal-900/30"
                      : "bg-teal-50 text-teal-700 border border-teal-300 hover:bg-teal-100"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuppliers = () => (
    <div className={`${cardClasses} p-6 mb-6`}>
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex items-center flex-1 max-w-md">
            <FaSearch className={`absolute left-3 ${textMuted}`} />
            <input
              type="text"
              placeholder="Search suppliers by name, contact, or email..."
              value={supplierSearchTerm}
              onChange={(e) => setSupplierSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 w-full ${
                isDarkMode
                  ? "border-[#37474F] bg-[#1E2328] text-white placeholder-[#78909C]"
                  : "border-[#E0E0E0] bg-white text-[#212121] placeholder-[#BDBDBD]"
              }`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={supplierFilterStatus}
            onChange={(e) => {
              setSupplierFilterStatus(e.target.value);
              setSupplierCurrentPage(1);
            }}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 min-w-[150px] ${
              isDarkMode ? "border-[#37474F] bg-[#1E2328] text-white" : "border-[#E0E0E0] bg-white text-[#212121]"
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Show Deleted Toggle */}
          <label
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <input
              type="checkbox"
              checked={showDeletedSuppliers}
              onChange={(e) => setShowDeletedSuppliers(e.target.checked)}
              className="form-checkbox h-4 w-4 text-teal-600"
            />
            <span className="text-sm">Show deleted</span>
          </label>
          <div className="text-sm text-gray-500 ml-auto">
            {filteredSuppliers.length} supplier
            {filteredSuppliers.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          {/* Column Picker */}
          <div className="relative">
            <button
              onClick={() => setShowSupplierColumnPicker(!showSupplierColumnPicker)}
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
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-3 py-2 border-b text-sm font-medium ${
                    isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"
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
                      {col.required && <span className="text-xs text-gray-500">(required)</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bulk Delete Button - shows when suppliers are selected */}
          {selectedSupplierIds.size > 0 && (
            <button
              onClick={handleBulkDeleteSuppliers}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} />
              Delete ({selectedSupplierIds.size})
            </button>
          )}

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
        <div className={`rounded p-3 mb-4 ${isDarkMode ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-700"}`}>
          Failed to load suppliers
        </div>
      )}

      {/* Record Count Header */}
      <div className={`flex items-center justify-between mb-3 px-1 ${textSecondary}`}>
        <span className="text-sm">
          Showing {sortedSuppliers.length} of {suppliers.length} supplier
          {suppliers.length !== 1 ? "s" : ""}
          {supplierFilterStatus !== "all" && ` (filtered by ${supplierFilterStatus})`}
        </span>
        {selectedSupplierIds.size > 0 && (
          <span className="text-sm text-teal-600 font-medium">{selectedSupplierIds.size} selected</span>
        )}
      </div>

      {/* Supplier Table */}
      <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <table className="w-full min-w-[800px] table-fixed">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <tr>
              {/* Checkbox column header */}
              <th className={`px-3 py-2 w-10 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <input
                  type="checkbox"
                  checked={sortedSuppliers.length > 0 && selectedSupplierIds.size === sortedSuppliers.length}
                  onChange={toggleAllSuppliers}
                  className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                  title="Select all suppliers"
                />
              </th>
              {SUPPLIER_COLUMNS.filter((col) => supplierVisibleColumns.includes(col.key)).map((col) => (
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
          <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {loadingSuppliers ? (
              <tr>
                <td colSpan={supplierVisibleColumns.length + 2} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className={`text-lg font-medium ${textSecondary}`}>Loading suppliers...</p>
                    <p className={`text-sm ${textMuted}`}>Please wait...</p>
                  </div>
                </td>
              </tr>
            ) : sortedSuppliers.length === 0 ? (
              <tr>
                <td colSpan={supplierVisibleColumns.length + 2} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <FaUsers className={`text-4xl ${textMuted}`} />
                    <p className={`text-lg font-medium ${textSecondary}`}>
                      {suppliersError
                        ? "Error loading suppliers"
                        : supplierSearchTerm || supplierFilterStatus !== "all"
                          ? "No suppliers match your filters"
                          : "No suppliers yet"}
                    </p>
                    <p className={`text-sm ${textMuted}`}>
                      {suppliersError
                        ? "Please try again or contact support"
                        : supplierSearchTerm || supplierFilterStatus !== "all"
                          ? "Try adjusting your search or filters"
                          : 'Click "Add Supplier" to create your first supplier'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className={`transition-colors ${
                    selectedSupplierIds.has(supplier.id)
                      ? isDarkMode
                        ? "bg-teal-900/30"
                        : "bg-teal-50"
                      : isDarkMode
                        ? "bg-gray-900 hover:bg-gray-800"
                        : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {/* Selection checkbox */}
                  <td className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedSupplierIds.has(supplier.id)}
                      onChange={() => toggleSupplierSelection(supplier.id)}
                      className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  {SUPPLIER_COLUMNS.filter((col) => supplierVisibleColumns.includes(col.key)).map((col) => (
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
                            <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {supplier.company}
                            </div>
                          )}
                        </div>
                      ) : col.key === "email" ? (
                        <span className="block truncate max-w-[180px]" title={supplier.email || "-"}>
                          {supplier.email || "-"}
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
                        title="Delete permanently (cannot be undone)"
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

      {/* Pagination Controls */}
      {supplierPageInfo.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className={textSecondary}>
            Showing page {supplierPageInfo.currentPage} of {supplierPageInfo.totalPages} ({supplierPageInfo.totalItems}{" "}
            total suppliers)
          </div>
          <div className="flex gap-4 items-center">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="supplier-page-size" className={textSecondary}>
                Per page:
              </label>
              <select
                id="supplier-page-size"
                value={supplierPageSize}
                onChange={(e) => {
                  setSupplierPageSize(Number(e.target.value));
                  setSupplierCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white focus:border-teal-600 focus:ring-teal-600/20"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20"
                }`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSupplierCurrentPage((prev) => prev - 1)}
                disabled={!supplierPageInfo.hasPrev}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  supplierPageInfo.hasPrev
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border border-teal-600 hover:bg-teal-900/30"
                      : "bg-teal-50 text-teal-700 border border-teal-300 hover:bg-teal-100"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setSupplierCurrentPage((prev) => prev + 1)}
                disabled={!supplierPageInfo.hasNext}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  supplierPageInfo.hasNext
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border border-teal-600 hover:bg-teal-900/30"
                      : "bg-teal-50 text-teal-700 border border-teal-300 hover:bg-teal-100"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className={`${cardClasses} p-6`}>
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaUsers className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Total Customers</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{analytics.totalCustomers}</p>
          <p className={`text-sm ${textSecondary}`}>{analytics.activeCustomers} active customers</p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaCreditCard className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Total Credit Limit</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{formatCurrency(analytics.totalCreditLimit)}</p>
          <p className={`text-sm ${textSecondary}`}>Across all customers</p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaDollarSign className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Credit Utilized</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{formatCurrency(analytics.totalCreditUsed)}</p>
          <p className={`text-sm ${textSecondary}`}>
            {Math.round(analytics.avgCreditUtilization)}% average utilization
          </p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaArrowUp className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Available Credit</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{formatCurrency(analytics.availableCredit)}</p>
          <p className={`text-sm ${textSecondary}`}>Ready to be utilized</p>
        </div>
      </div>

      {/* Credit Utilization Chart */}
      <div className={`${cardClasses} p-6 hover:shadow-lg`}>
        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Credit Utilization by Customer</h3>
        <p className={`text-sm mb-6 ${textMuted}`}>Only showing customers with credit limits assigned</p>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {customers.filter((c) => (c.credit_limit || c.credit_limit || 0) > 0).length === 0 ? (
            <div className="text-center py-8">
              <FaCreditCard className={`mx-auto text-3xl mb-3 ${textMuted}`} />
              <p className={`text-sm ${textMuted}`}>No customers have credit limits assigned yet</p>
            </div>
          ) : (
            customers
              .filter((c) => (c.credit_limit || c.credit_limit || 0) > 0)
              .sort((a, b) => {
                const aUtil =
                  ((a.current_credit || a.current_credit || 0) / (a.credit_limit || a.credit_limit || 1)) * 100;
                const bUtil =
                  ((b.current_credit || b.current_credit || 0) / (b.credit_limit || b.credit_limit || 1)) * 100;
                return bUtil - aUtil; // Sort by utilization descending
              })
              .map((customer) => {
                const creditLimit = customer.credit_limit || customer.credit_limit || 0;
                const currentCredit = customer.current_credit || customer.current_credit || 0;
                const utilization = creditLimit > 0 ? (currentCredit / creditLimit) * 100 : 0;
                return (
                  <div
                    key={customer.id}
                    className={`flex items-center gap-4 p-3 rounded-lg hover:bg-opacity-50 transition-colors ${
                      isDarkMode ? "hover:bg-[#37474F]" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-40 text-sm font-medium truncate ${textPrimary}`} title={customer.name}>
                      {customer.name}
                    </span>
                    <div className="flex-1 flex items-center gap-3">
                      <div className={`flex-1 rounded-full h-3 ${isDarkMode ? "bg-[#37474F]" : "bg-gray-200"}`}>
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            utilization > 80 ? "bg-red-500" : utilization > 50 ? "bg-yellow-500" : "bg-teal-600"
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium w-16 text-right ${
                          utilization > 80 ? "text-red-500" : utilization > 50 ? "text-yellow-500" : textSecondary
                        }`}
                      >
                        {Math.round(utilization)}%
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[100vw] overflow-x-hidden">
        {/* Page Header */}
        <div className={`mb-8 pb-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}>
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className="text-3xl text-teal-600" />
            <h1 className={`text-2xl font-semibold ${textPrimary}`}>Customer Management</h1>
          </div>
          <p className={textSecondary}>Manage customer profiles, contact history, and credit limits</p>
        </div>

        {/* Tabs - Pill style */}
        <div className={`mb-6 ${isDarkMode ? "bg-transparent" : "bg-transparent"}`}>
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
            <span className={`ml-3 ${textSecondary}`}>Loading customers...</span>
          </div>
        )}

        {/* Error State */}
        {customersError && (
          <div
            className={`rounded-lg p-4 mb-6 border ${
              isDarkMode ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className={isDarkMode ? "text-red-400" : "text-red-600"} />
              <span className={isDarkMode ? "text-red-200" : "text-red-800"}>
                Error loading customers: {customersError}
              </span>
              <button
                onClick={refetchCustomers}
                className={`ml-auto px-3 py-1 text-sm rounded transition-colors ${
                  isDarkMode ? "bg-red-800 text-red-200 hover:bg-red-700" : "bg-red-100 text-red-700 hover:bg-red-200"
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
          <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} className={`${textMuted} hover:${textSecondary}`}>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Enter customer name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customerCompany" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="customerEmail" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="Enter email address"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customerAlternatePhone" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    id="customerAlternatePhone"
                    value={newCustomer.alternate_phone}
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
                  <label htmlFor="customerWebsite" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="customerStreetAddress" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="customerCity" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="customerTRN" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    TRN Number
                  </label>
                  <input
                    type="text"
                    id="customerTRN"
                    inputMode="numeric"
                    pattern="\\d*"
                    maxLength={15}
                    value={newCustomer.trn_number}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        trn_number: sanitizeTRNInput(e.target.value),
                      })
                    }
                    placeholder="100XXXXXXXXXXXX"
                    className={inputClasses}
                  />
                  {validateTRN(newCustomer.trn_number) && (
                    <p className="text-xs text-red-600 mt-1">{validateTRN(newCustomer.trn_number)}</p>
                  )}
                  {!validateTRN(newCustomer.trn_number) && (
                    <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                  )}
                </div>

                {/* UAE VAT: Designated Zone checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newCustomerDesignatedZone"
                    checked={newCustomer.is_designated_zone || false}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        is_designated_zone: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="newCustomerDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>
                    Designated Zone (Free Zone) Customer
                  </label>
                </div>

                <div>
                  <label htmlFor="customerTradeLicense" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    id="customerTradeLicense"
                    value={newCustomer.trade_license_number}
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
                    value={newCustomer.trade_license_expiry}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        trade_license_expiry: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className={`text-xs mt-1 ${textMuted}`}>Important: Set expiry date for compliance tracking</p>
                </div>

                <div>
                  <label htmlFor="customerCreditLimit" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Credit Limit (د.إ)
                  </label>
                  <input
                    type="number"
                    id="customerCreditLimit"
                    value={newCustomer.credit_limit || ""}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        credit_limit: e.target.value === "" ? "" : Number(e.target.value) || "",
                      })
                    }
                    placeholder="Enter credit limit"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customerCurrentCredit" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Current Credit Used (د.إ)
                  </label>
                  <input
                    type="number"
                    id="customerCurrentCredit"
                    value={newCustomer.current_credit || ""}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        current_credit: e.target.value === "" ? "" : Number(e.target.value) || "",
                      })
                    }
                    placeholder="Enter current credit used"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customerPriceList" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Price List
                  </label>
                  <select
                    id="customerPriceList"
                    value={newCustomer.pricelist_id || ""}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        pricelist_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value="">-- Use Default Price List --</option>
                    {pricelists.map((pricelist) => (
                      <option key={pricelist.id} value={pricelist.id}>
                        {pricelist.name} {pricelist.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Optional: Assign a specific price list for this customer
                  </p>
                </div>

                <div>
                  <label htmlFor="customerStatus" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Status
                  </label>
                  <select
                    id="customerStatus"
                    value={newCustomer.status}
                    onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
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
                  isDarkMode ? "text-[#B0BEC5] hover:text-gray-300" : "text-[#757575] hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={creatingCustomer || !!validateTRN(newCustomer.trn_number)}
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
          <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Add Supplier</h2>
              <button onClick={() => setShowAddSupplierModal(false)} className={`${textMuted} hover:${textSecondary}`}>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newSupplierName" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Name
                </label>
                <input
                  type="text"
                  id="newSupplierName"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="newSupplierCompany" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Company
                </label>
                <input
                  type="text"
                  id="newSupplierCompany"
                  value={newSupplier.company}
                  onChange={(e) => setNewSupplier({ ...newSupplier, company: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="newSupplierEmail" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Email
                </label>
                <input
                  type="email"
                  id="newSupplierEmail"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="newSupplierPhone" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  id="newSupplierPhone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="newSupplierAddress" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Address
                </label>
                <input
                  type="text"
                  id="newSupplierAddress"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="newSupplierTRN" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  TRN Number
                </label>
                <input
                  type="text"
                  id="newSupplierTRN"
                  inputMode="numeric"
                  pattern="\\d*"
                  maxLength={15}
                  placeholder="100XXXXXXXXXXXX"
                  value={newSupplier.trn_number}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      trn_number: e.target.value.replace(/\D/g, "").slice(0, 15),
                    })
                  }
                  className={inputClasses}
                />
                {validateTRN(newSupplier.trn_number) ? (
                  <p className="text-xs text-red-600 mt-1">{validateTRN(newSupplier.trn_number)}</p>
                ) : (
                  <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newSupplierDesignatedZone"
                  checked={newSupplier.is_designated_zone || false}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      is_designated_zone: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="newSupplierDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>
                  Designated Zone (Free Zone) Supplier
                </label>
              </div>
              <div>
                <label htmlFor="newSupplierPaymentTerms" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Payment Terms
                </label>
                <input
                  type="text"
                  id="newSupplierPaymentTerms"
                  placeholder="e.g., Net 30"
                  value={newSupplier.payment_terms}
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
                <label htmlFor="newSupplierCurrency" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Default Currency
                </label>
                <select
                  id="newSupplierCurrency"
                  value={newSupplier.default_currency}
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
                  <label htmlFor="newSupplierContactName" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="newSupplierContactName"
                    value={newSupplier.contact_name}
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
                    value={newSupplier.contact_email}
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
                    value={newSupplier.contact_phone}
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
                <label htmlFor="newSupplierStatus" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Status
                </label>
                <select
                  id="newSupplierStatus"
                  value={newSupplier.status}
                  onChange={(e) => setNewSupplier({ ...newSupplier, status: e.target.value })}
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
                disabled={creatingSupplier || !!validateTRN(newSupplier.trn_number)}
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
          <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Edit Supplier</h2>
              <button onClick={() => setShowEditSupplierModal(false)} className={`${textMuted} hover:${textSecondary}`}>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editSupplierName" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                <label htmlFor="editSupplierCompany" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                <label htmlFor="editSupplierEmail" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                <label htmlFor="editSupplierPhone" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                <label htmlFor="editSupplierAddress" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Address
                </label>
                <input
                  type="text"
                  id="editSupplierAddress"
                  value={formatAddress(selectedSupplier.address)}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      address: e.target.value,
                    })
                  }
                  className={inputClasses}
                  placeholder="Street, City, State, Postal Code, Country"
                />
              </div>
              <div>
                <label htmlFor="editSupplierTRN" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  TRN Number
                </label>
                <input
                  type="text"
                  id="editSupplierTRN"
                  inputMode="numeric"
                  pattern="\\d*"
                  maxLength={15}
                  placeholder="100XXXXXXXXXXXX"
                  value={selectedSupplier.trn_number || ""}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      trn_number: e.target.value.replace(/\D/g, "").slice(0, 15),
                    })
                  }
                  className={inputClasses}
                />
                {validateTRN(selectedSupplier.trn_number) ? (
                  <p className="text-xs text-red-600 mt-1">{validateTRN(selectedSupplier.trn_number)}</p>
                ) : (
                  <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editSupplierDesignatedZone"
                  checked={selectedSupplier.is_designated_zone || false}
                  onChange={(e) =>
                    setSelectedSupplier({
                      ...selectedSupplier,
                      is_designated_zone: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="editSupplierDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>
                  Designated Zone (Free Zone) Supplier
                </label>
              </div>
              <div>
                <label htmlFor="editSupplierPaymentTerms" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                <label htmlFor="editSupplierCurrency" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                <label htmlFor="editSupplierStatus" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                disabled={updatingSupplier || !!validateTRN(selectedSupplier.trn_number)}
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
          <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Edit Customer</h2>
              <button onClick={() => setShowEditModal(false)} className={`${textMuted} hover:${textSecondary}`}>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editCustomerName" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="editCustomerCompany" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="editCustomerEmail" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  <label htmlFor="editCustomerPhone" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                    value={selectedCustomer.alternate_phone || ""}
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
                  <label htmlFor="editCustomerWebsite" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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

                {/* Street Address */}
                <div className="md:col-span-2">
                  <label htmlFor="editCustomerStreet" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="editCustomerStreet"
                    value={
                      selectedCustomer.address && typeof selectedCustomer.address === "object"
                        ? selectedCustomer.address.street || ""
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: {
                          ...((selectedCustomer.address && typeof selectedCustomer.address === "object") || {}),
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="Street address"
                    className={inputClasses}
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="editCustomerCity" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    City
                  </label>
                  <input
                    type="text"
                    id="editCustomerCity"
                    value={
                      selectedCustomer.address && typeof selectedCustomer.address === "object"
                        ? selectedCustomer.address.city || ""
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: {
                          ...((selectedCustomer.address && typeof selectedCustomer.address === "object") || {}),
                          city: e.target.value,
                        },
                      })
                    }
                    placeholder="City"
                    className={inputClasses}
                  />
                </div>

                {/* State */}
                <div>
                  <label htmlFor="editCustomerState" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="editCustomerState"
                    value={
                      selectedCustomer.address && typeof selectedCustomer.address === "object"
                        ? selectedCustomer.address.state || ""
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: {
                          ...((selectedCustomer.address && typeof selectedCustomer.address === "object") || {}),
                          state: e.target.value,
                        },
                      })
                    }
                    placeholder="State or province"
                    className={inputClasses}
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label htmlFor="editCustomerPostalCode" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="editCustomerPostalCode"
                    value={
                      selectedCustomer.address && typeof selectedCustomer.address === "object"
                        ? selectedCustomer.address.postalCode || ""
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: {
                          ...((selectedCustomer.address && typeof selectedCustomer.address === "object") || {}),
                          postalCode: e.target.value,
                        },
                      })
                    }
                    placeholder="Postal code"
                    className={inputClasses}
                  />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="editCustomerCountry" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editCustomerCountry"
                    value={
                      selectedCustomer.address && typeof selectedCustomer.address === "object"
                        ? (selectedCustomer.address.country || "AE").toUpperCase()
                        : "AE"
                    }
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: {
                          ...((selectedCustomer.address && typeof selectedCustomer.address === "object") || {}),
                          country: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    placeholder="e.g., AE (UAE), IN (India), CN (China)"
                    maxLength={2}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="editCustomerTRN" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    TRN Number
                  </label>
                  <input
                    type="text"
                    id="editCustomerTRN"
                    inputMode="numeric"
                    pattern="\\d*"
                    maxLength={15}
                    value={selectedCustomer.trn_number || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        trn_number: sanitizeTRNInput(e.target.value),
                      })
                    }
                    placeholder="100XXXXXXXXXXXX"
                    className={inputClasses}
                  />
                  {validateTRN(selectedCustomer.trn_number) && (
                    <p className="text-xs text-red-600 mt-1">{validateTRN(selectedCustomer.trn_number)}</p>
                  )}
                  {!validateTRN(selectedCustomer.trn_number) && (
                    <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                  )}
                </div>

                {/* UAE VAT: Designated Zone checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editCustomerDesignatedZone"
                    checked={selectedCustomer.is_designated_zone || false}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        is_designated_zone: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="editCustomerDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>
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
                    value={selectedCustomer.trade_license_number || ""}
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
                    value={selectedCustomer.trade_license_expiry || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        trade_license_expiry: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className={`text-xs mt-1 ${textMuted}`}>Important: Set expiry date for compliance tracking</p>
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
                    value={selectedCustomer.credit_limit || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        credit_limit: e.target.value === "" ? "" : Number(e.target.value) || "",
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
                    value={selectedCustomer.current_credit || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        current_credit: e.target.value === "" ? "" : Number(e.target.value) || "",
                      })
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="editCustomerPriceList" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Price List
                  </label>
                  <select
                    id="editCustomerPriceList"
                    value={selectedCustomer.pricelist_id || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        pricelist_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value="">-- Use Default Price List --</option>
                    {pricelists.map((pricelist) => (
                      <option key={pricelist.id} value={pricelist.id}>
                        {pricelist.name} {pricelist.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Optional: Assign a specific price list for this customer
                  </p>
                </div>

                <div>
                  <label htmlFor="editCustomerStatus" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                  isDarkMode ? "text-[#B0BEC5] hover:text-gray-300" : "text-[#757575] hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditCustomer}
                disabled={updatingCustomer || !!validateTRN(selectedCustomer.trn_number)}
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
          <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
            >
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Contact History - {contactHistoryCustomer.name}
              </h2>
              <button onClick={() => setShowContactHistory(false)} className={`${textMuted} hover:${textSecondary}`}>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add New Contact Entry */}
              <div className={`mb-8 pb-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Add New Contact Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactType" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Type
                    </label>
                    <select
                      id="contactType"
                      value={newContact.type}
                      onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                      className={inputClasses}
                    >
                      <option value="call">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contactDate" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Date
                    </label>
                    <input
                      type="date"
                      id="contactDate"
                      value={newContact.contact_date}
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
                    <label htmlFor="contactSubject" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
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
                    <label htmlFor="contactNotes" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      id="contactNotes"
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
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
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Contact History</h3>
                {contactHistoryCustomer.contactHistory && contactHistoryCustomer.contactHistory.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {contactHistoryCustomer.contactHistory.map((contact) => (
                      <div key={contact.id} className={`${cardClasses} p-4 hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-[#008B8B]">
                            {contact.type === "call" && <FaPhone className="w-4 h-4" />}
                            {contact.type === "email" && <FaEnvelope className="w-4 h-4" />}
                            {contact.type === "meeting" && <FaCalendarAlt className="w-4 h-4" />}
                            {contact.type === "other" && <FaExclamationTriangle className="w-4 h-4" />}
                            <span className="text-sm font-medium capitalize">{contact.type}</span>
                          </div>
                          <span className={`text-sm ${textMuted}`}>
                            {format(new Date(contact.contactDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <h4 className={`font-semibold mb-1 ${textPrimary}`}>{contact.subject}</h4>
                        <p className={`text-sm ${textSecondary}`}>{contact.notes}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaHistory className={`mx-auto text-4xl mb-3 ${textMuted}`} />
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
