/**
 * Invoice Footer Notes Component
 * Displays payment terms, notes, and warehouse information
 * ONLY SHOWN ON LAST PAGE
 * Supports template-based styling for B&W printing
 */
const InvoiceFooterNotes = ({ invoice, template = null }) => {
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  const textColor = colors.text || '#333333';
  const _secondaryColor = colors.secondary || '#666666'; // Reserved for future use
  const primaryColor = colors.primary || '#000000';
  const borderColor = colors.border || '#cccccc';
  const _headerBg = colors.headerBg || '#e8e8e8'; // Reserved for future use
  const accentColor = colors.accent || '#f5f5f5';
  const fontFamily = fonts.body || 'Inter, system-ui, sans-serif';

  return (
    <div className="invoice-footer-notes" style={{ fontFamily }}>
      {/* FOOTER SECTION */}
      <div className="space-y-1.5 text-xs mb-6" style={{ color: textColor }}>
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
              <span className="font-semibold">Place of Supply (Warehouse):</span> {[invoice.warehouseName, invoice.warehouseCode, invoice.warehouseCity].filter(Boolean).join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* TAX NOTES SECTION (UAE VAT Compliance) */}
      {invoice.taxNotes && (
        <div className="mb-6 p-3" style={{
          backgroundColor: accentColor,
          borderLeft: `4px solid ${borderColor}`,
        }}>
          <h4 className="text-sm font-bold mb-2" style={{ color: primaryColor }}>Tax Notes:</h4>
          <div className="text-sm whitespace-pre-wrap" style={{ color: textColor }}>{invoice.taxNotes}</div>
        </div>
      )}

      {/* PAYMENT HISTORY (Optional) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold mb-2" style={{ color: primaryColor }}>Payment History</h3>
          <table className="w-full border-collapse" style={{ borderColor }}>
            <thead>
              <tr style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
                <th className="px-2 py-2 text-left text-sm font-bold">Sr.</th>
                <th className="px-2 py-2 text-left text-sm font-bold">Date</th>
                <th className="px-2 py-2 text-left text-sm font-bold">Method</th>
                <th className="px-2 py-2 text-left text-sm font-bold">Ref.</th>
                <th className="px-2 py-2 text-right text-sm font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? accentColor : 'white' }}>
                  <td className="px-2 py-1.5 text-sm" style={{ color: textColor }}>{index + 1}</td>
                  <td className="px-2 py-1.5 text-sm" style={{ color: textColor }}>{payment.date || ''}</td>
                  <td className="px-2 py-1.5 text-sm" style={{ color: textColor }}>{payment.method || ''}</td>
                  <td className="px-2 py-1.5 text-sm" style={{ color: textColor }}>{payment.reference || ''}</td>
                  <td className="px-2 py-1.5 text-sm text-right" style={{ color: textColor }}>AED {payment.amount || 0}</td>
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
