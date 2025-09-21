import { formatCurrency, formatDate, calculateTRN } from './invoiceUtils';
import logoCompany from '../assets/logocompany.png';
import sealImage from '../assets/Seal.png';

export const generateInvoicePDF = async (invoice, company) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    // Create a temporary DOM element for the invoice
    const invoiceElement = createInvoiceElement(invoice, company);
    document.body.appendChild(invoiceElement);
    // Ensure images inside the element are loaded before rendering
    await waitForImages(invoiceElement);

    // Import html2canvas dynamically
    const html2canvas = (await import('html2canvas')).default;
    
    // Generate canvas from the element
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Remove the temporary element
    document.body.removeChild(invoiceElement);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Download the PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
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
  
  element.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
      <div style="flex: 1;">
        <div style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
          <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height: 48px; width: auto; object-fit: contain;" />
        </div>
        <div style="margin-bottom: 10px;">
          <p style="margin: 2px 0; font-weight: 700; font-size: 14px; color: #0f172a;">Ultimate Steels Building Materials Trading</p>
          <p style="margin: 2px 0;">${company.address.street}</p>
          <p style="margin: 2px 0;">${company.address.city}</p>
          <p style="margin: 2px 0;">${company.address.country}</p>
        </div>
        <div>
          <p style="margin: 2px 0;">Phone: ${company.phone}</p>
          <p style="margin: 2px 0;">Email: ${company.email}</p>
          <p style="margin: 2px 0;">TRN: ${company.gstNumber}</p>
        </div>
      </div>
      
      <div style="text-align: right;">
        <h2 style="margin: 0 0 10px 0; color: #2563eb; font-size: 32px; font-weight: 700;">INVOICE</h2>
        <div>
          <p style="margin: 4px 0;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #2563eb; text-transform: uppercase; font-weight: 600;">${invoice.status}</span></p>
        </div>
      </div>
    </div>

    <div style="width: 100%; background: #009999; color: #ffffff; text-align: center; margin: 10px 0 20px 0; padding: 10px 0;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">TAX INVOICE</h2>
    </div>

    <div style="margin-bottom: 30px;">
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

    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #009999; color: #ffffff;">
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Item Description</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Specification</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Unit</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Qty</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Rate</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Amount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">TRN %</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">TRN Amount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; color: #ffffff;">Total</th>
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
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>TRN Amount:</span>
          <span>${formatCurrency(invoice.vatAmount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 1px solid #e2e8f0; margin-top: 8px; font-weight: 600; font-size: 14px;">
          <span><strong>Total Amount:</strong></span>
          <span><strong>${formatCurrency(invoice.total)}</strong></span>
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
          <div style=\"margin-bottom: 15px;\">
            <h4 style=\"margin: 0 0 5px 0; color: #1e293b;\">Terms & Conditions:</h4>
            <p style=\"margin: 0 0 6px 0; color: #64748b;\">${invoice.terms}</p>
            <p style=\"margin: 0 0 4px 0; color: #64748b;\">Kindly check the product before unloading</p>
            <p style=\"margin: 0; color: #64748b;\">If any complaint arises, contact us immediatel</p>
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
