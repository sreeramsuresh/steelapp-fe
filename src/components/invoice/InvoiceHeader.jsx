import { toUAEDateProfessional } from '../../utils/invoiceUtils';
import { DEFAULT_TEMPLATE_SETTINGS } from '../../constants/defaultTemplateSettings';

/**
 * Invoice Header Component
 * Displays on every page of the invoice
 * Shows company info and optionally invoice details on first page
 * Uses logo uploaded in Company Settings (pdf_logo_url or logo_url)
 * Respects document-type-specific visibility settings from company.settings.documentImages
 */
const InvoiceHeader = ({ company, invoice, isFirstPage, primaryColor, template = null, documentType = 'invoice' }) => {
  const compAddr = company?.address || {};
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
  
  // Get document-type-specific image visibility settings
  const docImageSettings = company?.settings?.documentImages?.[documentType] || {
    showLogo: true,
    showSeal: true,
  };
  
  // Get logo from company profile
  let companyLogo = null;
  if (docImageSettings.showLogo) {
    if (company?.pdfLogoUrl) {
      companyLogo = company.pdfLogoUrl.startsWith('/') 
        ? `${baseUrl}${company.pdfLogoUrl}` 
        : company.pdfLogoUrl;
    } else if (company?.logoUrl) {
      companyLogo = company.logoUrl.startsWith('/') 
        ? `${baseUrl}${company.logoUrl}` 
        : company.logoUrl;
    }
  }
  
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const layout = template?.layout || {};
  const fonts = template?.fonts || {};
  const colors = template?.colors || {};
  
  const headerStyle = layout.headerStyle || 'centered';
  const showLogo = layout.showLogo !== false && docImageSettings.showLogo;
  const showWatermark = layout.showWatermark === true;
  const fontFamily = fonts.heading || 'Inter, system-ui, sans-serif';

  return (
    <div className="invoice-header" style={{ fontFamily }}>
      {/* Watermark for Professional template */}
      {showWatermark && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: '72px',
          fontWeight: 'bold',
          color: 'rgba(0,0,0,0.03)',
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          INVOICE
        </div>
      )}

      {/* HEADER SECTION */}
      <div className={`flex ${headerStyle === 'centered' ? 'flex-col items-center text-center' : 'justify-between items-start'} mb-4`}>
        {/* Company Info */}
        <div className={headerStyle === 'centered' ? 'mb-3' : ''}>
          <h1 className="text-lg font-bold" style={{ color: colors.primary || '#1a1a1a', fontFamily }}>
            {company?.name || 'Ultimate Steels Building Materials Trading'}
          </h1>
          <div className="text-sm mt-1" style={{ color: colors.secondary || '#4a4a4a' }}>
            {compAddr.street && <p>{compAddr.street}</p>}
            {(compAddr.city || compAddr.country) && (
              <p>{[compAddr.city, compAddr.country].filter(Boolean).join(', ')}</p>
            )}
            {company?.phone && <p>Mobile: {company.phone}</p>}
            {company?.email && <p>Email: {company.email}</p>}
            <p className="font-semibold mt-1">VAT Reg No: 104858252000003</p>
          </div>
        </div>

        {/* Logo */}
        {showLogo && companyLogo && (
          <div className={headerStyle === 'centered' ? 'mb-3' : ''}>
            <img src={companyLogo} alt="Company Logo" className="h-24 w-auto" />
          </div>
        )}
      </div>

      {/* Horizontal Line - Different styles per template */}
      <div className="mb-6" style={{ 
        borderTop: headerStyle === 'letterhead' ? `3px double ${color}` : `2px solid ${color}`,
      }}></div>

      {/* INVOICE TITLE */}
      <div className="mb-6">
        <div className="px-3 py-1.5 text-center font-bold text-base" style={{
          backgroundColor: colors.primary || color,
          color: '#ffffff',
          border: `1px solid ${colors.primary || color}`,
        }}>
          {invoice.status === 'draft' && 'DRAFT INVOICE'}
          {invoice.status === 'proforma' && 'PROFORMA INVOICE'}
          {(!invoice.status || (invoice.status !== 'draft' && invoice.status !== 'proforma')) && 'TAX INVOICE'}
        </div>
      </div>

      {/* INVOICE TO & INFO SECTION - Only on first page */}
      {isFirstPage && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left - Invoice To */}
          <div>
            <h3 className="text-base font-bold mb-2" style={{ color: colors.primary || '#1a1a1a' }}>Invoice To:</h3>
            <div className="text-sm" style={{ color: colors.text || '#333333' }}>
              {invoice.customer?.name && <p className="font-medium">{invoice.customer.name}</p>}
              {invoice.customer?.address?.street && <p>{invoice.customer.address.street}</p>}
              {(invoice.customer?.address?.city || invoice.customer?.address?.country) && (
                <p>{[invoice.customer.address.city, invoice.customer.address.country].filter(Boolean).join(', ')}</p>
              )}
              {invoice.customer?.email && <p><span className="font-semibold">Email:</span> {invoice.customer.email}</p>}
              {invoice.customer?.phone && <p>Phone: {invoice.customer.phone}</p>}
              {invoice.customer?.vatNumber && <p>TRN: {invoice.customer.vatNumber}</p>}
            </div>
          </div>

          {/* Right - Invoice Info Box */}
          <div className="border" style={{ borderColor: colors.primary || color }}>
            <div className="px-3 py-1.5 flex justify-between items-center" style={{
              backgroundColor: colors.primary || color,
              color: '#ffffff',
            }}>
              <span className="font-bold">Invoice No:</span>
              <span className="font-bold">{invoice.invoiceNumber || ''}</span>
            </div>
            <div className="px-3 py-2 text-sm space-y-1.5" style={{ color: colors.text || '#333333' }}>
              <div className="flex justify-between">
                <span className="font-semibold">Invoice Date:</span>
                <span>{toUAEDateProfessional(invoice.date || new Date())}</span>
              </div>
              {invoice.customerPurchaseOrderNumber && (
                <div className="flex justify-between">
                  <span className="font-semibold">SO:</span>
                  <span>{invoice.customerPurchaseOrderNumber}</span>
                </div>
              )}
              {invoice.customerPurchaseOrderDate && (
                <div className="flex justify-between">
                  <span className="font-semibold">Order Date:</span>
                  <span>{toUAEDateProfessional(invoice.customerPurchaseOrderDate)}</span>
                </div>
              )}
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="font-semibold">Due Date:</span>
                  <span>{toUAEDateProfessional(invoice.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CURRENCY & EXCHANGE RATE - Compact one-liner (UAE VAT Compliance) - Only on first page */}
      {isFirstPage && invoice.currency && invoice.currency !== 'AED' && (
        <div className="mb-2 text-xs" style={{ color: colors.text || '#666666' }}>
          <span className="italic">Exchange Rate: 1 {invoice.currency} = {invoice.exchangeRate || 1} AED</span>
        </div>
      )}
    </div>
  );
};

export default InvoiceHeader;
