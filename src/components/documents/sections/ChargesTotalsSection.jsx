import PropTypes from 'prop-types';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatCurrency } from '../../../utils/invoiceUtils';

// Reusable Card Component
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

// Input Component
const Input = ({ label, type = 'text', value, onChange, disabled, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={className}>
      {label && (
        <label
          className={`block text-sm font-medium mb-1.5 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white'
            : 'border-gray-300 bg-white text-gray-900'
        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
        {...props}
      />
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * ChargesTotalsSection Component
 *
 * Renders additional charges and totals summary.
 * Shows only enabled charges from config.chargeTypes.
 *
 * @param {Object} charges - Charges state
 * @param {Function} setCharge - Update charge function
 * @param {Object} totals - Calculated totals
 * @param {Object} discount - Invoice-level discount
 * @param {Function} setDiscount - Update discount function
 * @param {Object} config - Document form configuration
 */
const ChargesTotalsSection = ({
  charges,
  setCharge,
  totals,
  discount,
  setDiscount,
  config,
}) => {
  const { isDarkMode } = useTheme();

  // Helper to check if a charge type is enabled
  const isChargeEnabled = (chargeKey) => {
    const chargeConfig = config.chargeTypes?.find(c => c.key === chargeKey);
    return chargeConfig?.enabled !== false;
  };

  // Helper to get charge label
  const getChargeLabel = (chargeKey) => {
    const chargeConfig = config.chargeTypes?.find(c => c.key === chargeKey);
    return chargeConfig?.label || chargeKey;
  };

  const handleChargeChange = (chargeType, value) => {
    const amount = parseFloat(value) || 0;
    setCharge(chargeType, amount);
  };

  const handleDiscountChange = (field, value) => {
    if (field === 'type') {
      setDiscount({ ...discount, type: value });
    } else {
      setDiscount({ ...discount, value: parseFloat(value) || 0 });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* LEFT COLUMN: Additional Charges */}
      {config.features?.enableAdditionalCharges && (
        <Card className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3
            className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Additional Charges
          </h3>

          <div className="space-y-3">
            {/* Packing Charges */}
            {isChargeEnabled('packing') && (
              <div>
                <Input
                  label={getChargeLabel('packing')}
                  type="number"
                  value={charges.packing?.amount || ''}
                  onChange={(e) => handleChargeChange('packing', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {config.features?.enableVat && (
                  <div
                    className={`text-xs mt-1 px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    VAT: {formatCurrency(charges.packing?.vatAmount || 0)}
                  </div>
                )}
              </div>
            )}

            {/* Freight Charges */}
            {isChargeEnabled('freight') && (
              <div>
                <Input
                  label={getChargeLabel('freight')}
                  type="number"
                  value={charges.freight?.amount || ''}
                  onChange={(e) => handleChargeChange('freight', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {config.features?.enableVat && (
                  <div
                    className={`text-xs mt-1 px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    VAT: {formatCurrency(charges.freight?.vatAmount || 0)}
                  </div>
                )}
              </div>
            )}

            {/* Insurance Charges */}
            {isChargeEnabled('insurance') && (
              <div>
                <Input
                  label={getChargeLabel('insurance')}
                  type="number"
                  value={charges.insurance?.amount || ''}
                  onChange={(e) => handleChargeChange('insurance', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {config.features?.enableVat && (
                  <div
                    className={`text-xs mt-1 px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    VAT: {formatCurrency(charges.insurance?.vatAmount || 0)}
                  </div>
                )}
              </div>
            )}

            {/* Loading Charges */}
            {isChargeEnabled('loading') && (
              <div>
                <Input
                  label={getChargeLabel('loading')}
                  type="number"
                  value={charges.loading?.amount || ''}
                  onChange={(e) => handleChargeChange('loading', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {config.features?.enableVat && (
                  <div
                    className={`text-xs mt-1 px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    VAT: {formatCurrency(charges.loading?.vatAmount || 0)}
                  </div>
                )}
              </div>
            )}

            {/* Other Charges */}
            {isChargeEnabled('other') && (
              <div>
                <Input
                  label={getChargeLabel('other')}
                  type="number"
                  value={charges.other?.amount || ''}
                  onChange={(e) => handleChargeChange('other', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {config.features?.enableVat && (
                  <div
                    className={`text-xs mt-1 px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    VAT: {formatCurrency(charges.other?.vatAmount || 0)}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* RIGHT COLUMN: Totals */}
      <Card className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3
          className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          Summary & Totals
        </h3>

        <div className="space-y-4">
          {/* Subtotal */}
          <div
            className={`flex justify-between items-center ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(totals.subtotal || 0)}</span>
          </div>

          {/* Invoice-level Discount */}
          {config.features?.enableInvoiceDiscount && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={discount.type || 'percent'}
                  onChange={(e) => handleDiscountChange('type', e.target.value)}
                  className={`px-2 py-1 border rounded text-sm ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="percent">%</option>
                  <option value="amount">Amount</option>
                </select>
                <input
                  type="number"
                  value={discount.value || ''}
                  onChange={(e) => handleDiscountChange('value', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Discount"
                  className={`flex-1 px-2 py-1 border rounded text-sm ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
              <div
                className={`flex justify-between items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span>Discount:</span>
                <span className="font-medium text-red-600">
                  - {formatCurrency(totals.discountAmount || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Additional Charges Total */}
          {config.features?.enableAdditionalCharges && (
            <div
              className={`flex justify-between items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              <span>Additional Charges:</span>
              <span className="font-medium">{formatCurrency(totals.chargesTotal || 0)}</span>
            </div>
          )}

          {/* VAT */}
          {config.features?.enableVat && (
            <>
              <div
                className={`flex justify-between items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span>VAT (5%):</span>
                <span className="font-medium">{formatCurrency(totals.vatAmount || 0)}</span>
              </div>
              {totals.chargesVat > 0 && (
                <div
                  className={`flex justify-between items-center text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <span className="pl-4">Charges VAT:</span>
                  <span>{formatCurrency(totals.chargesVat || 0)}</span>
                </div>
              )}
            </>
          )}

          {/* Grand Total */}
          <div
            className={`pt-3 border-t ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}
          >
            <div
              className={`flex justify-between items-center text-lg font-bold ${
                isDarkMode ? 'text-teal-400' : 'text-teal-600'
              }`}
            >
              <span>Grand Total:</span>
              <span>{formatCurrency(totals.total || 0)}</span>
            </div>

            {/* Foreign Currency Conversion */}
            {totals.totalAed && totals.totalAed !== totals.total && (
              <div
                className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                <div className="flex justify-between">
                  <span>Total in AED:</span>
                  <span className="font-medium">{formatCurrency(totals.totalAed)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

ChargesTotalsSection.propTypes = {
  charges: PropTypes.shape({
    packing: PropTypes.shape({
      amount: PropTypes.number,
      vatAmount: PropTypes.number,
    }),
    freight: PropTypes.shape({
      amount: PropTypes.number,
      vatAmount: PropTypes.number,
    }),
    insurance: PropTypes.shape({
      amount: PropTypes.number,
      vatAmount: PropTypes.number,
    }),
    loading: PropTypes.shape({
      amount: PropTypes.number,
      vatAmount: PropTypes.number,
    }),
    other: PropTypes.shape({
      amount: PropTypes.number,
      vatAmount: PropTypes.number,
    }),
  }).isRequired,
  setCharge: PropTypes.func.isRequired,
  totals: PropTypes.shape({
    subtotal: PropTypes.number,
    discountAmount: PropTypes.number,
    chargesTotal: PropTypes.number,
    chargesVat: PropTypes.number,
    vatAmount: PropTypes.number,
    total: PropTypes.number,
    totalAed: PropTypes.number,
  }).isRequired,
  discount: PropTypes.shape({
    type: PropTypes.oneOf(['amount', 'percent']),
    value: PropTypes.number,
  }).isRequired,
  setDiscount: PropTypes.func.isRequired,
  config: PropTypes.shape({
    chargeTypes: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        enabled: PropTypes.bool,
      })
    ),
    features: PropTypes.shape({
      enableAdditionalCharges: PropTypes.bool,
      enableInvoiceDiscount: PropTypes.bool,
      enableVat: PropTypes.bool,
    }),
  }).isRequired,
};

export default ChargesTotalsSection;
