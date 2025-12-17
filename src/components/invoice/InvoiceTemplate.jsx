import InvoiceHeader from "./InvoiceHeader";
import InvoiceFooter from "./InvoiceFooter";
import InvoiceItemsTable from "./InvoiceItemsTable";
import InvoiceTotalsSection from "./InvoiceTotalsSection";
import InvoiceFooterNotes from "./InvoiceFooterNotes";
import InvoiceSignatureSection from "./InvoiceSignatureSection";
import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";

/**
 * Invoice Template Component
 * Represents a single page of an invoice
 * Used by both preview and PDF generation
 *
 * @param {Object} invoice - Full invoice data
 * @param {Object} company - Company settings
 * @param {Array} items - Items to display on THIS page
 * @param {number} startingIndex - Global index of first item on this page
 * @param {number} pageNumber - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {boolean} isFirstPage - Is this the first page?
 * @param {boolean} isLastPage - Is this the last page?
 * @param {boolean} showSignature - Show signature section?
 * @param {boolean} showTotals - Show totals section?
 */
const InvoiceTemplate = ({
  invoice,
  company,
  items,
  startingIndex = 0,
  pageNumber,
  totalPages,
  isFirstPage,
  isLastPage,
  showSignature = false,
  showTotals = false,
  template = null,
  documentType = "invoice",
}) => {
  // Get template colors - prioritize passed template, then company settings (camelCase or snake_case), then defaults
  const templateSettings =
    template ||
    company?.settings?.invoiceTemplate ||
    company?.settings?.invoice_template ||
    DEFAULT_TEMPLATE_SETTINGS;
  const primaryColor =
    templateSettings.colors?.primary ||
    DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  return (
    <div
      className="invoice-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "15mm",
        boxSizing: "border-box",
        background: "white",
        position: "relative",
        pageBreakAfter: isLastPage ? "avoid" : "always",
      }}
    >
      {/* Header - appears on every page */}
      <InvoiceHeader
        company={company}
        invoice={invoice}
        isFirstPage={isFirstPage}
        primaryColor={primaryColor}
        template={templateSettings}
        documentType={documentType}
      />

      {/* Items table - with continued indicator on pages after first */}
      <InvoiceItemsTable
        items={items}
        startingIndex={startingIndex}
        isFirstPage={isFirstPage}
        isContinued={!isFirstPage}
        primaryColor={primaryColor}
        template={templateSettings}
      />

      {/* Totals - only on last page */}
      {isLastPage && showTotals && (
        <InvoiceTotalsSection
          invoice={invoice}
          primaryColor={primaryColor}
          template={templateSettings}
        />
      )}

      {/* Last Page Footer Group - Keep together to prevent orphaned sections */}
      {isLastPage && (
        <div
          className="invoice-last-page-group"
          style={{
            pageBreakInside: "avoid",
            breakInside: "avoid",
          }}
        >
          {/* Terms & Notes - only on last page */}
          <InvoiceFooterNotes invoice={invoice} template={templateSettings} />

          {/* Signature - only on last page */}
          {showSignature && (
            <InvoiceSignatureSection
              company={company}
              template={templateSettings}
            />
          )}
        </div>
      )}

      {/* Page footer - appears on every page */}
      <InvoiceFooter
        company={company}
        pageNumber={pageNumber}
        totalPages={totalPages}
        primaryColor={primaryColor}
        template={templateSettings}
      />
    </div>
  );
};

export default InvoiceTemplate;
