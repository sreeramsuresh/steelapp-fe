import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, X, AlertCircle, ChevronDown } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  formatCurrency,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotal,
} from "../utils/invoiceUtils";

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [purchaseOrder, setPurchaseOrder] = useState({
    poNumber: "",
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
        name: "",
        specification: "",
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
          name: "",
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
      // TODO: Implement API call to save purchase order
      console.log("Saving purchase order:", { ...purchaseOrder, status });
      navigate("/purchase-orders");
    } catch (error) {
      console.error("Error saving purchase order:", error);
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
          <div className="flex justify-between items-center mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={purchaseOrder.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="received">Received</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </div>
                  </div>
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
                      Product Name
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Specification
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Unit
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Quantity
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
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, "name", e.target.value)}
                          placeholder="Product name"
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
                          value={item.specification}
                          onChange={(e) => handleItemChange(index, "specification", e.target.value)}
                          placeholder="Specification"
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
