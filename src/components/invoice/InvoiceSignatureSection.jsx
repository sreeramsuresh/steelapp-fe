// Invoice Signature Section Component

/**
 * Invoice Signature Section Component
 * Displays company seal and authorized signatory
 * ONLY SHOWN ON LAST PAGE (UAE Best Practice + Industry Standard)
 * Uses seal uploaded in Company Settings (pdf_seal_url or seal_url)
 * Supports template-based styling for color customization
 */
const InvoiceSignatureSection = ({ company, template = null }) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

  // Get template colors
  const colors = template?.colors || {};
  const primaryColor = colors.primary || '#1a1a1a';
  const textColor = colors.text || '#1f2937';

  // Get seal from company profile
  let companySeal = null;
  if (company?.pdfSealUrl) {
    companySeal = company.pdfSealUrl.startsWith('/')
      ? `${baseUrl}${company.pdfSealUrl}`
      : company.pdfSealUrl;
  } else if (company?.sealUrl) {
    companySeal = company.sealUrl.startsWith('/')
      ? `${baseUrl}${company.sealUrl}`
      : company.sealUrl;
  }

  return (
    <div className="invoice-signature-section">
      {/* SIGNATURE AND SEAL SECTION */}
      <div className="flex justify-between items-end mb-6 mt-8">
        {/* Company Seal - Left */}
        <div className="flex flex-col items-center gap-1">
          <img src={companySeal} alt="Company Seal" className="w-28 h-28 object-contain" />
          <p className="text-xs font-medium" style={{ color: textColor }}>Company Seal</p>
        </div>

        {/* Authorized Signatory - Right */}
        <div className="flex flex-col items-center min-w-[200px]">
          <p className="text-sm font-bold mb-6" style={{ color: textColor }}>Authorized Signatory</p>
          <div className="w-full border-b-2 mb-3" style={{ borderColor: primaryColor }}></div>
          <div className="text-center">
            <p className="text-xs font-bold leading-tight" style={{ color: primaryColor }}>ULTIMATE STEELS</p>
            <p className="text-xs font-bold leading-tight" style={{ color: primaryColor }}>BUILDING MATERIALS TRADING</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSignatureSection;
