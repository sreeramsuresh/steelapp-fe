import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  User, 
  Calendar,
  Clock,
  FileText,
  Calculator,
  Package,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { quotationsAPI, customersAPI, productsAPI } from "../services/api";
import { formatCurrency } from "../utils/invoiceUtils";
import { STEEL_GRADES, FINISHES } from "../types";

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    quotation_number: "",
    customer_id: "",
    customer_details: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        emirate: "",
        country: "UAE"
      },
      vat_number: ""
    },
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: "",
    delivery_terms: "",
    payment_terms: "",
    notes: "",
    terms_and_conditions: "",
    items: [],
    subtotal: 0,
    vat_amount: 0,
    total_quantity: 0,
    total_weight: 0,
    other_charges: 0,
    total: 0,
    status: "draft"
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, productsResponse] = await Promise.all([
          customersAPI.getAll({ limit: 1000 }),
          productsAPI.getAll({ limit: 1000 })
        ]);

        setCustomers(customersResponse.customers || []);
        setProducts(productsResponse.products || []);

        if (!isEdit) {
          // Get next quotation number
          const nextNumberResponse = await quotationsAPI.getNextNumber();
          setFormData(prev => ({
            ...prev,
            quotation_number: nextNumberResponse.next_quotation_number
          }));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load initial data");
      }
    };

    fetchData();
  }, [isEdit]);

  // Fetch quotation data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchQuotation = async () => {
        try {
          setLoading(true);
          const response = await quotationsAPI.getById(id);
          setFormData({
            ...response,
            quotation_date: response.quotation_date?.split('T')[0],
            valid_until: response.valid_until?.split('T')[0] || "",
            items: response.items || []
          });
        } catch (err) {
          console.error("Error fetching quotation:", err);
          setError("Failed to load quotation data");
        } finally {
          setLoading(false);
        }
      };

      fetchQuotation();
    }
  }, [isEdit, id]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_details: {
          name: customer.name,
          company: customer.company || "",
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || {
            street: "",
            city: "",
            emirate: "",
            country: "UAE"
          },
          vat_number: customer.vat_number || ""
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_details: {
          name: "",
          company: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            emirate: "",
            country: "UAE"
          },
          vat_number: ""
        }
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: "",
        name: "",
        specification: "",
        grade: "",
        finish: "",
        size: "",
        thickness: "",
        description: "",
        hsn_code: "",
        unit: "pcs",
        quantity: 1,
        rate: 0,
        discount: 0,
        discount_type: "amount",
        taxable_amount: 0,
        vat_rate: 5,
        amount: 0,
        net_amount: 0
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    calculateTotals();
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // If product is selected, populate item details
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index] = {
          ...newItems[index],
          name: product.name,
          specification: product.specifications?.specification || product.specifications?.size || newItems[index].specification || "",
          grade: product.specifications?.grade || product.grade || newItems[index].grade || "",
          finish: product.specifications?.finish || product.finish || newItems[index].finish || "",
          size: product.specifications?.size || product.size || newItems[index].size || "",
          thickness: product.specifications?.thickness || product.thickness || newItems[index].thickness || "",
          description: product.description || "",
          hsn_code: product.hsn_code || "",
          unit: product.unit || "pcs",
          rate: product.selling_price || 0
        };
      }
    }

    // Calculate item totals
    const item = newItems[index];
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const vatRate = parseFloat(item.vat_rate) || 0;

    const grossAmount = quantity * rate;
    const discountAmount = item.discount_type === 'percentage' 
      ? (grossAmount * discount / 100) 
      : discount;
    const taxableAmount = grossAmount - discountAmount;
    
    const vatAmountItem = taxableAmount * vatRate / 100;
    const netAmount = taxableAmount + vatAmountItem;

    newItems[index] = {
      ...item,
      taxable_amount: taxableAmount,
      amount: taxableAmount,
      net_amount: netAmount
    };

    setFormData(prev => ({ ...prev, items: newItems }));
    
    // Recalculate totals after a brief delay to ensure state is updated
    setTimeout(calculateTotals, 0);
  };

  const calculateTotals = () => {
    const items = formData.items;
    
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const vatAmount = items.reduce((sum, item) => {
      const rate = parseFloat(item.vat_rate) || 0;
      const taxable = parseFloat(item.taxable_amount) || 0;
      return sum + (taxable * rate / 100);
    }, 0);
    const otherCharges = parseFloat(formData.other_charges) || 0;
    const total = subtotal + vatAmount + otherCharges;

    setFormData(prev => ({
      ...prev,
      subtotal,
      total_quantity: totalQuantity,
      vat_amount: vatAmount,
      total
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.other_charges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.quotation_number.trim()) {
      setError("Quotation number is required");
      return;
    }

    if (!formData.customer_details.name.trim()) {
      setError("Customer name is required");
      return;
    }

    if (formData.items.length === 0) {
      setError("At least one item is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Sanitize payload to backend-expected schema
      const sanitizedItems = (formData.items || []).map((it) => {
        const qty = parseFloat(it.quantity) || 0;
        const rate = parseFloat(it.rate) || 0;
        const discount = parseFloat(it.discount) || 0;
        const vatRate = parseFloat(it.vat_rate) || 0;
        const amount = parseFloat(it.amount) || (qty * rate);
        const netAmount = parseFloat(it.net_amount) || amount + ((amount * vatRate) / 100);
        const specFallback = [it.grade, it.finish, it.size, it.thickness].filter(Boolean).join(' | ');
        const specification = (it.specification && String(it.specification).trim()) || specFallback || '';
        return {
          // Include product_id if present, but name/spec/unit etc are primary
          ...(it.product_id ? { product_id: Number(it.product_id) } : {}),
          name: it.name,
          specification,
          description: it.description || '',
          hsn_code: it.hsn_code || '',
          unit: it.unit || 'pcs',
          quantity: qty,
          rate: rate,
          discount: isNaN(discount) ? 0 : discount,
          discount_type: it.discount_type || 'amount',
          taxable_amount: parseFloat(it.taxable_amount) || amount,
          vat_rate: vatRate,
          amount: amount,
          net_amount: netAmount,
        };
      });

      // Start with original shape to keep backward-compat fields the backend may need
      const dataToSubmit = { ...formData };
      // Normalize and override known fields
      if (formData.customer_id) dataToSubmit.customer_id = Number(formData.customer_id); else delete dataToSubmit.customer_id;
      dataToSubmit.items = sanitizedItems;
      dataToSubmit.quotation_number = formData.quotation_number;
      dataToSubmit.quotation_date = formData.quotation_date;
      if (formData.valid_until) dataToSubmit.valid_until = formData.valid_until; else delete dataToSubmit.valid_until;
      dataToSubmit.delivery_terms = formData.delivery_terms || '';
      dataToSubmit.payment_terms = formData.payment_terms || '';
      dataToSubmit.notes = formData.notes || '';
      dataToSubmit.terms_and_conditions = formData.terms_and_conditions || '';
      dataToSubmit.subtotal = parseFloat(formData.subtotal) || sanitizedItems.reduce((s,i)=>s+(i.amount||0),0);
      dataToSubmit.vat_amount = parseFloat(formData.vat_amount) || 0;
      dataToSubmit.other_charges = parseFloat(formData.other_charges) || 0;
      dataToSubmit.total_quantity = parseFloat(formData.total_quantity) || sanitizedItems.reduce((s,i)=>s+(i.quantity||0),0);
      dataToSubmit.total_weight = parseFloat(formData.total_weight) || 0;
      dataToSubmit.total = parseFloat(formData.total) || (dataToSubmit.subtotal + dataToSubmit.vat_amount + dataToSubmit.other_charges);
      dataToSubmit.status = formData.status || 'draft';
      // Default currency if backend expects it
      dataToSubmit.currency = formData.currency || 'AED';

      if (isEdit) {
        await quotationsAPI.update(id, dataToSubmit);
        setSuccess("Quotation updated successfully");
      } else {
        await quotationsAPI.create(dataToSubmit);
        setSuccess("Quotation created successfully");
      }

      setTimeout(() => {
        navigate("/quotations");
      }, 1500);

    } catch (err) {
      console.error("Error saving quotation:", err);
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const msgs = apiErrors.map((e) => (typeof e === 'string' ? e : (e.message || JSON.stringify(e))));
        setError(msgs.join('\n'));
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Failed to save quotation");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'} p-4`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/quotations")}
            className={`p-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isEdit ? '📝 Edit Quotation' : '📋 New Quotation'}
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isEdit ? 'Update quotation details' : 'Create a new quotation for your customer'}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-teal-600" />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quotation Number *
              </label>
              <input
                type="text"
                value={formData.quotation_number}
                onChange={(e) => setFormData(prev => ({ ...prev, quotation_number: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quotation Date *
              </label>
              <input
                type="date"
                value={formData.quotation_date}
                onChange={(e) => setFormData(prev => ({ ...prev, quotation_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-teal-600" />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Customer Information
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Select Customer
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select a customer or enter manually</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.company && `(${customer.company})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customer_details.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer_details: { ...prev.customer_details, name: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Company
                </label>
                <input
                  type="text"
                  value={formData.customer_details.company}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer_details: { ...prev.customer_details, company: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customer_details.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer_details: { ...prev.customer_details, email: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.customer_details.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer_details: { ...prev.customer_details, phone: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-teal-600" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Items ({formData.items.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No items added yet
              </p>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Click "Add Item" to start building your quotation
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className={`p-4 border rounded-lg ${
                isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                  <div className="lg:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Product
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select product or enter manually</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Grade
                    </label>
                    <select
                      value={item.grade || ""}
                      onChange={(e) => updateItem(index, 'grade', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Grade</option>
                      {STEEL_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Finish
                    </label>
                    <select
                      value={item.finish || ""}
                      onChange={(e) => updateItem(index, 'finish', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Finish</option>
                      {FINISHES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Size
                    </label>
                    <input
                      type="text"
                      value={item.size || ""}
                      onChange={(e) => updateItem(index, 'size', e.target.value)}
                      placeholder="e.g., 1220x2440"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Thickness
                    </label>
                    <input
                      type="text"
                      value={item.thickness || ""}
                      onChange={(e) => updateItem(index, 'thickness', e.target.value)}
                      placeholder="e.g., 1.2mm"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Rate (AED)
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        VAT (%)
                      </label>
                      <input
                        type="number"
                        value={item.vat_rate}
                        onChange={(e) => updateItem(index, 'vat_rate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Total
                        </label>
                        <div className={`px-3 py-2 border rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-300' 
                            : 'bg-gray-100 border-gray-300 text-gray-600'
                        }`}>
                          {formatCurrency(item.net_amount)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Specification
                      </label>
                      <input
                        type="text"
                        value={item.specification}
                        onChange={(e) => updateItem(index, 'specification', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">Kilograms</option>
                        <option value="tons">Tons</option>
                        <option value="meters">Meters</option>
                        <option value="sqm">Square Meters</option>
                        <option value="feet">Feet</option>
                        <option value="sqft">Square Feet</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        HSN Code
                      </label>
                      <input
                        type="text"
                        value={item.hsn_code}
                        onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terms and Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terms */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment as per payment terms
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="e.g., 30 days from invoice date"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Delivery Terms
                </label>
                <input
                  type="text"
                  value={formData.delivery_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_terms: e.target.value }))}
                  placeholder="e.g., FOB Destination"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Payment terms details
                </label>
                <textarea
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} className="text-teal-600" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Summary
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {formatCurrency(formData.subtotal)}
                </span>
              </div>

              {formData.vat_amount > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>VAT:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatCurrency(formData.vat_amount)}
                  </span>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Other Charges
                </label>
                <input
                  type="number"
                  value={formData.other_charges}
                  onChange={(e) => setFormData(prev => ({ ...prev, other_charges: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className={`pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total:
                  </span>
                  <span className={`text-xl font-bold text-teal-600`}>
                    {formatCurrency(formData.total)}
                  </span>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Items:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formData.items.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Quantity:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formData.total_quantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className={`px-6 py-2 border rounded-lg transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save size={16} />
            )}
            {isEdit ? 'Update Quotation' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
