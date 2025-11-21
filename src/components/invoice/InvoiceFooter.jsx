import React from 'react';
import { DEFAULT_TEMPLATE_SETTINGS } from '../../constants/defaultTemplateSettings';

/**
 * Invoice Footer Component
 * Displays on every page at the bottom
 * Shows contact info and page numbers
 * Supports template-based styling for B&W printing
 */
const InvoiceFooter = ({ company, pageNumber, totalPages, primaryColor, template = null }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  const borderColor = colors.border || color;
  const textColor = colors.secondary || '#666666';
  const fontFamily = fonts.body || 'Inter, system-ui, sans-serif';

  return (
    <div className="invoice-footer mt-6" style={{ fontFamily }}>
      {/* Bottom Footer Line */}
      <div className="border-t-2 pt-3" style={{ borderColor }}>
        <p className="text-center text-xs leading-relaxed" style={{ color: textColor }}>
          Phone: {company?.phone || '+971506061680'} | Email: {company?.email || 'admin@company.com'} | Website: www.ultimatesteels.com
        </p>
        <p className="text-center text-xs mt-2" style={{ color: textColor }}>
          Page: {pageNumber} / {totalPages}
        </p>
      </div>
    </div>
  );
};

export default InvoiceFooter;
