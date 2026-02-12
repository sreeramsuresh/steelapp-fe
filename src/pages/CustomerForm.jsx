/**
 * CustomerForm Component
 *
 * Manages customer details including Phase 5 credit management fields
 * Features:
 * - Basic customer information (name, email, phone, address)
 * - Tax/VAT compliance (VAT number, TRN)
 * - Credit management with CustomerCreditPanel integration
 *
 * UX Patterns (Tier 2 - Medium):
 * - Sticky header with blur backdrop
 * - Two-column layout (8+4 split)
 * - Sticky sidebar with summary
 * - Accordion for optional sections
 */

import { AlertCircle, ArrowLeft, Building2, ChevronDown, CreditCard, Info, Loader2, Save, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerCreditPanel from "../components/credit/CustomerCreditPanel";
import TRNInput from "../components/TRNInput";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useTheme } from "../contexts/ThemeContext";
import { customerService } from "../services/customerService";
import { notificationService } from "../services/notificationService";
import { formatDateDMY } from "../utils/invoiceUtils";

/**
 * ISO 3166-1 alpha-2 country codes for address validation
 * Used to enforce VAT/compliance standards: all addresses must use ISO alpha-2 format
 * Example: AE (UAE), IN (India), CN (China), not "UAE", "India", "China"
 *
 * Pattern copied from SupplierForm.jsx (lines 90-100)
 */
const VALID_ISO_COUNTRY_CODES = new Set([
  "AE",
  "AF",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW",
]);

const CustomerForm = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    company: "",
    email: "",
    phone: "",
    // Address fields (structured - matches supplier pattern)
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "AE", // Default to UAE (ISO alpha-2)
    vatNumber: "",
    trn: "",
    creditLimit: 0,
    paymentTerms: "",
    customerCode: "",
    dsoValue: 0,
    creditUtilization: 0,
  });

  // Form Errors
  const [errors, setErrors] = useState({});

  // Credit Management State
  const [creditData, setCreditData] = useState({
    creditUsed: 0,
    creditAvailable: 0,
    creditScore: 0,
    creditGrade: "A",
    dsoDays: 0,
    agingCurrent: 0,
    aging1To30: 0,
    aging31To60: 0,
    aging61To90: 0,
    aging90Plus: 0,
    lastPaymentDate: null,
    creditReviewDate: null,
    lastCreditUpdated: null,
  });

  // UI State
  const [loading, setLoading] = useState(!!customerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(!customerId);

  // Modals
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const customer = await customerService.getCustomerById(customerId);

      // Parse address field if it's a JSON string (matches supplier pattern)
      const parseAddress = (addressData) => {
        if (!addressData)
          return {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "AE",
          };
        if (typeof addressData === "string") {
          try {
            return JSON.parse(addressData);
          } catch {
            return {
              street: addressData,
              city: "",
              state: "",
              postalCode: "",
              country: "AE",
            };
          }
        }
        return addressData;
      };

      const addressParsed = parseAddress(customer.address);

      setFormData({
        id: customer.id || "",
        name: customer.name || "",
        company: customer.company || "",
        email: customer.email || "",
        phone: customer.phone || "",
        // Structured address fields
        street: addressParsed.street || "",
        city: customer.city || addressParsed.city || "", // Prioritize generated column
        state: addressParsed.state || "",
        postalCode: addressParsed.postalCode || "",
        country: customer.country || addressParsed.country || "AE", // Prioritize generated column
        vatNumber: customer.vatNumber || "",
        trn: customer.trn || "",
        creditLimit: customer.creditLimit || 0,
        paymentTerms: customer.paymentTerms || "",
        customerCode: customer.customerCode || "",
        dsoValue: customer.dsoValue || 0,
        creditUtilization: customer.creditUtilization || 0,
      });

      setCreditData({
        creditUsed: customer.creditUsed || 0,
        creditAvailable: customer.creditAvailable || 0,
        creditScore: customer.creditScore || 0,
        creditGrade: customer.creditGrade || "A",
        dsoDays: customer.dsoDay || customer.dsoDays || 0,
        agingCurrent: customer.agingCurrent || 0,
        aging1To30: customer.aging1To30 || 0,
        aging31To60: customer.aging31To60 || 0,
        aging61To90: customer.aging61To90 || 0,
        aging90Plus: customer.aging90Plus || 0,
        lastPaymentDate: customer.lastPaymentDate || null,
        creditReviewDate: customer.creditReviewDate || null,
        lastCreditUpdated: customer.lastCreditUpdated || null,
      });
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Fetch customer data if editing
  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId, fetchCustomer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const newErrors = {};

      if (!formData.name.trim()) {
        newErrors.name = "Customer name is required";
      }

      // Address validation - Country is required and must be ISO alpha-2 format (VAT compliance)
      if (!formData.country?.trim()) {
        newErrors.country = "Country is required (ISO alpha-2 code)";
      } else {
        const countryCode = formData.country.trim().toUpperCase();
        if (!VALID_ISO_COUNTRY_CODES.has(countryCode)) {
          newErrors.country = `Country must be ISO alpha-2 code (e.g., AE for UAE, IN for India, CN for China). "${formData.country}" is invalid.`;
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setError(Object.values(newErrors)[0]);
        return;
      }

      setErrors({});

      // Extract address fields from formData
      const { street, city, state, postalCode, country, ...otherFields } = formData;

      const payload = {
        ...otherFields,
        // Structure address as JSON string (API Gateway will parse it)
        address: JSON.stringify({
          street: street || "",
          city: city || "",
          state: state || "",
          postal_code: postalCode || "",
          country: country || "AE",
        }),
        vat_number: formData.vatNumber,
        trn: formData.trn,
        credit_limit: parseFloat(formData.creditLimit) || 0,
        payment_terms: formData.paymentTerms,
        customer_code: formData.customerCode,
        dso_value: parseFloat(formData.dsoValue) || 0,
        credit_utilization: parseFloat(formData.creditUtilization) || 0,
      };

      if (customerId) {
        await customerService.updateCustomer(customerId, payload);
      } else {
        await customerService.createCustomer(payload);
      }

      notificationService.success(customerId ? "Customer updated successfully" : "Customer created successfully");
      navigate("/app/payables");
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCreditLimit = async ({ customerId: cId, newLimit, reason }) => {
    try {
      setSaving(true);
      setError("");

      await customerService.updateCreditLimit(cId, {
        credit_limit: parseFloat(newLimit),
        review_reason: reason,
      });

      notificationService.success("Credit limit updated successfully");
      setFormData((prev) => ({ ...prev, creditLimit: newLimit }));

      if (customerId) {
        fetchCustomer();
      }
    } catch (err) {
      console.error("Error updating credit limit:", err);
      setError("Failed to update credit limit");
      notificationService.error("Failed to update credit limit");
    } finally {
      setSaving(false);
    }
  };

  const handleViewAging = () => {
    setIsAgingModalOpen(true);
  };

  const handleViewPaymentHistory = async () => {
    try {
      const history = await customerService.getPaymentHistory(customerId);
      setPaymentHistory(history || []);
      setIsPaymentHistoryModalOpen(true);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      notificationService.error("Failed to load payment history");
    }
  };

  // Combined customer data for display
  const customerForDisplay = useMemo(
    () => ({
      id: formData.id,
      name: formData.name,
      creditLimit: formData.creditLimit,
      ...creditData,
    }),
    [formData, creditData]
  );

  // ===================== THEME CLASSES =====================
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = isDarkMode ? "border-gray-700" : "border-gray-200";
  const inputBg = isDarkMode ? "bg-gray-900" : "bg-white";
  const inputBorder = isDarkMode ? "border-gray-700" : "border-gray-300";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const placeholderCls = isDarkMode ? "placeholder:text-gray-400" : "placeholder:text-gray-500";
  const accordionBg = isDarkMode ? "bg-gray-900" : "bg-gray-50";
  const inputFocus = "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

  // Loading state
  if (loading && customerId) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto mb-3"></div>
          <p className={textMuted}>Loading customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? "bg-gray-950" : "bg-gray-50"}`} data-testid="customer-form">
      {/* App Container */}
      <div className="max-w-6xl mx-auto p-4">
        <div className={`${cardBg} border ${cardBorder} rounded-[18px] overflow-hidden`}>
          {/* Sticky Header */}
          <div
            className={`sticky top-0 z-10 backdrop-blur-md ${
              isDarkMode ? "bg-gray-900/94 border-b border-gray-700" : "bg-white/94 border-b border-gray-200"
            } px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/app/payables")}
                  className={`p-2 rounded-xl transition-colors ${
                    isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className={`text-lg font-extrabold ${textPrimary}`}>
                    {customerId ? "Edit Customer" : "New Customer"}
                  </h1>
                  <p className={`text-xs ${textMuted}`}>
                    {customerId ? "Update customer details" : "Add new customer to system"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {customerId && (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      isEditMode
                        ? isDarkMode
                          ? "border-red-500/50 bg-red-500/12 text-red-400"
                          : "border-red-200 bg-red-50 text-red-700"
                        : isDarkMode
                          ? "border-teal-500/50 bg-teal-500/12 text-teal-400"
                          : "border-teal-200 bg-teal-50 text-teal-700"
                    }`}
                  >
                    {isEditMode ? "Cancel Edit" : "Edit"}
                  </button>
                )}
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                      isDarkMode
                        ? "bg-teal-500 text-white hover:bg-teal-400"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                    data-testid="save-button"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : customerId ? "Update" : "Create"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-3 p-4">
            {/* Error Alert */}
            {error && (
              <div
                className={`col-span-12 p-4 rounded-[14px] border ${
                  isDarkMode ? "bg-red-900/20 border-red-600/50 text-red-200" : "bg-red-50 border-red-300 text-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className={isDarkMode ? "text-red-400" : "text-red-600"} size={20} />
                  <div>
                    <h4 className="font-bold text-sm">Error</h4>
                    <p className="text-xs">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* LEFT COLUMN: Main Form */}
            <div className="col-span-12 lg:col-span-8 space-y-3">
              {/* Section 1: Basic Information */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}>
                    <User className="h-4 w-4" />
                    Basic Information
                  </div>
                  <div className={`text-xs ${textMuted}`}>Customer identity and contact details</div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Customer Name */}
                  <div className="col-span-12 md:col-span-6">
                    <label htmlFor="customer-name" className={`block text-xs ${textMuted} mb-1.5`}>
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="e.g., ABC Trading Company"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      data-testid="customer-name"
                    />
                  </div>

                  {/* Company Name */}
                  <div className="col-span-12 md:col-span-6">
                    <label htmlFor="customer-company" className={`block text-xs ${textMuted} mb-1.5`}>
                      Company Name
                    </label>
                    <input
                      id="customer-company"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="Legal company name"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      data-testid="customer-company"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-12 md:col-span-6">
                    <label htmlFor="customer-email" className={`block text-xs ${textMuted} mb-1.5`}>
                      Email
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="customer@example.com"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      data-testid="customer-email"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-span-12 md:col-span-6">
                    <label htmlFor="customer-phone" className={`block text-xs ${textMuted} mb-1.5`}>
                      Phone
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="+971 1 234 5678"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      data-testid="customer-phone"
                    />
                  </div>

                  {/* Customer Code */}
                  <div className="col-span-6 md:col-span-4">
                    <label htmlFor="customer-code" className={`block text-xs ${textMuted} mb-1.5`}>
                      Customer Code
                    </label>
                    <input
                      id="customer-code"
                      type="text"
                      name="customerCode"
                      value={formData.customerCode}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="Unique code"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* Payment Terms */}
                  <div className="col-span-6 md:col-span-4">
                    <label htmlFor="customer-payment-terms" className={`block text-xs ${textMuted} mb-1.5`}>
                      Payment Terms
                    </label>
                    <input
                      id="customer-payment-terms"
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="e.g., Net 30"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tax Compliance */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}>
                    <Building2 className="h-4 w-4" />
                    Tax & VAT Compliance
                  </div>
                  <div className={`text-xs ${textMuted}`}>UAE Federal Decree-Law No. 8 of 2017</div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* VAT Number */}
                  <div className="col-span-12 md:col-span-6">
                    <label htmlFor="customer-vat-number" className={`block text-xs ${textMuted} mb-1.5`}>
                      VAT Number
                    </label>
                    <input
                      id="customer-vat-number"
                      type="text"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="123456789012345"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      data-testid="customer-vat-number"
                    />
                  </div>

                  {/* TRN */}
                  <div className="col-span-12 md:col-span-6">
                    <TRNInput
                      value={formData.trn}
                      onChange={(value) => setFormData((prev) => ({ ...prev, trn: value }))}
                      disabled={!isEditMode}
                      label="Tax Registration Number (TRN)"
                      required={false}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Address Accordion */}
              <details open className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>Address</div>
                    <div className={`text-xs ${textMuted}`}>Physical business address (structured format)</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Street Address */}
                    <div className="md:col-span-2">
                      <label htmlFor="customer-street" className={`block text-xs font-medium ${textMuted} mb-1.5`}>
                        Street Address
                      </label>
                      <input
                        id="customer-street"
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        disabled={!isEditMode}
                        placeholder="Street address"
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label htmlFor="customer-city" className={`block text-xs font-medium ${textMuted} mb-1.5`}>
                        City
                      </label>
                      <input
                        id="customer-city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!isEditMode}
                        placeholder="City"
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                        data-testid="customer-city"
                      />
                    </div>

                    {/* State/Province */}
                    <div>
                      <label htmlFor="customer-state" className={`block text-xs font-medium ${textMuted} mb-1.5`}>
                        State/Province
                      </label>
                      <input
                        id="customer-state"
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={!isEditMode}
                        placeholder="State or province"
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label htmlFor="customer-postal-code" className={`block text-xs font-medium ${textMuted} mb-1.5`}>
                        Postal Code
                      </label>
                      <input
                        id="customer-postal-code"
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        disabled={!isEditMode}
                        placeholder="Postal code"
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50`}
                      />
                    </div>

                    {/* Country (ISO alpha-2) */}
                    <div>
                      <label htmlFor="customer-country" className={`block text-xs font-medium ${textMuted} mb-1.5`}>
                        Country
                        <span className="text-red-500 ml-1">*</span>
                        <span className="text-xs text-gray-500 ml-1">(ISO alpha-2 code)</span>
                      </label>
                      <input
                        id="customer-country"
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={!isEditMode}
                        placeholder="e.g., AE (UAE), IN (India), CN (China)"
                        maxLength={2}
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} disabled:opacity-50 ${errors.country ? "border-red-500" : ""}`}
                      />
                      {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                      {!errors.country && formData.country && (
                        <p className="text-green-500 text-sm mt-1">✓ Valid ISO country code</p>
                      )}
                    </div>
                  </div>
                </div>
              </details>

              {/* Section 4: Credit Management Accordion */}
              <details open className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`h-4 w-4 ${textMuted}`} />
                    <div>
                      <div className={`text-sm font-bold ${textPrimary}`}>Credit Management</div>
                      <div className={`text-xs ${textMuted}`}>Credit limits, utilization, and DSO</div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                </summary>
                <div className={`p-3 border-t ${cardBorder} space-y-3`}>
                  {/* Credit Limit Input */}
                  {isEditMode && (
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6 md:col-span-4">
                        <label htmlFor="customer-credit-limit" className={`block text-xs ${textMuted} mb-1.5`}>
                          Credit Limit (AED)
                        </label>
                        <input
                          id="customer-credit-limit"
                          type="number"
                          name="creditLimit"
                          value={formData.creditLimit}
                          onChange={handleInputChange}
                          step="100"
                          min="0"
                          placeholder="0"
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-4">
                        <label htmlFor="customer-dso-value" className={`block text-xs ${textMuted} mb-1.5`}>
                          DSO Value
                        </label>
                        <input
                          id="customer-dso-value"
                          type="number"
                          name="dsoValue"
                          value={formData.dsoValue}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-4">
                        <label htmlFor="customer-credit-util" className={`block text-xs ${textMuted} mb-1.5`}>
                          Credit Utilization (%)
                        </label>
                        <input
                          id="customer-credit-util"
                          type="number"
                          name="creditUtilization"
                          value={formData.creditUtilization}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* CustomerCreditPanel Component */}
                  {customerId && (
                    <CustomerCreditPanel
                      customer={customerForDisplay}
                      onUpdateCreditLimit={handleUpdateCreditLimit}
                      onViewAging={handleViewAging}
                      onViewPaymentHistory={handleViewPaymentHistory}
                      readOnly={!isEditMode}
                    />
                  )}

                  {!customerId && (
                    <div
                      className={`p-3 rounded-xl text-center ${
                        isDarkMode ? "bg-gray-950 text-gray-400" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <p className="text-xs">Save the customer first to view credit management</p>
                    </div>
                  )}
                </div>
              </details>
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-3">
                {/* Customer Summary */}
                <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                  <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>Customer Summary</div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Name:</span>
                      <span className={`font-medium ${textPrimary}`}>{formData.name || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Company:</span>
                      <span className={textPrimary}>{formData.company || "-"}</span>
                    </div>
                    {formData.trn && (
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>TRN:</span>
                        <span className={`font-mono ${textPrimary}`}>{formData.trn}</span>
                      </div>
                    )}
                    <div className={`h-px ${cardBorder} my-2`}></div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Credit Limit:</span>
                      <span className={`font-mono font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                        AED {parseFloat(formData.creditLimit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credit Grade Card */}
                {customerId && (
                  <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                    <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>Credit Status</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-xs ${textMuted}`}>Credit Grade</div>
                        <div
                          className={`text-2xl font-extrabold ${
                            creditData.creditGrade === "A"
                              ? "text-green-500"
                              : creditData.creditGrade === "B"
                                ? "text-green-400"
                                : creditData.creditGrade === "C"
                                  ? "text-yellow-500"
                                  : creditData.creditGrade === "D"
                                    ? "text-orange-500"
                                    : "text-red-500"
                          }`}
                        >
                          {creditData.creditGrade}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${textMuted}`}>DSO Days</div>
                        <div className={`text-xl font-bold font-mono ${textPrimary}`}>{creditData.dsoDays}</div>
                      </div>
                    </div>
                    <div
                      className="mt-3 pt-3 border-t border-dashed"
                      style={{
                        borderColor: isDarkMode ? "#2a3640" : "#e5e7eb",
                      }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>Credit Used:</span>
                        <span className={`font-mono ${textPrimary}`}>AED {creditData.creditUsed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={textMuted}>Available:</span>
                        <span className={`font-mono ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                          AED {creditData.creditAvailable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Card */}
                <div
                  className={`p-3 rounded-[14px] border ${
                    isDarkMode ? "bg-teal-500/10 border-teal-500/30" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Info className={`h-4 w-4 mt-0.5 ${isDarkMode ? "text-teal-400" : "text-blue-600"}`} />
                    <div>
                      <div className={`text-xs font-bold ${isDarkMode ? "text-teal-400" : "text-blue-700"}`}>
                        Credit Management
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-blue-600"}`}>
                        Credit grades (A-E) are calculated from DSO and payment history. Lower DSO indicates faster
                        payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aging Analysis Modal */}
      <Dialog open={isAgingModalOpen} onOpenChange={setIsAgingModalOpen}>
        <DialogContent className={isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={textPrimary}>Aging Analysis - {formData.name}</DialogTitle>
            <DialogDescription className={textMuted}>Invoice aging breakdown as of today</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {[
              {
                label: "Current (0 days)",
                value: creditData.agingCurrent,
                color: "text-green-500",
              },
              {
                label: "1-30 days overdue",
                value: creditData.aging1To30,
                color: "text-yellow-500",
              },
              {
                label: "31-60 days overdue",
                value: creditData.aging31To60,
                color: "text-orange-500",
              },
              {
                label: "61-90 days overdue",
                value: creditData.aging61To90,
                color: "text-orange-600",
              },
              {
                label: "90+ days overdue",
                value: creditData.aging90Plus,
                color: "text-red-500",
              },
            ].map((bucket, idx) => (
              <div key={bucket.id || bucket.name || `bucket-${idx}`} className="flex items-center justify-between">
                <span className={textMuted}>{bucket.label}</span>
                <span className={`font-mono font-bold ${bucket.color}`}>
                  AED{" "}
                  {bucket.value.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
            <div className={`border-t pt-3 flex items-center justify-between font-bold ${cardBorder}`}>
              <span className={textPrimary}>Total Outstanding</span>
              <span className={`font-mono ${textPrimary}`}>
                AED{" "}
                {(
                  creditData.agingCurrent +
                  creditData.aging1To30 +
                  creditData.aging31To60 +
                  creditData.aging61To90 +
                  creditData.aging90Plus
                ).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={isPaymentHistoryModalOpen} onOpenChange={setIsPaymentHistoryModalOpen}>
        <DialogContent className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"} max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={textPrimary}>Payment History - {formData.name}</DialogTitle>
            <DialogDescription className={textMuted}>Recent payments received</DialogDescription>
          </DialogHeader>

          <div className={`rounded-xl border overflow-hidden ${cardBorder}`}>
            <table className="min-w-full divide-y" style={{ borderColor: isDarkMode ? "#2a3640" : "#e5e7eb" }}>
              <thead className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                <tr>
                  <th className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}>Date</th>
                  <th className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}>Amount (AED)</th>
                  <th className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}>Reference</th>
                  <th className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}>Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, idx) => (
                    <tr key={payment.id || payment.name || `payment-${idx}`}>
                      <td className={`px-3 py-2 text-sm ${textMuted}`}>{formatDateDMY(payment.paymentDate)}</td>
                      <td className={`px-3 py-2 text-sm font-mono ${textPrimary}`}>
                        AED{" "}
                        {payment.amount.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={`px-3 py-2 text-sm ${textMuted}`}>{payment.reference || "-"}</td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === "completed"
                              ? isDarkMode
                                ? "bg-green-900/30 text-green-400"
                                : "bg-green-100 text-green-700"
                              : isDarkMode
                                ? "bg-yellow-900/30 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={`px-3 py-6 text-center text-sm ${textMuted}`}>
                      No payment history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerForm;
