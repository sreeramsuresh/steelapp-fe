import {
  X,
  CircleDollarSign,
  AlertCircle,
  CheckCircle,
  Trash2,
  Printer,
  Download,
} from 'lucide-react';
import AddPaymentForm from './AddPaymentForm';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';

/**
 * Unified Payment Drawer Component
 * Used by both InvoiceList and Receivables pages
 * Combines all features: payment recording, void management, receipt generation, presence tracking
 *
 * @param {object} invoice - The invoice object to display payments for
 * @param {boolean} isOpen - Whether the drawer is open
 * @param {function} onClose - Callback when drawer is closed
 * @param {function} onAddPayment - Callback when payment is added
 * @param {boolean} isSaving - Whether payment save is in progress
 * @param {boolean} canManage - Whether user can manage payments
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @param {array} otherSessions - Other users viewing/editing (presence tracking)
 * @param {function} onPrintReceipt - Callback to print receipt
 * @param {function} onDownloadReceipt - Callback to download receipt
 * @param {function} onVoidPayment - Callback to void a payment
 * @param {boolean} isVoidingPayment - Whether void operation is in progress
 * @param {number} voidDropdownPaymentId - ID of payment with void dropdown open
 * @param {function} onVoidDropdownToggle - Callback to toggle void dropdown
 * @param {string} voidCustomReason - Custom void reason input value
 * @param {function} onVoidCustomReasonChange - Callback when void reason changes
 * @param {function} onSubmitCustomVoidReason - Callback to submit custom void reason
 * @param {number} downloadingReceiptId - ID of receipt being downloaded
 * @param {number} printingReceiptId - ID of receipt being printed
 * @param {array} PAYMENT_MODES - Payment method configuration
 * @param {array} VOID_REASONS - Void reason options
 */
const PaymentDrawer = ({
  invoice,
  isOpen,
  onClose,
  onAddPayment,
  isSaving = false,
  canManage = true,
  isDarkMode = false,
  otherSessions = [],
  onPrintReceipt,
  onDownloadReceipt,
  onVoidPayment,
  isVoidingPayment = false,
  voidDropdownPaymentId = null,
  onVoidDropdownToggle,
  voidCustomReason = '',
  onVoidCustomReasonChange,
  onSubmitCustomVoidReason,
  downloadingReceiptId = null,
  printingReceiptId = null,
  PAYMENT_MODES = {},
  VOID_REASONS = [],
}) => {
  if (!isOpen || !invoice) return null;

  const invoiceAmount =
    invoice.invoiceAmount || invoice.totalAmount || invoice.total || 0;
  const received = invoice.received || 0;
  const outstanding = invoice.outstanding || 0;

  // Compute actual status from amounts (not from potentially stale paymentStatus field)
  const computedStatus = (() => {
    if (outstanding <= 0 && invoiceAmount > 0) return 'paid';
    if (received > 0 && outstanding > 0) return 'partially_paid';
    return 'unpaid';
  })();

  const getPaymentStatusColor = () => {
    switch (computedStatus) {
      case 'paid':
        return isDarkMode
          ? 'bg-green-900/30 text-green-400 border-green-700'
          : 'bg-green-100 text-green-800 border-green-300';
      case 'partially_paid':
        return isDarkMode
          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
          : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return isDarkMode
          ? 'bg-red-900/30 text-red-400 border-red-700'
          : 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getPaymentStatusLabel = () => {
    switch (computedStatus) {
      case 'paid':
        return 'Paid';
      case 'partially_paid':
        return 'Partially Paid';
      default:
        return 'Unpaid';
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 sm:relative sm:flex-1"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close drawer"
      ></div>

      {/* Drawer */}
      <div
        className={`relative z-10 w-full sm:max-w-xl h-full overflow-auto ${
          isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'
        } shadow-xl`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">
              {invoice.invoiceNo || invoice.invoiceNumber}
            </div>
            <div className="text-sm opacity-70">
              {invoice.customer?.name || ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor()}`}
            >
              {getPaymentStatusLabel()}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Presence Banner - Shows other users viewing/editing */}
        {otherSessions && otherSessions.length > 0 && (
          <div
            className={`mx-4 mt-3 px-3 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-amber-900/30 border-amber-700 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            } text-sm flex items-center gap-2`}
          >
            <span>⚠️</span>
            <span>
              Currently being edited by{' '}
              <strong>
                {[...new Set(otherSessions.map((s) => s.userName))].join(', ')}
              </strong>
              . Your changes may conflict.
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Invoice Summary Section */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-700'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
            }`}
          >
            <div
              className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                isDarkMode ? 'text-blue-100' : 'text-blue-900'
              }`}
            >
              <CircleDollarSign size={18} />
              Invoice Summary
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm mb-3">
              <div>
                <div
                  className={`text-xs mb-1 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}
                >
                  Total Amount
                </div>
                <div
                  className={`font-bold text-lg ${
                    isDarkMode ? 'text-blue-100' : 'text-blue-900'
                  }`}
                >
                  {formatCurrency(invoiceAmount)}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs mb-1 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}
                >
                  Paid Amount
                </div>
                <div
                  className={`font-bold text-lg ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(received)}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs mb-1 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}
                >
                  Balance Due
                </div>
                <div
                  className={`font-bold text-lg ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(outstanding)}
                </div>
              </div>
            </div>
            <div
              className={`pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
                isDarkMode
                  ? 'border-blue-700 text-blue-300'
                  : 'border-blue-300 text-blue-700'
              }`}
            >
              <div>
                <strong>Invoice Date:</strong>{' '}
                {formatDate(invoice.invoiceDate) || 'N/A'}
              </div>
              <div
                className={
                  computedStatus === 'paid' ? 'opacity-50 line-through' : ''
                }
              >
                <strong>Due Date:</strong>{' '}
                {formatDate(invoice.dueDate) || 'N/A'}
                {computedStatus === 'paid' && (
                  <span className="ml-1 no-underline">(Cleared)</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <div className="font-semibold mb-3">Payment History</div>

            {(invoice.payments || []).length === 0 ? (
              <div
                className={`text-sm p-4 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                No payments recorded yet.
              </div>
            ) : (
              <div
                className={`rounded-lg border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                {/* Header Row */}
                <div
                  className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-400 border-b border-gray-700'
                      : 'bg-gray-100 text-gray-600 border-b border-gray-200'
                  }`}
                >
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Method</div>
                  <div className="col-span-2">Ref</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-4 text-center">Action</div>
                </div>

                {/* Payment Rows */}
                <div
                  className={`divide-y ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}
                >
                  {[...(invoice.payments || [])]
                    .sort((a, b) => {
                      const dateA = new Date(
                        a.paymentDate || a.payment_date || 0,
                      );
                      const dateB = new Date(
                        b.paymentDate || b.payment_date || 0,
                      );

                      // Primary sort: by date (newest first)
                      if (dateB.getTime() !== dateA.getTime()) {
                        return dateB - dateA;
                      }

                      // Secondary sort: by ID descending (most recent payment first when dates are the same)
                      const idA = a.id || a.paymentId || a.payment_id || 0;
                      const idB = b.id || b.paymentId || b.payment_id || 0;
                      return idB - idA;
                    })
                    .map((p, idx) => {
                      const methodValue =
                        p.paymentMethod || p.payment_method || p.method || '';
                      const normalizedMethod = String(methodValue)
                        .replace(/^PAYMENT_METHOD_/i, '')
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '_');
                      const paymentMode =
                        PAYMENT_MODES[normalizedMethod] || PAYMENT_MODES.other;
                      const isVoided = p.voided || p.voidedAt || p.voided_at;
                      const voidReason = p.voidReason || p.void_reason;
                      const voidedBy = p.voidedBy || p.voided_by;
                      const voidedAt = p.voidedAt || p.voided_at;

                      // VAT Compliance Fields (Migration 113-114)
                      const receiptNumber =
                        p.receiptNumber || p.receipt_number || '';
                      const receiptStatus =
                        p.receiptStatus || p.receipt_status || 'draft';
                      const isAdvancePayment =
                        p.isAdvancePayment || p.is_advance_payment || false;

                      const isDropdownOpen = voidDropdownPaymentId === p.id;
                      const isDownloading = downloadingReceiptId === p.id;
                      const isPrinting = printingReceiptId === p.id;

                      return (
                        <div
                          key={p.id || idx}
                          className={`${
                            isDarkMode ? 'bg-gray-900/50' : 'bg-white'
                          } ${isVoided ? 'opacity-70' : ''}`}
                        >
                          {/* Main Payment Row */}
                          <div className="grid grid-cols-12 gap-2 px-3 py-3 items-center text-sm">
                            {/* Date */}
                            <div
                              className={`col-span-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              {formatDate(p.paymentDate || p.payment_date)}
                            </div>

                            {/* Method with Icon */}
                            <div
                              className={`col-span-2 flex items-center gap-1 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              <span>{paymentMode?.icon || ''}</span>
                              <span className="truncate">
                                {paymentMode?.label || methodValue}
                              </span>
                            </div>

                            {/* Reference */}
                            <div
                              className={`col-span-2 truncate ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {p.referenceNo ||
                                p.referenceNumber ||
                                p.reference_no ||
                                '-'}
                            </div>

                            {/* Amount */}
                            <div
                              className={`col-span-2 text-right font-medium ${
                                isVoided
                                  ? 'line-through text-gray-400'
                                  : isDarkMode
                                    ? 'text-green-400'
                                    : 'text-green-600'
                              }`}
                            >
                              {formatCurrency(p.amount || 0)}
                            </div>

                            {/* Action Column */}
                            <div className="col-span-4 flex justify-center items-center gap-1">
                              {isVoided ? (
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                                    isDarkMode
                                      ? 'bg-red-900/50 text-red-400'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  VOIDED
                                </span>
                              ) : (
                                <>
                                  {/* Receipt Status Badge (FTA Compliance) */}
                                  {receiptNumber && (
                                    <span
                                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                                        receiptStatus === 'printed'
                                          ? isDarkMode
                                            ? 'bg-blue-900/50 text-blue-400'
                                            : 'bg-blue-100 text-blue-700'
                                          : isDarkMode
                                            ? 'bg-amber-900/50 text-amber-400'
                                            : 'bg-amber-100 text-amber-700'
                                      }`}
                                      title={`Receipt: ${receiptNumber}${isAdvancePayment ? ' (Advance Payment)' : ''}`}
                                    >
                                      {receiptStatus === 'printed'
                                        ? '✓ PRINTED'
                                        : 'DRAFT'}
                                    </span>
                                  )}

                                  {/* Print Receipt Button */}
                                  {onPrintReceipt && (
                                    <button
                                      onClick={() => onPrintReceipt(p, idx + 1)}
                                      disabled={isPrinting}
                                      className={`p-1.5 rounded transition-colors ${
                                        isPrinting
                                          ? 'opacity-50 cursor-not-allowed'
                                          : isDarkMode
                                            ? 'text-purple-400 hover:bg-purple-900/30'
                                            : 'text-purple-600 hover:bg-purple-50'
                                      }`}
                                      title="Print payment receipt"
                                    >
                                      <Printer size={14} />
                                    </button>
                                  )}

                                  {/* Download Receipt Button */}
                                  {onDownloadReceipt && (
                                    <button
                                      onClick={() =>
                                        onDownloadReceipt(p, idx + 1)
                                      }
                                      disabled={isDownloading}
                                      className={`p-1.5 rounded transition-colors ${
                                        isDownloading
                                          ? 'opacity-50 cursor-not-allowed'
                                          : isDarkMode
                                            ? 'text-teal-400 hover:bg-teal-900/30'
                                            : 'text-teal-600 hover:bg-teal-50'
                                      }`}
                                      title="Download payment receipt"
                                    >
                                      <Download size={14} />
                                    </button>
                                  )}

                                  {/* Void Button */}
                                  {onVoidPayment && (
                                    <button
                                      onClick={() =>
                                        onVoidDropdownToggle(
                                          isDropdownOpen ? null : p.id,
                                        )
                                      }
                                      disabled={isVoidingPayment}
                                      className={`p-1.5 rounded transition-colors ${
                                        isDarkMode
                                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                      } ${
                                        isVoidingPayment
                                          ? 'opacity-50 cursor-not-allowed'
                                          : ''
                                      }`}
                                      title="Void payment"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}

                                  {/* Void Reason Dropdown */}
                                  {onVoidPayment && isDropdownOpen && (
                                    <div
                                      className={`void-dropdown absolute right-0 top-full mt-1 z-[9999] w-56 rounded-lg shadow-xl border ${
                                        isDarkMode
                                          ? 'bg-gray-800 border-gray-700'
                                          : 'bg-white border-gray-200'
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape')
                                          onVoidDropdownToggle(null);
                                      }}
                                      role="menu"
                                      tabIndex={-1}
                                    >
                                      <div
                                        className={`px-3 py-2 text-xs font-semibold border-b ${
                                          isDarkMode
                                            ? 'text-gray-400 border-gray-700'
                                            : 'text-gray-500 border-gray-200'
                                        }`}
                                      >
                                        Select void reason
                                      </div>
                                      <div className="py-1">
                                        {VOID_REASONS.map((reason) => (
                                          <button
                                            key={reason.value}
                                            onClick={() =>
                                              onVoidPayment(p.id, reason.value)
                                            }
                                            disabled={isVoidingPayment}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                              isDarkMode
                                                ? 'text-gray-300 hover:bg-gray-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            } ${
                                              isVoidingPayment
                                                ? 'opacity-50'
                                                : ''
                                            }`}
                                          >
                                            {reason.label}
                                          </button>
                                        ))}
                                      </div>

                                      {/* Custom reason input */}
                                      <div
                                        className={`px-3 py-2 border-t ${
                                          isDarkMode
                                            ? 'border-gray-700'
                                            : 'border-gray-200'
                                        }`}
                                      >
                                        <input
                                          type="text"
                                          value={voidCustomReason}
                                          onChange={(e) =>
                                            onVoidCustomReasonChange(
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Or type custom reason..."
                                          className={`w-full px-2 py-1.5 text-sm rounded border ${
                                            isDarkMode
                                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                          }`}
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === 'Enter' &&
                                              voidCustomReason.trim()
                                            ) {
                                              onSubmitCustomVoidReason(p.id);
                                            }
                                          }}
                                        />
                                        {voidCustomReason.trim() && (
                                          <button
                                            onClick={() =>
                                              onSubmitCustomVoidReason(p.id)
                                            }
                                            disabled={isVoidingPayment}
                                            className={`mt-2 w-full px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                              isDarkMode
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                            } ${
                                              isVoidingPayment
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                            }`}
                                          >
                                            {isVoidingPayment
                                              ? 'Voiding...'
                                              : 'Void with this reason'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Notes Row */}
                          {(p.notes || p.receiptNumber) && (
                            <div
                              className={`px-3 pb-2 -mt-1 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}
                            >
                              {p.receiptNumber && (
                                <div
                                  className={`text-xs font-semibold ${
                                    isDarkMode
                                      ? 'text-teal-400'
                                      : 'text-teal-600'
                                  }`}
                                >
                                  Receipt: {p.receiptNumber}
                                </div>
                              )}
                              {p.notes && (
                                <div className="text-xs mt-0.5 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                  {p.notes}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Voided Info Row */}
                          {isVoided && (
                            <div className="px-3 pb-2 -mt-1">
                              <div
                                className={`text-xs flex items-center gap-1 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}
                              >
                                <AlertCircle size={12} />
                                <span>
                                  Voided: {voidReason || 'No reason provided'}
                                  {voidedBy && ` (${voidedBy}`}
                                  {voidedAt && `, ${formatDate(voidedAt)}`}
                                  {voidedBy && ')'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Add Payment Section */}
          {outstanding > 0 ? (
            <AddPaymentForm
              outstanding={outstanding}
              onSave={onAddPayment}
              onCancel={onClose}
              isSaving={isSaving}
            />
          ) : invoiceAmount === 0 ? (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 ${
                isDarkMode
                  ? 'border-amber-700 bg-amber-900/30 text-amber-400'
                  : 'border-amber-300 bg-amber-50 text-amber-700'
              }`}
            >
              <CheckCircle size={18} />
              <span className="font-medium">
                No Payment Required (Zero Invoice)
              </span>
            </div>
          ) : (
            <>
              {!canManage && (
                <div
                  className={`p-3 rounded-lg border text-sm ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800/50 text-gray-400'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  You don&apos;t have permission to add payments.
                </div>
              )}
              <div
                className={`p-3 rounded-lg border flex items-center gap-2 ${
                  isDarkMode
                    ? 'border-green-700 bg-green-900/30 text-green-400'
                    : 'border-green-300 bg-green-50 text-green-700'
                }`}
              >
                <CheckCircle size={18} />
                <span className="font-medium">Invoice Fully Paid</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDrawer;
