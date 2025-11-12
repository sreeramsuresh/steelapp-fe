import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, Copy, CheckCircle, AlertCircle, ChevronDown, Info, Tag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/axiosApi';

const ProductNamingSettings = ({ companyId }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [template, setTemplate] = useState('');
  const [separator, setSeparator] = useState(' ');
  const [variables, setVariables] = useState([]);
  const [presets, setPresets] = useState([]);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showVariables, setShowVariables] = useState(true);

  // Sample product for preview
  const [sampleProduct, setSampleProduct] = useState({
    commodity: 'SS',
    grade: '304',
    grade_variant: 'L',
    category: 'sheet',
    finish: 'HL',
    width: '4',
    length: '8',
    thickness: '1.2mm'
  });

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/product-naming/${companyId}`);
      setTemplate(response.template);
      setSeparator(response.separator);
      setVariables(response.variables);
      setPresets(response.presets);
    } catch (error) {
      console.error('Error fetching product naming settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await apiService.post(`/product-naming/${companyId}/preview`, {
        template,
        separator,
        sample_product: sampleProduct
      });
      setPreview(response.preview);
    } catch (error) {
      console.error('Error generating preview:', error);
      setMessage({ type: 'error', text: 'Failed to generate preview' });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.patch(`/product-naming/${companyId}`, {
        product_name_template: template,
        product_name_separator: separator
      });
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateAll = async () => {
    if (!confirm('This will regenerate names for ALL products in your company. Continue?')) {
      return;
    }

    try {
      setRegenerating(true);
      const response = await apiService.post(`/product-naming/${companyId}/regenerate`);
      setMessage({
        type: 'success',
        text: `Successfully regenerated ${response.products_updated} product names!`
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error regenerating names:', error);
      setMessage({ type: 'error', text: 'Failed to regenerate product names' });
    } finally {
      setRegenerating(false);
    }
  };

  const insertVariable = (variable) => {
    const cursorPosition = document.getElementById('template-input').selectionStart;
    const newTemplate =
      template.substring(0, cursorPosition) +
      variable +
      template.substring(cursorPosition);
    setTemplate(newTemplate);
  };

  const loadPreset = (preset) => {
    setTemplate(preset.template);
    setSeparator(preset.separator);
    handlePreview();
  };

  const groupedVariables = variables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start gap-3">
          <Tag className="h-6 w-6 text-teal-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Product Name Template</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Customize how product names are automatically generated from specifications.
              All product names will follow this template format.
            </p>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          message.type === 'success'
            ? isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
            : isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Preset Templates */}
      <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-semibold mb-4">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => loadPreset(preset)}
              className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${
                isDarkMode
                  ? 'border-gray-600 hover:bg-gray-700 hover:border-teal-600'
                  : 'border-gray-300 hover:bg-gray-50 hover:border-teal-500'
              }`}
            >
              <div className="font-medium mb-1">{preset.name}</div>
              <div className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {preset.description}
              </div>
              <div className={`text-xs font-mono p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {preset.example}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-semibold mb-4">Template Configuration</h3>

        {/* Template Input */}
        <div className="space-y-2 mb-4">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Template Pattern
          </label>
          <textarea
            id="template-input"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            onBlur={handlePreview}
            rows={3}
            placeholder="{commodity} {grade}{grade_variant} {category} {finish} {dimensions}"
            className={`w-full px-4 py-3 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Use variables in curly braces. Click variables below to insert them.
          </p>
        </div>

        {/* Separator */}
        <div className="space-y-2 mb-4">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Separator
          </label>
          <select
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value=" ">Space</option>
            <option value="-">Hyphen (-)</option>
            <option value="_">Underscore (_)</option>
          </select>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Preview
            </label>
            <button
              onClick={handlePreview}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-500"
            >
              <Eye className="h-3 w-3" />
              Update Preview
            </button>
          </div>
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
            <div className="font-mono text-lg font-semibold text-teal-600">
              {preview || 'Click "Update Preview" to see result'}
            </div>
          </div>
        </div>
      </div>

      {/* Available Variables */}
      <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => setShowVariables(!showVariables)}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-lg font-semibold">Available Variables</h3>
          <ChevronDown className={`h-5 w-5 transition-transform ${showVariables ? 'rotate-180' : ''}`} />
        </button>

        {showVariables && (
          <div className="space-y-4">
            {Object.entries(groupedVariables).map(([category, vars]) => (
              <div key={category}>
                <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {vars.map((v) => (
                    <button
                      key={v.variable}
                      onClick={() => insertVariable(v.variable)}
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                        isDarkMode
                          ? 'border-gray-600 hover:bg-gray-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Copy className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-teal-600">{v.variable}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {v.description}
                        </div>
                        <div className={`text-xs font-mono mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Ex: {v.example}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !template}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            saving || !template
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700'
          } text-white`}
        >
          <Save className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Template'}
        </button>

        <button
          onClick={handleRegenerateAll}
          disabled={regenerating || !template}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all border ${
            regenerating || !template
              ? isDarkMode ? 'border-gray-600 text-gray-500 cursor-not-allowed' : 'border-gray-300 text-gray-400 cursor-not-allowed'
              : isDarkMode
              ? 'border-teal-600 text-teal-400 hover:bg-teal-900/20'
              : 'border-teal-600 text-teal-600 hover:bg-teal-50'
          }`}
        >
          <RefreshCw className={`h-5 w-5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate All Names'}
        </button>
      </div>

      {/* Info Box */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
        isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Templates are applied automatically when creating/updating products</li>
            <li>Existing products keep their current names until regenerated</li>
            <li>Empty variables are automatically skipped</li>
            <li>Use "Regenerate All Names" to update existing products with new template</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductNamingSettings;
