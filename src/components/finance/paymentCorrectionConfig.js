import { CreditCard, FileCheck } from "lucide-react";

const paymentCorrectionConfig = {
	title: "Payment Correction Guide",
	subtitle: "How to correct posted payments using voids and reversals",
	documentTypeLabel: "Payment Receipt",
	bannerText:
		"Once a payment is recorded and confirmed, it cannot be edited or deleted. To correct an error, void the payment (with a reason) to reverse its allocation against invoices. Then record a new payment at the correct amount or against the correct invoice. This preserves the full receivables/payables audit trail.",

	steps: [
		{
			label: "Original Payment",
			description: "Confirmed & allocated",
			icon: CreditCard,
			color: "#22c55e", // green
		},
		{
			label: "Payment Void / Reversal",
			description: "Reverses allocation",
			icon: FileCheck,
			color: "#ef4444", // red
		},
		{
			label: "Corrected Payment",
			description: "New payment at correct amount",
			icon: CreditCard,
			color: "#22c55e", // green
		},
	],

	scenarios: [
		{
			title: "Wrong Amount Received",
			description:
				"Customer paid AED 10,000 but bank credit was AED 9,500 (short payment). Void original, re-record at correct amount.",
			flow: [
				{ label: "PMT-001 (+10,000)", type: "payment_receipt" },
				{ label: "VOID-001 (-10,000)", type: "payment_reversal" },
				{ label: "PMT-002 (+9,500)", type: "payment_receipt" },
			],
		},
		{
			title: "Payment Applied to Wrong Invoice",
			description:
				"AED 5,000 payment recorded against INV-100, but should have been against INV-200. Void and re-allocate.",
			flow: [
				{ label: "PMT-003 (+5,000 → INV-100)", type: "payment_receipt" },
				{ label: "VOID-002 (-5,000)", type: "payment_reversal" },
				{ label: "PMT-004 (+5,000 → INV-200)", type: "payment_receipt" },
			],
		},
		{
			title: "Cheque Bounced",
			description: "Customer's cheque for AED 15,000 bounced. Void payment to restore the invoice balance.",
			flow: [
				{ label: "PMT-005 (+15,000)", type: "payment_receipt" },
				{ label: "VOID-003 (-15,000)", type: "payment_reversal" },
			],
		},
		{
			title: "Duplicate Payment Entry",
			description: "Same bank transfer recorded twice. Void the duplicate entry.",
			flow: [
				{ label: "PMT-006 (+8,000)", type: "payment_receipt" },
				{ label: "VOID-004 (-8,000)", type: "payment_reversal" },
			],
		},
	],

	exampleChain: {
		nodes: [
			{
				id: "payment_receipt:12",
				type: "payment_receipt",
				docId: 12,
				number: "PMT-2026-0012",
				amount: 10000,
				status: "confirmed",
				date: "2026-02-03",
				sign: 1,
			},
			{
				id: "payment_reversal:4",
				type: "payment_reversal",
				docId: 4,
				number: "VOID-2026-0004",
				amount: 10000,
				status: "voided",
				date: "2026-02-05",
				reason: "Wrong amount — bank credit was AED 9,500",
				sign: -1,
			},
			{
				id: "payment_receipt:15",
				type: "payment_receipt",
				docId: 15,
				number: "PMT-2026-0015",
				amount: 9500,
				status: "confirmed",
				date: "2026-02-05",
				reason: "Re-record at correct amount",
				sign: 1,
			},
		],
		edges: [
			{ source: "payment_receipt:12", target: "payment_reversal:4", linkType: "REVERSAL" },
			{ source: "payment_reversal:4", target: "payment_receipt:15", linkType: "CORRECTION" },
		],
		computed: {
			balance: 9500,
			vatNet: 0,
			nodeCount: 3,
		},
	},

	impactDomains: ["allocation"],

	impactTable: {
		columns: [
			{ key: "document", label: "Document", align: "left" },
			{ key: "applied", label: "Applied", align: "right" },
			{ key: "unapplied", label: "Unapplied", align: "right" },
			{ key: "balance", label: "Invoice Balance Effect", align: "right" },
		],
		rows: [
			{ _key: "pmt1", document: "PMT-2026-0012", applied: "10,000.00", unapplied: "0.00", balance: "-10,000.00" },
			{
				_key: "void",
				document: "VOID-2026-0004",
				applied: "-10,000.00",
				unapplied: "0.00",
				balance: "+10,000.00 (restored)",
			},
			{ _key: "pmt2", document: "PMT-2026-0015", applied: "9,500.00", unapplied: "0.00", balance: "-9,500.00" },
			{
				_key: "total",
				_isTotal: true,
				document: "Net Position",
				applied: "9,500.00",
				unapplied: "0.00",
				balance: "-9,500.00",
			},
		],
	},

	guideUrl: "/app/finance/document-workflow?module=payment",
};

export default paymentCorrectionConfig;
