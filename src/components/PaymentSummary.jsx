import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/invoiceUtils';
import {
  calculateTotalPaid,
  calculateBalanceDue,
  calculatePaymentStatus,
  getPaymentStatusConfig,
} from '../utils/paymentUtils';

const PaymentSummary = ({ invoiceTotal, payments = [] }) => {
  const { isDarkMode } = useTheme();

  const totalPaid = calculateTotalPaid(payments);
  const balanceDue = calculateBalanceDue(invoiceTotal, payments);
  const paymentStatus = calculatePaymentStatus(invoiceTotal, payments);
  const statusConfig = getPaymentStatusConfig(paymentStatus);

  return (
    <div
      className={`p-4 rounded-lg border ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        💰 Payment Summary
      </h3>

      <div className="space-y-3">
        {/* Invoice Total */}
        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Invoice Total:
          </span>
          <span
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {formatCurrency(invoiceTotal)}
          </span>
        </div>

        {/* Total Paid */}
        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Total Paid:
          </span>
          <span
            className={`text-lg font-semibold ${
              totalPaid > 0
                ? 'text-green-600 dark:text-green-400'
                : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }`}
          >
            {formatCurrency(totalPaid)}
          </span>
        </div>

        {/* Balance Due */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
          <span
            className={`text-sm font-bold ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}
          >
            Balance Due:
          </span>
          <span
            className={`text-xl font-bold ${
              balanceDue > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {formatCurrency(balanceDue)}
          </span>
        </div>

        {/* Payment Status Badge */}
        <div className="pt-3">
          <div className="flex justify-center">
            <span
              className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border ${
                isDarkMode
                  ? `${statusConfig.bgDark} ${statusConfig.textDark} ${statusConfig.borderDark}`
                  : `${statusConfig.bgLight} ${statusConfig.textLight} ${statusConfig.borderLight}`
              }`}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Payment Count */}
        {payments.length > 0 && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
            {payments.length} payment{payments.length !== 1 ? 's' : ''} received
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSummary;
