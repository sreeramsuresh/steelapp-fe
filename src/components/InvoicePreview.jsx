import React from "react";
import logoCompany from "../assets/logocompany.png";
import seal from "../assets/Seal.png";
import { X, Download } from "lucide-react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import {
  formatCurrency,
  formatDate,
  calculateTRN,
} from "../utils/invoiceUtils";

const InvoicePreview = ({ invoice, company, onClose }) => {
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("invoice-preview");
      if (!element) return;

      // Ensure any images (like logo) are loaded before rendering
      const waitForImages = async (container) => {
        const imgs = Array.from(container.querySelectorAll('img'));
        if (imgs.length === 0) return;
        await Promise.all(
          imgs.map((img) => new Promise((resolve) => {
            if (img.complete && img.naturalWidth !== 0) return resolve();
            try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch (_) {}
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }))
        );
      };

      // Store original styles
      const originalStyles = element.style.cssText;
      
      // Apply light mode styles temporarily for PDF generation
      element.style.cssText = `
        ${originalStyles}
        background-color: #ffffff !important;
        color: #000000 !important;
      `;
      
      // Apply light mode styles to all child elements
      const allElements = element.querySelectorAll('*');
      const originalElementStyles = [];
      
      allElements.forEach((el, index) => {
        originalElementStyles[index] = el.style.cssText;
        
        // Force light mode colors
        el.style.cssText = `
          ${el.style.cssText}
          color: #000000 !important;
          background-color: transparent !important;
          border-color: #e0e0e0 !important;
        `;
        
        // Special handling for specific elements
        if (el.classList.contains('MuiTableHead-root') || el.closest('.MuiTableHead-root')) {
          el.style.backgroundColor = '#f5f5f5 !important';
        }
        
        if (el.classList.contains('MuiCard-root') || el.classList.contains('MuiPaper-root')) {
          el.style.backgroundColor = '#ffffff !important';
          el.style.borderColor = '#e0e0e0 !important';
        }
        
        if (el.classList.contains('MuiChip-root')) {
          el.style.backgroundColor = '#e3f2fd !important';
          el.style.color = '#1976d2 !important';
        }
      });

      await waitForImages(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Restore original styles
      element.style.cssText = originalStyles;
      allElements.forEach((el, index) => {
        el.style.cssText = originalElementStyles[index];
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "90vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Invoice Preview</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={handleDownloadPDF}
              variant="contained"
              startIcon={<Download size={18} />}
            >
              Download PDF
            </Button>
            <Button
              onClick={onClose}
              variant="outlined"
              startIcon={<X size={18} />}
            >
              Close
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box id="invoice-preview" sx={{ p: 3, bgcolor: "background.paper" }}>
          {/* Invoice Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <Box>
              {/* Company Logo (fallbacks to name if logo fails) */}
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <img
                  src={company?.logo_url || logoCompany}
                  alt={company?.name || 'Company Logo'}
                  crossOrigin="anonymous"
                  style={{ maxHeight: 48, width: 'auto', objectFit: 'contain' }}
                  onError={(e) => {
                    // If custom URL fails, fallback to text
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* If logo hidden due to error, show name */}
                <noscript>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {company?.name}
                  </Typography>
                </noscript>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                Ultimate Steels Building Materials Trading
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {company.address?.street}
                </Typography>
                <Typography variant="body2">
                  {company.address?.city}, {company.address?.emirate}{" "}
                  {company.address?.poBox}
                </Typography>
                <Typography variant="body2">
                  {company.address?.country}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">Phone: {company.phone}</Typography>
                <Typography variant="body2">Email: {company.email}</Typography>
                <Typography variant="body2">
                  TRN: {company.vatNumber}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
                INVOICE
              </Typography>
              <Box>
                <Typography variant="body1">
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {formatDate(invoice.date)}
                </Typography>
                <Typography variant="body1">
                  <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body1" component="span">
                    <strong>Status:</strong>
                  </Typography>
                  <Chip
                    label={invoice.status.toUpperCase()}
                    color={
                      invoice.status === "paid"
                        ? "success"
                        : invoice.status === "draft"
                        ? "default"
                        : "warning"
                    }
                    size="small"
                  />
                </Box>
                {invoice.purchaseOrderNumber && (
                  <Typography variant="body1">
                    <strong>PO #:</strong> {invoice.purchaseOrderNumber}
                  </Typography>
                )}
                {invoice.deliveryNote && (
                  <Typography variant="body1">
                    <strong>Delivery Note:</strong> {invoice.deliveryNote}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Full-width Heading Bar */}
          <Box sx={{ width: '100%', bgcolor: '#009999', color: '#fff', display: 'flex', justifyContent: 'center', mb: 3, py: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#fff' }}>
              TAX INVOICE
            </Typography>
          </Box>

          {/* Bill To Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Bill To:
            </Typography>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                {invoice.customer.name}
              </Typography>
              <Typography variant="body2">
                {invoice.customer.address?.street}
              </Typography>
              <Typography variant="body2">
                {invoice.customer.address?.city},{" "}
                {invoice.customer.address?.emirate}{" "}
                {invoice.customer.address?.poBox}
              </Typography>
              <Typography variant="body2">
                {invoice.customer.address?.country}
              </Typography>
              {invoice.customer.vatNumber && (
                <Typography variant="body2">
                  TRN: {invoice.customer.vatNumber}
                </Typography>
              )}
              <Typography variant="body2">
                Phone: {invoice.customer.phone}
              </Typography>
              <Typography variant="body2">
                Email: {invoice.customer.email}
              </Typography>
            </Card>
          </Box>

          {/* Transport Details */}
          {(invoice.despatchedThrough ||
            invoice.destination ||
            invoice.termsOfDelivery ||
            invoice.modeOfPayment) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Transport & Delivery Details:
              </Typography>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {invoice.despatchedThrough && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Despatched Through:</strong>{" "}
                        {invoice.despatchedThrough}
                      </Typography>
                    </Grid>
                  )}
                  {invoice.destination && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Destination:</strong> {invoice.destination}
                      </Typography>
                    </Grid>
                  )}
                  {invoice.termsOfDelivery && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Terms of Delivery:</strong>{" "}
                        {invoice.termsOfDelivery}
                      </Typography>
                    </Grid>
                  )}
                  {invoice.modeOfPayment && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Mode of Payment:</strong>{" "}
                        {invoice.modeOfPayment}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Card>
            </Box>
          )}

          {/* Invoice Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableHead sx={{ '& .MuiTableCell-root': { color: '#ffffff' } }}>
                <TableRow sx={{ bgcolor: '#009999' }}>
                  <TableCell>
                    <strong>Item Description</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Specification</strong>
                  </TableCell>
                  {invoice.items.some((item) => item.description) && (
                    <TableCell>
                      <strong>Description</strong>
                    </TableCell>
                  )}
                  <TableCell>
                    <strong>Grade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Unit</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Qty</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Rate</strong>
                  </TableCell>
                  {invoice.items.some((item) => item.discount > 0) && (
                    <TableCell align="right">
                      <strong>Discount</strong>
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>TRN %</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>TRN Amount</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Total</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items.map((item, index) => {
                  const vatAmount = calculateTRN(item.amount, item.vatRate);
                  const totalWithTRN = item.amount + vatAmount;

                  return (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.specification}</TableCell>
                      {invoice.items.some((item) => item.description) && (
                        <TableCell>{item.description || "-"}</TableCell>
                      )}
                      <TableCell>{item.grade || "-"}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.rate)}
                      </TableCell>
                      {invoice.items.some((item) => item.discount > 0) && (
                        <TableCell align="right">
                          {item.discount > 0
                            ? `${formatCurrency(item.discount)}${
                                item.discountType === "percentage" ? "%" : ""
                              }`
                            : "-"}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell align="right">{item.vatRate}%</TableCell>
                      <TableCell align="right">
                        {formatCurrency(vatAmount)}
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(totalWithTRN)}</strong>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Invoice Summary */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 4 }}>
            <Card variant="outlined" sx={{ minWidth: 350 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">
                    {formatCurrency(invoice.subtotal)}
                  </Typography>
                </Box>

                {/* Additional Charges */}
                {(invoice.packingCharges > 0 ||
                  invoice.freightCharges > 0 ||
                  invoice.loadingCharges > 0 ||
                  invoice.otherCharges > 0) && (
                  <>
                    {invoice.packingCharges > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Packing Charges:
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(invoice.packingCharges)}
                        </Typography>
                      </Box>
                    )}
                    {invoice.freightCharges > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Freight Charges:
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(invoice.freightCharges)}
                        </Typography>
                      </Box>
                    )}
                    {invoice.loadingCharges > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Loading Charges:
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(invoice.loadingCharges)}
                        </Typography>
                      </Box>
                    )}
                    {invoice.otherCharges > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Other Charges:</Typography>
                        <Typography variant="body2">
                          {formatCurrency(invoice.otherCharges)}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body1">TRN Amount:</Typography>
                  <Typography variant="body1">
                    {formatCurrency(invoice.vatAmount)}
                  </Typography>
                </Box>

                {invoice.roundOff && invoice.roundOff !== 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Round Off:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(invoice.roundOff)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Total Amount:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "primary.main" }}
                  >
                    {formatCurrency(invoice.total)}
                  </Typography>
                </Box>

                {/* Advance and Balance */}
                {invoice.advanceReceived > 0 && (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Advance Received:</Typography>
                      <Typography variant="body2">
                        {formatCurrency(invoice.advanceReceived)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        p: 1,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                        Balance Amount:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", color: "error.main" }}
                      >
                        {formatCurrency(
                          Math.max(0, invoice.total - invoice.advanceReceived)
                        )}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Total in Words */}
                {invoice.totalInWords && (
                  <Box
                    sx={{ mt: 2, p: 1, bgcolor: "action.selected", borderRadius: 1 }}
                  >
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      <strong>Amount in Words:</strong> {invoice.totalInWords}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {invoice.notes && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        Notes:
                      </Typography>
                      <Typography variant="body2">{invoice.notes}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {invoice.terms && (
                <Grid size={{ xs: 12, md: invoice.notes ? 6 : 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        Terms & Conditions:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {invoice.terms}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Kindly check the product before unloading
                      </Typography>
                      <Typography variant="body2">
                        If any complaint arises, contact us immediatel
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Signature Section with Seal on Left */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <img
                src={seal}
                alt="Company Seal"
                crossOrigin="anonymous"
                style={{ height: 180, width: 'auto', objectFit: 'contain', opacity: 0.95 }}
              />
              <Box sx={{ textAlign: "center", minWidth: 200 }}>
                <Typography variant="body2" sx={{ mb: 4 }}>
                  Authorized Signatory
                </Typography>
                <Box
                  sx={{
                    borderBottom: "1px solid black",
                    mb: 1,
                    height: "50px",
                    width: "200px",
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  ULTIMATE STEELS
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreview;
