import { useTheme } from "../contexts/ThemeContext";

/**
 * Loading fallback component for lazy-loaded routes
 * Shows a spinner while component is loading
 */
export const InvoiceFormLoadingFallback = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex items-center justify-center min-h-[60vh] ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Loading invoice form...
        </p>
      </div>
    </div>
  );
};

/**
 * Generic loading fallback for any page
 */
export const PageLoadingFallback = ({ label = "Loading..." }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex items-center justify-center min-h-[60vh] ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</p>
      </div>
    </div>
  );
};

export default InvoiceFormLoadingFallback;
