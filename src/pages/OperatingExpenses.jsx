import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormSelect } from "../components/ui/form-select";
import { SelectItem } from "../components/ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import { financialreportsService } from "../services/financialReportsService";
import { notificationService } from "../services/notificationService";
import { operatingExpenseService } from "../services/operatingExpenseService";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { toUAEDateForInput } from "../utils/timezone";

const EXPENSE_TYPES = [
  { value: "RENT", label: "Rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SALARIES", label: "Salaries" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "__ALL__", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "POSTED", label: "Posted" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "OTHER", label: "Other" },
];

const StatusPill = ({ status }) => {
  const map = {
    DRAFT: {
      label: "Draft",
      classes: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    },
    SUBMITTED: {
      label: "Submitted",
      classes: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
    },
    APPROVED: {
      label: "Approved",
      classes:
        "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
    },
    POSTED: {
      label: "Posted",
      classes: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700",
    },
  };
  const cfg = map[status] || map.DRAFT;
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
};

const INITIAL_FORM = {
  expense_date: toUAEDateForInput(new Date()),
  expense_type: "RENT",
  category_code: "",
  amount: "",
  currency: "AED",
  narration: "",
  reference_number: "",
  payment_method: "BANK_TRANSFER",
  payment_reference: "",
};

const OperatingExpenses = () => {
  const { isDarkMode } = useTheme();

  // Permissions
  const canCreate =
    authService.hasPermission("payables", "create") ||
    authService.hasPermission("payables", "write") ||
    authService.hasRole(["admin", "finance", "finance_manager", "accountant"]);
  const canApprove =
    authService.hasPermission("payables", "approve") || authService.hasRole(["admin", "finance_manager", "director"]);

  // List state
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [filters, setFilters] = useState({
    expense_type: "",
    status: "",
    start_date: "",
    end_date: "",
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit | view
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Category codes from chart of accounts
  const [categories, setCategories] = useState([]);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, expense: null });

  // Fetch chart of accounts for category dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await financialreportsService.getChartOfAccounts({ type: "expense" });
        setCategories(result?.accounts || result || []);
      } catch (err) {
        console.warn("Failed to load chart of accounts for categories:", err);
        // Set some default categories if API fails
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch expenses
  const fetchExpenses = useCallback(
    async (page = pagination.page) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pagination.limit,
          ...(filters.expense_type && { expense_type: filters.expense_type }),
          ...(filters.status && { status: filters.status }),
          ...(filters.start_date && { start_date: filters.start_date }),
          ...(filters.end_date && { end_date: filters.end_date }),
        };

        const result = await operatingExpenseService.list(params);
        setExpenses(result.data || []);
        setPagination((prev) => ({
          ...prev,
          page: result.pagination?.page || page,
          total: result.pagination?.total || 0,
          totalPages: result.pagination?.totalPages || 1,
        }));
      } catch (err) {
        console.error("Failed to fetch operating expenses:", err);
        notificationService.error("Failed to load operating expenses");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit, pagination.page]
  );

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  // Form handlers
  const openCreateModal = () => {
    setFormData({ ...INITIAL_FORM });
    setEditingId(null);
    setModalMode("create");
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setFormData({
      expense_date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : "",
      expense_type: expense.expenseType || "RENT",
      category_code: expense.categoryCode || "",
      amount: expense.amount || "",
      currency: expense.currency || "AED",
      narration: expense.narration || "",
      reference_number: expense.referenceNumber || "",
      payment_method: expense.paymentMethod || "BANK_TRANSFER",
      payment_reference: expense.paymentReference || "",
    });
    setEditingId(expense.id);
    setModalMode("edit");
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (expense) => {
    setFormData({
      expense_date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : "",
      expense_type: expense.expenseType || "RENT",
      category_code: expense.categoryCode || "",
      amount: expense.amount || "",
      currency: expense.currency || "AED",
      narration: expense.narration || "",
      reference_number: expense.referenceNumber || "",
      payment_method: expense.paymentMethod || "BANK_TRANSFER",
      payment_reference: expense.paymentReference || "",
    });
    setEditingId(expense.id);
    setModalMode("view");
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.expense_date) errors.expense_date = "Expense date is required";
    if (!formData.expense_type) errors.expense_type = "Expense type is required";
    if (!formData.category_code) errors.category_code = "Category is required";
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = "Amount must be greater than 0";
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (modalMode === "edit" && editingId) {
        await operatingExpenseService.update(editingId, payload);
        notificationService.success("Expense updated successfully");
      } else {
        await operatingExpenseService.create(payload);
        notificationService.success("Expense created successfully");
      }

      closeModal();
      fetchExpenses(modalMode === "create" ? 1 : pagination.page);
    } catch (err) {
      console.error("Failed to save expense:", err);
      notificationService.error(err.response?.data?.message || err.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (expense) => {
    try {
      await operatingExpenseService.submit(expense.id);
      notificationService.success("Expense submitted for approval");
      fetchExpenses(pagination.page);
    } catch (err) {
      console.error("Failed to submit expense:", err);
      notificationService.error(err.response?.data?.message || err.message || "Failed to submit expense");
    }
  };

  const handleApprove = async (expense) => {
    try {
      await operatingExpenseService.approve(expense.id);
      notificationService.success("Expense approved and posted to GL");
      fetchExpenses(pagination.page);
    } catch (err) {
      console.error("Failed to approve expense:", err);
      notificationService.error(err.response?.data?.message || err.message || "Failed to approve expense");
    }
  };

  const handleDelete = async (expense) => {
    try {
      await operatingExpenseService.delete(expense.id);
      notificationService.success("Expense deleted");
      fetchExpenses(pagination.page);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      notificationService.error(err.response?.data?.message || err.message || "Failed to delete expense");
    }
  };

  const handleConfirmAction = () => {
    const { type, expense } = confirmDialog;
    setConfirmDialog({ open: false, type: null, expense: null });
    if (type === "delete") handleDelete(expense);
    else if (type === "submit") handleSubmit(expense);
    else if (type === "approve") handleApprove(expense);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ expense_type: "", status: "", start_date: "", end_date: "" });
  };

  const getExpenseTypeLabel = (type) => {
    const found = EXPENSE_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className={`p-2 sm:p-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl">Operating Expenses</h1>
            <div className="text-xs opacity-70">Manage operational costs - rent, utilities, salaries, transport</div>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Expense
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        className={`p-3 rounded-lg border mb-4 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <FormSelect
              value={filters.expense_type || "__ALL__"}
              onValueChange={(value) => handleFilterChange("expense_type", value === "__ALL__" ? "" : value)}
              showValidation={false}
            >
              <SelectItem value="__ALL__">All Types</SelectItem>
              {EXPENSE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormSelect
              value={filters.status || "__ALL__"}
              onValueChange={(value) => handleFilterChange("status", value === "__ALL__" ? "" : value)}
              showValidation={false}
            >
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </FormSelect>
          </div>
          <div>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className="w-full px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              aria-label="Start date"
            />
          </div>
          <div>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className="w-full px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              aria-label="End date"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchExpenses(1)}
              className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 rounded border flex items-center gap-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && expenses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div
            className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
          >
            <div className="text-xs opacity-70">Total Expenses</div>
            <div className="text-lg font-semibold">{pagination.total}</div>
          </div>
          <div
            className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
          >
            <div className="text-xs opacity-70">Total Amount</div>
            <div className="text-lg font-semibold">
              {formatCurrency(expenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
          >
            <div className="text-xs opacity-70">Draft</div>
            <div className="text-lg font-semibold">{expenses.filter((e) => e.status === "DRAFT").length}</div>
          </div>
          <div
            className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
          >
            <div className="text-xs opacity-70">Pending Approval</div>
            <div className="text-lg font-semibold">{expenses.filter((e) => e.status === "SUBMITTED").length}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className={`rounded-lg border overflow-hidden ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="overflow-auto">
          <table className="min-w-full divide-y">
            {expenses.length > 0 && (
              <thead>
                <tr className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <th className="px-4 py-3 text-left text-xs uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Narration</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Reference</th>
                  <th className="px-4 py-3 text-right text-xs uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Created By</th>
                  <th className="px-4 py-3 text-right text-xs uppercase">Actions</th>
                </tr>
              </thead>
            )}
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
                      <span className="opacity-70">Loading expenses...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">
                        {filters.expense_type || filters.status || filters.start_date
                          ? "No expenses match your filters"
                          : "No operating expenses yet"}
                      </p>
                      <p className="text-sm mt-1">
                        {filters.expense_type || filters.status || filters.start_date
                          ? "Try adjusting your filters"
                          : "Create your first operating expense to get started"}
                      </p>
                      {!(filters.expense_type || filters.status || filters.start_date) && canCreate && (
                        <button
                          type="button"
                          onClick={openCreateModal}
                          className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Create Expense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className={`${isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"} cursor-pointer`}
                    onClick={() => openViewModal(expense)}
                    onKeyDown={(e) => e.key === "Enter" && openViewModal(expense)}
                  >
                    <td className="px-4 py-2 text-sm whitespace-nowrap">{formatDate(expense.expenseDate)}</td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getExpenseTypeLabel(expense.expenseType)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div>{expense.categoryName || expense.categoryCode}</div>
                      {expense.categoryName && <div className="text-xs opacity-60">{expense.categoryCode}</div>}
                    </td>
                    <td className="px-4 py-2 text-sm max-w-[200px] truncate">{expense.narration || "-"}</td>
                    <td className="px-4 py-2 text-sm">{expense.referenceNumber || "-"}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusPill status={expense.status} />
                    </td>
                    <td className="px-4 py-2 text-sm">{expense.createdByName || "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        role="toolbar"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {expense.status === "DRAFT" && canCreate && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-teal-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDialog({ open: true, type: "submit", expense })}
                              className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                              title="Submit for Approval"
                            >
                              <Send size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDialog({ open: true, type: "delete", expense })}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                        {expense.status === "SUBMITTED" && canApprove && (
                          <button
                            type="button"
                            onClick={() => setConfirmDialog({ open: true, type: "approve", expense })}
                            className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openViewModal(expense)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchExpenses(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={`p-2 rounded transition-colors ${
                pagination.page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchExpenses(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className={`p-2 rounded transition-colors ${
                pagination.page >= pagination.totalPages
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit / View Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40">
          <div
            className={`rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto ${
              isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex items-center justify-between`}
            >
              <h2 className="text-lg font-semibold">
                {modalMode === "create" && "New Operating Expense"}
                {modalMode === "edit" && "Edit Operating Expense"}
                {modalMode === "view" && "Expense Details"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Expense Date */}
              <div>
                <label htmlFor="opex-expense-date" className="block text-sm font-medium mb-1">
                  Expense Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="opex-expense-date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expense_date: e.target.value }))}
                  disabled={modalMode === "view"}
                  className={`w-full px-3 py-2 rounded border ${
                    formErrors.expense_date ? "border-red-500" : "dark:border-gray-600"
                  } dark:bg-gray-800 dark:text-gray-200 ${modalMode === "view" ? "opacity-70 cursor-not-allowed" : ""}`}
                />
                {formErrors.expense_date && <p className="text-xs text-red-500 mt-1">{formErrors.expense_date}</p>}
              </div>

              {/* Expense Type */}
              <div>
                <label htmlFor="opex-expense-type" className="block text-sm font-medium mb-1">
                  Expense Type <span className="text-red-500">*</span>
                </label>
                {modalMode === "view" ? (
                  <div className="px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-800 opacity-70">
                    {getExpenseTypeLabel(formData.expense_type)}
                  </div>
                ) : (
                  <FormSelect
                    value={formData.expense_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, expense_type: value }))}
                    showValidation={false}
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                )}
              </div>

              {/* Category Code */}
              <div>
                <label htmlFor="opex-category-code" className="block text-sm font-medium mb-1">
                  Expense Category (GL Account) <span className="text-red-500">*</span>
                </label>
                {modalMode === "view" ? (
                  <div className="px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-800 opacity-70">
                    {formData.category_code || "-"}
                  </div>
                ) : categories.length > 0 ? (
                  <>
                    <FormSelect
                      value={formData.category_code || "__NONE__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category_code: value === "__NONE__" ? "" : value }))
                      }
                      showValidation={false}
                      placeholder="Select Category..."
                    >
                      <SelectItem value="__NONE__">Select Category...</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.code || cat.id} value={cat.code}>
                          {cat.code} - {cat.name}
                        </SelectItem>
                      ))}
                    </FormSelect>
                    {formErrors.category_code && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.category_code}</p>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      id="opex-category-code"
                      value={formData.category_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category_code: e.target.value }))}
                      placeholder="e.g., 5010"
                      className={`w-full px-3 py-2 rounded border ${
                        formErrors.category_code ? "border-red-500" : "dark:border-gray-600"
                      } dark:bg-gray-800 dark:text-gray-200`}
                    />
                    {formErrors.category_code && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.category_code}</p>
                    )}
                  </>
                )}
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="opex-amount" className="block text-sm font-medium mb-1">
                  Amount ({formData.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="opex-amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  disabled={modalMode === "view"}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 rounded border ${
                    formErrors.amount ? "border-red-500" : "dark:border-gray-600"
                  } dark:bg-gray-800 dark:text-gray-200 ${modalMode === "view" ? "opacity-70 cursor-not-allowed" : ""}`}
                />
                {formErrors.amount && <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>}
              </div>

              {/* Narration */}
              <div>
                <label htmlFor="opex-narration" className="block text-sm font-medium mb-1">
                  Narration / Description
                </label>
                <textarea
                  id="opex-narration"
                  value={formData.narration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, narration: e.target.value }))}
                  disabled={modalMode === "view"}
                  rows={2}
                  placeholder="Expense description..."
                  className={`w-full px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 resize-none ${
                    modalMode === "view" ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Reference Number */}
              <div>
                <label htmlFor="opex-reference" className="block text-sm font-medium mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  id="opex-reference"
                  value={formData.reference_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reference_number: e.target.value }))}
                  disabled={modalMode === "view"}
                  placeholder="INV-001, RENT-JAN-2026, etc."
                  className={`w-full px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 ${
                    modalMode === "view" ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label htmlFor="opex-payment-method" className="block text-sm font-medium mb-1">
                  Payment Method
                </label>
                {modalMode === "view" ? (
                  <div className="px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-800 opacity-70">
                    {PAYMENT_METHODS.find((m) => m.value === formData.payment_method)?.label ||
                      formData.payment_method ||
                      "-"}
                  </div>
                ) : (
                  <FormSelect
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}
                    showValidation={false}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                )}
              </div>

              {/* Payment Reference */}
              <div>
                <label htmlFor="opex-payment-ref" className="block text-sm font-medium mb-1">
                  Payment Reference
                </label>
                <input
                  type="text"
                  id="opex-payment-ref"
                  value={formData.payment_reference}
                  onChange={(e) => setFormData((prev) => ({ ...prev, payment_reference: e.target.value }))}
                  disabled={modalMode === "view"}
                  placeholder="Cheque #, transfer ref, etc."
                  className={`w-full px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 ${
                    modalMode === "view" ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`px-6 py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-end gap-2`}
            >
              <button
                type="button"
                onClick={closeModal}
                className={`px-4 py-2 rounded text-sm ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {modalMode === "view" ? "Close" : "Cancel"}
              </button>
              {modalMode !== "view" && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  {modalMode === "edit" ? "Update" : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40">
          <div
            className={`rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">
              {confirmDialog.type === "delete" && "Delete Expense?"}
              {confirmDialog.type === "submit" && "Submit for Approval?"}
              {confirmDialog.type === "approve" && "Approve Expense?"}
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {confirmDialog.type === "delete" &&
                "This will permanently delete this draft expense. This action cannot be undone."}
              {confirmDialog.type === "submit" &&
                "This will submit the expense for approval. Once submitted, it cannot be edited."}
              {confirmDialog.type === "approve" &&
                "This will approve the expense and post it to the General Ledger. This action cannot be reversed."}
            </p>
            {confirmDialog.expense && (
              <div className={`p-3 rounded mb-4 text-sm ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="flex justify-between">
                  <span className="opacity-70">Type:</span>
                  <span className="font-medium">{getExpenseTypeLabel(confirmDialog.expense.expenseType)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="opacity-70">Amount:</span>
                  <span className="font-medium">{formatCurrency(confirmDialog.expense.amount)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="opacity-70">Date:</span>
                  <span className="font-medium">{formatDate(confirmDialog.expense.expenseDate)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setConfirmDialog({ open: false, type: null, expense: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm text-white ${
                  confirmDialog.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : confirmDialog.type === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-teal-600 hover:bg-teal-700"
                }`}
                onClick={handleConfirmAction}
              >
                {confirmDialog.type === "delete" && "Delete"}
                {confirmDialog.type === "submit" && "Submit"}
                {confirmDialog.type === "approve" && "Approve & Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatingExpenses;
