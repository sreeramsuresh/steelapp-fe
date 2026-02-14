import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import ToggleSwitchInvoice from "./ToggleSwitchInvoice";

const FormSettingsPanel = ({ isOpen, onClose, preferences, onPreferenceChange }) => {
  const { isDarkMode } = useTheme();
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg border z-50 ${
        isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Form Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-2 divide-y divide-gray-200 dark:divide-gray-700">
        <ToggleSwitchInvoice
          enabled={preferences.showValidationHighlighting}
          onChange={() => onPreferenceChange("showValidationHighlighting", !preferences.showValidationHighlighting)}
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Footer note */}
      <div
        className={`px-4 py-2 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"} border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
      >
        Settings are saved automatically
      </div>
    </div>
  );
};

export default FormSettingsPanel;
