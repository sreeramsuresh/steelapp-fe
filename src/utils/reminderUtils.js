import { jsPDF } from "jspdf";
import { formatCurrency, formatDateDMY, normalizeLLC, titleCase } from "./invoiceUtils.js";
import { calculateBalanceDue, calculatePaymentStatus } from "./paymentUtils.js";
import { TIMEZONE_CONFIG } from "./timezone.js";

/**
 * Reminder types based on days until/past due date
 */
export const REMINDER_TYPES = {
  ADVANCE: "advance",
  DUE_SOON: "due_soon",
  DUE_TODAY: "due_today",
  POLITE_OVERDUE: "polite_overdue",
  URGENT_OVERDUE: "urgent_overdue",
  FINAL_OVERDUE: "final_overdue",
};

/**
 * Reminder configuration with styling and messaging
 */
export const REMINDER_CONFIG = {
  [REMINDER_TYPES.ADVANCE]: {
    label: "Advance Reminder",
    days: "7+ days before due",
    color: "blue",
    icon: "📅",
    tone: "friendly",
    bgLight: "bg-blue-50",
    bgDark: "bg-blue-900/20",
    textLight: "text-blue-700",
    textDark: "text-blue-300",
    borderLight: "border-blue-200",
    borderDark: "border-blue-800",
  },
  [REMINDER_TYPES.DUE_SOON]: {
    label: "Due Soon",
    days: "1-6 days before due",
    color: "yellow",
    icon: "⏰",
    tone: "gentle",
    bgLight: "bg-yellow-50",
    bgDark: "bg-yellow-900/20",
    textLight: "text-yellow-700",
    textDark: "text-yellow-300",
    borderLight: "border-yellow-200",
    borderDark: "border-yellow-800",
  },
  [REMINDER_TYPES.DUE_TODAY]: {
    label: "Due Today",
    days: "Due today",
    color: "orange",
    icon: "🔔",
    tone: "courtesy",
    bgLight: "bg-orange-50",
    bgDark: "bg-orange-900/20",
    textLight: "text-orange-700",
    textDark: "text-orange-300",
    borderLight: "border-orange-200",
    borderDark: "border-orange-800",
  },
  [REMINDER_TYPES.POLITE_OVERDUE]: {
    label: "Overdue",
    days: "1-7 days overdue",
    color: "red",
    icon: "⚠️",
    tone: "polite",
    bgLight: "bg-red-50",
    bgDark: "bg-red-900/20",
    textLight: "text-red-700",
    textDark: "text-red-300",
    borderLight: "border-red-200",
    borderDark: "border-red-800",
  },
  [REMINDER_TYPES.URGENT_OVERDUE]: {
    label: "Urgent Overdue",
    days: "8-30 days overdue",
    color: "red",
    icon: "🚨",
    tone: "urgent",
    bgLight: "bg-red-100",
    bgDark: "bg-red-900/40",
    textLight: "text-red-800",
    textDark: "text-red-200",
    borderLight: "border-red-300",
    borderDark: "border-red-700",
  },
  [REMINDER_TYPES.FINAL_OVERDUE]: {
    label: "Final Notice",
    days: "31+ days overdue",
    color: "red",
    icon: "🛑",
    tone: "final",
    bgLight: "bg-red-200",
    bgDark: "bg-red-900/60",
    textLight: "text-red-900",
    textDark: "text-red-100",
    borderLight: "border-red-400",
    borderDark: "border-red-600",
  },
};

/**
 * Calculate days until/past due date in UAE timezone
 * Both today and due date are evaluated in UAE timezone (UTC+4)
 * to ensure consistent business day calculations
 *
 * @param {string} dueDate - Due date in ISO format (UTC)
 * @returns {number} - Negative if overdue, positive if upcoming, 0 if today
 */
export const calculateDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;

  // Get current date in UAE timezone
  const now = new Date();
  const todayUAE = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.UAE_TIMEZONE }));
  todayUAE.setHours(0, 0, 0, 0);

  // Get due date in UAE timezone
  const dueUtc = new Date(dueDate);
  const dueUAE = new Date(dueUtc.toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.UAE_TIMEZONE }));
  dueUAE.setHours(0, 0, 0, 0);

  const diffTime = dueUAE.getTime() - todayUAE.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get reminder type based on days until/past due date
 * @param {number} daysUntilDue - Days until due (negative if overdue)
 * @returns {string} - Reminder type from REMINDER_TYPES
 */
export const getReminderType = (daysUntilDue) => {
  if (daysUntilDue >= 7) return REMINDER_TYPES.ADVANCE;
  if (daysUntilDue >= 1 && daysUntilDue <= 6) return REMINDER_TYPES.DUE_SOON;
  if (daysUntilDue === 0) return REMINDER_TYPES.DUE_TODAY;
  if (daysUntilDue >= -7 && daysUntilDue < 0) return REMINDER_TYPES.POLITE_OVERDUE;
  if (daysUntilDue >= -30 && daysUntilDue < -7) return REMINDER_TYPES.URGENT_OVERDUE;
  if (daysUntilDue < -30) return REMINDER_TYPES.FINAL_OVERDUE;

  return REMINDER_TYPES.POLITE_OVERDUE; // Default fallback
};

/**
 * Get reminder configuration for an invoice
 * @param {Object} invoice - Invoice object
 * @returns {Object|null} - Reminder info or null if no reminder needed
 */
export const getInvoiceReminderInfo = (invoice) => {
  // Normalize status to handle both 'issued' and 'STATUS_ISSUED' formats
  const normalizedStatus = (invoice.status || "").toLowerCase().replace("status_", "");

  // Only issued/sent invoices need reminders (not draft, proforma, cancelled)
  if (!["issued", "sent"].includes(normalizedStatus)) return null;

  // Use backend payment status if available (gold standard), otherwise calculate
  const rawPaymentStatus = invoice.paymentStatus || calculatePaymentStatus(invoice.total, invoice.payments || []);

  // Normalize payment status to handle 'PAYMENT_STATUS_PAID' format
  const paymentStatus = (rawPaymentStatus || "unpaid").toLowerCase().replace("payment_status_", "");

  // Only unpaid or partially paid invoices need reminders
  if (paymentStatus === "fully_paid" || paymentStatus === "paid") return null;

  // Calculate days until due
  const daysUntilDue = calculateDaysUntilDue(invoice.dueDate);
  const reminderType = getReminderType(daysUntilDue);
  const config = REMINDER_CONFIG[reminderType];

  // Use backend outstanding if available (gold standard), otherwise calculate balance due
  const balanceDue =
    invoice.outstanding !== undefined
      ? invoice.outstanding
      : calculateBalanceDue(invoice.total, invoice.payments || []);

  return {
    type: reminderType,
    config,
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    balanceDue,
    paymentStatus,
    shouldShowReminder: true,
  };
};

/**
 * Format days message for reminders
 * @param {number} daysUntilDue - Days until due (negative if overdue)
 * @returns {string} - Formatted message
 */
export const formatDaysMessage = (daysUntilDue) => {
  if (daysUntilDue === 0) return "Due Today";
  if (daysUntilDue > 0) {
    return daysUntilDue === 1 ? "Payment due in 1 day" : `Payment due in ${daysUntilDue} days`;
  }

  const overdueDays = Math.abs(daysUntilDue);
  return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
};

/**
 * Get promise indicator configuration for an invoice
 * Shows customer's promised payment date separately from invoice due date
 * @param {Object} invoice - Invoice object
 * @param {Object} latestReminder - Latest payment reminder with promised_date
 * @returns {Object|null} - Promise info or null if no promise
 */
export const getPromiseIndicatorInfo = (invoice, latestReminder) => {
  // Normalize status to handle both 'issued' and 'STATUS_ISSUED' formats
  const normalizedStatus = (invoice.status || "").toLowerCase().replace("status_", "");

  // Only show for issued/sent invoices
  if (!["issued", "sent"].includes(normalizedStatus)) return null;

  // Only show if reminder has a promised_date
  if (!latestReminder || !latestReminder.promisedDate) return null;

  // Use backend payment status if available (gold standard), otherwise calculate
  const rawPaymentStatus = invoice.paymentStatus || calculatePaymentStatus(invoice.total, invoice.payments || []);

  // Normalize payment status to handle 'PAYMENT_STATUS_PAID' format
  const paymentStatus = (rawPaymentStatus || "unpaid").toLowerCase().replace("payment_status_", "");

  // Only unpaid or partially paid invoices need promise indicators
  if (paymentStatus === "fully_paid" || paymentStatus === "paid") return null;

  // Calculate days until promised date
  const daysUntilPromised = calculateDaysUntilDue(latestReminder.promisedDate);

  // Determine visual style based on promise timing
  let config;
  if (daysUntilPromised >= 7) {
    // Promise is 7+ days away
    config = {
      label: "Customer Promised",
      icon: "💬",
      tone: "neutral",
      bgLight: "bg-blue-50",
      bgDark: "bg-blue-900/20",
      textLight: "text-blue-700",
      textDark: "text-blue-300",
      borderLight: "border-blue-200",
      borderDark: "border-blue-800",
    };
  } else if (daysUntilPromised >= 1) {
    // Promise is 1-6 days away
    config = {
      label: "Customer Promised",
      icon: "💬",
      tone: "soon",
      bgLight: "bg-purple-50",
      bgDark: "bg-purple-900/20",
      textLight: "text-purple-700",
      textDark: "text-purple-300",
      borderLight: "border-purple-200",
      borderDark: "border-purple-800",
    };
  } else if (daysUntilPromised === 0) {
    // Promise is today
    config = {
      label: "Customer Promised Today",
      icon: "💬",
      tone: "today",
      bgLight: "bg-indigo-50",
      bgDark: "bg-indigo-900/20",
      textLight: "text-indigo-700",
      textDark: "text-indigo-300",
      borderLight: "border-indigo-200",
      borderDark: "border-indigo-800",
    };
  } else {
    // Promise is overdue (customer broke promise)
    config = {
      label: "Promise Broken",
      icon: "💬",
      tone: "broken",
      bgLight: "bg-red-50",
      bgDark: "bg-red-900/20",
      textLight: "text-red-700",
      textDark: "text-red-300",
      borderLight: "border-red-200",
      borderDark: "border-red-800",
    };
  }

  // Get balance due
  const balanceDue = calculateBalanceDue(invoice.total, invoice.payments || []);

  return {
    config,
    daysUntilPromised,
    isPromiseBroken: daysUntilPromised < 0,
    promisedAmount: latestReminder.promisedAmount,
    promisedDate: latestReminder.promisedDate,
    balanceDue,
    shouldShowPromise: true,
  };
};

/**
 * Format promise message for display
 * @param {number} daysUntilPromised - Days until promised date
 * @returns {string} - Formatted message
 */
export const formatPromiseMessage = (daysUntilPromised) => {
  if (daysUntilPromised === 0) return "Promised Today";
  if (daysUntilPromised > 0) {
    return daysUntilPromised === 1 ? "Promised in 1 day" : `Promised in ${daysUntilPromised} days`;
  }

  const overdueDays = Math.abs(daysUntilPromised);
  return overdueDays === 1 ? "Promise 1 day late" : `Promise ${overdueDays} days late`;
};

/**
 * Get reminder letter content based on reminder type
 * @param {string} reminderType - Type of reminder
 * @param {Object} invoice - Invoice object
 * @param {number} daysUntilDue - Days until/past due date
 * @returns {Object} - Letter content { subject, greeting, body, closing }
 */
export const getReminderLetterContent = (reminderType, invoice, daysUntilDue) => {
  const customerName = titleCase(normalizeLLC(invoice.customer.name));
  const invoiceNumber = invoice.invoiceNumber;
  const balanceDue = calculateBalanceDue(invoice.total, invoice.payments || []);
  const dueDate = formatDateDMY(invoice.dueDate);

  const templates = {
    [REMINDER_TYPES.ADVANCE]: {
      subject: `Advance Payment Reminder - Invoice ${invoiceNumber}`,
      greeting: `Dear ${customerName},`,
      body: [
        `This is a friendly reminder that payment for Invoice ${invoiceNumber} will be due on ${dueDate}.`,
        "",
        `Outstanding Amount: ${formatCurrency(balanceDue)}`,
        `Due Date: ${dueDate}`,
        `Payment due in ${daysUntilDue} days`,
        "",
        "We wanted to send this advance notice to help you plan your payment schedule. If you have already processed this payment, please disregard this reminder.",
        "",
        "For your convenience, you can make payment via bank transfer, cheque, or any of our accepted payment methods. Please reference the invoice number when making the payment.",
      ],
      closing: "Thank you for your continued business.",
    },

    [REMINDER_TYPES.DUE_SOON]: {
      subject: `Payment Due Soon - Invoice ${invoiceNumber}`,
      greeting: `Dear ${customerName},`,
      body: [
        `This is a gentle reminder that payment for Invoice ${invoiceNumber} is due soon.`,
        "",
        `Outstanding Amount: ${formatCurrency(balanceDue)}`,
        `Due Date: ${dueDate}`,
        `Payment due in ${daysUntilDue} days`,
        "",
        "Please arrange for payment at your earliest convenience to avoid any delays. If you have already made this payment, please accept our thanks and disregard this notice.",
        "",
        "Should you have any questions or concerns regarding this invoice, please don't hesitate to contact us.",
      ],
      closing: "We appreciate your prompt attention to this matter.",
    },

    [REMINDER_TYPES.DUE_TODAY]: {
      subject: `Payment Due Today - Invoice ${invoiceNumber}`,
      greeting: `Dear ${customerName},`,
      body: [
        `This is a courtesy reminder that payment for Invoice ${invoiceNumber} is due today.`,
        "",
        `Outstanding Amount: ${formatCurrency(balanceDue)}`,
        `Due Date: ${dueDate} (Today)`,
        "",
        "If you have already submitted your payment, thank you! If not, we kindly request that you process the payment today to maintain your account in good standing.",
        "",
        "For immediate payment processing, please contact our accounts department or use any of our available payment methods.",
      ],
      closing: "Thank you for your cooperation.",
    },

    [REMINDER_TYPES.POLITE_OVERDUE]: {
      subject: `Payment Overdue Notice - Invoice ${invoiceNumber}`,
      greeting: `Dear ${customerName},`,
      body: [
        `We hope this message finds you well. This is to inform you that payment for Invoice ${invoiceNumber} is now overdue.`,
        "",
        `Outstanding Amount: ${formatCurrency(balanceDue)}`,
        `Due Date: ${dueDate}`,
        `Days Overdue: ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""}`,
        "",
        "We understand that oversights can happen, and we would appreciate it if you could arrange payment as soon as possible.",
        "",
        "If you have already made this payment, please send us the payment confirmation so we can update our records. If there are any issues preventing payment, please contact us to discuss payment arrangements.",
      ],
      closing: "We value your business and look forward to resolving this matter promptly.",
    },

    [REMINDER_TYPES.URGENT_OVERDUE]: {
      subject: `URGENT: Payment Overdue - Invoice ${invoiceNumber}`,
      greeting: `Dear ${customerName},`,
      body: [
        `This is an urgent reminder that payment for Invoice ${invoiceNumber} is significantly overdue.`,
        "",
        `Outstanding Amount: ${formatCurrency(balanceDue)}`,
        `Original Due Date: ${dueDate}`,
        `Days Overdue: ${Math.abs(daysUntilDue)} days`,
        "",
        "We have not yet received payment for this invoice, and this delay is affecting our business operations. We request your immediate attention to this matter.",
        "",
        "Please arrange payment within the next 48 hours. If payment has already been made, please provide us with payment confirmation immediately.",
        "",
        "If you are experiencing difficulties with payment, please contact us urgently to discuss alternative arrangements. Failure to respond may result in further action.",
      ],
      closing: "Your immediate attention to this matter is required.",
    },

    [REMINDER_TYPES.FINAL_OVERDUE]: {
      subject: `FINAL NOTICE: Payment Severely Overdue - Invoice ${invoiceNumber}`,
      greeting: `Dear ${customerName},`,
      body: [
        `This is a FINAL NOTICE regarding the severely overdue payment for Invoice ${invoiceNumber}.`,
        "",
        `Outstanding Amount: ${formatCurrency(balanceDue)}`,
        `Original Due Date: ${dueDate}`,
        `Days Overdue: ${Math.abs(daysUntilDue)} days`,
        "",
        "Despite our previous reminders, we have not received payment for this invoice. This extended delay is unacceptable and is causing serious disruption to our business.",
        "",
        "We require IMMEDIATE PAYMENT of the outstanding balance. If we do not receive payment or hear from you within 5 business days, we will have no choice but to:",
        "• Suspend all future services and deliveries",
        "• Refer this matter to our legal department",
        "• Take appropriate legal action to recover the debt",
        "",
        "If you have made payment, please provide proof immediately. If you are unable to pay in full, contact us within 2 business days to discuss a payment plan.",
        "",
        "This is your final opportunity to resolve this matter before we proceed with formal debt recovery action.",
      ],
      closing: "URGENT ACTION REQUIRED - Contact us immediately.",
    },
  };

  return templates[reminderType] || templates[REMINDER_TYPES.POLITE_OVERDUE];
};

/**
 * Generate payment reminder PDF letter
 * @param {Object} invoice - Invoice object
 * @param {Object} company - Company details
 * @returns {Promise<Object>} - Result with success status and filename
 */
export const generatePaymentReminder = async (invoice, company) => {
  try {
    const reminderInfo = getInvoiceReminderInfo(invoice);

    if (!reminderInfo || !reminderInfo.shouldShowReminder) {
      return { success: false, error: "No reminder needed for this invoice" };
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    const { type, daysUntilDue } = reminderInfo;
    const letterContent = getReminderLetterContent(type, invoice, daysUntilDue);

    // Header - Company Details
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(normalizeLLC(company?.name || "Ultimate Steels Building Materials Trading"), margin, yPos);
    yPos += 7;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    if (company.address?.street) {
      pdf.text(company.address.street, margin, yPos);
      yPos += 5;
    }
    if (company.address?.city && company.address?.country) {
      pdf.text(`${company.address.city}, ${company.address.country}`, margin, yPos);
      yPos += 5;
    }
    if (company.phone) {
      pdf.text(`Ph: ${company.phone} | Email: ${company.email}`, margin, yPos);
      yPos += 5;
    }
    if (company.vatNumber) {
      pdf.text(`VAT Reg No: ${company.vatNumber}`, margin, yPos);
      yPos += 10;
    }

    // Date
    const today = new Date();
    pdf.text(`Date: ${formatDateDMY(today.toISOString().split("T")[0])}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 10;

    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Customer Details
    pdf.setFont("helvetica", "bold");
    pdf.text("To:", margin, yPos);
    yPos += 6;

    pdf.setFont("helvetica", "normal");
    pdf.text(titleCase(normalizeLLC(invoice.customer.name)), margin, yPos);
    yPos += 5;
    if (invoice.customer.address?.street) {
      pdf.text(invoice.customer.address.street, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.address?.city && invoice.customer.address?.country) {
      pdf.text(`${invoice.customer.address.city}, ${invoice.customer.address.country}`, margin, yPos);
      yPos += 5;
    }

    yPos += 10;

    // Subject Line
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    const subjectLines = pdf.splitTextToSize(`Subject: ${letterContent.subject}`, pageWidth - 2 * margin);
    pdf.text(subjectLines, margin, yPos);
    yPos += subjectLines.length * 6 + 10;

    // Greeting
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(letterContent.greeting, margin, yPos);
    yPos += 8;

    // Body paragraphs
    for (const paragraph of letterContent.body) {
      if (paragraph === "") {
        yPos += 5;
      } else {
        const lines = pdf.splitTextToSize(paragraph, pageWidth - 2 * margin);

        // Check if we need a new page
        if (yPos + lines.length * 5 > 270) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.text(lines, margin, yPos);
        yPos += lines.length * 5;
      }
    }

    yPos += 10;

    // Closing
    pdf.setFont("helvetica", "bold");
    pdf.text(letterContent.closing, margin, yPos);
    yPos += 15;

    // Signature area
    pdf.setFont("helvetica", "normal");
    pdf.text("Sincerely,", margin, yPos);
    yPos += 15;

    pdf.line(margin, yPos, margin + 50, yPos);
    yPos += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Accounts Department", margin, yPos);
    yPos += 4;
    pdf.setFont("helvetica", "normal");
    pdf.text(normalizeLLC(company?.name || "Ultimate Steels"), margin, yPos);

    // Footer note
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      "For any queries regarding this notice, please contact our accounts department immediately.",
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 15,
      { align: "center" }
    );

    // Save PDF
    const fileName = `Payment_Reminder_${invoice.invoiceNumber}_${today.toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName, reminderType: type };
  } catch (error) {
    console.error("Error generating payment reminder:", error);
    return { success: false, error: error.message };
  }
};
