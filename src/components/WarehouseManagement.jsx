import React, { useState, useEffect } from 'react';
import {
  Plus as Add,
  Edit,
  Trash2 as Delete,
  Search,
  Warehouse,
  MapPin,
  Package,
  Users,
  AlertTriangle,
  X,
  CheckCircle,
  Building,
  Map,
  Phone,
  Mail
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';

const WarehouseManagement = () => {
  const { isDarkMode } = useTheme();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'UAE',
    contactPerson: '',
    phone: '',
    email: '',
    capacity: '',
    description: '',
    isActive: true
  });

  // Sample warehouse data for demo purposes
  const sampleWarehouses = [
    {
      id: 1,
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: 'Industrial Area 1, Sharjah',
      city: 'Sharjah',
      state: 'Sharjah',
      zipCode: '12345',
      country: 'UAE',
      contactPerson: 'Ahmed Hassan',
      phone: '+971-50-123-4567',
      email: 'ahmed@steelco.ae',
      capacity: '5000 MT',
      description: 'Primary storage facility for stainless steel products',
      isActive: true,
      itemsCount: 45,
      utilizationPercent: 78
    },
    {
      id: 2,
      name: 'Dubai Branch Warehouse',
      code: 'WH-DBX',
      address: 'Dubai Industrial City',
      city: 'Dubai',
      state: 'Dubai',
      zipCode: '54321',
      country: 'UAE',
      contactPerson: 'Omar Al-Mansoori',
      phone: '+971-50-987-6543',
      email: 'omar@steelco.ae',
      capacity: '3000 MT',
      description: 'Secondary warehouse for Dubai operations',
      isActive: true,
      itemsCount: 28,
      utilizationPercent: 65
    },
    {
      id: 3,
      name: 'Abu Dhabi Warehouse',
      code: 'WH-AUH',
      address: 'ICAD II, Abu Dhabi',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      zipCode: '67890',
      country: 'UAE',
      contactPerson: 'Fatima Al-Zahra',
      phone: '+971-50-456-7890',
      email: 'fatima@steelco.ae',
      capacity: '2500 MT',
      description: 'Regional warehouse for Abu Dhabi operations',
      isActive: true,
      itemsCount: 18,
      utilizationPercent: 42
    },
    {
      id: 4,
      name: 'Ajman Storage',
      code: 'WH-AJM',
      address: 'Ajman Free Zone',
      city: 'Ajman',
      state: 'Ajman',
      zipCode: '98765',
      country: 'UAE',
      contactPerson: 'Khalid Ibrahim',
      phone: '+971-50-321-9876',
      email: 'khalid@steelco.ae',
      capacity: '1500 MT',
      description: 'Specialized storage for finished products',
      isActive: false,
      itemsCount: 0,
      utilizationPercent: 0
    }
  ];

  useEffect(() => {
    // Initialize with sample data
    setWarehouses(sampleWarehouses);
  }, []);

  const handleOpenDialog = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData(warehouse);
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'UAE',
        contactPerson: '',
        phone: '',
        email: '',
        capacity: '',
        description: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingWarehouse(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.code) {
        setError('Name and code are required');
        return;
      }

      if (editingWarehouse) {
        // Update existing warehouse
        setWarehouses(prev => 
          prev.map(w => w.id === editingWarehouse.id ? { ...formData, id: w.id } : w)
        );
        notificationService.success('Warehouse updated successfully');
      } else {
        // Add new warehouse
        const newWarehouse = {
          ...formData,
          id: Date.now(), // Simple ID generation for demo
          itemsCount: 0,
          utilizationPercent: 0
        };
        setWarehouses(prev => [...prev, newWarehouse]);
        notificationService.success('Warehouse added successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      setError('Failed to save warehouse');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        setWarehouses(prev => prev.filter(w => w.id !== id));
        notificationService.success('Warehouse deleted successfully');
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        notificationService.error('Failed to delete warehouse');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    Object.values(warehouse).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getUtilizationColor = (percent) => {
    if (percent >= 80) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (percent >= 60) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  const getUtilizationBg = (percent) => {
    if (percent >= 80) return isDarkMode ? 'bg-red-900/30' : 'bg-red-100';
    if (percent >= 60) return isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100';
    return isDarkMode ? 'bg-green-900/30' : 'bg-green-100';
  };

  if (loading) {
    return (
      <div className={`p-6 min-h-[400px] flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className={`ml-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading warehouses...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Warehouse Management
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage warehouse locations and storage facilities
          </p>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${
          isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Add */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex gap-4 items-center">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Add size={16} />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.map((warehouse) => (
          <div key={warehouse.id} className={`rounded-xl border transition-all duration-300 hover:shadow-md ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          } ${!warehouse.isActive ? 'opacity-60' : ''}`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getUtilizationBg(warehouse.utilizationPercent)}`}>
                    <Warehouse size={20} className={getUtilizationColor(warehouse.utilizationPercent)} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {warehouse.name}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {warehouse.code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenDialog(warehouse)}
                    className={`p-2 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                    }`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(warehouse.id)}
                    className={`p-2 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                    }`}
                  >
                    <Delete size={16} />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  warehouse.isActive
                    ? (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                    : (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                }`}>
                  {warehouse.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Location */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {warehouse.city}, {warehouse.state}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Capacity: {warehouse.capacity}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Package size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {warehouse.itemsCount}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Items
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      warehouse.utilizationPercent >= 80 ? 'bg-red-500' :
                      warehouse.utilizationPercent >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {warehouse.utilizationPercent}%
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Utilized
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {warehouse.contactPerson}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {warehouse.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredWarehouses.length === 0 && (
          <div className="col-span-full">
            <div className={`p-12 text-center rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
            }`}>
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Warehouse size={32} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No warehouses found
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchTerm ? 'Try adjusting your search term' : 'Add your first warehouse to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenDialog()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 mx-auto"
                >
                  <Add size={16} />
                  Add Warehouse
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Warehouse Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Warehouse Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="e.g. WH-MAIN"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    State/Emirate
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+971-50-123-4567"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="e.g. 5000 MT"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Active warehouse
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleCloseDialog}
                className={`px-6 py-3 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {editingWarehouse ? 'Update Warehouse' : 'Add Warehouse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;