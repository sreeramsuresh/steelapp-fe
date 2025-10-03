import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, X, AlertCircle, ChevronDown } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  formatCurrency,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotal,
  generatePONumber,
} from "../utils/invoiceUtils";
import { purchaseOrdersAPI } from "../services/api";
import { stockMovementService } from "../services/stockMovementService";
import { PRODUCT_TYPES, STEEL_GRADES, FINISHES } from "../types";
import { useApiData } from "../hooks/useApi";
import { notificationService } from "../services/notificationService";

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [purchaseOrder, setPurchaseOrder] = useState({
    poNumber: generatePONumber(), // Fallback PO number generation
    supplierName: "",
    supplierEmail: "",
    supplierPhone: "",
    supplierAddress: "",
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    status: "draft",
    stockStatus: "retain", // Default to 'retain'
    items: [
      {
        productType: "",
        name: "", // This will be same as productType for consistency
        grade: "",
        thickness: "",
        size: "",
        finish: "",
        specification: "", // Keep for backward compatibility
        unit: "MT",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    notes: "",
    terms: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing purchase order when editing
  useEffect(() => {
    const loadExisting = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await purchaseOrdersAPI.getById(id);
        // Map backend fields to form model
        setPurchaseOrder(prev => ({
          ...prev,
          poNumber: data.po_number || prev.poNumber,
          supplierName: data.supplier_name || '',
          supplierEmail: data.supplier_email || '',
          supplierPhone: data.supplier_phone || '',
          supplierAddress: data.supplier_address || '',
          poDate: data.po_date || prev.poDate,
          expectedDeliveryDate: data.expected_delivery_date || '',
          status: data.status || 'draft',
          stockStatus: data.stock_status || 'retain',
          items: Array.isArray(data.items) ? data.items.map(it => ({
            productType: it.name || '',
            name: it.name || '',
            grade: '',
            thickness: '',
            size: '',
            finish: '',
            specification: it.specification || '',
            unit: it.unit || 'MT',
            quantity: it.quantity || 0,
            rate: it.rate || 0,
            amount: it.amount || 0,
          })) : prev.items,
          subtotal: data.subtotal || 0,
          vatAmount: data.gst_amount || 0,
          total: data.total || 0,
          notes: data.notes || '',
          terms: data.terms || '',
        }));
      } catch (e) {
        notificationService.error('Failed to load purchase order');
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [id]);

  // Get next PO number from server (only for new purchase orders)
  const { data: nextPOData } = useApiData(
    () => purchaseOrdersAPI.getNextNumber(),
    [],
    !id  // Only fetch when creating new PO (not editing)
  );

  // Update PO number when server data is available
  useEffect(() => {
    if (nextPOData && nextPOData.next_po_number && !id) {
      setPurchaseOrder((prev) => ({
        ...prev,
        poNumber: nextPOData.next_po_number,
      }));
    }
  }, [nextPOData, id]);

  const handleInputChange = (field, value) => {
    setPurchaseOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const quantity =
        field === "quantity"
          ? parseFloat(value) || 0
          : updatedItems[index].quantity;
      const rate =
        field === "rate" ? parseFloat(value) || 0 : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }

    setPurchaseOrder((prev) => {
      const newPO = {
        ...prev,
        items: updatedItems,
      };

      // Recalculate totals
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = subtotal * 0.05; // 5% TRN
      const total = subtotal + vatAmount;

      return {
        ...newPO,
        subtotal,
        vatAmount,
        total,
      };
    });
  };

  const addItem = () => {
    setPurchaseOrder((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productType: "",
          name: "",
          grade: "",
          thickness: "",
          size: "",
          finish: "",
          specification: "",
          unit: "MT",
          quantity: 0,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (purchaseOrder.items.length > 1) {
      const updatedItems = purchaseOrder.items.filter((_, i) => i !== index);
      setPurchaseOrder((prev) => {
        const newPO = {
          ...prev,
          items: updatedItems,
        };

        // Recalculate totals
        const subtotal = calculateSubtotal(updatedItems);
        const vatAmount = subtotal * 0.05; // 5% TRN
        const total = subtotal + vatAmount;

        return {
          ...newPO,
          subtotal,
          vatAmount,
          total,
        };
      });
    }
  };

  const handleSubmit = async (status = "draft") => {
    setLoading(true);
    try {
      const poData = { ...purchaseOrder, status };
      
      // Basic validation
      if (!poData.supplierName) {
        notificationService.warning('Supplier name is required');
        setLoading(false);
        return;
      }
      
      if (!poData.items || poData.items.length === 0) {
        notificationService.warning('At least one item is required');
        setLoading(false);
        return;
      }
      
      // Validate that at least one item has required fields
      const validItems = poData.items.filter(item => 
        (item.productType || item.name) && item.quantity > 0
      );
      
      if (validItems.length === 0) {
        notificationService.warning('At least one item must have a product type and quantity greater than 0');
        setLoading(false);
        return;
      }
      
      // Transform data to match backend expectations (snake_case)
  const transformedData = {
        po_number: poData.poNumber,
        supplier_name: poData.supplierName,
        supplier_email: poData.supplierEmail || null,
        supplier_phone: poData.supplierPhone || null,
        supplier_address: poData.supplierAddress || null,
        po_date: poData.poDate,
        expected_delivery_date: poData.expectedDeliveryDate || null,
    status: poData.status,
        stock_status: poData.stockStatus,
        notes: poData.notes || null,
        terms: poData.terms || null,
        subtotal: parseFloat(poData.subtotal) || 0,
        gst_amount: parseFloat(poData.vatAmount) || 0,
        total: parseFloat(poData.total) || 0,
        // Transform items array
        items: poData.items.map(item => ({
          product_type: item.productType || item.name || '',
          name: item.name || item.productType || '',
          grade: item.grade || null,
          thickness: item.thickness || null,
          size: item.size || null,
          finish: item.finish || null,
          specification: item.specification || null,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0
        }))
      };
      
      // Log the full data structure for debugging
      console.log('Submitting PO data:', JSON.stringify(transformedData, null, 2));
      
      let savedPO;
      if (id) {
        // Update existing purchase order
        savedPO = await purchaseOrdersAPI.update(id, transformedData);
      } else {
        // Create new purchase order
        savedPO = await purchaseOrdersAPI.create(transformedData);
      }
      
  // If status is received, add items to stock
  if (poData.status === "received") {
        for (const item of poData.items) {
          if ((item.productType || item.name) && item.quantity > 0) {
            const stockMovement = {
              date: new Date().toISOString().split("T")[0],
              movement: "IN", // Stock IN movement
              productType: item.productType || item.name,
              grade: item.grade || item.specification || "",
              thickness: item.thickness || "",
              size: item.size || "",
              finish: item.finish || "",
              invoiceNo: poData.poNumber,
              quantity: item.quantity,
              currentStock: item.quantity, // Will be updated by backend
              seller: poData.supplierName,
              notes: `Added from PO #${poData.poNumber} - Transit Completed`
            };
            
            await stockMovementService.createMovement(stockMovement);
          }
        }
      }
      
      // Show success notification
      const action = id ? 'updated' : 'created';
      notificationService.success(`Purchase order ${action} successfully!`);
      
      navigate("/purchase-orders");
    } catch (error) {
      console.error("Error saving purchase order:", error);
      const action = id ? 'update' : 'create';
      
      // Extract more detailed error message
      let errorMessage = 'Unknown error';
      const errorData = error.response?.data;
      
      // Check for validation errors array
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Join all error messages
        errorMessage = errorData.errors.map(err => 
          typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err)
        ).join(', ');
        
        // Show each error as a separate notification
        errorData.errors.forEach(err => {
          const msg = typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err);
          notificationService.error(msg);
        });
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Detailed error:', errorData);
      console.log('Error messages:', errorData?.errors);
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className="container mx-auto px-0">
        <div className={`p-4 sm:p-6 mx-0 rounded-none sm:rounded-2xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          {/* Header */}
          <div className={`sticky top-0 z-10 flex justify-between items-center mb-6 p-4 -m-4 sm:-m-6 sm:p-6 rounded-t-2xl border-b ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/purchase-orders")}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🛒 {id ? "Edit" : "Create"} Purchase Order
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={loading}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit("pending")}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save size={18} />
                Submit PO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            {/* PO Details */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Purchase Order Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={purchaseOrder.poNumber}
                    onChange={(e) => handleInputChange("poNumber", e.target.value)}
                    placeholder="PO-2024-001"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PO Date
                  </label>
                  <input
                    type="date"
                    value={purchaseOrder.poDate}
                    onChange={(e) => handleInputChange("poDate", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={purchaseOrder.expectedDeliveryDate}
                    onChange={(e) => handleInputChange("expectedDeliveryDate", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Stock Status
                  </label>
                  <div className="relative">
                    <select
                      value={purchaseOrder.stockStatus}
                      onChange={(e) => handleInputChange("stockStatus", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="retain">Retain (Add to Stock)</option>
                      <option value="transit">Transit (Do not add to Stock)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Details */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Supplier Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseOrder.supplierName}
                    onChange={(e) => handleInputChange("supplierName", e.target.value)}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={purchaseOrder.supplierEmail}
                    onChange={(e) => handleInputChange("supplierEmail", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={purchaseOrder.supplierPhone}
                    onChange={(e) => handleInputChange("supplierPhone", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={purchaseOrder.supplierAddress}
                    onChange={(e) => handleInputChange("supplierAddress", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={`p-6 mt-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Items
              </h2>
              <button
                onClick={addItem}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Product Type
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Grade
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Thickness
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Size
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Finish
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Unit
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Qty
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Rate
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Amount
                    </th>
                    <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {purchaseOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={item.productType}
                            onChange={(e) => {
                              handleItemChange(index, "productType", e.target.value);
                              handleItemChange(index, "name", e.target.value); // Keep name in sync
                            }}
                            className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Product</option>
                            {PRODUCT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={item.grade}
                            onChange={(e) => handleItemChange(index, "grade", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Grade</option>
                            {STEEL_GRADES.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.thickness}
                          onChange={(e) => handleItemChange(index, "thickness", e.target.value)}
                          placeholder="e.g., 12mm"
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(index, "size", e.target.value)}
                          placeholder="e.g., 4x8"
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={item.finish}
                            onChange={(e) => handleItemChange(index, "finish", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Finish</option>
                            {FINISHES.map((finish) => (
                              <option key={finish} value={finish}>
                                {finish}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="MT">MT</option>
                            <option value="KG">KG</option>
                            <option value="PC">PC</option>
                            <option value="FT">FT</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(item.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={purchaseOrder.items.length === 1}
                          className={`p-2 rounded transition-colors ${
                            purchaseOrder.items.length === 1
                              ? 'opacity-50 cursor-not-allowed'
                              : isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between mb-2">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Subtotal:
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(purchaseOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    TRN (5%):
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(purchaseOrder.vatAmount)}
                  </span>
                </div>
                <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                <div className="flex justify-between">
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total:
                  </span>
                  <span className={`text-lg font-bold text-teal-600`}>
                    {formatCurrency(purchaseOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Notes
              </h2>
              <textarea
                rows={4}
                value={purchaseOrder.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Terms & Conditions
              </h2>
              <textarea
                rows={4}
                value={purchaseOrder.terms}
                onChange={(e) => handleInputChange("terms", e.target.value)}
                placeholder="Terms and conditions..."
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
