import React from 'react';
import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";

/**
 * Invoice Footer Component
 * Displays on every page at the bottom
 * Shows contact info and page numbers
 */
const InvoiceFooter = ({ company, pageNumber, totalPages, primaryColor }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  return (
    <div className="invoice-footer mt-6">
      {/* Bottom Footer Line */}
      <div className="border-t-2 pt-3" style={{ borderColor: color }}>
        <p className="text-center text-xs text-gray-700 leading-relaxed">
          Phone: {company?.phone || "+971506061680"} | Email: {company?.email || "admin@company.com"} | Website: www.ultimatesteels.com
        </p>
        <p className="text-center text-xs text-gray-500 mt-2">
          Page: {pageNumber} / {totalPages}
        </p>
      </div>
    </div>
  );
};

export default InvoiceFooter;
