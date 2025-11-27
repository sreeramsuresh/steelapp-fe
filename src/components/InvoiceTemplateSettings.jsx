import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Type,
  Eye,
  Settings,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Palette,
  FileText,
  ShoppingCart,
  Truck,
  CreditCard,
  FileBarChart,
  Link2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  getDefaultTemplateSettings,
  validateTemplateSettings,
  mergeTemplateSettings,
  DEFAULT_DOCUMENT_TEMPLATE_COLORS,
  mergeDocumentTemplateSettings,
} from '../constants/defaultTemplateSettings';
import { generateConfigurablePDF } from '../utils/configurablePdfGenerator';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { notificationService } from '../services/notificationService';
import { INVOICE_TEMPLATES, TemplateSelector } from '../hooks/useInvoiceTemplates';

// Error Boundary for graceful error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('InvoiceTemplateSettings Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-lg bg-red-50 border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            Failed to load invoice template settings. Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const InvoiceTemplateSettingsComponent = ({ company, onSave }) => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Template settings state
  const [settings, setSettings] = useState(getDefaultTemplateSettings());
  const [originalSettings, setOriginalSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Selected template state (Classic, Custom, Elegant, Print Ready)
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard');
  const [originalTemplateId, setOriginalTemplateId] = useState('standard');
  const [customColors, setCustomColors] = useState(null);
  const [originalCustomColors, setOriginalCustomColors] = useState(null);

  // Document template colors state
  const [documentTemplates, setDocumentTemplates] = useState(
    JSON.parse(JSON.stringify(DEFAULT_DOCUMENT_TEMPLATE_COLORS)),
  );
  const [originalDocumentTemplates, setOriginalDocumentTemplates] = useState(null);

  // UI state
  const [activeSection, setActiveSection] = useState('basic');
  const [expandedSections, setExpandedSections] = useState({
    layout: false,
    typography: false,
    branding: false,
    visibility: false,
    table: false,
    formatting: false,
  });

  // Load settings from company
  useEffect(() => {
    if (company?.settings?.invoiceTemplate) {
      const mergedSettings = mergeTemplateSettings(company.settings.invoiceTemplate);
      setSettings(mergedSettings);
      setOriginalSettings(mergedSettings);
    } else if (company && !originalSettings) {
      // Only set defaults if we have company data and haven't set original settings yet
      const defaults = getDefaultTemplateSettings();
      setSettings(defaults);
      setOriginalSettings(defaults);
    }

    // Load selected template (Classic, Custom, Elegant, Print Ready)
    if (company?.settings?.selectedTemplate) {
      setSelectedTemplateId(company.settings.selectedTemplate);
      setOriginalTemplateId(company.settings.selectedTemplate);
    }
    if (company?.settings?.templateCustomColors) {
      setCustomColors(company.settings.templateCustomColors);
      setOriginalCustomColors(company.settings.templateCustomColors);
    }

    // Load document template colors
    if (company?.settings?.documentTemplates) {
      const mergedDocTemplates = mergeDocumentTemplateSettings(company.settings.documentTemplates);
      setDocumentTemplates(mergedDocTemplates);
      setOriginalDocumentTemplates(mergedDocTemplates);
    } else {
      const defaultDocTemplates = JSON.parse(JSON.stringify(DEFAULT_DOCUMENT_TEMPLATE_COLORS));
      setDocumentTemplates(defaultDocTemplates);
      setOriginalDocumentTemplates(defaultDocTemplates);
    }
  }, [company?.id, company?.settings?.invoiceTemplate, company?.settings?.selectedTemplate, company?.settings?.templateCustomColors, company?.settings?.documentTemplates]); // Only re-run when company ID or template changes

  // Check for changes
  useEffect(() => {
    if (originalSettings) {
      const settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      const templateChanged = selectedTemplateId !== originalTemplateId;
      const colorsChanged = JSON.stringify(customColors) !== JSON.stringify(originalCustomColors);
      const docTemplatesChanged = JSON.stringify(documentTemplates) !== JSON.stringify(originalDocumentTemplates);
      setHasChanges(settingsChanged || templateChanged || colorsChanged || docTemplatesChanged);
    }
  }, [settings, originalSettings, selectedTemplateId, originalTemplateId, customColors, originalCustomColors, documentTemplates, originalDocumentTemplates]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Some browsers require a return value
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Update setting
  const updateSetting = useCallback((path, value) => {
    setSettings(prev => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return newSettings;
    });
  }, []);

  // Discard changes and revert to saved settings
  const handleDiscardChanges = async () => {
    const confirmed = await confirm({
      title: 'Discard Changes?',
      message: 'Are you sure you want to discard all unsaved changes? This will revert to your last saved settings.',
      confirmText: 'Discard',
      variant: 'warning',
    });

    if (!confirmed) return;

    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setValidationErrors([]);
    }
    // Also reset template selection
    setSelectedTemplateId(originalTemplateId);
    setCustomColors(originalCustomColors);
    // Reset document templates
    if (originalDocumentTemplates) {
      setDocumentTemplates(JSON.parse(JSON.stringify(originalDocumentTemplates)));
    }
  };

  // Reset to defaults
  const handleResetToDefaults = async () => {
    const confirmed = await confirm({
      title: 'Reset to Defaults?',
      message: 'Are you sure you want to reset all template settings to defaults? This cannot be undone.',
      confirmText: 'Reset',
      variant: 'warning',
    });

    if (!confirmed) return;

    const defaults = getDefaultTemplateSettings();
    setSettings(defaults);
    setValidationErrors([]);
    // Reset template selection to default (Classic)
    setSelectedTemplateId('standard');
    setCustomColors(null);
    // Reset document templates to defaults
    setDocumentTemplates(JSON.parse(JSON.stringify(DEFAULT_DOCUMENT_TEMPLATE_COLORS)));
  };

  // Handle template selection change
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    // Reset custom colors when changing template (unless it's the Custom template)
    if (templateId !== 'modern') {
      setCustomColors(null);
    }
  };

  // Handle custom color changes (for Custom template)
  const handleColorChange = (colorUpdates) => {
    if (colorUpdates === null) {
      setCustomColors(null);
    } else {
      setCustomColors(prev => ({
        ...(prev || {}),
        ...colorUpdates,
      }));
    }
  };

  // Get list of templates for selector
  const availableTemplates = Object.values(INVOICE_TEMPLATES);

  // Save settings
  const handleSave = async () => {
    // Validate
    const validation = validateTemplateSettings(settings);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      notificationService.error('Please fix validation errors before saving.');
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);

    try {
      // Save both advanced settings AND selected template AND document templates
      await onSave({
        invoice_template: settings,
        selectedTemplate: selectedTemplateId,
        templateCustomColors: customColors,
        documentTemplates,
      });
      setOriginalSettings(settings);
      setOriginalTemplateId(selectedTemplateId);
      setOriginalCustomColors(customColors);
      setOriginalDocumentTemplates(JSON.parse(JSON.stringify(documentTemplates)));
      setHasChanges(false);
      notificationService.success('Template settings saved successfully!');
    } catch (error) {
      console.error('Error saving template settings:', error);
      notificationService.error('Failed to save template settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle document template color change
  const handleDocTemplateColorChange = (docType, color) => {
    setDocumentTemplates(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        primaryColor: color,
      },
    }));
  };

  // Handle document template sync toggle
  const handleDocTemplateSync = (docType, useInvoice) => {
    setDocumentTemplates(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        useInvoiceSettings: useInvoice,
      },
    }));
  };

  // Restore document template colors to defaults
  const handleRestoreDocTemplateDefaults = () => {
    setDocumentTemplates(JSON.parse(JSON.stringify(DEFAULT_DOCUMENT_TEMPLATE_COLORS)));
  };

  // Sync all document templates to invoice settings
  const handleSyncAllToInvoice = () => {
    setDocumentTemplates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(docType => {
        updated[docType] = {
          ...updated[docType],
          useInvoiceSettings: true,
        };
      });
      return updated;
    });
  };

  // Get the current invoice template color
  const getInvoiceColor = () => {
    // If custom colors are set (for Custom template), use them
    if (customColors?.primary) {
      return customColors.primary;
    }
    // Otherwise, get color from the selected template
    const template = INVOICE_TEMPLATES[selectedTemplateId];
    if (template?.colors?.primary) {
      return template.colors.primary;
    }
    // Fallback to settings or default teal
    return settings?.colors?.primary || '#0d9488';
  };

  // Preview PDF
  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      // Generate test invoice number: TestINV-YYYYMM-001
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testInvoiceNumber = `TestINV-${year}${month}-001`;

      // Create a sample invoice
      const sampleInvoice = {
        invoiceNumber: testInvoiceNumber,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customer: {
          name: 'Sample Customer LLC',
          email: 'customer@example.com',
          phone: '+971 50 123 4567',
          vatNumber: '100123456700003',
          address: {
            street: '123 Business Street',
            city: 'Dubai',
            country: 'UAE',
          },
        },
        items: [
          {
            name: 'Stainless Steel Sheet 304 - 4x8',
            quantity: 10,
            rate: 850,
            amount: 8500,
            vatRate: 5,
          },
          {
            name: 'Stainless Steel Pipe 316L - 2 inch',
            quantity: 25,
            rate: 120,
            amount: 3000,
            vatRate: 5,
          },
        ],
        notes: 'Thank you for your business!',
        terms: 'Payment due within 30 days',
        warehouseName: 'Main Warehouse',
        warehouseCode: 'WH-001',
      };

      // Create temporary company object with current settings
      const tempCompany = {
        ...company,
        settings: {
          ...company?.settings,
          invoice_template: settings,
        },
      };

      // Generate PDF with preview watermark
      await generateConfigurablePDF(sampleInvoice, tempCompany, { isPreview: true });
    } catch (error) {
      console.error('Error generating preview:', error);
      notificationService.error('Failed to generate preview. Please check your settings.');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Number input component
  const NumberInput = ({ label, value, onChange, min, max, step = 1, unit = '', description }) => (
    <div className="mb-4">
      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>
      {description && (
        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={`flex-1 px-3 py-2 border rounded-lg ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
        {unit && <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{unit}</span>}
      </div>
    </div>
  );

  // Checkbox component
  const CheckboxInput = ({ label, checked, onChange, description }) => (
    <div className="mb-3">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
        />
        <div>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
          </span>
          {description && (
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
          )}
        </div>
      </label>
    </div>
  );

  // Section header component
  const SectionHeader = ({ title, icon: Icon, expanded, onToggle }) => (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
        isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={20} className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} />
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </span>
      </div>
      {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Document Template Settings
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Customize appearance and colors for invoices, quotations, purchase orders, delivery notes, credit notes, and statements.
        </p>
      </div>

      {/* Template Style Selector - 4 Templates (Classic, Custom, Elegant, Print Ready) */}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Template Style
          </h3>
        </div>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose a base template style for your invoices. This selection syncs with the Create Invoice page.
        </p>
        <TemplateSelector
          templates={availableTemplates}
          selectedId={selectedTemplateId}
          onSelect={handleTemplateSelect}
          customColor={customColors}
          onColorChange={handleColorChange}
          isDarkMode={isDarkMode}
          columns={4}
        />
      </div>

      {/* Document Type Colors Section */}
      <div className={`mb-6 p-4 rounded-lg max-w-3xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} />
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Document Type Colors
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDocTemplateDefaults}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-600 text-white hover:bg-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <RotateCcw size={14} />
              Restore Defaults
            </button>
            <button
              onClick={handleSyncAllToInvoice}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-teal-700 text-white hover:bg-teal-600'
                  : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
              }`}
            >
              <Link2 size={14} />
              Sync All to Invoice
            </button>
          </div>
        </div>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Customize the header/accent color for each document type. Toggle &quot;Use Invoice Color&quot; to sync with the main invoice template.
        </p>

        {/* Document Type Color List - List view */}
        <div className="flex flex-col gap-3 max-w-2xl">
          {/* Invoice Color Reference - read-only, syncs with template selection above */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed ${isDarkMode ? 'bg-teal-900/30 border-teal-600' : 'bg-teal-50 border-teal-300'}`}>
            <FileText size={18} className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} />
            <span className={`font-medium min-w-[120px] ${isDarkMode ? 'text-teal-200' : 'text-teal-800'}`}>Invoice</span>
            <div
              className="w-7 h-7 rounded-md border-2 border-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: getInvoiceColor() }}
            />
            <span className={`text-xs w-16 ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
              {getInvoiceColor()}
            </span>
            <span className={`text-xs ml-auto italic ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
              (from template style)
            </span>
          </div>

          {/* Quotation */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <FileText size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            <span className={`font-medium min-w-[120px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Quotation</span>
            <div
              className="w-7 h-7 rounded-md border-2 border-white shadow-sm cursor-pointer relative overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: documentTemplates.quotation?.useInvoiceSettings
                  ? getInvoiceColor()
                  : documentTemplates.quotation?.primaryColor,
              }}
            >
              <input
                type="color"
                value={documentTemplates.quotation?.primaryColor || '#009999'}
                onChange={(e) => handleDocTemplateColorChange('quotation', e.target.value)}
                disabled={documentTemplates.quotation?.useInvoiceSettings}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Pick a color"
              />
            </div>
            <span className={`text-xs w-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {documentTemplates.quotation?.useInvoiceSettings ? getInvoiceColor() : documentTemplates.quotation?.primaryColor}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={documentTemplates.quotation?.useInvoiceSettings || false}
                onChange={(e) => handleDocTemplateSync('quotation', e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use Invoice Color
              </span>
            </label>
          </div>

          {/* Purchase Order */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <ShoppingCart size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            <span className={`font-medium min-w-[120px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Purchase Order</span>
            <div
              className="w-7 h-7 rounded-md border-2 border-white shadow-sm cursor-pointer relative overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: documentTemplates.purchaseOrder?.useInvoiceSettings
                  ? getInvoiceColor()
                  : documentTemplates.purchaseOrder?.primaryColor,
              }}
            >
              <input
                type="color"
                value={documentTemplates.purchaseOrder?.primaryColor || '#2563eb'}
                onChange={(e) => handleDocTemplateColorChange('purchaseOrder', e.target.value)}
                disabled={documentTemplates.purchaseOrder?.useInvoiceSettings}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Pick a color"
              />
            </div>
            <span className={`text-xs w-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {documentTemplates.purchaseOrder?.useInvoiceSettings ? getInvoiceColor() : documentTemplates.purchaseOrder?.primaryColor}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={documentTemplates.purchaseOrder?.useInvoiceSettings || false}
                onChange={(e) => handleDocTemplateSync('purchaseOrder', e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use Invoice Color
              </span>
            </label>
          </div>

          {/* Delivery Note */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <Truck size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            <span className={`font-medium min-w-[120px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Delivery Note</span>
            <div
              className="w-7 h-7 rounded-md border-2 border-white shadow-sm cursor-pointer relative overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: documentTemplates.deliveryNote?.useInvoiceSettings
                  ? getInvoiceColor()
                  : documentTemplates.deliveryNote?.primaryColor,
              }}
            >
              <input
                type="color"
                value={documentTemplates.deliveryNote?.primaryColor || '#0d9488'}
                onChange={(e) => handleDocTemplateColorChange('deliveryNote', e.target.value)}
                disabled={documentTemplates.deliveryNote?.useInvoiceSettings}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Pick a color"
              />
            </div>
            <span className={`text-xs w-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {documentTemplates.deliveryNote?.useInvoiceSettings ? getInvoiceColor() : documentTemplates.deliveryNote?.primaryColor}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={documentTemplates.deliveryNote?.useInvoiceSettings || false}
                onChange={(e) => handleDocTemplateSync('deliveryNote', e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use Invoice Color
              </span>
            </label>
          </div>

          {/* Credit Note */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <CreditCard size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            <span className={`font-medium min-w-[120px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Credit Note</span>
            <div
              className="w-7 h-7 rounded-md border-2 border-white shadow-sm cursor-pointer relative overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: documentTemplates.creditNote?.useInvoiceSettings
                  ? getInvoiceColor()
                  : documentTemplates.creditNote?.primaryColor,
              }}
            >
              <input
                type="color"
                value={documentTemplates.creditNote?.primaryColor || '#dc2626'}
                onChange={(e) => handleDocTemplateColorChange('creditNote', e.target.value)}
                disabled={documentTemplates.creditNote?.useInvoiceSettings}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Pick a color"
              />
            </div>
            <span className={`text-xs w-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {documentTemplates.creditNote?.useInvoiceSettings ? getInvoiceColor() : documentTemplates.creditNote?.primaryColor}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={documentTemplates.creditNote?.useInvoiceSettings || false}
                onChange={(e) => handleDocTemplateSync('creditNote', e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use Invoice Color
              </span>
            </label>
          </div>

          {/* Statement */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <FileBarChart size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            <span className={`font-medium min-w-[120px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Statement</span>
            <div
              className="w-7 h-7 rounded-md border-2 border-white shadow-sm cursor-pointer relative overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: documentTemplates.statement?.useInvoiceSettings
                  ? getInvoiceColor()
                  : documentTemplates.statement?.primaryColor,
              }}
            >
              <input
                type="color"
                value={documentTemplates.statement?.primaryColor || '#4f46e5'}
                onChange={(e) => handleDocTemplateColorChange('statement', e.target.value)}
                disabled={documentTemplates.statement?.useInvoiceSettings}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Pick a color"
              />
            </div>
            <span className={`text-xs w-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {documentTemplates.statement?.useInvoiceSettings ? getInvoiceColor() : documentTemplates.statement?.primaryColor}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={documentTemplates.statement?.useInvoiceSettings || false}
                onChange={(e) => handleDocTemplateSync('statement', e.target.checked)}
                className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Use Invoice Color
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Validation Errors:</h4>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-3">
        <button
          onClick={handlePreview}
          disabled={isPreviewing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPreviewing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <Eye size={18} />
              Preview PDF
            </>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes {hasChanges && '(*)'}
            </>
          )}
        </button>

        <button
          onClick={handleDiscardChanges}
          disabled={!hasChanges}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <X size={18} />
          Discard Changes
        </button>

        <button
          onClick={handleResetToDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RotateCcw size={18} />
          Reset to Defaults
        </button>
      </div>

      {/* Unsaved Changes Warning - Prominent Position */}
      {hasChanges && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          isDarkMode
            ? 'bg-yellow-900/20 border-yellow-500 border'
            : 'bg-yellow-50 border-yellow-400 border'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`flex-shrink-0 mt-0.5 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} size={20} />
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
              }`}>
                You have unsaved changes
              </p>
              <p className={`text-xs ${
                isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'
              }`}>
                Click &quot;Save Changes&quot; to apply your modifications, or &quot;Reset to Defaults&quot; to discard them.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  isDarkMode
                    ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? 'Saving...' : 'Save Now'}
              </button>
              <button
                onClick={handleDiscardChanges}
                title="Discard changes"
                className={`p-1.5 rounded transition-colors ${
                  isDarkMode
                    ? 'text-yellow-400 hover:bg-yellow-900/50'
                    : 'text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-300 dark:border-gray-600">
        <button
          onClick={() => setActiveSection('basic')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'basic'
              ? isDarkMode
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-teal-600 border-b-2 border-teal-600'
              : isDarkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Basic Settings
        </button>
        <button
          onClick={() => setActiveSection('advanced')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'advanced'
              ? isDarkMode
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-teal-600 border-b-2 border-teal-600'
              : isDarkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Advanced Settings
        </button>
      </div>

      {/* BASIC SETTINGS TAB */}
      {activeSection === 'basic' && (
        <div className="space-y-6 max-w-3xl">
          {/* Logo & Branding */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Logo & Branding
            </h3>
            <CheckboxInput
              label="Show Company Logo"
              checked={settings.branding.showLogo}
              onChange={(val) => updateSetting('branding.showLogo', val)}
              description="Display company logo on invoice"
            />
            <CheckboxInput
              label="Show Company Seal/Stamp"
              checked={settings.branding.showSeal}
              onChange={(val) => updateSetting('branding.showSeal', val)}
              description="Display company seal in footer"
            />
            <CheckboxInput
              label="Show Company Name in Header"
              checked={settings.branding.companyNameInHeader}
              onChange={(val) => updateSetting('branding.companyNameInHeader', val)}
            />
            <CheckboxInput
              label="Show VAT Registration Number"
              checked={settings.branding.showVATNumber}
              onChange={(val) => updateSetting('branding.showVATNumber', val)}
            />
          </div>

          {/* Basic Visibility */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Show/Hide Sections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxInput
                label="Notes"
                checked={settings.visibility.showNotes}
                onChange={(val) => updateSetting('visibility.showNotes', val)}
              />
              <CheckboxInput
                label="Payment Terms"
                checked={settings.visibility.showTerms}
                onChange={(val) => updateSetting('visibility.showTerms', val)}
              />
              <CheckboxInput
                label="Warehouse Information"
                checked={settings.visibility.showWarehouse}
                onChange={(val) => updateSetting('visibility.showWarehouse', val)}
              />
              <CheckboxInput
                label="Signature Section"
                checked={settings.visibility.showSignature}
                onChange={(val) => updateSetting('visibility.showSignature', val)}
              />
              <CheckboxInput
                label="Page Numbers"
                checked={settings.visibility.showPageNumbers}
                onChange={(val) => updateSetting('visibility.showPageNumbers', val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED SETTINGS TAB */}
      {activeSection === 'advanced' && (
        <div className="space-y-4 max-w-3xl">
          {/* Warning Banner */}
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Advanced Settings</h4>
                <p className="text-sm text-yellow-700">
                  These settings control the detailed appearance of your invoices. Incorrect values may cause layout issues.
                  Use the &quot;Preview PDF&quot; button to test your changes before saving.
                </p>
              </div>
            </div>
          </div>

          {/* Layout Section */}
          <div>
            <SectionHeader
              title="Layout & Spacing"
              icon={Layout}
              expanded={expandedSections.layout}
              onToggle={() => toggleSection('layout')}
            />
            {expandedSections.layout && (
              <div className={`p-4 mt-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInput
                    label="Margin Top"
                    value={settings.layout.marginTop}
                    onChange={(val) => updateSetting('layout.marginTop', val)}
                    min={5}
                    max={50}
                    unit="mm"
                  />
                  <NumberInput
                    label="Margin Bottom"
                    value={settings.layout.marginBottom}
                    onChange={(val) => updateSetting('layout.marginBottom', val)}
                    min={5}
                    max={50}
                    unit="mm"
                  />
                  <NumberInput
                    label="Margin Left"
                    value={settings.layout.marginLeft}
                    onChange={(val) => updateSetting('layout.marginLeft', val)}
                    min={5}
                    max={50}
                    unit="mm"
                  />
                  <NumberInput
                    label="Margin Right"
                    value={settings.layout.marginRight}
                    onChange={(val) => updateSetting('layout.marginRight', val)}
                    min={5}
                    max={50}
                    unit="mm"
                  />
                  <NumberInput
                    label="Line Spacing"
                    value={settings.layout.lineSpacing}
                    onChange={(val) => updateSetting('layout.lineSpacing', val)}
                    min={2}
                    max={10}
                    unit="mm"
                    description="Space between lines"
                  />
                  <NumberInput
                    label="Section Spacing"
                    value={settings.layout.sectionSpacing}
                    onChange={(val) => updateSetting('layout.sectionSpacing', val)}
                    min={4}
                    max={20}
                    unit="mm"
                    description="Space between sections"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Typography Section */}
          <div>
            <SectionHeader
              title="Typography"
              icon={Type}
              expanded={expandedSections.typography}
              onToggle={() => toggleSection('typography')}
            />
            {expandedSections.typography && (
              <div className={`p-4 mt-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Font Family
                  </label>
                  <select
                    value={settings.typography.fontFamily}
                    onChange={(e) => updateSetting('typography.fontFamily', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="helvetica">Helvetica</option>
                    <option value="times">Times</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>

                <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Font Sizes (in points)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInput
                    label="Extra Large (Company Name)"
                    value={settings.typography.fontSize.xlarge}
                    onChange={(val) => updateSetting('typography.fontSize.xlarge', val)}
                    min={10}
                    max={24}
                    unit="pt"
                  />
                  <NumberInput
                    label="Large (Headings)"
                    value={settings.typography.fontSize.large}
                    onChange={(val) => updateSetting('typography.fontSize.large', val)}
                    min={9}
                    max={18}
                    unit="pt"
                  />
                  <NumberInput
                    label="Medium (Body Text)"
                    value={settings.typography.fontSize.medium}
                    onChange={(val) => updateSetting('typography.fontSize.medium', val)}
                    min={7}
                    max={14}
                    unit="pt"
                  />
                  <NumberInput
                    label="Base (Default)"
                    value={settings.typography.fontSize.base}
                    onChange={(val) => updateSetting('typography.fontSize.base', val)}
                    min={7}
                    max={14}
                    unit="pt"
                  />
                  <NumberInput
                    label="Small (Footer)"
                    value={settings.typography.fontSize.small}
                    onChange={(val) => updateSetting('typography.fontSize.small', val)}
                    min={6}
                    max={12}
                    unit="pt"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visibility Section */}
          <div>
            <SectionHeader
              title="Visibility Controls"
              icon={Eye}
              expanded={expandedSections.visibility}
              onToggle={() => toggleSection('visibility')}
            />
            {expandedSections.visibility && (
              <div className={`p-4 mt-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Company Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <CheckboxInput
                        label="Company Address"
                        checked={settings.visibility.showCompanyAddress}
                        onChange={(val) => updateSetting('visibility.showCompanyAddress', val)}
                      />
                      <CheckboxInput
                        label="Company Phone"
                        checked={settings.visibility.showCompanyPhone}
                        onChange={(val) => updateSetting('visibility.showCompanyPhone', val)}
                      />
                      <CheckboxInput
                        label="Company Email"
                        checked={settings.visibility.showCompanyEmail}
                        onChange={(val) => updateSetting('visibility.showCompanyEmail', val)}
                      />
                      <CheckboxInput
                        label="Company Website"
                        checked={settings.visibility.showCompanyWebsite}
                        onChange={(val) => updateSetting('visibility.showCompanyWebsite', val)}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Invoice Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <CheckboxInput
                        label="Invoice Date"
                        checked={settings.visibility.showInvoiceDate}
                        onChange={(val) => updateSetting('visibility.showInvoiceDate', val)}
                      />
                      <CheckboxInput
                        label="Due Date"
                        checked={settings.visibility.showDueDate}
                        onChange={(val) => updateSetting('visibility.showDueDate', val)}
                      />
                      <CheckboxInput
                        label="Customer PO Number"
                        checked={settings.visibility.showCustomerPO}
                        onChange={(val) => updateSetting('visibility.showCustomerPO', val)}
                      />
                      <CheckboxInput
                        label="Customer PO Date"
                        checked={settings.visibility.showCustomerPODate}
                        onChange={(val) => updateSetting('visibility.showCustomerPODate', val)}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Table Columns
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <CheckboxInput
                        label="Serial Number"
                        checked={settings.visibility.showItemNumber}
                        onChange={(val) => updateSetting('visibility.showItemNumber', val)}
                      />
                      <CheckboxInput
                        label="Description"
                        checked={settings.visibility.showDescription}
                        onChange={(val) => updateSetting('visibility.showDescription', val)}
                      />
                      <CheckboxInput
                        label="Quantity"
                        checked={settings.visibility.showQuantity}
                        onChange={(val) => updateSetting('visibility.showQuantity', val)}
                      />
                      <CheckboxInput
                        label="Unit Price"
                        checked={settings.visibility.showUnitPrice}
                        onChange={(val) => updateSetting('visibility.showUnitPrice', val)}
                      />
                      <CheckboxInput
                        label="VAT %"
                        checked={settings.visibility.showVAT}
                        onChange={(val) => updateSetting('visibility.showVAT', val)}
                      />
                      <CheckboxInput
                        label="Price"
                        checked={settings.visibility.showPrice}
                        onChange={(val) => updateSetting('visibility.showPrice', val)}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Summary Section
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <CheckboxInput
                        label="Subtotal"
                        checked={settings.visibility.showSubtotal}
                        onChange={(val) => updateSetting('visibility.showSubtotal', val)}
                      />
                      <CheckboxInput
                        label="Discount"
                        checked={settings.visibility.showDiscount}
                        onChange={(val) => updateSetting('visibility.showDiscount', val)}
                      />
                      <CheckboxInput
                        label="VAT Amount"
                        checked={settings.visibility.showVATAmount}
                        onChange={(val) => updateSetting('visibility.showVATAmount', val)}
                      />
                      <CheckboxInput
                        label="Total"
                        checked={settings.visibility.showTotal}
                        onChange={(val) => updateSetting('visibility.showTotal', val)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table Configuration */}
          <div>
            <SectionHeader
              title="Table Configuration"
              icon={Settings}
              expanded={expandedSections.table}
              onToggle={() => toggleSection('table')}
            />
            {expandedSections.table && (
              <div className={`p-4 mt-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <NumberInput
                  label="Row Height"
                  value={settings.table.rowHeight}
                  onChange={(val) => updateSetting('table.rowHeight', val)}
                  min={5}
                  max={15}
                  unit="mm"
                />

                <h4 className={`text-sm font-semibold mt-4 mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Column Widths (% - must total 100%)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <NumberInput
                    label="Serial No."
                    value={settings.table.columnWidths.sno}
                    onChange={(val) => updateSetting('table.columnWidths.sno', val)}
                    min={5}
                    max={15}
                    unit="%"
                  />
                  <NumberInput
                    label="Description"
                    value={settings.table.columnWidths.description}
                    onChange={(val) => updateSetting('table.columnWidths.description', val)}
                    min={30}
                    max={60}
                    unit="%"
                  />
                  <NumberInput
                    label="Quantity"
                    value={settings.table.columnWidths.quantity}
                    onChange={(val) => updateSetting('table.columnWidths.quantity', val)}
                    min={8}
                    max={15}
                    unit="%"
                  />
                  <NumberInput
                    label="Unit Price"
                    value={settings.table.columnWidths.unitPrice}
                    onChange={(val) => updateSetting('table.columnWidths.unitPrice', val)}
                    min={10}
                    max={20}
                    unit="%"
                  />
                  <NumberInput
                    label="VAT"
                    value={settings.table.columnWidths.vat}
                    onChange={(val) => updateSetting('table.columnWidths.vat', val)}
                    min={8}
                    max={15}
                    unit="%"
                  />
                  <NumberInput
                    label="Price"
                    value={settings.table.columnWidths.price}
                    onChange={(val) => updateSetting('table.columnWidths.price', val)}
                    min={12}
                    max={20}
                    unit="%"
                  />
                </div>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total: {Object.values(settings.table.columnWidths).reduce((a, b) => a + b, 0)}%
                  {Object.values(settings.table.columnWidths).reduce((a, b) => a + b, 0) !== 100 && (
                    <span className="text-red-500 ml-2">(Warning: Should total 100%)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Formatting */}
          <div>
            <SectionHeader
              title="Number & Date Formatting"
              icon={Settings}
              expanded={expandedSections.formatting}
              onToggle={() => toggleSection('formatting')}
            />
            {expandedSections.formatting && (
              <div className={`p-4 mt-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={settings.formatting.currencySymbol}
                    onChange={(e) => updateSetting('formatting.currencySymbol', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="AED"
                  />
                </div>

                <NumberInput
                  label="Decimal Places"
                  value={settings.formatting.decimalPlaces}
                  onChange={(val) => updateSetting('formatting.decimalPlaces', val)}
                  min={0}
                  max={4}
                  description="Number of decimal places for amounts"
                />

                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date Format
                  </label>
                  <select
                    value={settings.formatting.dateFormat}
                    onChange={(e) => updateSetting('formatting.dateFormat', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="DD-MM-YYYY">DD-MM-YYYY (09-01-2025)</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY (01-09-2025)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2025-01-09)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

// Wrap component with Error Boundary
const InvoiceTemplateSettings = (props) => (
  <ErrorBoundary>
    <InvoiceTemplateSettingsComponent {...props} />
  </ErrorBoundary>
);

export default InvoiceTemplateSettings;
