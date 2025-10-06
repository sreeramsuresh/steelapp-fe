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
    
    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
  
  const subtotalVal = calculateSubtotal(invoice.items || []);
  const trnAmountVal = calculateTotalTRN(invoice.items || []);
  const packing = parseFloat(invoice.packingCharges) || 0;
  const freight = parseFloat(invoice.freightCharges) || 0;
  const loading = parseFloat(invoice.loadingCharges) || 0;
  const other = parseFloat(invoice.otherCharges) || 0;
  const additionalChargesVal = packing + freight + loading + other;
  const totalVal = calculateTotal(subtotalVal + additionalChargesVal, trnAmountVal);

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
          <p style="margin: 2px 0;">${company.address.street}</p>
          <p style="margin: 2px 0;">${company.address.city}${company.address.emirate ? ', ' + company.address.emirate : ''} ${company.address.poBox || ''}</p>
          <p style="margin: 2px 0;">${company.address.country}</p>
        </div>
        <div>
          <p style="margin: 2px 0;">Phone: ${company.phone}</p>
          <p style="margin: 2px 0;">Email: ${company.email}</p>
          <p style="margin: 2px 0;">TRN: ${company.gstNumber || company.vatNumber || ''}</p>
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
          <p style="margin: 2px 0; font-weight: 600;">${invoice.customer.name}</p>
          <p style="margin: 2px 0;">${invoice.customer.address.street}</p>
          <p style="margin: 2px 0;">${invoice.customer.address.city}</p>
          <p style="margin: 2px 0;">${invoice.customer.address.country}</p>
          ${invoice.customer.gstNumber ? `<p style="margin: 2px 0;">TRN: ${invoice.customer.gstNumber}</p>` : ''}
          <p style="margin: 2px 0;">Phone: ${invoice.customer.phone}</p>
          <p style="margin: 2px 0;">Email: ${invoice.customer.email}</p>
        </div>
      </div>
      <div style="flex: 0 0 40%; min-width: 0; text-align: left;">
        <h3 style="margin: 0 0 10px 0; color: #0f172a;">INVOICE</h3>
        <div>
          <p style="margin: 4px 0;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
          <p style="margin: 4px 0; line-height: 1.5;"><strong>Status:</strong> <span style="color: #2563eb; text-transform: uppercase; font-weight: 600; display: inline-block; padding: 2px 8px; background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 4px; white-space: nowrap;">${invoice.status}</span></p>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #009999; color: #ffffff;">
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Item Description</th>
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Specification</th>
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Unit</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Rate</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Amount</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">VAT %</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">VAT Amount</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff; background-color: #009999;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => {
            const vatAmount = calculateTRN(item.amount, item.vatRate);
            const totalWithTRN = item.amount + vatAmount;
            
            return `
              <tr>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.name}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.specification}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.unit}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(item.rate)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(item.amount)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${item.vatRate}%</td>
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
            <h4 style="margin: 0 0 5px 0; color: #1e293b;">Terms & Conditions:</h4>
            <p style="margin: 0 0 6px 0; color: #64748b;">${invoice.terms}</p>
            <p style="margin: 0 0 4px 0; color: #64748b;">Kindly check the product before unloading</p>
            <p style="margin: 0; color: #64748b;">If any complaint arises, contact us immediately</p>
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
