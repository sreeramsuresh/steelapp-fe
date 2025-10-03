import React, { useState, useEffect } from "react";
import {
  Plus as Add,
  Edit,
  Trash2 as Delete,
  Search,
  Package,
  TrendingDown,
  TrendingUp,
  Warehouse,
  DollarSign,
  Filter,
  AlertTriangle,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { inventoryService } from "../services/inventoryService";
import {
  createInventoryItem,
  PRODUCT_TYPES,
  STEEL_GRADES,
  FINISHES,
} from "../types";

const InventoryList = () => {
  const { isDarkMode } = useTheme();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [inTransitNames, setInTransitNames] = useState(new Set());
  const [addingDummyData, setAddingDummyData] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState(() => {
    const item = createInventoryItem();
    return {
      ...item,
      quantity: "",
      pricePurchased: "",
      sellingPrice: "",
      landedCost: "",
      warehouseId: "",
      warehouseName: "",
    };
  });

  useEffect(() => {
    fetchInventory();
    fetchTransitNames();
    fetchWarehouses();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAllItems();
      setInventory(response.data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  // Build a quick lookup of item names that are currently in-transit in POs
  const fetchTransitNames = async () => {
    try {
      // Ask backend for only transit stock_status POs
      const poResp = await (await import('../services/api')).purchaseOrdersAPI.getAll({ stock_status: 'transit' });
      let pos = [];
      if (Array.isArray(poResp)) pos = poResp;
      else if (poResp?.data && Array.isArray(poResp.data)) pos = poResp.data;
      else if (poResp?.purchase_orders && Array.isArray(poResp.purchase_orders)) pos = poResp.purchase_orders;
      const names = new Set();
      for (const po of pos) {
        const items = Array.isArray(po.items) ? po.items : [];
        for (const it of items) {
          if (it?.name) names.add(String(it.name).toLowerCase());
        }
      }
      setInTransitNames(names);
    } catch (e) {
      // Non-blocking; inventory will still show
      console.warn('Failed to fetch transit POs for inventory filter:', e);
    }
  };

  const dummyInventoryItems = [
    {
      description: "SS SHEET GR316L Mirror finish 4x8 1.2MM",
      productType: "Sheet",
      grade: "316L",
      finish: "Mirror",
      size: "4x8",
      thickness: "1.2",
      quantity: 25,
      pricePurchased: 850,
      sellingPrice: 1200,
      landedCost: 920,
      warehouseId: "1",
      warehouseName: "Main Warehouse (Sharjah)",
      location: "Section A - Row 1"
    },
    {
      description: "SS PIPE GR304 HL finish 2 inch 3.0MM",
      productType: "Pipe",
      grade: "304",
      finish: "HL",
      size: "2 inch",
      thickness: "3.0",
      quantity: 12,
      pricePurchased: 1200,
      sellingPrice: 1650,
      landedCost: 1280,
      warehouseId: "2",
      warehouseName: "Dubai Branch Warehouse (Dubai)",
      location: "Section B - Row 2"
    },
    {
      description: "SS ROUND BAR GR316 Bright finish 25mm",
      productType: "Round Bar",
      grade: "316",
      finish: "Bright",
      size: "25mm",
      thickness: "",
      quantity: 8,
      pricePurchased: 950,
      sellingPrice: 1350,
      landedCost: 1020,
      warehouseId: "3",
      warehouseName: "Abu Dhabi Warehouse (Abu Dhabi)",
      location: "Section C - Row 1"
    },
    {
      description: "SS ANGLE GR304L 2B finish 50x50x5",
      productType: "Angle",
      grade: "304L",
      finish: "2B",
      size: "50x50x5",
      thickness: "5.0",
      quantity: 4,
      pricePurchased: 720,
      sellingPrice: 1050,
      landedCost: 780,
      warehouseId: "1",
      warehouseName: "Main Warehouse (Sharjah)",
      location: "Section D - Row 3"
    },
    {
      description: "SS FLAT BAR GR316L HL finish 40x10",
      productType: "Flat Bar",
      grade: "316L",
      finish: "HL",
      size: "40x10",
      thickness: "10.0",
      quantity: 15,
      pricePurchased: 890,
      sellingPrice: 1280,
      landedCost: 960,
      location: "Warehouse A - Section 3"
    },
    {
      description: "SS HEXAGON BAR GR304 Bright finish 12mm",
      productType: "Hexagon Bar",
      grade: "304",
      finish: "Bright",
      size: "12mm",
      thickness: "",
      quantity: 6,
      pricePurchased: 680,
      sellingPrice: 980,
      landedCost: 720,
      location: "Warehouse C - Section 1"
    },
    {
      description: "SS SQUARE BAR GR316 Mirror finish 20x20",
      productType: "Square Bar",
      grade: "316",
      finish: "Mirror",
      size: "20x20",
      thickness: "20.0",
      quantity: 18,
      pricePurchased: 1150,
      sellingPrice: 1580,
      landedCost: 1220,
      location: "Warehouse C - Section 2"
    },
    {
      description: "SS COIL GR304L 2B finish 1500mm 0.8MM",
      productType: "Coil",
      grade: "304L",
      finish: "2B",
      size: "1500mm",
      thickness: "0.8",
      quantity: 3,
      pricePurchased: 2200,
      sellingPrice: 2950,
      landedCost: 2350,
      location: "Warehouse D - Large Items"
    },
    {
      description: "SS CHANNEL GR316L HL finish 100x50x8",
      productType: "Channel",
      grade: "316L",
      finish: "HL",
      size: "100x50x8",
      thickness: "8.0",
      quantity: 7,
      pricePurchased: 1450,
      sellingPrice: 1920,
      landedCost: 1520,
      location: "Warehouse D - Section 1"
    },
    {
      description: "SS WIRE GR304 Bright finish 8mm",
      productType: "Wire",
      grade: "304",
      finish: "Bright",
      size: "8mm",
      thickness: "",
      quantity: 22,
      pricePurchased: 420,
      sellingPrice: 680,
      landedCost: 450,
      location: "Warehouse B - Section 3"
    },
    {
      description: "SS TEE GR316 Mirror finish 50x50x5",
      productType: "Tee",
      grade: "316",
      finish: "Mirror",
      size: "50x50x5",
      thickness: "5.0",
      quantity: 9,
      pricePurchased: 1320,
      sellingPrice: 1780,
      landedCost: 1390,
      location: "Warehouse A - Section 4"
    },
    {
      description: "SS ELBOW GR304L HL finish 90 degree 25mm",
      productType: "Elbow",
      grade: "304L",
      finish: "HL",
      size: "25mm",
      thickness: "3.0",
      quantity: 14,
      pricePurchased: 580,
      sellingPrice: 850,
      landedCost: 620,
      location: "Warehouse C - Section 3"
    }
  ];

  const addDummyData = async () => {
    setAddingDummyData(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const item of dummyInventoryItems) {
        try {
          await inventoryService.createItem(item);
          successCount++;
        } catch (error) {
          console.error(`Failed to add: ${item.description}`, error);
          errorCount++;
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await fetchInventory(); // Refresh the list
      setError(`✅ Successfully added ${successCount} dummy items${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      
    } catch (error) {
      console.error('Error adding dummy data:', error);
      setError('Failed to add dummy data');
    } finally {
      setAddingDummyData(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      // Sample warehouse data matching the warehouse management component
      const sampleWarehouses = [
        {
          id: 1,
          name: 'Main Warehouse',
          code: 'WH-MAIN',
          city: 'Sharjah',
          isActive: true
        },
        {
          id: 2,
          name: 'Dubai Branch Warehouse',
          code: 'WH-DBX',
          city: 'Dubai',
          isActive: true
        },
        {
          id: 3,
          name: 'Abu Dhabi Warehouse',
          code: 'WH-AUH',
          city: 'Abu Dhabi',
          isActive: true
        },
        {
          id: 4,
          name: 'Ajman Storage',
          code: 'WH-AJM',
          city: 'Ajman',
          isActive: false
        }
      ];
      setWarehouses(sampleWarehouses.filter(w => w.isActive)); // Only show active warehouses
    } catch (error) {
      console.warn('Failed to fetch warehouses:', error);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      const item = createInventoryItem();
      setFormData({
        ...item,
        quantity: "",
        pricePurchased: "",
        sellingPrice: "",
        landedCost: "",
        warehouseId: "",
        warehouseName: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    const item = createInventoryItem();
    setFormData({
      ...item,
      quantity: "",
      pricePurchased: "",
      sellingPrice: "",
      landedCost: "",
      warehouseId: "",
      warehouseName: "",
    });
    setError("");
  };

  const handleSubmit = async () => {
    try {
      const itemData = {
        ...formData,
        quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
        pricePurchased:
          formData.pricePurchased === "" ? 0 : Number(formData.pricePurchased),
        sellingPrice:
          formData.sellingPrice === "" ? 0 : Number(formData.sellingPrice),
        landedCost:
          formData.landedCost === "" ? 0 : Number(formData.landedCost),
      };

      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, itemData);
      } else {
        await inventoryService.createItem(itemData);
      }
      await fetchInventory();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      setError("Failed to save inventory item");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this inventory item?")
    ) {
      try {
        await inventoryService.deleteItem(id);
        await fetchInventory();
      } catch (error) {
        console.error("Error deleting inventory item:", error);
        setError("Failed to delete inventory item");
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWarehouseChange = (warehouseId) => {
    const selectedWarehouse = warehouses.find(w => w.id.toString() === warehouseId);
    setFormData((prev) => ({
      ...prev,
      warehouseId: warehouseId,
      warehouseName: selectedWarehouse ? `${selectedWarehouse.name} (${selectedWarehouse.city})` : "",
      location: selectedWarehouse ? `${selectedWarehouse.name} - ${selectedWarehouse.city}` : prev.location,
    }));
  };

  const filteredInventory = inventory
    // Hide items whose product name matches any in-transit PO item
    .filter((item) => {
      const name = (item.productType || item.description || '').toString().toLowerCase();
      if (!name) return true;
      return !inTransitNames.has(name);
    })
    // Apply local search filter
    .filter((item) =>
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateDescription = (item) => {
    const parts = [];
    if (item.productType) parts.push(`SS ${item.productType.toUpperCase()}`);
    if (item.grade) parts.push(`GR${item.grade}`);
    if (item.finish) parts.push(`${item.finish} finish`);
    if (item.size) parts.push(item.size);
    if (item.thickness) parts.push(`${item.thickness}MM`);
    return parts.join(" ");
  };

  if (loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading inventory...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="mb-6">
          <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📋 Inventory Management
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your steel inventory and track stock levels
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
            isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-4">
              <X size={16} />
            </button>
          </div>
        )}

        <div className={`p-4 mb-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex gap-4 items-center">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
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
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                  : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filter
            </button>
            <button
              onClick={addDummyData}
              disabled={addingDummyData || inventory.length > 0}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                addingDummyData || inventory.length > 0
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              } ${
                isDarkMode 
                  ? 'border-blue-600 bg-blue-800 text-blue-100 hover:bg-blue-700' 
                  : 'border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              {addingDummyData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Package size={16} />
              )}
              {addingDummyData ? 'Adding...' : 'Add Demo Data'}
            </button>
            <button
              onClick={() => handleOpenDialog()}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Add size={16} />
              Add Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Description
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Product Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Grade
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Finish
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Size
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Thickness
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Quantity
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Purchase Price
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Selling Price
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Landed Cost
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Warehouse & Location
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredInventory.map((item) => (
                <tr key={item.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.description || generateDescription(item)}
                    </div>
                    {(item.warehouseName || item.location) && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                      }`}>
                        <Warehouse size={12} />
                        {item.warehouseName || item.location}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.productType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}>
                      {item.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.finish && (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                        isDarkMode ? 'bg-purple-900/30 border-purple-600 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-700'
                      }`}>
                        {item.finish}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.size}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.thickness}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const isLow = (item.minStock === 0 ? item.quantity <= 5 : item.quantity <= item.minStock);
                      return (
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            isLow
                              ? (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                              : (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                          }`}>
                            {isLow ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
                            {item.quantity}
                          </span>
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Min: {item.minStock || 0}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.pricePurchased
                        ? formatCurrency(item.pricePurchased)
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold text-green-600`}>
                      {item.sellingPrice
                        ? formatCurrency(item.sellingPrice)
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.landedCost ? formatCurrency(item.landedCost) : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.warehouseName && (
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.warehouseName}
                        </div>
                      )}
                      {item.location && (
                        <div className="text-xs">
                          {item.location}
                        </div>
                      )}
                      {!item.warehouseName && !item.location && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleOpenDialog(item)}
                        className={`p-2 rounded transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                        }`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`p-2 rounded transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                        }`}
                      >
                        <Delete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Package size={32} />
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        No inventory items found
                      </h3>
                      <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchTerm
                          ? "Try adjusting your search term"
                          : "Add your first inventory item to get started"}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => handleOpenDialog()}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <Add size={16} />
                          Add Item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Auto-generated if empty"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product Type
                    </label>
                    <div className="relative">
                      <select
                        value={formData.productType}
                        onChange={(e) => handleInputChange("productType", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Product Type</option>
                        {PRODUCT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Grade
                    </label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => handleInputChange("grade", e.target.value)}
                      placeholder="e.g., 304, 316L"
                      list="steel-grades"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <datalist id="steel-grades">
                      {STEEL_GRADES.map((grade) => (
                        <option key={grade} value={grade} />
                      ))}
                    </datalist>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Select from list or type custom grade
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Finish
                    </label>
                    <input
                      type="text"
                      value={formData.finish}
                      onChange={(e) => handleInputChange("finish", e.target.value)}
                      placeholder="e.g., Mirror, HL, 2B"
                      list="finishes"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <datalist id="finishes">
                      {FINISHES.map((finish) => (
                        <option key={finish} value={finish} />
                      ))}
                    </datalist>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Select from list or type custom finish
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Size
                    </label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleInputChange("size", e.target.value)}
                      placeholder="e.g., 4x8"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Thickness
                    </label>
                    <input
                      type="text"
                      value={formData.thickness}
                      onChange={(e) => handleInputChange("thickness", e.target.value)}
                      placeholder="e.g., 0.8, 1.2"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "quantity",
                          e.target.value === "" ? "" : parseInt(e.target.value) || ""
                        )
                      }
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Minimum Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minStock || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "minStock",
                          e.target.value === "" ? "" : parseInt(e.target.value) || ""
                        )
                      }
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Purchase Price
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        د.إ
                      </span>
                      <input
                        type="number"
                        value={formData.pricePurchased || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "pricePurchased",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || ""
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Selling Price
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        د.إ
                      </span>
                      <input
                        type="number"
                        value={formData.sellingPrice || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "sellingPrice",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || ""
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Landed Cost
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        د.إ
                      </span>
                      <input
                        type="number"
                        value={formData.landedCost || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "landedCost",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || ""
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Warehouse
                    </label>
                    <div className="relative">
                      <select
                        value={formData.warehouseId}
                        onChange={(e) => handleWarehouseChange(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Specific Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="e.g., Section A, Row 3, Shelf 2"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
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
                  {editingItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
