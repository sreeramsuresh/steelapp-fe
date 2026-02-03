import { X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useEscapeKey from "../../hooks/useEscapeKey";

/**
 * Accessible modal wrapper with Escape key support
 * Fixes bug #25: Modal Escape key handling
 *
 * Usage:
 *   <Modal isOpen={isOpen} onClose={handleClose} title="Add Item">
 *     <p>Modal content here</p>
 *   </Modal>
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // 'sm', 'md', 'lg', 'xl'
  closeButton = true,
  className = "",
}) => {
  const { isDarkMode } = useTheme();

  // Handle Escape key
  useEscapeKey(onClose, isOpen);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-hidden="true"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full mx-4 p-6 rounded-lg shadow-xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } ${sizeClasses[size]} ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{title}</h2>
            {closeButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
