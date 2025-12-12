import { useState } from 'react';
import PropTypes from 'prop-types';
import { User, Building2 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { titleCase, normalizeLLC } from '../../../utils/invoiceUtils';

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

// Simple Autocomplete (pattern from InvoiceForm)
const Autocomplete = ({ label, options, value, onChange, inputValue, onInputChange, placeholder, disabled, error, required, noOptionsText }) => {
  const { isDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredOptions = inputValue
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  return (
    <div className="relative">
      {label && (
        <label
          className={`block text-sm font-medium mb-1.5 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        value={inputValue || ''}
        onChange={(e) => onInputChange(e, e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
          error
            ? isDarkMode
              ? 'border-red-500 bg-red-900/10'
              : 'border-red-500 bg-red-50'
            : isDarkMode
            ? 'border-gray-600 bg-gray-800'
            : 'border-gray-300 bg-white'
        } ${isDarkMode ? 'text-white' : 'text-gray-900'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div
          className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
        >
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(null, option);
                setShowDropdown(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-white'
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {showDropdown && filteredOptions.length === 0 && (
        <div
          className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {noOptionsText}
          </div>
        </div>
      )}
    </div>
  );
};

Autocomplete.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      label: PropTypes.string,
    })
  ),
  value: PropTypes.object,
  onChange: PropTypes.func,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  required: PropTypes.bool,
  noOptionsText: PropTypes.string,
};

// Button Component
const Button = ({ children, variant = 'primary', onClick, disabled, className = '' }) => {
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

/**
 * PartySection Component
 *
 * Renders customer/vendor selection and details.
 * Supports autocomplete search and create new party.
 *
 * @param {Object} party - Party state (customer/vendor)
 * @param {Function} setParty - Update party function
 * @param {Array} parties - List of available parties
 * @param {Object} config - Document form configuration
 * @param {boolean} disabled - Form disabled state
 */
const PartySection = ({ party, setParty, parties = [], config, disabled = false }) => {
  const { isDarkMode } = useTheme();
  const [searchInput, setSearchInput] = useState('');

  const partyLabel = config.partyLabel || 'Customer';
  const isCustomer = config.partyType === 'customer';

  const partyOptions = parties.map(p => ({
    id: p.id,
    label: `${titleCase(normalizeLLC(p.name))} - ${p.email || 'No email'}`,
    name: p.name,
    email: p.email,
    phone: p.phone,
    company: p.company,
    trn: p.trnNumber || p.vatNumber,
    address: p.address,
  }));

  const handlePartySelect = (selected) => {
    if (selected) {
      setParty({
        id: selected.id,
        type: config.partyType,
        name: selected.name || '',
        company: selected.company || null,
        trn: selected.trn || null,
        email: selected.email || null,
        phone: selected.phone || null,
        address: selected.address || {
          street: '',
          city: '',
          emirate: '',
          country: 'UAE',
          postalCode: null,
        },
      });
      setSearchInput(titleCase(normalizeLLC(selected.name || '')));
    }
  };

  const handleCreateNew = () => {
    // Trigger create new party flow (handled by parent)
    if (config.features?.enablePartyCreate) {
      // This would typically open a modal or navigate to create page
      console.log('Create new party');
    }
  };

  return (
    <Card className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {isCustomer ? <User size={16} /> : <Building2 size={16} />}
          {partyLabel} Information
        </h3>
        {config.features?.enablePartyCreate && (
          <Button variant="secondary" onClick={handleCreateNew} disabled={disabled}>
            Create New
          </Button>
        )}
      </div>

      {/* Party Search/Selection */}
      {config.features?.enablePartySearch !== false && (
        <div className="mb-4">
          <Autocomplete
            label={`Select ${partyLabel}`}
            options={partyOptions}
            value={
              party.id
                ? {
                    id: party.id,
                    label: `${titleCase(normalizeLLC(party.name))} - ${party.email || 'No email'}`,
                  }
                : null
            }
            onChange={(e, selected) => handlePartySelect(selected)}
            inputValue={searchInput}
            onInputChange={(e, value) => setSearchInput(value)}
            placeholder={`Search ${config.partyLabelPlural?.toLowerCase() || 'parties'} by name or email...`}
            disabled={disabled}
            noOptionsText={`No ${config.partyLabelPlural?.toLowerCase() || 'parties'} found`}
            required={true}
          />
        </div>
      )}

      {/* Party Details Display */}
      <div
        className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
        }`}
      >
        <h4
          className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {party.name ? `Selected ${partyLabel}:` : `${partyLabel} Details:`}
        </h4>
        <div
          className={`space-y-1 text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          <p>
            <span className="font-medium">Name:</span>{' '}
            {party.name ? titleCase(normalizeLLC(party.name)) : '-'}
          </p>
          {party.company && (
            <p>
              <span className="font-medium">Company:</span> {party.company}
            </p>
          )}
          <p>
            <span className="font-medium">Email:</span> {party.email || '-'}
          </p>
          <p>
            <span className="font-medium">Phone:</span> {party.phone || '-'}
          </p>
          <p>
            <span className="font-medium">TRN:</span> {party.trn || '-'}
          </p>
          <p>
            <span className="font-medium">Address:</span>{' '}
            {party.address?.street || party.address?.city
              ? [
                  party.address.street,
                  party.address.city,
                  party.address.emirate,
                  party.address.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')
              : '-'}
          </p>
        </div>
      </div>
    </Card>
  );
};

PartySection.propTypes = {
  party: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    name: PropTypes.string,
    company: PropTypes.string,
    trn: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.shape({
      street: PropTypes.string,
      city: PropTypes.string,
      emirate: PropTypes.string,
      country: PropTypes.string,
      postalCode: PropTypes.string,
    }),
  }).isRequired,
  setParty: PropTypes.func.isRequired,
  parties: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      company: PropTypes.string,
      trnNumber: PropTypes.string,
      vatNumber: PropTypes.string,
      address: PropTypes.object,
    })
  ),
  config: PropTypes.shape({
    partyType: PropTypes.oneOf(['customer', 'vendor']).isRequired,
    partyLabel: PropTypes.string,
    partyLabelPlural: PropTypes.string,
    features: PropTypes.shape({
      enablePartySearch: PropTypes.bool,
      enablePartyCreate: PropTypes.bool,
    }),
  }).isRequired,
  disabled: PropTypes.bool,
};

export default PartySection;
