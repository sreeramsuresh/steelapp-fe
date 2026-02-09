import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Edit, Eye, FileText, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTheme } from "../contexts/ThemeContext";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  deleteSupplierQuotation,
  getConfidenceColor,
  getStatusColor,
  getStatusText,
  listSupplierQuotations,
} from "../services/supplierQuotationService";

/**
 * Supplier Quotation List Page
 * Displays list of supplier quotations with filtering, search, and actions
 */
export function SupplierQuotationList() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalCount: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listSupplierQuotations({
        page,
        limit: pageSize,
        status: statusFilter || undefined,
        search: searchDebounce || undefined,
      });
      setQuotations(result.quotations || []);
      setPageInfo(result.pageInfo || { totalPages: 0, totalCount: 0 });
    } catch (err) {
      console.error("Failed to load quotations:", err);
      setError(err.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchDebounce]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    try {
      await deleteSupplierQuotation(id);
      toast.success("Quotation deleted successfully");
      loadQuotations();
    } catch (_err) {
      toast.error("Failed to delete quotation");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount, currency = "AED") => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadQuotations} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supplier Quotations
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/app/supplier-quotations/upload")}
              className="flex items-center gap-2"
              data-testid="upload-pdf-btn"
            >
              <Upload size={16} />
              Upload PDF
            </Button>
            <Button
              onClick={() => navigate("/app/supplier-quotations/new")}
              className="flex items-center gap-2"
              data-testid="new-quotation-btn"
            >
              <Plus size={16} />
              New Quotation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reference, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Status:</span>
              <select
                id="quotation-status-filter"
                name="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 border rounded-md text-sm ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="converted_to_po">Converted to PO</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : quotations.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <p className="font-medium">No supplier quotations found</p>
              <p className="text-sm mt-1">Upload or create a supplier quotation to get started.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quote Date</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{q.internalReference || "-"}</div>
                          {q.supplierReference && (
                            <div className="text-xs text-gray-500">Supplier: {q.supplierReference}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{q.supplierName || "-"}</TableCell>
                      <TableCell>{formatDate(q.quoteDate)}</TableCell>
                      <TableCell>{formatDate(q.validityDate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(q.total, q.currency)}</TableCell>
                      <TableCell>
                        <Badge className={`bg-${getStatusColor(q.status)}-100 text-${getStatusColor(q.status)}-800`}>
                          {getStatusText(q.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {q.extractionConfidence > 0 ? (
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full bg-${getConfidenceColor(q.extractionConfidence)}-500`}
                            />
                            <span className="text-sm">{Math.round(q.extractionConfidence)}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/supplier-quotations/${q.id}`)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {q.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/app/supplier-quotations/${q.id}/edit`)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {(q.status === "draft" || q.status === "rejected") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(q.id)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, pageInfo.totalCount)} of{" "}
                  {pageInfo.totalCount} quotations
                </div>
                <div className="flex gap-4 items-center">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="page-size-select" className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Per page:
                    </label>
                    <select
                      id="page-size-select"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1); // Reset to first page
                      }}
                      className={`px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300"}`}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pageInfo.totalPages, p + 1))}
                      disabled={page >= pageInfo.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {deleteConfirm.open && (
        <ConfirmDialog
          title="Delete Quotation?"
          message="Are you sure you want to delete this quotation?"
          variant="danger"
          onConfirm={() => {
            confirmDelete();
            setDeleteConfirm({ open: false, id: null });
          }}
          onCancel={() => setDeleteConfirm({ open: false, id: null })}
        />
      )}
    </div>
  );
}

export default SupplierQuotationList;
