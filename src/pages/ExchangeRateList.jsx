import { ArrowRightLeft, DollarSign, Edit, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { exchangeRateService } from "../services/exchangeRateService";

const ExchangeRateList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRate, setSelectedRate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    from_currency: "USD",
    to_currency: "AED",
    rate: "",
    effective_date: new Date().toISOString().split("T")[0],
  });
  const [formErrors, setFormErrors] = useState({});

  // Converter state
  const [showConverter, setShowConverter] = useState(false);
  const [converterData, setConverterData] = useState({
    amount: "",
    from_currency: "USD",
    to_currency: "AED",
  });
  const [convertResult, setConvertResult] = useState(null);

  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      const response = await exchangeRateService.getExchangeRates(params);
      setRates(response.rates || response.data || response || []);
    } catch (err) {
      setError(err.message || "Failed to load exchange rates");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const openModal = (mode, rate = null) => {
    setModalMode(mode);
    setSelectedRate(rate);
    setFormErrors({});
    if (rate && mode === "edit") {
      setFormData({
        from_currency: rate.from_currency || rate.fromCurrency || "USD",
        to_currency: rate.to_currency || rate.toCurrency || "AED",
        rate: rate.rate || "",
        effective_date: rate.effective_date
          ? rate.effective_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setFormData({
        from_currency: "USD",
        to_currency: "AED",
        rate: "",
        effective_date: new Date().toISOString().split("T")[0],
      });
    }
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.from_currency) errors.from_currency = "Required";
    if (!formData.to_currency) errors.to_currency = "Required";
    if (formData.from_currency === formData.to_currency) errors.to_currency = "Must differ from source";
    if (!formData.rate || parseFloat(formData.rate) <= 0) errors.rate = "Rate must be positive";
    if (!formData.effective_date) errors.effective_date = "Date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError(null);
      const payload = { ...formData, rate: parseFloat(formData.rate) };
      if (modalMode === "edit" && selectedRate) {
        await exchangeRateService.updateExchangeRate(selectedRate.id, payload);
        setSuccessMessage("Exchange rate updated");
      } else {
        await exchangeRateService.createExchangeRate(payload);
        setSuccessMessage("Exchange rate created");
      }
      setShowModal(false);
      loadRates();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save exchange rate");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rate) => {
    const confirmed = await confirm({
      title: "Delete Exchange Rate?",
      message: `Delete rate ${rate.from_currency || rate.fromCurrency} → ${rate.to_currency || rate.toCurrency}?`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await exchangeRateService.deleteExchangeRate(rate.id);
      setSuccessMessage("Exchange rate deleted");
      loadRates();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleConvert = async () => {
    try {
      const result = await exchangeRateService.convertCurrency({
        amount: parseFloat(converterData.amount),
        from_currency: converterData.from_currency,
        to_currency: converterData.to_currency,
      });
      setConvertResult(result);
    } catch {
      setConvertResult({ error: true, message: "Conversion failed. Check rates are available." });
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const cardClass = isDarkMode ? "bg-gray-800" : "bg-white";
  const inputClass = `w-full px-3 py-2 border rounded-lg ${
    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
  }`;

  return (
    <div className={`p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="text-teal-600" size={24} />
            Exchange Rates
          </h1>
          <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage currency exchange rates and conversions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowConverter(!showConverter)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode ? "bg-purple-700 hover:bg-purple-600" : "bg-purple-600 hover:bg-purple-700"
            } text-white`}
          >
            <ArrowRightLeft size={18} />
            Converter
          </button>
          <button
            type="button"
            onClick={() => openModal("create")}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add Rate
          </button>
        </div>
      </div>

      {/* Converter Panel */}
      {showConverter && (
        <div
          className={`${cardClass} rounded-lg p-6 mb-6 shadow-sm border ${isDarkMode ? "border-purple-800" : "border-purple-200"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowRightLeft className="text-purple-600" size={20} />
              Currency Converter
            </h3>
            <button type="button" onClick={() => setShowConverter(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label
                htmlFor="converter-amount"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Amount
              </label>
              <input
                id="converter-amount"
                type="number"
                step="0.01"
                value={converterData.amount}
                onChange={(e) => setConverterData((p) => ({ ...p, amount: e.target.value }))}
                placeholder="100.00"
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="converter-from"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                From
              </label>
              <input
                id="converter-from"
                type="text"
                value={converterData.from_currency}
                onChange={(e) => setConverterData((p) => ({ ...p, from_currency: e.target.value.toUpperCase() }))}
                maxLength={3}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="converter-to"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                To
              </label>
              <input
                id="converter-to"
                type="text"
                value={converterData.to_currency}
                onChange={(e) => setConverterData((p) => ({ ...p, to_currency: e.target.value.toUpperCase() }))}
                maxLength={3}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleConvert}
              disabled={!converterData.amount}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
            >
              Convert
            </button>
          </div>
          {convertResult && (
            <div
              className={`mt-4 p-4 rounded-lg ${convertResult.error ? "bg-red-100 text-red-700" : isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              {convertResult.error ? (
                <p className="text-sm">{convertResult.message}</p>
              ) : (
                <p className="text-lg font-bold">
                  {parseFloat(converterData.amount).toFixed(2)} {converterData.from_currency} ={" "}
                  <span className={isDarkMode ? "text-green-400" : "text-green-700"}>
                    {parseFloat(convertResult.converted_amount || convertResult.convertedAmount || 0).toFixed(2)}{" "}
                    {converterData.to_currency}
                  </span>
                  {convertResult.rate && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Rate: {parseFloat(convertResult.rate).toFixed(4)})
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success / Error */}
      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          {error}
          <button type="button" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search + Refresh */}
      <div className={`${cardClass} rounded-lg p-4 mb-6 shadow-sm`}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by currency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
          <button
            type="button"
            onClick={() => loadRates()}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} rounded-lg shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
            <p className="mt-2 text-gray-500">Loading rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No exchange rates found</p>
            <button
              type="button"
              onClick={() => openModal("create")}
              className="text-teal-600 hover:text-teal-700 mt-2 inline-block"
            >
              Add your first exchange rate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {rates.map((rate) => (
                  <tr key={rate.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-mono font-bold px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                      >
                        {rate.from_currency || rate.fromCurrency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-mono font-bold px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                      >
                        {rate.to_currency || rate.toCurrency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold">{parseFloat(rate.rate).toFixed(4)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(rate.effective_date || rate.effectiveDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openModal("edit", rate)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rate)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
            aria-label="Close"
          />
          <div className={`relative z-10 w-full max-w-md mx-4 rounded-xl shadow-2xl ${cardClass}`}>
            <div
              className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <h2 className="text-xl font-semibold">
                {modalMode === "edit" ? "Edit Exchange Rate" : "New Exchange Rate"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-from-currency"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    From Currency *
                  </label>
                  <input
                    id="form-from-currency"
                    type="text"
                    value={formData.from_currency}
                    onChange={(e) => setFormData((p) => ({ ...p, from_currency: e.target.value.toUpperCase() }))}
                    maxLength={3}
                    className={`${inputClass} ${formErrors.from_currency ? "border-red-500" : ""}`}
                    placeholder="USD"
                  />
                  {formErrors.from_currency && <p className="text-red-500 text-xs mt-1">{formErrors.from_currency}</p>}
                </div>
                <div>
                  <label
                    htmlFor="form-to-currency"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    To Currency *
                  </label>
                  <input
                    id="form-to-currency"
                    type="text"
                    value={formData.to_currency}
                    onChange={(e) => setFormData((p) => ({ ...p, to_currency: e.target.value.toUpperCase() }))}
                    maxLength={3}
                    className={`${inputClass} ${formErrors.to_currency ? "border-red-500" : ""}`}
                    placeholder="AED"
                  />
                  {formErrors.to_currency && <p className="text-red-500 text-xs mt-1">{formErrors.to_currency}</p>}
                </div>
              </div>
              <div>
                <label
                  htmlFor="form-rate"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Rate *
                </label>
                <input
                  id="form-rate"
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  onChange={(e) => setFormData((p) => ({ ...p, rate: e.target.value }))}
                  className={`${inputClass} ${formErrors.rate ? "border-red-500" : ""}`}
                  placeholder="3.6725"
                />
                {formErrors.rate && <p className="text-red-500 text-xs mt-1">{formErrors.rate}</p>}
              </div>
              <div>
                <label
                  htmlFor="form-effective-date"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Effective Date *
                </label>
                <input
                  id="form-effective-date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData((p) => ({ ...p, effective_date: e.target.value }))}
                  className={`${inputClass} ${formErrors.effective_date ? "border-red-500" : ""}`}
                />
                {formErrors.effective_date && <p className="text-red-500 text-xs mt-1">{formErrors.effective_date}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {modalMode === "edit" ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ExchangeRateList;
