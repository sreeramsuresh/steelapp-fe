import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Edit2, Loader, Wand2, CheckCircle, AlertCircle, Download, Upload, Search, Filter, Replace, Type, Undo, Edit, FileSpreadsheet, Pencil, Settings, Save, Eye, Copy, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/axiosApi';

/**
 * Product Naming Management - Drawer-based UI
 * Clean interface with organized drawers for each operation
 */
const ProductNamingGrid = ({
  companyId,
  presets = [],
  template: externalTemplate,
  separator: externalSeparator,
  onSaveTemplate,
  variables = [],
}) => {
  const { isDarkMode } = useTheme();

  console.log('ProductNamingGrid rendered with:', { companyId, presetsCount: presets.length });

  // Core state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(null);

  // UI state
  const [activeDrawer, setActiveDrawer] = useState(null); // 'configuration', 'bulk-edit', 'templates', 'import-export'
  const [showFilters, setShowFilters] = useState(true);
  const [bulkMessage, setBulkMessage] = useState(null);

  // Configuration state
  const [template, setTemplate] = useState(externalTemplate || '');
  const [separator, setSeparator] = useState(externalSeparator || ' ');
  const [preview, setPreview] = useState('');
  const [showVariables, setShowVariables] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Search/Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCommodity, setFilterCommodity] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Bulk Edit - Find & Replace
  const [bulkEditTab, setBulkEditTab] = useState('find-replace');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replacePreviews, setReplacePreviews] = useState([]);
  const [applyingReplace, setApplyingReplace] = useState(false);

  // Bulk Edit - Prefix/Suffix
  const [prefixText, setPrefixText] = useState('');
  const [suffixText, setSuffixText] = useState('');
  const [prefixSuffixPreviews, setPrefixSuffixPreviews] = useState([]);
  const [applyingPrefixSuffix, setApplyingPrefixSuffix] = useState(false);

  // Templates
  const [applyingBulk, setApplyingBulk] = useState(false);

  // Import/Export
  const [importing, setImporting] = useState(false);

  // Undo
  const [undoHistory, setUndoHistory] = useState(null);
  const [undoing, setUndoing] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [companyId]);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Sync external template/separator with local state
  useEffect(() => {
    if (externalTemplate !== undefined) setTemplate(externalTemplate);
    if (externalSeparator !== undefined) setSeparator(externalSeparator);
  }, [externalTemplate, externalSeparator]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoHistory && !undoing) {
        e.preventDefault();
        handleUndo();
      }
      // Close drawer: Esc
      if (e.key === 'Escape' && activeDrawer && !applyingReplace && !applyingPrefixSuffix && !applyingBulk) {
        setActiveDrawer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory, undoing, activeDrawer, applyingReplace, applyingPrefixSuffix, applyingBulk]);

  // Update find/replace previews
  useEffect(() => {
    if (activeDrawer === 'bulk-edit' && bulkEditTab === 'find-replace') {
      handleGenerateReplacePreviews();
    }
  }, [findText, replaceText, caseSensitive, selectedIds, products, activeDrawer, bulkEditTab]);

  // Update prefix/suffix previews
  useEffect(() => {
    if (activeDrawer === 'bulk-edit' && bulkEditTab === 'prefix-suffix') {
      handleGeneratePrefixSuffixPreviews();
    }
  }, [prefixText, suffixText, selectedIds, products, activeDrawer, bulkEditTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/products?companyId=${companyId}&limit=100`);
      setProducts(response.products || response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm ||
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.commodity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCommodity = !filterCommodity || p.commodity === filterCommodity;
    const matchesGrade = !filterGrade || p.grade === filterGrade;
    const matchesCategory = !filterCategory || p.category === filterCategory;

    return matchesSearch && matchesCommodity && matchesGrade && matchesCategory;
  });

  // Get unique values for filters
  const uniqueCommodities = [...new Set(products.map(p => p.commodity).filter(Boolean))].sort();
  const uniqueGrades = [...new Set(products.map(p => p.grade).filter(Boolean))].sort();
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const hasActiveFilters = searchTerm || filterCommodity || filterGrade || filterCategory;
  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // === INLINE EDITING ===
  const handleStartEdit = (product) => {
    setEditingId(product.id);
    setEditValue(product.displayName || product.fullName || product.name || '');
  };

  const handleSave = async (productId) => {
    if (!editValue.trim()) {
      handleCancel();
      return;
    }

    try {
      setSaving(productId);
      // Update display_name only - unique_name is managed by DB trigger
      await apiService.patch(`/products/${productId}`, {
        display_name: editValue,
      });

      setProducts(products.map(p =>
        p.id === productId ? { ...p, displayName: editValue, display_name: editValue } : p,
      ));

      setEditingId(null);
    } catch (error) {
      console.error('Error saving product name:', error);
      alert('Failed to save product name');
    } finally {
      setSaving(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e, productId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(productId);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // === SELECTION ===
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (productId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCommodity('');
    setFilterGrade('');
    setFilterCategory('');
  };

  // === FIND & REPLACE ===
  const handleGenerateReplacePreviews = () => {
    if (!findText.trim()) {
      setReplacePreviews([]);
      return;
    }

    const productsToCheck = selectedIds.size > 0
      ? filteredProducts.filter(p => selectedIds.has(p.id))
      : filteredProducts;

    const previews = productsToCheck
      .map(product => {
        const currentName = product.displayName || product.fullName || product.name || '';
        let newName;

        if (caseSensitive) {
          newName = currentName.split(findText).join(replaceText);
        } else {
          const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          newName = currentName.replace(regex, replaceText);
        }

        if (currentName !== newName) {
          return {
            id: product.id,
            commodity: product.commodity,
            grade: product.grade,
            category: product.category,
            currentName,
            newName,
          };
        }
        return null;
      })
      .filter(Boolean);

    setReplacePreviews(previews);
  };

  const handleApplyReplace = async () => {
    if (replacePreviews.length === 0) return;

    setApplyingReplace(true);
    setBulkMessage(null);

    try {
      const historyChanges = [];
      let successCount = 0;
      let errorCount = 0;

      for (const preview of replacePreviews) {
        try {
          await apiService.patch(`/products/${preview.id}`, {
            name: preview.newName,
            full_name: preview.newName,
          });

          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === preview.id ? { ...p, name: preview.newName, full_name: preview.newName } : p,
            ),
          );

          historyChanges.push({
            id: preview.id,
            oldName: preview.currentName,
            newName: preview.newName,
          });

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${preview.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setUndoHistory({ action: 'find & replace', changes: historyChanges });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Replaced in ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setActiveDrawer(null);
      setFindText('');
      setReplaceText('');
      setReplacePreviews([]);

      setTimeout(() => setBulkMessage(null), 5000);
    } catch (error) {
      console.error('Replace error:', error);
      setBulkMessage({ type: 'error', text: 'Failed to apply replacements' });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setApplyingReplace(false);
    }
  };

  // === PREFIX/SUFFIX ===
  const handleGeneratePrefixSuffixPreviews = () => {
    if (!prefixText.trim() && !suffixText.trim()) {
      setPrefixSuffixPreviews([]);
      return;
    }

    const productsToModify = selectedIds.size > 0
      ? filteredProducts.filter(p => selectedIds.has(p.id))
      : filteredProducts;

    const previews = productsToModify.map(product => {
      const currentName = product.displayName || product.fullName || product.name || '';
      const newName = `${prefixText}${currentName}${suffixText}`;

      return {
        id: product.id,
        commodity: product.commodity,
        grade: product.grade,
        category: product.category,
        currentName,
        newName,
      };
    });

    setPrefixSuffixPreviews(previews);
  };

  const handleApplyPrefixSuffix = async () => {
    if (prefixSuffixPreviews.length === 0) return;

    setApplyingPrefixSuffix(true);
    setBulkMessage(null);

    try {
      const historyChanges = [];
      let successCount = 0;
      let errorCount = 0;

      for (const preview of prefixSuffixPreviews) {
        try {
          await apiService.patch(`/products/${preview.id}`, {
            name: preview.newName,
            full_name: preview.newName,
          });

          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === preview.id ? { ...p, name: preview.newName, full_name: preview.newName } : p,
            ),
          );

          historyChanges.push({
            id: preview.id,
            oldName: preview.currentName,
            newName: preview.newName,
          });

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${preview.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setUndoHistory({ action: 'prefix/suffix', changes: historyChanges });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Updated ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setActiveDrawer(null);
      setPrefixText('');
      setSuffixText('');
      setPrefixSuffixPreviews([]);

      setTimeout(() => setBulkMessage(null), 5000);
    } catch (error) {
      console.error('Prefix/Suffix error:', error);
      setBulkMessage({ type: 'error', text: 'Failed to apply prefix/suffix' });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setApplyingPrefixSuffix(false);
    }
  };

  // === TEMPLATES ===
  const handleBulkApplyTemplate = async (preset) => {
    if (selectedIds.size === 0) {
      alert('Please select products first');
      return;
    }

    setApplyingBulk(true);
    setBulkMessage(null);

    try {
      const selectedProducts = products.filter(p => selectedIds.has(p.id));
      const historyChanges = [];
      let successCount = 0;
      let errorCount = 0;

      for (const product of selectedProducts) {
        try {
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

          const newName = response.preview;

          historyChanges.push({
            id: product.id,
            oldName: product.fullName || product.name || '',
            newName,
          });

          await apiService.patch(`/products/${product.id}`, {
            name: newName,
            full_name: newName,
          });

          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === product.id ? { ...p, name: newName, full_name: newName } : p,
            ),
          );

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setUndoHistory({ action: 'template apply', changes: historyChanges.slice(0, successCount) });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Updated ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setSelectedIds(new Set());
      setActiveDrawer(null);

      setTimeout(() => setBulkMessage(null), 5000);
    } catch (error) {
      console.error('Bulk apply error:', error);
      setBulkMessage({ type: 'error', text: 'Failed to apply template' });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setApplyingBulk(false);
    }
  };

  // === EXPORT/IMPORT ===
  const handleExportCSV = () => {
    const productsToExport = selectedIds.size > 0
      ? products.filter(p => selectedIds.has(p.id))
      : products;

    if (productsToExport.length === 0) return;

    const headers = ['ID', 'Commodity', 'Grade', 'Grade Variant', 'Category', 'Current Name', 'New Name (Edit This)'];
    const rows = productsToExport.map(p => [
      p.id,
      p.commodity || '',
      p.grade || '',
      p.gradeVariant || '',
      p.category || '',
      p.fullName || p.name || '',
      p.fullName || p.name || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setBulkMessage({
      type: 'success',
      text: `✓ Exported ${productsToExport.length} product${productsToExport.length !== 1 ? 's' : ''} to CSV`,
    });
    setTimeout(() => setBulkMessage(null), 3000);
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setBulkMessage(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      const historyChanges = [];
      const updates = [];

      for (let i = 1; i < lines.length; i++) {
        const matches = lines[i].match(/("(?:[^"]|"")*"|[^,]*)(,("(?:[^"]|"")*"|[^,]*))*/g);
        if (!matches || matches.length < 7) continue;

        const values = matches.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        const [id, , , , , , newName] = values;

        if (id && newName) {
          const product = products.find(p => p.id === parseInt(id));
          if (product) {
            historyChanges.push({
              id: parseInt(id),
              oldName: product.fullName || product.name || '',
              newName,
            });
            updates.push({ id: parseInt(id), newName });
          }
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid updates found in CSV');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const { id, newName } of updates) {
        try {
          await apiService.patch(`/products/${id}`, {
            name: newName,
            full_name: newName,
          });

          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === id ? { ...p, name: newName, full_name: newName } : p,
            ),
          );

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setUndoHistory({ action: 'CSV import', changes: historyChanges.slice(0, successCount) });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Imported ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setTimeout(() => setBulkMessage(null), 5000);
    } catch (error) {
      console.error('Import error:', error);
      setBulkMessage({ type: 'error', text: error.message || 'Failed to import CSV' });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // === UNDO ===
  const handleUndo = async () => {
    if (!undoHistory) return;

    setUndoing(true);
    setBulkMessage(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const change of undoHistory.changes) {
        try {
          await apiService.patch(`/products/${change.id}`, {
            name: change.oldName,
            full_name: change.oldName,
          });

          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === change.id ? { ...p, name: change.oldName, full_name: change.oldName } : p,
            ),
          );

          successCount++;
        } catch (error) {
          console.error(`Error undoing product ${change.id}:`, error);
          errorCount++;
        }
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Undone ${undoHistory.action} for ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setUndoHistory(null);
      setTimeout(() => setBulkMessage(null), 5000);
    } catch (error) {
      console.error('Undo error:', error);
      setBulkMessage({ type: 'error', text: 'Failed to undo changes' });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setUndoing(false);
    }
  };

  // === CONFIGURATION ===
  // Group variables by category
  const groupedVariables = variables.reduce((acc, variable) => {
    const category = variable.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(variable);
    return acc;
  }, {});

  const handlePreview = async () => {
    if (!template.trim()) {
      setPreview('');
      return;
    }

    try {
      const response = await apiService.post(`/api/product-naming/${companyId}/preview`, {
        template,
        separator,
        sample_product: {
          commodity: 'SS',
          grade: '304',
          grade_variant: 'L',
          category: 'sheet',
          finish: 'HL',
          width: '4',
          length: '8',
          thickness: '1.2mm',
        },
      });
      setPreview(response.data.preview);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreview('Error generating preview');
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      if (onSaveTemplate) {
        await onSaveTemplate(template, separator);
      }
      setBulkMessage({ type: 'success', text: 'Template saved successfully' });
      setTimeout(() => setBulkMessage(null), 5000);
    } catch (error) {
      console.error('Error saving template:', error);
      setBulkMessage({ type: 'error', text: 'Failed to save template' });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setSavingTemplate(false);
    }
  };

  const insertVariable = (variable) => {
    setTemplate(prev => `${prev  } ${  variable}`);
  };

  const loadPreset = (preset) => {
    setTemplate(preset.template);
    setSeparator(preset.separator);
    handlePreview();
  };

  console.log('ProductNamingGrid state:', { loading, productsCount: products.length, activeDrawer });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Backdrop overlay */}
      {activeDrawer && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setActiveDrawer(null)}
        />
      )}

      {/* Main Grid Section */}
      <div className={`rounded-lg border overflow-hidden transition-all ${
        activeDrawer ? 'relative z-30' : ''
      } ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>

        {/* Success/Error Messages */}
        {bulkMessage && (
          <div className={`px-4 py-2 border-b flex items-center justify-between ${
            bulkMessage.type === 'success'
              ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800')
              : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800')
          }`}>
            <div className="flex items-center gap-2">
              {bulkMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">{bulkMessage.text}</span>
            </div>

            {undoHistory && bulkMessage.type === 'success' && !undoing && (
              <button
                onClick={handleUndo}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                  isDarkMode ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
                title={`Undo ${undoHistory.action}`}
              >
                <Undo className="h-3 w-3" />
                Undo {undoHistory.action} ({undoHistory.changes.length})
              </button>
            )}
          </div>
        )}

        {undoing && (
          <div className={`px-4 py-2 border-b flex items-center gap-2 ${
            isDarkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <Loader className="h-4 w-4 animate-spin" />
            <span className="text-sm">Undoing changes...</span>
          </div>
        )}

        {/* Top Toolbar */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedIds.size > 0 ? (
                `${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} selected`
              ) : (
                `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            {/* Configuration */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'configuration' ? null : 'configuration')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                activeDrawer === 'configuration'
                  ? (isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white')
                  : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <Settings className="h-4 w-4" />
              Configuration
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                showFilters
                  ? (isDarkMode ? 'bg-teal-600 text-white' : 'bg-teal-600 text-white')
                  : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* Bulk Edit */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'bulk-edit' ? null : 'bulk-edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                activeDrawer === 'bulk-edit'
                  ? (isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white')
                  : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <Pencil className="h-4 w-4" />
              Bulk Edit
            </button>

            {/* Templates */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'templates' ? null : 'templates')}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                selectedIds.size === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : activeDrawer === 'templates'
                    ? (isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white')
                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <Wand2 className="h-4 w-4" />
              Templates
            </button>

            {/* Import/Export */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'import-export' ? null : 'import-export')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                activeDrawer === 'import-export'
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import/Export
            </button>

            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className={`text-sm px-3 py-1.5 rounded ${
                  isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        {showFilters && (
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products by name, commodity, grade..."
                  className={`w-full pl-10 pr-4 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <select
                value={filterCommodity}
                onChange={(e) => setFilterCommodity(e.target.value)}
                className={`px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Commodities</option>
                {uniqueCommodities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className={`px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Grades</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    isDarkMode ? 'text-teal-400 hover:bg-teal-900/20' : 'text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {(hasActiveFilters || selectedIds.size > 0) && (
              <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {filteredProducts.length} of {products.length} products
                {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
              </div>
            )}
          </div>
        )}

        {/* Table Header */}
        <div className={`grid grid-cols-13 gap-2 px-4 py-3 border-b font-semibold text-xs ${
          isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => el && (el.indeterminate = isSomeSelected)}
              onChange={handleSelectAll}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
              title={isAllSelected ? 'Deselect All' : 'Select All'}
            />
          </div>
          <div className="col-span-1">Commodity</div>
          <div className="col-span-1">Grade</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-6">Product Name</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.has(product.id);
            return (
              <div
                key={product.id}
                className={`grid grid-cols-13 gap-2 px-4 py-3 items-center transition-colors ${
                  isSelected
                    ? (isDarkMode ? 'bg-teal-900/10' : 'bg-teal-50/50')
                    : (isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                } ${editingId === product.id ? (isDarkMode ? 'bg-teal-900/20' : 'bg-teal-50') : ''}`}
              >
                {/* Checkbox */}
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(product.id)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Commodity */}
                <div className={`col-span-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {product.commodity || '-'}
                </div>

                {/* Grade */}
                <div className={`col-span-1 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.grade || '-'}{product.gradeVariant || ''}
                </div>

                {/* Category */}
                <div className={`col-span-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : '-'}
                </div>

                {/* Product Name - Editable */}
                <div className="col-span-6">
                  {editingId === product.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSave(product.id)}
                      onKeyDown={(e) => handleKeyDown(e, product.id)}
                      className={`w-full px-3 py-1.5 rounded border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      disabled={saving === product.id}
                    />
                  ) : (
                    <div
                      onClick={() => handleStartEdit(product)}
                      className={`px-3 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                      }`}
                      title="Click to edit"
                    >
                      {product.fullName || product.name || 'Unnamed Product'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  {editingId === product.id ? (
                    <>
                      {saving === product.id ? (
                        <Loader className="h-4 w-4 animate-spin text-teal-600" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleSave(product.id)}
                            className={`p-1.5 rounded transition-colors ${
                              isDarkMode ? 'bg-teal-900/30 text-teal-400 hover:bg-teal-900/50' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            }`}
                            title="Save (Enter)"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className={`p-1.5 rounded transition-colors ${
                              isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            title="Cancel (Esc)"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(product)}
                      className={`p-1.5 rounded transition-colors ${
                        isDarkMode ? 'text-gray-400 hover:text-teal-400 hover:bg-gray-700' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-100'
                      }`}
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className={`p-12 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <p className="text-sm">
              {products.length === 0 ? 'No products found' : 'No products match your filters'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-sm text-teal-600 hover:text-teal-500"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Info Footer */}
        <div className={`px-4 py-2 border-t text-xs ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          💡 Click any product name to edit • Enter to save • Esc to cancel{undoHistory ? ' • Ctrl+Z to undo' : ''}
        </div>
      </div>

      {/* DRAWERS */}
      {activeDrawer && (
        <div className={`fixed right-0 top-0 h-screen w-96 shadow-2xl border-l flex flex-col z-50 ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
        }`}>
          {/* === CONFIGURATION DRAWER === */}
          {activeDrawer === 'configuration' && (
            <>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Settings className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Configuration
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 1. Template Pattern */}
                <div className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">1</span>
                    Template Pattern
                  </label>
                  <textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    onBlur={handlePreview}
                    rows={2}
                    placeholder="{commodity} {grade}{grade_variant} {category}"
                    className={`w-full px-3 py-2 rounded border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode
                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* 2. Separator */}
                <div className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">2</span>
                    Separator
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: ' ', label: 'Space', example: 'SS 304' },
                      { value: '-', label: 'Hyphen', example: 'SS-304' },
                      { value: '_', label: 'Underscore', example: 'SS_304' },
                    ].map(sep => (
                      <button
                        key={sep.value}
                        onClick={() => setSeparator(sep.value)}
                        className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                          separator === sep.value
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-500'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        <div>{sep.label}</div>
                        <div className={`text-xs font-mono ${separator === sep.value ? 'text-indigo-100' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {sep.example}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Preview */}
                <div className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`flex items-center justify-between text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">3</span>
                      Preview
                    </span>
                    <button
                      onClick={handlePreview}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      <Eye className="h-3 w-3" />
                      Update
                    </button>
                  </label>
                  <div className={`px-3 py-2 rounded ${isDarkMode ? 'bg-gray-900' : 'bg-white border border-gray-300'}`}>
                    <div className="font-mono text-sm font-semibold text-indigo-600">
                      {preview || 'Update preview to see result'}
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-4 border-t border-gray-700">
                  <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quick Presets</h4>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => loadPreset(preset)}
                        title={`${preset.description}\nExample: ${preset.example}`}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variables */}
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowVariables(!showVariables)}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <h4 className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Variables</h4>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showVariables ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>

                  {showVariables && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {Object.entries(groupedVariables).map(([category, vars]) => (
                        <div key={category}>
                          <h5 className={`text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {category}
                          </h5>
                          <div className="space-y-1.5">
                            {vars.map((v) => (
                              <button
                                key={v.variable}
                                onClick={() => insertVariable(v.variable)}
                                className={`w-full flex items-start gap-2 p-2 rounded text-left transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-gray-700 border border-gray-700'
                                    : 'hover:bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <Copy className="h-3 w-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-xs text-indigo-600">{v.variable}</div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
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
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !template}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    savingTemplate || !template
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                >
                  <Save className="h-4 w-4" />
                  {savingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </>
          )}

          {/* === BULK EDIT DRAWER === */}
          {activeDrawer === 'bulk-edit' && (
            <>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Pencil className={`h-5 w-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Bulk Edit
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setBulkEditTab('find-replace')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    bulkEditTab === 'find-replace'
                      ? (isDarkMode ? 'border-orange-500 text-orange-400' : 'border-orange-600 text-orange-600')
                      : (isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-600 hover:text-gray-900')
                  }`}
                >
                  Find & Replace
                </button>
                <button
                  onClick={() => setBulkEditTab('prefix-suffix')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    bulkEditTab === 'prefix-suffix'
                      ? (isDarkMode ? 'border-orange-500 text-orange-400' : 'border-orange-600 text-orange-600')
                      : (isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-600 hover:text-gray-900')
                  }`}
                >
                  Prefix/Suffix
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {bulkEditTab === 'find-replace' ? (
                  <div className="p-6 space-y-4">
                    {/* Find */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Find Text
                      </label>
                      <input
                        type="text"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="Enter text to find..."
                        className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDarkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        autoFocus
                      />
                    </div>

                    {/* Replace */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Replace With
                      </label>
                      <input
                        type="text"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="Enter replacement text..."
                        className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDarkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={caseSensitive}
                          onChange={(e) => setCaseSensitive(e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Case Sensitive
                        </span>
                      </label>
                    </div>

                    {/* Scope */}
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {selectedIds.size > 0 ? (
                        `Searching in ${selectedIds.size} selected product${selectedIds.size !== 1 ? 's' : ''}`
                      ) : (
                        `Searching in all ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
                      )}
                    </div>

                    {/* Preview */}
                    <div>
                      <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Preview Changes
                        {replacePreviews.length > 0 && (
                          <span className={`ml-2 text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            ({replacePreviews.length} match{replacePreviews.length !== 1 ? 'es' : ''} found)
                          </span>
                        )}
                      </h4>

                      {!findText.trim() ? (
                        <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Enter text to find
                        </div>
                      ) : replacePreviews.length === 0 ? (
                        <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          No matches found
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {replacePreviews.slice(0, 10).map((preview) => (
                            <div
                              key={preview.id}
                              className={`p-3 rounded border ${
                                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                {preview.commodity} {preview.grade} • {preview.category}
                              </div>
                              <div className="flex flex-col gap-1 text-xs">
                                <span className={`line-through ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                  {preview.currentName}
                                </span>
                                <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  → {preview.newName}
                                </span>
                              </div>
                            </div>
                          ))}
                          {replacePreviews.length > 10 && (
                            <div className={`text-xs text-center py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                              ... and {replacePreviews.length - 10} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {/* Prefix */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Prefix (added to beginning)
                      </label>
                      <input
                        type="text"
                        value={prefixText}
                        onChange={(e) => setPrefixText(e.target.value)}
                        placeholder="e.g., NEW_, V2_, UPDATED_"
                        className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDarkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        autoFocus
                      />
                    </div>

                    {/* Suffix */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Suffix (added to end)
                      </label>
                      <input
                        type="text"
                        value={suffixText}
                        onChange={(e) => setSuffixText(e.target.value)}
                        placeholder="e.g., _V2, _UPDATED, _2024"
                        className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDarkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>

                    {/* Scope */}
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {selectedIds.size > 0 ? (
                        `Applying to ${selectedIds.size} selected product${selectedIds.size !== 1 ? 's' : ''}`
                      ) : (
                        `Applying to all ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
                      )}
                    </div>

                    {/* Preview */}
                    <div>
                      <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Preview Changes
                        {prefixSuffixPreviews.length > 0 && (
                          <span className={`ml-2 text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            ({prefixSuffixPreviews.length} product{prefixSuffixPreviews.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h4>

                      {!prefixText.trim() && !suffixText.trim() ? (
                        <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Enter a prefix or suffix
                        </div>
                      ) : prefixSuffixPreviews.length === 0 ? (
                        <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          No products to update
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {prefixSuffixPreviews.slice(0, 10).map((preview) => (
                            <div
                              key={preview.id}
                              className={`p-3 rounded border ${
                                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                {preview.commodity} {preview.grade} • {preview.category}
                              </div>
                              <div className="flex flex-col gap-1 text-xs">
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                  {preview.currentName}
                                </span>
                                <span className={`font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                  → {preview.newName}
                                </span>
                              </div>
                            </div>
                          ))}
                          {prefixSuffixPreviews.length > 10 && (
                            <div className={`text-xs text-center py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                              ... and {prefixSuffixPreviews.length - 10} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setActiveDrawer(null)}
                  disabled={applyingReplace || applyingPrefixSuffix}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={bulkEditTab === 'find-replace' ? handleApplyReplace : handleApplyPrefixSuffix}
                  disabled={
                    (bulkEditTab === 'find-replace' && (applyingReplace || replacePreviews.length === 0)) ||
                    (bulkEditTab === 'prefix-suffix' && (applyingPrefixSuffix || prefixSuffixPreviews.length === 0))
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    ((bulkEditTab === 'find-replace' && replacePreviews.length === 0) || (bulkEditTab === 'prefix-suffix' && prefixSuffixPreviews.length === 0))
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : (isDarkMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-orange-600 text-white hover:bg-orange-700')
                  }`}
                >
                  {(applyingReplace || applyingPrefixSuffix) ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Apply Changes ({bulkEditTab === 'find-replace' ? replacePreviews.length : prefixSuffixPreviews.length})
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* === TEMPLATES DRAWER === */}
          {activeDrawer === 'templates' && (
            <>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Wand2 className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Apply Template
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a template to apply to {selectedIds.size} selected product{selectedIds.size !== 1 ? 's' : ''}
                </div>

                <div className="space-y-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleBulkApplyTemplate(preset)}
                      disabled={applyingBulk}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        applyingBulk
                          ? 'opacity-50 cursor-not-allowed'
                          : (isDarkMode
                            ? 'border-gray-700 hover:border-purple-600 hover:bg-purple-900/10'
                            : 'border-gray-200 hover:border-purple-600 hover:bg-purple-50')
                      }`}
                    >
                      <div className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {preset.name}
                      </div>
                      <div className={`text-xs mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {preset.description}
                      </div>
                      <div className={`text-xs font-mono px-2 py-1 rounded inline-block ${
                        isDarkMode ? 'bg-gray-800 text-purple-400' : 'bg-gray-100 text-purple-600'
                      }`}>
                        {preset.example}
                      </div>
                    </button>
                  ))}
                </div>

                {applyingBulk && (
                  <div className={`mt-4 flex items-center gap-2 text-sm ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    <Loader className="h-4 w-4 animate-spin" />
                    Applying template to selected products...
                  </div>
                )}
              </div>
            </>
          )}

          {/* === IMPORT/EXPORT DRAWER === */}
          {activeDrawer === 'import-export' && (
            <>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Import/Export
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Export Section */}
                  <div>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Export to CSV
                    </h4>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Download product names as CSV file to edit in Excel or Google Sheets
                    </p>
                    <button
                      onClick={handleExportCSV}
                      disabled={importing}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
                        isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Download className="h-4 w-4" />
                      Export {selectedIds.size > 0 ? `${selectedIds.size} Selected` : `All ${products.length}`} Product{(selectedIds.size > 0 ? selectedIds.size : products.length) !== 1 ? 's' : ''}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                  {/* Import Section */}
                  <div>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Import from CSV
                    </h4>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Upload a CSV file with updated product names. The CSV must include ID and New Name columns.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
                        importing
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : (isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700')
                      }`}
                    >
                      {importing ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Choose CSV File
                        </>
                      )}
                    </button>

                    {/* Instructions */}
                    <div className={`mt-4 p-3 rounded text-xs ${
                      isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <strong className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Instructions:</strong>
                      <ol className="mt-2 ml-4 list-decimal space-y-1">
                        <li>Export products to CSV</li>
                        <li>Edit the "New Name (Edit This)" column in Excel/Sheets</li>
                        <li>Save the file as CSV</li>
                        <li>Import the updated CSV here</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductNamingGrid;
