import PropTypes from 'prop-types';
import { useTheme } from '../../../contexts/ThemeContext';

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

// Textarea Component
const Textarea = ({ label, value, onChange, disabled, placeholder, rows = 4, className = '' }) => {
  const { isDarkMode } = useTheme();
  const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`block text-sm font-medium mb-1.5 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-y ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
      />
    </div>
  );
};

Textarea.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  className: PropTypes.string,
};

/**
 * NotesSection Component
 *
 * Renders notes fields (customer notes, internal notes, terms & conditions).
 * Shows only enabled note fields from config.features.
 *
 * @param {Object} notes - Notes state
 * @param {Function} setNotes - Update notes function
 * @param {Object} config - Document form configuration
 */
const NotesSection = ({ notes, setNotes, config }) => {
  const { isDarkMode } = useTheme();

  const handleChange = (field, value) => {
    setNotes({ [field]: value });
  };

  // Check if any notes features are enabled
  const hasAnyNotesEnabled =
    config.features?.enableCustomerNotes ||
    config.features?.enableInternalNotes ||
    config.features?.enableTermsAndConditions;

  if (!hasAnyNotesEnabled) {
    return null;
  }

  return (
    <Card className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3
        className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        Notes & Terms
      </h3>

      {/* Two-column layout on desktop, stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Customer Notes */}
          {config.features?.enableCustomerNotes && (
            <Textarea
              label="Customer Notes"
              value={notes.customerNotes}
              onChange={(e) => handleChange('customerNotes', e.target.value)}
              placeholder="Notes visible to the customer on the document..."
              rows={5}
            />
          )}

          {/* Internal Notes */}
          {config.features?.enableInternalNotes && (
            <Textarea
              label="Internal Notes"
              value={notes.internalNotes}
              onChange={(e) => handleChange('internalNotes', e.target.value)}
              placeholder="Internal notes (not visible to customer)..."
              rows={5}
            />
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Terms & Conditions */}
          {config.features?.enableTermsAndConditions && (
            <Textarea
              label="Terms & Conditions"
              value={notes.termsAndConditions}
              onChange={(e) => handleChange('termsAndConditions', e.target.value)}
              placeholder="Enter terms and conditions that will appear on the document..."
              rows={10}
            />
          )}
        </div>
      </div>

      {/* Info text */}
      <div
        className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {config.features?.enableCustomerNotes && (
          <p className="mb-1">
            <span className="font-medium">Customer Notes:</span> Visible on printed/PDF documents
          </p>
        )}
        {config.features?.enableInternalNotes && (
          <p className="mb-1">
            <span className="font-medium">Internal Notes:</span> Only visible internally, not on documents
          </p>
        )}
        {config.features?.enableTermsAndConditions && (
          <p>
            <span className="font-medium">Terms & Conditions:</span> Legal terms that appear at the bottom of the document
          </p>
        )}
      </div>
    </Card>
  );
};

NotesSection.propTypes = {
  notes: PropTypes.shape({
    customerNotes: PropTypes.string,
    internalNotes: PropTypes.string,
    termsAndConditions: PropTypes.string,
  }).isRequired,
  setNotes: PropTypes.func.isRequired,
  config: PropTypes.shape({
    features: PropTypes.shape({
      enableCustomerNotes: PropTypes.bool,
      enableInternalNotes: PropTypes.bool,
      enableTermsAndConditions: PropTypes.bool,
    }),
  }).isRequired,
};

export default NotesSection;
