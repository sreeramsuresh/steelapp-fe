/**
 * Development-time guards for Invoice objects
 * CRITICAL: Loudly warns when code accesses snake_case or unknown fields
 * ONLY ACTIVE IN DEVELOPMENT (production has zero overhead)
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Invoice } from "../types/invoice";

/**
 * All valid camelCase keys that should exist on a normalized Invoice
 * THIS IS THE SINGLE SOURCE OF TRUTH for allowed Invoice fields
 */
const ALLOWED_INVOICE_KEYS = new Set<keyof Invoice | string>([
  // Core identifiers
  "id",
  "invoiceNumber",

  // Dates
  "invoiceDate",
  "dueDate",
  "date", // Alias for invoiceDate (used by legacy code)
  "promiseDate", // Promise/delivery date
  "createdAt",
  "updatedAt",
  "deletedAt",
  "issuedAt", // When invoice was issued (for 24h edit window)
  "revisedAt", // Timestamp of last revision
  "supersededAt", // When this invoice was superseded

  // Revision tracking
  "revisionNumber", // 1 = original, 2+ = revisions
  "originalInvoiceId", // Reference to original invoice (for revisions)
  "supersededBy", // ID of revision that superseded this
  "supersededReason", // REVISED, CANCELLED, etc.

  // Customer information
  "customerId",
  "customerDetails",
  "customerName",
  "customerEmail",
  "customer", // Alias for customerDetails (used by legacy code)
  "customerPurchaseOrderNumber",
  "customerPurchaseOrderDate",

  // Financial
  "subtotal",
  "vatAmount",
  "total",
  "totalAmount",
  "received",
  "outstanding",
  "balanceDue",

  // Discounts & Currency
  "discountPercentage",
  "discountAmount",
  "discountType",
  "currency",
  "exchangeRate",

  // Additional Charges
  "packingCharges",
  "loadingCharges",
  "freightCharges",
  "otherCharges",
  "taxNotes",

  // Status
  "status",
  "paymentStatus",

  // Items & Payments
  "items",
  "payments",
  "lastPaymentDate",
  "advanceReceived",
  "modeOfPayment",
  "chequeNumber",

  // Sales & Commission
  "salesAgentId",
  "salesAgentName",
  "commissionAmount",
  "commissionCalculated",
  "commissionEligible", // NEW: Whether invoice qualifies for commission
  "commissionPaid", // NEW: Whether commission has been paid
  "commissionNotes", // NEW: Notes about commission status

  // Delivery
  "deliveryStatus",

  // Warehouse
  "warehouseId",
  "warehouseName",
  "warehouseCode",
  "warehouseCity",

  // Soft delete & recreation
  "deletionReason",
  "deletionReasonCode", // NEW: Categorized deletion reason code
  "deletedByUserId", // NEW: User ID who deleted invoice
  "recreatedFrom",

  // Price List Reference (2 new fields)
  "pricelistId", // NEW: ID of applied price list
  "pricelistName", // NEW: Name of applied price list

  // PDF Generation (2 new fields)
  "pdfUrl", // NEW: URL/path to generated PDF
  "pdfGeneratedAt", // NEW: Timestamp of PDF generation

  // Credit Note Tracking (3 fields)
  "hasCreditNotes", // Whether invoice has credit notes
  "creditNotesCount", // Number of credit notes for this invoice
  "totalCreditedAmount", // Total amount credited back

  // Notes & Terms
  "notes",
  "terms", // Canonical UI field name
  "termsAndConditions", // Backend/legacy alias for terms

  // Company
  "companyDetails",

  // Internal/special properties (allow these without warning)
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Allowed Product keys (camelCase) - ADD NEW FIELDS HERE
 * When you get "Unknown Product field" warnings, add the field here.
 */
const ALLOWED_PRODUCT_KEYS = new Set<string>([
  // Core identifiers
  "id",
  "name",
  "uniqueName", // Technical identifier with origin (source of truth)
  "displayName", // User-friendly name for documents (without origin)
  "fullName", // Deprecated alias for uniqueName
  "title",

  // Category & Classification
  "category",
  "commodity",
  "grade",
  "gradeVariant",
  "steelGrade",

  // Dimensions
  "thickness",
  "thick",
  "width",
  "length",
  "size",
  "sizeInch",
  "nbSize",
  "diameter",
  "od",
  "dimensions",

  // Finish & Specifications
  "finish",
  "finishType",
  "surfaceFinish",
  "specifications",
  "specification",
  "schedule",

  // Pricing
  "price",
  "sellingPrice",
  "costPrice",
  "purchasePrice",
  "unitPrice",

  // Inventory & Stock
  "currentStock",
  "minStock",
  "maxStock",
  "quantity",
  "unit",
  "location",

  // Tax & Compliance
  "hsnCode",
  "gstRate",

  // Analytics & Metrics
  "revenue",
  "revenueGrowth",
  "prevRevenue",
  "sales",
  "orders",
  "ordersGrowth",
  "prevOrders",
  "quantityGrowth",
  "prevQuantity",

  // Related Data
  "supplier",
  "product",
  "description",
  "image",

  // Material Specification (8 new fields)
  "sizeInch",
  "od",
  "length",
  "gradeVariant",
  "standard",
  "formType",
  "shape",
  "condition",

  // Additional Dimensions (4 new fields)
  "height",
  "nbSize",
  "schedule",
  "diameter",

  // Computed Fields (2 new fields)
  "fullName",
  "currentStock",

  // Internal/special properties
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Allowed Customer keys (camelCase) - ADD NEW FIELDS HERE
 */
const ALLOWED_CUSTOMER_KEYS = new Set<string>([
  // Core identifiers
  "id",
  "name",
  "company",

  // Contact information
  "email",
  "phone",
  "address",

  // Tax & Compliance
  "vatNumber",
  "trn",

  // Financial
  "creditLimit",
  "currentCredit",
  "paymentTerms",
  "revenue",

  // Compliance Fields (3 new fields)
  "cinNumber", // NEW: Corporate Identification Number
  "tradeLicenseNumber", // NEW: Trade license registration
  "tradeLicenseExpiry", // NEW: Trade license expiration date

  // Metadata
  "status",
  "orders",
  "customer",

  // Internal/special properties
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Allowed Supplier keys (camelCase) - ADD NEW FIELDS HERE
 */
const ALLOWED_SUPPLIER_KEYS = new Set<string>([
  // Core identifiers
  "id",
  "name",

  // Contact information
  "email",
  "phone",
  "address",

  // Tax & Compliance
  "trn",

  // Financial
  "paymentTerms",

  // Financial & Business Info (15 new fields)
  "companyId",
  "contactPerson",
  "website",
  "category",
  "country",
  "countryId",
  "vatNumber",
  "businessLicense",
  "taxId",
  "bankDetails",
  "certifications",
  "creditLimit",
  "isActive",
  "createdAt",
  "updatedAt",
  "notes",
  "defaultCurrency",
  "currentCredit",

  // Internal/special properties
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Allowed Payment keys (camelCase) - ADD NEW FIELDS HERE
 */
const ALLOWED_PAYMENT_KEYS = new Set<string>([
  // Core identifiers
  "id",
  "invoiceNumber",

  // Payment details
  "amount",
  "paymentDate",
  "date",

  // Payment method/mode
  "paymentMethod",
  "paymentMode",
  "method",

  // Reference tracking
  "referenceNumber",
  "reference",
  "receiptNumber",
  "receiptGenerated",

  // Notes & metadata
  "notes",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",

  // Void tracking (4 fields)
  "voided",
  "voidedAt",
  "voidedBy",
  "voidReason",

  // Internal/special properties
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Allowed PurchaseOrder keys (camelCase) - ADD NEW FIELDS HERE
 */
const ALLOWED_PURCHASE_ORDER_KEYS = new Set<string>([
  // Core identifiers
  "poNumber",
  "poDate",
  "dueDate",
  "expectedDeliveryDate",

  // Supplier information
  "supplierName",
  "supplierEmail",
  "supplierPhone",
  "supplierAddress",
  "supplierTRN",
  "supplierContactName",
  "supplierContactEmail",
  "supplierContactPhone",

  // Buyer information
  "buyerName",
  "buyerEmail",
  "buyerPhone",
  "buyerDepartment",

  // Financial
  "subtotal",
  "vatAmount",
  "total",
  "currency",

  // Discounts & Charges
  "discountPercentage",
  "discountAmount",
  "discountType",
  "shippingCharges",
  "freightCharges",
  "handlingCharges",
  "otherCharges",

  // Terms & Conditions
  "terms",
  "paymentTerms",
  "incoterms",

  // Items & Status
  "items",
  "stockStatus",

  // Approval workflow (6 fields)
  "approvalStatus",
  "approvalDate",
  "approvedBy",
  "approvedAt",
  "approvalComments",
  "rejectionReason",

  // Stock tracking (3 fields)
  "stockReceived",
  "stockReceivedDate",
  "partialReceived",

  // Payment tracking (3 fields)
  "paymentStatus",
  "paidAmount",
  "outstandingAmount",

  // Audit trail (4 fields)
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",

  // Notes
  "notes",
  "id",
  "companyId",

  // Internal/special properties
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Allowed DeliveryNote keys (camelCase) - ADD NEW FIELDS HERE
 */
const ALLOWED_DELIVERY_NOTE_KEYS = new Set<string>([
  // Core identifiers
  "id",
  "deliveryNoteNumber",
  "deliveryDate",

  // Related documents
  "invoiceId",
  "invoiceNumber",
  "purchaseOrderId",

  // Customer & Delivery
  "customerDetails",
  "deliveryAddress",

  // Driver & Vehicle
  "driverName",
  "driverPhone",
  "vehicleNumber",

  // Items & Status
  "items",
  "status",
  "isPartial",

  // PDF generation (2 fields)
  "pdfUrl",
  "pdfGeneratedAt",

  // Customer linkage
  "customerId",

  // Audit trail (4 fields)
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",

  // Notes & Metadata
  "notes",
  "hasNotes",
  "tooltip",
  "enabled",
  "companyId",

  // Internal/special properties
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "__proto__",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Common snake_case Invoice fields that developers might accidentally use
 * These trigger LOUD warnings with stack traces
 */
const FORBIDDEN_SNAKE_CASE_FIELDS = new Set([
  "invoice_number",
  "invoice_date",
  "due_date",
  "customer_id",
  "customer_details",
  "customer_name",
  "vat_amount",
  "total_amount",
  "payment_status",
  "sales_agent_id",
  "sales_agent_name",
  "commission_amount",
  "commission_calculated",
  "balance_due",
  "delivery_status",
  "deleted_at",
  "created_at",
  "updated_at",
  "last_payment_date",
  "deletion_reason",
  "recreated_from",
  "terms_and_conditions",
  "company_details",
]);

/**
 * Wrap an Invoice object with a dev-time Proxy that warns on snake_case access
 * @param invoice - The normalized Invoice object
 * @returns Proxied invoice (dev) or original invoice (production)
 */
export function guardInvoiceDev(invoice: Invoice): Invoice {
  // In production, return the invoice as-is (zero overhead)
  if (import.meta.env.PROD) {
    return invoice;
  }

  // In development, wrap with a Proxy that monitors property access
  return new Proxy(invoice, {
    get(target, prop: string | symbol, receiver) {
      // Ignore symbol properties (used by React, JSON.stringify, etc.)
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      // 🚨 CRITICAL ERROR: Snake_case field accessed
      if (FORBIDDEN_SNAKE_CASE_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on Invoice!\n` +
            `\n` +
            `❌ WRONG:  invoice.${propName}\n` +
            `✅ CORRECT: invoice.${snakeToCamel(propName)}\n` +
            `\n` +
            `This is the EXACT bug that caused InvoiceList to show\n` +
            `empty cells. Frontend MUST use camelCase after\n` +
            `invoiceNormalizer processing.\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");

        // Return undefined (same as accessing non-existent property)
        return undefined;
      }

      // ⚠️ WARNING: Unknown field accessed (might be typo or new field)
      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on Invoice\n` +
            `This field is not in the known forbidden list, but contains underscore.\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      // ℹ️ INFO: Unknown but camelCase field accessed (new field or typo)
      if (!ALLOWED_INVOICE_KEYS.has(propName) && !propName.startsWith("_")) {
        console.info(
          `ℹ️ Unknown Invoice field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_INVOICE_KEYS in devGuards.ts`
        );
      }

      // Return the actual property value
      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      // Warn on setting snake_case properties
      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on Invoice! ` + `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of invoices in development
 * @param invoices - Array of normalized invoices
 * @returns Guarded invoices (dev) or original (production)
 */
export function guardInvoicesDev(invoices: Invoice[]): Invoice[] {
  if (import.meta.env.PROD) {
    return invoices;
  }

  return invoices.map(guardInvoiceDev);
}

/**
 * Common snake_case Product fields that developers might accidentally use
 */
const FORBIDDEN_SNAKE_CASE_PRODUCT_FIELDS = new Set([
  "product_name",
  "full_name",
  "cost_price",
  "selling_price",
  "purchase_price",
  "unit_price",
  "current_stock",
  "min_stock",
  "max_stock",
  "hsn_code",
  "gst_rate",
  "grade_variant",
  "steel_grade",
  "surface_finish",
  "finish_type",
  "nb_size",
  "size_inch",
  "revenue_growth",
  "orders_growth",
  "quantity_growth",
  "prev_revenue",
  "prev_orders",
  "prev_quantity",
]);

/**
 * Wrap a Product object with a dev-time Proxy
 * @param product - The normalized Product object
 * @returns Proxied product (dev) or original product (production)
 */
export function guardProductDev(product: unknown): unknown {
  if (import.meta.env.PROD) {
    return product;
  }

  return new Proxy(product, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      // 🚨 CRITICAL ERROR: Snake_case field accessed
      if (FORBIDDEN_SNAKE_CASE_PRODUCT_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on Product!\n` +
            `\n` +
            `❌ WRONG:  product.${propName}\n` +
            `✅ CORRECT: product.${snakeToCamel(propName)}\n` +
            `\n` +
            `Frontend MUST use camelCase after normalizeProduct (fieldAccessors.js).\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");
        return undefined;
      }

      // ⚠️ WARNING: Unknown snake_case field
      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on Product\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      // ℹ️ INFO: Unknown camelCase field
      if (!ALLOWED_PRODUCT_KEYS.has(propName) && !propName.startsWith("_")) {
        console.warn(
          `ℹ️ Unknown Product field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_PRODUCT_KEYS in devGuards.ts`
        );
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_PRODUCT_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on Product! ` + `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of products in development
 * @param products - Array of normalized products
 * @returns Guarded products (dev) or original (production)
 */
export function guardProductsDev(products: unknown[]): unknown[] {
  if (import.meta.env.PROD) {
    return products;
  }

  return products.map(guardProductDev);
}

/**
 * Common snake_case Customer fields
 */
const FORBIDDEN_SNAKE_CASE_CUSTOMER_FIELDS = new Set([
  "customer_name",
  "company_name",
  "email_address",
  "phone_number",
  "vat_number",
  "tax_registration_number",
  "credit_limit",
  "current_credit",
  "payment_terms",
]);

/**
 * Wrap a Customer object with a dev-time Proxy
 */
export function guardCustomerDev(customer: unknown): unknown {
  if (import.meta.env.PROD) {
    return customer;
  }

  return new Proxy(customer, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      if (FORBIDDEN_SNAKE_CASE_CUSTOMER_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on Customer!\n` +
            `\n` +
            `❌ WRONG:  customer.${propName}\n` +
            `✅ CORRECT: customer.${snakeToCamel(propName)}\n` +
            `\n` +
            `Frontend MUST use camelCase after customerNormalizer.\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");
        return undefined;
      }

      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on Customer\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      if (!ALLOWED_CUSTOMER_KEYS.has(propName) && !propName.startsWith("_")) {
        console.warn(
          `ℹ️ Unknown Customer field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_CUSTOMER_KEYS in devGuards.ts`
        );
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_CUSTOMER_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on Customer! ` +
            `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of customers in development
 */
export function guardCustomersDev(customers: unknown[]): unknown[] {
  if (import.meta.env.PROD) {
    return customers;
  }

  return customers.map(guardCustomerDev);
}

/**
 * Common snake_case Supplier fields
 */
const FORBIDDEN_SNAKE_CASE_SUPPLIER_FIELDS = new Set([
  "supplier_name",
  "email_address",
  "phone_number",
  "tax_registration_number",
  "payment_terms",
]);

/**
 * Wrap a Supplier object with a dev-time Proxy
 */
export function guardSupplierDev(supplier: unknown): unknown {
  if (import.meta.env.PROD) {
    return supplier;
  }

  return new Proxy(supplier, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      if (FORBIDDEN_SNAKE_CASE_SUPPLIER_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on Supplier!\n` +
            `\n` +
            `❌ WRONG:  supplier.${propName}\n` +
            `✅ CORRECT: supplier.${snakeToCamel(propName)}\n` +
            `\n` +
            `Frontend MUST use camelCase after supplierNormalizer.\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");
        return undefined;
      }

      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on Supplier\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      if (!ALLOWED_SUPPLIER_KEYS.has(propName) && !propName.startsWith("_")) {
        console.log(
          `ℹ️ Unknown Supplier field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_SUPPLIER_KEYS in devGuards.ts`
        );
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_SUPPLIER_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on Supplier! ` +
            `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of suppliers in development
 */
export function guardSuppliersDev(suppliers: unknown[]): unknown[] {
  if (import.meta.env.PROD) {
    return suppliers;
  }

  return suppliers.map(guardSupplierDev);
}

/**
 * Common snake_case Payment fields
 */
const FORBIDDEN_SNAKE_CASE_PAYMENT_FIELDS = new Set([
  "payment_date",
  "payment_method",
  "payment_mode",
  "reference_number",
  "receipt_number",
  "invoice_number",
  "created_at",
  "voided_at",
]);

/**
 * Wrap a Payment object with a dev-time Proxy
 */
export function guardPaymentDev(payment: unknown): unknown {
  if (import.meta.env.PROD) {
    return payment;
  }

  return new Proxy(payment, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      if (FORBIDDEN_SNAKE_CASE_PAYMENT_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on Payment!\n` +
            `\n` +
            `❌ WRONG:  payment.${propName}\n` +
            `✅ CORRECT: payment.${snakeToCamel(propName)}\n` +
            `\n` +
            `Frontend MUST use camelCase after paymentNormalizer.\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");
        return undefined;
      }

      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on Payment\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      if (!ALLOWED_PAYMENT_KEYS.has(propName) && !propName.startsWith("_")) {
        console.log(
          `ℹ️ Unknown Payment field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_PAYMENT_KEYS in devGuards.ts`
        );
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_PAYMENT_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on Payment! ` + `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of payments in development
 */
export function guardPaymentsDev(payments: unknown[]): unknown[] {
  if (import.meta.env.PROD) {
    return payments;
  }

  return payments.map(guardPaymentDev);
}

/**
 * Common snake_case PurchaseOrder fields
 */
const FORBIDDEN_SNAKE_CASE_PURCHASE_ORDER_FIELDS = new Set([
  "po_number",
  "po_date",
  "due_date",
  "expected_delivery_date",
  "supplier_name",
  "supplier_email",
  "supplier_phone",
  "supplier_address",
  "supplier_trn",
  "supplier_contact_name",
  "supplier_contact_email",
  "supplier_contact_phone",
  "buyer_name",
  "buyer_email",
  "buyer_phone",
  "buyer_department",
  "vat_amount",
  "discount_percentage",
  "discount_amount",
  "discount_type",
  "shipping_charges",
  "freight_charges",
  "handling_charges",
  "other_charges",
  "payment_terms",
  "stock_status",
  "approval_status",
  "approval_date",
  "approved_by",
  "approval_comments",
]);

/**
 * Wrap a PurchaseOrder object with a dev-time Proxy
 */
export function guardPurchaseOrderDev(purchaseOrder: unknown): unknown {
  if (import.meta.env.PROD) {
    return purchaseOrder;
  }

  return new Proxy(purchaseOrder, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      if (FORBIDDEN_SNAKE_CASE_PURCHASE_ORDER_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on PurchaseOrder!\n` +
            `\n` +
            `❌ WRONG:  purchaseOrder.${propName}\n` +
            `✅ CORRECT: purchaseOrder.${snakeToCamel(propName)}\n` +
            `\n` +
            `Frontend MUST use camelCase after purchaseOrderNormalizer.\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");
        return undefined;
      }

      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on PurchaseOrder\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      if (!ALLOWED_PURCHASE_ORDER_KEYS.has(propName) && !propName.startsWith("_")) {
        console.log(
          `ℹ️ Unknown PurchaseOrder field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_PURCHASE_ORDER_KEYS in devGuards.ts`
        );
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_PURCHASE_ORDER_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on PurchaseOrder! ` +
            `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of purchase orders in development
 */
export function guardPurchaseOrdersDev(purchaseOrders: unknown[]): unknown[] {
  if (import.meta.env.PROD) {
    return purchaseOrders;
  }

  return purchaseOrders.map(guardPurchaseOrderDev);
}

/**
 * Common snake_case DeliveryNote fields
 */
const FORBIDDEN_SNAKE_CASE_DELIVERY_NOTE_FIELDS = new Set([
  "delivery_note_number",
  "delivery_date",
  "invoice_id",
  "invoice_number",
  "purchase_order_id",
  "customer_details",
  "delivery_address",
  "driver_name",
  "driver_phone",
  "vehicle_number",
  "is_partial",
  "has_notes",
]);

/**
 * Wrap a DeliveryNote object with a dev-time Proxy
 */
export function guardDeliveryNoteDev(deliveryNote: unknown): unknown {
  if (import.meta.env.PROD) {
    return deliveryNote;
  }

  return new Proxy(deliveryNote, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      if (FORBIDDEN_SNAKE_CASE_DELIVERY_NOTE_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
            `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Snake_case field '${propName}' accessed on DeliveryNote!\n` +
            `\n` +
            `❌ WRONG:  deliveryNote.${propName}\n` +
            `✅ CORRECT: deliveryNote.${snakeToCamel(propName)}\n` +
            `\n` +
            `Frontend MUST use camelCase after deliveryNoteNormalizer.\n` +
            `\n` +
            `Fix this immediately in:\n` +
            `${stack?.split("\n")[2] || "Unknown location"}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace("Full stack trace:");
        return undefined;
      }

      if (propName.includes("_")) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
            `⚠️ WARNING: Snake_case property '${propName}' accessed on DeliveryNote\n` +
            `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
            `Location: ${stack?.split("\n")[2] || "Unknown"}\n`
        );
      }

      if (!ALLOWED_DELIVERY_NOTE_KEYS.has(propName) && !propName.startsWith("_")) {
        console.log(
          `ℹ️ Unknown DeliveryNote field '${propName}' accessed. ` +
            `If this is a new field, add it to ALLOWED_DELIVERY_NOTE_KEYS in devGuards.ts`
        );
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      if (typeof prop === "string" && FORBIDDEN_SNAKE_CASE_DELIVERY_NOTE_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on DeliveryNote! ` +
            `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  });
}

/**
 * Guard an array of delivery notes in development
 */
export function guardDeliveryNotesDev(deliveryNotes: unknown[]): unknown[] {
  if (import.meta.env.PROD) {
    return deliveryNotes;
  }

  return deliveryNotes.map(guardDeliveryNoteDev);
}

/**
 * Simple snake_case to camelCase converter for error messages
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
