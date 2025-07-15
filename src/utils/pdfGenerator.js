import { formatCurrency, formatDate, calculateVAT } from './invoiceUtils';

export const generateInvoicePDF = async (invoice, company) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    // Create a temporary DOM element for the invoice
    const invoiceElement = createInvoiceElement(invoice, company);
    document.body.appendChild(invoiceElement);
    
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
        <h1 style="margin: 0 0 10px 0; color: #1e293b; font-size: 24px; font-weight: 700;">${company.name}</h1>
        <div style="margin-bottom: 10px;">
          <p style="margin: 2px 0;">${company.address.street}</p>
          <p style="margin: 2px 0;">${company.address.city}, ${company.address.state} ${company.address.zipCode}</p>
          <p style="margin: 2px 0;">${company.address.country}</p>
        </div>
        <div>
          <p style="margin: 2px 0;">Phone: ${company.phone}</p>
          <p style="margin: 2px 0;">Email: ${company.email}</p>
          <p style="margin: 2px 0;">VAT: ${company.gstNumber}</p>
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

    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 10px 0; color: #1e293b;">Bill To:</h3>
      <div>
        <p style="margin: 2px 0; font-weight: 600;">${invoice.customer.name}</p>
        <p style="margin: 2px 0;">${invoice.customer.address.street}</p>
        <p style="margin: 2px 0;">${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.zipCode}</p>
        <p style="margin: 2px 0;">${invoice.customer.address.country}</p>
        ${invoice.customer.gstNumber ? `<p style="margin: 2px 0;">VAT: ${invoice.customer.gstNumber}</p>` : ''}
        <p style="margin: 2px 0;">Phone: ${invoice.customer.phone}</p>
        <p style="margin: 2px 0;">Email: ${invoice.customer.email}</p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">Item Description</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">Specification</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">HSN Code</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">Unit</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">Qty</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">Rate</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">Amount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">VAT %</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">VAT Amount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => {
            const vatAmount = calculateVAT(item.amount, item.vatRate);
            const totalWithVAT = item.amount + vatAmount;
            
            return `
              <tr>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.name}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.specification}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.hsnCode}</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.unit}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(item.rate)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(item.amount)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${item.vatRate}%</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(vatAmount)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">${formatCurrency(totalWithVAT)}</td>
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
          <span>VAT Amount:</span>
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
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 5px 0; color: #1e293b;">Terms & Conditions:</h4>
            <p style="margin: 0; color: #64748b;">${invoice.terms}</p>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="display: flex; justify-content: flex-end; margin-top: 50px;">
      <div style="text-align: center; min-width: 200px;">
        <p style="margin: 0;">Authorized Signatory</p>
        <div style="border-bottom: 1px solid #000; margin: 40px 0 10px 0;"></div>
        <p style="margin: 0; font-weight: 600;">${company.name}</p>
      </div>
    </div>
  `;
  
  return element;
};