import { Fragment } from 'prop-types';
import PropTypes from 'prop-types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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

// Button Component
const Button = ({ children, variant = 'primary', onClick, disabled, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1.5 text-sm';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 shadow-sm hover:shadow-md focus:ring-teal-500`;
    }
    return `${
      isDarkMode
        ? 'bg-gray-700 hover:bg-gray-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    } focus:ring-gray-400`;
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// Input for table cells
const CellInput = ({ type = 'text', value, onChange, disabled, error, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-2 py-1 text-sm border rounded ${
        error
          ? 'border-red-500'
          : isDarkMode
          ? 'border-gray-600 bg-gray-700 text-white'
          : 'border-gray-300 bg-white text-gray-900'
      } focus:outline-none focus:ring-1 focus:ring-teal-500 ${className}`}
      {...props}
    />
  );
};

CellInput.propTypes = {
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
};

// Select for table cells
const CellSelect = ({ value, onChange, disabled, children, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <select
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-2 py-1 text-sm border rounded ${
        isDarkMode
          ? 'border-gray-600 bg-gray-700 text-white'
          : 'border-gray-300 bg-white text-gray-900'
      } focus:outline-none focus:ring-1 focus:ring-teal-500 ${className}`}
    >
      {children}
    </select>
  );
};

CellSelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

/**
 * LineItemsSection Component
 *
 * Renders line items table with configurable columns.
 * Supports add, update, remove, and reorder operations.
 *
 * @param {Array} lines - Array of line items
 * @param {Function} addLine - Add new line function
 * @param {Function} updateLine - Update line function
 * @param {Function} removeLine - Remove line function
 * @param {Function} reorderLines - Reorder lines function (optional)
 * @param {Array} products - Available products for autocomplete
 * @param {Object} config - Document form configuration
 * @param {boolean} disabled - Form disabled state
 */
const LineItemsSection = ({
  lines,
  addLine,
  updateLine,
  removeLine,
  reorderLines,
  products = [],
  config,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();

  // Helper to check if column is visible
  const isColumnVisible = (key) => {
    const column = config.lineItemColumns?.find(c => c.key === key);
    return column?.visible !== false;
  };

  // Helper to check if feature is enabled
  const isFeatureEnabled = (feature) => {
    return config.features?.[feature] !== false;
  };

  const handleAddLine = () => {
    addLine({
      id: `temp-${Date.now()}`,
      productId: null,
      productName: '',
      description: '',
      quantity: 1,
      unit: 'PCS',
      rate: 0,
      amount: 0,
      vatRate: 5,
      vatAmount: 0,
      discountPercent: 0,
      discountAmount: 0,
    });
  };

  const handleFieldChange = (index, field, value) => {
    const line = lines[index];
    const updates = { [field]: value };

    // Auto-calculate amount when qty or rate changes
    if (field === 'quantity' || field === 'rate') {
      const qty = field === 'quantity' ? value : line.quantity;
      const rate = field === 'rate' ? value : line.rate;
      updates.amount = qty * rate;

      // Recalculate VAT if enabled
      if (isFeatureEnabled('enableLineVat')) {
        updates.vatAmount = (updates.amount * (line.vatRate || 0)) / 100;
      }
    }

    // Recalculate discount if changed
    if (field === 'discountPercent' && isFeatureEnabled('enableLineDiscount')) {
      updates.discountAmount = (line.amount * value) / 100;
    }

    updateLine(index, updates);
  };

  // Drag handlers (simplified - would need full drag/drop implementation)
  const handleDragStart = (index) => {
    if (!isFeatureEnabled('enableDragReorder')) return;
    // Store drag index
  };

  const handleDrop = (index) => {
    if (!isFeatureEnabled('enableDragReorder')) return;
    // Call reorderLines if provided
  };

  return (
    <Card className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-xs font-semibold uppercase tracking-wide ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          Line Items
        </h3>
        <Button onClick={handleAddLine} disabled={disabled}>
          <Plus size={16} />
          Add Line
        </Button>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={`${
              isDarkMode ? 'bg-gradient-to-br from-teal-700 to-teal-800' : 'bg-gradient-to-br from-teal-600 to-teal-700'
            }`}
          >
            <tr>
              {/* Drag Handle Column */}
              {isFeatureEnabled('enableDragReorder') && (
                <th className="py-3 px-2 w-8"></th>
              )}

              {/* Product/Description */}
              {isColumnVisible('productName') && (
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Product
                </th>
              )}

              {isColumnVisible('description') && (
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Description
                </th>
              )}

              {/* Quantity */}
              {isColumnVisible('quantity') && (
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Qty
                </th>
              )}

              {/* Unit */}
              {isColumnVisible('unit') && (
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white">
                  Unit
                </th>
              )}

              {/* Rate */}
              {isColumnVisible('rate') && (
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Rate
                </th>
              )}

              {/* Discount */}
              {isFeatureEnabled('enableLineDiscount') && isColumnVisible('discountPercent') && (
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Disc %
                </th>
              )}

              {/* VAT */}
              {isFeatureEnabled('enableLineVat') && isColumnVisible('vatRate') && (
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  VAT %
                </th>
              )}

              {/* Amount */}
              {isColumnVisible('amount') && (
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Amount
                </th>
              )}

              {/* Actions */}
              <th className="py-3 w-8"></th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isDarkMode ? 'bg-gray-800 divide-gray-600' : 'bg-white divide-gray-200'
            }`}
          >
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className={`py-8 text-center text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  No line items. Click "Add Line" to get started.
                </td>
              </tr>
            ) : (
              lines.map((line, index) => (
                <tr key={line.id || index}>
                  {/* Drag Handle */}
                  {isFeatureEnabled('enableDragReorder') && (
                    <td className="py-2 px-2 align-middle text-center">
                      <div
                        draggable={!disabled}
                        onDragStart={() => handleDragStart(index)}
                        onDrop={() => handleDrop(index)}
                        className={`cursor-grab active:cursor-grabbing ${
                          isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <GripVertical size={14} />
                      </div>
                    </td>
                  )}

                  {/* Product Name */}
                  {isColumnVisible('productName') && (
                    <td className="px-2 py-2 align-middle">
                      <CellInput
                        value={line.productName}
                        onChange={(e) => handleFieldChange(index, 'productName', e.target.value)}
                        disabled={disabled}
                        placeholder="Product name"
                      />
                    </td>
                  )}

                  {/* Description */}
                  {isColumnVisible('description') && (
                    <td className="px-2 py-2 align-middle">
                      <CellInput
                        value={line.description}
                        onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                        disabled={disabled}
                        placeholder="Description"
                      />
                    </td>
                  )}

                  {/* Quantity */}
                  {isColumnVisible('quantity') && (
                    <td className="px-2 py-2 align-middle">
                      <CellInput
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        min="0"
                        step="0.001"
                        className="text-right"
                      />
                    </td>
                  )}

                  {/* Unit */}
                  {isColumnVisible('unit') && (
                    <td className="px-2 py-2 align-middle">
                      <CellSelect
                        value={line.unit}
                        onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                        disabled={disabled}
                      >
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="MT">MT</option>
                        <option value="LTR">LTR</option>
                        <option value="BOX">BOX</option>
                      </CellSelect>
                    </td>
                  )}

                  {/* Rate */}
                  {isColumnVisible('rate') && (
                    <td className="px-2 py-2 align-middle">
                      <CellInput
                        type="number"
                        value={line.rate}
                        onChange={(e) => handleFieldChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        min="0"
                        step="0.01"
                        className="text-right"
                      />
                    </td>
                  )}

                  {/* Discount */}
                  {isFeatureEnabled('enableLineDiscount') && isColumnVisible('discountPercent') && (
                    <td className="px-2 py-2 align-middle">
                      <CellInput
                        type="number"
                        value={line.discountPercent}
                        onChange={(e) =>
                          handleFieldChange(index, 'discountPercent', parseFloat(e.target.value) || 0)
                        }
                        disabled={disabled}
                        min="0"
                        max="100"
                        step="0.01"
                        className="text-right"
                      />
                    </td>
                  )}

                  {/* VAT */}
                  {isFeatureEnabled('enableLineVat') && isColumnVisible('vatRate') && (
                    <td className="px-2 py-2 align-middle">
                      <CellInput
                        type="number"
                        value={line.vatRate}
                        onChange={(e) => handleFieldChange(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        disabled={disabled}
                        min="0"
                        max="100"
                        step="0.01"
                        className="text-right"
                      />
                    </td>
                  )}

                  {/* Amount */}
                  {isColumnVisible('amount') && (
                    <td className="px-2 py-2 align-middle">
                      <div className={`text-right text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(line.amount || 0)}
                      </div>
                    </td>
                  )}

                  {/* Remove Button */}
                  <td className="py-2 px-2 align-middle text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={disabled}
                      className={`p-1 rounded hover:bg-red-100 ${
                        isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600'
                      } transition-colors`}
                      title="Remove line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Add (if enabled) */}
      {isFeatureEnabled('enableQuickAdd') && lines.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAddLine}
            disabled={disabled}
            className={`text-sm ${
              isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
            } transition-colors`}
          >
            + Quick add line
          </button>
        </div>
      )}
    </Card>
  );
};

LineItemsSection.propTypes = {
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      productId: PropTypes.number,
      productName: PropTypes.string,
      description: PropTypes.string,
      quantity: PropTypes.number,
      unit: PropTypes.string,
      rate: PropTypes.number,
      amount: PropTypes.number,
      vatRate: PropTypes.number,
      vatAmount: PropTypes.number,
      discountPercent: PropTypes.number,
      discountAmount: PropTypes.number,
    })
  ).isRequired,
  addLine: PropTypes.func.isRequired,
  updateLine: PropTypes.func.isRequired,
  removeLine: PropTypes.func.isRequired,
  reorderLines: PropTypes.func,
  products: PropTypes.array,
  config: PropTypes.shape({
    lineItemColumns: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        visible: PropTypes.bool,
      })
    ),
    features: PropTypes.shape({
      enableQuickAdd: PropTypes.bool,
      enableDragReorder: PropTypes.bool,
      enableLineDiscount: PropTypes.bool,
      enableLineVat: PropTypes.bool,
    }),
  }).isRequired,
  disabled: PropTypes.bool,
};

export default LineItemsSection;
