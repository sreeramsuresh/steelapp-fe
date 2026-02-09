import { useState, useRef, useEffect, useCallback } from "react";
import FormError from "./FormError";
import RequiredIndicator from "./RequiredIndicator";

const COUNTRIES = [
  {
    code: "AE",
    name: "UAE",
    dial: "+971",
    placeholder: "50 123 4567",
    maxDigits: 9,
    patterns: [/^5[024568]\d{7}$/, /^[234679]\d{7}$/, /^800\d{4,7}$/],
    format(d) {
      if (/^5[024568]/.test(d)) {
        if (d.length <= 2) return d;
        if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
        return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`;
      }
      if (d.startsWith("800")) return d.length <= 3 ? d : `${d.slice(0, 3)} ${d.slice(3)}`;
      if (/^[234679]/.test(d)) {
        if (d.length <= 1) return d;
        if (d.length <= 4) return `${d.slice(0, 1)} ${d.slice(1)}`;
        return `${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 8)}`;
      }
      return d;
    },
    errorMsg(d) {
      if (/^5/.test(d) && !/^5[024568]/.test(d)) return "Invalid mobile prefix. Valid: 50, 52, 54, 55, 56, 58";
      return "Invalid UAE phone number";
    },
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dial: "+966",
    placeholder: "50 123 4567",
    maxDigits: 9,
    patterns: [/^5\d{8}$/, /^1[1-9]\d{7}$/],
    format(d) {
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`;
    },
    errorMsg() {
      return "Invalid Saudi number. Mobile: 5X, Landline: 1X";
    },
  },
  {
    code: "IN",
    name: "India",
    dial: "+91",
    placeholder: "98765 43210",
    maxDigits: 10,
    patterns: [/^[6-9]\d{9}$/],
    format(d) {
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)} ${d.slice(5, 10)}`;
    },
    errorMsg() {
      return "Invalid Indian number. Must start with 6-9, 10 digits";
    },
  },
  {
    code: "GB",
    name: "United Kingdom",
    dial: "+44",
    placeholder: "7911 123456",
    maxDigits: 10,
    patterns: [/^7\d{9}$/, /^[12]\d{9}$/],
    format(d) {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 10)}`;
    },
    errorMsg() {
      return "Invalid UK number. Mobile: 7XXX, Landline: 1XXX/2XXX";
    },
  },
  {
    code: "US",
    name: "United States",
    dial: "+1",
    placeholder: "201 555 0123",
    maxDigits: 10,
    patterns: [/^[2-9]\d{2}[2-9]\d{6}$/],
    format(d) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
    errorMsg() {
      return "Invalid US number. 10 digits: area code + number";
    },
  },
  {
    code: "PK",
    name: "Pakistan",
    dial: "+92",
    placeholder: "300 1234567",
    maxDigits: 10,
    patterns: [/^3\d{9}$/, /^[2-9]\d{8,9}$/],
    format(d) {
      if (/^3/.test(d)) {
        if (d.length <= 3) return d;
        return `${d.slice(0, 3)} ${d.slice(3, 10)}`;
      }
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${d.slice(3)}`;
    },
    errorMsg() {
      return "Invalid Pakistani number. Mobile: 3XX, Landline: 2X-9X";
    },
  },
  {
    code: "OM",
    name: "Oman",
    dial: "+968",
    placeholder: "9212 3456",
    maxDigits: 8,
    patterns: [/^[79]\d{7}$/],
    format(d) {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    errorMsg() {
      return "Invalid Omani number. 8 digits starting with 7 or 9";
    },
  },
  {
    code: "BH",
    name: "Bahrain",
    dial: "+973",
    placeholder: "3600 1234",
    maxDigits: 8,
    patterns: [/^[13]\d{7}$/],
    format(d) {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    errorMsg() {
      return "Invalid Bahraini number. 8 digits starting with 1 or 3";
    },
  },
  {
    code: "KW",
    name: "Kuwait",
    dial: "+965",
    placeholder: "5000 1234",
    maxDigits: 8,
    patterns: [/^[1-9]\d{7}$/],
    format(d) {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    errorMsg() {
      return "Invalid Kuwaiti number. 8 digits";
    },
  },
  {
    code: "QA",
    name: "Qatar",
    dial: "+974",
    placeholder: "3312 3456",
    maxDigits: 8,
    patterns: [/^[3-7]\d{7}$/],
    format(d) {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    errorMsg() {
      return "Invalid Qatari number. 8 digits starting with 3-7";
    },
  },
  {
    code: "EG",
    name: "Egypt",
    dial: "+20",
    placeholder: "100 123 4567",
    maxDigits: 10,
    patterns: [/^1[0-2]\d{8}$/, /^[2-9]\d{7,8}$/],
    format(d) {
      if (/^1/.test(d)) {
        if (d.length <= 3) return d;
        if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
        return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
      }
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4)}`;
    },
    errorMsg() {
      return "Invalid Egyptian number. Mobile: 10/11/12, Landline: 2-9";
    },
  },
  {
    code: "JO",
    name: "Jordan",
    dial: "+962",
    placeholder: "7 9012 3456",
    maxDigits: 9,
    patterns: [/^7[789]\d{7}$/, /^[2-6]\d{7}$/],
    format(d) {
      if (/^7/.test(d)) {
        if (d.length <= 2) return d;
        if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
        return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 9)}`;
      }
      if (d.length <= 1) return d;
      if (d.length <= 4) return `${d.slice(0, 1)} ${d.slice(1)}`;
      return `${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 8)}`;
    },
    errorMsg() {
      return "Invalid Jordanian number. Mobile: 77/78/79, Landline: 2-6";
    },
  },
  {
    code: "CN",
    name: "China",
    dial: "+86",
    placeholder: "138 1234 5678",
    maxDigits: 11,
    patterns: [/^1[3-9]\d{9}$/],
    format(d) {
      if (d.length <= 3) return d;
      if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)}`;
    },
    errorMsg() {
      return "Invalid Chinese number. Mobile: 13X-19X, 11 digits";
    },
  },
];

function parseExistingValue(value) {
  if (!value) return { country: COUNTRIES[0], digits: "" };
  const cleaned = value.replace(/\D/g, "");
  // Try to match against known dial codes (longest first to avoid partial matches)
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    const dialDigits = country.dial.replace(/\D/g, "");
    if (cleaned.startsWith(dialDigits) && cleaned.length > dialDigits.length) {
      return { country, digits: cleaned.slice(dialDigits.length) };
    }
  }
  return { country: COUNTRIES[0], digits: cleaned };
}

function validateDigits(country, digits) {
  if (!digits) return { status: "empty", error: "" };
  for (const pattern of country.patterns) {
    if (pattern.test(digits)) return { status: "valid", error: "" };
  }
  if (digits.length < country.maxDigits) return { status: "incomplete", error: "" };
  return { status: "invalid", error: country.errorMsg(digits) };
}

const PhoneInput = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  name,
  id,
}) => {
  const inputId = id || name || "phone-input";
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const initializedRef = useRef(false);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [validation, setValidation] = useState({ status: "empty", error: "" });

  // Parse existing value on mount (or when API data arrives)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!value) return;
    initializedRef.current = true;
    const { country, digits } = parseExistingValue(value);
    setSelectedCountry(country);
    const truncated = digits.slice(0, country.maxDigits);
    setDisplayValue(country.format(truncated));
    setValidation(validateDigits(country, truncated));
  }, [value]);

  const emitChange = useCallback(
    (country, digits) => {
      if (!onChange) return;
      if (!digits) {
        onChange("");
      } else {
        onChange(`${country.dial}${digits}`);
      }
    },
    [onChange],
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearchFilter("");
    setDisplayValue("");
    setValidation({ status: "empty", error: "" });
    emitChange(country, "");
    inputRef.current?.focus();
  };

  const handleInput = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > selectedCountry.maxDigits) raw = raw.slice(0, selectedCountry.maxDigits);
    setDisplayValue(selectedCountry.format(raw));
    setValidation(validateDigits(selectedCountry, raw));
    emitChange(selectedCountry, raw);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    let digits = e.clipboardData.getData("text").replace(/\D/g, "");
    const dialDigits = selectedCountry.dial.replace(/\D/g, "");
    if (digits.startsWith(`00${dialDigits}`)) {
      digits = digits.slice(2 + dialDigits.length);
    } else if (digits.startsWith(dialDigits) && digits.length > selectedCountry.maxDigits) {
      digits = digits.slice(dialDigits.length);
    }
    if (digits.length > selectedCountry.maxDigits) digits = digits.slice(0, selectedCountry.maxDigits);
    setDisplayValue(selectedCountry.format(digits));
    setValidation(validateDigits(selectedCountry, digits));
    emitChange(selectedCountry, digits);
  };

  const handleKeyDown = (e) => {
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearchFilter("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchRef.current?.focus(), 10);
    }
  }, [dropdownOpen]);

  const filteredCountries = COUNTRIES.filter((c) => {
    if (!searchFilter) return true;
    const f = searchFilter.toLowerCase();
    return c.name.toLowerCase().includes(f) || c.code.toLowerCase().includes(f) || c.dial.includes(f);
  });

  const borderClass =
    validation.status === "valid"
      ? "border-green-500 dark:border-green-500"
      : validation.status === "invalid"
        ? "border-red-500 dark:border-red-500"
        : error
          ? "border-red-500 dark:border-red-500"
          : "border-gray-300 dark:border-gray-600";

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <RequiredIndicator />}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {/* Input wrapper row */}
        <div
          className={`flex items-center border rounded-lg overflow-hidden transition-colors h-[42px] ${borderClass} ${
            disabled ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-800"
          } focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 ${className}`}
        >
          {/* Country selector button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 h-full whitespace-nowrap bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{selectedCountry.code}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{selectedCountry.dial}</span>
            <span className="text-[10px] text-gray-400 ml-0.5">{dropdownOpen ? "\u25B4" : "\u25BE"}</span>
          </button>

          {/* Phone number input */}
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={selectedCountry.placeholder}
            maxLength={selectedCountry.maxDigits + 4}
            autoComplete="tel-national"
            className="flex-1 min-w-0 h-full border-none outline-none px-3 text-[15px] tracking-wide text-gray-900 dark:text-white bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:tracking-normal"
          />

          {/* Status icon */}
          {validation.status === "valid" && (
            <span className="inline-flex items-center px-2.5 h-full text-green-500 flex-shrink-0 text-base">
              &#10003;
            </span>
          )}
          {validation.status === "invalid" && (
            <span className="inline-flex items-center px-2.5 h-full text-red-500 flex-shrink-0 text-base">
              &#10007;
            </span>
          )}
        </div>

        {/* Country dropdown (positioned outside the flex row) */}
        {dropdownOpen && (
          <div className="absolute top-full mt-1 left-0 w-80 max-h-[260px] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
            <input
              ref={searchRef}
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-2.5 border-b border-gray-200 dark:border-gray-600 text-sm outline-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {filteredCountries.map((c) => (
              <button
                type="button"
                key={c.code}
                onClick={() => handleCountrySelect(c)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left whitespace-nowrap text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  c.code === selectedCountry.code ? "bg-green-50 dark:bg-green-900/20" : ""
                }`}
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-6">{c.code}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {validation.status === "invalid" && validation.error && <FormError message={validation.error} />}
      {error && validation.status !== "invalid" && <FormError message={error} />}
    </div>
  );
};

export default PhoneInput;
