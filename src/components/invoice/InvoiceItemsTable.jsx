import React from 'react';
import { calculateTRN, formatNumber } from "../../utils/invoiceUtils";
import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";

/**
 * Invoice Items Table Component
 * Displays line items for current page
 * Shows continued indicator on pages after first
 */
const InvoiceItemsTable = ({
  items,
  startingIndex = 0,
  isFirstPage,
  isContinued,
  primaryColor
}) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  return (
    <div className="invoice-items-table mb-6">
      {/* Continuation indicator for pages after first */}
      {isContinued && !isFirstPage && (
        <div className="table-continued-header mb-2 text-xs text-gray-600 italic">
          (Continued from previous page)
        </div>
      )}

      {/* TABLE SECTION - UAE VAT Compliant */}
      <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
        <thead>
          <tr className="text-white" style={{ backgroundColor: color }}>
            <th className="px-2 py-2 text-left text-xs font-bold" style={{ width: '4%' }}>Sr.</th>
            <th className="px-2 py-2 text-left text-xs font-bold" style={{ width: '44%' }}>Description</th>
            <th className="px-2 py-2 text-center text-xs font-bold" style={{ width: '6%' }}>Qty</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '10%' }}>Unit Price</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '10%' }}>Net Amt</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '16%' }}>VAT</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '10%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((item, index) => {
            const amountNum = parseFloat(item.amount) || 0;
            const vatRate = parseFloat(item.vatRate) || 0;
            const vatAmount = calculateTRN(amountNum, vatRate);
            const totalWithVAT = amountNum + vatAmount;
            const globalIndex = startingIndex + index;

            return (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-2 py-2 text-xs">{globalIndex + 1}</td>
                <td className="px-2 py-2 text-xs font-medium">{item.name || ""}</td>
                <td className="px-2 py-2 text-xs text-center">{item.quantity || 0}</td>
                <td className="px-2 py-2 text-xs text-right">{formatNumber(item.rate || 0)}</td>
                <td className="px-2 py-2 text-xs text-right">{formatNumber(amountNum)}</td>
                <td className="px-2 py-2 text-xs text-right">{formatNumber(vatAmount)} ({vatRate > 0 ? `${vatRate}%` : "0%"})</td>
                <td className="px-2 py-2 text-xs text-right font-medium">{formatNumber(totalWithVAT)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t-2 border-gray-300 mt-1"></div>
    </div>
  );
};

export default InvoiceItemsTable;
