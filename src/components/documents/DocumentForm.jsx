// ═══════════════════════════════════════════════════════════════
// DOCUMENT FORM ORCHESTRATOR (Rule 3 - No Type Conditionals)
// Unified form component for all document types
// Composes section components + uses config + adapter pattern
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDocumentState } from '../../hooks/documents/useDocumentState';
import { useDocumentValidation } from '../../hooks/documents/useDocumentValidation';
import { useDocumentCalculator } from '../../hooks/documents/useDocumentCalculator';
import { validateAndLogConfig } from '../../config/documents/configValidator';

// Section components
import {
  ActionsBar,
  PartySection,
  HeaderSection,
  LineItemsSection,
  ChargesTotalsSection,
  NotesSection,
} from './sections';

/**
 * Validation Error Display Component
 */
const ValidationErrors = ({ errors, onErrorClick }) => {
  const { isDarkMode } = useTheme();

  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={`rounded-lg border p-4 mb-4 ${
        isDarkMode
          ? 'bg-red-900/20 border-red-800'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
          size={20}
        />
        <div className="flex-1">
          <h3
            className={`font-semibold mb-2 ${
              isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}
          >
            Please fix the following errors:
          </h3>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li
                key={idx}
                className={`text-sm cursor-pointer hover:underline ${
                  isDarkMode ? 'text-red-300' : 'text-red-700'
                }`}
                onClick={() => onErrorClick?.(error)}
              >
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

ValidationErrors.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      level: PropTypes.string,
      field: PropTypes.string,
      message: PropTypes.string.isRequired,
      code: PropTypes.string,
    })
  ),
  onErrorClick: PropTypes.func,
};

/**
 * Loading Overlay Component
 */
const LoadingOverlay = ({ message = 'Loading...' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`rounded-lg shadow-xl p-6 flex flex-col items-center gap-3 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <Loader2 className="animate-spin text-teal-600" size={32} />
        <p
          className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  message: PropTypes.string,
};

/**
 * Main DocumentForm Component
 *
 * Props:
 * - config: DocumentFormConfig (required)
 * - adapter: DocumentAdapter (required)
 * - documentId: number (optional - for edit mode)
 * - initialData: Partial<DocumentState> (optional - for duplicate/convert)
 * - onSaveSuccess: (result) => void
 * - onCancel: () => void
 */
export const DocumentForm = ({
  config,
  adapter,
  documentId,
  initialData,
  onSaveSuccess,
  onCancel,
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Validate config in dev mode (Rule 13)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      validateAndLogConfig(config.documentLabel, config);
    }
  }, [config]);

  // State management hooks
  const {
    document,
    setDocument,
    setHeader,
    setParty,
    addLine,
    updateLine,
    removeLine,
    reorderLines,
    setCharge,
    setDiscount,
    setNotes,
    isDirty,
  } = useDocumentState(config, initialData);

  // Validation hook
  const validation = useDocumentValidation(
    document,
    config,
    config.overrides?.customValidators || []
  );

  // Calculator hook for totals
  const totals = useDocumentCalculator(document, {
    vatInclusive: false,
    roundingMode: 'per-line',
    currencyPrecision: 2,
    discountBeforeVat: true,
  });

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing document if documentId provided
  useEffect(() => {
    if (documentId && !initialData) {
      loadDocument(documentId);
    }
  }, [documentId]);

  const loadDocument = async (id) => {
    try {
      setIsLoading(true);
      setLoadingMessage(`Loading ${config.documentLabel}...`);

      // This would call a service that uses the adapter
      // For now, placeholder:
      // const apiData = await documentService.load(config.documentType, id);
      // const formData = adapter.toForm(apiData);
      // setDocument(formData);

      console.log(`TODO: Load document ${id} via adapter`);
    } catch (error) {
      console.error(`Failed to load ${config.documentLabel}:`, error);
      alert(`Error loading ${config.documentLabel}: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle save (draft or approved)
  const handleSave = useCallback(
    async (isDraft = false) => {
      // Validate
      if (!isDraft && !validation.isValid) {
        alert('Please fix all validation errors before saving');
        return;
      }

      try {
        setIsSaving(true);

        // Convert to API payload using adapter
        const payload = adapter.fromForm(document);

        // This would call a service to save
        // For now, placeholder:
        console.log(`TODO: Save ${config.documentLabel}`, {
          isDraft,
          payload,
        });

        // Mock success
        const result = {
          success: true,
          id: documentId || Math.floor(Math.random() * 1000),
          docNumber: document.header.docNumber || `${config.numberPrefix}-001`,
        };

        // Notify success
        console.log(`${config.documentLabel} saved successfully!`, result);

        // Call success callback
        onSaveSuccess?.(result);

        // Navigate back to list
        if (config.listRoute) {
          navigate(config.listRoute);
        }
      } catch (error) {
        console.error(`Failed to save ${config.documentLabel}:`, error);
        alert(`Error saving ${config.documentLabel}: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    },
    [document, validation, adapter, config, documentId, onSaveSuccess, navigate]
  );

  // Handle preview
  const handlePreview = useCallback(() => {
    if (!validation.isValid) {
      alert('Please fix validation errors before previewing');
      return;
    }

    console.log('TODO: Open preview modal or new tab', document);
    alert('Preview functionality coming soon');
  }, [document, validation]);

  // Handle PDF download
  const handleDownloadPdf = useCallback(() => {
    if (!validation.isValid) {
      alert('Please fix validation errors before downloading PDF');
      return;
    }

    console.log('TODO: Generate and download PDF', document);
    alert('PDF download functionality coming soon');
  }, [document, validation]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }

    onCancel?.();

    if (config.listRoute) {
      navigate(config.listRoute);
    }
  }, [isDirty, onCancel, config, navigate]);

  // Handle back button
  const handleBack = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  // Scroll to error field
  const handleErrorClick = useCallback((error) => {
    if (error.field) {
      const element = document.getElementById(error.field);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus?.();
      }
    }
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Render slot component (Rule 7)
  const renderSlot = useCallback(
    (slotName) => {
      const SlotComponent = config.slots?.[slotName];
      if (!SlotComponent) return null;

      return (
        <SlotComponent
          document={document}
          config={config}
          setDocument={setDocument}
        />
      );
    },
    [config, document, setDocument]
  );

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      } pb-24 md:pb-8`}
    >
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Header with Back Button */}
      <div
        className={`sticky top-0 z-20 border-b ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        } shadow-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1
                  className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {documentId
                    ? `Edit ${config.documentLabel}`
                    : `New ${config.documentLabel}`}
                </h1>
                {document.header.docNumber && (
                  <p
                    className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {document.header.docNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:block">
              <ActionsBar
                config={config}
                document={document}
                validation={validation}
                isDirty={isDirty}
                isSaving={isSaving}
                onSaveDraft={() => handleSave(true)}
                onSaveApproved={() => handleSave(false)}
                onPreview={handlePreview}
                onDownloadPdf={handleDownloadPdf}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Validation Errors */}
        <ValidationErrors
          errors={validation.errors}
          onErrorClick={handleErrorClick}
        />

        {/* Slot: afterHeader */}
        {renderSlot('afterHeader')}

        {/* Party + Header Section (Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Party Section */}
          <PartySection
            config={config}
            party={document.party}
            setParty={setParty}
            validation={validation}
          />

          {/* Header Section */}
          <HeaderSection
            config={config}
            header={document.header}
            setHeader={setHeader}
            validation={validation}
          />
        </div>

        {/* Slot: beforeLineItems */}
        {renderSlot('beforeLineItems')}

        {/* Line Items Section */}
        <LineItemsSection
          config={config}
          lines={document.lines}
          addLine={addLine}
          updateLine={updateLine}
          removeLine={removeLine}
          reorderLines={reorderLines}
          validation={validation}
        />

        {/* Slot: afterLineItems */}
        {renderSlot('afterLineItems')}

        {/* Charges & Totals Section */}
        <ChargesTotalsSection
          config={config}
          charges={document.charges}
          totals={totals}
          discount={document.discount}
          setCharge={setCharge}
          setDiscount={setDiscount}
        />

        {/* Slot: beforeNotes */}
        {renderSlot('beforeNotes')}

        {/* Notes Section */}
        <NotesSection
          config={config}
          notes={document.notes}
          setNotes={setNotes}
        />
      </div>

      {/* Mobile Actions Bar (Fixed Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
        <ActionsBar
          config={config}
          document={document}
          validation={validation}
          isDirty={isDirty}
          isSaving={isSaving}
          onSaveDraft={() => handleSave(true)}
          onSaveApproved={() => handleSave(false)}
          onPreview={handlePreview}
          onDownloadPdf={handleDownloadPdf}
          onCancel={handleCancel}
          isMobile
        />
      </div>
    </div>
  );
};

DocumentForm.propTypes = {
  config: PropTypes.object.isRequired, // DocumentFormConfig
  adapter: PropTypes.object.isRequired, // DocumentAdapter
  documentId: PropTypes.number,
  initialData: PropTypes.object,
  onSaveSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

export default DocumentForm;
