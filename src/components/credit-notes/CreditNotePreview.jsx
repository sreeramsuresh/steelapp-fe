/**
 * CreditNotePreview Component
 * View-only preview modal for Credit Notes.
 * Part of the unified Preview/Download system.
 *
 * Rules:
 * - Preview allowed anytime (even for incomplete/unsaved records)
 * - NO action buttons inside preview modal (only X close button)
 * - Shows validation warnings at bottom if incomplete
 */
import { useMemo } from "react";
import PropTypes from "prop-types";
import { X, AlertTriangle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  formatCurrency,
  formatAddress,
  toUAEDateProfessional,
  TIMEZONE_DISCLAIMER,
} from "../../utils/invoiceUtils";
import { validateCreditNoteForDownload } from "../../utils/recordUtils";
import { getDocumentTemplateColor } from "../../constants/defaultTemplateSettings";

const CreditNotePreview = ({ creditNote, company, onClose }) => {
  const { isDarkMode } = useTheme();

  // Get the template color for credit notes
  const templateColor = useMemo(() => {
    return getDocumentTemplateColor("creditNote", company);
  }, [company]);

  // Validate credit note and get warnings
  const validation = useMemo(() => {
    return validateCreditNoteForDownload(creditNote);
  }, [creditNote]);

  // Get status display
  const getStatusLabel = (status) => {
    const labels = {
      draft: "Draft",
      issued: "Issued",
      items_received: "Items Received",
      items_inspected: "Items Inspected",
      applied: "Applied",
      refunded: "Refunded",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  // Get type display
  const getTypeLabel = (type) => {
    const labels = {
      ACCOUNTING_ONLY: "Accounting Only",
      RETURN_WITH_QC: "Return with QC",
    };
    return labels[type] || type;
  };

  // Calculate totals - handle both naming conventions
  const subtotal = creditNote.subtotal || creditNote.sub_total || 0;
  const vatAmount = creditNote.vatAmount || creditNote.vat_amount || 0;
  const totalCredit =
    creditNote.totalCredit ||
    creditNote.total_credit ||
    parseFloat(subtotal) + parseFloat(vatAmount) ||
    0;
  const manualAmount =
    creditNote.manualCreditAmount || creditNote.manual_credit_amount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        {/* Header - Only X button (view-only) */}
        <div
          className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <h2
            className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            Credit Note Preview
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Close preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Credit Note Preview Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ background: isDarkMode ? "#1a1a2e" : "#f5f5f5" }}
        >
          {/* Document Container */}
          <div
            className={`max-w-3xl mx-auto ${isDarkMode ? "bg-gray-900" : "bg-white"} shadow-lg rounded-lg overflow-hidden`}
          >
            {/* Document Header */}
            <div
              className="text-white p-6"
              style={{ backgroundColor: templateColor }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">CREDIT NOTE</h1>
                  <p className="text-white/80 mt-1">
                    {creditNote.creditNoteNumber ||
                      creditNote.credit_note_number ||
                      "CN-DRAFT"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {company?.name || "Ultimate Steel Trading LLC"}
                  </p>
                  {(() => {
                    const addr = formatAddress(company?.address);
                    return (
                      <>
                        {addr.line1 && (
                          <p className="text-sm text-white/80">{addr.line1}</p>
                        )}
                        {addr.line2 && (
                          <p className="text-sm text-white/80">{addr.line2}</p>
                        )}
                      </>
                    );
                  })()}
                  {company?.phone && (
                    <p className="text-sm text-white/80">{company.phone}</p>
                  )}
                  {company?.vatNumber && (
                    <p className="text-sm text-white/80 font-semibold mt-1">
                      TRN: {company.vatNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div
              className={`p-6 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div>
                  <h3
                    className={`text-sm font-semibold uppercase mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Customer
                  </h3>
                  <p className="font-medium">
                    {creditNote.customer?.name || "N/A"}
                  </p>
                  {/* Customer address - handle both object and string */}
                  {(() => {
                    const addr = formatAddress(creditNote.customer?.address);
                    return (
                      <>
                        {addr.line1 && <p className="text-sm">{addr.line1}</p>}
                        {addr.line2 && <p className="text-sm">{addr.line2}</p>}
                      </>
                    );
                  })()}
                  <p className="text-sm">{creditNote.customer?.phone || ""}</p>
                  {creditNote.customer?.trn && (
                    <p className="text-sm">TRN: {creditNote.customer.trn}</p>
                  )}
                </div>

                {/* Credit Note Details */}
                <div className="text-right">
                  <div className="space-y-1">
                    <p>
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Date:{" "}
                      </span>
                      <span className="font-medium">
                        {toUAEDateProfessional(
                          creditNote.creditNoteDate ||
                            creditNote.credit_note_date,
                        ) || "Not set"}
                      </span>
                    </p>
                    <p>
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Invoice:{" "}
                      </span>
                      <span className="font-medium">
                        {creditNote.invoiceNumber ||
                          creditNote.invoice_number ||
                          creditNote.invoice?.invoice_number ||
                          "Not linked"}
                      </span>
                    </p>
                    <p>
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Status:{" "}
                      </span>
                      <span className="font-medium">
                        {getStatusLabel(creditNote.status)}
                      </span>
                    </p>
                    <p>
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Type:{" "}
                      </span>
                      <span className="font-medium">
                        {getTypeLabel(
                          creditNote.creditNoteType ||
                            creditNote.credit_note_type,
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason for Return */}
              <div
                className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
              >
                <h3
                  className={`text-sm font-semibold uppercase mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Reason for Return
                </h3>
                <p>
                  {creditNote.reasonForReturn ||
                    creditNote.reason_for_return ||
                    "Not specified"}
                </p>
              </div>

              {/* Items Table */}
              {creditNote.items && creditNote.items.length > 0 ? (
                <div className="mb-6">
                  <h3
                    className={`text-sm font-semibold uppercase mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Credited Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                        >
                          <th className="py-2 text-left text-sm font-medium">
                            Item
                          </th>
                          <th className="py-2 text-center text-sm font-medium">
                            Qty Returned
                          </th>
                          <th className="py-2 text-right text-sm font-medium">
                            Unit Price
                          </th>
                          <th className="py-2 text-right text-sm font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditNote.items
                          .filter(
                            (item) =>
                              (item.quantityReturned ||
                                item.quantity_returned ||
                                0) > 0,
                          )
                          .map((item, index) => {
                            const qty =
                              item.quantityReturned ||
                              item.quantity_returned ||
                              0;
                            const price =
                              item.unitPrice ||
                              item.unit_price ||
                              item.rate ||
                              0;
                            const amount = qty * price;
                            return (
                              <tr
                                key={index}
                                className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                              >
                                <td className="py-3">
                                  <p className="font-medium">
                                    {item.name ||
                                      item.productName ||
                                      item.product_name}
                                  </p>
                                  {item.description && (
                                    <p
                                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                      {item.description}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3 text-center">{qty}</td>
                                <td className="py-3 text-right">
                                  {formatCurrency(price)}
                                </td>
                                <td className="py-3 text-right font-medium">
                                  {formatCurrency(amount)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : manualAmount > 0 ? (
                <div
                  className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
                >
                  <h3
                    className={`text-sm font-semibold uppercase mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Manual Credit Amount
                  </h3>
                  <p
                    className="text-xl font-bold"
                    style={{ color: templateColor }}
                  >
                    {formatCurrency(manualAmount)}
                  </p>
                </div>
              ) : null}

              {/* Totals Section */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div
                    className={`flex justify-between py-2 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div
                    className={`flex justify-between py-2 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <span>VAT:</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                  {(creditNote.restockingFee || creditNote.restocking_fee) >
                    0 && (
                    <div
                      className={`flex justify-between py-2 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <span>Restocking Fee:</span>
                      <span>
                        -
                        {formatCurrency(
                          creditNote.restockingFee || creditNote.restocking_fee,
                        )}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex justify-between py-3 text-lg font-bold"
                    style={{ color: templateColor }}
                  >
                    <span>Total Credit:</span>
                    <span>{formatCurrency(totalCredit || manualAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(creditNote.notes || creditNote.internal_notes) && (
                <div
                  className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
                >
                  <h3
                    className={`text-sm font-semibold uppercase mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Notes
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {creditNote.notes || creditNote.internal_notes}
                  </p>
                </div>
              )}

              {/* Timezone Disclaimer Footer */}
              <div
                className={`mt-6 pt-3 border-t text-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <p
                  className={`text-xs italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  {TIMEZONE_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Warnings - At bottom */}
        {!validation.isValid && (
          <div
            className={`px-6 py-3 border-t ${isDarkMode ? "bg-yellow-900/20 border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className={`h-5 w-5 flex-shrink-0 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${isDarkMode ? "text-yellow-300" : "text-yellow-800"}`}
                >
                  Incomplete fields:
                </p>
                <ul
                  className={`text-sm mt-1 ml-4 list-disc ${isDarkMode ? "text-yellow-400" : "text-yellow-700"}`}
                >
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

CreditNotePreview.propTypes = {
  creditNote: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    creditNoteNumber: PropTypes.string,
    credit_note_number: PropTypes.string,
    invoiceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    invoiceNumber: PropTypes.string,
    invoice_number: PropTypes.string,
    customer: PropTypes.shape({
      name: PropTypes.string,
      address: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          street: PropTypes.string,
          city: PropTypes.string,
          state: PropTypes.string,
          postal_code: PropTypes.string,
          country: PropTypes.string,
        }),
      ]),
      phone: PropTypes.string,
      trn: PropTypes.string,
    }),
    creditNoteDate: PropTypes.string,
    credit_note_date: PropTypes.string,
    status: PropTypes.string,
    creditNoteType: PropTypes.string,
    credit_note_type: PropTypes.string,
    reasonForReturn: PropTypes.string,
    reason_for_return: PropTypes.string,
    items: PropTypes.array,
    subtotal: PropTypes.number,
    sub_total: PropTypes.number,
    vatAmount: PropTypes.number,
    vat_amount: PropTypes.number,
    totalCredit: PropTypes.number,
    total_credit: PropTypes.number,
    manualCreditAmount: PropTypes.number,
    manual_credit_amount: PropTypes.number,
    notes: PropTypes.string,
    internal_notes: PropTypes.string,
    restockingFee: PropTypes.number,
    restocking_fee: PropTypes.number,
  }).isRequired,
  company: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
    phone: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default CreditNotePreview;
