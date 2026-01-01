/**
 * useBulkActions Hook
 *
 * Provides bulk selection and action functionality for lists.
 * Supports select all, select none, toggle selection, and bulk operations.
 *
 * @example
 * const {
 *   selectedIds,
 *   isSelected,
 *   toggleSelect,
 *   selectAll,
 *   clearSelection,
 *   deleteSelected,
 *   duplicateSelected,
 * } = useBulkActions({
 *   items: invoice.items,
 *   onUpdate: (newItems) => setInvoice(prev => ({ ...prev, items: newItems })),
 *   getId: (item) => item.id,
 * });
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for bulk selection and actions
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items
 * @param {Function} options.onUpdate - Callback when items change
 * @param {Function} options.getId - Function to get item ID (default: item => item.id)
 * @param {Function} options.onDelete - Optional custom delete handler
 * @param {Function} options.createItem - Function to create new item (for duplication)
 * @returns {Object} Selection state and handlers
 */
const useBulkActions = ({
  items = [],
  onUpdate,
  getId = (item) => item.id,
  onDelete,
  createItem,
} = {}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Get all item IDs
  const _allIds = useMemo(() => {
    return new Set(items.map(getId));
  }, [items, getId]);

  // Check if an item is selected
  const isSelected = useCallback(
    (item) => {
      const id = typeof item === 'object' ? getId(item) : item;
      return selectedIds.has(id);
    },
    [selectedIds, getId],
  );

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  // Check if some items are selected (for indeterminate state)
  const isSomeSelected = useMemo(() => {
    if (items.length === 0) return false;
    const selectedCount = items.filter((item) =>
      selectedIds.has(getId(item)),
    ).length;
    return selectedCount > 0 && selectedCount < items.length;
  }, [items, selectedIds, getId]);

  // Toggle selection for a single item
  const toggleSelect = useCallback(
    (item) => {
      const id = typeof item === 'object' ? getId(item) : item;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [getId],
  );

  // Select a single item
  const select = useCallback(
    (item) => {
      const id = typeof item === 'object' ? getId(item) : item;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    },
    [getId],
  );

  // Deselect a single item
  const deselect = useCallback(
    (item) => {
      const id = typeof item === 'object' ? getId(item) : item;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [getId],
  );

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getId)));
  }, [items, getId]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  // Delete selected items
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    if (onDelete) {
      // Use custom delete handler
      onDelete(Array.from(selectedIds));
    } else if (onUpdate) {
      // Filter out selected items
      const newItems = items.filter((item) => !selectedIds.has(getId(item)));
      onUpdate(newItems);
    }

    // Clear selection after delete
    clearSelection();
  }, [selectedIds, items, getId, onDelete, onUpdate, clearSelection]);

  // Duplicate selected items
  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0 || !onUpdate) return;

    const selectedItems = items.filter((item) => selectedIds.has(getId(item)));
    const duplicates = selectedItems.map((item) => {
      if (createItem) {
        return createItem(item);
      }
      // Default duplication - create new ID
      return {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    });

    const newItems = [...items, ...duplicates];
    onUpdate(newItems);

    // Clear selection after duplicate
    clearSelection();
  }, [selectedIds, items, getId, onUpdate, createItem, clearSelection]);

  // Get selected items
  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  // Get selected count
  const selectedCount = useMemo(() => {
    return items.filter((item) => selectedIds.has(getId(item))).length;
  }, [items, selectedIds, getId]);

  // Batch update selected items
  const updateSelected = useCallback(
    (updates) => {
      if (selectedIds.size === 0 || !onUpdate) return;

      const newItems = items.map((item) => {
        if (selectedIds.has(getId(item))) {
          return typeof updates === 'function'
            ? updates(item)
            : { ...item, ...updates };
        }
        return item;
      });

      onUpdate(newItems);
    },
    [selectedIds, items, getId, onUpdate],
  );

  // Get checkbox props for an item
  const getCheckboxProps = useCallback(
    (item) => {
      const id = typeof item === 'object' ? getId(item) : item;
      return {
        checked: selectedIds.has(id),
        onChange: () => toggleSelect(item),
        'aria-label': `Select item`,
      };
    },
    [selectedIds, getId, toggleSelect],
  );

  // Get select all checkbox props
  const getSelectAllProps = useCallback(() => {
    return {
      checked: isAllSelected,
      indeterminate: isSomeSelected,
      onChange: toggleSelectAll,
      'aria-label': isAllSelected ? 'Deselect all' : 'Select all',
    };
  }, [isAllSelected, isSomeSelected, toggleSelectAll]);

  return {
    // State
    selectedIds,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    hasSelection: selectedIds.size > 0,

    // Selection methods
    isSelected,
    toggleSelect,
    select,
    deselect,
    selectAll,
    clearSelection,
    toggleSelectAll,
    getSelectedItems,

    // Action methods
    deleteSelected,
    duplicateSelected,
    updateSelected,

    // Prop getters
    getCheckboxProps,
    getSelectAllProps,
  };
};

export default useBulkActions;

/**
 * Checkbox component for bulk selection
 * Supports indeterminate state
 */
export const BulkCheckbox = ({
  checked = false,
  indeterminate = false,
  onChange,
  className = '',
  isDarkMode = false,
  size = 'md',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        className={`
          ${sizeClasses[size]}
          rounded
          border-2
          cursor-pointer
          transition-all
          duration-150
          ${
            isDarkMode
              ? 'bg-gray-700 border-gray-500 checked:bg-teal-600 checked:border-teal-600'
              : 'bg-white border-gray-300 checked:bg-teal-500 checked:border-teal-500'
          }
          focus:ring-2
          focus:ring-teal-500
          focus:ring-offset-1
          ${isDarkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
        `}
        {...props}
      />
    </div>
  );
};

/**
 * Bulk actions toolbar component
 */
export const BulkActionsToolbar = ({
  selectedCount,
  onDelete,
  onDuplicate,
  onClear,
  isDarkMode = false,
  className = '',
  additionalActions = [],
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2 rounded-lg
        ${isDarkMode ? 'bg-teal-900/50 border border-teal-700' : 'bg-teal-50 border border-teal-200'}
        ${className}
      `}
    >
      <span
        className={`text-sm font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}
      >
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="flex items-center gap-2 ml-auto">
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className={`
              px-3 py-1 text-xs font-medium rounded
              transition-colors duration-150
              ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            Duplicate
          </button>
        )}

        {additionalActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`
              px-3 py-1 text-xs font-medium rounded
              transition-colors duration-150
              ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            {action.label}
          </button>
        ))}

        {onDelete && (
          <button
            onClick={onDelete}
            className={`
              px-3 py-1 text-xs font-medium rounded
              transition-colors duration-150
              ${
                isDarkMode
                  ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }
            `}
          >
            Delete
          </button>
        )}

        {onClear && (
          <button
            onClick={onClear}
            className={`
              px-2 py-1 text-xs rounded
              transition-colors duration-150
              ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
