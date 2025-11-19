import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Check, Edit2, Loader, Wand2, CheckCircle, AlertCircle, Download, Upload, Search, Filter, Replace, Type, Undo } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/axiosApi';

/**
 * Spreadsheet-style Product Naming Grid
 * Allows inline editing of product names with auto-save
 */
const ProductNamingGrid = ({ companyId, onSelectionChange, presets = [] }) => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState(null);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCommodity, setFilterCommodity] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeDrawer, setActiveDrawer] = useState(null); // 'bulk-edit', 'templates', 'import-export', null
  const [showFilters, setShowFilters] = useState(true);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replacePreviews, setReplacePreviews] = useState([]);
  const [applyingReplace, setApplyingReplace] = useState(false);
  const [bulkEditTab, setBulkEditTab] = useState('find-replace'); // 'find-replace' or 'prefix-suffix'
  const [prefixText, setPrefixText] = useState('');
  const [suffixText, setSuffixText] = useState('');
  const [prefixSuffixPreviews, setPrefixSuffixPreviews] = useState([]);
  const [applyingPrefixSuffix, setApplyingPrefixSuffix] = useState(false);
  const [undoHistory, setUndoHistory] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, [companyId]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedProducts = products.filter(p => selectedIds.has(p.id));
      onSelectionChange(selectedProducts);
    }
  }, [selectedIds, products, onSelectionChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoHistory && !undoing) {
        e.preventDefault();
        handleUndo();
      }

      // Escape to close drawer
      if (e.key === 'Escape' && activeDrawer && !applyingReplace && !applyingPrefixSuffix && !applyingBulk) {
        setActiveDrawer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory, undoing, activeDrawer, applyingReplace, applyingPrefixSuffix, applyingBulk]);

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

  const handleStartEdit = (product) => {
    setEditingId(product.id);
    setEditValue(product.fullName || product.name || '');
  };

  const handleSave = async (productId) => {
    if (!editValue.trim()) {
      handleCancel();
      return;
    }

    try {
      setSaving(productId);
      await apiService.patch(`/products/${productId}`, {
        name: editValue,
        full_name: editValue
      });

      // Update local state
      setProducts(products.map(p =>
        p.id === productId
          ? { ...p, name: editValue, full_name: editValue }
          : p
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
    } else if (e.key === 'Tab') {
      // Allow tab to move to next cell (browser default)
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select only filtered products
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

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm ||
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

  // Get unique values for filter dropdowns
  const uniqueCommodities = [...new Set(products.map(p => p.commodity).filter(Boolean))].sort();
  const uniqueGrades = [...new Set(products.map(p => p.grade).filter(Boolean))].sort();
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const hasActiveFilters = searchTerm || filterCommodity || filterGrade || filterCategory;

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCommodity('');
    setFilterGrade('');
    setFilterCategory('');
  };

  const handleExportCSV = () => {
    const productsToExport = selectedIds.size > 0
      ? products.filter(p => selectedIds.has(p.id))
      : products;

    if (productsToExport.length === 0) return;

    // Create CSV content
    const headers = ['ID', 'Commodity', 'Grade', 'Grade Variant', 'Category', 'Current Name', 'New Name (Edit This)'];
    const rows = productsToExport.map(p => [
      p.id,
      p.commodity || '',
      p.grade || '',
      p.gradeVariant || '',
      p.category || '',
      p.fullName || p.name || '',
      p.fullName || p.name || '' // User will edit this column
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download CSV
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
      text: `✓ Exported ${productsToExport.length} product${productsToExport.length !== 1 ? 's' : ''} to CSV`
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

      // Parse CSV (skip header)
      const updates = [];
      for (let i = 1; i < lines.length; i++) {
        const matches = lines[i].match(/("(?:[^"]|"")*"|[^,]*)(,("(?:[^"]|"")*"|[^,]*))*/g);
        if (!matches || matches.length < 7) continue;

        const values = matches.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        const [id, , , , , , newName] = values;

        if (id && newName) {
          updates.push({ id: parseInt(id), newName });
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid updates found in CSV');
      }

      // Save undo history before making changes
      const historyChanges = updates.map(({ id, newName }) => {
        const product = products.find(p => p.id === id);
        return {
          id,
          oldName: product?.fullName || product?.name || '',
          newName
        };
      });

      // Apply updates
      let successCount = 0;
      let errorCount = 0;

      for (const { id, newName } of updates) {
        try {
          await apiService.patch(`/products/${id}`, {
            name: newName,
            full_name: newName
          });

          // Update local state
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === id
                ? { ...p, name: newName, full_name: newName }
                : p
            )
          );

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${id}:`, error);
          errorCount++;
        }
      }

      // Save successful changes to undo history
      if (successCount > 0) {
        setUndoHistory({
          action: 'CSV import',
          changes: historyChanges.slice(0, successCount)
        });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Imported ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });
      setTimeout(() => setBulkMessage(null), 5000);

    } catch (error) {
      console.error('Import error:', error);
      setBulkMessage({
        type: 'error',
        text: error.message || 'Failed to import CSV'
      });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBulkApplyTemplate = async (preset) => {
    if (selectedIds.size === 0) return;

    setApplyingBulk(true);
    setBulkMessage(null);

    try {
      const selectedProducts = products.filter(p => selectedIds.has(p.id));
      const historyChanges = [];
      let successCount = 0;
      let errorCount = 0;

      // Apply template to each selected product
      for (const product of selectedProducts) {
        try {
          // Generate new name using template
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
              size: product.size
            }
          });

          const newName = response.preview;

          // Save to history
          historyChanges.push({
            id: product.id,
            oldName: product.fullName || product.name || '',
            newName
          });

          // Update product with new name
          await apiService.patch(`/products/${product.id}`, {
            name: newName,
            full_name: newName
          });

          // Update local state
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === product.id
                ? { ...p, name: newName, full_name: newName }
                : p
            )
          );

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error);
          errorCount++;
        }
      }

      // Save successful changes to undo history
      if (successCount > 0) {
        setUndoHistory({
          action: 'bulk template apply',
          changes: historyChanges.slice(0, successCount)
        });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Updated ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });

      // Clear selection after successful bulk update
      setSelectedIds(new Set());

      // Clear message after 5 seconds
      setTimeout(() => setBulkMessage(null), 5000);

    } catch (error) {
      console.error('Bulk apply error:', error);
      setBulkMessage({
        type: 'error',
        text: 'Failed to apply template to selected products'
      });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setApplyingBulk(false);
    }
  };

  const handleGenerateReplacePreviews = () => {
    if (!findText.trim()) {
      setReplacePreviews([]);
      return;
    }

    // Get products to check (selected or all filtered)
    const productsToCheck = selectedIds.size > 0
      ? filteredProducts.filter(p => selectedIds.has(p.id))
      : filteredProducts;

    // Generate previews for products that match
    const previews = productsToCheck
      .map(product => {
        const currentName = product.fullName || product.name || '';
        let newName;

        if (caseSensitive) {
          newName = currentName.split(findText).join(replaceText);
        } else {
          const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          newName = currentName.replace(regex, replaceText);
        }

        // Only include if name actually changes
        if (currentName !== newName) {
          return {
            id: product.id,
            commodity: product.commodity,
            grade: product.grade,
            category: product.category,
            currentName,
            newName
          };
        }
        return null;
      })
      .filter(Boolean);

    setReplacePreviews(previews);
  };

  // Update previews when find/replace text or case sensitivity changes
  useEffect(() => {
    if (activeDrawer === 'bulk-edit' && bulkEditTab === 'find-replace') {
      handleGenerateReplacePreviews();
    }
  }, [findText, replaceText, caseSensitive, selectedIds, filteredProducts, activeDrawer, bulkEditTab]);

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
            full_name: preview.newName
          });

          // Update local state
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === preview.id
                ? { ...p, name: preview.newName, full_name: preview.newName }
                : p
            )
          );

          // Save to history
          historyChanges.push({
            id: preview.id,
            oldName: preview.currentName,
            newName: preview.newName
          });

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${preview.id}:`, error);
          errorCount++;
        }
      }

      // Save successful changes to undo history
      if (successCount > 0) {
        setUndoHistory({
          action: 'find & replace',
          changes: historyChanges
        });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Replaced in ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });

      // Close drawer and reset
      setActiveDrawer(null);
      setFindText('');
      setReplaceText('');
      setReplacePreviews([]);

      setTimeout(() => setBulkMessage(null), 5000);

    } catch (error) {
      console.error('Replace error:', error);
      setBulkMessage({
        type: 'error',
        text: 'Failed to apply replacements'
      });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setApplyingReplace(false);
    }
  };

  const handleGeneratePrefixSuffixPreviews = () => {
    if (!prefixText.trim() && !suffixText.trim()) {
      setPrefixSuffixPreviews([]);
      return;
    }

    // Get products to modify (selected or all filtered)
    const productsToModify = selectedIds.size > 0
      ? filteredProducts.filter(p => selectedIds.has(p.id))
      : filteredProducts;

    // Generate previews
    const previews = productsToModify.map(product => {
      const currentName = product.fullName || product.name || '';
      const newName = `${prefixText}${currentName}${suffixText}`;

      return {
        id: product.id,
        commodity: product.commodity,
        grade: product.grade,
        category: product.category,
        currentName,
        newName
      };
    });

    setPrefixSuffixPreviews(previews);
  };

  // Update previews when prefix/suffix text changes
  useEffect(() => {
    if (activeDrawer === 'bulk-edit' && bulkEditTab === 'prefix-suffix') {
      handleGeneratePrefixSuffixPreviews();
    }
  }, [prefixText, suffixText, selectedIds, filteredProducts, activeDrawer, bulkEditTab]);

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
            full_name: preview.newName
          });

          // Update local state
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === preview.id
                ? { ...p, name: preview.newName, full_name: preview.newName }
                : p
            )
          );

          // Save to history
          historyChanges.push({
            id: preview.id,
            oldName: preview.currentName,
            newName: preview.newName
          });

          successCount++;
        } catch (error) {
          console.error(`Error updating product ${preview.id}:`, error);
          errorCount++;
        }
      }

      // Save successful changes to undo history
      if (successCount > 0) {
        setUndoHistory({
          action: 'prefix/suffix',
          changes: historyChanges
        });
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Updated ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });

      // Close drawer and reset
      setActiveDrawer(null);
      setPrefixText('');
      setSuffixText('');
      setPrefixSuffixPreviews([]);

      setTimeout(() => setBulkMessage(null), 5000);

    } catch (error) {
      console.error('Prefix/Suffix error:', error);
      setBulkMessage({
        type: 'error',
        text: 'Failed to apply prefix/suffix'
      });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setApplyingPrefixSuffix(false);
    }
  };

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
            full_name: change.oldName
          });

          // Update local state
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === change.id
                ? { ...p, name: change.oldName, full_name: change.oldName }
                : p
            )
          );

          successCount++;
        } catch (error) {
          console.error(`Error undoing product ${change.id}:`, error);
          errorCount++;
        }
      }

      setBulkMessage({
        type: 'success',
        text: `✓ Undone ${undoHistory.action} for ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });

      // Clear undo history after successful undo
      setUndoHistory(null);

      setTimeout(() => setBulkMessage(null), 5000);

    } catch (error) {
      console.error('Undo error:', error);
      setBulkMessage({
        type: 'error',
        text: 'Failed to undo changes'
      });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setUndoing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="relative flex gap-0">
      {/* Main Grid Section */}
      <div className={`flex-1 rounded-lg border overflow-hidden transition-all ${
        activeDrawer ? 'mr-96' : ''
      } ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
      {/* Bulk Message */}
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

          {/* Undo Button */}
          {undoHistory && bulkMessage.type === 'success' && !undoing && (
            <button
              onClick={handleUndo}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                isDarkMode
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
              title={`Undo ${undoHistory.action}`}
            >
              <Undo className="h-3 w-3" />
              Undo {undoHistory.action} ({undoHistory.changes.length})
            </button>
          )}
        </div>
      )}

      {/* Undo in Progress */}
      {undoing && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${
          isDarkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-sm">Undoing changes...</span>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-4 ${
          isDarkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200'
        }`}>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
            {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            {/* Apply Template Dropdown */}
            {/* Export/Import Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={applyingBulk || importing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Export selected products to CSV"
              >
                <Download className="h-3 w-3" />
                Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={applyingBulk || importing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  importing
                    ? 'bg-gray-600 cursor-not-allowed'
                    : (isDarkMode
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700')
                }`}
                title="Import CSV with updated names"
              >
                {importing ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Import CSV
              </button>

              <button
                onClick={() => setShowFindReplace(true)}
                disabled={applyingBulk || importing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  isDarkMode
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
                title="Find and replace text in product names"
              >
                <Replace className="h-3 w-3" />
                Find & Replace
              </button>

              <button
                onClick={() => setShowPrefixSuffix(true)}
                disabled={applyingBulk || importing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  isDarkMode
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                title="Add prefix or suffix to product names"
              >
                <Type className="h-3 w-3" />
                Prefix/Suffix
              </button>
            </div>

            {presets.length > 0 && (
              <>
                <div className={`w-px h-6 ${isDarkMode ? 'bg-teal-700' : 'bg-teal-300'}`} />

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                    Apply Template:
                  </span>
                  <div className="flex gap-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleBulkApplyTemplate(preset)}
                        disabled={applyingBulk || importing}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          applyingBulk || importing
                            ? 'bg-gray-600 cursor-not-allowed'
                            : (isDarkMode
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'bg-teal-600 text-white hover:bg-teal-700')
                        }`}
                        title={`${preset.description}\nExample: ${preset.example}`}
                      >
                        <Wand2 className="h-3 w-3" />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={`w-px h-6 ${isDarkMode ? 'bg-teal-700' : 'bg-teal-300'}`} />

            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={applyingBulk || importing}
              className={`text-xs px-3 py-1.5 rounded ${
                isDarkMode ? 'text-teal-400 hover:bg-teal-900/30' : 'text-teal-700 hover:bg-teal-100'
              }`}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Applying Indicator */}
      {applyingBulk && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${
          isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-sm">Applying template to selected products...</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          {/* Search */}
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
                isDarkMode
                  ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />

            <select
              value={filterCommodity}
              onChange={(e) => setFilterCommodity(e.target.value)}
              className={`px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Commodities</option>
              {uniqueCommodities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className={`px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Grades</option>
              {uniqueGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className={`px-3 py-2 rounded text-xs font-medium ${
                  isDarkMode
                    ? 'text-teal-400 hover:bg-teal-900/20'
                    : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Results Info */}
        {(hasActiveFilters || selectedIds.size > 0) && (
          <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {filteredProducts.length} of {products.length} products
            {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
          </div>
        )}
      </div>

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
        {filteredProducts.map((product, index) => {
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
                    isDarkMode
                      ? 'bg-gray-900 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  disabled={saving === product.id}
                />
              ) : (
                <div
                  onClick={() => handleStartEdit(product)}
                  className={`px-3 py-1.5 rounded cursor-pointer text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-white'
                      : 'hover:bg-gray-100 text-gray-900'
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
                          isDarkMode
                            ? 'bg-teal-900/30 text-teal-400 hover:bg-teal-900/50'
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                        title="Save (Enter)"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                    isDarkMode
                      ? 'text-gray-400 hover:text-teal-400 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-teal-600 hover:bg-gray-100'
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

      {/* Find & Replace Modal */}
      {showFindReplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl ${
            isDarkMode ? 'bg-[#1E2328] border border-[#37474F]' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Replace className={`h-5 w-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Find & Replace
                </h3>
              </div>
              <button
                onClick={handleCloseFindReplace}
                disabled={applyingReplace}
                className={`p-1 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="space-y-4">
                {/* Find Input */}
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
                      isDarkMode
                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    autoFocus
                  />
                </div>

                {/* Replace Input */}
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
                      isDarkMode
                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
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

                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {selectedIds.size > 0 ? (
                      `Searching in ${selectedIds.size} selected product${selectedIds.size !== 1 ? 's' : ''}`
                    ) : (
                      `Searching in all ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-2">
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preview Changes
                  {replacePreviews.length > 0 && (
                    <span className={`ml-2 text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      ({replacePreviews.length} match{replacePreviews.length !== 1 ? 'es' : ''} found)
                    </span>
                  )}
                </h4>
              </div>

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
                  {replacePreviews.map((preview) => (
                    <div
                      key={preview.id}
                      className={`p-3 rounded border ${
                        isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {preview.commodity} {preview.grade} • {preview.category}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`line-through ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                          {preview.currentName}
                        </span>
                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>→</span>
                        <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {preview.newName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleCloseFindReplace}
                disabled={applyingReplace}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyReplace}
                disabled={applyingReplace || replacePreviews.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  applyingReplace || replacePreviews.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : (isDarkMode
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700')
                }`}
              >
                {applyingReplace ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply Changes ({replacePreviews.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prefix/Suffix Modal */}
      {showPrefixSuffix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl ${
            isDarkMode ? 'bg-[#1E2328] border border-[#37474F]' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Type className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Prefix/Suffix
                </h3>
              </div>
              <button
                onClick={handleClosePrefixSuffix}
                disabled={applyingPrefixSuffix}
                className={`p-1 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="space-y-4">
                {/* Prefix Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prefix (added to the beginning)
                  </label>
                  <input
                    type="text"
                    value={prefixText}
                    onChange={(e) => setPrefixText(e.target.value)}
                    placeholder="e.g., NEW_, V2_, UPDATED_"
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDarkMode
                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    autoFocus
                  />
                </div>

                {/* Suffix Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Suffix (added to the end)
                  </label>
                  <input
                    type="text"
                    value={suffixText}
                    onChange={(e) => setSuffixText(e.target.value)}
                    placeholder="e.g., _V2, _UPDATED, _2024"
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDarkMode
                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {selectedIds.size > 0 ? (
                    `Applying to ${selectedIds.size} selected product${selectedIds.size !== 1 ? 's' : ''}`
                  ) : (
                    `Applying to all ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-2">
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preview Changes
                  {prefixSuffixPreviews.length > 0 && (
                    <span className={`ml-2 text-xs ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      ({prefixSuffixPreviews.length} product{prefixSuffixPreviews.length !== 1 ? 's' : ''} will be updated)
                    </span>
                  )}
                </h4>
              </div>

              {!prefixText.trim() && !suffixText.trim() ? (
                <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Enter a prefix or suffix to see preview
                </div>
              ) : prefixSuffixPreviews.length === 0 ? (
                <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No products to update
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {prefixSuffixPreviews.slice(0, 20).map((preview) => (
                    <div
                      key={preview.id}
                      className={`p-3 rounded border ${
                        isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {preview.commodity} {preview.grade} • {preview.category}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {preview.currentName}
                        </span>
                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>→</span>
                        <span className={`font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          {preview.newName}
                        </span>
                      </div>
                    </div>
                  ))}
                  {prefixSuffixPreviews.length > 20 && (
                    <div className={`text-xs text-center py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      ... and {prefixSuffixPreviews.length - 20} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleClosePrefixSuffix}
                disabled={applyingPrefixSuffix}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPrefixSuffix}
                disabled={applyingPrefixSuffix || prefixSuffixPreviews.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  applyingPrefixSuffix || prefixSuffixPreviews.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : (isDarkMode
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700')
                }`}
              >
                {applyingPrefixSuffix ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply Changes ({prefixSuffixPreviews.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductNamingGrid;
