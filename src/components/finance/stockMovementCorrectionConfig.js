import { Package, Truck } from "lucide-react";

const stockMovementCorrectionConfig = {
	title: "Stock Movement Correction Guide",
	subtitle: "How to correct posted GRNs and delivery notes using reversals and adjustments",
	documentTypeLabel: "Stock Movement",
	bannerText:
		"Once a Goods Receipt Note (GRN) or Delivery Note is confirmed, the stock quantities it moved are committed. To correct an error, create a reversing stock movement (return to supplier for GRN, or return from customer for DN) and then re-issue at the correct quantities. This preserves the full inventory audit trail.",

	steps: [
		{
			label: "Original Movement",
			description: "Confirmed & committed",
			icon: Package,
			color: "#14b8a6", // teal
		},
		{
			label: "Reversing Movement",
			description: "Returns / write-off",
			icon: Truck,
			color: "#ef4444", // red
		},
		{
			label: "Corrected Movement",
			description: "Re-issued at correct qty",
			icon: Package,
			color: "#10b981", // emerald
		},
	],

	scenarios: [
		{
			title: "GRN Qty Overstated",
			description:
				"GRN recorded receipt of 500 coils but only 480 were actually received. Reverse the excess with a stock adjustment.",
			flow: [
				{ label: "GRN-001 (+500)", type: "grn" },
				{ label: "ADJ-001 (-20)", type: "delivery_note" },
			],
		},
		{
			title: "Wrong Product on GRN",
			description:
				"GRN booked 200 units of SS-304 Sheet but shipment was SS-316L Sheet. Reverse the original and re-receive.",
			flow: [
				{ label: "GRN-002 (+200 SS-304)", type: "grn" },
				{ label: "ADJ-002 (-200 SS-304)", type: "delivery_note" },
				{ label: "GRN-003 (+200 SS-316L)", type: "grn" },
			],
		},
		{
			title: "Delivery Note Over-Shipped",
			description:
				"Customer was shipped 100 units but DN said 120. Reverse excess 20 units with a return receipt.",
			flow: [
				{ label: "DN-001 (-120)", type: "delivery_note" },
				{ label: "GRN-004 (+20 return)", type: "grn" },
			],
		},
		{
			title: "Duplicate Delivery Note",
			description: "Same shipment recorded twice. Reverse the duplicate to restore stock levels.",
			flow: [
				{ label: "DN-002 (-50)", type: "delivery_note" },
				{ label: "GRN-005 (+50 reversal)", type: "grn" },
			],
		},
	],

	exampleChain: {
		nodes: [
			{
				id: "grn:8",
				type: "grn",
				docId: 8,
				number: "GRN-2026-0008",
				amount: 500,
				status: "confirmed",
				date: "2026-02-01",
				sign: 1,
			},
			{
				id: "delivery_note:15",
				type: "delivery_note",
				docId: 15,
				number: "ADJ-2026-0001",
				amount: 20,
				status: "delivered",
				date: "2026-02-03",
				reason: "Qty correction — only 480 coils received",
				sign: -1,
			},
		],
		edges: [{ source: "grn:8", target: "delivery_note:15", linkType: "CORRECTION" }],
		computed: {
			balance: 480,
			vatNet: 0,
			nodeCount: 2,
		},
	},

	impactDomains: ["stock"],

	impactTable: {
		columns: [
			{ key: "document", label: "Document", align: "left" },
			{ key: "qtyIn", label: "Qty In", align: "right" },
			{ key: "qtyOut", label: "Qty Out", align: "right" },
			{ key: "netQty", label: "Net Stock Effect", align: "right" },
		],
		rows: [
			{ _key: "grn", document: "GRN-2026-0008", qtyIn: "500", qtyOut: "-", netQty: "+500" },
			{ _key: "adj", document: "ADJ-2026-0001", qtyIn: "-", qtyOut: "20", netQty: "-20" },
			{ _key: "total", _isTotal: true, document: "Net Position", qtyIn: "500", qtyOut: "20", netQty: "+480" },
		],
	},

	guideUrl: "/app/finance/document-workflow?module=stock",
};

export default stockMovementCorrectionConfig;
