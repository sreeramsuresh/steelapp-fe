import React, { useState } from 'react';
import { Banknote } from 'lucide-react';
import { PAYMENT_MODES } from '../../services/dataService';
import { formatCurrency } from '../../utils/invoiceUtils';
import { toUAEDateForInput } from '../../utils/timezone';

/**
 * AddPaymentForm - Unified payment form component
 * Used by: Receivables, InvoiceList, Payables (PO)
 *
 * @param {number} outstanding - Remaining balance to pay (required)
 * @param {function} onSave - Callback with payment data (required)
 * @param {boolean} isSaving - Disable save button while saving (optional, default: false)
 * @param {string} entityType - 'invoice' | 'po' for context-aware labels (optional, default: 'invoice')
 */
const AddPaymentForm = ({
  outstanding = 0,
  onSave,
  isSaving = false,
  entityType = 'invoice'
}) => {
  // Initialize with today's date in UAE timezone
  const [date, setDate] = useState(() => toUAEDateForInput(new Date()));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Get current payment mode config
  const modeConfig = PAYMENT_MODES[method] || PAYMENT_MODES.cash;

  // Helper for number input
  const numberInput = (v) => (v === '' || isNaN(Number(v)) ? '' : v);

  // Validation: amount must be > 0, <= outstanding, reference required for non-cash, and not already saving
  const canSave =
    !isSaving &&
    Number(amount) > 0 &&
    Number(amount) <= Number(outstanding || 0) &&
    (!modeConfig.requiresRef || (reference && reference.trim() !== ''));

  const handleSave = () => {
    if (!canSave) return;

    // Output standardized camelCase format (API Gateway converts to snake_case)
    onSave({
      amount: Number(amount),
      method,  // Keep 'method' for backward compatibility
      paymentMethod: method, // Standard field name
      referenceNo: reference, // Keep for backward compat
      referenceNumber: reference, // Standard field name
      notes,
      paymentDate: date
    });

    // Clear form after successful save - reset to today's date in UAE timezone
    setDate(toUAEDateForInput(new Date()));
    setAmount('');
    setMethod('cash');
    setReference('');
    setNotes('');
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
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-800">
              <strong>Note:</strong> All payment details are required for proper accounting records. Click the balance amount above to auto-fill the payment amount.
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
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Amount (max: {formatCurrency(outstanding)})</div>
          <input
            type="number"
            step="0.01"
            max={outstanding}
            className="px-2 py-2 rounded border w-full"
            value={amount}
            onChange={e => setAmount(numberInput(e.target.value))}
          />
          {Number(amount) > Number(outstanding) && (
            <div className="text-xs text-red-600 mt-1">Amount cannot exceed {balanceLabel.toLowerCase()}</div>
          )}
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Payment Method</div>
          <select
            className="px-2 py-2 rounded border w-full"
            value={method}
            onChange={e => { setMethod(e.target.value); setReference(''); }}
          >
            {Object.values(PAYMENT_MODES).map(m => (
              <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
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
            onChange={e => setReference(e.target.value)}
            placeholder={modeConfig.requiresRef ? `Enter ${modeConfig.refLabel || 'reference'}` : 'Optional'}
            required={modeConfig.requiresRef}
          />
          {modeConfig.requiresRef && (!reference || reference.trim() === '') && (
            <div className="text-xs text-red-600 mt-1">Reference is required for {modeConfig.label}</div>
          )}
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs opacity-70 mb-1">Notes</div>
          <textarea
            className="px-2 py-2 rounded border w-full"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
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
