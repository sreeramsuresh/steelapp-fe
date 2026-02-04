import { AlertCircle, Copy, Info } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Invoice Number Format Settings Component
 * Shows current format and instructions for customization
 */
export const InvoiceNumberFormatSettings = () => {
  const { isDarkMode } = useTheme();
  const [copied, setCopied] = useState(false);

  // Current format example
  const currentFormat = "DFT-YYYYMM-####";
  const exampleNumber = "DFT-202602-0001";

  const handleCopyExample = () => {
    navigator.clipboard.writeText(exampleNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-lg border p-6 ${isDarkMode ? "bg-[#1a1f26] border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className="flex items-start gap-3 mb-6">
        <Info size={24} className="text-teal-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Invoice Number Format
          </h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Configure how your invoice numbers are generated. Contact support to customize the format for your business
            requirements.
          </p>
        </div>
      </div>

      <div
        className={`rounded-lg p-4 mb-6 border ${isDarkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}
      >
        <div className="mb-4">
          <div className={`block text-xs font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Current Format Pattern
          </div>
          <div
            className={`font-mono text-sm p-3 rounded ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}
          >
            {currentFormat}
          </div>
        </div>

        <div className="mb-4">
          <div className={`block text-xs font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Example Output
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`font-mono text-sm p-3 rounded flex-1 ${isDarkMode ? "bg-gray-800 text-green-300" : "bg-white text-green-700"}`}
            >
              {exampleNumber}
            </div>
            <button
              type="button"
              onClick={handleCopyExample}
              className={`p-3 rounded transition-all ${
                copied
                  ? isDarkMode
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={copied ? "Copied!" : "Copy example"}
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        <div>
          <div className={`block text-xs font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Format Components
          </div>
          <div className={`text-sm space-y-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            <p>
              <span className="font-semibold">DFT</span> = Status prefix (DFT = Draft, INV = Invoice)
            </p>
            <p>
              <span className="font-semibold">YYYYMM</span> = Year and Month (202602 = February 2026)
            </p>
            <p>
              <span className="font-semibold">####</span> = Sequential number (0001, 0002, etc.)
            </p>
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg p-4 border-l-4 ${isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-500"}`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className={`flex-shrink-0 mt-0.5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
          <div>
            <p className={`text-sm font-semibold ${isDarkMode ? "text-blue-300" : "text-blue-900"}`}>
              Want a Custom Format?
            </p>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-blue-200/80" : "text-blue-800"}`}>
              Invoice number formats are configured per company. Contact your administrator or support team to request
              custom numbering schemes like INV-PREFIX-001 or custom date formats.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <a
          href="mailto:support@ultimatesteel.com"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDarkMode ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-teal-500 hover:bg-teal-600 text-white"
          }`}
        >
          <AlertCircle size={16} />
          Request Custom Format
        </a>
      </div>
    </div>
  );
};

export default InvoiceNumberFormatSettings;
