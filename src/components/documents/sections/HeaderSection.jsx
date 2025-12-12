import PropTypes from 'prop-types';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatDateForInput } from '../../../utils/invoiceUtils';

// Reusable Input Component (extracted from InvoiceForm pattern)
const Input = ({ label, error, className = '', required = false, ...props }) => {
  const { isDarkMode } = useTheme();
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  const getValidationClasses = () => {
    if (error) {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1.5 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${getValidationClasses()} ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool,
};

// Reusable Select Component
const Select = ({ label, error, className = '', required = false, children, ...props }) => {
  const { isDarkMode } = useTheme();
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  const getValidationClasses = () => {
    if (error) {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-sm font-medium mb-1.5 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${getValidationClasses()} ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node,
};

// Card wrapper (extracted from InvoiceForm pattern)
const Card = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className={`rounded-lg shadow-sm border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } ${className}`}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

/**
 * HeaderSection Component
 *
 * Renders document header fields based on config.
 * Fields shown/hidden via config.headerFields and config.features.
 *
 * @param {Object} header - Document header state
 * @param {Function} setHeader - Update header function
 * @param {Object} config - Document form configuration
 * @param {boolean} disabled - Form disabled state
 */
const HeaderSection = ({ header, setHeader, config, disabled = false }) => {
  const { isDarkMode } = useTheme();

  // Helper to check if a field is visible
  const isFieldVisible = (key) => {
    const field = config.headerFields?.find(f => f.key === key);
    return field?.visible !== false;
  };

  // Helper to check if a feature is enabled
  const isFeatureEnabled = (feature) => {
    return config.features?.[feature] !== false;
  };

  const handleChange = (field, value) => {
    setHeader({ [field]: value });
  };

  return (
    <Card className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3
        className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        {config.documentLabel} Details
      </h3>

      <div className="space-y-4">
        {/* Document Number and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isFieldVisible('docNumber') && (
            <Input
              label={`${config.documentLabel} Number`}
              value={header.docNumber || ''}
              readOnly
              className="text-base"
              placeholder="Auto-generated on save"
            />
          )}

          {isFieldVisible('date') && (
            <Input
              label="Date"
              type="date"
              value={header.date ? formatDateForInput(header.date) : ''}
              onChange={(e) => handleChange('date', e.target.value)}
              disabled={disabled}
              required
              className="text-base"
            />
          )}
        </div>

        {/* Due Date and Payment Terms */}
        {(isFeatureEnabled('enableDueDate') || isFeatureEnabled('enablePaymentTerms')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isFeatureEnabled('enableDueDate') && isFieldVisible('dueDate') && (
              <Input
                label="Due Date"
                type="date"
                value={header.dueDate ? formatDateForInput(header.dueDate) : ''}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                disabled={disabled}
                className="text-base"
              />
            )}

            {isFeatureEnabled('enablePaymentTerms') && isFieldVisible('paymentTerms') && (
              <Select
                label="Payment Terms"
                value={header.paymentTerms || ''}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                disabled={disabled}
                className="text-base"
              >
                <option value="">Select payment terms</option>
                <option value="cash">Cash</option>
                <option value="credit_7">Net 7 Days</option>
                <option value="credit_15">Net 15 Days</option>
                <option value="credit_30">Net 30 Days</option>
                <option value="credit_45">Net 45 Days</option>
                <option value="credit_60">Net 60 Days</option>
                <option value="credit_90">Net 90 Days</option>
              </Select>
            )}
          </div>
        )}

        {/* Currency and Exchange Rate */}
        {isFeatureEnabled('enableCurrency') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isFieldVisible('currency') && (
              <Select
                label="Currency"
                value={header.currency || 'AED'}
                onChange={(e) => handleChange('currency', e.target.value)}
                disabled={disabled}
                className="text-base"
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </Select>
            )}

            {isFeatureEnabled('enableExchangeRate') && isFieldVisible('exchangeRate') && (
              <Input
                label="Exchange Rate"
                type="number"
                value={header.exchangeRate || 1}
                onChange={(e) => handleChange('exchangeRate', parseFloat(e.target.value) || 1)}
                min="0"
                step="0.0001"
                disabled={disabled || header.currency === 'AED'}
                className="text-base"
              />
            )}
          </div>
        )}

        {/* Emirate / Place of Supply */}
        {isFeatureEnabled('enableEmirate') && isFieldVisible('emirate') && (
          <Select
            label="Emirate / Place of Supply"
            value={header.emirate || ''}
            onChange={(e) => handleChange('emirate', e.target.value)}
            disabled={disabled}
            className="text-base"
          >
            <option value="">Select emirate</option>
            <option value="Abu Dhabi">Abu Dhabi</option>
            <option value="Dubai">Dubai</option>
            <option value="Sharjah">Sharjah</option>
            <option value="Ajman">Ajman</option>
            <option value="Umm Al Quwain">Umm Al Quwain</option>
            <option value="Ras Al Khaimah">Ras Al Khaimah</option>
            <option value="Fujairah">Fujairah</option>
          </Select>
        )}

        {/* Reference */}
        {isFeatureEnabled('enableReference') && isFieldVisible('reference') && (
          <Input
            label="Reference / PO Number"
            value={header.reference || ''}
            onChange={(e) => handleChange('reference', e.target.value)}
            disabled={disabled}
            placeholder="Purchase order or reference number"
            className="text-base"
          />
        )}

        {/* Vendor Bill specific fields */}
        {config.documentType === 'vendorBill' && (
          <>
            {isFieldVisible('vendorInvoiceNumber') && (
              <Input
                label="Vendor Invoice Number"
                value={header.vendorInvoiceNumber || ''}
                onChange={(e) => handleChange('vendorInvoiceNumber', e.target.value)}
                disabled={disabled}
                required
                placeholder="Vendor's invoice number"
                className="text-base"
              />
            )}
            {isFieldVisible('vatCategory') && (
              <Select
                label="VAT Category"
                value={header.vatCategory || 'standard'}
                onChange={(e) => handleChange('vatCategory', e.target.value)}
                disabled={disabled}
                className="text-base"
              >
                <option value="standard">Standard Rated (5%)</option>
                <option value="zero">Zero Rated (0%)</option>
                <option value="exempt">Exempt</option>
              </Select>
            )}
          </>
        )}

        {/* Quotation specific fields */}
        {config.documentType === 'quotation' && isFieldVisible('deliveryTerms') && (
          <Input
            label="Delivery Terms"
            value={header.deliveryTerms || ''}
            onChange={(e) => handleChange('deliveryTerms', e.target.value)}
            disabled={disabled}
            placeholder="e.g., FOB, CIF, Ex-Works"
            className="text-base"
          />
        )}
      </div>
    </Card>
  );
};

HeaderSection.propTypes = {
  header: PropTypes.shape({
    docNumber: PropTypes.string,
    date: PropTypes.string,
    dueDate: PropTypes.string,
    currency: PropTypes.string,
    exchangeRate: PropTypes.number,
    reference: PropTypes.string,
    paymentTerms: PropTypes.string,
    emirate: PropTypes.string,
    vendorInvoiceNumber: PropTypes.string,
    vatCategory: PropTypes.string,
    deliveryTerms: PropTypes.string,
  }).isRequired,
  setHeader: PropTypes.func.isRequired,
  config: PropTypes.shape({
    documentType: PropTypes.string.isRequired,
    documentLabel: PropTypes.string.isRequired,
    headerFields: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        visible: PropTypes.bool,
      })
    ),
    features: PropTypes.shape({
      enableDueDate: PropTypes.bool,
      enablePaymentTerms: PropTypes.bool,
      enableCurrency: PropTypes.bool,
      enableExchangeRate: PropTypes.bool,
      enableEmirate: PropTypes.bool,
      enableReference: PropTypes.bool,
    }),
  }).isRequired,
  disabled: PropTypes.bool,
};

export default HeaderSection;
