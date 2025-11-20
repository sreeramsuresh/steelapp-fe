import { formatCurrency, formatDate, calculateTRN, getCompanyImages } from './invoiceUtils';
import { escapeHtml, escapeHtmlWithLineBreaks } from './htmlEscape';

export const generateQuotationPDF = async (quotation, company) => {
  try {
    const { jsPDF } = await import('jspdf');
    // Get company images from company profile
    const { logoUrl, sealUrl } = getCompanyImages(company);
    const el = createQuotationElement(quotation, company, logoUrl, sealUrl);
    document.body.appendChild(el);

    await waitForImages(el);
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
    });
    document.body.removeChild(el);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${quotation.quotationNumber || 'Quotation'}.pdf`);
    return true;
  } catch (e) {
    console.error('Quotation PDF generation failed:', e);
    throw e;
  }
};

const createQuotationElement = (q, company, logoCompany, sealImage) => {
  const el = document.createElement('div');
  el.style.cssText = `
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

  const safe = (v) => (v === null || v === undefined ? '' : v);
  const comp = company || {};
  const compAddr = comp.address || {};
  const cust = q.customerDetails || {};
  const custAddr = cust.address || {};
  const items = Array.isArray(q.items) ? q.items : [];
  const hasDescription = items.some((it) => !!it.description);
  const hasItemDiscount = items.some((it) => (parseFloat(it.discount) || 0) > 0);

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const gstAmount = items.reduce((s, it) => s + calculateTRN((parseFloat(it.amount) || 0), (parseFloat(it.vatRate) || 0)), 0);
  const total = subtotal + gstAmount + (parseFloat(q.otherCharges) || 0);

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #e2e8f0;">
      <div style="flex:1;">
        <div style="margin:0 0 10px 0; display:flex; align-items:center; gap:10px;">
          <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height:48px; width:auto; object-fit:contain;" />
        </div>
        <div style="margin-top:8px; line-height:1.3;">
          <p style="margin:0; font-size:11px; color:#334155;"><strong>${safe(comp.name) || 'Company'}</strong></p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.street)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.city)}${compAddr.emirate ? `, ${  compAddr.emirate}` : ''} ${compAddr.poBox || ''}</p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.country)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">Phone: ${safe(comp.phone)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">Email: ${safe(comp.email)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">TRN: ${safe(comp.vatNumber)}</p>
        </div>
      </div>

      <div style="text-align:left;">
        <div style="margin-bottom:6px;">
          <p style="margin:2px 0;">${safe(cust.name) || 'Customer'}</p>
        </div>
        <div style="margin-bottom:10px;">
          <p style="margin:2px 0;"><strong>Quotation #:</strong> ${safe(q.quotationNumber)}</p>
          <p style="margin:2px 0;"><strong>Date:</strong> ${formatDate(q.quotationDate)}</p>
          ${q.validUntil ? `<p style=\"margin:2px 0;\"><strong>Valid Until:</strong> ${formatDate(q.validUntil)}</p>` : ''}
          ${q.status ? `<p style=\"margin:2px 0; line-height:1.5;\"><strong>Status:</strong> <span style=\"color:#2563eb; text-transform:uppercase; font-weight:600; display:inline-block; padding:2px 8px; background-color:#eff6ff; border:1px solid #2563eb; border-radius:4px; white-space:nowrap;\">${safe(q.status)}</span></p>` : ''}
        </div>
      </div>
    </div>

    <div style="width:100%; background-color:#009999; color:#ffffff; text-align:center; margin:10px 0 20px 0; padding:15px 0;">
      <h2 style="margin:0; font-size:20px; font-weight:700; letter-spacing:0.5px; color:#ffffff;">QUOTATION</h2>
    </div>

    <div style="margin-bottom:30px;">
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="background-color:#009999; color:#ffffff;">
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Product</th>
            ${hasDescription ? '<th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Description</th>' : ''}
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Unit</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Qty</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Rate</th>
            ${hasItemDiscount ? '<th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Discount</th>' : ''}
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Amount</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">VAT %</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">VAT Amount</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it) => {
    const amountNum = parseFloat(it.amount) || 0;
    const gstRateNum = parseFloat(it.vatRate) || 0;
    const gstAmt = calculateTRN(amountNum, gstRateNum);
    const totalWithTax = amountNum + gstAmt;
    const spec = (it.specification && String(it.specification).trim()) || [it.grade, it.finish, it.size, it.thickness].filter(Boolean).join(' | ');
    return `
              <tr>
                <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">
                  <div style="font-weight:600;color:#0f172a;">${safe(it.name)}</div>
                  ${spec ? `<div style="font-size:10px;color:#64748b;">${  safe(spec)  }</div>` : ''}
                </td>
                ${hasDescription ? `<td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${  safe(it.description) || '-'  }</td>` : ''}
                <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${safe(it.unit) || 'pcs'}</td>
                <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${safe(it.quantity)}</td>
                <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${formatCurrency(it.rate || 0)}</td>
                ${hasItemDiscount ? `<td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${  ((parseFloat(it.discount)||0) > 0) ? (formatCurrency(it.discount) + (it.discountType === 'percentage' ? '%' : '')) : '-'  }</td>` : ''}
                <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${formatCurrency(amountNum)}</td>
                <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${gstRateNum}%</td>
                <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${formatCurrency(gstAmt)}</td>
                <td style="padding:8px; text-align:right; border:1px solid #e2e8f0; font-weight:600;">${formatCurrency(totalWithTax)}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-bottom:30px;">
      <div style="min-width:300px;">
        <div style="display:flex; justify-content:space-between; padding:8px 0;">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0;">
          <span>VAT Amount:</span>
          <span>${formatCurrency(gstAmount)}</span>
        </div>
        ${(parseFloat(q.otherCharges)||0) ? `
        <div style=\"display:flex; justify-content:space-between; padding:8px 0;\">
          <span>Other Charges:</span>
          <span>${formatCurrency(parseFloat(q.otherCharges)||0)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; padding:16px 0; border-top:1px solid #e2e8f0; margin-top:8px; font-weight:600; font-size:14px;">
          <span><strong>Total Amount:</strong></span>
          <span><strong>${formatCurrency(total)}</strong></span>
        </div>
      </div>
    </div>

    ${(q.notes || q.termsAndConditions) ? `
      <div style="margin-bottom:30px;">
        ${q.notes ? `
          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 5px 0; color:#1e293b;">Notes:</h4>
            <p style="margin:0; color:#64748b;">${escapeHtml(q.notes)}</p>
          </div>
        ` : ''}
        ${q.termsAndConditions ? `
          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 5px 0; color:#1e293b;">Terms & Conditions:</h4>
            <p style="margin:0; color:#64748b;">${escapeHtmlWithLineBreaks(q.termsAndConditions)}</p>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="display:flex; justify-content:flex-end; margin-top:50px;">
      <div style="display:flex; align-items:flex-end; gap:20px;">
        <img src="${sealImage}" alt="Company Seal" crossorigin="anonymous" style="height:160px; width:auto; object-fit:contain; opacity:0.95;" />
        <div style="text-align:center; min-width:200px;">
          <p style="margin:0;">Authorized Signatory</p>
          <div style="border-bottom:1px solid #000; margin:40px 0 10px 0;"></div>
          <p style="margin:0; font-weight:600;">${safe(comp.name) || 'Company'}</p>
        </div>
      </div>
    </div>
  `;

  return el;
};

const waitForImages = (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();
  return Promise.all(images.map((img) => new Promise((resolve) => {
    if (img.complete && img.naturalWidth !== 0) return resolve();
    try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch {
      // Ignore - crossOrigin may be read-only on some browsers
    }
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  })));
};
