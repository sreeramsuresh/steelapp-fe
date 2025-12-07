/**
 * Invoice Footer Notes Component
 * Displays payment terms, notes, and warehouse information
 * ONLY SHOWN ON LAST PAGE
 */
const InvoiceFooterNotes = ({ invoice, template = null }) => {
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  const textColor = colors.text || '#555';
  const primaryColor = colors.primary || '#111';
  const borderColor = colors.border || '#e5e7eb';
  const accentColor = colors.accent || '#f9fafb';
  const fontFamily = fonts.body || 'Inter, system-ui, sans-serif';

  const hasTermsContent = invoice.terms || invoice.notes || invoice.warehouseName || invoice.warehouseCode;

  return (
    <div
      className="invoice-footer-notes"
      style={{
        fontFamily,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {hasTermsContent && (
        <div
          className="terms-section"
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: primaryColor,
            }}
          >
            Terms & Conditions:
          </h3>

          <div style={{
            fontSize: '11px',
            lineHeight: 1.6,
            color: textColor,
            marginBottom: '20px',
          }}>
            {invoice.terms && (
              <div className="whitespace-pre-wrap">{invoice.terms}</div>
            )}
            {invoice.notes && (
              <div className="flex items-start mt-2">
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
        </div>
      )}

      {invoice.taxNotes && (
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f0f9ff',
          borderLeft: `3px solid ${primaryColor}`,
        }}>
          <h4 style={{
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: primaryColor,
          }}>Tax Notes:</h4>
          <div style={{
            fontSize: '11px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            color: textColor,
          }}>{invoice.taxNotes}</div>
        </div>
      )}

      {invoice.payments && invoice.payments.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: primaryColor,
          }}>Payment History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}` }}>
            <thead>
              <tr style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: '10.5px', fontWeight: 'bold' }}>Sr.</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: '10.5px', fontWeight: 'bold' }}>Date</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: '10.5px', fontWeight: 'bold' }}>Method</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: '10.5px', fontWeight: 'bold' }}>Ref.</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontSize: '10.5px', fontWeight: 'bold' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? accentColor : 'white' }}>
                  <td style={{ padding: '12px 10px', fontSize: '10px', color: textColor }}>{index + 1}</td>
                  <td style={{ padding: '12px 10px', fontSize: '10px', color: textColor }}>{payment.date || ''}</td>
                  <td style={{ padding: '12px 10px', fontSize: '10px', color: textColor }}>{payment.method || ''}</td>
                  <td style={{ padding: '12px 10px', fontSize: '10px', color: textColor }}>{payment.reference || ''}</td>
                  <td style={{ padding: '12px 10px', fontSize: '10px', textAlign: 'right', color: textColor }}>AED {payment.amount || 0}</td>
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
