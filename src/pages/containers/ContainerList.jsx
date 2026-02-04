import { ChevronLeft, ChevronRight, Edit, Eye, Filter, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContainerStatusBadge } from "../../components/ContainerStatusBadge";
import { useTheme } from "../../contexts/ThemeContext";
import { suppliersAPI } from "../../services/api";
import { tokenUtils } from "../../services/axiosApi";
import { importContainerService } from "../../services/importContainerService";
import { ContainerForm } from "./ContainerForm";

const CONTAINER_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "BOOKED", label: "Booked" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "CUSTOMS", label: "Customs" },
  { value: "CLEARED", label: "Cleared" },
  { value: "DELIVERED", label: "Delivered" },
];

/**
 * ContainerList - List and manage import containers
 */
export function ContainerList() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = tokenUtils.getUser();
  const companyId = user?.companyId;

  // Data state
  const [containers, setContainers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    supplierId: "",
    etaFrom: "",
    etaTo: "",
    search: "",
  });

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Guard against concurrent API calls
  const loadingRef = useRef(false);

  // Load containers
  const loadContainers = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: itemsPerPage,
        ...filters,
      };

      // Remove empty filter values
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null) {
          delete params[key];
        }
      });

      const response = await importContainerService.getContainers(params);
      setContainers(response.containers || []);

      if (response.pageInfo) {
        setTotalPages(response.pageInfo.totalPages || 1);
        setTotalItems(response.pageInfo.totalItems || 0);
      }
    } catch (err) {
      console.error("Failed to load containers:", err);
      setError(err.message || "Failed to load containers");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, filters]);

  // Load suppliers for filter dropdown
  const loadSuppliers = useCallback(async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response || []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    }
  }, []);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Handlers
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      supplierId: "",
      etaFrom: "",
      etaTo: "",
      search: "",
    });
    setPage(1);
  };

  const handleSearch = (e) => {
    handleFilterChange("search", e.target.value);
  };

  const handleAddContainer = () => {
    setEditingContainer(null);
    setShowForm(true);
  };

  const handleEditContainer = (container) => {
    setEditingContainer(container);
    setShowForm(true);
  };

  const handleViewContainer = (container) => {
    // Could navigate to detail page or open view modal
    navigate(`/containers/${container.id}`);
  };

  const handleDeleteContainer = async (container) => {
    try {
      await importContainerService.deleteContainer(container.id);
      setDeleteConfirm(null);
      loadContainers();
    } catch (err) {
      console.error("Failed to delete container:", err);
      setError(err.message || "Failed to delete container");
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingContainer(null);
    loadContainers();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContainer(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    const num = parseFloat(amount);
    if (Number.isNaN(num)) return "-";
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"} p-4`}
      data-testid="container-list-page"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              📦 Import Containers
            </h1>
            <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage import containers and landed costs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                hasActiveFilters
                  ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  : isDarkMode
                    ? "border-gray-600 text-gray-300 hover:border-teal-500 hover:text-teal-400"
                    : "bg-white border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-teal-500 text-white rounded-full px-2 py-0.5 text-xs">Active</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleAddContainer}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
              data-testid="add-container-button"
            >
              <Plus className="h-4 w-4" />
              Add Container
            </button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div
        className={`p-6 rounded-xl mb-6 border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by container number..."
                value={filters.search}
                onChange={handleSearch}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
        }`}
      >
        <div className="p-6">
          {/* Filters Panel */}
          {showFilters && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? "bg-[#0F1419] border-[#37474F]" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="container-status-filter" className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger id="container-status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTAINER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="container-supplier-filter" className="block text-sm font-medium mb-1">
                    Supplier
                  </label>
                  <Select value={filters.supplierId} onValueChange={(value) => handleFilterChange("supplierId", value)}>
                    <SelectTrigger id="container-supplier-filter">
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="container-eta-from" className="block text-sm font-medium mb-1">
                    ETA From
                  </label>
                  <Input
                    id="container-eta-from"
                    type="date"
                    value={filters.etaFrom}
                    onChange={(e) => handleFilterChange("etaFrom", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="container-eta-to" className="block text-sm font-medium mb-1">
                    ETA To
                  </label>
                  <Input
                    id="container-eta-to"
                    type="date"
                    value={filters.etaTo}
                    onChange={(e) => handleFilterChange("etaTo", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className={`mb-4 p-4 rounded border ${isDarkMode ? "bg-red-900/20 text-red-300 border-red-700" : "bg-red-50 text-red-800 border-red-200"}`}
            >
              {error}
              <Button onClick={loadContainers} className="ml-4" variant="outline" size="sm">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : containers.length === 0 ? (
            /* Empty State */
            <div
              className={`rounded-lg border overflow-hidden ${isDarkMode ? "bg-[#0F1419] border-[#37474F]" : "bg-gray-50 border-gray-200"}`}
            >
              <div className="p-8 text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-200"} flex items-center justify-center`}
                >
                  <div className={`w-8 h-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>📦</div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  No containers found
                </h3>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : 'Click "Add Container" to create your first container'}
                </p>
              </div>
            </div>
          ) : (
            /* Table */
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Container #</TableHead>
                      <TableHead>B/L</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead className="text-right">Landed Cost</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {containers.map((container) => (
                      <TableRow key={container.id}>
                        <TableCell className="font-mono font-medium">{container.containerNumber}</TableCell>
                        <TableCell className="text-sm">{container.billOfLading || "-"}</TableCell>
                        <TableCell>{container.supplierName || "-"}</TableCell>
                        <TableCell>
                          <ContainerStatusBadge status={container.status} />
                        </TableCell>
                        <TableCell>{formatDate(container.eta)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(container.totalLandedCost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContainer(container)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContainer(container)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(container)}
                              title="Delete"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, totalItems)} of {totalItems}{" "}
                  containers
                </p>
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Container Form Modal */}
      {showForm && (
        <ContainerForm
          container={editingContainer}
          companyId={companyId}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`w-full max-w-md p-6 rounded-xl shadow-xl ${
              isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Delete Container</h3>
            <p className="mb-6">
              Are you sure you want to delete container <strong>{deleteConfirm.containerNumber}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteContainer(deleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContainerList;
