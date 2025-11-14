import React from 'react';

/**
 * Invoice Footer Notes Component
 * Displays payment terms, notes, and warehouse information
 * ONLY SHOWN ON LAST PAGE
 */
const InvoiceFooterNotes = ({ invoice }) => {
  return (
    <div className="invoice-footer-notes">
      {/* FOOTER SECTION */}
      <div className="space-y-1.5 text-xs text-gray-700 mb-6">
        {invoice.terms && (
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <span className="font-semibold">Payment Term:</span> {invoice.terms}
            </div>
          </div>
        )}
        {invoice.notes && (
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <span className="font-semibold">Comment:</span> {invoice.notes}
            </div>
          </div>
        )}
        {(invoice.warehouseName || invoice.warehouseCode) && (
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <span className="font-semibold">Place of Supply (Warehouse):</span> {[invoice.warehouseName, invoice.warehouseCode, invoice.warehouseCity].filter(Boolean).join(", ")}
            </div>
          </div>
        )}
      </div>

      {/* TAX NOTES SECTION (UAE VAT Compliance) */}
      {invoice.taxNotes && (
        <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-500">
          <h4 className="text-sm font-bold text-yellow-900 mb-2">Tax Notes:</h4>
          <div className="text-sm text-yellow-800 whitespace-pre-wrap">{invoice.taxNotes}</div>
        </div>
      )}

      {/* PAYMENT HISTORY (Optional) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-2">Payment History</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-white bg-gray-700">
                <th className="px-2 py-2 text-left text-sm font-bold">Sr.</th>
                <th className="px-2 py-2 text-left text-sm font-bold">Date</th>
                <th className="px-2 py-2 text-left text-sm font-bold">Method</th>
                <th className="px-2 py-2 text-left text-sm font-bold">Ref.</th>
                <th className="px-2 py-2 text-right text-sm font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 py-1.5 text-sm">{index + 1}</td>
                  <td className="px-2 py-1.5 text-sm">{payment.date || ""}</td>
                  <td className="px-2 py-1.5 text-sm">{payment.method || ""}</td>
                  <td className="px-2 py-1.5 text-sm">{payment.reference || ""}</td>
                  <td className="px-2 py-1.5 text-sm text-right">AED {payment.amount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceFooterNotes;
