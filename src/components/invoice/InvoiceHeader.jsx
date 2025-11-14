import React from 'react';
import defaultLogo from "../../assets/logocompany.png";
import { formatDateDMY } from "../../utils/invoiceUtils";
import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";

/**
 * Invoice Header Component
 * Displays on every page of the invoice
 * Shows company info and optionally invoice details on first page
 */
const InvoiceHeader = ({ company, invoice, isFirstPage, primaryColor }) => {
  const compAddr = company?.address || {};
  const companyLogo = company?.logo_url || company?.pdf_logo_url || defaultLogo;
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  return (
    <div className="invoice-header">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start mb-4">
        {/* Company Info - Left */}
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {company?.name || "Ultimate Steels Building Materials Trading"}
          </h1>
          <div className="text-sm text-gray-600 mt-1">
            {compAddr.street && <p>{compAddr.street}</p>}
            {(compAddr.city || compAddr.country) && (
              <p>{[compAddr.city, compAddr.country].filter(Boolean).join(", ")}</p>
            )}
            {company?.phone && <p>Mobile: {company.phone}</p>}
            {company?.email && <p>Email: {company.email}</p>}
            <p className="font-semibold mt-1">VAT Reg No: 104858252000003</p>
          </div>
        </div>

        {/* Logo - Right */}
        <div>
          <img src={companyLogo} alt="Company Logo" className="h-24 w-auto" />
        </div>
      </div>

      {/* Horizontal Line */}
      <div className="border-t-2 mb-6" style={{ borderColor: color }}></div>

      {/* INVOICE TITLE */}
      <div className="mb-6">
        <div className="text-white px-3 py-1.5 text-center font-bold text-base" style={{ backgroundColor: color }}>
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
            <h3 className="text-base font-bold text-gray-900 mb-2">Invoice To:</h3>
            <div className="text-sm text-gray-700">
              {invoice.customer?.name && <p className="font-medium">{invoice.customer.name}</p>}
              {invoice.customer?.address?.street && <p>{invoice.customer.address.street}</p>}
              {(invoice.customer?.address?.city || invoice.customer?.address?.country) && (
                <p>{[invoice.customer.address.city, invoice.customer.address.country].filter(Boolean).join(", ")}</p>
              )}
              {invoice.customer?.email && <p><span className="font-semibold">Email:</span> {invoice.customer.email}</p>}
              {invoice.customer?.phone && <p>Phone: {invoice.customer.phone}</p>}
              {invoice.customer?.vatNumber && <p>TRN: {invoice.customer.vatNumber}</p>}
            </div>
          </div>

          {/* Right - Invoice Info Box */}
          <div className="border" style={{ borderColor: color }}>
            <div className="text-white px-3 py-1.5 flex justify-between items-center" style={{ backgroundColor: color }}>
              <span className="font-bold">Invoice No:</span>
              <span className="font-bold">{invoice.invoiceNumber || ""}</span>
            </div>
            <div className="px-3 py-2 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="font-semibold">Invoice Date:</span>
                <span>{formatDateDMY(invoice.date || new Date())}</span>
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
                  <span>{formatDateDMY(invoice.customerPurchaseOrderDate)}</span>
                </div>
              )}
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="font-semibold">Due Date:</span>
                  <span>{formatDateDMY(invoice.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CURRENCY & EXCHANGE RATE SECTION (UAE VAT Compliance) - Only on first page */}
      {isFirstPage && invoice.currency && invoice.currency !== 'AED' && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
          <div className="font-semibold text-blue-900 mb-1">Currency Information:</div>
          <div className="text-blue-800 space-y-1">
            <div><span className="font-semibold">Currency:</span> {invoice.currency}</div>
            <div><span className="font-semibold">Exchange Rate:</span> 1 {invoice.currency} = {invoice.exchangeRate || 1} AED</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHeader;
