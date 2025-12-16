import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { importContainerService } from '../../services/importContainerService';
import { suppliersAPI } from '../../services/api';
import { ContainerStatusBadge } from '../../components/ContainerStatusBadge';
import { ContainerForm } from './ContainerForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CONTAINER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'CUSTOMS', label: 'Customs' },
  { value: 'CLEARED', label: 'Cleared' },
  { value: 'DELIVERED', label: 'Delivered' },
];

/**
 * ContainerList - List and manage import containers
 */
export function ContainerList() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

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
    status: '',
    supplierId: '',
    etaFrom: '',
    etaTo: '',
    search: '',
  });

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // TODO: Get from auth context
  const companyId = 1;

  // Load containers
  const loadContainers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        companyId,
        page,
        limit: itemsPerPage,
        ...filters,
      };

      // Remove empty filter values
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null) {
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
      console.error('Failed to load containers:', err);
      setError(err.message || 'Failed to load containers');
    } finally {
      setLoading(false);
    }
  }, [page, filters, companyId]);

  // Load suppliers for filter dropdown
  const loadSuppliers = useCallback(async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
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
      status: '',
      supplierId: '',
      etaFrom: '',
      etaTo: '',
      search: '',
    });
    setPage(1);
  };

  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
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
      console.error('Failed to delete container:', err);
      setError(err.message || 'Failed to delete container');
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
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    const num = parseFloat(amount);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Import Containers</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? 'border-blue-500' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                    Active
                  </span>
                )}
              </Button>
              <Button onClick={handleAddContainer}>
                <Plus className="h-4 w-4 mr-2" />
                Add Container
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by container number..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      handleFilterChange('status', value)
                    }
                  >
                    <SelectTrigger>
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
                  <label className="block text-sm font-medium mb-1">
                    Supplier
                  </label>
                  <Select
                    value={filters.supplierId}
                    onValueChange={(value) =>
                      handleFilterChange('supplierId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.id.toString()}
                        >
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ETA From
                  </label>
                  <Input
                    type="date"
                    value={filters.etaFrom}
                    onChange={(e) =>
                      handleFilterChange('etaFrom', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ETA To
                  </label>
                  <Input
                    type="date"
                    value={filters.etaTo}
                    onChange={(e) =>
                      handleFilterChange('etaTo', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded border border-red-200">
              {error}
              <Button
                onClick={loadContainers}
                className="ml-4"
                variant="outline"
                size="sm"
              >
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
            <div className="text-center py-12">
              <p
                className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                No containers found
              </p>
              <p
                className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Click "Add Container" to create your first container'}
              </p>
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
                        <TableCell className="font-mono font-medium">
                          {container.containerNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {container.billOfLading || '-'}
                        </TableCell>
                        <TableCell>{container.supplierName || '-'}</TableCell>
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
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Showing {(page - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(page * itemsPerPage, totalItems)} of {totalItems}{' '}
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
        </CardContent>
      </Card>

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
              isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Delete Container</h3>
            <p className="mb-6">
              Are you sure you want to delete container{' '}
              <strong>{deleteConfirm.containerNumber}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteContainer(deleteConfirm)}
              >
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
