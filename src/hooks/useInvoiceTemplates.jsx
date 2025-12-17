/**
 * useInvoiceTemplates Hook
 *
 * Manages invoice template selection, styling, and recurring invoice settings.
 * Syncs with company settings in database (via companyService).
 * Falls back to localStorage for offline/initial state.
 *
 * Templates: Classic, Modern, Elegant, Print Ready (B&W)
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { companyService } from "../services/companyService";

// Template definitions with vibrant colors + one B&W print option
export const INVOICE_TEMPLATES = {
  standard: {
    id: "standard",
    name: "Classic",
    description: "Traditional business style with teal accents",
    preview: "📄",
    colors: {
      primary: "#0d9488", // Teal - brand color
      secondary: "#475569", // Slate gray
      accent: "#f9f9f9", // Subtle grey for alternating rows (fixed for all templates)
      text: "#1e293b", // Dark slate for body
      border: "#cbd5e1", // Slate border
      headerBg: "#0d9488", // Teal header background
    },
    fonts: {
      heading: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
    layout: {
      headerStyle: "default", // Original side-by-side layout
      itemsStyle: "full-grid", // Full table borders
      totalsPosition: "right",
      showLogo: true,
      showWatermark: false,
      compactMode: false,
      alternatingRows: true,
    },
  },
  modern: {
    id: "modern",
    name: "Custom",
    description: "Customizable color scheme - pick your brand color",
    preview: "🎨",
    colors: {
      primary: "#2563eb", // Blue (default - customizable)
      secondary: "#64748b", // Slate
      accent: "#f9f9f9", // Subtle grey for alternating rows (fixed for all templates)
      text: "#1e293b", // Dark slate
      border: "#93c5fd", // Light blue border
      headerBg: "#2563eb", // Blue header (customizable)
    },
    fonts: {
      heading: "Poppins, Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
    layout: {
      headerStyle: "default", // Side-by-side layout
      itemsStyle: "horizontal-lines", // Only horizontal dividers
      totalsPosition: "right",
      showLogo: true,
      showWatermark: false,
      compactMode: false,
      alternatingRows: false,
    },
  },
  minimal: {
    id: "minimal",
    name: "Elegant",
    description: "Refined navy blue with gold accents",
    preview: "✨",
    colors: {
      primary: "#1e3a5f", // Navy blue
      secondary: "#64748b", // Slate
      accent: "#f9f9f9", // Subtle grey for alternating rows (fixed for all templates)
      text: "#1e293b", // Dark slate
      border: "#1e3a5f", // Navy border
      headerBg: "#1e3a5f", // Navy header
    },
    fonts: {
      heading: "Georgia, Times, serif",
      body: "Inter, system-ui, sans-serif",
    },
    layout: {
      headerStyle: "default", // Side-by-side layout
      itemsStyle: "no-borders", // Clean, minimal borders
      totalsPosition: "right",
      showLogo: true,
      showWatermark: false,
      compactMode: false,
      alternatingRows: false,
    },
  },
  professional: {
    id: "professional",
    name: "Print Ready",
    description: "Optimized for B&W printing",
    preview: "🖨️",
    colors: {
      primary: "#1a1a1a", // Near black
      secondary: "#4a4a4a", // Dark gray
      accent: "#f9f9f9", // Subtle grey for alternating rows (fixed for all templates)
      text: "#000000", // Pure black
      border: "#666666", // Medium gray
      headerBg: "#e0e0e0", // Light gray header
    },
    fonts: {
      heading: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
    layout: {
      headerStyle: "default", // Side-by-side layout
      itemsStyle: "bold-header", // Bold header row, light grid
      totalsPosition: "right",
      showLogo: true,
      showWatermark: true,
      compactMode: false,
      alternatingRows: true,
    },
  },
};

// Recurring frequency options
export const RECURRING_FREQUENCIES = [
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "biweekly", label: "Every 2 Weeks", days: 14 },
  { value: "monthly", label: "Monthly", days: 30 },
  { value: "quarterly", label: "Quarterly", days: 90 },
  { value: "annually", label: "Annually", days: 365 },
];

const STORAGE_KEY = "steelapp_invoice_template_prefs";

/**
 * Custom hook for invoice template management
 * Now syncs with company settings in database
 */
const useInvoiceTemplates = (
  initialTemplate = "standard",
  companySettings = null,
) => {
  // Track if we've loaded from company settings
  const [loadedFromCompany, setLoadedFromCompany] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved preferences from localStorage (fallback/cache)
  const loadSavedPrefs = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load template preferences:", e);
    }
    return null;
  };

  const savedPrefs = loadSavedPrefs();

  // Template selection state - initialize from localStorage first
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    savedPrefs?.templateId || initialTemplate,
  );

  // Custom colors override
  const [customColors, setCustomColors] = useState(
    savedPrefs?.customColors || null,
  );

  // Recurring invoice settings (frontend-only prep)
  const [recurringSettings, setRecurringSettings] = useState({
    enabled: false,
    frequency: "monthly",
    startDate: null,
    endDate: null,
    sendAutomatically: false,
    reminderDays: 3,
    ...savedPrefs?.recurringSettings,
  });

  // Load settings from company data when available
  // Uses invoiceTemplate field format: { id: 'templateId', colors: { primary: '#xxx', ... } }
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        // If companySettings is passed as prop, use it
        if (companySettings?.settings) {
          const invoiceTemplate = companySettings.settings.invoiceTemplate;
          if (invoiceTemplate?.id) {
            setSelectedTemplateId(invoiceTemplate.id);
          }
          if (invoiceTemplate?.colors) {
            // Only set custom colors if they differ from base template
            const baseColors = INVOICE_TEMPLATES[invoiceTemplate.id]?.colors;
            if (
              baseColors &&
              invoiceTemplate.colors.primary !== baseColors.primary
            ) {
              setCustomColors(invoiceTemplate.colors);
            }
          }
          setLoadedFromCompany(true);
          return;
        }

        // Otherwise, fetch from API
        const company = await companyService.getCompany();
        const invoiceTemplate = company?.settings?.invoiceTemplate;
        if (invoiceTemplate?.id) {
          setSelectedTemplateId(invoiceTemplate.id);
        }
        if (invoiceTemplate?.colors) {
          // Only set custom colors if they differ from base template
          const baseColors = INVOICE_TEMPLATES[invoiceTemplate.id]?.colors;
          if (
            baseColors &&
            invoiceTemplate.colors.primary !== baseColors.primary
          ) {
            setCustomColors(invoiceTemplate.colors);
          }
        }
        setLoadedFromCompany(true);
      } catch (error) {
        console.warn(
          "Failed to load company template settings, using localStorage:",
          error,
        );
        // Keep using localStorage values (already set)
      }
    };

    loadCompanySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySettings?.settings?.invoiceTemplate]); // loadCompanySettings is stable

  // Get current template
  const currentTemplate = useMemo(() => {
    const base =
      INVOICE_TEMPLATES[selectedTemplateId] || INVOICE_TEMPLATES.standard;
    if (customColors) {
      return {
        ...base,
        colors: { ...base.colors, ...customColors },
      };
    }
    return base;
  }, [selectedTemplateId, customColors]);

  // Save preferences to both localStorage (cache) AND company settings (database)
  useEffect(() => {
    // Always save to localStorage as cache
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          templateId: selectedTemplateId,
          customColors,
          recurringSettings,
        }),
      );
    } catch (e) {
      console.warn("Failed to save template preferences to localStorage:", e);
    }
  }, [selectedTemplateId, customColors, recurringSettings]);

  // Save to company settings (database) when template changes
  // Saves in invoiceTemplate format: { id: 'templateId', colors: { primary: '#xxx', ... } }
  // This format is compatible with backend PDF generation (ssrRenderer.js)
  const saveToCompanySettings = useCallback(
    async (templateId, customColorOverrides) => {
      if (isSaving) return;

      setIsSaving(true);
      try {
        const company = await companyService.getCompany();
        const baseTemplate =
          INVOICE_TEMPLATES[templateId] || INVOICE_TEMPLATES.standard;

        // Merge base template colors with any custom overrides
        const finalColors = customColorOverrides
          ? { ...baseTemplate.colors, ...customColorOverrides }
          : baseTemplate.colors;

        const updatedCompany = {
          ...company,
          settings: {
            ...company.settings,
            // New unified format - backend reads invoiceTemplate.colors.primary
            invoiceTemplate: {
              id: templateId,
              name: baseTemplate.name,
              colors: finalColors,
            },
          },
        };
        await companyService.updateCompany(updatedCompany);
      } catch (error) {
        console.warn("Failed to save template to company settings:", error);
        // Don't throw - localStorage is already updated as fallback
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving],
  );

  // Select a template - saves to database
  const selectTemplate = useCallback(
    (templateId) => {
      if (INVOICE_TEMPLATES[templateId]) {
        setSelectedTemplateId(templateId);
        const newColors = templateId !== "modern" ? null : customColors;
        setCustomColors(newColors);
        // Save to database
        saveToCompanySettings(templateId, newColors);
      }
    },
    [customColors, saveToCompanySettings],
  );

  // Update custom colors - saves to database
  const updateColors = useCallback(
    (colorUpdates) => {
      const newColors =
        colorUpdates === null
          ? null
          : {
              ...(customColors || {}),
              ...colorUpdates,
            };
      setCustomColors(newColors);
      // Save to database
      saveToCompanySettings(selectedTemplateId, newColors);
    },
    [customColors, selectedTemplateId, saveToCompanySettings],
  );

  // Reset to template defaults
  const resetColors = useCallback(() => {
    setCustomColors(null);
    saveToCompanySettings(selectedTemplateId, null);
  }, [selectedTemplateId, saveToCompanySettings]);

  // Toggle recurring invoice
  const toggleRecurring = useCallback((enabled) => {
    setRecurringSettings((prev) => ({
      ...prev,
      enabled: typeof enabled === "boolean" ? enabled : !prev.enabled,
    }));
  }, []);

  // Update recurring settings
  const updateRecurringSettings = useCallback((updates) => {
    setRecurringSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Get CSS variables for template
  const getTemplateStyles = useCallback(() => {
    const colors = currentTemplate.colors;
    return {
      "--invoice-primary": colors.primary,
      "--invoice-secondary": colors.secondary,
      "--invoice-accent": colors.accent,
      "--invoice-text": colors.text,
      "--invoice-border": colors.border,
      "--invoice-heading-font": currentTemplate.fonts.heading,
      "--invoice-body-font": currentTemplate.fonts.body,
    };
  }, [currentTemplate]);

  // Get template class names for preview
  const getTemplateClasses = useCallback(
    (element) => {
      const layout = currentTemplate.layout;
      const classes = [];

      switch (element) {
        case "header":
          classes.push(`header-${layout.headerStyle}`);
          break;
        case "items":
          classes.push(`items-${layout.itemsStyle}`);
          break;
        case "totals":
          classes.push(`totals-${layout.totalsPosition}`);
          break;
        default:
          break;
      }

      if (layout.compactMode) {
        classes.push("compact");
      }

      return classes.join(" ");
    },
    [currentTemplate],
  );

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
    isSaving,
    loadedFromCompany,

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
// Dark color presets for Custom template - ensures white text is visible
const COLOR_PRESETS = [
  { name: "Blue", value: "#1e40af" }, // Deep blue
  { name: "Indigo", value: "#4338ca" }, // Indigo
  { name: "Purple", value: "#6d28d9" }, // Purple
  { name: "Teal", value: "#0f766e" }, // Dark teal
  { name: "Green", value: "#15803d" }, // Dark green
  { name: "Red", value: "#b91c1c" }, // Dark red
  { name: "Orange", value: "#c2410c" }, // Dark orange
  { name: "Navy", value: "#1e3a5f" }, // Navy
  { name: "Slate", value: "#334155" }, // Slate
  { name: "Rose", value: "#9f1239" }, // Dark rose
];

export const TemplateSelector = ({
  templates,
  selectedId,
  onSelect,
  customColor,
  onColorChange,
  isDarkMode = false,
  className = "",
  columns = 2,
}) => {
  return (
    <div className={className}>
      <div
        className={`grid gap-3 ${columns === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}
      >
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
              ${
                selectedId === template.id
                  ? isDarkMode
                    ? "border-teal-500 bg-teal-900/30"
                    : "border-teal-500 bg-teal-50"
                  : isDarkMode
                    ? "border-gray-600 bg-gray-800 hover:border-gray-500"
                    : "border-gray-200 bg-white hover:border-gray-300"
              }
            `}
          >
            <div className="text-xl mb-1">{template.preview}</div>
            <div
              className={`font-medium text-sm truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {template.name}
            </div>
            <div
              className={`text-xs mt-1 line-clamp-2 leading-tight ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              style={{ minHeight: "2rem" }}
            >
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

      {/* Color customization - only show for Custom template */}
      {onColorChange && selectedId === "modern" && (
        <div
          className={`mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div
            className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Custom Color
          </div>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Apply primary color to all key color properties
                  onColorChange({
                    primary: color.value,
                    headerBg: color.value,
                    border: color.value,
                  });
                }}
                className={`
                  w-7 h-7 rounded-full border-2 transition-all
                  ${
                    customColor?.primary === color.value
                      ? "border-gray-900 scale-110 ring-2 ring-offset-1 ring-gray-400"
                      : isDarkMode
                        ? "border-gray-600"
                        : "border-gray-300"
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            {/* Custom color input */}
            <label
              className="relative cursor-pointer"
              aria-label="Pick custom color"
            >
              <span className="sr-only">Pick custom color</span>
              <input
                type="color"
                value={customColor?.primary || "#2563eb"}
                onChange={(e) => {
                  e.stopPropagation();
                  onColorChange({
                    primary: e.target.value,
                    headerBg: e.target.value,
                    border: e.target.value,
                  });
                }}
                className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
                aria-label="Custom color picker"
              />
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-100"}`}
                title="Pick custom color"
                aria-hidden="true"
              >
                <span className="text-xs">+</span>
              </div>
            </label>
          </div>
          {customColor && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onColorChange(null);
              }}
              className={`mt-2 text-xs ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
            >
              Reset to default
            </button>
          )}
        </div>
      )}
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
  className = "",
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Recurring Invoice
          </div>
          <div
            className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Automatically create invoices on schedule
          </div>
        </div>
        <button
          onClick={() => onToggle(!settings.enabled)}
          className={`
            relative w-11 h-6 rounded-full transition-colors duration-200
            ${
              settings.enabled
                ? "bg-teal-500"
                : isDarkMode
                  ? "bg-gray-600"
                  : "bg-gray-300"
            }
          `}
          role="switch"
          aria-checked={settings.enabled}
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
              transition-transform duration-200
              ${settings.enabled ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>

      {/* Settings (shown when enabled) */}
      {settings.enabled && (
        <div
          className={`
          space-y-3 pt-3 border-t
          ${isDarkMode ? "border-gray-700" : "border-gray-200"}
        `}
        >
          {/* Frequency */}
          <div>
            <label
              htmlFor="recurring-frequency"
              className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Frequency
            </label>
            <select
              id="recurring-frequency"
              value={settings.frequency}
              onChange={(e) => onUpdate({ frequency: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border text-sm
                ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
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
            <label
              htmlFor="recurring-start-date"
              className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Start Date
            </label>
            <input
              id="recurring-start-date"
              type="date"
              value={settings.startDate || ""}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border text-sm
                ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            />
          </div>

          {/* End Date (Optional) */}
          <div>
            <label
              htmlFor="recurring-end-date"
              className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              End Date (Optional)
            </label>
            <input
              id="recurring-end-date"
              type="date"
              value={settings.endDate || ""}
              onChange={(e) => onUpdate({ endDate: e.target.value })}
              min={settings.startDate || undefined}
              className={`
                w-full px-3 py-2 rounded-lg border text-sm
                ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            />
          </div>

          {/* Auto-send toggle */}
          <div className="flex items-center justify-between pt-2">
            <span
              className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Send automatically when created
            </span>
            <button
              onClick={() =>
                onUpdate({ sendAutomatically: !settings.sendAutomatically })
              }
              className={`
                relative w-9 h-5 rounded-full transition-colors duration-200
                ${
                  settings.sendAutomatically
                    ? "bg-teal-500"
                    : isDarkMode
                      ? "bg-gray-600"
                      : "bg-gray-300"
                }
              `}
              role="switch"
              aria-checked={settings.sendAutomatically}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                  transition-transform duration-200
                  ${settings.sendAutomatically ? "translate-x-4" : "translate-x-0"}
                `}
              />
            </button>
          </div>

          {/* Info banner */}
          <div
            className={`
            p-3 rounded-lg text-xs
            ${isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}
          `}
          >
            ℹ️ Recurring invoices require backend setup. This UI prepares the
            settings that will be used once the feature is enabled.
          </div>
        </div>
      )}
    </div>
  );
};
