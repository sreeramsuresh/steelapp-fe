import { FileText, MinusCircle, PlusCircle } from "lucide-react";

const invoiceCorrectionConfig = {
  title: "Invoice Correction Guide",
  subtitle: "How to correct posted invoices using credit notes and debit notes",
  documentTypeLabel: "Invoice",
  bannerText:
    "Once an invoice is posted (status: ISSUED), it cannot be edited or deleted. To correct an error, issue a Credit Note to reverse the original, then a Debit Note (or new Invoice) at the corrected amount. This preserves a complete audit trail.",

  steps: [
    {
      label: "Original Invoice",
      description: "Posted & immutable",
      icon: FileText,
      color: "#3b82f6", // blue
    },
    {
      label: "Credit Note",
      description: "Full or partial reversal",
      icon: MinusCircle,
      color: "#ef4444", // red
    },
    {
      label: "New Invoice / DN",
      description: "Re-charge at correct amount",
      icon: PlusCircle,
      color: "#10b981", // emerald
    },
  ],

  scenarios: [
    {
      title: "Wrong Price",
      description: "Customer was charged AED 10,000 but the agreed price was AED 8,500.",
      flow: [
        { label: "INV-001 (+10,000)", type: "invoice" },
        { label: "CN-001 (-10,000)", type: "credit_note" },
        { label: "DN-001 (+8,500)", type: "debit_note" },
      ],
    },
    {
      title: "Partial Return",
      description: "Customer returns 20 of 100 units. Credit only the returned portion.",
      flow: [
        { label: "INV-002 (+5,000)", type: "invoice" },
        { label: "CN-002 (-1,000)", type: "credit_note" },
      ],
    },
    {
      title: "Wrong Customer",
      description: "Invoice issued to wrong customer. Full reversal, then re-issue to correct customer.",
      flow: [
        { label: "INV-003 (+7,200)", type: "invoice" },
        { label: "CN-003 (-7,200)", type: "credit_note" },
        { label: "INV-004 (+7,200)", type: "invoice" },
      ],
    },
    {
      title: "Duplicate Invoice",
      description: "Invoice was accidentally created twice. Issue a full credit note to void the duplicate.",
      flow: [
        { label: "INV-005 (+3,000)", type: "invoice" },
        { label: "CN-004 (-3,000)", type: "credit_note" },
      ],
    },
  ],

  exampleChain: {
    nodes: [
      {
        id: "invoice:24",
        type: "invoice",
        docId: 24,
        number: "INV-2026-0053",
        amount: 10000,
        status: "issued",
        date: "2026-02-10",
      },
      {
        id: "credit_note:6",
        type: "credit_note",
        docId: 6,
        number: "CN-2026-0001",
        amount: -10000,
        status: "issued",
        date: "2026-02-11",
        reason: "Price correction",
      },
      {
        id: "debit_note:1",
        type: "debit_note",
        docId: 1,
        number: "DN-2026-0001",
        amount: 8500,
        status: "issued",
        date: "2026-02-12",
        reason: "Re-charge at correct price",
      },
    ],
    edges: [
      { source: "invoice:24", target: "credit_note:6", linkType: "CORRECTION" },
      { source: "credit_note:6", target: "debit_note:1", linkType: "CORRECTION" },
    ],
    computed: {
      balance: 8500,
      vatNet: 404.76,
      nodeCount: 3,
    },
  },

  impactDomains: ["vat"],

  impactTable: {
    columns: [
      { key: "document", label: "Document", align: "left" },
      { key: "outputVat", label: "Output VAT", align: "right" },
      { key: "inputVat", label: "Input VAT", align: "right" },
      { key: "netVat", label: "Net VAT", align: "right" },
    ],
    rows: [
      { _key: "inv", document: "INV-2026-0053", outputVat: "476.19", inputVat: "-", netVat: "476.19" },
      { _key: "cn", document: "CN-2026-0001", outputVat: "-476.19", inputVat: "-", netVat: "-476.19" },
      { _key: "dn", document: "DN-2026-0001", outputVat: "404.76", inputVat: "-", netVat: "404.76" },
      { _key: "total", _isTotal: true, document: "Net Position", outputVat: "404.76", inputVat: "-", netVat: "404.76" },
    ],
  },

  guideUrl: "/app/finance?tab=document-workflow",
};

export default invoiceCorrectionConfig;
