import { useMemo } from "react";
import { Globe } from "lucide-react";
import { formatCurrency } from "../../utils/invoiceUtils";

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
 * CurrencyInput - Reusable multi-currency input component
 * Handles currency selection, amount input, exchange rate, and AED equivalent calculation
 *
 * @param {string} currency - Selected currency code (required)
 * @param {function} onCurrencyChange - Callback when currency changes (required)
 * @param {string|number} amount - Payment amount (required)
 * @param {function} onAmountChange - Callback when amount changes (required)
 * @param {string|number} exchangeRate - Exchange rate to AED (required for non-AED)
 * @param {function} onExchangeRateChange - Callback when rate changes (required)
 * @param {number} maxAmount - Maximum allowed amount (optional)
 * @param {boolean} showMaxInLabel - Show max amount in label (optional, default: false)
 * @param {string} amountLabel - Custom label for amount field (optional)
 * @param {boolean} required - Mark fields as required (optional, default: true)
 * @param {boolean} showAedEquivalent - Show AED equivalent panel (optional, default: true)
 * @param {string} className - Additional CSS classes (optional)
 */
const CurrencyInput = ({
  currency,
  onCurrencyChange,
  amount,
  onAmountChange,
  exchangeRate,
  onExchangeRateChange,
  maxAmount,
  showMaxInLabel = false,
  amountLabel,
  required = true,
  showAedEquivalent = true,
  className = "",
}) => {
  // Check if using foreign currency (non-AED)
  const isForeignCurrency = currency !== "AED";

  // Calculate AED equivalent when using foreign currency
  const amountInAed = useMemo(() => {
    if (currency === "AED") return Number(amount) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    return (Number(amount) || 0) * rate;
  }, [amount, currency, exchangeRate]);

  // Helper for number input
  const numberInput = (v) => (v === "" || isNaN(Number(v)) ? "" : v);

  // Handle currency change - reset exchange rate for AED
  const handleCurrencyChange = (newCurrency) => {
    onCurrencyChange(newCurrency);
    if (newCurrency === "AED") {
      onExchangeRateChange("1.0000");
    }
  };

  // Generate amount label
  const getAmountLabel = () => {
    if (amountLabel) return amountLabel;
    const base = `Amount (${currency})`;
    if (showMaxInLabel && maxAmount !== undefined) {
      return `${base} (max: ${formatCurrency(maxAmount)})`;
    }
    return base;
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      {/* Currency Selector */}
      <div>
        <div className="text-xs opacity-70 mb-1 flex items-center gap-1">
          <Globe size={12} />
          Currency
          {required && <span className="text-red-500"> *</span>}
        </div>
        <select
          className="px-2 py-2 rounded border w-full"
          value={currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          required={required}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Input */}
      <div>
        <div className="text-xs opacity-70 mb-1">
          {getAmountLabel()}
          {required && <span className="text-red-500"> *</span>}
        </div>
        <input
          type="number"
          step="0.01"
          max={maxAmount}
          className="px-2 py-2 rounded border w-full"
          value={amount}
          onChange={(e) => onAmountChange(numberInput(e.target.value))}
          required={required}
        />
        {maxAmount !== undefined && Number(amount) > Number(maxAmount) && (
          <div className="text-xs text-red-600 mt-1">
            Amount cannot exceed {formatCurrency(maxAmount)}
          </div>
        )}
      </div>

      {/* Exchange Rate Input (only shown for foreign currencies) */}
      {isForeignCurrency && (
        <div>
          <div className="text-xs opacity-70 mb-1">
            Exchange Rate (1 {currency} = X AED)
            {required && <span className="text-red-500"> *</span>}
          </div>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            className="px-2 py-2 rounded border w-full"
            value={exchangeRate}
            onChange={(e) => onExchangeRateChange(e.target.value)}
            placeholder="e.g., 3.6725 for USD"
            required={required && isForeignCurrency}
          />
          {required &&
            (!exchangeRate || parseFloat(exchangeRate) <= 0) && (
              <div className="text-xs text-red-600 mt-1">
                Exchange rate is required for {currency} payments
              </div>
            )}
        </div>
      )}

      {/* AED Equivalent Display (only shown for foreign currencies) */}
      {showAedEquivalent &&
        isForeignCurrency &&
        amount &&
        parseFloat(exchangeRate) > 0 && (
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
    </div>
  );
};

// Export CURRENCIES for use in other components
export { CURRENCIES };

export default CurrencyInput;
