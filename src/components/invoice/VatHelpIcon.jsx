import { Info, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const VatHelpIcon = ({ content, heading }) => {
  const [showModal, setShowModal] = useState(false);
  const { isDarkMode } = useTheme();

  const handleCloseModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center ml-1 p-1 transition-colors"
        title="Click for help"
      >
        <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
      </button>

      {showModal && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
          onClick={handleCloseModal}
          tabIndex={-1}
          onKeyDown={(e) => e.key === "Escape" && handleCloseModal()}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-xl mx-4 shadow-xl relative my-8`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={handleCloseModal}
              className={`absolute top-4 right-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              <X className="w-4 h-4" />
            </button>
            {heading && (
              <h2 className={`text-sm font-bold mb-4 pr-4 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                {heading}
              </h2>
            )}
            <div className={`space-y-4 pr-4 normal-case ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {Array.isArray(content) ? (
                content.map((paragraph, idx) => (
                  <p
                    key={paragraph}
                    className={`text-xs leading-relaxed normal-case ${idx === 0 ? "font-semibold" : ""}`}
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-xs leading-relaxed normal-case">{content}</p>
              )}
            </div>
          </div>
        </button>
      )}
    </>
  );
};

export default VatHelpIcon;
