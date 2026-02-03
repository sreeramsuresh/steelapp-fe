/**
 * AutocompleteInput Component
 * Reusable autocomplete/combobox with debounced search
 *
 * Features:
 * - Debounced search input
 * - Dropdown with filtered results
 * - Click outside to close
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Custom item rendering
 * - Loading and empty states
 * - Dark mode support
 */

import { AlertCircle, ChevronDown, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const AutocompleteInput = ({
  // Data
  value = "",
  items = [],

  // Display
  placeholder = "Search...",
  displayValue = null, // Function to get display text from selected item

  // Callbacks
  onSearch = null, // (searchTerm) => void - called on debounced search
  onSelect = null, // (item) => void - called when item selected
  onChange = null, // (searchTerm) => void - called on immediate input change

  // Filtering (if not using onSearch)
  filterFn = null, // (item, searchTerm) => boolean

  // Rendering
  renderItem = null, // (item, isSelected, isHighlighted) => ReactNode
  getItemKey = (item) => item.id,
  getItemLabel = (item) => item.name || item.label || String(item),

  // Behavior
  debounceMs = 300,
  minSearchLength = 0,
  maxResults = 20,
  clearOnSelect = false,

  // State
  loading = false,
  error = null,
  disabled = false,

  // Styling
  className = "",
  inputClassName = "",
  dropdownClassName = "",
}) => {
  const { isDarkMode } = useTheme();

  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filteredItems, setFilteredItems] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Update search term when value prop changes
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Filter items based on search term
  useEffect(() => {
    if (!isOpen) {
      setFilteredItems([]);
      return;
    }

    const search = searchTerm.toLowerCase().trim();

    // If onSearch provided, don't filter locally (async filtering)
    if (onSearch) {
      setFilteredItems(items);
      return;
    }

    // If no search term and no min length, show all
    if (!search && minSearchLength === 0) {
      setFilteredItems(items.slice(0, maxResults));
      return;
    }

    // If search term too short, show nothing
    if (search.length < minSearchLength) {
      setFilteredItems([]);
      return;
    }

    // Filter using custom function or default
    const filterFunction =
      filterFn ||
      ((item, term) => {
        const label = getItemLabel(item).toLowerCase();
        return label.includes(term);
      });

    const filtered = items.filter((item) => filterFunction(item, search));
    setFilteredItems(filtered.slice(0, maxResults));
  }, [searchTerm, items, isOpen, onSearch, filterFn, getItemLabel, minSearchLength, maxResults]);

  // Debounced search callback
  useEffect(() => {
    if (!onSearch || !isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchTerm.length >= minSearchLength) {
        onSearch(searchTerm);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, onSearch, debounceMs, minSearchLength, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);

      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Handle item selection
  const handleSelect = useCallback(
    (item) => {
      if (onSelect) {
        onSelect(item);
      }

      if (clearOnSelect) {
        setSearchTerm("");
      } else if (displayValue) {
        setSearchTerm(displayValue(item));
      } else {
        setSearchTerm(getItemLabel(item));
      }

      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onSelect, clearOnSelect, displayValue, getItemLabel]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setIsOpen(true);
          return;
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
          break;

        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
            handleSelect(filteredItems[highlightedIndex]);
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;

        default:
          break;
      }
    },
    [isOpen, highlightedIndex, filteredItems, handleSelect]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  // Default item renderer
  const defaultRenderItem = useCallback(
    (item, isSelected, _isHighlighted) => (
      <div className="flex items-center justify-between">
        <span>{getItemLabel(item)}</span>
        {isSelected && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    ),
    [getItemLabel]
  );

  const itemRenderer = renderItem || defaultRenderItem;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border rounded-lg transition-colors
            ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}
            ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${inputClassName}
          `}
        />

        {/* Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg
            ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}
            ${dropdownClassName}
          `}
        >
          {/* Loading State */}
          {loading && (
            <div className="px-3 py-4 text-center text-gray-500">
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Loading...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="px-3 py-4 text-center text-red-500">
              <AlertCircle className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500">
              <Search className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm">
                {searchTerm.length < minSearchLength
                  ? `Type at least ${minSearchLength} characters to search`
                  : "No results found"}
              </p>
            </div>
          )}

          {/* Items */}
          {!loading &&
            !error &&
            filteredItems.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              const isSelected = value && getItemKey(item) === getItemKey(value);

              return (
                <button
                  key={getItemKey(item)}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors
                  ${
                    isHighlighted
                      ? "bg-blue-500 text-white"
                      : isSelected
                        ? isDarkMode
                          ? "bg-gray-600 text-white"
                          : "bg-gray-100 text-gray-900"
                        : isDarkMode
                          ? "text-gray-200 hover:bg-gray-600"
                          : "text-gray-900 hover:bg-gray-100"
                  }
                `}
                >
                  {itemRenderer(item, isSelected, isHighlighted)}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
