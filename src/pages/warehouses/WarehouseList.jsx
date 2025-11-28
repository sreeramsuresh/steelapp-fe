/**
 * WarehouseList Page
 * Main entry point for Warehouse module - displays all warehouses with summary cards
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  MapPin,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { warehouseService } from '../../services/warehouseService';
import { notificationService } from '../../services/notificationService';
import WarehouseCard from '../../components/warehouses/WarehouseCard';
import WarehouseSummaryCards from '../../components/warehouses/WarehouseSummaryCards';
import WarehouseFormDialog from '../../components/warehouses/WarehouseFormDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const WarehouseList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // State
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  // Summary stats - initialize with cached data if available (stale-while-revalidate)
  const cachedSummary = warehouseService.getCachedSummary();
  const [summary, setSummary] = useState(cachedSummary || {
    totalWarehouses: 0,
    activeWarehouses: 0,
    totalInventoryItems: 0,
    totalStockValue: 0,
    lowStockItems: 0,
  });

  // Track if summary is loading (only true if no cached data available)
  const [summaryLoading, setSummaryLoading] = useState(!cachedSummary);

  // Fetch warehouses and summary
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch warehouses and summary in parallel
      const [result, summaryData] = await Promise.all([
        warehouseService.getAll({
          search: searchTerm,
          isActive: filterActive === 'all' ? undefined : filterActive === 'active',
        }),
        warehouseService.getSummary(),
      ]);

      const warehouseList = result.data || [];
      setWarehouses(warehouseList);

      // Update summary with fresh data (getSummary already updates cache)
      setSummary(summaryData);
      setSummaryLoading(false);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      notificationService.error('Failed to load warehouses');
      setSummaryLoading(false);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterActive]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Handlers
  const handleAddWarehouse = () => {
    setEditingWarehouse(null);
    setFormDialogOpen(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormDialogOpen(true);
  };

  const handleViewWarehouse = (warehouse) => {
    navigate(`/warehouses/${warehouse.id}`);
  };

  const handleDeleteWarehouse = async (warehouse) => {
    const confirmed = await confirm({
      title: 'Delete Warehouse',
      message: `Are you sure you want to delete "${warehouse.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await warehouseService.delete(warehouse.id);
        notificationService.success('Warehouse deleted successfully');
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        notificationService.error('Failed to delete warehouse');
      }
    }
  };

  const handleFormSave = async (formData) => {
    try {
      if (editingWarehouse) {
        await warehouseService.update(editingWarehouse.id, formData);
        notificationService.success('Warehouse updated successfully');
      } else {
        await warehouseService.create(formData);
        notificationService.success('Warehouse created successfully');
      }
      setFormDialogOpen(false);
      setEditingWarehouse(null);
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      notificationService.error(error.message || 'Failed to save warehouse');
    }
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingWarehouse(null);
  };

  // Filter warehouses by search term
  const filteredWarehouses = warehouses.filter(warehouse => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      warehouse.name?.toLowerCase().includes(term) ||
      warehouse.code?.toLowerCase().includes(term) ||
      warehouse.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-teal-900/30' : 'bg-teal-100'}`}>
              <MapPin className={`w-6 h-6 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Warehouses
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage warehouse locations and capacity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWarehouses}
              className={`p-2 rounded-lg border ${
                isDarkMode
                  ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleAddWarehouse}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Warehouse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <WarehouseSummaryCards summary={summary} loading={loading} />
      </div>

      {/* Filters */}
      <div className={`mx-6 mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-[#121418] border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>

          {/* Filter by Status */}
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterActive === status
                    ? 'bg-teal-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warehouse Grid */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-48 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Package className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No warehouses found
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first warehouse'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddWarehouse}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus className="w-5 h-5" />
                Add Warehouse
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarehouses.map((warehouse) => (
              <WarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                onView={() => handleViewWarehouse(warehouse)}
                onEdit={() => handleEditWarehouse(warehouse)}
                onDelete={() => handleDeleteWarehouse(warehouse)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {formDialogOpen && (
        <WarehouseFormDialog
          open={formDialogOpen}
          warehouse={editingWarehouse}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        variant={dialogState.variant}
      />
    </div>
  );
};

export default WarehouseList;
