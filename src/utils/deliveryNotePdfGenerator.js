import { formatDate, getCompanyImages } from './invoiceUtils';
import { escapeHtml } from './htmlEscape';

export const generateDeliveryNotePDF = async (deliveryNote, company) => {
  try {
    const { jsPDF } = await import('jspdf');
    // Get company images from company profile
    const { logoUrl, sealUrl } = getCompanyImages(company);
    const el = createDNElement(deliveryNote, company, logoUrl, sealUrl);
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

    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','mm','a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(img, 'PNG', 0, 0, pdfW, pdfH);
    const fname = `DeliveryNote-${deliveryNote.delivery_note_number || deliveryNote.id}.pdf`;
    pdf.save(fname);
    return true;
  } catch (e) {
    console.error('Delivery Note PDF generation failed:', e);
    throw e;
  }
};

const createDNElement = (dn, company, logoCompany, sealImage) => {
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
  const cust = dn.customer_details || {};
  const custAddr = (cust.address) || {};
  const items = Array.isArray(dn.items) ? dn.items : [];

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
          <p style="margin:2px 0;">${safe(cust.name) || 'Customer'}</p>
        </div>
        <div style="margin-bottom:10px;">
          <p style="margin:2px 0;">${safe(custAddr.street || dn.delivery_address?.street || '')}</p>
          <p style="margin:2px 0;">${safe(custAddr.city || dn.delivery_address?.city || '')} ${safe(custAddr.poBox || dn.delivery_address?.po_box || '')}</p>
          <p style="margin:2px 0;"><strong>Delivery Note #:</strong> ${safe(dn.delivery_note_number || dn.id)}</p>
          <p style="margin:2px 0;"><strong>Invoice #:</strong> ${safe(dn.invoice_number || '')}</p>
          <p style="margin:2px 0;"><strong>Date:</strong> ${formatDate(dn.delivery_date || dn.created_at || new Date())}</p>
          ${dn.status ? `<p style=\"margin:2px 0; line-height:1.5;\"><strong>Status:</strong> <span style=\"color:#2563eb; text-transform:uppercase; font-weight:600; display:inline-block; padding:2px 8px; background-color:#eff6ff; border:1px solid #2563eb; border-radius:4px; white-space:nowrap;\">${safe(dn.status)}</span></p>` : ''}
        </div>
      </div>
    </div>

    <div style="width: 100%; background-color: #009999; color: #ffffff; text-align: center; margin: 10px 0 20px 0; padding: 15px 0;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">DELIVERY NOTE</h2>
    </div>

    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #009999; color: #ffffff;">
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600;">Product</th>
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600;">Specification</th>
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600;">Unit</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600;">Ordered</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600;">Delivered</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600;">Remaining</th>
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">
                <div style="font-weight:600;color:#0f172a;">${safe(item.name)}</div>
              </td>
              <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${safe(item.specification) || '-'}</td>
              <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${safe(item.unit) || ''}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${safe(item.ordered_quantity)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${safe(item.delivered_quantity)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight:600;">${safe(item.remaining_quantity)}</td>
              <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">${item.is_fully_delivered ? 'Complete' : 'Partial'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${dn.notes ? `
      <div style="margin-bottom: 30px;">
        <h4 style="margin: 0 0 5px 0; color: #1e293b;">Notes:</h4>
        <p style="margin: 0; color: #64748b;">${escapeHtml(dn.notes)}</p>
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
    try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch {}
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  })));
};

