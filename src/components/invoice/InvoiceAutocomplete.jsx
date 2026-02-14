import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import Input from "./InvoiceInput";

const Autocomplete = ({
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
  title,
  error,
  required = false,
  validationState = null,
  showValidation = true,
  "data-testid": dataTestId,
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const prevFilteredOptionsRef = useRef(filteredOptions);

  // Reset highlighted index when options change
  useEffect(() => {
    if (prevFilteredOptionsRef.current !== filteredOptions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(-1);
      prevFilteredOptionsRef.current = filteredOptions;
    }
  }, [filteredOptions]);

  // Lightweight fuzzy match: token-based includes with typo tolerance (edit distance <= 1)
  const norm = useCallback((s) => (s || "").toString().toLowerCase().trim(), []);
  const ed1 = useCallback((a, b) => {
    // Early exits
    if (a === b) return 0;
    const la = a.length,
      lb = b.length;
    if (Math.abs(la - lb) > 1) return 2; // too far
    // DP edit distance capped at 1 for speed
    let dpPrev = new Array(lb + 1);
    let dpCurr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dpPrev[j] = j;
    for (let i = 1; i <= la; i++) {
      dpCurr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lb; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dpCurr[j] = Math.min(
          dpPrev[j] + 1, // deletion
          dpCurr[j - 1] + 1, // insertion
          dpPrev[j - 1] + cost // substitution
        );
        // Early cut: if all >1 can break (skip for simplicity)
      }
      // swap
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
      // fuzzy: split label into words and check any word within edit distance 1
      const words = l.split(/\s+/);
      for (const w of words) {
        if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
      }
      return false;
    },
    [ed1, norm]
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
          // basic score: shorter distance preferred
          const idx = optLabel.indexOf(norm(t));
          score += idx >= 0 ? 0 : 1; // penalize fuzzy matches
        }
        if (ok) scored.push({ o, score });
      }
      scored.sort((a, b) => a.score - b.score);
      return scored.map((s) => s.o);
    },
    [tokenMatch, norm]
  );

  // Compute filtered options based on input value
  useEffect(() => {
    const newFiltered = inputValue ? fuzzyFilter(options, inputValue).slice(0, 20) : options;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredOptions(newFiltered);
  }, [options, inputValue, fuzzyFilter]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const updateDropdownPosition = useCallback(() => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;

      dropdown.style.position = "fixed";
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      // Make dropdown at least as wide as the input, but allow it to grow to fit contents
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

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  return (
    <div className="relative">
      <div ref={inputRef}>
        <Input
          label={label}
          value={inputValue || ""}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          title={title}
          error={error}
          required={required}
          validationState={validationState}
          showValidation={showValidation}
          data-testid={dataTestId}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          data-testid={dataTestId ? `${dataTestId}-listbox` : undefined}
          role="listbox"
          className={`border rounded-lg shadow-xl max-h-60 overflow-auto ${
            isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || index}
                data-testid={dataTestId ? `${dataTestId}-option-${index}` : undefined}
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  index === highlightedIndex
                    ? isDarkMode
                      ? "bg-teal-700 text-white border-gray-700"
                      : "bg-teal-100 text-gray-900 border-gray-100"
                    : isDarkMode
                      ? "hover:bg-gray-700 text-white border-gray-700"
                      : "hover:bg-gray-50 text-gray-900 border-gray-100"
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleOptionSelect(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
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
            <div className={`px-3 py-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{noOptionsText}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
