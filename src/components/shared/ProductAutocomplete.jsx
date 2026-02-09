import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Shared product autocomplete with fuzzy search, keyboard navigation,
 * and fixed dropdown positioning. Used by PurchaseOrderForm and SupplierBillForm.
 */
const ProductAutocomplete = ({
  options = [],
  value: _value,
  onChange,
  onInputChange,
  inputValue,
  placeholder,
  label,
  disabled = false,
  renderOption,
  noOptionsText = "No options",
  className = "",
  error = false,
  id,
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const inputId = id || `autocomplete-${Math.random().toString(36).substring(2, 11)}`;

  // Lightweight fuzzy match: token-based includes with typo tolerance (edit distance <= 1)
  const norm = useCallback((s) => (s || "").toString().toLowerCase().trim(), []);
  const ed1 = useCallback((a, b) => {
    if (a === b) return 0;
    const la = a.length;
    const lb = b.length;
    if (Math.abs(la - lb) > 1) return 2;
    let dpPrev = new Array(lb + 1);
    let dpCurr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dpPrev[j] = j;
    for (let i = 1; i <= la; i++) {
      dpCurr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lb; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dpCurr[j] = Math.min(dpPrev[j] + 1, dpCurr[j - 1] + 1, dpPrev[j - 1] + cost);
      }
      const tmp = dpPrev;
      dpPrev = dpCurr;
      dpCurr = tmp;
    }
    return dpPrev[lb];
  }, []);

  const tokenMatch = useCallback(
    (token, optLabel) => {
      const t = norm(token);
      const l = norm(optLabel);
      if (!t) return true;
      if (l.includes(t)) return true;
      const words = l.split(/\s+/);
      for (const w of words) {
        if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
      }
      return false;
    },
    [norm, ed1],
  );

  const fuzzyFilter = useCallback(
    (opts, query) => {
      const q = norm(query);
      if (!q) return opts;
      const tokens = q.split(/\s+/).filter(Boolean);
      const scored = [];
      for (const o of opts) {
        const optLabel = norm(o.label || o.name || "");
        if (!optLabel) continue;
        let ok = true;
        let score = 0;
        for (const t of tokens) {
          if (!tokenMatch(t, optLabel)) {
            ok = false;
            break;
          }
          const idx = optLabel.indexOf(norm(t));
          score += idx >= 0 ? 0 : 1;
        }
        if (ok) scored.push({ o, score });
      }
      scored.sort((a, b) => a.score - b.score);
      return scored.map((s) => s.o);
    },
    [norm, tokenMatch],
  );

  useEffect(() => {
    if (inputValue) {
      const filtered = fuzzyFilter(options, inputValue);
      setFilteredOptions(filtered.slice(0, 20));
    } else {
      setFilteredOptions(options);
    }
    setHighlightIndex(-1);
  }, [options, inputValue, fuzzyFilter]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
        handleOptionSelect(filteredOptions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll("[role='option']");
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex]);

  const updateDropdownPosition = useCallback(() => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;

      dropdown.style.position = "fixed";
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      dropdown.style.minWidth = `${inputRect.width}px`;
      dropdown.style.width = "auto";
      dropdown.style.maxWidth = "90vw";
      dropdown.style.zIndex = "9999";
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target) &&
          inputRef.current &&
          !inputRef.current.contains(event.target)
        ) {
          setIsOpen(false);
          setHighlightIndex(-1);
        }
      };

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={inputValue || ""}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode
            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        } ${error ? "border-red-500" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`border rounded-md shadow-lg max-h-60 overflow-y-auto ${
            isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || option.name || index}
                role="option"
                tabIndex={0}
                aria-selected={highlightIndex === index}
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  isDarkMode
                    ? `${highlightIndex === index ? "bg-gray-600" : "hover:bg-gray-700"} text-white border-gray-700`
                    : `${highlightIndex === index ? "bg-teal-50" : "hover:bg-gray-50"} text-gray-900 border-gray-100`
                }`}
                onMouseDown={() => handleOptionSelect(option)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOptionSelect(option);
                  }
                }}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={`px-3 py-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {noOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
