import { FileCheck, FileText, MinusCircle } from "lucide-react";

const vatPeriodCorrectionConfig = {
	title: "VAT Return Amendment Guide",
	subtitle: "How to correct VAT return errors using credit notes, debit notes, and voluntary disclosures",
	documentTypeLabel: "VAT Return",
	bannerText:
		"Once a VAT return is filed with the FTA, it cannot be modified. To correct errors discovered after filing, issue the appropriate correction documents (credit notes, debit notes) and include them in the next return period. For material errors exceeding AED 10,000, a Voluntary Disclosure must be filed with the FTA.",

	steps: [
		{
			label: "Filed VAT Return",
			description: "Submitted to FTA",
			icon: FileText,
			color: "#3b82f6", // blue
		},
		{
			label: "Correction Documents",
			description: "CN / DN in next period",
			icon: MinusCircle,
			color: "#ef4444", // red
		},
		{
			label: "Amended Return",
			description: "Voluntary Disclosure if > AED 10k",
			icon: FileCheck,
			color: "#10b981", // emerald
		},
	],

	scenarios: [
		{
			title: "Output VAT Understated",
			description:
				"An invoice for AED 100,000 was omitted from the Q1 return. Include it in Q2 return. If output VAT error > AED 10,000, file Voluntary Disclosure.",
			flow: [
				{ label: "Q1 Return (filed)", type: "journal_entry" },
				{ label: "INV-050 (+100,000)", type: "invoice" },
				{ label: "Q2 Return (includes omission)", type: "journal_entry" },
			],
		},
		{
			title: "Input VAT Overclaimed",
			description:
				"Supplier bill with AED 2,000 input VAT was non-recoverable (personal use). Issue debit note to adjust.",
			flow: [
				{ label: "BILL-020 (+42,000 incl VAT)", type: "supplier_bill" },
				{ label: "DN-010 (-2,000 VAT adj)", type: "debit_note" },
			],
		},
		{
			title: "Credit Note Not Reported",
			description:
				"Credit note CN-005 for AED 8,000 was issued in Q1 but not included in the return. Include in next period.",
			flow: [
				{ label: "Q1 Return (filed)", type: "journal_entry" },
				{ label: "CN-005 (-8,000)", type: "credit_note" },
				{ label: "Q2 Return (includes CN)", type: "journal_entry" },
			],
		},
		{
			title: "Wrong VAT Rate Applied",
			description:
				"Standard 5% applied to a zero-rated export. Issue credit note at 5%, re-invoice at 0%.",
			flow: [
				{ label: "INV-060 (+10,500 @ 5%)", type: "invoice" },
				{ label: "CN-010 (-10,500)", type: "credit_note" },
				{ label: "INV-061 (+10,000 @ 0%)", type: "invoice" },
			],
		},
	],

	exampleChain: {
		nodes: [
			{
				id: "invoice:60",
				type: "invoice",
				docId: 60,
				number: "INV-2026-0060",
				amount: 10500,
				status: "issued",
				date: "2026-01-15",
				sign: 1,
			},
			{
				id: "credit_note:10",
				type: "credit_note",
				docId: 10,
				number: "CN-2026-0010",
				amount: 10500,
				status: "issued",
				date: "2026-02-01",
				reason: "Wrong VAT rate — was 5%, should be 0% (export)",
				sign: -1,
			},
			{
				id: "invoice:61",
				type: "invoice",
				docId: 61,
				number: "INV-2026-0061",
				amount: 10000,
				status: "issued",
				date: "2026-02-01",
				reason: "Re-invoice at 0% VAT (zero-rated export)",
				sign: 1,
			},
		],
		edges: [
			{ source: "invoice:60", target: "credit_note:10", linkType: "CORRECTION" },
			{ source: "credit_note:10", target: "invoice:61", linkType: "CORRECTION" },
		],
		computed: {
			balance: 10000,
			vatNet: -500,
			nodeCount: 3,
		},
	},

	impactDomains: ["vat"],

	impactTable: {
		columns: [
			{ key: "document", label: "Document", align: "left" },
			{ key: "outputVat", label: "Output VAT", align: "right" },
			{ key: "period", label: "Return Period", align: "right" },
			{ key: "netVat", label: "Net VAT Effect", align: "right" },
		],
		rows: [
			{ _key: "inv1", document: "INV-2026-0060", outputVat: "500.00", period: "Q1 2026", netVat: "+500.00" },
			{ _key: "cn", document: "CN-2026-0010", outputVat: "-500.00", period: "Q1 2026", netVat: "-500.00" },
			{ _key: "inv2", document: "INV-2026-0061", outputVat: "0.00", period: "Q1 2026", netVat: "0.00" },
			{
				_key: "total",
				_isTotal: true,
				document: "Net Position",
				outputVat: "0.00",
				period: "-",
				netVat: "0.00",
			},
		],
	},

	guideUrl: "/app/finance/document-workflow?module=vat_period",
};

export default vatPeriodCorrectionConfig;
