import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import InvoiceFooter from './InvoiceFooter';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceTotalsSection from './InvoiceTotalsSection';
import InvoiceFooterNotes from './InvoiceFooterNotes';
import InvoiceSignatureSection from './InvoiceSignatureSection';
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
  showTotals = false
}) => {
  // Get template colors from company settings or use defaults
  const templateSettings = company?.settings?.invoiceTemplate || DEFAULT_TEMPLATE_SETTINGS;
  const primaryColor = templateSettings.colors?.primary || DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  return (
    <div
      className="invoice-page"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '15mm',
        boxSizing: 'border-box',
        background: 'white',
        position: 'relative',
        pageBreakAfter: isLastPage ? 'avoid' : 'always'
      }}
    >
      {/* Header - appears on every page */}
      <InvoiceHeader
        company={company}
        invoice={invoice}
        isFirstPage={isFirstPage}
        primaryColor={primaryColor}
      />

      {/* Items table - with continued indicator on pages after first */}
      <InvoiceItemsTable
        items={items}
        startingIndex={startingIndex}
        isFirstPage={isFirstPage}
        isContinued={!isFirstPage}
        primaryColor={primaryColor}
      />

      {/* Totals - only on last page */}
      {isLastPage && showTotals && (
        <InvoiceTotalsSection
          invoice={invoice}
          primaryColor={primaryColor}
        />
      )}

      {/* Terms & Notes - only on last page */}
      {isLastPage && (
        <InvoiceFooterNotes invoice={invoice} />
      )}

      {/* Signature - only on last page */}
      {isLastPage && showSignature && (
        <InvoiceSignatureSection company={company} />
      )}

      {/* Page footer - appears on every page */}
      <InvoiceFooter
        company={company}
        pageNumber={pageNumber}
        totalPages={totalPages}
        primaryColor={primaryColor}
      />
    </div>
  );
};

export default InvoiceTemplate;
