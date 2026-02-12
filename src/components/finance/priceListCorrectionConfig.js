import { FileText, RefreshCw, Tag } from "lucide-react";

const priceListCorrectionConfig = {
	title: "Price List Change Log Guide",
	subtitle: "How price list changes affect existing documents and how to handle pricing corrections",
	documentTypeLabel: "Price List",
	bannerText:
		"Price list changes are versioned and take effect from the effective date forward. They do NOT retroactively change existing invoices or quotations. To correct a pricing error on an already-issued document, issue a credit note to reverse the original, then a new invoice at the corrected price. Price list history is preserved for audit.",

	steps: [
		{
			label: "Original Price List",
			description: "Active version",
			icon: Tag,
			color: "#8b5cf6", // purple
		},
		{
			label: "Price Revision",
			description: "New version effective date",
			icon: RefreshCw,
			color: "#f97316", // orange
		},
		{
			label: "Document Corrections",
			description: "CN + new invoice if needed",
			icon: FileText,
			color: "#3b82f6", // blue
		},
	],

	scenarios: [
		{
			title: "Price Increase After Invoice",
			description:
				"Price list updated from AED 500/unit to AED 550/unit. Invoice INV-100 was issued at old price. No correction needed — price applies forward only.",
			flow: [
				{ label: "INV-100 (@ AED 500)", type: "invoice" },
				{ label: "Price Rev v2 (AED 550)", type: "journal_entry" },
				{ label: "INV-101 (@ AED 550)", type: "invoice" },
			],
		},
		{
			title: "Wrong Price on Invoice",
			description:
				"Invoice issued at AED 600/unit but price list says AED 500/unit. Credit note the difference.",
			flow: [
				{ label: "INV-102 (+60,000 @ 600)", type: "invoice" },
				{ label: "CN-020 (-10,000)", type: "credit_note" },
			],
		},
		{
			title: "Retroactive Price Agreement",
			description:
				"Customer negotiated a retroactive discount for all Q1 orders. Issue credit note for the discount amount.",
			flow: [
				{ label: "INV-103..108 (Q1 total)", type: "invoice" },
				{ label: "CN-025 (-retro discount)", type: "credit_note" },
			],
		},
		{
			title: "Price List Entry Error",
			description:
				"AED 50/kg entered instead of AED 500/kg. Fix the price list, then correct any invoices issued at the wrong price.",
			flow: [
				{ label: "INV-110 (+5,000 @ 50)", type: "invoice" },
				{ label: "CN-030 (-5,000)", type: "credit_note" },
				{ label: "INV-111 (+50,000 @ 500)", type: "invoice" },
			],
		},
	],

	exampleChain: {
		nodes: [
			{
				id: "invoice:102",
				type: "invoice",
				docId: 102,
				number: "INV-2026-0102",
				amount: 60000,
				status: "issued",
				date: "2026-01-20",
				sign: 1,
			},
			{
				id: "credit_note:20",
				type: "credit_note",
				docId: 20,
				number: "CN-2026-0020",
				amount: 10000,
				status: "issued",
				date: "2026-02-01",
				reason: "Price correction — list price AED 500, invoiced AED 600",
				sign: -1,
			},
		],
		edges: [{ source: "invoice:102", target: "credit_note:20", linkType: "CORRECTION" }],
		computed: {
			balance: 50000,
			vatNet: -476.19,
			nodeCount: 2,
		},
	},

	impactDomains: ["vat"],

	impactTable: {
		columns: [
			{ key: "document", label: "Document", align: "left" },
			{ key: "lineTotal", label: "Line Total", align: "right" },
			{ key: "outputVat", label: "Output VAT", align: "right" },
			{ key: "netEffect", label: "Net Revenue Effect", align: "right" },
		],
		rows: [
			{
				_key: "inv",
				document: "INV-2026-0102",
				lineTotal: "60,000.00",
				outputVat: "2,857.14",
				netEffect: "+60,000.00",
			},
			{
				_key: "cn",
				document: "CN-2026-0020",
				lineTotal: "-10,000.00",
				outputVat: "-476.19",
				netEffect: "-10,000.00",
			},
			{
				_key: "total",
				_isTotal: true,
				document: "Net Position",
				lineTotal: "50,000.00",
				outputVat: "2,380.95",
				netEffect: "50,000.00",
			},
		],
	},

	guideUrl: "/app/finance/document-workflow?module=price_list",
};

export default priceListCorrectionConfig;
