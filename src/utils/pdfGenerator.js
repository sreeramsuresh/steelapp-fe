import { formatCurrency, formatDate, calculateTRN, calculateSubtotal, calculateTotalTRN, calculateTotal } from './invoiceUtils';
import logoCompany from '../assets/logocompany.png';
import sealImage from '../assets/Seal.png';

export const generateInvoicePDF = async (invoice, company) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    // Create a temporary DOM element for the invoice
    const invoiceElement = createInvoiceElement(invoice, company);
    document.body.appendChild(invoiceElement);
    
    // Log element for debugging
    console.log('Invoice element created:', invoiceElement);
    console.log('Element HTML:', invoiceElement.innerHTML.substring(0, 500));
    
    // Ensure images/fonts are ready and give DOM a tick
    await waitForImages(invoiceElement);
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Import html2canvas dynamically
    const html2canvas = (await import('html2canvas')).default;
    
    // Generate canvas from the element with optimized options for backgrounds
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: false,
      removeContainer: true
    });
    
    console.log('Canvas generated:', canvas.width, 'x', canvas.height);
    
    // Remove the temporary element
    document.body.removeChild(invoiceElement);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    console.log('PDF dimensions:', pdfWidth, 'x', pdfHeight);
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Download the PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

const createInvoiceElement = (invoice, company) => {
  const element = document.createElement('div');
  element.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-size: 12px;
    line-height: 1.4;
    color: #1e293b;
    position: absolute;
    top: -9999px;
    left: -9999px;
  `;
  
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const hasDescription = items.some((it) => !!it.description);
  const hasItemDiscount = items.some((it) => (parseFloat(it.discount) || 0) > 0);
  const subtotalVal = calculateSubtotal(items);
  const trnAmountVal = calculateTotalTRN(items);
  const packing = parseFloat(invoice.packingCharges) || 0;
  const freight = parseFloat(invoice.freightCharges) || 0;
  const loading = parseFloat(invoice.loadingCharges) || 0;
  const other = parseFloat(invoice.otherCharges) || 0;
  const additionalChargesVal = packing + freight + loading + other;
  const totalVal = calculateTotal(subtotalVal + additionalChargesVal, trnAmountVal);
  // Safe access helpers
  const safe = (v) => (v == null ? '' : v);
  const cust = invoice.customer || {};
  const custAddr = cust.address || {};
  const comp = company || {};
  const compAddr = comp.address || {};

  element.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
      <div style="flex: 1;">
        <div style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
          <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height: 48px; width: auto; object-fit: contain;" />
        </div>
        <div style="margin-top: 8px; line-height: 1.3;">
          ${company.bankDetails && (company.bankDetails.bankName || company.bankDetails.accountNumber) ? `
            <p style="margin: 0; font-size: 11px; color: #334155;"><strong>BANK NAME:</strong> ${company.bankDetails.bankName || 'Not specified'}</p>
            ${company.bankDetails.accountNumber ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">Account No: ${company.bankDetails.accountNumber}</p>` : ''}
            ${company.bankDetails.iban ? `<p style="margin: 0; font-size: 11px; color: #334155;">IBAN: ${company.bankDetails.iban}</p>` : ''}
          ` : `
            <p style="margin: 0; font-size: 11px; color: #334155;"><strong>BANK NAME:</strong> ULTIMATE STEEL AND</p>
            <p style="margin: 0; font-size: 11px; color: #334155;">BUILDING MATERIALS TRADING</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">Account No: 019101641144</p>
            <p style="margin: 0; font-size: 11px; color: #334155;">IBAN: AE490330000019101641144</p>
          `}
        </div>
      </div>
      
      <div style="text-align: left;">
        <div style="margin-bottom: 6px;">
          <p style="margin: 2px 0;">Ultimate Steels Building Materials Trading</p>
        </div>
        <div style="margin-bottom: 10px;">
          <p style="margin: 2px 0;">${safe(compAddr.street)}</p>
          <p style="margin: 2px 0;">${safe(compAddr.city)}${compAddr.emirate ? ', ' + compAddr.emirate : ''} ${compAddr.poBox || ''}</p>
          <p style="margin: 2px 0;">${safe(compAddr.country)}</p>
        </div>
        <div>
          <p style="margin: 2px 0;">Phone: ${safe(comp.phone)}</p>
          <p style="margin: 2px 0;">Email: ${safe(comp.email)}</p>
          <p style="margin: 2px 0;">TRN: ${safe(comp.vatNumber || comp.gstNumber)}</p>
        </div>
      </div>
    </div>

    <div style="width: 100%; background-color: #009999; color: #ffffff; text-align: center; margin: 10px 0 20px 0; padding: 15px 0;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">TAX INVOICE</h2>
    </div>

    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; align-items: flex-start;">
      <div style="flex: 0 0 40%; min-width: 0;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">Bill To:</h3>
        <div>
          <p style="margin: 2px 0; font-weight: 600;">${safe(cust.name)}</p>
          <p style="margin: 2px 0;">${safe(custAddr.street)}</p>
          <p style="margin: 2px 0;">${safe(custAddr.city)}</p>
          <p style="margin: 2px 0;">${safe(custAddr.country)}</p>
          ${(cust.vatNumber || cust.gstNumber) ? `<p style="margin: 2px 0;">TRN: ${safe(cust.vatNumber || cust.gstNumber)}</p>` : ''}
          <p style="margin: 2px 0;">Phone: ${safe(cust.phone)}</p>
          <p style="margin: 2px 0;">Email: ${safe(cust.email)}</p>
        </div>
      </div>
      <div style="flex: 0 0 40%; min-width: 0; text-align: left;">
        <h3 style="margin: 0 0 10px 0; color: #0f172a;">INVOICE</h3>
        <div>
          <p style="margin: 4px 0;"><strong>Invoice #:</strong> ${safe(invoice.invoiceNumber)}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
          <p style="margin: 4px 0; line-height: 1.5;"><strong>Status:</strong> <span style="color: #2563eb; text-transform: uppercase; font-weight: 600; display: inline-block; padding: 2px 8px; background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 4px; white-space: nowrap;">${safe(invoice.status)}</span></p>
          ${invoice.customerPurchaseOrderNumber ? `<p style="margin: 4px 0;"><strong>Customer PO #:</strong> ${safe(invoice.customerPurchaseOrderNumber)}</p>` : ''}
          ${invoice.customerPurchaseOrderDate ? `<p style="margin: 4px 0;"><strong>Customer PO Date:</strong> ${formatDate(invoice.customerPurchaseOrderDate)}</p>` : ''}
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #009999; color: #ffffff;">
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Product</th>
            ${hasDescription ? '<th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Description</th>' : ''}
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Unit</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Rate</th>
            ${hasItemDiscount ? '<th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Discount</th>' : ''}
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Amount</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">VAT %</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">VAT Amount</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const amountNum = parseFloat(item.amount) || 0;
            const vatRateNum = parseFloat(item.vatRate) || 0;
            const vatAmount = calculateTRN(amountNum, vatRateNum);
            const totalWithTRN = amountNum + vatAmount;
            const spec = [item.grade, item.finish, item.size, item.thickness].filter(Boolean).join(' | ');
            
            return `
              <tr>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">
                  <div style="font-weight:600;color:#0f172a;">${safe(item.name)}</div>
                  ${spec ? '<div style="font-size:10px;color:#64748b;">' + spec + '</div>' : ''}
                </td>
                ${hasDescription ? '<td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">' + (safe(item.description) || '-') + '</td>' : ''}
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${safe(item.unit) || 'kg'}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${safe(item.quantity)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(item.rate || 0)}</td>
                ${hasItemDiscount ? '<td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">' + (((parseFloat(item.discount)||0) > 0) ? (formatCurrency(item.discount) + (item.discountType === 'percentage' ? '%' : '')) : '-') + '</td>' : ''}
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(amountNum)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${vatRateNum}%</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(vatAmount)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">${formatCurrency(totalWithTRN)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <div style="min-width: 300px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotalVal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>VAT Amount:</span>
          <span>${formatCurrency(trnAmountVal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 1px solid #e2e8f0; margin-top: 8px; font-weight: 600; font-size: 14px;">
          <span><strong>Total Amount:</strong></span>
          <span><strong>${formatCurrency(totalVal)}</strong></span>
        </div>
      </div>
    </div>

    ${(invoice.notes || invoice.terms) ? `
      <div style="margin-bottom: 30px;">
        ${invoice.notes ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 5px 0; color: #1e293b;">Notes:</h4>
            <p style="margin: 0; color: #64748b;">${invoice.notes}</p>
          </div>
        ` : ''}
        ${invoice.terms ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 5px 0; color: #1e293b;">Payment as per payment terms:</h4>
            <p style="margin: 0; color: #64748b;">${invoice.terms}</p>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="display: flex; justify-content: flex-end; margin-top: 50px;">
      <div style="display: flex; align-items: flex-end; gap: 20px;">
        <img src="${sealImage}" alt="Company Seal" crossorigin="anonymous" style="height: 180px; width: auto; object-fit: contain; opacity: 0.95;" />
        <div style="text-align: center; min-width: 200px;">
          <p style="margin: 0;">Authorized Signatory</p>
          <div style="border-bottom: 1px solid #000; margin: 40px 0 10px 0;"></div>
          <p style="margin: 0; font-weight: 600;">ULTIMATE STEELS</p>
        </div>
      </div>
    </div>
  `;
  
  return element;
};

// Wait for all images within a container to load (or error) before rendering
const waitForImages = (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map((img) => {
      return new Promise((resolve) => {
        // If already complete, resolve immediately
        if (img.complete && img.naturalWidth !== 0) return resolve();
        // Set crossOrigin for safety
        try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch (_) {}
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );
};
