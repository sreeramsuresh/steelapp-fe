import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  FileText,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { commissionService } from "../services/commissionService";
import { notificationService } from "../services/notificationService";
import { formatCurrency, formatDate, formatDateDMY } from "../utils/invoiceUtils";

const CommissionTransactions = () => {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [agents, setAgents] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reversal modal state
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversalNotes, setReversalNotes] = useState("");
  const [reversing, setReversing] = useState(false);

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Load commission transaction data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsRes, agentsRes] = await Promise.all([
        commissionService.getTransactions(),
        commissionService.getAgents(),
      ]);
      setTransactions(transactionsRes?.transactions || []);
      setAgents(agentsRes?.agents || []);
    } catch (error) {
      console.error("Error loading data:", error);
      notificationService.error("Failed to load commission transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus;
      const matchesAgent = selectedAgent === "all" || transaction.agentId === parseInt(selectedAgent, 10);

      const matchesDateRange = (() => {
        if (!dateRange.start && !dateRange.end) return true;
        const transactionDate = new Date(transaction.createdAt);
        if (dateRange.start && transactionDate < new Date(dateRange.start)) return false;
        if (dateRange.end && transactionDate > new Date(dateRange.end)) return false;
        return true;
      })();

      return matchesSearch && matchesStatus && matchesAgent && matchesDateRange;
    });
  }, [transactions, searchTerm, selectedStatus, selectedAgent, dateRange]);

  // Pagination calculations
  const totalCount = filteredTransactions.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIdx, startIdx + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handleBulkApprove = async () => {
    if (selectedTransactions.size === 0) {
      notificationService.warning("Please select transactions to approve");
      return;
    }
    try {
      setBulkActionLoading(true);
      const transactionIds = Array.from(selectedTransactions);
      await commissionService.bulkApprove(transactionIds);
      notificationService.success(`Approved ${transactionIds.length} transaction(s)`);
      setSelectedTransactions(new Set());
      loadData();
    } catch (error) {
      console.error("Error bulk approving:", error);
      notificationService.error("Failed to approve transactions");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedTransactions.size === 0) {
      notificationService.warning("Please select transactions to mark as paid");
      return;
    }
    try {
      setBulkActionLoading(true);
      const transactionIds = Array.from(selectedTransactions);
      await commissionService.bulkMarkPaid(transactionIds);
      notificationService.success(`Marked ${transactionIds.length} transaction(s) as paid`);
      setSelectedTransactions(new Set());
      loadData();
    } catch (error) {
      console.error("Error bulk marking paid:", error);
      notificationService.error("Failed to mark transactions as paid");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Reversal handler
  const openReversalModal = (transaction) => {
    setReversalTarget(transaction);
    setReversalReason("");
    setReversalNotes("");
    setShowReversalModal(true);
    setActionMenuOpen(null);
  };

  const handleReversal = async () => {
    if (!reversalTarget || !reversalReason.trim()) {
      notificationService.warning("Please provide a reason for the reversal");
      return;
    }
    try {
      setReversing(true);
      await commissionService.reverseCommission(reversalTarget.id, reversalReason, reversalNotes);
      notificationService.success("Commission reversed successfully");
      setShowReversalModal(false);
      setReversalTarget(null);
      loadData();
    } catch (error) {
      console.error("Error reversing commission:", error);
      notificationService.error(error.message || "Failed to reverse commission");
    } finally {
      setReversing(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      notificationService.warning("No transactions to export");
      return;
    }

    const headers = ["Agent", "Invoice", "Sale Amount", "Rate (%)", "Commission", "Date", "Status"];
    const rows = filteredTransactions.map((t) => [
      t.agentName || "",
      t.invoiceNumber || "",
      parseFloat(t.saleAmount || 0).toFixed(2),
      t.commissionRate || 0,
      parseFloat(t.commissionAmount || 0).toFixed(2),
      t.createdAt ? formatDateDMY(t.createdAt) : "",
      t.status || "pending",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `commission_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notificationService.success(`Exported ${filteredTransactions.length} transactions`);
  };

  const toggleTransaction = (id) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAllTransactions = () => {
    if (selectedTransactions.size === paginatedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(paginatedTransactions.map((t) => t.id)));
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || "pending").toLowerCase();
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        darkBg: "bg-yellow-900/30",
        text: "text-yellow-800",
        darkText: "text-yellow-400",
        label: "Pending",
      },
      approved: {
        bg: "bg-blue-100",
        darkBg: "bg-blue-900/30",
        text: "text-blue-800",
        darkText: "text-blue-400",
        label: "Approved",
      },
      paid: {
        bg: "bg-green-100",
        darkBg: "bg-green-900/30",
        text: "text-green-800",
        darkText: "text-green-400",
        label: "Paid",
      },
      reversed: {
        bg: "bg-red-100",
        darkBg: "bg-red-900/30",
        text: "text-red-800",
        darkText: "text-red-400",
        label: "Reversed",
      },
    };
    const config = statusConfig[statusLower] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? `${config.darkBg} ${config.darkText}` : `${config.bg} ${config.text}`}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Commission Transactions
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage and track commission transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              isDarkMode
                ? "bg-green-700 hover:bg-green-600 text-white disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-200 disabled:text-gray-400"
            } disabled:cursor-not-allowed`}
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`rounded-lg p-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="Search agent or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="reversed">Reversed</option>
          </select>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.fullName || agent.username}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.size > 0 && (
        <div
          className={`rounded-lg p-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {selectedTransactions.size} transaction(s) selected
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve Selected</span>
              </button>
              <button
                type="button"
                onClick={handleBulkMarkPaid}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Mark as Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div
        className={`rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} overflow-hidden`}
      >
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`h-16 w-16 mx-auto ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
            <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {searchTerm || selectedStatus !== "all" || selectedAgent !== "all"
                ? "No transactions found"
                : "No transactions yet"}
            </h3>
            <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {searchTerm || selectedStatus !== "all" || selectedAgent !== "all"
                ? "Try adjusting your filters"
                : "Transactions will appear here once commissions are generated"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedTransactions.size === paginatedTransactions.length && paginatedTransactions.length > 0
                        }
                        onChange={toggleAllTransactions}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label="Select all transactions"
                      />
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Agent
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Invoice
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Sale Amount
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Rate
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Commission
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {paginatedTransactions.map((transaction) => {
                    const isReversed = (transaction.status || "").toLowerCase() === "reversed";
                    return (
                      <tr
                        key={transaction.id}
                        className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} ${isReversed ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => toggleTransaction(transaction.id)}
                            disabled={isReversed}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            aria-label={`Select transaction ${transaction.invoiceNumber || transaction.id}`}
                          />
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"} ${isReversed ? "line-through" : ""}`}
                        >
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{transaction.agentName}</span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"} ${isReversed ? "line-through" : ""}`}
                        >
                          {transaction.invoiceNumber || "-"}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                          {formatCurrency(parseFloat(transaction.saleAmount || 0))}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                          {transaction.commissionRate}%
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} ${isReversed ? "line-through text-red-500" : ""}`}
                        >
                          {formatCurrency(parseFloat(transaction.commissionAmount || 0))}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActionMenuOpen(actionMenuOpen === transaction.id ? null : transaction.id)
                              }
                              disabled={isReversed}
                              className={`p-2 rounded-lg ${
                                isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {actionMenuOpen === transaction.id && !isReversed && (
                              <div
                                className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg z-10 border ${
                                  isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => openReversalModal(transaction)}
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                                    isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-50 text-red-600"
                                  }`}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  <span>Reverse Commission</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className={`px-4 py-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of{" "}
                    {totalCount}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 rounded border text-sm ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-600" : "hover:bg-gray-200 text-gray-600 disabled:text-gray-300"} disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-600" : "hover:bg-gray-200 text-gray-600 disabled:text-gray-300"} disabled:cursor-not-allowed`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`rounded-lg p-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Transactions</p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{totalCount}</p>
          </div>
          <div
            className={`rounded-lg p-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Sales</p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatCurrency(filteredTransactions.reduce((sum, t) => sum + parseFloat(t.saleAmount || 0), 0))}
            </p>
          </div>
          <div
            className={`rounded-lg p-4 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Commission</p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatCurrency(filteredTransactions.reduce((sum, t) => sum + parseFloat(t.commissionAmount || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {showReversalModal && reversalTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-md w-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Reverse Commission
                </h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Invoice: {reversalTarget.invoiceNumber}
                </p>
                <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Amount: {formatCurrency(parseFloat(reversalTarget.commissionAmount || 0))}
                </p>
              </div>
              <div>
                <label
                  htmlFor="reversal-reason"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Reason for Reversal <span className="text-red-500">*</span>
                </label>
                <select
                  id="reversal-reason"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select reason...</option>
                  <option value="INVOICE_CANCELLED">Invoice Cancelled</option>
                  <option value="CREDIT_NOTE_ISSUED">Credit Note Issued</option>
                  <option value="DUPLICATE_ENTRY">Duplicate Entry</option>
                  <option value="CALCULATION_ERROR">Calculation Error</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="reversal-notes"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Additional Notes
                </label>
                <textarea
                  id="reversal-notes"
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div
              className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} flex justify-end space-x-3`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowReversalModal(false);
                  setReversalTarget(null);
                }}
                disabled={reversing}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReversal}
                disabled={reversing || !reversalReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
              >
                {reversing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Reversing...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Reverse Commission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
          aria-label="Close action menu"
        />
      )}
    </div>
  );
};

export default CommissionTransactions;
