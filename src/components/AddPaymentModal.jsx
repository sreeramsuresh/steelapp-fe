import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDateForInput } from '../utils/invoiceUtils';
import {
  PAYMENT_MODES,
  generatePaymentId,
  validatePayment,
  calculateBalanceDue
} from '../utils/paymentUtils';

const AddPaymentModal = ({ isOpen, onClose, onSave, invoiceTotal, existingPayments = [], editingPayment = null }) => {
  const { isDarkMode } = useTheme();

  const [payment, setPayment] = useState({
    id: '',
    date: formatDateForInput(new Date()),
    amount: '',
    payment_mode: 'cash',
    reference_number: '',
    notes: ''
  });

  const [errors, setErrors] = useState([]);
  const balanceDue = calculateBalanceDue(invoiceTotal, existingPayments);

  // Load editing payment data
  useEffect(() => {
    if (editingPayment) {
      setPayment({
        ...editingPayment,
        date: formatDateForInput(editingPayment.date)
      });
    } else {
      setPayment({
        id: generatePaymentId(),
        date: formatDateForInput(new Date()),
        amount: '',
        payment_mode: 'cash',
        reference_number: '',
        notes: ''
      });
    }
    setErrors([]);
  }, [editingPayment, isOpen]);

  const handleSave = () => {
    const validationErrors = validatePayment(payment, invoiceTotal, existingPayments);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave({
      ...payment,
      amount: parseFloat(payment.amount),
      created_at: editingPayment?.created_at || new Date().toISOString()
    });

    // Reset form
    setPayment({
      id: generatePaymentId(),
      date: formatDateForInput(new Date()),
      amount: '',
      payment_mode: 'cash',
      reference_number: '',
      notes: ''
    });
    setErrors([]);
  };

  const modeConfig = PAYMENT_MODES[payment.payment_mode] || PAYMENT_MODES.cash;

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
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Balance Due:</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(balanceDue)}
            </span>
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
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
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
              value={payment.payment_mode}
              onChange={(e) =>
                setPayment((prev) => ({
                  ...prev,
                  payment_mode: e.target.value,
                  reference_number: '' // Clear reference when mode changes
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
              Reference Number
              {modeConfig.requiresRef && (
                <span className="text-red-500"> *</span>
              )}
              <span className="text-xs text-gray-500 ml-2">
                (Cheque #, Transaction ID, etc.)
              </span>
            </label>
            <input
              type="text"
              value={payment.reference_number}
              onChange={(e) =>
                setPayment((prev) => ({
                  ...prev,
                  reference_number: e.target.value
                }))
              }
              placeholder={
                modeConfig.requiresRef
                  ? `Enter ${modeConfig.label} reference`
                  : 'Optional'
              }
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            {editingPayment ? 'Update Payment' : 'Add Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;
