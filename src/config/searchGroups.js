import {
  Anchor,
  BookOpen,
  Building2,
  ClipboardList,
  DollarSign,
  FileText,
  Globe,
  Landmark,
  Package,
  Receipt,
  ReceiptText,
  Ship,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  Warehouse,
} from "lucide-react";

/**
 * Universal search entity groups.
 *
 * Keys are camelCase because the API gateway's case converter middleware
 * transforms all response object keys from snake_case → camelCase.
 * The DB stores entity_type like "purchase_order" but by the time the
 * response reaches the frontend, grouped object keys are "purchaseOrder".
 */
const SEARCH_GROUPS = [
  // === Sales ===
  { key: "invoice", label: "Invoices", icon: FileText, path: (item) => `/app/invoices/${item.id}` },
  { key: "quotation", label: "Quotations", icon: ClipboardList, path: (item) => `/app/quotations/${item.id}` },
  { key: "deliveryNote", label: "Delivery Notes", icon: Truck, path: (item) => `/app/delivery-notes/${item.id}` },
  { key: "creditNote", label: "Credit Notes", icon: ReceiptText, path: (item) => `/app/credit-notes/${item.id}` },
  { key: "debitNote", label: "Debit Notes", icon: ReceiptText, path: (item) => `/app/debit-notes/${item.id}` },
  // === Procurement ===
  {
    key: "purchaseOrder",
    label: "Purchase Orders",
    icon: ShoppingCart,
    path: (item) => `/app/purchases/po/${item.id}/overview`,
  },
  { key: "grn", label: "GRNs", icon: ClipboardList, path: () => `/app/purchases` },
  { key: "supplierBill", label: "Supplier Bills", icon: Receipt, path: (item) => `/app/supplier-bills/${item.id}` },
  { key: "supplierQuotation", label: "Supplier Quotations", icon: ClipboardList, path: () => `/app/purchases` },
  // === Master Data ===
  { key: "customer", label: "Customers", icon: Users, path: (item) => `/app/customers/${item.id}` },
  { key: "supplier", label: "Suppliers", icon: Building2, path: (item) => `/app/suppliers/${item.id}` },
  { key: "product", label: "Products", icon: Package, path: (item) => `/app/products/${item.id}` },
  { key: "employee", label: "Employees", icon: UserCircle, path: (item) => `/app/employees/${item.id}/edit` },
  // === Inventory ===
  { key: "stockBatch", label: "Stock Batches", icon: Package, path: () => `/app/inventory` },
  { key: "warehouse", label: "Warehouses", icon: Warehouse, path: (item) => `/app/warehouses/${item.id}` },
  // === Finance ===
  { key: "payment", label: "Payments", icon: DollarSign, path: () => `/app/receivables` },
  { key: "journalEntry", label: "Journal Entries", icon: BookOpen, path: () => `/app/finance` },
  { key: "account", label: "Chart of Accounts", icon: Landmark, path: () => `/app/finance` },
  { key: "costCenter", label: "Cost Centers", icon: Building2, path: () => `/app/cost-centers` },
  // === Trade ===
  { key: "importOrder", label: "Import Orders", icon: Globe, path: (item) => `/app/import-orders/${item.id}` },
  { key: "exportOrder", label: "Export Orders", icon: Globe, path: (item) => `/app/export-orders/${item.id}` },
  { key: "billOfLading", label: "Bills of Lading", icon: Anchor, path: () => `/app/transit` },
  { key: "shipment", label: "Shipments", icon: Ship, path: () => `/app/transit` },
];

export const SEARCH_GROUP_MAP = Object.fromEntries(SEARCH_GROUPS.map((g) => [g.key, g]));

export default SEARCH_GROUPS;
