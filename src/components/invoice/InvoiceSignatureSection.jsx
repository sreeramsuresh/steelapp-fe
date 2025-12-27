// Invoice Signature Section Component

/**
 * Invoice Signature Section Component
 * Displays company seal and authorized signatory
 * ONLY SHOWN ON LAST PAGE (UAE Best Practice + Industry Standard)
 * Uses seal uploaded in Company Settings (pdf_seal_url or seal_url)
 */
const InvoiceSignatureSection = ({ company, template = null }) => {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    'http://localhost:3000';

  const colors = template?.colors || {};
  const primaryColor = colors.primary || '#111';
  const secondaryColor = colors.secondary || '#555';

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
    <div
      className="invoice-signature-section"
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '30px',
          marginBottom: '20px',
        }}
      >
        {/* Company Seal - Left */}
        {companySeal && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <img
              src={companySeal}
              alt="Company Seal"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
              }}
            />
            <p
              style={{
                fontSize: '9px',
                color: secondaryColor,
                opacity: 0.6,
              }}
            >
              Company Seal
            </p>
          </div>
        )}

        {/* Authorized Signatory - Right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '180px',
          }}
        >
          <p
            style={{
              fontSize: '9px',
              color: secondaryColor,
              opacity: 0.6,
              marginBottom: '30px',
            }}
          >
            Authorised Signatory
          </p>
          <div
            style={{
              width: '100%',
              borderBottom: '1px solid #333',
              marginBottom: '8px',
            }}
          ></div>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '9px',
                fontWeight: 'bold',
                lineHeight: 1.5,
                color: primaryColor,
              }}
            >
              ULTIMATE STEELS
            </p>
            <p
              style={{
                fontSize: '9px',
                fontWeight: 'bold',
                lineHeight: 1.5,
                color: primaryColor,
              }}
            >
              BUILDING MATERIALS TRADING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSignatureSection;
