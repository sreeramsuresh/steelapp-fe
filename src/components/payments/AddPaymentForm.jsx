import { useState, useMemo } from "react";
import { Banknote, Globe } from "lucide-react";
import { PAYMENT_MODES } from "../../services/dataService";
import { formatCurrency } from "../../utils/invoiceUtils";
import { toUAEDateForInput } from "../../utils/timezone";

// Supported currencies for multi-currency payments
const CURRENCIES = [
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "EUR" },
  { code: "GBP", name: "British Pound", symbol: "GBP" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
  { code: "INR", name: "Indian Rupee", symbol: "INR" },
];

/**
 * AddPaymentForm - Unified payment form component with multi-currency support
 * Used by: Receivables, InvoiceList, Payables (PO)
 *
 * Phase 1 Enhancement: Multi-currency payment tracking (Migration 103)
 * - Allows payments in foreign currencies (USD, EUR, GBP, SAR, INR)
 * - Captures exchange rate for FX tracking
 * - Auto-calculates AED equivalent for UAE VAT reporting
 *
 * @param {number} outstanding - Remaining balance to pay (required)
 * @param {function} onSave - Callback with payment data (required)
 * @param {boolean} isSaving - Disable save button while saving (optional, default: false)
 * @param {function} onCancel - Cancel callback (optional)
 * @param {string} entityType - 'invoice' | 'po' for context-aware labels (optional, default: 'invoice')
 * @param {string} defaultCurrency - Default currency code (optional, default: 'AED')
 */
const AddPaymentForm = ({
  outstanding = 0,
  onSave,
  isSaving = false,
  onCancel,
  entityType = "invoice",
  defaultCurrency = "AED",
}) => {
  // Initialize with today's date in UAE timezone
  const [date, setDate] = useState(() => toUAEDateForInput(new Date()));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Multi-currency fields (Phase 1 Enhancement)
  const [currency, setCurrency] = useState(defaultCurrency);
  const [exchangeRate, setExchangeRate] = useState("1.0000");

  // Get current payment mode config
  const modeConfig = PAYMENT_MODES[method] || PAYMENT_MODES.cash;

  // Helper for number input
  const numberInput = (v) => (v === "" || isNaN(Number(v)) ? "" : v);

  // Calculate AED equivalent when using foreign currency
  const amountInAed = useMemo(() => {
    if (currency === "AED") return Number(amount) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    return (Number(amount) || 0) * rate;
  }, [amount, currency, exchangeRate]);

  // Check if using foreign currency (non-AED)
  const isForeignCurrency = currency !== "AED";

  // Validation: amount must be > 0, <= outstanding, reference required for non-cash,
  // exchange rate required for foreign currency, and not already saving
  const canSave =
    !isSaving &&
    Number(amount) > 0 &&
    Number(amount) <= Number(outstanding || 0) &&
    (!modeConfig.requiresRef || (reference && reference.trim() !== "")) &&
    (!isForeignCurrency || parseFloat(exchangeRate) > 0);

  const handleSave = () => {
    if (!canSave) return;

    // Output standardized camelCase format (API Gateway converts to snake_case)
    // Phase 1: Include multi-currency fields for FX tracking
    const paymentData = {
      amount: Number(amount),
      method, // Keep 'method' for backward compatibility
      paymentMethod: method, // Standard field name
      referenceNo: reference, // Keep for backward compat
      referenceNumber: reference, // Standard field name
      notes,
      paymentDate: date,
      // Multi-currency fields (Phase 1 Enhancement)
      currency,
      exchangeRate: isForeignCurrency ? parseFloat(exchangeRate) : 1.0,
      amountInAed,
    };

    onSave(paymentData);

    // Clear form after successful save - reset to today's date in UAE timezone
    setDate(toUAEDateForInput(new Date()));
    setAmount("");
    setMethod("cash");
    setReference("");
    setNotes("");
    setCurrency(defaultCurrency);
    setExchangeRate("1.0000");
  };

  // Handle currency change - reset exchange rate for AED
  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    if (newCurrency === "AED") {
      setExchangeRate("1.0000");
    }
  };

  const balanceLabel = entityType === "po" ? "Balance" : "Outstanding Balance";

  return (
    <div className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50">
      <div className="font-semibold mb-3 text-teal-900 flex items-center gap-2">
        <Banknote size={18} />
        Record Payment Details
      </div>

      {outstanding > 0 && (
        <>
          <div className="mb-3 px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg flex justify-between items-center border border-blue-200">
            <span className="font-semibold">{balanceLabel}:</span>
            <button
              type="button"
              onClick={() => setAmount(outstanding.toString())}
              className="font-bold text-blue-800 hover:text-blue-900 cursor-pointer hover:scale-105 transition-all group px-2 py-1 rounded hover:bg-blue-200"
              title="Click to apply this amount to payment"
            >
              {formatCurrency(outstanding)}
              <span className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Apply
              </span>
            </button>
          </div>
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-800">
              <strong>Note:</strong> All payment details are required for proper
              accounting records. Click the balance amount above to auto-fill
              the payment amount.
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-70 mb-1">Payment Date</div>
          <input
            type="date"
            className="px-2 py-2 rounded border w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Currency Selector (Phase 1 Multi-Currency) */}
        <div>
          <div className="text-xs opacity-70 mb-1 flex items-center gap-1">
            <Globe size={12} />
            Currency
          </div>
          <select
            className="px-2 py-2 rounded border w-full"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs opacity-70 mb-1">
            Amount ({currency}) (max: {formatCurrency(outstanding)})
          </div>
          <input
            type="number"
            step="0.01"
            max={outstanding}
            className="px-2 py-2 rounded border w-full"
            value={amount}
            onChange={(e) => setAmount(numberInput(e.target.value))}
          />
          {Number(amount) > Number(outstanding) && (
            <div className="text-xs text-red-600 mt-1">
              Amount cannot exceed {balanceLabel.toLowerCase()}
            </div>
          )}
        </div>

        {/* Exchange Rate Input (only shown for foreign currencies) */}
        {isForeignCurrency && (
          <div>
            <div className="text-xs opacity-70 mb-1">
              Exchange Rate (1 {currency} = X AED)
              <span className="text-red-500"> *</span>
            </div>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              className="px-2 py-2 rounded border w-full"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="e.g., 3.6725 for USD"
            />
            {(!exchangeRate || parseFloat(exchangeRate) <= 0) && (
              <div className="text-xs text-red-600 mt-1">
                Exchange rate is required for {currency} payments
              </div>
            )}
          </div>
        )}

        {/* AED Equivalent Display (only shown for foreign currencies) */}
        {isForeignCurrency && amount && parseFloat(exchangeRate) > 0 && (
          <div className="sm:col-span-2">
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-700 font-medium mb-1">
                AED Equivalent (for VAT reporting)
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(amountInAed)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {amount} {currency} x {exchangeRate} = {amountInAed.toFixed(2)}{" "}
                AED
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="text-xs opacity-70 mb-1">Payment Method</div>
          <select
            className="px-2 py-2 rounded border w-full"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setReference("");
            }}
          >
            {Object.values(PAYMENT_MODES).map((m) => (
              <option key={m.value} value={m.value}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">
            {modeConfig.refLabel || "Reference #"}
            {modeConfig.requiresRef && <span className="text-red-500"> *</span>}
          </div>
          <input
            className="px-2 py-2 rounded border w-full"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={
              modeConfig.requiresRef
                ? `Enter ${modeConfig.refLabel || "reference"}`
                : "Optional"
            }
            required={modeConfig.requiresRef}
          />
          {modeConfig.requiresRef &&
            (!reference || reference.trim() === "") && (
              <div className="text-xs text-red-600 mt-1">
                Reference is required for {modeConfig.label}
              </div>
            )}
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs opacity-70 mb-1">Notes</div>
          <textarea
            className="px-2 py-2 rounded border w-full"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-lg font-semibold transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        )}
        <button
          disabled={!canSave}
          onClick={handleSave}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
            canSave
              ? "bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {isSaving ? "Saving..." : "Save Payment"}
        </button>
      </div>
    </div>
  );
};

export default AddPaymentForm;
