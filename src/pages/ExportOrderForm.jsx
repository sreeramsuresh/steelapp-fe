import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Ship,
  FileText,
  Package,
  DollarSign,
  Upload,
  Calculator,
  Building2,
  Globe,
  Search,
  CheckCircle,
  AlertCircle,
  MapPin,
  CreditCard,
  Truck,
  Plane,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { exportOrderService } from '../services/exportOrderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { exchangeRateService } from '../services/exchangeRateService';
import { notificationService } from '../services/notificationService';
import pricelistService from '../services/pricelistService';

// ============================================================
// CUSTOM UI COMPONENTS
// ============================================================

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm hover:shadow-md`;
    } else if (variant === 'secondary') {
      return `${
        isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-200 hover:bg-gray-300'
      } ${isDarkMode ? 'text-white' : 'text-gray-800'} disabled:opacity-50`;
    } else if (variant === 'danger') {
      return `bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 disabled:opacity-50`;
    } else if (variant === 'success') {
      return `bg-green-600 text-white hover:bg-green-500 focus:ring-green-500 disabled:opacity-50`;
    } else {
      return `border ${
        isDarkMode
          ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
          : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
      } focus:ring-teal-500 disabled:opacity-50`;
    }
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? 'cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, className = '', required = false, helperText, ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {helperText && !error && (
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {helperText}
        </p>
      )}
      {error && (
        <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  );
};

const Select = ({ label, children, error, className = '', required = false, helperText, ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full pl-2 pr-8 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 appearance-none ${
            isDarkMode
              ? 'border-gray-600 bg-gray-800 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400'
          } ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        />
      </div>
      {helperText && !error && (
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {helperText}
        </p>
      )}
      {error && (
        <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  );
};

const Textarea = ({ label, error, className = '', required = false, ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 resize-none ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  );
};

const Checkbox = ({ label, checked, onChange, disabled = false, helperText }) => {
  const { isDarkMode } = useTheme();

  return (
    <label className={`flex items-start gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`mt-0.5 h-4 w-4 rounded border focus:ring-teal-500 focus:ring-2 transition-colors ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-teal-500'
            : 'border-gray-300 bg-white text-teal-600'
        }`}
      />
      <div>
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
        {helperText && (
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {helperText}
          </p>
        )}
      </div>
    </label>
  );
};

const Card = ({ children, className = '', title, icon: Icon, highlight = false, highlightColor = 'teal' }) => {
  const { isDarkMode } = useTheme();

  const highlightColors = {
    teal: isDarkMode ? 'border-l-teal-500' : 'border-l-teal-500',
    green: isDarkMode ? 'border-l-green-500' : 'border-l-green-500',
    blue: isDarkMode ? 'border-l-blue-500' : 'border-l-blue-500',
    amber: isDarkMode ? 'border-l-amber-500' : 'border-l-amber-500',
    red: isDarkMode ? 'border-l-red-500' : 'border-l-red-500',
  };

  return (
    <div
      className={`rounded-xl shadow-sm ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      } ${highlight ? `border-l-4 ${highlightColors[highlightColor]}` : ''} ${className}`}
    >
      {title && (
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`h-4 w-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />}
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
          </div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { bg: 'bg-gray-500', text: 'Draft' },
    confirmed: { bg: 'bg-blue-500', text: 'Confirmed' },
    preparing: { bg: 'bg-yellow-500', text: 'Preparing' },
    shipped: { bg: 'bg-orange-500', text: 'Shipped' },
    in_transit: { bg: 'bg-purple-500', text: 'In Transit' },
    delivered: { bg: 'bg-green-500', text: 'Delivered' },
    completed: { bg: 'bg-green-600', text: 'Completed' },
    cancelled: { bg: 'bg-red-500', text: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.bg}`}>
      {config.text}
    </span>
  );
};

const VatBadge = ({ treatment, form201Box }) => {
  const { isDarkMode } = useTheme();

  const treatmentConfig = {
    zero_rated: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: '0% Zero-Rated' },
    exempt: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Exempt' },
    re_export: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', label: '0% Re-Export' },
  };

  const config = treatmentConfig[treatment] || treatmentConfig.zero_rated;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
      <CheckCircle className={`h-4 w-4 ${config.text}`} />
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
      {form201Box && (
        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          (Form 201 {form201Box})
        </span>
      )}
    </div>
  );
};

// ============================================================
// UAE VAT EXPORT CONSTANTS
// ============================================================

// UAE Company TRN Validation (15 digits starting with 100)
const validateTRN = (trn) => {
  if (!trn) return { valid: false, message: 'TRN is required' };
  if (trn.length !== 15) return { valid: false, message: 'TRN must be exactly 15 digits' };
  if (!trn.startsWith('100')) return { valid: false, message: 'UAE TRN must start with 100' };
  if (!/^\d{15}$/.test(trn)) return { valid: false, message: 'TRN must contain only digits' };
  return { valid: true, message: 'Valid TRN' };
};

// Export VAT Treatment Options (UAE VAT Law Article 45)
const EXPORT_VAT_TREATMENT_OPTIONS = [
  { value: 'zero_rated', label: '0% - Zero-Rated Export (Article 45)', form_201_box: 'box_2', description: 'Standard export to outside UAE/GCC' },
  { value: 'exempt', label: 'Exempt - Specific Exemptions', form_201_box: 'box_6', description: 'Exempt supplies under Article 46' },
  { value: 're_export', label: '0% - Re-Export of Imported Goods', form_201_box: 'box_2', description: 'Previously imported goods being re-exported' },
];

// Export Type Options
const EXPORT_TYPE_OPTIONS = [
  { value: 'direct_export', label: 'Direct Export (UAE Mainland -> International)', description: 'Goods manufactured or sourced in UAE mainland' },
  { value: 're_export', label: 'Re-Export (Imported -> Re-Exported)', description: 'Goods imported then re-exported without substantial transformation' },
  { value: 'dz_export', label: 'Designated Zone Export', description: 'Export from UAE Designated Zone (Article 51)' },
  { value: 'gcc_export', label: 'GCC Export (Article 30)', description: 'Intra-GCC supply to VAT-registered customer' },
];

// GCC Countries (for intra-GCC supplies per UAE VAT Law Article 30)
const GCC_COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', vat_rate: 15, currency: 'SAR' },
  { code: 'BH', name: 'Bahrain', vat_rate: 10, currency: 'BHD' },
  { code: 'KW', name: 'Kuwait', vat_rate: 0, currency: 'KWD' },
  { code: 'OM', name: 'Oman', vat_rate: 5, currency: 'OMR' },
  { code: 'QA', name: 'Qatar', vat_rate: 0, currency: 'QAR' },
];

// UAE Designated Zones (FTA-approved free zones - Article 51)
const UAE_DESIGNATED_ZONES = [
  { code: 'JAFZA', name: 'Jebel Ali Free Zone', emirate: 'Dubai', port: 'AEJEA' },
  { code: 'DAFZA', name: 'Dubai Airport Free Zone', emirate: 'Dubai', port: 'AEDXB' },
  { code: 'SAIF', name: 'Sharjah Airport Int\'l Free Zone', emirate: 'Sharjah', port: 'AESHJ' },
  { code: 'KIZAD', name: 'Khalifa Industrial Zone', emirate: 'Abu Dhabi', port: 'AEKHL' },
  { code: 'ADPC', name: 'Abu Dhabi Ports Free Zone', emirate: 'Abu Dhabi', port: 'AEAUH' },
  { code: 'RAK', name: 'RAK Free Trade Zone', emirate: 'Ras Al Khaimah', port: 'AERKT' },
  { code: 'HAMRIYAH', name: 'Hamriyah Free Zone', emirate: 'Sharjah', port: 'AEHAM' },
  { code: 'UAQ', name: 'Umm Al Quwain Free Zone', emirate: 'UAQ', port: 'AEUAQ' },
  { code: 'AFZA', name: 'Ajman Free Zone', emirate: 'Ajman', port: 'AEAJM' },
  { code: 'DMCC', name: 'Dubai Multi Commodities Centre', emirate: 'Dubai', port: 'AEJEA' },
  { code: 'DIFC', name: 'Dubai International Financial Centre', emirate: 'Dubai', port: 'AEDXB' },
];

// UAE Export Ports
const UAE_PORTS = [
  { value: 'AEJEA', label: 'Jebel Ali Port, Dubai', type: 'seaport', emirate: 'Dubai' },
  { value: 'AESHJ', label: 'Sharjah Port', type: 'seaport', emirate: 'Sharjah' },
  { value: 'AEAUH', label: 'Abu Dhabi Port (Mina Zayed)', type: 'seaport', emirate: 'Abu Dhabi' },
  { value: 'AEKHL', label: 'Khalifa Port, Abu Dhabi', type: 'seaport', emirate: 'Abu Dhabi' },
  { value: 'AERKT', label: 'Ras Al Khaimah Port', type: 'seaport', emirate: 'Ras Al Khaimah' },
  { value: 'AEHAM', label: 'Hamriyah Port, Sharjah', type: 'seaport', emirate: 'Sharjah' },
  { value: 'AEDXB', label: 'Dubai International Airport', type: 'airport', emirate: 'Dubai' },
  { value: 'AEDWC', label: 'Dubai World Central (Al Maktoum)', type: 'airport', emirate: 'Dubai' },
  { value: 'AEAUHAP', label: 'Abu Dhabi International Airport', type: 'airport', emirate: 'Abu Dhabi' },
  { value: 'AESHJAP', label: 'Sharjah International Airport', type: 'airport', emirate: 'Sharjah' },
];

// Common International Destination Ports
const INTERNATIONAL_PORTS = [
  // Asia Pacific
  { value: 'SGSIN', label: 'Singapore', country: 'Singapore', region: 'Asia Pacific' },
  { value: 'HKHKG', label: 'Hong Kong', country: 'Hong Kong', region: 'Asia Pacific' },
  { value: 'CNSHA', label: 'Shanghai, China', country: 'China', region: 'Asia Pacific' },
  { value: 'CNSZX', label: 'Shenzhen, China', country: 'China', region: 'Asia Pacific' },
  { value: 'JPYOK', label: 'Yokohama, Japan', country: 'Japan', region: 'Asia Pacific' },
  { value: 'JPTYO', label: 'Tokyo, Japan', country: 'Japan', region: 'Asia Pacific' },
  { value: 'KRPUS', label: 'Busan, South Korea', country: 'South Korea', region: 'Asia Pacific' },
  { value: 'INNSA', label: 'Nhava Sheva (JNPT), India', country: 'India', region: 'Asia Pacific' },
  { value: 'INMUN', label: 'Mundra, India', country: 'India', region: 'Asia Pacific' },
  { value: 'INCHE', label: 'Chennai, India', country: 'India', region: 'Asia Pacific' },
  { value: 'MYPKG', label: 'Port Klang, Malaysia', country: 'Malaysia', region: 'Asia Pacific' },
  { value: 'THBKK', label: 'Bangkok (Laem Chabang), Thailand', country: 'Thailand', region: 'Asia Pacific' },
  { value: 'VNSGN', label: 'Ho Chi Minh City, Vietnam', country: 'Vietnam', region: 'Asia Pacific' },
  { value: 'IDTPP', label: 'Tanjung Priok, Indonesia', country: 'Indonesia', region: 'Asia Pacific' },
  { value: 'PHMNL', label: 'Manila, Philippines', country: 'Philippines', region: 'Asia Pacific' },
  { value: 'AUMEL', label: 'Melbourne, Australia', country: 'Australia', region: 'Asia Pacific' },
  { value: 'AUSYD', label: 'Sydney, Australia', country: 'Australia', region: 'Asia Pacific' },
  { value: 'NZAKL', label: 'Auckland, New Zealand', country: 'New Zealand', region: 'Asia Pacific' },
  // Europe
  { value: 'NLRTM', label: 'Rotterdam, Netherlands', country: 'Netherlands', region: 'Europe' },
  { value: 'DEHAM', label: 'Hamburg, Germany', country: 'Germany', region: 'Europe' },
  { value: 'BEANR', label: 'Antwerp, Belgium', country: 'Belgium', region: 'Europe' },
  { value: 'GBFXT', label: 'Felixstowe, UK', country: 'United Kingdom', region: 'Europe' },
  { value: 'GBLGP', label: 'London Gateway, UK', country: 'United Kingdom', region: 'Europe' },
  { value: 'FRLEH', label: 'Le Havre, France', country: 'France', region: 'Europe' },
  { value: 'ITGOA', label: 'Genoa, Italy', country: 'Italy', region: 'Europe' },
  { value: 'ESBCN', label: 'Barcelona, Spain', country: 'Spain', region: 'Europe' },
  { value: 'GRGIT', label: 'Piraeus, Greece', country: 'Greece', region: 'Europe' },
  { value: 'TRIST', label: 'Istanbul (Ambarli), Turkey', country: 'Turkey', region: 'Europe' },
  // Americas
  { value: 'USNYC', label: 'New York/New Jersey, USA', country: 'USA', region: 'Americas' },
  { value: 'USLAX', label: 'Los Angeles, USA', country: 'USA', region: 'Americas' },
  { value: 'USHOU', label: 'Houston, USA', country: 'USA', region: 'Americas' },
  { value: 'USSAV', label: 'Savannah, USA', country: 'USA', region: 'Americas' },
  { value: 'USMIA', label: 'Miami, USA', country: 'USA', region: 'Americas' },
  { value: 'CAHAL', label: 'Halifax, Canada', country: 'Canada', region: 'Americas' },
  { value: 'CAVAN', label: 'Vancouver, Canada', country: 'Canada', region: 'Americas' },
  { value: 'MXVER', label: 'Veracruz, Mexico', country: 'Mexico', region: 'Americas' },
  { value: 'BRSSZ', label: 'Santos, Brazil', country: 'Brazil', region: 'Americas' },
  { value: 'CLVAP', label: 'Valparaiso, Chile', country: 'Chile', region: 'Americas' },
  // Middle East (Non-GCC)
  { value: 'IRBND', label: 'Bandar Abbas, Iran', country: 'Iran', region: 'Middle East' },
  { value: 'IQBSR', label: 'Basra, Iraq', country: 'Iraq', region: 'Middle East' },
  { value: 'JOLAQ', label: 'Aqaba, Jordan', country: 'Jordan', region: 'Middle East' },
  { value: 'EGSUZ', label: 'Port Said, Egypt', country: 'Egypt', region: 'Middle East' },
  { value: 'ILASH', label: 'Ashdod, Israel', country: 'Israel', region: 'Middle East' },
  { value: 'LBBEY', label: 'Beirut, Lebanon', country: 'Lebanon', region: 'Middle East' },
  // GCC
  { value: 'SAJED', label: 'Jeddah, Saudi Arabia', country: 'Saudi Arabia', region: 'GCC' },
  { value: 'SADMM', label: 'Dammam, Saudi Arabia', country: 'Saudi Arabia', region: 'GCC' },
  { value: 'BHMIN', label: 'Mina Salman, Bahrain', country: 'Bahrain', region: 'GCC' },
  { value: 'KWSAA', label: 'Shuaiba, Kuwait', country: 'Kuwait', region: 'GCC' },
  { value: 'OMSLL', label: 'Salalah, Oman', country: 'Oman', region: 'GCC' },
  { value: 'OMSOH', label: 'Sohar, Oman', country: 'Oman', region: 'GCC' },
  { value: 'QADOH', label: 'Doha (Hamad Port), Qatar', country: 'Qatar', region: 'GCC' },
  // Africa
  { value: 'ZADUR', label: 'Durban, South Africa', country: 'South Africa', region: 'Africa' },
  { value: 'ZACPT', label: 'Cape Town, South Africa', country: 'South Africa', region: 'Africa' },
  { value: 'KEMLB', label: 'Mombasa, Kenya', country: 'Kenya', region: 'Africa' },
  { value: 'TZDAR', label: 'Dar es Salaam, Tanzania', country: 'Tanzania', region: 'Africa' },
  { value: 'MAPTM', label: 'Tanger-Med, Morocco', country: 'Morocco', region: 'Africa' },
  { value: 'NGAPP', label: 'Apapa (Lagos), Nigeria', country: 'Nigeria', region: 'Africa' },
  { value: 'GHTEM', label: 'Tema, Ghana', country: 'Ghana', region: 'Africa' },
  { value: 'DJJIB', label: 'Djibouti', country: 'Djibouti', region: 'Africa' },
];

// Incoterms for Export
const INCOTERMS_OPTIONS = [
  { value: 'EXW', label: 'EXW - Ex Works', seller_risk: 'Minimum', description: 'Buyer arranges all transport' },
  { value: 'FCA', label: 'FCA - Free Carrier', seller_risk: 'Low', description: 'Seller delivers to carrier' },
  { value: 'FAS', label: 'FAS - Free Alongside Ship', seller_risk: 'Low', description: 'Sea freight only' },
  { value: 'FOB', label: 'FOB - Free On Board', seller_risk: 'Medium', description: 'Seller loads on vessel' },
  { value: 'CFR', label: 'CFR - Cost & Freight', seller_risk: 'Medium', description: 'Seller pays freight' },
  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight', seller_risk: 'Medium', description: 'Seller pays freight + insurance' },
  { value: 'CPT', label: 'CPT - Carriage Paid To', seller_risk: 'Medium', description: 'Any transport mode' },
  { value: 'CIP', label: 'CIP - Carriage & Insurance Paid', seller_risk: 'Medium', description: 'CPT + insurance' },
  { value: 'DAP', label: 'DAP - Delivered At Place', seller_risk: 'High', description: 'Seller delivers unloaded' },
  { value: 'DPU', label: 'DPU - Delivered at Place Unloaded', seller_risk: 'High', description: 'Seller unloads at destination' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid', seller_risk: 'Maximum', description: 'Seller pays all costs + duty' },
];

// Payment Methods for Export
const PAYMENT_METHOD_OPTIONS = [
  { value: 'advance', label: 'Advance Payment (TT)', risk: 'lowest', description: 'Payment before shipment' },
  { value: 'letter_of_credit', label: 'Letter of Credit (LC)', risk: 'low', description: 'Bank guarantee' },
  { value: 'documents_against_payment', label: 'Documents Against Payment (D/P)', risk: 'medium', description: 'Payment on document presentation' },
  { value: 'documents_against_acceptance', label: 'Documents Against Acceptance (D/A)', risk: 'medium-high', description: 'Payment on acceptance' },
  { value: 'open_account', label: 'Open Account', risk: 'high', description: 'Payment after delivery' },
  { value: 'consignment', label: 'Consignment', risk: 'highest', description: 'Payment on sale' },
  { value: 'bank_guarantee', label: 'Bank Guarantee', risk: 'low', description: 'BG-backed payment' },
  { value: 'escrow', label: 'Escrow', risk: 'low', description: 'Third-party escrow' },
];

// Shipping Methods
const SHIPPING_METHOD_OPTIONS = [
  { value: 'sea', label: 'Sea Freight (FCL)', icon: Ship, description: 'Full container load' },
  { value: 'sea_lcl', label: 'Sea Freight (LCL)', icon: Ship, description: 'Less than container load' },
  { value: 'air', label: 'Air Freight', icon: Plane, description: 'Air cargo' },
  { value: 'land', label: 'Land Transport', icon: Truck, description: 'Road/rail' },
  { value: 'multimodal', label: 'Multimodal', icon: Ship, description: 'Combined transport' },
  { value: 'courier', label: 'Courier/Express', icon: Truck, description: 'Express delivery' },
];

// Currency Options
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: 'E' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'AED' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: 'P' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: 'Y' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: 'Rs' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: 'Y' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: 'SAR' },
  { value: 'QAR', label: 'QAR - Qatari Riyal', symbol: 'QAR' },
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar', symbol: 'KD' },
  { value: 'OMR', label: 'OMR - Omani Rial', symbol: 'OMR' },
  { value: 'BHD', label: 'BHD - Bahraini Dinar', symbol: 'BD' },
];

// Unit Options
const UNIT_OPTIONS = [
  { value: 'MT', label: 'MT (Metric Ton)' },
  { value: 'KG', label: 'KG (Kilogram)' },
  { value: 'PCS', label: 'PCS (Pieces)' },
  { value: 'LM', label: 'LM (Linear Meter)' },
  { value: 'SQM', label: 'SQM (Square Meter)' },
  { value: 'CBM', label: 'CBM (Cubic Meter)' },
  { value: 'COIL', label: 'COIL (Coils)' },
  { value: 'BUNDLE', label: 'BUNDLE (Bundles)' },
  { value: 'SHEET', label: 'SHEET (Sheets)' },
  { value: 'SET', label: 'SET (Sets)' },
];

// Export Order Status Options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing Shipment' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Exchange Rate Source options (for FTA audit trail)
const EXCHANGE_RATE_SOURCE_OPTIONS = [
  { value: 'uae_central_bank', label: 'UAE Central Bank' },
  { value: 'commercial_bank', label: 'Commercial Bank Rate' },
  { value: 'oanda', label: 'OANDA (Forex)' },
  { value: 'reuters', label: 'Reuters' },
  { value: 'contract_rate', label: 'Contract Rate' },
  { value: 'manual', label: 'Manual Entry' },
];

// ============================================================
// INITIAL STATE
// ============================================================

const createEmptyLineItem = () => ({
  id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  product_id: '',
  product_name: '',
  description: '',
  grade: '',
  finish: '',
  thickness: '',
  width: '',
  length: '',
  outer_diameter: '',
  quantity: 0,
  unit: 'MT',
  unit_price: 0,
  total_price: 0,
  hs_code: '',
  country_of_origin: 'AE', // UAE for direct exports
  mill_name: '',
  heat_number: '',
  // Re-export item tracking
  original_import_item_id: '',
  original_import_boe: '',
});

const createEmptyOrder = () => ({
  // Header
  order_number: '',
  status: 'draft',
  order_date: new Date().toISOString().split('T')[0],
  expected_ship_date: '',
  exporter_trn: '', // UAE company TRN (seller)

  // Customer Details
  customer_id: '',
  customer_name: '',
  customer_address: '',
  customer_country: '',
  customer_contact_name: '',
  customer_contact_email: '',
  customer_contact_phone: '',

  // Customer VAT Details (for GCC exports)
  customer_vat_id: '', // Customer's VAT registration number
  customer_gcc_vat_id: '', // GCC-specific VAT ID

  // Destination Details
  destination_country: '',
  destination_port: '',
  destination_address: '',

  // Origin Details (UAE)
  origin_port: 'AEJEA', // Default Jebel Ali
  origin_address: '',
  origin_emirate: 'Dubai',

  // Shipping Terms
  incoterms: 'FOB',
  payment_method: 'letter_of_credit',
  shipping_method: 'sea',
  lc_number: '',
  pi_number: '', // Proforma Invoice
  po_number: '', // Customer PO

  // Shipping Details
  vessel_name: '',
  bl_number: '', // Bill of Lading
  awb_number: '', // Air Waybill (for air freight)
  container_numbers: '',
  etd: '', // Estimated Time of Departure
  eta: '', // Estimated Time of Arrival
  actual_ship_date: '',

  // Currency & Totals
  currency: 'USD',
  exchange_rate: 1,
  subtotal: 0,
  freight_cost: 0,
  insurance_cost: 0,
  other_charges: 0,
  vat_amount: 0, // Should be 0 for exports
  total: 0,

  // UAE VAT EXPORT COMPLIANCE FIELDS (CRITICAL - Article 45)
  export_vat_treatment: 'zero_rated', // Article 45 UAE VAT Law
  export_type: 'direct_export', // direct_export, re_export, dz_export, gcc_export
  is_designated_zone_export: false, // Article 51
  designated_zone_origin: '', // If exporting FROM a DZ

  // Re-Export Tracking (for goods imported then re-exported)
  is_re_export: false,
  original_import_boe: '', // Original Bill of Entry number
  original_import_date: '',
  original_import_value: 0,
  re_export_reason: '',

  // GCC Export Fields (Article 30)
  is_gcc_export: false,
  gcc_country_code: '',
  gcc_vat_treatment: 'zero_rated', // Depends on customer registration

  // Export Documentation
  export_declaration_number: '',
  export_declaration_date: '',
  certificate_of_origin: '',
  certificate_of_origin_date: '',
  commercial_invoice_number: '',
  packing_list_number: '',

  // Form 201 VAT Return Mapping
  form_201_box: 'box_2', // Zero-rated supplies (Box 2)
  zero_rated_export_value: 0, // Maps to Box 2

  // Exchange Rate Audit Trail (FTA Requirement)
  exchange_rate_source: 'uae_central_bank',
  exchange_rate_date: new Date().toISOString().split('T')[0],
  exchange_rate_reference: '',

  // VAT Return Period
  vat_return_period: '', // YYYY-MM format

  // Line Items
  items: [createEmptyLineItem()],

  // Notes & Documents
  notes: '',
  internal_notes: '',
  special_instructions: '',
});

// ============================================================
// MAIN COMPONENT
// ============================================================

const ExportOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const isEditMode = Boolean(id);

  // Form State
  const [order, setOrder] = useState(createEmptyOrder);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Reference Data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Pricelist state
  const [selectedPricelistId, setSelectedPricelistId] = useState(null);
  const [pricelistName, setPricelistName] = useState(null);

  // Search States
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await customerService.getCustomers({ limit: 1000, status: 'active' });
        const customerList = response.customers || response.data?.customers || response || [];
        setCustomers(Array.isArray(customerList) ? customerList : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        notificationService.error('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productService.getProducts({ limit: 1000 });
        const productList = response.products || response.data?.products || response || [];
        setProducts(Array.isArray(productList) ? productList : []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        notificationService.error('Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch existing order for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const response = await exportOrderService.getExportOrder(id);
          const orderData = response.exportOrder || response.data || response;

          // Ensure items array exists
          if (!orderData.items || orderData.items.length === 0) {
            orderData.items = [createEmptyLineItem()];
          }

          setOrder(orderData);
        } catch (error) {
          console.error('Failed to fetch order:', error);
          notificationService.error('Failed to load export order');
          navigate('/import-export');
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, isEditMode, navigate]);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  // Calculate line item total
  const calculateItemTotal = useCallback((item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    return quantity * unitPrice;
  }, []);

  // Calculate all totals including Form 201 VAT Return fields
  const calculations = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item);
    }, 0);

    const freight = parseFloat(order.freight_cost) || 0;
    const insurance = parseFloat(order.insurance_cost) || 0;
    const otherCharges = parseFloat(order.other_charges) || 0;
    const exchangeRate = parseFloat(order.exchange_rate) || 1;

    // Total value before VAT
    const totalValue = subtotal + freight + insurance + otherCharges;

    // VAT is ALWAYS 0 for exports (Article 45 UAE VAT Law)
    const vatAmount = 0;

    // Total = Subtotal + charges (no VAT for exports)
    const total = totalValue;

    // Value in AED for Form 201 reporting
    const totalInAED = total * exchangeRate;

    // Form 201 Box 2 - Zero-rated supplies (exports)
    const zeroRatedExportValue = order.export_vat_treatment === 'zero_rated' || order.export_vat_treatment === 're_export'
      ? totalInAED
      : 0;

    // Form 201 Box 6 - Exempt supplies
    const exemptValue = order.export_vat_treatment === 'exempt' ? totalInAED : 0;

    return {
      subtotal,
      freight,
      insurance,
      otherCharges,
      totalValue,
      vatAmount,
      total,
      totalInAED,
      zeroRatedExportValue,
      exemptValue,
      exchangeRate,
    };
  }, [order.items, order.freight_cost, order.insurance_cost, order.other_charges, order.exchange_rate, order.export_vat_treatment, calculateItemTotal]);

  // Update order with calculated values
  useEffect(() => {
    setOrder(prev => ({
      ...prev,
      subtotal: calculations.subtotal,
      vat_amount: calculations.vatAmount,
      total: calculations.total,
      zero_rated_export_value: calculations.zeroRatedExportValue,
    }));
  }, [calculations]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFieldChange = useCallback((field, value) => {
    setOrder(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-update export type when VAT treatment changes
      if (field === 'export_vat_treatment') {
        if (value === 're_export') {
          updated.export_type = 're_export';
          updated.is_re_export = true;
        } else if (value === 'zero_rated' && prev.export_type === 're_export') {
          updated.export_type = 'direct_export';
          updated.is_re_export = false;
        }
      }

      // Auto-update when export type changes
      if (field === 'export_type') {
        if (value === 're_export') {
          updated.is_re_export = true;
          updated.export_vat_treatment = 're_export';
        } else if (value === 'dz_export') {
          updated.is_designated_zone_export = true;
        } else if (value === 'gcc_export') {
          updated.is_gcc_export = true;
        } else {
          updated.is_re_export = false;
          updated.is_designated_zone_export = value === 'dz_export';
          updated.is_gcc_export = value === 'gcc_export';
        }
      }

      // Auto-detect GCC export based on destination
      if (field === 'destination_country') {
        const isGCC = GCC_COUNTRIES.some(c => c.code === value || c.name.toLowerCase() === value.toLowerCase());
        if (isGCC) {
          updated.is_gcc_export = true;
          updated.export_type = 'gcc_export';
          const gccCountry = GCC_COUNTRIES.find(c => c.code === value || c.name.toLowerCase() === value.toLowerCase());
          if (gccCountry) {
            updated.gcc_country_code = gccCountry.code;
          }
        } else {
          updated.is_gcc_export = false;
          if (prev.export_type === 'gcc_export') {
            updated.export_type = 'direct_export';
          }
        }
      }

      // Auto-set Form 201 box based on VAT treatment
      if (field === 'export_vat_treatment') {
        const treatment = EXPORT_VAT_TREATMENT_OPTIONS.find(t => t.value === value);
        if (treatment) {
          updated.form_201_box = treatment.form_201_box;
        }
      }

      // Auto-derive origin emirate from origin port
      if (field === 'origin_port') {
        const port = UAE_PORTS.find(p => p.value === value);
        if (port) {
          updated.origin_emirate = port.emirate;
        }
      }

      return updated;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleCustomerChange = useCallback(async (customerId) => {
    const customer = customers.find(c => c.id === customerId || c.id === parseInt(customerId));
    if (customer) {
      setOrder(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name || customer.company_name || '',
        customer_address: customer.address || '',
        customer_country: customer.country || '',
        customer_contact_name: customer.contact_name || '',
        customer_contact_email: customer.contact_email || customer.email || '',
        customer_contact_phone: customer.contact_phone || customer.phone || '',
        customer_vat_id: customer.vat_number || customer.trn_number || '',
        destination_country: customer.country || '',
      }));
      setShowCustomerDropdown(false);
      setCustomerSearchTerm('');

      // Fetch customer's pricelist
      if (customer.pricelistId || customer.pricelist_id) {
        try {
          const pricelistId = customer.pricelistId || customer.pricelist_id;
          const response = await pricelistService.getById(pricelistId);
          setSelectedPricelistId(pricelistId);
          setPricelistName(response.pricelist?.name || response.data?.name || 'Custom Price List');
        } catch (error) {
          // Silently ignore - pricelist is optional
          setSelectedPricelistId(null);
          setPricelistName(null);
        }
      } else {
        // Use default pricelist
        setSelectedPricelistId(null);
        setPricelistName('Default Price List');
      }
    }
  }, [customers]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return customers;
    const term = customerSearchTerm.toLowerCase();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(term) ||
      (c.company_name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term),
    );
  }, [customers, customerSearchTerm]);

  // Line Item Handlers
  const handleItemChange = useCallback((index, field, value) => {
    setOrder(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate total price
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0;
        const price = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(newItems[index].unit_price) || 0;
        newItems[index].total_price = qty * price;
      }

      return { ...prev, items: newItems };
    });

    // Clear item-specific errors
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`item_${index}_${field}`]: null }));
    }
  }, [errors]);

  const handleProductSelect = useCallback(async (index, productId) => {
    const product = products.find(p => p.id === productId || p.id === parseInt(productId));
    if (product) {
      // Fetch price from pricelist if available
      let sellingPrice = product.sellingPrice || product.selling_price || product.price || 0;
      if (selectedPricelistId) {
        try {
          const priceResponse = await pricelistService.getPriceForQuantity(product.id, selectedPricelistId, 1);
          sellingPrice = priceResponse.price || priceResponse.data?.price || sellingPrice;
        } catch (error) {
          // Fallback to default product price
          console.debug('Pricelist price not found, using default:', error.message);
        }
      }

      setOrder(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          product_id: productId,
          product_name: product.displayName || product.display_name || product.uniqueName || product.unique_name || '',
          description: product.description || '',
          grade: product.grade || '',
          finish: product.finish || '',
          hs_code: product.hs_code || '',
          country_of_origin: 'AE', // Default to UAE for exports
          unit_price: sellingPrice,
          total_price: (parseFloat(newItems[index].quantity) || 0) * sellingPrice,
        };
        return { ...prev, items: newItems };
      });
    }
  }, [products, selectedPricelistId]);

  const addLineItem = useCallback(() => {
    setOrder(prev => ({
      ...prev,
      items: [...prev.items, createEmptyLineItem()],
    }));
  }, []);

  const removeLineItem = useCallback((index) => {
    setOrder(prev => {
      if (prev.items.length <= 1) {
        notificationService.warning('At least one line item is required');
        return prev;
      }
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  }, []);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required fields validation
    if (!order.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (!order.destination_country) {
      newErrors.destination_country = 'Destination country is required';
    }

    if (!order.destination_port) {
      newErrors.destination_port = 'Destination port is required';
    }

    if (!order.incoterms) {
      newErrors.incoterms = 'Incoterms is required';
    }

    if (!order.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    if (!order.origin_port) {
      newErrors.origin_port = 'Origin port is required';
    }

    // Validate line items
    const hasValidItem = order.items.some(item =>
      item.product_name && parseFloat(item.quantity) > 0 && parseFloat(item.unit_price) > 0,
    );

    if (!hasValidItem) {
      newErrors.items = 'At least one complete line item is required';
    }

    // HS Code validation for each item (required for exports)
    order.items.forEach((item, index) => {
      if (item.product_name && !item.hs_code) {
        newErrors[`item_${index}_hs_code`] = 'HS Code required for exports';
      }
    });

    // Validate exchange rate
    if (!order.exchange_rate || parseFloat(order.exchange_rate) <= 0) {
      newErrors.exchange_rate = 'Valid exchange rate is required';
    }

    // UAE VAT Compliance Validations (stricter for non-draft orders)
    if (order.status !== 'draft') {
      // Exporter TRN validation
      const trnValidation = validateTRN(order.exporter_trn);
      if (!trnValidation.valid) {
        newErrors.exporter_trn = trnValidation.message;
      }

      // Exchange rate source (FTA audit trail requirement)
      if (!order.exchange_rate_source) {
        newErrors.exchange_rate_source = 'Exchange rate source required for FTA compliance';
      }

      // Export declaration required for shipped orders
      if ((order.status === 'shipped' || order.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed')) {
        if (!order.export_declaration_number) {
          newErrors.export_declaration_number = 'Export declaration number required for shipped orders';
        }
      }
    }

    // Re-export validation
    if (order.is_re_export) {
      if (!order.original_import_boe) {
        newErrors.original_import_boe = 'Original Bill of Entry required for re-exports';
      }
      if (!order.original_import_date) {
        newErrors.original_import_date = 'Original import date required for re-exports';
      }
    }

    // GCC export validation (Article 30)
    if (order.is_gcc_export) {
      if (!order.gcc_country_code) {
        newErrors.gcc_country_code = 'GCC country is required';
      }
      // For GCC exports, customer VAT ID required for zero-rating
      if (order.status !== 'draft' && !order.customer_gcc_vat_id && !order.customer_vat_id) {
        newErrors.customer_vat_id = 'Customer VAT ID required for GCC exports (Article 30)';
      }
    }

    // Designated Zone export validation
    if (order.is_designated_zone_export || order.export_type === 'dz_export') {
      if (!order.designated_zone_origin) {
        newErrors.designated_zone_origin = 'Designated Zone origin required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [order]);

  // ============================================================
  // SUBMIT HANDLERS
  // ============================================================

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...order,
        // Ensure numeric fields are numbers
        exchange_rate: parseFloat(order.exchange_rate) || 1,
        freight_cost: parseFloat(order.freight_cost) || 0,
        insurance_cost: parseFloat(order.insurance_cost) || 0,
        other_charges: parseFloat(order.other_charges) || 0,
        original_import_value: parseFloat(order.original_import_value) || 0,
        subtotal: calculations.subtotal,
        vat_amount: calculations.vatAmount,
        total: calculations.total,
        zero_rated_export_value: calculations.zeroRatedExportValue,
        // Clean up items
        items: order.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: calculateItemTotal(item),
        })).filter(item => item.product_name && item.quantity > 0),
      };

      let response;
      if (isEditMode) {
        response = await exportOrderService.updateExportOrder(id, submitData);
        notificationService.success('Export order updated successfully');
      } else {
        response = await exportOrderService.createExportOrder(submitData);
        notificationService.success('Export order created successfully');
      }

      // Navigate to import/export dashboard
      navigate('/import-export');
    } catch (error) {
      console.error('Failed to save export order:', error);
      notificationService.error(error.message || 'Failed to save export order');
    } finally {
      setIsSubmitting(false);
    }
  }, [order, calculations, validateForm, isEditMode, id, navigate, calculateItemTotal]);

  const handleSaveDraft = useCallback(async () => {
    setOrder(prev => ({ ...prev, status: 'draft' }));
    // Small delay to ensure state is updated
    setTimeout(() => handleSubmit(), 100);
  }, [handleSubmit]);

  // ============================================================
  // CURRENCY FORMATTING
  // ============================================================

  const formatCurrency = useCallback((amount, currency = order.currency) => {
    const currencyConfig = CURRENCY_OPTIONS.find(c => c.value === currency);
    const symbol = currencyConfig?.symbol || '$';
    return `${symbol} ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [order.currency]);

  const formatAED = useCallback((amount) => {
    return `AED ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  // ============================================================
  // DESTINATION PORT GROUPED BY REGION
  // ============================================================

  const groupedPorts = useMemo(() => {
    const groups = {};
    INTERNATIONAL_PORTS.forEach(port => {
      if (!groups[port.region]) {
        groups[port.region] = [];
      }
      groups[port.region].push(port);
    });
    return groups;
  }, []);

  // ============================================================
  // RENDER LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading export order...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER FORM
  // ============================================================

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/import-export')}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isEditMode ? 'Edit Export Order' : 'Create Export Order'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {order.order_number && (
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      #{order.order_number}
                    </span>
                  )}
                  <StatusBadge status={order.status} />
                  <VatBadge treatment={order.export_vat_treatment} form201Box={order.form_201_box} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/import-export')}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
                Save as Draft
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? 'Update Order' : 'Create Order'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Order Information Section */}
        <Card title="Order Information" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              label="Order Number"
              value={order.order_number || '(Auto-assigned on save)'}
              disabled
              placeholder="Auto-generated"
            />
            <Input
              label="Order Date"
              type="date"
              value={order.order_date}
              onChange={(e) => handleFieldChange('order_date', e.target.value)}
              required
            />
            <Input
              label="Expected Ship Date"
              type="date"
              value={order.expected_ship_date}
              onChange={(e) => handleFieldChange('expected_ship_date', e.target.value)}
            />
            <Select
              label="Status"
              value={order.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              required
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <div>
              <Input
                label="Exporter TRN"
                value={order.exporter_trn}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                  handleFieldChange('exporter_trn', value);
                }}
                placeholder="100XXXXXXXXXXXX"
                error={errors.exporter_trn}
                required={order.status !== 'draft'}
                helperText="Your UAE company TRN"
              />
              {order.exporter_trn && order.exporter_trn.length > 0 && (
                <div className={`text-xs mt-1 ${validateTRN(order.exporter_trn).valid ? 'text-green-500' : 'text-amber-500'}`}>
                  {validateTRN(order.exporter_trn).message}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="PI Number"
              value={order.pi_number}
              onChange={(e) => handleFieldChange('pi_number', e.target.value)}
              placeholder="Proforma Invoice #"
            />
            <Input
              label="Customer PO Number"
              value={order.po_number}
              onChange={(e) => handleFieldChange('po_number', e.target.value)}
              placeholder="Customer Purchase Order #"
            />
            <Input
              label="LC Number"
              value={order.lc_number}
              onChange={(e) => handleFieldChange('lc_number', e.target.value)}
              placeholder="Letter of Credit #"
            />
          </div>
        </Card>

        {/* Customer Section */}
        <Card title="Customer Details" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Search/Select */}
            <div className="relative">
              <label className={`block text-xs font-medium mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} after:content-["*"] after:ml-1 after:text-red-500`}>
                Customer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm || order.customer_name}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className={`w-full px-2 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                  } ${errors.customer_id ? 'border-red-500' : ''}`}
                />
                <Search className={`absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className={`absolute z-20 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerChange(customer.id)}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="font-medium">{customer.name || customer.company_name}</div>
                      {customer.country && (
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {customer.country}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errors.customer_id && (
                <p className="text-xs text-red-500 mt-0.5">{errors.customer_id}</p>
              )}
            </div>

            <Input
              label="Customer Name"
              value={order.customer_name}
              onChange={(e) => handleFieldChange('customer_name', e.target.value)}
              disabled={!!order.customer_id}
            />
            <Input
              label="Customer VAT ID"
              value={order.customer_vat_id}
              onChange={(e) => handleFieldChange('customer_vat_id', e.target.value)}
              placeholder="Customer Tax Registration #"
              error={errors.customer_vat_id}
              helperText={order.is_gcc_export ? 'Required for GCC exports (Article 30)' : 'Optional'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="Contact Name"
              value={order.customer_contact_name}
              onChange={(e) => handleFieldChange('customer_contact_name', e.target.value)}
            />
            <Input
              label="Contact Email"
              type="email"
              value={order.customer_contact_email}
              onChange={(e) => handleFieldChange('customer_contact_email', e.target.value)}
            />
            <Input
              label="Contact Phone"
              value={order.customer_contact_phone}
              onChange={(e) => handleFieldChange('customer_contact_phone', e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Customer Address"
              value={order.customer_address}
              onChange={(e) => handleFieldChange('customer_address', e.target.value)}
              rows={2}
              placeholder="Full customer address..."
            />
          </div>
        </Card>

        {/* Destination & Origin Section */}
        <Card title="Shipping Route" icon={Ship}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Origin (UAE) */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                <MapPin className="h-4 w-4" />
                Origin (UAE)
              </h4>
              <div className="space-y-4">
                <Select
                  label="Origin Port"
                  value={order.origin_port}
                  onChange={(e) => handleFieldChange('origin_port', e.target.value)}
                  error={errors.origin_port}
                  required
                >
                  <option value="">Select Port</option>
                  {UAE_PORTS.map(port => (
                    <option key={port.value} value={port.value}>
                      {port.label} ({port.type})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Origin Emirate"
                  value={order.origin_emirate}
                  disabled
                  helperText="Auto-derived from port"
                />
                <Textarea
                  label="Origin Address"
                  value={order.origin_address}
                  onChange={(e) => handleFieldChange('origin_address', e.target.value)}
                  rows={2}
                  placeholder="Warehouse/factory address..."
                />
              </div>
            </div>

            {/* Destination */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                <Globe className="h-4 w-4" />
                Destination
              </h4>
              <div className="space-y-4">
                <Input
                  label="Destination Country"
                  value={order.destination_country}
                  onChange={(e) => handleFieldChange('destination_country', e.target.value)}
                  placeholder="e.g., United States, India, Germany"
                  error={errors.destination_country}
                  required
                />
                <Select
                  label="Destination Port"
                  value={order.destination_port}
                  onChange={(e) => handleFieldChange('destination_port', e.target.value)}
                  error={errors.destination_port}
                  required
                >
                  <option value="">Select Port</option>
                  {Object.entries(groupedPorts).map(([region, ports]) => (
                    <optgroup key={region} label={region}>
                      {ports.map(port => (
                        <option key={port.value} value={port.value}>
                          {port.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
                <Textarea
                  label="Destination Address"
                  value={order.destination_address}
                  onChange={(e) => handleFieldChange('destination_address', e.target.value)}
                  rows={2}
                  placeholder="Full delivery address..."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Shipping Terms Section */}
        <Card title="Trade & Payment Terms" icon={CreditCard}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Incoterms"
              value={order.incoterms}
              onChange={(e) => handleFieldChange('incoterms', e.target.value)}
              error={errors.incoterms}
              required
            >
              {INCOTERMS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Payment Method"
              value={order.payment_method}
              onChange={(e) => handleFieldChange('payment_method', e.target.value)}
              error={errors.payment_method}
              required
            >
              {PAYMENT_METHOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Shipping Method"
              value={order.shipping_method}
              onChange={(e) => handleFieldChange('shipping_method', e.target.value)}
            >
              {SHIPPING_METHOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Input
              label="Container Numbers"
              value={order.container_numbers}
              onChange={(e) => handleFieldChange('container_numbers', e.target.value)}
              placeholder="CONT123, CONT456"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Input
              label="Vessel/Flight Name"
              value={order.vessel_name}
              onChange={(e) => handleFieldChange('vessel_name', e.target.value)}
              placeholder="Ship/Aircraft name"
            />
            <Input
              label="B/L Number"
              value={order.bl_number}
              onChange={(e) => handleFieldChange('bl_number', e.target.value)}
              placeholder="Bill of Lading #"
            />
            <Input
              label="AWB Number"
              value={order.awb_number}
              onChange={(e) => handleFieldChange('awb_number', e.target.value)}
              placeholder="Air Waybill # (if air freight)"
            />
            <Input
              label="Actual Ship Date"
              type="date"
              value={order.actual_ship_date}
              onChange={(e) => handleFieldChange('actual_ship_date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="ETD (Estimated Departure)"
              type="date"
              value={order.etd}
              onChange={(e) => handleFieldChange('etd', e.target.value)}
            />
            <Input
              label="ETA (Estimated Arrival)"
              type="date"
              value={order.eta}
              onChange={(e) => handleFieldChange('eta', e.target.value)}
            />
          </div>
        </Card>

        {/* UAE VAT Export Compliance Section - HIGHLIGHTED */}
        <Card
          title="UAE VAT Export Compliance (Article 45)"
          icon={Globe}
          highlight={true}
          highlightColor="green"
        >
          {/* VAT Treatment Alert */}
          <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-start gap-3">
              <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <p className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                  Export VAT Treatment: Zero-Rated (0%)
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                  Under UAE VAT Law Article 45, exports of goods outside the UAE are zero-rated supplies.
                  This means no VAT is charged but the transaction must be reported in Form 201 Box 2.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Export VAT Treatment"
              value={order.export_vat_treatment}
              onChange={(e) => handleFieldChange('export_vat_treatment', e.target.value)}
              required
            >
              {EXPORT_VAT_TREATMENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Export Type"
              value={order.export_type}
              onChange={(e) => handleFieldChange('export_type', e.target.value)}
              required
            >
              {EXPORT_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Input
              label="Form 201 Box"
              value={order.form_201_box === 'box_2' ? 'Box 2 - Zero-Rated Supplies' : order.form_201_box === 'box_6' ? 'Box 6 - Exempt Supplies' : order.form_201_box}
              disabled
              helperText="Auto-determined by VAT treatment"
            />
          </div>

          {/* Designated Zone Export Section */}
          {(order.is_designated_zone_export || order.export_type === 'dz_export') && (
            <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <Building2 className="h-4 w-4" />
                Designated Zone Export (Article 51)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Designated Zone Origin"
                  value={order.designated_zone_origin}
                  onChange={(e) => handleFieldChange('designated_zone_origin', e.target.value)}
                  error={errors.designated_zone_origin}
                  required
                >
                  <option value="">Select Designated Zone</option>
                  {UAE_DESIGNATED_ZONES.map(zone => (
                    <option key={zone.code} value={zone.code}>
                      {zone.name} ({zone.emirate})
                    </option>
                  ))}
                </Select>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Goods stored in a Designated Zone being exported outside UAE.
                    Zero-rated under Article 51 conditions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Re-Export Section */}
          {order.is_re_export && (
            <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                <Package className="h-4 w-4" />
                Re-Export Details (Previously Imported Goods)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Original Import BOE"
                  value={order.original_import_boe}
                  onChange={(e) => handleFieldChange('original_import_boe', e.target.value)}
                  placeholder="Bill of Entry #"
                  error={errors.original_import_boe}
                  required
                />
                <Input
                  label="Original Import Date"
                  type="date"
                  value={order.original_import_date}
                  onChange={(e) => handleFieldChange('original_import_date', e.target.value)}
                  error={errors.original_import_date}
                  required
                />
                <Input
                  label="Original Import Value (AED)"
                  type="number"
                  value={order.original_import_value}
                  onChange={(e) => handleFieldChange('original_import_value', e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Input
                  label="Re-Export Reason"
                  value={order.re_export_reason}
                  onChange={(e) => handleFieldChange('re_export_reason', e.target.value)}
                  placeholder="e.g., Transit, Rejected goods"
                />
              </div>
              <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  Re-exports are zero-rated. Link to original import BOE for customs duty drawback eligibility.
                </p>
              </div>
            </div>
          )}

          {/* GCC Export Section */}
          {order.is_gcc_export && (
            <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                <Globe className="h-4 w-4" />
                GCC Export (Article 30)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="GCC Country"
                  value={order.gcc_country_code}
                  onChange={(e) => handleFieldChange('gcc_country_code', e.target.value)}
                  error={errors.gcc_country_code}
                  required
                >
                  <option value="">Select GCC Country</option>
                  {GCC_COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name} (VAT: {country.vat_rate}%)
                    </option>
                  ))}
                </Select>
                <Input
                  label="Customer GCC VAT ID"
                  value={order.customer_gcc_vat_id}
                  onChange={(e) => handleFieldChange('customer_gcc_vat_id', e.target.value)}
                  placeholder="GCC Tax Registration #"
                  helperText="Required for zero-rating"
                />
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                    <strong>GCC VAT Treatment:</strong> Zero-rated if customer is VAT-registered in destination GCC country.
                    Otherwise, standard UAE treatment may apply.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form 201 VAT Return Mapping */}
          <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              <Calculator className="h-4 w-4" />
              Form 201 VAT Return Preview
            </h4>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Box 2: Zero-Rated Supplies</p>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatAED(calculations.zeroRatedExportValue)}
                  </p>
                </div>
                {order.export_vat_treatment === 'exempt' && (
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Box 6: Exempt Supplies</p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatAED(calculations.exemptValue)}
                    </p>
                  </div>
                )}
                <div>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>VAT Amount (Output)</p>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    AED 0.00
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No output VAT on exports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Currency & Exchange Rate Section */}
        <Card title="Currency & Exchange Rate" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Currency"
                  value={order.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                >
                  {CURRENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                <Input
                  label="Exchange Rate to AED"
                  type="number"
                  value={order.exchange_rate}
                  onChange={(e) => handleFieldChange('exchange_rate', e.target.value)}
                  min="0"
                  step="0.0001"
                  error={errors.exchange_rate}
                  required
                  helperText={order.currency === 'AED' ? 'N/A for AED' : `1 ${order.currency} = X AED`}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Rate Source"
                  value={order.exchange_rate_source}
                  onChange={(e) => handleFieldChange('exchange_rate_source', e.target.value)}
                  error={errors.exchange_rate_source}
                  required={order.status !== 'draft'}
                >
                  {EXCHANGE_RATE_SOURCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                <Input
                  label="Rate Date"
                  type="date"
                  value={order.exchange_rate_date}
                  onChange={(e) => handleFieldChange('exchange_rate_date', e.target.value)}
                />
                <Input
                  label="Reference #"
                  value={order.exchange_rate_reference}
                  onChange={(e) => handleFieldChange('exchange_rate_reference', e.target.value)}
                  placeholder="Central Bank bulletin #"
                />
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                FTA Exchange Rate Audit Trail
              </h4>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                UAE FTA requires documented exchange rates for VAT returns.
                Use UAE Central Bank rates for compliance. Keep reference numbers for audit purposes.
              </p>
              {order.currency !== 'AED' && calculations.totalInAED > 0 && (
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total in AED:
                  </p>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                    {formatAED(calculations.totalInAED)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Line Items Section */}
        <Card title="Line Items" icon={Package}>
          {errors.items && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{errors.items}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <th className="text-left pb-2 pr-2 w-8">#</th>
                  <th className="text-left pb-2 pr-2 min-w-[180px]">Product</th>
                  <th className="text-left pb-2 pr-2 w-20">Grade</th>
                  <th className="text-left pb-2 pr-2 w-20">Finish</th>
                  <th className="text-left pb-2 pr-2 w-28">Dimensions</th>
                  <th className="text-right pb-2 pr-2 w-20">Qty</th>
                  <th className="text-left pb-2 pr-2 w-16">Unit</th>
                  <th className="text-right pb-2 pr-2 w-24">Unit Price</th>
                  <th className="text-left pb-2 pr-2 w-28">HS Code *</th>
                  <th className="text-left pb-2 pr-2 w-16">Origin</th>
                  <th className="text-right pb-2 pr-2 w-28">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {order.items.map((item, index) => (
                  <tr key={item.id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className="py-2 pr-2">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="space-y-1">
                        <Select
                          value={item.product_id}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="text-xs"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.displayName || product.display_name || product.uniqueName || product.unique_name || 'N/A'}
                            </option>
                          ))}
                        </Select>
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                          placeholder="Or enter name"
                          className={`w-full px-2 py-1 text-xs border rounded ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-800 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.grade}
                        onChange={(e) => handleItemChange(index, 'grade', e.target.value)}
                        placeholder="304, 316L"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.finish}
                        onChange={(e) => handleItemChange(index, 'finish', e.target.value.toUpperCase())}
                        placeholder="2B, BA"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={item.thickness}
                          onChange={(e) => handleItemChange(index, 'thickness', e.target.value)}
                          placeholder="T"
                          title="Thickness"
                          className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-800 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                        />
                        <input
                          type="text"
                          value={item.width}
                          onChange={(e) => handleItemChange(index, 'width', e.target.value)}
                          placeholder="W"
                          title="Width"
                          className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-800 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                        />
                        <input
                          type="text"
                          value={item.length}
                          onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                          placeholder="L"
                          title="Length"
                          className={`w-10 px-1 py-1 text-xs border rounded text-center ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-800 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.001"
                        className={`w-full px-2 py-1 text-xs border rounded text-right ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className={`w-full px-1 py-1 text-xs border rounded ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        {UNIT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full px-2 py-1 text-xs border rounded text-right ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.hs_code}
                        onChange={(e) => handleItemChange(index, 'hs_code', e.target.value)}
                        placeholder="72XX.XX.XX"
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        } ${errors[`item_${index}_hs_code`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`item_${index}_hs_code`] && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.country_of_origin}
                        onChange={(e) => handleItemChange(index, 'country_of_origin', e.target.value)}
                        placeholder="AE"
                        maxLength={2}
                        className={`w-full px-2 py-1 text-xs border rounded text-center ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculateItemTotal(item))}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors ${
                          order.items.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={order.items.length <= 1}
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4" />
              Add Line Item
            </Button>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} |
              Subtotal: <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <p className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                <strong>HS Code Required:</strong> Harmonized System codes are mandatory for export declarations.
                Ensure correct classification for customs clearance.
              </p>
            </div>
          </div>
        </Card>

        {/* Cost Summary Section */}
        <Card title="Cost Summary" icon={Calculator}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Cost Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Freight Cost (${order.currency})`}
                  type="number"
                  value={order.freight_cost}
                  onChange={(e) => handleFieldChange('freight_cost', e.target.value)}
                  min="0"
                  step="0.01"
                  helperText="Sea/air freight charges"
                />
                <Input
                  label={`Insurance Cost (${order.currency})`}
                  type="number"
                  value={order.insurance_cost}
                  onChange={(e) => handleFieldChange('insurance_cost', e.target.value)}
                  min="0"
                  step="0.01"
                  helperText="Cargo insurance"
                />
              </div>
              <Input
                label={`Other Charges (${order.currency})`}
                type="number"
                value={order.other_charges}
                onChange={(e) => handleFieldChange('other_charges', e.target.value)}
                min="0"
                step="0.01"
                helperText="Documentation, handling, etc."
              />
            </div>

            {/* Right Column - Totals */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Totals
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Subtotal ({order.currency})
                  </span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(calculations.subtotal)}
                  </span>
                </div>
                {calculations.freight > 0 && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      + Freight
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(calculations.freight)}
                    </span>
                  </div>
                )}
                {calculations.insurance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      + Insurance
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(calculations.insurance)}
                    </span>
                  </div>
                )}
                {calculations.otherCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      + Other Charges
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(calculations.otherCharges)}
                    </span>
                  </div>
                )}
                <div className={`border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      VAT (Export = 0%)
                    </span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(0)}
                    </span>
                  </div>
                </div>
                <div className={`border-t pt-3 mt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Total ({order.currency})
                    </span>
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      {formatCurrency(calculations.total)}
                    </span>
                  </div>
                  {order.currency !== 'AED' && (
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Equivalent in AED
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatAED(calculations.totalInAED)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Export VAT Reminder */}
              <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-start gap-2">
                  <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                      Zero-Rated Export
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                      No VAT charged. Report in Form 201 Box 2.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Export Documentation Section */}
        <Card title="Export Documentation" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Export Declaration Number"
              value={order.export_declaration_number}
              onChange={(e) => handleFieldChange('export_declaration_number', e.target.value)}
              placeholder="Customs declaration #"
              error={errors.export_declaration_number}
              required={order.status === 'shipped' || order.status === 'completed'}
            />
            <Input
              label="Export Declaration Date"
              type="date"
              value={order.export_declaration_date}
              onChange={(e) => handleFieldChange('export_declaration_date', e.target.value)}
            />
            <Input
              label="Certificate of Origin"
              value={order.certificate_of_origin}
              onChange={(e) => handleFieldChange('certificate_of_origin', e.target.value)}
              placeholder="COO number"
            />
            <Input
              label="COO Date"
              type="date"
              value={order.certificate_of_origin_date}
              onChange={(e) => handleFieldChange('certificate_of_origin_date', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="Commercial Invoice Number"
              value={order.commercial_invoice_number}
              onChange={(e) => handleFieldChange('commercial_invoice_number', e.target.value)}
              placeholder="CI-XXXX"
            />
            <Input
              label="Packing List Number"
              value={order.packing_list_number}
              onChange={(e) => handleFieldChange('packing_list_number', e.target.value)}
              placeholder="PL-XXXX"
            />
            <Input
              label="VAT Return Period"
              value={order.vat_return_period}
              onChange={(e) => handleFieldChange('vat_return_period', e.target.value)}
              placeholder="YYYY-MM"
              helperText="Period for Form 201 reporting"
            />
          </div>

          {/* Document Upload Section */}
          <div className="mt-6">
            <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Attached Documents
            </h4>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
            } transition-colors cursor-pointer`}>
              <Upload className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag and drop files here, or click to select
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Supports: PDF, images, Excel files (max 10MB each)
              </p>
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Export Documentation Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { name: 'Commercial Invoice', required: true },
                { name: 'Packing List', required: true },
                { name: 'Bill of Lading / Airway Bill', required: true },
                { name: 'Export Declaration', required: true },
                { name: 'Certificate of Origin', required: false },
                { name: 'Insurance Certificate', required: false },
                { name: 'Quality/Mill Test Certificate', required: false },
                { name: 'Letter of Credit (if applicable)', required: false },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${doc.required ? 'bg-red-500' : 'bg-gray-400'}`} />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {doc.name}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Notes Section */}
        <Card title="Notes & Instructions" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Notes (visible on documents)"
              value={order.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={4}
              placeholder="Enter any notes to appear on documents..."
            />
            <Textarea
              label="Internal Notes (not visible on documents)"
              value={order.internal_notes}
              onChange={(e) => handleFieldChange('internal_notes', e.target.value)}
              rows={4}
              placeholder="Internal comments, reminders..."
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Special Instructions"
              value={order.special_instructions}
              onChange={(e) => handleFieldChange('special_instructions', e.target.value)}
              rows={3}
              placeholder="Special handling, shipping, or delivery instructions..."
            />
          </div>
        </Card>

        {/* Bottom Action Bar */}
        <div className={`sticky bottom-0 py-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => navigate('/import-export')}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total: <span className="font-bold">{formatCurrency(calculations.total)}</span>
                {order.currency !== 'AED' && (
                  <span className="ml-2">({formatAED(calculations.totalInAED)})</span>
                )}
              </div>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
                Save as Draft
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? 'Update Order' : 'Create Order'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOrderForm;
