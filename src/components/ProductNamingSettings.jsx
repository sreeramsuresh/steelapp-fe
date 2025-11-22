import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, Copy, CheckCircle, AlertCircle, ChevronDown, Info, Tag, Edit, X, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/axiosApi';
import ProductNamingGrid from './ProductNamingGrid';

// Product Row Component for individual editing
const ProductRow = ({ product, presets, isDarkMode, isEditing, onEdit, onSave, onApplyPreset, onCancel }) => {
  const [editedName, setEditedName] = useState(product.displayName || product.fullName || product.name);
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className={`p-3 rounded-lg border ${
      isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            {product.commodity} {product.grade}{product.gradeVariant} • {product.category}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={`w-full px-3 py-2 rounded border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />

              {/* Preset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className={`text-xs px-2 py-1 rounded ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {showPresets ? 'Hide' : 'Show'} Presets
                </button>
                {showPresets && (
                  <div className="flex flex-wrap gap-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => onApplyPreset(product.id, preset)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          isDarkMode
                            ? 'bg-teal-900/30 text-teal-400 hover:bg-teal-900/50'
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                        title={preset.description}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {product.displayName || product.fullName || product.name}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave(product.id, editedName)}
                className={`p-1.5 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-teal-900/30 text-teal-400 hover:bg-teal-900/50'
                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                }`}
                title="Save"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={onCancel}
                className={`p-1.5 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample product for preview
  const [sampleProduct, setSampleProduct] = useState({
    commodity: 'SS',
    grade: '304',
    grade_variant: 'L',
    category: 'sheet',
    finish: 'HL',
    width: '4',
    length: '8',
    thickness: '1.2mm',
  });

  useEffect(() => {
    fetchSettings();
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiService.get(`/products?companyId=${companyId}&limit=100`);
      setProducts(response.products || response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await apiService.post(`/product-naming/${companyId}/preview`, {
        template,
        separator,
        sample_product: sampleProduct,
      });
      setPreview(response.preview);
    } catch (error) {
      console.error('Error generating preview:', error);
      setMessage({ type: 'error', text: 'Failed to generate preview' });
    }
  };

  const handleSave = async () => {
    // Generate preview first
    await handlePreview();
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    try {
      setSaving(true);
      setShowConfirmModal(false);
      await apiService.patch(`/product-naming/${companyId}`, {
        product_name_template: template,
        product_name_separator: separator,
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

  const handleEditProduct = (productId) => {
    setEditingProductId(productId);
  };

  const handleSaveProductName = async (productId, newName) => {
    try {
      // Update display_name (user-editable name)
      // unique_name is auto-managed by the database trigger
      await apiService.patch(`/products/${productId}`, {
        display_name: newName,
      });
      setMessage({ type: 'success', text: 'Display name updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      fetchProducts();
      setEditingProductId(null);
    } catch (error) {
      console.error('Error updating product name:', error);
      setMessage({ type: 'error', text: 'Failed to update product name' });
    }
  };

  const handleApplyPresetToProduct = async (productId, preset) => {
    try {
      // Apply preset template to this specific product
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const response = await apiService.post(`/product-naming/${companyId}/preview`, {
        template: preset.template,
        separator: preset.separator,
        sample_product: {
          commodity: product.commodity,
          grade: product.grade,
          grade_variant: product.gradeVariant,
          category: product.category,
          finish: product.finish,
          width: product.width,
          length: product.length,
          thickness: product.thickness,
          od: product.od,
          nb_size: product.nbSize,
          schedule: product.schedule,
          diameter: product.diameter,
          size: product.size,
        },
      });

      await handleSaveProductName(productId, response.preview);
    } catch (error) {
      console.error('Error applying preset:', error);
      setMessage({ type: 'error', text: 'Failed to apply preset' });
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
    <div className={`space-y-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header - Compact */}
      <div className="flex items-center gap-3">
        <Tag className="h-5 w-5 text-teal-600 flex-shrink-0" />
        <div>
          <h2 className="text-lg font-semibold">Product Naming Management</h2>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Edit product names individually or apply templates in bulk
          </p>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
          message.type === 'success'
            ? isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
            : isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Product Grid */}
      <ProductNamingGrid
        companyId={companyId}
        presets={presets}
        template={template}
        separator={separator}
        onSaveTemplate={confirmSave}
        variables={variables}
      />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl ${
            isDarkMode ? 'bg-[#1E2328] border border-[#37474F]' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}>
                  <AlertCircle className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Confirm Template Save</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Review the changes before saving
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Warning Message */}
              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-yellow-900/10 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  ⚠️ Are you sure you want to save this template?
                </p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                }`}>
                  This will change how new product names are generated.
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Preview of new product names:
                </label>
                <div className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="font-mono text-base font-semibold text-teal-600">
                    {preview || 'No preview available'}
                  </div>
                  <div className={`text-xs mt-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Example: SS 304L Sheet HL
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className={`p-3 rounded border text-xs ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Template:</span>
                    <span className={`font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {template}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Separator:</span>
                    <span className={`font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {separator === ' ' ? 'Space' : separator === '-' ? 'Hyphen' : 'Underscore'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                isDarkMode ? 'bg-blue-900/20 border border-blue-700 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Note:</p>
                  <p className="mt-0.5">
                    Existing products will keep their current names. Use "Regenerate All Names" to update them.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex gap-3 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  saving
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                } text-white`}
              >
                {saving ? 'Saving...' : 'Yes, Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductNamingSettings;
