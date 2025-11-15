import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from './StatusBadge';
import { getInvoiceStatusBadges } from '../utils/invoiceStatus';

/**
 * Invoice Status Column Component
 * Displays all relevant status indicators for an invoice
 * - Invoice status (draft, issued, etc.)
 * - Payment status (unpaid, paid, etc.) - only for issued invoices
 * - Payment reminder indicator - only for unpaid/partially paid
 * - Customer promise indicator - only if promise exists
 */
const InvoiceStatusColumn = React.memo(({ invoice, isDarkMode, onPromiseClick }) => {
  // Get all badges to display
  const badges = React.useMemo(() => getInvoiceStatusBadges(invoice), [invoice]);

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {badges.map((badge, index) => (
        <StatusBadge
          key={`${badge.type}-${index}`}
          label={badge.label}
          icon={badge.icon}
          config={badge.config}
          isDarkMode={isDarkMode}
          onClick={badge.type === 'promise' && onPromiseClick ? () => onPromiseClick(invoice) : undefined}
          title={badge.title}
        />
      ))}
    </div>
  );
});

InvoiceStatusColumn.displayName = 'InvoiceStatusColumn';

InvoiceStatusColumn.propTypes = {
  invoice: PropTypes.shape({
    id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    paymentStatus: PropTypes.string,  // camelCase from invoiceService
    dueDate: PropTypes.string,
    promiseDate: PropTypes.string,
    promiseAmount: PropTypes.number,
  }).isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  onPromiseClick: PropTypes.func,
};

export default InvoiceStatusColumn;
