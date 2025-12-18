/**
 * DebitNoteForm.jsx - UAE VAT Compliance
 *
 * Form for creating/editing debit notes (adjustments to vendor bills).
 * Links to original vendor bill and supports line item copying.
 *
 * UX Patterns (Tier 2 - Medium):
 * - Sticky header with blur backdrop
 * - Two-column layout (8+4 split)
 * - Sticky sidebar summary
 * - Accordion for optional sections
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  Package,
  Link2,
  Search,
  ChevronDown,
  Copy,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import debitNoteService from "../../services/debitNoteService";
import vendorBillService from "../../services/vendorBillService";
import { warehouseService } from "../../services/warehouseService";
import { notificationService } from "../../services/notificationService";
import { formatCurrency, formatDateForInput } from "../../utils/invoiceUtils";
import { FormSelect } from "../../components/ui/form-select";
import { SelectItem } from "../../components/ui/select";

// Reason categories
const REASON_CATEGORIES = [
  { value: "PRICE_ADJUSTMENT", label: "Price Adjustment" },
  { value: "QUANTITY_ADJUSTMENT", label: "Quantity Adjustment" },
  { value: "ADDITIONAL_CHARGES", label: "Additional Charges" },
  { value: "SERVICE_CHARGE", label: "Service Charge" },
  { value: "OTHER", label: "Other" },
];

// VAT categories
const VAT_CATEGORIES = [
  { value: "STANDARD", label: "Standard Rate (5%)", rate: 5 },
  { value: "ZERO_RATED", label: "Zero Rated (0%)", rate: 0 },
  { value: "EXEMPT", label: "Exempt", rate: 0 },
  { value: "REVERSE_CHARGE", label: "Reverse Charge", rate: 5 },
];

// Settlement types
const SETTLEMENT_TYPES = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "NET_30", label: "Net 30" },
  { value: "NET_60", label: "Net 60" },
  { value: "NET_90", label: "Net 90" },
  { value: "OFFSET_CREDIT", label: "Offset Credit" },
];

// Currencies
const CURRENCIES = [
  { value: "AED", label: "AED (درهم)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "SAR", label: "SAR (﷼)" },
  { value: "INR", label: "INR (₹)" },
  { value: "CNY", label: "CNY (¥)" },
];

// Approval statuses
const APPROVAL_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

// Empty line item template
const createEmptyItem = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  vendorBillItemId: null,
  productId: null,
  description: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  vatRate: 5,
  vatAmount: 0,
});

const DebitNoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorBillSearching, setVendorBillSearching] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Vendor bill search
  const [vendorBillSearch, setVendorBillSearch] = useState("");
  const [vendorBillResults, setVendorBillResults] = useState([]);
  const [showVendorBillDropdown, setShowVendorBillDropdown] = useState(false);
  const [selectedVendorBill, setSelectedVendorBill] = useState(null);

  // Warehouses (for Phase 2b)
  const [warehouses, setWarehouses] = useState([]);

  // Debit note data state
  const [debitNote, setDebitNote] = useState({
    vendorBillId: null,
    vendorBillNumber: "",
    vendorId: null,
    vendor: null,
    debitNoteNumber: "",
    debitNoteDate: formatDateForInput(new Date()),
    reason: "",
    reasonCategory: "PRICE_ADJUSTMENT",
    vatCategory: "STANDARD",
    isReverseCharge: false,
    subtotal: 0,
    vatAmount: 0,
    totalDebit: 0,
    status: "draft",
    notes: "",
    items: [createEmptyItem()],
    // Phase 2b fields
    settlementType: "IMMEDIATE",
    paymentReference: "",
    settlementDate: "",
    currency: "AED",
    exchangeRate: 1.0,
    amountInBaseCurrency: 0,
    attachmentUrls: [],
    approvalStatus: "PENDING",
    warehouseId: null,
    stockImpact: false,
    modificationReason: "",
    previousAmount: 0,
    version: 1,
  });

  // Load initial data
  useEffect(() => {
    if (isEditMode) {
      loadDebitNote();
    } else {
      loadNextDebitNoteNumber();
      const vendorBillIdParam = searchParams.get("vendorBillId");
      if (vendorBillIdParam) {
        loadVendorBill(vendorBillIdParam);
      }
    }
    loadWarehouses();
  }, [id]);

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      const result = await warehouseService.getAll({ isActive: true });
      setWarehouses(result.data || []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  // Auto-calculate amountInBaseCurrency when totalDebit or exchangeRate changes
  useEffect(() => {
    const amountInBaseCurrency = debitNote.totalDebit * debitNote.exchangeRate;
    setDebitNote((prev) => ({ ...prev, amountInBaseCurrency }));
  }, [debitNote.totalDebit, debitNote.exchangeRate]);

  // Search vendor bills with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vendorBillSearch && vendorBillSearch.length >= 2) {
        searchVendorBills(vendorBillSearch);
      } else {
        setVendorBillResults([]);
        setShowVendorBillDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorBillSearch]);

  const loadDebitNote = async () => {
    try {
      setLoading(true);
      const data = await debitNoteService.getById(id);
      setDebitNote({
        ...data,
        items: data.items?.length > 0 ? data.items : [createEmptyItem()],
      });
      if (data.vendorBillId) {
        const bill = await vendorBillService.getById(data.vendorBillId);
        setSelectedVendorBill(bill);
      }
    } catch (error) {
      console.error("Error loading debit note:", error);
      notificationService.error("Failed to load debit note");
      navigate("/purchases/debit-notes");
    } finally {
      setLoading(false);
    }
  };

  const loadNextDebitNoteNumber = async () => {
    try {
      const response = await debitNoteService.getNextNumber();
      setDebitNote((prev) => ({
        ...prev,
        debitNoteNumber: response.debitNoteNumber || "DN-0001",
      }));
    } catch (error) {
      console.error("Error loading next debit note number:", error);
    }
  };

  const searchVendorBills = async (query) => {
    try {
      setVendorBillSearching(true);
      const results = await vendorBillService.search(query);
      setVendorBillResults(results);
      setShowVendorBillDropdown(results.length > 0);
    } catch (error) {
      console.error("Error searching vendor bills:", error);
      setVendorBillResults([]);
    } finally {
      setVendorBillSearching(false);
    }
  };

  const loadVendorBill = async (billId) => {
    try {
      const bill = await vendorBillService.getById(billId);
      setSelectedVendorBill(bill);
      setDebitNote((prev) => ({
        ...prev,
        vendorBillId: bill.id,
        vendorBillNumber: bill.billNumber,
        vendorId: bill.vendorId,
        vendor: bill.vendorDetails || {
          name: bill.vendorName,
          trn: bill.vendorTrn,
        },
        vatCategory: bill.vatCategory || "STANDARD",
        isReverseCharge: bill.isReverseCharge || false,
      }));
      setVendorBillSearch("");
      setShowVendorBillDropdown(false);
    } catch (error) {
      console.error("Error loading vendor bill:", error);
      notificationService.error("Failed to load vendor bill");
    }
  };

  const handleVendorBillSelect = (bill) => {
    loadVendorBill(bill.id);
  };

  const handleCopyItemsFromBill = () => {
    if (!selectedVendorBill || !selectedVendorBill.items) {
      notificationService.warning("No items to copy from vendor bill");
      return;
    }

    const copiedItems = selectedVendorBill.items.map((item) => ({
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendorBillItemId: item.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      vatRate: item.vatRate || 5,
      vatAmount: item.vatAmount || 0,
    }));

    setDebitNote((prev) => ({ ...prev, items: copiedItems }));
    recalculateTotals(copiedItems);
    notificationService.success("Items copied from vendor bill");
  };

  const handleAddItem = () => {
    setDebitNote((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const handleRemoveItem = (index) => {
    if (debitNote.items.length <= 1) {
      notificationService.warning("At least one item is required");
      return;
    }
    const updatedItems = debitNote.items.filter((_, i) => i !== index);
    setDebitNote((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...debitNote.items];
    const item = { ...updatedItems[index] };
    item[field] = value;

    if (["quantity", "unitPrice", "vatRate"].includes(field)) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 0;
      item.amount = qty * price;
      item.vatAmount = (item.amount * vatRate) / 100;
    }

    updatedItems[index] = item;
    setDebitNote((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0,
    );
    const vatAmount = items.reduce(
      (sum, item) => sum + (parseFloat(item.vatAmount) || 0),
      0,
    );
    const totalDebit = subtotal + vatAmount;
    setDebitNote((prev) => ({ ...prev, subtotal, vatAmount, totalDebit }));
  };

  const validateForm = () => {
    const errors = [];
    if (!debitNote.vendorBillId) errors.push("Please select a vendor bill");
    if (!debitNote.debitNoteNumber)
      errors.push("Debit note number is required");
    if (!debitNote.debitNoteDate) errors.push("Debit note date is required");
    if (!debitNote.reason) errors.push("Reason is required");

    const validItems = debitNote.items.filter(
      (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
    );
    if (validItems.length === 0)
      errors.push("At least one valid line item is required");

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async (status = "draft") => {
    if (!validateForm()) {
      notificationService.error("Please fix the validation errors");
      return;
    }

    try {
      setSaving(true);
      const validItems = debitNote.items.filter(
        (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
      );

      const debitNoteData = { ...debitNote, status, items: validItems };

      if (isEditMode) {
        await debitNoteService.update(id, debitNoteData);
        notificationService.success("Debit note updated successfully");
      } else {
        await debitNoteService.create(debitNoteData);
        notificationService.success("Debit note created successfully");
      }

      navigate("/purchases/debit-notes");
    } catch (error) {
      console.error("Error saving debit note:", error);
      notificationService.error(error.message || "Failed to save debit note");
    } finally {
      setSaving(false);
    }
  };

  // ===================== THEME CLASSES =====================
  const cardBg = isDarkMode ? "bg-[#141a20]" : "bg-white";
  const cardBorder = isDarkMode ? "border-[#2a3640]" : "border-gray-200";
  const inputBg = isDarkMode ? "bg-[#0f151b]" : "bg-white";
  const inputBorder = isDarkMode ? "border-[#2a3640]" : "border-gray-300";
  const textPrimary = isDarkMode ? "text-[#e6edf3]" : "text-gray-900";
  const textMuted = isDarkMode ? "text-[#93a4b4]" : "text-gray-500";
  const accordionBg = isDarkMode ? "bg-[#0f151b]" : "bg-gray-50";
  const inputFocus =
    "focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20";

  // Loading state
  if (loading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDarkMode ? "bg-[#0b0f14]" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4aa3ff] mx-auto mb-3"></div>
          <p className={textMuted}>Loading debit note...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto ${isDarkMode ? "bg-[#0b0f14]" : "bg-gray-50"}`}
    >
      {/* App Container */}
      <div className="max-w-6xl mx-auto p-4">
        <div
          className={`${cardBg} border ${cardBorder} rounded-[18px] overflow-hidden`}
        >
          {/* Sticky Header */}
          <div
            className={`sticky top-0 z-10 backdrop-blur-md ${
              isDarkMode
                ? "bg-[#0f151b]/94 border-b border-[#2a3640]"
                : "bg-white/94 border-b border-gray-200"
            } px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/purchases/debit-notes")}
                  className={`p-2 rounded-xl transition-colors ${
                    isDarkMode
                      ? "hover:bg-[#141a20] text-[#93a4b4]"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className={`text-lg font-extrabold ${textPrimary}`}>
                    {isEditMode ? "Edit Debit Note" : "New Debit Note"}
                  </h1>
                  <p className={`text-xs ${textMuted}`}>
                    {isEditMode
                      ? `Editing ${debitNote.debitNoteNumber}`
                      : "Vendor bill adjustment"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs border ${
                    isDarkMode
                      ? "border-amber-500/30 bg-amber-500/12 text-amber-400"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {debitNote.status === "approved" ? "Approved" : "Draft"}
                </span>
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ${
                    isDarkMode
                      ? "border-[#2a3640] hover:border-[#4aa3ff] text-[#93a4b4]"
                      : "border-gray-300 hover:border-teal-500 text-gray-600"
                  } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave("approved")}
                  disabled={saving}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                    isDarkMode
                      ? "bg-[#4aa3ff] text-[#001018] hover:bg-[#5bb2ff]"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save & Approve"}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-3 p-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div
                className={`col-span-12 p-4 rounded-[14px] border ${
                  isDarkMode
                    ? "bg-red-900/20 border-red-600/50 text-red-200"
                    : "bg-red-50 border-red-300 text-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={isDarkMode ? "text-red-400" : "text-red-600"}
                    size={20}
                  />
                  <div>
                    <h4 className="font-bold text-sm mb-1.5">
                      Please fix the following errors:
                    </h4>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* LEFT COLUMN: Main Form */}
            <div className="col-span-12 lg:col-span-8 space-y-3">
              {/* Section 1: Linked Vendor Bill */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div
                    className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}
                  >
                    <Link2 className="h-4 w-4" />
                    Linked Vendor Bill <span className="text-red-500">*</span>
                  </div>
                  <div className={`text-xs ${textMuted}`}>
                    Select the vendor bill this debit note adjusts
                  </div>
                </div>

                {!selectedVendorBill ? (
                  <div className="relative">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textMuted}`}
                      />
                      <input
                        type="text"
                        placeholder="Search vendor bill by number or vendor name..."
                        value={vendorBillSearch}
                        onChange={(e) => setVendorBillSearch(e.target.value)}
                        className={`w-full pl-9 pr-9 py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                      />
                      {vendorBillSearching && (
                        <Loader2
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin ${textMuted}`}
                        />
                      )}
                    </div>

                    {/* Vendor Bill Dropdown */}
                    {showVendorBillDropdown && vendorBillResults.length > 0 && (
                      <div
                        className={`absolute z-10 w-full mt-1 rounded-xl shadow-lg border max-h-60 overflow-y-auto ${cardBg} ${cardBorder}`}
                      >
                        {vendorBillResults.map((bill) => (
                          <button
                            key={bill.id}
                            type="button"
                            onClick={() => handleVendorBillSelect(bill)}
                            className={`w-full px-3 py-2.5 text-left transition-colors border-b last:border-b-0 ${cardBorder} ${
                              isDarkMode
                                ? "hover:bg-[#1a2027]"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div
                                  className={`text-sm font-medium ${textPrimary}`}
                                >
                                  {bill.billNumber}
                                </div>
                                <div className={`text-xs ${textMuted}`}>
                                  {bill.vendorName}
                                </div>
                              </div>
                              <div
                                className={`text-sm font-mono ${isDarkMode ? "text-[#4aa3ff]" : "text-teal-600"}`}
                              >
                                {formatCurrency(bill.total)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-[14px] border ${
                      isDarkMode
                        ? "border-[#4aa3ff]/35 bg-[#4aa3ff]/10"
                        : "border-teal-300 bg-teal-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`text-sm font-medium ${textPrimary}`}>
                          {selectedVendorBill.billNumber}
                        </div>
                        <div className={`text-xs ${textMuted}`}>
                          Vendor: {selectedVendorBill.vendorName}
                        </div>
                        <div
                          className={`text-xs font-mono ${textMuted} mt-0.5`}
                        >
                          Total: {formatCurrency(selectedVendorBill.total)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyItemsFromBill}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl border transition-colors ${
                            isDarkMode
                              ? "border-[#4aa3ff]/50 bg-[#4aa3ff]/20 text-[#4aa3ff] hover:bg-[#4aa3ff]/30"
                              : "border-teal-400 bg-teal-100 text-teal-700 hover:bg-teal-200"
                          }`}
                        >
                          <Copy className="h-3 w-3" />
                          Copy Items
                        </button>
                        {!isEditMode && (
                          <button
                            onClick={() => {
                              setSelectedVendorBill(null);
                              setDebitNote((prev) => ({
                                ...prev,
                                vendorBillId: null,
                                vendorBillNumber: "",
                                vendorId: null,
                                vendor: null,
                              }));
                            }}
                            className={`px-2.5 py-1 text-xs rounded-xl border transition-colors ${
                              isDarkMode
                                ? "border-[#2a3640] bg-[#0f151b] hover:border-[#4aa3ff]"
                                : "border-gray-300 bg-white hover:border-teal-500"
                            }`}
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Debit Note Details */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div
                    className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}
                  >
                    <FileText className="h-4 w-4" />
                    Debit Note Details
                  </div>
                  <div className={`text-xs ${textMuted}`}>
                    Enter debit note information
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Debit Note Number */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Debit Note Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={debitNote.debitNoteNumber}
                      onChange={(e) =>
                        setDebitNote((prev) => ({
                          ...prev,
                          debitNoteNumber: e.target.value,
                        }))
                      }
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                    />
                  </div>

                  {/* Date */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={debitNote.debitNoteDate}
                      onChange={(e) =>
                        setDebitNote((prev) => ({
                          ...prev,
                          debitNoteDate: e.target.value,
                        }))
                      }
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                    />
                  </div>

                  {/* Reason Category */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Reason Category
                    </label>
                    <FormSelect
                      value={debitNote.reasonCategory}
                      onValueChange={(value) =>
                        setDebitNote((prev) => ({
                          ...prev,
                          reasonCategory: value,
                        }))
                      }
                      showValidation={false}
                    >
                      {REASON_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  </div>

                  {/* VAT Category */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      VAT Category
                    </label>
                    <FormSelect
                      value={debitNote.vatCategory}
                      onValueChange={(value) =>
                        setDebitNote((prev) => ({
                          ...prev,
                          vatCategory: value,
                        }))
                      }
                      showValidation={false}
                    >
                      {VAT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  </div>

                  {/* Reason */}
                  <div className="col-span-12 md:col-span-8">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={debitNote.reason}
                      onChange={(e) =>
                        setDebitNote((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="Describe the reason for this debit note..."
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Line Items */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div
                      className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}
                    >
                      <Package className="h-4 w-4" />
                      Line Items
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Add items to adjust
                    </div>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl font-bold transition-colors ${
                      isDarkMode
                        ? "bg-[#4aa3ff] text-[#001018] hover:bg-[#5bb2ff]"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {debitNote.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-[14px] border ${cardBorder}`}
                    >
                      <div className="grid grid-cols-12 gap-2">
                        {/* Description */}
                        <div className="col-span-12 md:col-span-5">
                          <label className={`block text-xs ${textMuted} mb-1`}>
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Item description"
                            className={`w-full py-2 px-2.5 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-4 md:col-span-2">
                          <label className={`block text-xs ${textMuted} mb-1`}>
                            Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`w-full py-2 px-2.5 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-4 md:col-span-2">
                          <label className={`block text-xs ${textMuted} mb-1`}>
                            Unit Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`w-full py-2 px-2.5 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                          />
                        </div>

                        {/* Amount */}
                        <div className="col-span-3 md:col-span-2">
                          <label className={`block text-xs ${textMuted} mb-1`}>
                            Amount
                          </label>
                          <input
                            type="text"
                            value={formatCurrency(item.amount)}
                            disabled
                            className={`w-full py-2 px-2.5 rounded-xl border text-sm font-mono ${
                              isDarkMode
                                ? "bg-[#0a0f14] border-[#2a3640] text-[#93a4b4]"
                                : "bg-gray-100 border-gray-300 text-gray-500"
                            }`}
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="col-span-1 flex items-end justify-end">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className={`p-2 rounded-xl transition-colors ${
                              isDarkMode
                                ? "hover:bg-red-900/30 text-red-400"
                                : "hover:bg-red-100 text-red-600"
                            }`}
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Settlement & Payment Accordion */}
              <details
                open
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Settlement & Payment
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Payment terms and settlement details
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Settlement Type
                      </label>
                      <FormSelect
                        value={debitNote.settlementType}
                        onValueChange={(value) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            settlementType: value,
                          }))
                        }
                        showValidation={false}
                      >
                        {SETTLEMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>

                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Payment Reference
                      </label>
                      <input
                        type="text"
                        value={debitNote.paymentReference}
                        onChange={(e) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            paymentReference: e.target.value,
                          }))
                        }
                        placeholder="Payment ref #"
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                      />
                    </div>

                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Settlement Date
                      </label>
                      <input
                        type="date"
                        value={debitNote.settlementDate}
                        onChange={(e) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            settlementDate: e.target.value,
                          }))
                        }
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                      />
                    </div>
                  </div>
                </div>
              </details>

              {/* Section 5: Multi-Currency Support Accordion */}
              <details
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Multi-Currency Support
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Currency and exchange rate details
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Currency
                      </label>
                      <FormSelect
                        value={debitNote.currency}
                        onValueChange={(value) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            currency: value,
                          }))
                        }
                        showValidation={false}
                      >
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>

                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Exchange Rate
                      </label>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={debitNote.exchangeRate}
                        onChange={(e) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            exchangeRate: parseFloat(e.target.value) || 1.0,
                          }))
                        }
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Amount in Base Currency (AED)
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(debitNote.amountInBaseCurrency)}
                        disabled
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm font-mono ${
                          isDarkMode
                            ? "bg-[#0a0f14] border-[#2a3640] text-[#93a4b4]"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        }`}
                      />
                      <div className={`text-xs ${textMuted} mt-1`}>
                        Auto-calculated: {debitNote.totalDebit} × {debitNote.exchangeRate}
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              {/* Section 6: Document Management Accordion */}
              <details
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Document Management
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Attachments and approval status
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-8">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Attachment URLs (comma-separated)
                      </label>
                      <textarea
                        value={debitNote.attachmentUrls.join(", ")}
                        onChange={(e) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            attachmentUrls: e.target.value
                              .split(",")
                              .map((url) => url.trim())
                              .filter(Boolean),
                          }))
                        }
                        rows={2}
                        placeholder="https://example.com/doc1.pdf, https://example.com/doc2.pdf"
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Approval Status
                      </label>
                      <FormSelect
                        value={debitNote.approvalStatus}
                        onValueChange={(value) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            approvalStatus: value,
                          }))
                        }
                        showValidation={false}
                      >
                        {APPROVAL_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>
                  </div>
                </div>
              </details>

              {/* Section 7: Warehouse & Stock Impact Accordion */}
              <details
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Warehouse & Stock Impact
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Optional inventory impact tracking
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={debitNote.stockImpact}
                          onChange={(e) =>
                            setDebitNote((prev) => ({
                              ...prev,
                              stockImpact: e.target.checked,
                              warehouseId: e.target.checked ? prev.warehouseId : null,
                            }))
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className={`text-sm ${textPrimary}`}>
                          This debit note affects inventory
                        </span>
                      </label>
                    </div>

                    {debitNote.stockImpact && (
                      <div className="col-span-12 md:col-span-6">
                        <label className={`block text-xs ${textMuted} mb-1.5`}>
                          Warehouse
                        </label>
                        <FormSelect
                          value={debitNote.warehouseId?.toString() || ""}
                          onValueChange={(value) =>
                            setDebitNote((prev) => ({
                              ...prev,
                              warehouseId: value ? parseInt(value) : null,
                            }))
                          }
                          showValidation={false}
                        >
                          <SelectItem value="">Select warehouse...</SelectItem>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id.toString()}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </FormSelect>
                      </div>
                    )}
                  </div>
                </div>
              </details>

              {/* Section 8: Audit Trail Accordion */}
              <details
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Audit Trail
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Version history and modification tracking
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Version
                      </label>
                      <input
                        type="text"
                        value={debitNote.version}
                        disabled
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm font-mono ${
                          isDarkMode
                            ? "bg-[#0a0f14] border-[#2a3640] text-[#93a4b4]"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        }`}
                      />
                    </div>

                    <div className="col-span-6 md:col-span-4">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Previous Amount
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(debitNote.previousAmount)}
                        disabled
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm font-mono ${
                          isDarkMode
                            ? "bg-[#0a0f14] border-[#2a3640] text-[#93a4b4]"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        }`}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-12">
                      <label className={`block text-xs ${textMuted} mb-1.5`}>
                        Modification Reason {debitNote.version > 1 && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={debitNote.modificationReason}
                        onChange={(e) =>
                          setDebitNote((prev) => ({
                            ...prev,
                            modificationReason: e.target.value,
                          }))
                        }
                        rows={2}
                        disabled={debitNote.version === 1}
                        placeholder={
                          debitNote.version > 1
                            ? "Explain what was changed and why..."
                            : "Version 1 - no modification reason required"
                        }
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} ${
                          debitNote.version === 1 ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </details>

              {/* Section 9: Notes Accordion */}
              <details
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Notes
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Internal notes for this debit note
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <textarea
                    value={debitNote.notes}
                    onChange={(e) =>
                      setDebitNote((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Internal notes about this debit note..."
                    className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                  />
                </div>
              </details>
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-3">
                {/* Summary */}
                <div
                  className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}
                >
                  <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>
                    Summary
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Subtotal:</span>
                      <span className={`font-mono ${textPrimary}`}>
                        {formatCurrency(debitNote.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>VAT:</span>
                      <span className={`font-mono ${textPrimary}`}>
                        {formatCurrency(debitNote.vatAmount)}
                      </span>
                    </div>
                    <div className={`h-px ${cardBorder} my-2`}></div>
                    <div className="flex justify-between">
                      <span className={`font-bold ${textPrimary}`}>
                        Total Debit:
                      </span>
                      <span
                        className={`font-bold font-mono ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
                      >
                        +{formatCurrency(debitNote.totalDebit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor Details */}
                {debitNote.vendor && (
                  <div
                    className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}
                  >
                    <div
                      className={`text-sm font-extrabold ${textPrimary} mb-3`}
                    >
                      Vendor
                    </div>
                    <div className="space-y-1">
                      <div className={`text-sm ${textPrimary}`}>
                        {debitNote.vendor.name}
                      </div>
                      {debitNote.vendor.trn && (
                        <div className={`text-xs font-mono ${textMuted}`}>
                          TRN: {debitNote.vendor.trn}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Debit Note Info */}
                <div
                  className={`p-3 rounded-[14px] border ${
                    isDarkMode
                      ? "bg-amber-900/20 border-amber-700/50"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div
                    className={`text-xs font-bold mb-1 ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}
                  >
                    Debit Note Effect
                  </div>
                  <p
                    className={`text-xs ${isDarkMode ? "text-amber-300/80" : "text-amber-600"}`}
                  >
                    This debit note will increase the amount owed to the vendor.
                    The adjustment will be reflected in your accounts payable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebitNoteForm;
