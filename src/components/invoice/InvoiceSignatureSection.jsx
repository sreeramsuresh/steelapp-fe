import React from 'react';
import defaultSeal from "../../assets/Seal.png";

/**
 * Invoice Signature Section Component
 * Displays company seal and authorized signatory
 * ONLY SHOWN ON LAST PAGE (UAE Best Practice + Industry Standard)
 */
const InvoiceSignatureSection = ({ company }) => {
  const companySeal = company?.seal_url || defaultSeal;

  return (
    <div className="invoice-signature-section">
      {/* SIGNATURE AND SEAL SECTION */}
      <div className="flex justify-between items-end mb-6 mt-8">
        {/* Company Seal - Left */}
        <div className="flex flex-col items-center gap-1">
          <img src={companySeal} alt="Company Seal" className="w-28 h-28 object-contain" />
          <p className="text-xs font-medium text-gray-700 mt-1">Company Seal</p>
        </div>

        {/* Authorized Signatory - Right */}
        <div className="flex flex-col items-center min-w-[200px]">
          <p className="text-sm font-bold text-gray-900 mb-6">Authorized Signatory</p>
          <div className="w-full border-b-2 border-gray-800 mb-3"></div>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-800 leading-tight">ULTIMATE STEELS</p>
            <p className="text-xs font-bold text-gray-800 leading-tight">BUILDING MATERIALS TRADING</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSignatureSection;
