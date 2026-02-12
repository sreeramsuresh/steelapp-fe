import { ArrowDownUp, ClipboardCheck } from "lucide-react";

const journalEntryCorrectionConfig = {
  title: "Journal Entry Reversal Guide",
  subtitle: "How to correct posted journal entries using reversing journals",
  documentTypeLabel: "Journal Entry",
  bannerText:
    "Once a journal entry is posted, it cannot be edited or deleted. To correct an error, create a Reversing Journal that mirrors the original debits and credits in reverse. Then post a new corrected journal entry. This preserves a complete general-ledger audit trail.",

  steps: [
    {
      label: "Original Journal",
      description: "Posted & immutable",
      icon: ClipboardCheck,
      color: "#6366f1", // indigo
    },
    {
      label: "Reversing Journal",
      description: "Mirrors original in reverse",
      icon: ArrowDownUp,
      color: "#ef4444", // red
    },
    {
      label: "Corrected Journal",
      description: "New entry at correct amounts",
      icon: ClipboardCheck,
      color: "#10b981", // emerald
    },
  ],

  scenarios: [
    {
      title: "Wrong Account",
      description:
        "Rent expense AED 12,000 posted to Utilities instead of Rent Expense. Reverse and re-post to correct account.",
      flow: [
        { label: "JE-001 (Dr Utilities 12,000)", type: "journal_entry" },
        { label: "RJ-001 (Cr Utilities 12,000)", type: "reversing_journal" },
        { label: "JE-002 (Dr Rent Exp 12,000)", type: "journal_entry" },
      ],
    },
    {
      title: "Wrong Amount",
      description:
        "Depreciation of AED 5,000 was posted as AED 50,000. Reverse in full, then post with correct amount.",
      flow: [
        { label: "JE-003 (Dr Depr 50,000)", type: "journal_entry" },
        { label: "RJ-002 (Cr Depr 50,000)", type: "reversing_journal" },
        { label: "JE-004 (Dr Depr 5,000)", type: "journal_entry" },
      ],
    },
    {
      title: "Duplicate Entry",
      description: "Same accrual journal posted twice. Reverse the duplicate to zero out the effect.",
      flow: [
        { label: "JE-005 (Dr Accruals 8,000)", type: "journal_entry" },
        { label: "RJ-003 (Cr Accruals 8,000)", type: "reversing_journal" },
      ],
    },
    {
      title: "Wrong Period",
      description:
        "Revenue accrual posted in January but relates to February. Reverse in January, re-post in February.",
      flow: [
        { label: "JE-006 (Dr Rev 25,000 – Jan)", type: "journal_entry" },
        { label: "RJ-004 (Cr Rev 25,000 – Jan)", type: "reversing_journal" },
        { label: "JE-007 (Dr Rev 25,000 – Feb)", type: "journal_entry" },
      ],
    },
  ],

  exampleChain: {
    nodes: [
      {
        id: "journal_entry:5",
        type: "journal_entry",
        docId: 5,
        number: "JE-2026-0005",
        amount: 12000,
        status: "posted",
        date: "2026-02-01",
        sign: 1,
      },
      {
        id: "reversing_journal:2",
        type: "reversing_journal",
        docId: 2,
        number: "RJ-2026-0002",
        amount: 12000,
        status: "posted",
        date: "2026-02-05",
        reason: "Wrong account — reverse Utilities posting",
        sign: -1,
      },
      {
        id: "journal_entry:8",
        type: "journal_entry",
        docId: 8,
        number: "JE-2026-0008",
        amount: 12000,
        status: "posted",
        date: "2026-02-05",
        reason: "Re-post to Rent Expense account",
        sign: 1,
      },
    ],
    edges: [
      { source: "journal_entry:5", target: "reversing_journal:2", linkType: "REVERSAL" },
      { source: "reversing_journal:2", target: "journal_entry:8", linkType: "CORRECTION" },
    ],
    computed: {
      balance: 12000,
      vatNet: 0,
      nodeCount: 3,
    },
  },

  impactDomains: ["gl"],

  impactTable: {
    columns: [
      { key: "document", label: "Document", align: "left" },
      { key: "totalDebit", label: "Total Debit", align: "right" },
      { key: "totalCredit", label: "Total Credit", align: "right" },
      { key: "netEffect", label: "Net GL Effect", align: "right" },
    ],
    rows: [
      { _key: "je1", document: "JE-2026-0005", totalDebit: "12,000.00", totalCredit: "12,000.00", netEffect: "0.00" },
      {
        _key: "rj",
        document: "RJ-2026-0002",
        totalDebit: "12,000.00",
        totalCredit: "12,000.00",
        netEffect: "0.00 (reversal)",
      },
      {
        _key: "je2",
        document: "JE-2026-0008",
        totalDebit: "12,000.00",
        totalCredit: "12,000.00",
        netEffect: "0.00 (corrected)",
      },
      {
        _key: "total",
        _isTotal: true,
        document: "Net Position",
        totalDebit: "12,000.00",
        totalCredit: "12,000.00",
        netEffect: "0.00",
      },
    ],
  },

  guideUrl: "/app/finance?tab=journal-correction-guide",
};

export default journalEntryCorrectionConfig;
