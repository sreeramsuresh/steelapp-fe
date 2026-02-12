import { FileMinus, FilePlus, ReceiptText } from "lucide-react";

const supplierBillCorrectionConfig = {
  title: "Supplier Bill Correction Guide",
  subtitle: "How to correct posted supplier bills using debit notes and supplier credit notes",
  documentTypeLabel: "Supplier Bill",
  bannerText:
    "Once a supplier bill is approved/posted, it cannot be edited or deleted. To correct an error, issue a Debit Note against the supplier to adjust the amount. This preserves the full purchase audit trail and maintains input VAT accuracy.",

  steps: [
    {
      label: "Original Supplier Bill",
      description: "Approved & immutable",
      icon: ReceiptText,
      color: "#8b5cf6", // purple
    },
    {
      label: "Debit Note",
      description: "Adjustment to supplier",
      icon: FilePlus,
      color: "#f97316", // orange
    },
    {
      label: "Supplier Credit Note",
      description: "Credit from supplier",
      icon: FileMinus,
      color: "#ef4444", // red
    },
  ],

  scenarios: [
    {
      title: "Overcharged by Supplier",
      description: "Supplier billed AED 50,000 but PO price was AED 45,000. Issue a debit note for the difference.",
      flow: [
        { label: "BILL-001 (+50,000)", type: "supplier_bill" },
        { label: "DN-001 (-5,000)", type: "debit_note" },
      ],
    },
    {
      title: "Goods Quality Issue",
      description: "Received defective goods worth AED 8,000. Supplier issues credit note after inspection.",
      flow: [
        { label: "BILL-002 (+30,000)", type: "supplier_bill" },
        { label: "SCN-001 (-8,000)", type: "supplier_credit_note" },
      ],
    },
    {
      title: "Wrong VAT Category",
      description: "Bill recorded with standard 5% VAT but should be zero-rated (export). Full reversal and re-entry.",
      flow: [
        { label: "BILL-003 (+21,000)", type: "supplier_bill" },
        { label: "DN-002 (-21,000)", type: "debit_note" },
        { label: "BILL-004 (+20,000)", type: "supplier_bill" },
      ],
    },
    {
      title: "Duplicate Bill Entry",
      description: "Same supplier invoice entered twice. Issue a debit note to void the duplicate.",
      flow: [
        { label: "BILL-005 (+15,000)", type: "supplier_bill" },
        { label: "DN-003 (-15,000)", type: "debit_note" },
      ],
    },
  ],

  exampleChain: {
    nodes: [
      {
        id: "supplier_bill:10",
        type: "supplier_bill",
        docId: 10,
        number: "BILL-2026-0010",
        amount: 50000,
        status: "approved",
        date: "2026-02-05",
        sign: 1,
      },
      {
        id: "debit_note:3",
        type: "debit_note",
        docId: 3,
        number: "DN-2026-0003",
        amount: -5000,
        status: "approved",
        date: "2026-02-08",
        reason: "Price overcharge correction",
        sign: 1,
      },
    ],
    edges: [{ source: "supplier_bill:10", target: "debit_note:3", linkType: "CORRECTION" }],
    computed: {
      balance: 45000,
      vatNet: -238.1,
      nodeCount: 2,
    },
  },

  impactDomains: ["vat"],

  impactTable: {
    columns: [
      { key: "document", label: "Document", align: "left" },
      { key: "inputVat", label: "Input VAT", align: "right" },
      { key: "reverseCharge", label: "Reverse Charge", align: "right" },
      { key: "netVat", label: "Net VAT Effect", align: "right" },
    ],
    rows: [
      { _key: "bill", document: "BILL-2026-0010", inputVat: "2,380.95", reverseCharge: "-", netVat: "2,380.95" },
      { _key: "dn", document: "DN-2026-0003", inputVat: "-238.10", reverseCharge: "-", netVat: "-238.10" },
      {
        _key: "total",
        _isTotal: true,
        document: "Net Position",
        inputVat: "2,142.86",
        reverseCharge: "-",
        netVat: "2,142.86",
      },
    ],
  },

  guideUrl: "/app/purchases?tab=correction-guide",
};

export default supplierBillCorrectionConfig;
