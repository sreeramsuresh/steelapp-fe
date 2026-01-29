import { useState } from 'react';
import {
  Trash2,
  Edit2,
  Plus,
  Download,
  CheckCircle,
  Printer,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/invoiceUtils';
import {
  getPaymentModeConfig,
  formatPaymentDisplay,
  calculateTotalPaid,
  calculateBalanceDue,
} from '../utils/paymentUtils';
import {
  generatePaymentReceipt,
  printPaymentReceipt,
} from '../utils/paymentReceiptGenerator';
import ConfirmDialog from './ConfirmDialog';

const PaymentLedger = ({
  payments = [],
  invoice,
  company,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedForDelete, setSelectedForDelete] = useState(new Set());
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [printingReceiptId, setPrintingReceiptId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    count: 0,
  });

  // Calculate payment status from payments array only (industry standard)
  const invoiceTotal = invoice?.total || 0;
  const _totalPaid = calculateTotalPaid(payments);
  const balanceDue = calculateBalanceDue(invoiceTotal, payments);
  const isFullyPaid = balanceDue <= 0;

  const handleCheckboxChange = (paymentId) => {
    setSelectedForDelete((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedForDelete.size === 0) return;

    setDeleteConfirm({
      open: true,
      count: selectedForDelete.size,
    });
  };

  const confirmPaymentDelete = () => {
    selectedForDelete.forEach((paymentId) => {
      onDeletePayment(paymentId);
    });
    setSelectedForDelete(new Set());
  };

  const handleDownloadReceipt = async (payment, paymentIndex) => {
    if (!invoice || !company) {
      alert(
        'Unable to generate receipt. Missing invoice or company information.',
      );
      return;
    }

    setDownloadingReceiptId(payment.id);
    try {
      const result = await generatePaymentReceipt(
        payment,
        invoice,
        company,
        paymentIndex,
      );
      if (result.success) {
        // Success - PDF will be automatically downloaded
      } else {
        alert(`Error generating receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    if (!invoice || !company) {
      alert('Unable to print receipt. Missing invoice or company information.');
      return;
    }

    setPrintingReceiptId(payment.id);
    try {
      const result = await printPaymentReceipt(
        payment,
        invoice,
        company,
        paymentIndex,
      );
      if (result.success) {
        // Success - PDF will be opened in new tab with print dialog
      } else {
        alert(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt. Please try again.');
    } finally {
      setPrintingReceiptId(null);
    }
  };

  // Sort payments by date (oldest first for chronological order)
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const hasAnyPayments = sortedPayments.length > 0;

  return (
    <div
      className={`rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            📝 Payment History
          </h3>
          <div className="flex items-center gap-2">
            {selectedForDelete.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 size={18} />
                Delete Selected ({selectedForDelete.size})
              </button>
            )}
            {isFullyPaid ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
                <CheckCircle size={18} />
                Fully Paid
              </div>
            ) : (
              <button
                onClick={onAddPayment}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Add Payment
              </button>
            )}
          </div>
        </div>
        {!isFullyPaid && balanceDue > 0 && (
          <div
            className={`text-sm px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-orange-900/30 text-orange-400'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            <span className="font-medium">Remaining Balance:</span>{' '}
            <span className="font-bold">{formatCurrency(balanceDue)}</span>
          </div>
        )}
      </div>

      {/* Payment Table */}
      {!hasAnyPayments ? (
        <div className="p-8 text-center">
          <p
            className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            No payments recorded yet. Click &quot;Add Payment&quot; to record a
            payment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={`border-b ${
                isDarkMode
                  ? 'bg-gray-900/50 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <tr>
                <th
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedForDelete.size === sortedPayments.length &&
                      sortedPayments.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Only select regular payments, not advance payment
                        setSelectedForDelete(
                          new Set(sortedPayments.map((p) => p.id)),
                        );
                      } else {
                        setSelectedForDelete(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded cursor-pointer"
                    disabled={sortedPayments.length === 0}
                  />
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  #
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Date
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Amount
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Mode
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Reference
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Notes
                </th>
                <th
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment, index) => {
                const formatted = formatPaymentDisplay(payment);
                const modeConfig = getPaymentModeConfig(
                  payment.paymentMode || payment.paymentMethod,
                );
                const isSelected = selectedForDelete.has(payment.id);

                return (
                  <tr
                    key={payment.id}
                    className={`border-b ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-700/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${isSelected ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(payment.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>

                    {/* Serial Number */}
                    <td
                      className={`px-4 py-3 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </td>

                    {/* Date */}
                    <td
                      className={`px-4 py-3 text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}
                    >
                      {formatted.formattedDate}
                    </td>

                    {/* Amount */}
                    <td
                      className={`px-4 py-3 text-sm font-semibold text-right ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}
                    >
                      {formatted.formattedAmount}
                    </td>

                    {/* Payment Mode */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <span>{modeConfig.icon}</span>
                        <span>{modeConfig.label}</span>
                      </span>
                    </td>

                    {/* Reference Number */}
                    <td
                      className={`px-4 py-3 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {payment.referenceNumber || '-'}
                    </td>

                    {/* Notes */}
                    <td
                      className={`px-4 py-3 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                      title={payment.notes}
                    >
                      {payment.notes
                        ? payment.notes.length > 30
                          ? `${payment.notes.substring(0, 30)}...`
                          : payment.notes
                        : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handlePrintReceipt(payment, index)}
                          disabled={printingReceiptId === payment.id}
                          className={`p-1.5 rounded transition-colors ${
                            printingReceiptId === payment.id
                              ? 'opacity-50 cursor-not-allowed'
                              : isDarkMode
                                ? 'hover:bg-purple-900/50 text-purple-400 hover:text-purple-300'
                                : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                          }`}
                          title="Print payment receipt"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(payment, index)}
                          disabled={downloadingReceiptId === payment.id}
                          className={`p-1.5 rounded transition-colors ${
                            downloadingReceiptId === payment.id
                              ? 'opacity-50 cursor-not-allowed'
                              : isDarkMode
                                ? 'hover:bg-teal-900/50 text-teal-400 hover:text-teal-300'
                                : 'hover:bg-teal-50 text-teal-600 hover:text-teal-700'
                          }`}
                          title="Download payment receipt"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => onEditPayment(payment)}
                          disabled={isFullyPaid}
                          className={`p-1.5 rounded transition-colors ${
                            isFullyPaid
                              ? 'opacity-50 cursor-not-allowed text-gray-400'
                              : isDarkMode
                                ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                          }`}
                          title={
                            isFullyPaid
                              ? 'Cannot edit - invoice fully paid'
                              : 'Edit payment'
                          }
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <ConfirmDialog
          title="Delete Payments?"
          message={`Are you sure you want to delete ${deleteConfirm.count} payment(s)? This action cannot be undone.`}
          variant="danger"
          onConfirm={() => {
            confirmPaymentDelete();
            setDeleteConfirm({ open: false, count: 0 });
          }}
          onCancel={() => setDeleteConfirm({ open: false, count: 0 })}
        />
      )}
    </div>
  );
};

export default PaymentLedger;
