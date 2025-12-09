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

  // Separate status badges (invoice + payment) from other badges (reminder, promise)
  const statusBadges = badges.filter(b => b.type === 'invoice_status' || b.type === 'payment_status');
  const otherBadges = badges.filter(b => b.type !== 'invoice_status' && b.type !== 'payment_status');

  return (
    <div className="inline-flex flex-col gap-1">
      {/* Invoice status + Payment status side by side, width driven by content below */}
      {statusBadges.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {statusBadges.map((badge, index) => (
            <StatusBadge
              key={`${badge.type}-${index}`}
              label={badge.label}
              icon={badge.icon}
              config={badge.config}
              isDarkMode={isDarkMode}
              size="sm"
              fullWidth
            />
          ))}
        </div>
      )}
      {/* Reminder and promise badges below - these determine the width */}
      {otherBadges.map((badge, index) => (
        <StatusBadge
          key={`${badge.type}-${index}`}
          label={badge.label}
          icon={badge.icon}
          config={badge.config}
          isDarkMode={isDarkMode}
          onClick={badge.type === 'promise' && onPromiseClick ? () => onPromiseClick(invoice) : undefined}
          title={badge.title}
          size="sm"
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
