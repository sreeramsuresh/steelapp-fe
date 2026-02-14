import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const Textarea = ({ label, error, className = "", autoGrow = false, id, ...props }) => {
  const { isDarkMode } = useTheme();
  const textareaRef = useRef(null);
  const generatedId = useId();
  const textareaId = useMemo(() => id || generatedId, [id, generatedId]);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && autoGrow) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set the height to match content, with a minimum of one line
      textarea.style.height = `${Math.max(textarea.scrollHeight, 44)}px`;
    }
  }, [autoGrow]);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  const handleChange = (e) => {
    if (props.onChange) {
      props.onChange(e);
    }
    adjustHeight();
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={textareaRef}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 resize-none ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${error ? "border-red-500" : ""} ${autoGrow ? "overflow-hidden" : ""} ${className}`}
        {...props}
        onChange={handleChange}
        rows={autoGrow ? 1 : props.rows}
      />
      {error && <p className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>}
    </div>
  );
};

export default Textarea;
