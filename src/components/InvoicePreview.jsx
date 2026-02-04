import { FileText, X } from "lucide-react";
import { useMemo } from "react";
import { DEFAULT_TEMPLATE_SETTINGS } from "../constants/defaultTemplateSettings";
import { useTheme } from "../contexts/ThemeContext";
import { calculatePagination, splitItemsIntoPages } from "../utils/invoicePagination";
import InvoiceTemplate from "./invoice/InvoiceTemplate";

const InvoicePreview = ({
  invoice,
  company,
  onClose,
  invoiceId,
  onSave,
  isSaving,
  isFormValid = true,
  template = null,
}) => {
  const { isDarkMode } = useTheme();

  // Handle save with error handling
  const handleSave = async () => {
    if (!onSave) return;

    try {
      await onSave();
      // If save is successful and this is a new invoice, close preview
      // (Update invoices stay open for user to see the result)
      if (!invoiceId) {
        onClose();
      }
    } catch (error) {
      // If validation fails, close preview to show user the form with errors
      if (error.message === "VALIDATION_FAILED") {
        onClose();
      } else {
        console.error("Save error:", error);
        // For other errors, keep preview open so user can see the invoice
      }
    }
  };

  // Get template color reactively from company settings (handles both camelCase and snake_case)
  // Note: This is computed but not currently used in the component
  const _primaryColor = useMemo(() => {
    return (
      company?.settings?.invoiceTemplate?.colors?.primary ||
      company?.settings?.invoice_template?.colors?.primary ||
      DEFAULT_TEMPLATE_SETTINGS.colors.primary
    );
  }, [company?.settings?.invoiceTemplate, company?.settings?.invoice_template]);

  // Check if form has required fields based on invoice status
  const checkFormValidity = () => {
    // Existing invoices can always be viewed/updated
    if (invoiceId) return true;

    const hasCustomer = invoice.customer?.name && invoice.customer.name.trim() !== "";
    const hasItems = invoice.items && invoice.items.length > 0;
    const hasValidItems =
      hasItems &&
      invoice.items.every((item) => item.name && item.name.trim() !== "" && item.quantity > 0 && item.rate > 0);
    const hasDate = !!invoice.date;
    const hasDueDate = !!invoice.dueDate;

    const isComplete = hasCustomer && hasItems && hasValidItems && hasDate && hasDueDate;

    // Business rules by status:
    // - draft: Allow save with incomplete data (work in progress)
    // - proforma: Require complete data (sent to customers as quote)
    // - issued: Require complete data (final legal invoice)
    const status = invoice.status || "draft";

    if (status === "draft") {
      // Drafts can be saved incomplete, but we'll block PDF download separately
      return true;
    }

    // Proforma and issued invoices must be complete
    return isComplete;
  };

  // Use the isFormValid prop if explicitly passed (from parent), otherwise use internal validation
  // This ensures the save button is properly disabled when parent says form is invalid
  const canSave = isFormValid !== undefined ? isFormValid : checkFormValidity();

  // Calculate pagination for multi-page support
  const pagination = calculatePagination(invoice);
  const pages = splitItemsIntoPages(invoice.items || [], pagination);

  // Calculate starting index for each page
  const pagesWithIndices = pages.map((page, idx) => {
    const startingIndex = pages.slice(0, idx).reduce((sum, p) => sum + p.items.length, 0);
    return {
      ...page,
      startingIndex,
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Invoice Preview{" "}
            {pagination.pages > 1 && (
              <span className="text-sm font-normal text-gray-500 ml-2">({pagination.pages} pages)</span>
            )}
          </h2>
          <div className="flex gap-2">
            {onSave && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !canSave}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  canSave
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                } disabled:opacity-50`}
                title={!canSave ? "Please fill in all required fields (Customer, Items, Date, Due Date)" : ""}
              >
                {isSaving ? "Saving..." : invoiceId ? "Update" : "Save"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Invoice Preview Content - Scrollable with Multiple Pages */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: "#f5f5f5" }}>
          {pagesWithIndices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText size={48} className="text-gray-400" />
              <p className="text-gray-500 font-medium">No items to preview</p>
              <p className="text-sm text-gray-400">Add items to the invoice to see a preview</p>
            </div>
          ) : (
            pagesWithIndices.map((page, idx) => (
              <div key={idx} className="mb-8">
                <InvoiceTemplate
                  invoice={invoice}
                  company={company}
                  items={page.items}
                  startingIndex={page.startingIndex}
                  pageNumber={page.pageNumber}
                  totalPages={page.totalPages}
                  isFirstPage={page.isFirstPage}
                  isLastPage={page.isLastPage}
                  showSignature={page.isLastPage}
                  showTotals={page.isLastPage}
                  template={template}
                  documentType="invoice"
                />

                {/* Page Break Indicator - Only between pages, not after last */}
                {idx < pagesWithIndices.length - 1 && (
                  <div
                    className="page-break-indicator"
                    style={{
                      height: "30px",
                      background: "#e0e0e0",
                      borderTop: "2px dashed #999",
                      borderBottom: "2px dashed #999",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      fontSize: "12px",
                      fontWeight: "500",
                      margin: "20px auto",
                      maxWidth: "210mm",
                    }}
                  >
                    — Page {page.pageNumber} Ends / Page {page.pageNumber + 1} Begins —
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Validation Warning */}
        {!canSave && (
          <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">⚠️ Please fill in all required fields before saving:</p>
            <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
              <li>Customer name</li>
              <li>At least one item (with name, quantity, and rate)</li>
              <li>Invoice Date</li>
              <li>Due Date</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;
