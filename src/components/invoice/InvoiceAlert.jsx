import { AlertTriangle, Info, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const Alert = ({ variant = "info", children, onClose, className = "" }) => {
  const { isDarkMode } = useTheme();

  const getVariantClasses = () => {
    const darkVariants = {
      info: "bg-blue-900/20 border-blue-500/30 text-blue-300",
      warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
      error: "bg-red-900/20 border-red-500/30 text-red-300",
      success: "bg-green-900/20 border-green-500/30 text-green-300",
    };

    const lightVariants = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
      success: "bg-green-50 border-green-200 text-green-800",
    };

    return isDarkMode ? darkVariants[variant] : lightVariants[variant];
  };

  return (
    <div className={`border rounded-lg p-4 ${getVariantClasses()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === "warning" && <AlertTriangle className="h-5 w-5" />}
          {variant === "info" && <Info className="h-5 w-5" />}
        </div>
        <div className="ml-3 flex-1">{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${
              isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
