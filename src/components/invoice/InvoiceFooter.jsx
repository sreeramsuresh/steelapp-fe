import { DEFAULT_TEMPLATE_SETTINGS } from '../../constants/defaultTemplateSettings';
import { TIMEZONE_DISCLAIMER } from '../../utils/invoiceUtils';

/**
 * Invoice Footer Component
 * Displays on every page at the bottom
 * Shows contact info, timezone disclaimer, and page numbers
 * Supports template-based styling for B&W printing
 *
 * CSS Properties:
 * - page-break-inside: avoid - Prevents page breaks within this component
 * - break-inside: avoid - Modern equivalent for preventing breaks
 */
const InvoiceFooter = ({ company, pageNumber, totalPages, primaryColor, template = null }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  const borderColor = colors.border || color;
  const textColor = colors.secondary || '#666666';
  const fontFamily = fonts.body || 'Inter, system-ui, sans-serif';

  return (
    <div
      className="invoice-footer mt-6"
      style={{
        fontFamily,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Bottom Footer Line */}
      <div className="border-t-2 pt-3" style={{ borderColor }}>
        <p className="text-center text-xs leading-relaxed" style={{ color: textColor }}>
          Phone: {company?.phone || '+971506061680'} | Email: {company?.email || 'admin@company.com'} | Website: www.ultimatesteels.com
        </p>
        {/* Timezone Disclaimer - Important for international business */}
        <p className="text-center text-xs mt-1 italic" style={{ color: textColor }}>
          {TIMEZONE_DISCLAIMER}
        </p>
        <p className="text-center text-xs mt-2" style={{ color: textColor }}>
          Page: {pageNumber} / {totalPages}
        </p>
      </div>
    </div>
  );
};

export default InvoiceFooter;
