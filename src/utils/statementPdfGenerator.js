import { formatCurrency, formatDate, getCompanyImages } from './invoiceUtils';

export const generateStatementPDF = async ({ customerName, periodStart, periodEnd, items, company }) => {
  try {
    const { jsPDF } = await import('jspdf');

    // Get company images from company profile
    const { logoUrl, sealUrl } = getCompanyImages(company);
    const element = createStatementElement({ customerName, periodStart, periodEnd, items, company, logoUrl, sealUrl });
    document.body.appendChild(element);

    await waitForImages(element);
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
    });

    document.body.removeChild(element);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','mm','a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const fname = `Statement-${(customerName || 'Customer').replace(/[\\/:*?"<>|]/g,'_')}-${periodStart || ''}_to_${periodEnd || ''}.pdf`;
    pdf.save(fname);
    return true;
  } catch (e) {
    console.error('Error generating Statement PDF:', e);
    throw e;
  }
};

const createStatementElement = ({ customerName, periodStart, periodEnd, items = [], company = {}, logoUrl: logoCompany, sealUrl: sealImage }) => {
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

  const totalInvoiced = items.reduce((s, r) => s + (parseFloat(r.invoiceAmount) || 0), 0);
  const totalReceived = items.reduce((s, r) => s + (parseFloat(r.received) || 0), 0);
  const totalOutstanding = items.reduce((s, r) => s + (parseFloat(r.outstanding) || 0), 0);

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #e2e8f0;">
      <div style="flex:1;">
        <div style="margin:0 0 10px 0; display:flex; align-items:center; gap:10px;">
          <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height:48px; width:auto; object-fit:contain;" />
        </div>
        <div style="margin-top:8px; line-height:1.3;">
          <p style="margin:0; font-size:11px; color:#334155;"><strong>${safe(comp.name) || 'Company'}</strong></p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.street)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.city)}${compAddr.emirate ? ', ' + compAddr.emirate : ''} ${compAddr.poBox || ''}</p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.country)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">Phone: ${safe(comp.phone)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">Email: ${safe(comp.email)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">TRN: ${safe(comp.vatNumber)}</p>
        </div>
      </div>

      <div style="text-align:left;">
        <div style="margin-bottom:6px;">
          <p style="margin:2px 0;">${safe(customerName) || 'Customer'}</p>
        </div>
        <div style="margin-bottom:10px;">
          <p style="margin:2px 0;"><strong>Period:</strong> ${formatDate(periodStart)} - ${formatDate(periodEnd)}</p>
          <p style="margin:2px 0;"><strong>Generated:</strong> ${formatDate(new Date())}</p>
        </div>
      </div>
    </div>

    <div style="width:100%; border-top:2px solid #000; border-bottom:2px solid #000; text-align:center; margin:10px 0 20px 0; padding:15px 0;">
      <h2 style="margin:0; font-size:20px; font-weight:700; letter-spacing:0.5px; color:#000;">ACCOUNT STATEMENT</h2>
    </div>

    <div style="margin-bottom:20px; display:flex; gap:16px;">
      <div style="flex:1; padding:12px; border:1px solid #000;">
        <div style="font-size:11px; color:#000; font-weight:600;">Opening Balance:</div>
        <div style="font-size:14px; font-weight:700; color:#000;">${formatCurrency(items[0]?.openingBalance || 0)}</div>
      </div>
      <div style="flex:1; padding:12px; border:1px solid #000;">
        <div style="font-size:11px; color:#000; font-weight:600;">Total Invoiced:</div>
        <div style="font-size:14px; font-weight:700; color:#000;">${formatCurrency(totalInvoiced)}</div>
      </div>
      <div style="flex:1; padding:12px; border:1px solid #000;">
        <div style="font-size:11px; color:#000; font-weight:600;">Total Paid:</div>
        <div style="font-size:14px; font-weight:700; color:#000;">${formatCurrency(totalReceived)}</div>
      </div>
      <div style="flex:1; padding:12px; border:1px solid #000;">
        <div style="font-size:11px; color:#000; font-weight:600;">Closing Balance:</div>
        <div style="font-size:14px; font-weight:700; color:#000;">${formatCurrency(totalOutstanding)}</div>
      </div>
    </div>

    <div style="margin-bottom:30px;">
      <table style="width:100%; border-collapse:collapse; font-size:10px;">
        <thead>
          <tr style="background-color:#f5f5f5; color:#000;">
            <th style="padding:8px 6px; text-align:left; border:1px solid #000; font-weight:600;">Date</th>
            <th style="padding:8px 6px; text-align:left; border:1px solid #000; font-weight:600;">Type</th>
            <th style="padding:8px 6px; text-align:left; border:1px solid #000; font-weight:600;">Reference</th>
            <th style="padding:8px 6px; text-align:left; border:1px solid #000; font-weight:600;">Description</th>
            <th style="padding:8px 6px; text-align:right; border:1px solid #000; font-weight:600;">Debit</th>
            <th style="padding:8px 6px; text-align:right; border:1px solid #000; font-weight:600;">Credit</th>
            <th style="padding:8px 6px; text-align:right; border:1px solid #000; font-weight:600;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((r, idx) => {
            const debit = parseFloat(r.invoiceAmount) || 0;
            const credit = parseFloat(r.received) || 0;
            return `
            <tr ${idx % 2 === 0 ? 'style="background-color:#fafafa;"' : ''}>
              <td style="padding:6px; text-align:left; border:1px solid #ccc;">${formatDate(r.invoiceDate || r.date)}</td>
              <td style="padding:6px; text-align:left; border:1px solid #ccc;">${debit > 0 ? 'Invoice' : 'Payment'}</td>
              <td style="padding:6px; text-align:left; border:1px solid #ccc;">${safe(r.invoiceNo || r.invoiceNumber)}</td>
              <td style="padding:6px; text-align:left; border:1px solid #ccc;">${safe(r.description || 'Invoice ' + (r.invoiceNo || r.invoiceNumber))}</td>
              <td style="padding:6px; text-align:right; border:1px solid #ccc;">${debit > 0 ? formatCurrency(debit) : '-'}</td>
              <td style="padding:6px; text-align:right; border:1px solid #ccc;">${credit > 0 ? formatCurrency(credit) : '-'}</td>
              <td style="padding:6px; text-align:right; border:1px solid #ccc; font-weight:600;">${formatCurrency(r.outstanding || 0)}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top:60px; border-top:1px solid #ccc; padding-top:20px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div style="flex:1;">
          <p style="margin:0; font-size:10px; color:#666;">Generated on ${formatDate(new Date())}</p>
          <p style="margin:4px 0 0 0; font-size:9px; color:#999;">This is a computer-generated statement and does not require a signature.</p>
        </div>
        <div style="text-align:center; min-width:180px;">
          <div style="border-bottom:1px solid #000; margin:0 0 8px 0; width:150px; margin-left:auto;"></div>
          <p style="margin:0; font-size:10px; font-weight:600;">Authorized Signatory</p>
          <p style="margin:2px 0 0 0; font-size:10px; font-weight:600;">${safe(comp.name) || 'Company'}</p>
        </div>
      </div>
    </div>
  `;
  return el;
};

const waitForImages = (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();
  return Promise.all(images.map(img => new Promise((resolve) => {
    if (img.complete && img.naturalWidth !== 0) return resolve();
    try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch {
      // Ignore - crossOrigin may be read-only on some browsers
    }
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  })));
};

