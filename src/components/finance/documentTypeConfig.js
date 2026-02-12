import {
  ArrowDownUp,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  FileMinus,
  FilePlus,
  FileText,
  MinusCircle,
  Package,
  PlusCircle,
  ReceiptText,
  Truck,
} from "lucide-react";

/**
 * Frontend document type registry.
 * Maps backend doc type codes → labels, icons, colors, and sign descriptions.
 * Used by DocumentHistoryPanel and CorrectionChainTimeline in live mode.
 */
const DOC_TYPE_CONFIG = {
  invoice: {
    label: "Invoice",
    icon: FileText,
    color: "blue",
    signLabel: "Original charge",
    sign: +1,
    navigateTo: (id) => `/app/invoices/${id}`,
  },
  credit_note: {
    label: "Credit Note",
    icon: MinusCircle,
    color: "red",
    signLabel: "Reduction",
    sign: -1,
    navigateTo: (id) => `/app/credit-notes/${id}`,
  },
  debit_note: {
    label: "Debit Note",
    icon: PlusCircle,
    color: "emerald",
    signLabel: "Additional charge",
    sign: +1,
    navigateTo: (id) => `/app/debit-notes/${id}`,
  },
  supplier_bill: {
    label: "Supplier Bill",
    icon: ReceiptText,
    color: "purple",
    signLabel: "Purchase charge",
    sign: +1,
    navigateTo: (id) => `/app/supplier-bills/${id}`,
  },
  supplier_credit_note: {
    label: "Supplier Credit Note",
    icon: FileMinus,
    color: "red",
    signLabel: "Purchase reduction",
    sign: -1,
    navigateTo: (id) => `/app/purchases/supplier-credit-notes/${id}`,
  },
  supplier_debit_note: {
    label: "Supplier Debit Note",
    icon: FilePlus,
    color: "orange",
    signLabel: "Purchase surcharge",
    sign: +1,
    navigateTo: (id) => `/app/debit-notes/${id}`,
  },
  journal_entry: {
    label: "Journal Entry",
    icon: ClipboardCheck,
    color: "indigo",
    signLabel: "Accounting entry",
    sign: +1,
    navigateTo: (id) => `/app/accounting/journal-entries/${id}`,
  },
  reversing_journal: {
    label: "Reversing Journal",
    icon: ArrowDownUp,
    color: "indigo",
    signLabel: "Reversal entry",
    sign: -1,
    navigateTo: (id) => `/app/accounting/journal-entries/${id}`,
  },
  grn: {
    label: "Goods Receipt Note",
    icon: Package,
    color: "teal",
    signLabel: "Stock in",
    sign: +1,
    navigateTo: (id) => `/app/grn/${id}`,
  },
  delivery_note: {
    label: "Delivery Note",
    icon: Truck,
    color: "orange",
    signLabel: "Stock out",
    sign: -1,
    navigateTo: (id) => `/app/delivery-notes/${id}`,
  },
  payment_receipt: {
    label: "Payment Receipt",
    icon: CreditCard,
    color: "green",
    signLabel: "Payment received",
    sign: +1,
    navigateTo: (id) => `/app/payments/${id}`,
  },
  payment_reversal: {
    label: "Payment Reversal",
    icon: FileCheck,
    color: "red",
    signLabel: "Payment reversed",
    sign: -1,
    navigateTo: (id) => `/app/payments/${id}`,
  },
};

export default DOC_TYPE_CONFIG;
