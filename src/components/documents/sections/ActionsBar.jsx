import PropTypes from 'prop-types';
import { Save, Eye, Download, CheckCircle, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

// Button Component
const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${
        isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${
        isDarkMode ? 'gray-800' : 'white'
      }`;
    } else if (variant === 'secondary') {
      return `${
        isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-200 hover:bg-gray-300'
      } ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-${
        isDarkMode ? 'gray-500' : 'gray-400'
      } disabled:${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      } focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else if (variant === 'success') {
      return `bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 hover:-translate-y-0.5 focus:ring-green-500 shadow-sm hover:shadow-md`;
    } else if (variant === 'danger') {
      return `bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 hover:-translate-y-0.5 focus:ring-red-500 shadow-sm hover:shadow-md`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
          : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
      } focus:ring-teal-500 disabled:${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      } focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * ActionsBar Component
 *
 * Sticky action bar with document operations.
 * Shows buttons based on config.features and document status.
 * Sticky on desktop, fixed bottom on mobile.
 *
 * @param {Function} onSave - Save draft handler
 * @param {Function} onPreview - Preview handler
 * @param {Function} onDownload - Download PDF handler
 * @param {Function} onApprove - Approve/Issue handler
 * @param {Function} onCancel - Cancel document handler
 * @param {Function} onBack - Back/Close handler
 * @param {boolean} isSaving - Save in progress
 * @param {boolean} isApproving - Approve in progress
 * @param {Object} config - Document form configuration
 * @param {string} status - Current document status
 */
const ActionsBar = ({
  onSave,
  onPreview,
  onDownload,
  onApprove,
  onCancel,
  onBack,
  isSaving = false,
  isApproving = false,
  config,
  status = 'draft',
}) => {
  const { isDarkMode } = useTheme();

  // Determine if Approve/Issue button should be shown
  const canApprove = status === 'draft' || status === 'proforma';

  // Get the label for the approve button based on status and document type
  const getApproveLabel = () => {
    if (config.documentType === 'invoice') {
      return status === 'draft' ? 'Issue Invoice' : 'Finalize';
    } else if (config.documentType === 'quotation') {
      return 'Send Quotation';
    } else if (config.documentType === 'purchaseOrder') {
      return 'Approve PO';
    } else if (config.documentType === 'vendorBill') {
      return 'Approve Bill';
    }
    return 'Approve';
  };

  return (
    <div
      className={`sticky bottom-0 lg:relative mt-6 p-3 md:p-4 rounded-lg shadow-lg border ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      } z-10`}
    >
      {/* Desktop Layout: Flex row */}
      <div className="hidden md:flex items-center justify-between gap-3">
        {/* Left: Back Button */}
        <div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft size={16} />
              Back
            </Button>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <Button
            variant="secondary"
            onClick={onSave}
            disabled={isSaving || isApproving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Draft
              </>
            )}
          </Button>

          {/* Preview */}
          {config.features?.enablePreview && onPreview && (
            <Button variant="outline" onClick={onPreview} disabled={isSaving || isApproving}>
              <Eye size={16} />
              Preview
            </Button>
          )}

          {/* Download PDF */}
          {config.features?.enablePdfDownload && onDownload && (
            <Button variant="outline" onClick={onDownload} disabled={isSaving || isApproving}>
              <Download size={16} />
              Download PDF
            </Button>
          )}

          {/* Approve/Issue */}
          {canApprove && onApprove && (
            <Button
              variant="success"
              onClick={onApprove}
              disabled={isSaving || isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {getApproveLabel()}
                </>
              )}
            </Button>
          )}

          {/* Cancel */}
          {onCancel && status !== 'cancelled' && (
            <Button
              variant="danger"
              onClick={onCancel}
              disabled={isSaving || isApproving}
            >
              <X size={16} />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Layout: Grid for better spacing */}
      <div className="md:hidden space-y-2">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={onSave}
            disabled={isSaving || isApproving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save
              </>
            )}
          </Button>

          {canApprove && onApprove && (
            <Button
              variant="success"
              onClick={onApprove}
              disabled={isSaving || isApproving}
              className="w-full"
            >
              {isApproving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {getApproveLabel()}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          {config.features?.enablePreview && onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              disabled={isSaving || isApproving}
              className="w-full"
            >
              <Eye size={14} />
              Preview
            </Button>
          )}

          {config.features?.enablePdfDownload && onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={isSaving || isApproving}
              className="w-full"
            >
              <Download size={14} />
              PDF
            </Button>
          )}

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          )}
        </div>

        {/* Cancel Action (if needed) */}
        {onCancel && status !== 'cancelled' && (
          <Button
            variant="danger"
            onClick={onCancel}
            disabled={isSaving || isApproving}
            className="w-full"
          >
            <X size={16} />
            Cancel Document
          </Button>
        )}
      </div>
    </div>
  );
};

ActionsBar.propTypes = {
  onSave: PropTypes.func.isRequired,
  onPreview: PropTypes.func,
  onDownload: PropTypes.func,
  onApprove: PropTypes.func,
  onCancel: PropTypes.func,
  onBack: PropTypes.func,
  isSaving: PropTypes.bool,
  isApproving: PropTypes.bool,
  config: PropTypes.shape({
    documentType: PropTypes.string.isRequired,
    features: PropTypes.shape({
      enablePreview: PropTypes.bool,
      enablePdfDownload: PropTypes.bool,
    }),
  }).isRequired,
  status: PropTypes.oneOf(['draft', 'approved', 'issued', 'cancelled', 'sent', 'accepted', 'rejected']),
};

export default ActionsBar;
