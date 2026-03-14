import { z } from "zod";

// UI-layer validation schemas for forms (camelCase, NOT API shape)
// These match the form state variables in each component.

// --- Date helpers ---
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// --- Invoice ---

const InvoiceItemSchema = z.object({
  productId: z
    .number({ required_error: "Product is required" })
    .int()
    .positive("Product must be selected")
    .nullable()
    .refine((val) => val !== null, { message: "Product must be selected" }),
  name: z.string().min(1, "Product name is required"),
  quantity: z.number({ required_error: "Quantity is required" }).positive("Quantity must be greater than 0"),
  rate: z.number({ required_error: "Rate is required" }).nonnegative("Rate must be 0 or greater"),
  // Optional item fields that the form tracks
  discount: z.number().nonnegative().optional().default(0),
  vatRate: z.number().nonnegative().optional().default(5),
});

export const InvoiceFormSchema = z.object({
  customer: z.object({
    id: z.union([z.string().min(1), z.number().positive()]).refine((val) => val, { message: "Customer is required" }),
    name: z.string().min(1, "Customer name is required"),
  }),
  date: dateString,
  dueDate: dateString,
  status: z.enum(["draft", "proforma", "issued"]).optional().default("draft"),
  modeOfPayment: z.string().optional().default(""),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional().default(""),
  // Additional invoice fields that may be present
  discountType: z.enum(["amount", "percentage"]).optional(),
  discountAmount: z.number().nonnegative().optional().default(0),
  discountPercentage: z.number().nonnegative().optional().default(0),
});

// --- Payment ---
// Matches the state variables in AddPaymentForm: date, amount, method, reference, notes

const paymentMethodValues = [
  "cash",
  "cheque",
  "pdc",
  "bank_transfer",
  "credit_card",
  "debit_card",
  "online",
  "wire_transfer",
  "mobile_wallet",
  "other",
];

export const PaymentFormSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).positive("Amount must be greater than 0"),
  method: z.enum(paymentMethodValues, {
    errorMap: () => ({ message: "Payment method is required" }),
  }),
  date: dateString,
  reference: z.string().max(100, "Reference must be 100 characters or less").optional().default(""),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional().default(""),
  // Multi-currency fields
  currency: z.string().min(1).optional().default("AED"),
  exchangeRate: z.number().positive().optional().default(1),
});

// --- Customer ---
// Matches formData state in CustomerForm.jsx

const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

export const CustomerFormSchema = z.object({
  name: z
    .string({ required_error: "Customer name is required" })
    .min(2, "Customer name must be at least 2 characters")
    .max(200, "Customer name must be 200 characters or less"),
  company: z.string().max(200).optional().default(""),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(E164_PATTERN, "Phone must be in E.164 format (e.g., +971501234567)")
    .optional()
    .or(z.literal("")),
  alternatePhone: z
    .string()
    .regex(E164_PATTERN, "Alternate phone must be in E.164 format")
    .optional()
    .or(z.literal("")),
  customerCode: z.string().max(50).optional().default(""),
  // Address fields (structured)
  street: z.string().max(500).optional().default(""),
  city: z.string().max(200).optional().default(""),
  state: z.string().max(200).optional().default(""),
  postalCode: z.string().max(20).optional().default(""),
  country: z.string().length(2, "Country must be a 2-letter ISO code (e.g., AE)").optional().default("AE"),
  // Tax fields
  trn: z.string().max(50).optional().default(""),
  // Financial fields
  creditLimit: z.number().nonnegative().optional().default(0),
  paymentTermsDays: z.number().int().nonnegative().optional().default(0),
  defaultPaymentMethod: z.string().optional().default(""),
});
