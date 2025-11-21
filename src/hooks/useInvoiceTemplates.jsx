/**
 * useInvoiceTemplates Hook
 * 
 * Manages invoice template selection, styling, and recurring invoice settings.
 * Stores preferences in localStorage.
 * 
 * Templates: Standard, Modern, Minimal, Professional
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

// Template definitions
export const INVOICE_TEMPLATES = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Classic professional layout',
    preview: '📄',
    colors: {
      primary: '#0d9488', // teal-600
      secondary: '#6b7280', // gray-500
      accent: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      border: '#e5e7eb', // gray-200
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    layout: {
      headerStyle: 'centered',
      itemsStyle: 'table',
      totalsPosition: 'right',
      showLogo: true,
      showWatermark: false,
      compactMode: false,
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean minimal design with bold accents',
    preview: '🎨',
    colors: {
      primary: '#2563eb', // blue-600
      secondary: '#64748b', // slate-500
      accent: '#eff6ff', // blue-50
      text: '#0f172a', // slate-900
      border: '#e2e8f0', // slate-200
    },
    fonts: {
      heading: 'Poppins, Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    layout: {
      headerStyle: 'left-aligned',
      itemsStyle: 'cards',
      totalsPosition: 'right',
      showLogo: true,
      showWatermark: false,
      compactMode: false,
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean, focuses on content',
    preview: '✨',
    colors: {
      primary: '#18181b', // zinc-900
      secondary: '#71717a', // zinc-500
      accent: '#fafafa', // zinc-50
      text: '#27272a', // zinc-800
      border: '#d4d4d8', // zinc-300
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    layout: {
      headerStyle: 'left-aligned',
      itemsStyle: 'simple',
      totalsPosition: 'right',
      showLogo: false,
      showWatermark: false,
      compactMode: true,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Formal business style with letterhead',
    preview: '💼',
    colors: {
      primary: '#1e40af', // blue-800
      secondary: '#374151', // gray-700
      accent: '#f9fafb', // gray-50
      text: '#111827', // gray-900
      border: '#d1d5db', // gray-300
    },
    fonts: {
      heading: 'Georgia, Times, serif',
      body: 'Inter, system-ui, sans-serif',
    },
    layout: {
      headerStyle: 'letterhead',
      itemsStyle: 'table',
      totalsPosition: 'right',
      showLogo: true,
      showWatermark: true,
      compactMode: false,
    },
  },
};

// Recurring frequency options
export const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Every 2 Weeks', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'annually', label: 'Annually', days: 365 },
];

const STORAGE_KEY = 'steelapp_invoice_template_prefs';

/**
 * Custom hook for invoice template management
 */
const useInvoiceTemplates = (initialTemplate = 'standard') => {
  // Load saved preferences
  const loadSavedPrefs = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load template preferences:', e);
    }
    return null;
  };

  const savedPrefs = loadSavedPrefs();

  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    savedPrefs?.templateId || initialTemplate
  );

  // Custom colors override
  const [customColors, setCustomColors] = useState(
    savedPrefs?.customColors || null
  );

  // Recurring invoice settings (frontend-only prep)
  const [recurringSettings, setRecurringSettings] = useState({
    enabled: false,
    frequency: 'monthly',
    startDate: null,
    endDate: null,
    sendAutomatically: false,
    reminderDays: 3,
    ...savedPrefs?.recurringSettings,
  });

  // Get current template
  const currentTemplate = useMemo(() => {
    const base = INVOICE_TEMPLATES[selectedTemplateId] || INVOICE_TEMPLATES.standard;
    if (customColors) {
      return {
        ...base,
        colors: { ...base.colors, ...customColors },
      };
    }
    return base;
  }, [selectedTemplateId, customColors]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        templateId: selectedTemplateId,
        customColors,
        recurringSettings,
      }));
    } catch (e) {
      console.warn('Failed to save template preferences:', e);
    }
  }, [selectedTemplateId, customColors, recurringSettings]);

  // Select a template
  const selectTemplate = useCallback((templateId) => {
    if (INVOICE_TEMPLATES[templateId]) {
      setSelectedTemplateId(templateId);
      setCustomColors(null); // Reset custom colors when changing template
    }
  }, []);

  // Update custom colors
  const updateColors = useCallback((colorUpdates) => {
    setCustomColors(prev => ({
      ...(prev || {}),
      ...colorUpdates,
    }));
  }, []);

  // Reset to template defaults
  const resetColors = useCallback(() => {
    setCustomColors(null);
  }, []);

  // Toggle recurring invoice
  const toggleRecurring = useCallback((enabled) => {
    setRecurringSettings(prev => ({
      ...prev,
      enabled: typeof enabled === 'boolean' ? enabled : !prev.enabled,
    }));
  }, []);

  // Update recurring settings
  const updateRecurringSettings = useCallback((updates) => {
    setRecurringSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Get CSS variables for template
  const getTemplateStyles = useCallback(() => {
    const colors = currentTemplate.colors;
    return {
      '--invoice-primary': colors.primary,
      '--invoice-secondary': colors.secondary,
      '--invoice-accent': colors.accent,
      '--invoice-text': colors.text,
      '--invoice-border': colors.border,
      '--invoice-heading-font': currentTemplate.fonts.heading,
      '--invoice-body-font': currentTemplate.fonts.body,
    };
  }, [currentTemplate]);

  // Get template class names for preview
  const getTemplateClasses = useCallback((element) => {
    const layout = currentTemplate.layout;
    const classes = [];

    switch (element) {
      case 'header':
        classes.push(`header-${layout.headerStyle}`);
        break;
      case 'items':
        classes.push(`items-${layout.itemsStyle}`);
        break;
      case 'totals':
        classes.push(`totals-${layout.totalsPosition}`);
        break;
      default:
        break;
    }

    if (layout.compactMode) {
      classes.push('compact');
    }

    return classes.join(' ');
  }, [currentTemplate]);

  // Get all templates for selection UI
  const templates = useMemo(() => {
    return Object.values(INVOICE_TEMPLATES);
  }, []);

  return {
    // State
    selectedTemplateId,
    currentTemplate,
    customColors,
    recurringSettings,
    templates,

    // Template methods
    selectTemplate,
    updateColors,
    resetColors,
    getTemplateStyles,
    getTemplateClasses,

    // Recurring methods
    toggleRecurring,
    updateRecurringSettings,

    // Constants
    RECURRING_FREQUENCIES,
  };
};

export default useInvoiceTemplates;

/**
 * Template selector component
 */
export const TemplateSelector = ({
  templates,
  selectedId,
  onSelect,
  isDarkMode = false,
  className = '',
  columns = 2,
}) => {
  return (
    <div className={`grid gap-3 ${columns === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'} ${className}`}>
      {templates.map((template) => (
        <button
          type="button"
          key={template.id}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onSelect) onSelect(template.id);
          }}
          className={`
            p-3 rounded-lg border-2 text-left transition-all duration-200 min-w-0
            ${selectedId === template.id
              ? isDarkMode
                ? 'border-teal-500 bg-teal-900/30'
                : 'border-teal-500 bg-teal-50'
              : isDarkMode
                ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }
          `}
        >
          <div className="text-xl mb-1">{template.preview}</div>
          <div className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {template.name}
          </div>
          <div className={`text-xs mt-1 line-clamp-2 leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ minHeight: '2rem' }}>
            {template.description}
          </div>
          {/* Color preview dots */}
          <div className="flex gap-1 mt-1.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: template.colors.primary }}
            />
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: template.colors.secondary }}
            />
            <div 
              className="w-3 h-3 rounded-full border" 
              style={{ 
                backgroundColor: template.colors.accent,
                borderColor: template.colors.border,
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
};

/**
 * Recurring invoice settings component
 */
export const RecurringInvoiceSettings = ({
  settings,
  onToggle,
  onUpdate,
  isDarkMode = false,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recurring Invoice
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Automatically create invoices on schedule
          </div>
        </div>
        <button
          onClick={() => onToggle(!settings.enabled)}
          className={`
            relative w-11 h-6 rounded-full transition-colors duration-200
            ${settings.enabled
              ? 'bg-teal-500'
              : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            }
          `}
          role="switch"
          aria-checked={settings.enabled}
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
              transition-transform duration-200
              ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Settings (shown when enabled) */}
      {settings.enabled && (
        <div className={`
          space-y-3 pt-3 border-t
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {/* Frequency */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Frequency
            </label>
            <select
              value={settings.frequency}
              onChange={(e) => onUpdate({ frequency: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border text-sm
                ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            >
              {RECURRING_FREQUENCIES.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={settings.startDate || ''}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border text-sm
                ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            />
          </div>

          {/* End Date (Optional) */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              End Date (Optional)
            </label>
            <input
              type="date"
              value={settings.endDate || ''}
              onChange={(e) => onUpdate({ endDate: e.target.value })}
              min={settings.startDate || undefined}
              className={`
                w-full px-3 py-2 rounded-lg border text-sm
                ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            />
          </div>

          {/* Auto-send toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Send automatically when created
            </span>
            <button
              onClick={() => onUpdate({ sendAutomatically: !settings.sendAutomatically })}
              className={`
                relative w-9 h-5 rounded-full transition-colors duration-200
                ${settings.sendAutomatically
                  ? 'bg-teal-500'
                  : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }
              `}
              role="switch"
              aria-checked={settings.sendAutomatically}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                  transition-transform duration-200
                  ${settings.sendAutomatically ? 'translate-x-4' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Info banner */}
          <div className={`
            p-3 rounded-lg text-xs
            ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}
          `}>
            ℹ️ Recurring invoices require backend setup. This UI prepares the settings
            that will be used once the feature is enabled.
          </div>
        </div>
      )}
    </div>
  );
};
