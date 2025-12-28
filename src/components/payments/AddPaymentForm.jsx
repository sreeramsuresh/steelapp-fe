import { useState, useEffect } from 'react';
import { Banknote, AlertTriangle, CheckCircle } from 'lucide-react';
import { PAYMENT_MODES } from '../../services/dataService';
import { formatCurrency } from '../../utils/invoiceUtils';
import { toUAEDateForInput } from '../../utils/timezone';
import CurrencyInput from '../forms/CurrencyInput';
import { customerCreditService } from '../../services/customerCreditService';

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
 * @param {number} customerId - Customer ID for credit limit check (optional)
 * @param {number} invoiceVatAmount - Invoice VAT amount for auto-population (optional)
 */
const AddPaymentForm = ({
  outstanding = 0,
  onSave,
  isSaving = false,
  onCancel,
  entityType = 'invoice',
  defaultCurrency = 'AED',
  customerId = null,
  invoiceVatAmount: _invoiceVatAmount = null,
}) => {
  // Initialize with today's date in UAE timezone
  const [date, setDate] = useState(() => toUAEDateForInput(new Date()));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-currency fields (Phase 1 Enhancement)
  const [currency, setCurrency] = useState(defaultCurrency);
  const [exchangeRate, setExchangeRate] = useState('1.0000');

  // VAT tracking fields (Epic 9 - PAYM-003)
  const [vatRate, setVatRate] = useState('5');
  const [reverseCharge, setReverseCharge] = useState(false);

  // Credit limit state (Epic 2 - PAYM-001)
  const [creditSummary, setCreditSummary] = useState(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [creditError, setCreditError] = useState(null);

  // Fetch customer credit summary when customerId is provided
  useEffect(() => {
    if (!customerId) {
      setCreditSummary(null);
      return;
    }

    const fetchCreditSummary = async () => {
      try {
        setLoadingCredit(true);
        setCreditError(null);
        const summary =
          await customerCreditService.getCustomerCreditSummary(customerId);
        setCreditSummary(summary);
      } catch (error) {
        console.error('Error fetching customer credit summary:', error);
        setCreditError('Unable to load credit information');
        setCreditSummary(null);
      } finally {
        setLoadingCredit(false);
      }
    };

    fetchCreditSummary();
  }, [customerId]);

  // Get current payment mode config
  const modeConfig = PAYMENT_MODES[method] || PAYMENT_MODES.cash;

  // Helper for number input
  const _numberInput = (v) => (v === '' || isNaN(Number(v)) ? '' : v);

  // Check if using foreign currency (non-AED)
  const isForeignCurrency = currency !== 'AED';

  // Calculate AED equivalent when using foreign currency
  const amountInAed = isForeignCurrency
    ? (Number(amount) || 0) * (parseFloat(exchangeRate) || 1)
    : Number(amount) || 0;

  // VAT calculations (Epic 9 - PAYM-003)
  const paymentAmount = Number(amount) || 0;
  const calculatedVatAmount = reverseCharge
    ? 0
    : (paymentAmount * (parseFloat(vatRate) || 0)) /
      (100 + (parseFloat(vatRate) || 0));
  const taxableAmount = paymentAmount - calculatedVatAmount;

  // Credit limit calculations (Epic 2 - PAYM-001)
  const creditLimit = creditSummary?.creditLimit || 0;
  const currentUsage = creditSummary?.currentCredit || 0;
  const availableCredit = creditLimit - currentUsage;

  // After payment, what would the new usage be?
  // Payment REDUCES usage (receivable goes down)
  const newUsageAfterPayment = currentUsage - paymentAmount;
  const newAvailableCredit = creditLimit - newUsageAfterPayment;

  // Check if payment would improve or worsen credit position
  const _creditImpactPositive = paymentAmount > 0; // Payment always improves credit
  const creditUtilizationAfterPayment =
    creditLimit > 0
      ? ((newUsageAfterPayment / creditLimit) * 100).toFixed(1)
      : 0;

  // Warning threshold: if available credit after payment falls below 10% of limit
  const creditWarningThreshold = creditLimit * 0.1;
  const showCreditWarning =
    customerId &&
    creditSummary &&
    newAvailableCredit < creditWarningThreshold &&
    newAvailableCredit > 0;

  // Validation: amount must be > 0, <= outstanding, reference required for non-cash,
  // exchange rate required for foreign currency, and not already saving
  const canSave =
    !isSaving &&
    Number(amount) > 0 &&
    Number(amount) <= Number(outstanding || 0) &&
    (!modeConfig.requiresRef || (reference && reference.trim() !== '')) &&
    (!isForeignCurrency || parseFloat(exchangeRate) > 0);

  const handleSave = () => {
    if (!canSave) return;

    // Output standardized camelCase format (API Gateway converts to snake_case)
    // Phase 1: Include multi-currency fields for FX tracking
    // Epic 9: Include VAT tracking fields (PAYM-003)
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
      // VAT tracking fields (Epic 9 - PAYM-003)
      vatRate: parseFloat(vatRate),
      vatAmount: calculatedVatAmount,
      taxableAmount,
      reverseCharge,
    };

    onSave(paymentData);

    // Clear form after successful save - reset to today's date in UAE timezone
    setDate(toUAEDateForInput(new Date()));
    setAmount('');
    setMethod('cash');
    setReference('');
    setNotes('');
    setCurrency(defaultCurrency);
    setExchangeRate('1.0000');
    setVatRate('5');
    setReverseCharge(false);
  };

  const balanceLabel = entityType === 'po' ? 'Balance' : 'Outstanding Balance';

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

          {/* Customer Credit Limit Display (Epic 2 - PAYM-001) */}
          {customerId && (
            <div className="mb-3">
              {loadingCredit ? (
                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
                  Loading credit information...
                </div>
              ) : creditError ? (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{creditError}</span>
                </div>
              ) : creditSummary ? (
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Customer Credit Status
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-600">Credit Limit</div>
                      <div className="font-bold text-green-900">
                        {formatCurrency(creditLimit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Current Usage</div>
                      <div className="font-bold text-green-900">
                        {formatCurrency(currentUsage)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Available</div>
                      <div className="font-bold text-green-900">
                        {formatCurrency(availableCredit)}
                      </div>
                    </div>
                  </div>
                  {paymentAmount > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          After This Payment:
                        </span>
                        <span className="font-bold text-green-700">
                          {formatCurrency(newAvailableCredit)} available (
                          {creditUtilizationAfterPayment}% used)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Credit Warning (Epic 2 - PAYM-001) */}
          {showCreditWarning && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Low Credit Warning:</strong> This payment will leave
                  the customer with only {formatCurrency(newAvailableCredit)}{' '}
                  available credit (
                  {((newAvailableCredit / creditLimit) * 100).toFixed(1)}% of
                  limit).
                </div>
              </div>
            </div>
          )}

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

        {/* Currency Input (Phase 1 Multi-Currency) */}
        <CurrencyInput
          currency={currency}
          onCurrencyChange={setCurrency}
          amount={amount}
          onAmountChange={setAmount}
          exchangeRate={exchangeRate}
          onExchangeRateChange={setExchangeRate}
          maxAmount={outstanding}
          showMaxInLabel={true}
          required={true}
          showAedEquivalent={true}
          className="sm:col-span-2"
        />

        <div>
          <div className="text-xs opacity-70 mb-1">Payment Method</div>
          <select
            className="px-2 py-2 rounded border w-full"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setReference('');
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
            {modeConfig.refLabel || 'Reference #'}
            {modeConfig.requiresRef && <span className="text-red-500"> *</span>}
          </div>
          <input
            className="px-2 py-2 rounded border w-full"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={
              modeConfig.requiresRef
                ? `Enter ${modeConfig.refLabel || 'reference'}`
                : 'Optional'
            }
            required={modeConfig.requiresRef}
          />
          {modeConfig.requiresRef &&
            (!reference || reference.trim() === '') && (
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

      {/* VAT Breakdown Section (Epic 9 - PAYM-003) */}
      {paymentAmount > 0 && (
        <div className="mt-4 px-3 py-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-semibold text-purple-900">
              UAE VAT Breakdown (Form 201 Reference)
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={reverseCharge}
                onChange={(e) => setReverseCharge(e.target.checked)}
                className="rounded"
              />
              <span className="text-purple-800">Apply Reverse Charge</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-700">Taxable Amount:</span>
              <span className="font-bold text-purple-900">
                {formatCurrency(taxableAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">VAT Rate:</span>
              <span className="font-bold text-purple-900">
                {reverseCharge ? '0%' : `${vatRate}%`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">VAT Amount:</span>
              <span className="font-bold text-purple-900">
                {formatCurrency(calculatedVatAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Total Payment:</span>
              <span className="font-bold text-purple-900">
                {formatCurrency(paymentAmount)}
              </span>
            </div>
          </div>
          {reverseCharge && (
            <div className="mt-2 text-xs text-purple-800 bg-purple-100 px-2 py-1 rounded">
              <strong>Note:</strong> Reverse charge applied. VAT = 0% for
              import/reverse charge scenarios.
            </div>
          )}
        </div>
      )}

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
              ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Payment'}
        </button>
      </div>
    </div>
  );
};

export default AddPaymentForm;
