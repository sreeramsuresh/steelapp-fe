Invoice PDF Pagination (Measurement-Based)

This implementation uses jsPDF to render A4 portrait invoices with dynamic measurement of header, table header, and footer to compute a variable content frame for items.

Page Setup
- Page: A4 portrait (210 × 297 mm)
- Base margins: top = 20 mm, bottom = 25 mm, left = 15 mm, right = 15 mm

Auto-Measurement
- Header and table header are rendered using jsPDF primitives; heights are measured/approximated via font metrics and fixed paddings. We compute:
  topBoundaryY = baseTopMargin + headerHeight + tableHeaderHeight
- Footer (seal box + signatory) height is measured/approximated. We compute:
  bottomBoundaryY = pageHeight − baseBottomMargin − footerHeight
- Frame for items:
  x = leftMargin
  y = topBoundaryY
  width = pageWidth − leftMargin − rightMargin
  height = bottomBoundaryY − topBoundaryY

Pagination
- Items render sequentially inside frame height. We measure each row by splitting the description text and computing row height. Rows never split; if a row doesn’t fit, we start a new page.
- Header + table header + footer repeat on each page.
- Non-final pages print “Items continue on next page.” near the footer.
- Totals (Subtotal, VAT, Total) render only on the final page above the footer with a divider.
- Page numbering “Page X of Y” appears in the footer of every page.

Visuals
- Columns: Description | Qty | Rate | Amount.
- 11 pt fonts; bold used for headers; light gray dividers.
- Footer contains a boxed area for stamp/seal on every page.

Usage
- The InvoicePreview download button calls generateInvoicePDF(invoice, company).
- To generate multi‑page demos, create an invoice with many items (e.g., 2 pages ≈ 15 items; 10 pages ≈ 110 items) and click Download.

Adjustments
- Row heights depend on description wrapping; adjust perPage by adding/removing item text. No code changes needed for header/footer edits, as the frame is recomputed based on measured heights.

