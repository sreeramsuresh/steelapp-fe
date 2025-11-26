import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDateForInput } from '../utils/invoiceUtils';
import {
  PAYMENT_MODES,
  generatePaymentId,
  validatePayment,
  calculateBalanceDue,
} from '../utils/paymentUtils';

const AddPaymentModal = ({ isOpen, onClose, onSave, invoiceTotal, existingPayments = [], editingPayment = null }) => {
  const { isDarkMode } = useTheme();

  const [payment, setPayment] = useState({
    id: '',
    date: formatDateForInput(new Date()),
    amount: '',
    paymentMethod: 'cash',      // camelCase - standardized
    referenceNumber: '',        // camelCase - standardized
    notes: '',
  });

  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const balanceDue = calculateBalanceDue(invoiceTotal, existingPayments);

  // Load editing payment data
  useEffect(() => {
    if (editingPayment) {
      setPayment({
        ...editingPayment,
        date: formatDateForInput(editingPayment.date),
      });
    } else {
      setPayment({
        id: generatePaymentId(),
        date: formatDateForInput(new Date()),
        amount: '',
        paymentMethod: 'cash',      // camelCase - standardized
        referenceNumber: '',        // camelCase - standardized
        notes: '',
      });
    }
    setErrors([]);
    setIsSaving(false); // Reset saving state when modal opens
  }, [editingPayment, isOpen]);

  const handleSave = () => {
    const validationErrors = validatePayment(payment, invoiceTotal, existingPayments);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Set saving state
    setIsSaving(true);

    // Save the payment with standardized camelCase fields
    // The spread copies id, date, paymentMethod, referenceNumber, notes
    onSave({
      ...payment,
      amount: parseFloat(payment.amount),
      paymentDate: payment.date, // Alias date -> paymentDate for API Gateway
      createdAt: editingPayment?.createdAt || new Date().toISOString(),
    });

    // Close modal with smooth transition delay (300ms for React state to settle)
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 300);
  };

  const modeConfig = PAYMENT_MODES[payment.paymentMethod] || PAYMENT_MODES.cash;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`max-w-lg w-full mx-4 p-6 rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingPayment ? 'Edit Payment' : 'Add Payment'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Balance Due Info */}
        <div
          className={`mb-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
          }`}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Balance Due:</span>
              <button
                type="button"
                onClick={() => setPayment((prev) => ({ ...prev, amount: balanceDue.toString() }))}
                disabled={editingPayment}
                className={`text-lg font-bold transition-all group ${
                  !editingPayment
                    ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer hover:scale-105'
                    : 'text-blue-600 dark:text-blue-400 cursor-default'
                }`}
                title={!editingPayment ? 'Click to apply this amount to payment' : ''}
              >
                {formatCurrency(balanceDue)}
                {!editingPayment && (
                  <span className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ✓
                  </span>
                )}
              </button>
            </div>
            {!editingPayment && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> Click the balance amount above to auto-fill the payment field
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              isDarkMode
                ? 'bg-red-900/30 border-red-600'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-start">
              <AlertTriangle
                size={18}
                className="text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <ul className="text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Payment Date */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={payment.date}
              onChange={(e) =>
                setPayment((prev) => ({ ...prev, date: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Amount */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Amount (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) =>
                setPayment((prev) => ({ ...prev, amount: e.target.value }))
              }
              placeholder="0.00"
              min="0"
              max={!editingPayment ? balanceDue : undefined}
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            {!editingPayment && parseFloat(payment.amount) > balanceDue && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Amount cannot exceed balance due ({formatCurrency(balanceDue)})
              </p>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={payment.paymentMethod}
              onChange={(e) =>
                setPayment((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value,
                  referenceNumber: '', // Clear reference when mode changes
                }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {Object.values(PAYMENT_MODES).map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.icon} {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {modeConfig.refLabel || 'Reference Number'}
              {modeConfig.requiresRef && (
                <span className="text-red-500"> *</span>
              )}
            </label>
            <input
              type="text"
              value={payment.referenceNumber}
              onChange={(e) =>
                setPayment((prev) => ({
                  ...prev,
                  referenceNumber: e.target.value,
                }))
              }
              placeholder={
                modeConfig.requiresRef
                  ? `Enter ${modeConfig.refLabel || 'reference number'}`
                  : 'Optional'
              }
              required={modeConfig.requiresRef}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Notes
            </label>
            <textarea
              value={payment.notes}
              onChange={(e) =>
                setPayment((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Optional payment notes..."
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center ${
              isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              editingPayment ? 'Update Payment' : 'Add Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;
