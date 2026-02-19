/**
 * Mock Data for Credit Note Tests
 *
 * Centralized mock data to ensure consistency across all test files
 */

// ============================================
// Mock Credit Notes
// ============================================

export const mockCreditNote = {
  id: 107,
  creditNoteNumber: "CN-2025-0007",
  invoiceId: 337,
  invoiceNumber: "INV-202512-0042",
  customerId: 8,
  customerName: "Emirates Fabrication",
  creditNoteDate: "2025-12-04T20:00:00.000Z", // ISO timestamp from backend
  status: "draft",
  reasonForReturn: "overcharge",
  creditNoteType: "ACCOUNTING_ONLY",
  manualCreditAmount: 0,
  items: [],
  subtotal: 0,
  vatAmount: 0,
  totalCredit: 0,
  notes: "",
  customer: {
    id: 8,
    name: "Emirates Fabrication",
    address: {
      street: "123 Business Bay",
      city: "Dubai",
      state: "Dubai",
      postal_code: "12345",
      country: "UAE",
    },
    phone: "+971501234567",
    email: "contact@emiratesfab.ae",
    trn: "123456789012345",
  },
};

export const mockCreditNoteWithManualAmount = {
  ...mockCreditNote,
  id: 108,
  creditNoteNumber: "CN-2025-0008",
  manualCreditAmount: 500,
  reasonForReturn: "goodwill_credit",
  totalCredit: 500,
};

export const mockCreditNoteWithItems = {
  ...mockCreditNote,
  id: 109,
  creditNoteNumber: "CN-2025-0009",
  reasonForReturn: "defective",
  creditNoteType: "RETURN_WITH_QC",
  items: [
    {
      id: 1,
      invoiceItemId: 101,
      productId: 10,
      productName: "Stainless Steel Sheet",
      description: "304 Grade",
      originalQuantity: 11,
      quantityReturned: 5,
      rate: 222,
      amount: 1110,
      vatRate: 5,
      vatAmount: 55.5,
      returnStatus: "pending",
      selected: true,
    },
  ],
  subtotal: 1110,
  vatAmount: 55.5,
  totalCredit: 1165.5,
};

export const mockIssuedCreditNote = {
  ...mockCreditNote,
  id: 110,
  status: "issued",
};

// ============================================
// Mock Invoices
// ============================================

export const mockInvoice = {
  id: 337,
  invoiceNumber: "INV-202512-0042",
  date: "2025-12-02T20:00:00.000Z", // ISO timestamp
  status: "issued",
  customerId: 8,
  customerName: "Emirates Fabrication",
  customer: {
    id: 8,
    name: "Emirates Fabrication",
    address: {
      street: "123 Business Bay",
      city: "Dubai",
      state: "Dubai",
      postal_code: "12345",
      country: "UAE",
    },
    phone: "+971501234567",
    email: "contact@emiratesfab.ae",
    trn: "123456789012345",
  },
  items: [
    {
      id: 1,
      productId: 10,
      name: "Stainless Steel Sheet",
      description: "304 Grade",
      quantity: 11,
      rate: 222,
      amount: 2442,
      vatRate: 5,
      vatAmount: 122.1,
    },
    {
      id: 2,
      productId: 20,
      name: "Stainless Steel Pipe",
      description: "316 Grade",
      quantity: 11,
      rate: 222,
      amount: 2442,
      vatRate: 5,
      vatAmount: 122.1,
    },
  ],
  subtotal: 4884,
  vatAmount: 244.2,
  total: 5128.2,
};

export const mockInvoiceSearchResults = [
  {
    id: 337,
    invoiceNumber: "INV-202512-0042",
    customerName: "Emirates Fabrication",
    customerEmail: "contact@emiratesfab.ae",
    total: 5128.2,
    invoiceDate: "2025-12-02T20:00:00.000Z",
    status: "issued",
  },
  {
    id: 338,
    invoiceNumber: "INV-202512-0043",
    customerName: "Dubai Steel Works",
    customerEmail: "info@dubaisteelworks.ae",
    total: 3250.0,
    invoiceDate: "2025-12-03T20:00:00.000Z",
    status: "issued",
  },
];

// ============================================
// Mock Company
// ============================================

export const mockCompany = {
  id: 1,
  name: "Ultimate Steel Trading LLC",
  trn: "100123456789012",
  logoUrl: "/uploads/logo.png",
  pdfLogoUrl: "/uploads/pdf-logo.png",
  pdfSealUrl: "/uploads/seal.png",
  address: {
    street: "456 Industrial Area",
    city: "Dubai",
    state: "Dubai",
    postal_code: "54321",
    country: "UAE",
  },
  phone: "+971501111111",
  email: "info@ultimatesteel.ae",
};

// ============================================
// Mock Drafts
// ============================================

export const mockDraft = {
  337: {
    data: {
      invoiceId: 337,
      invoiceNumber: "INV-202512-0042",
      creditNoteNumber: "CN-2025-0008",
      creditNoteDate: "2025-12-05",
      reasonForReturn: "goodwill_credit",
      creditNoteType: "ACCOUNTING_ONLY",
      manualCreditAmount: 500,
      items: [],
      customer: mockInvoice.customer,
      notes: "Test draft",
    },
    invoiceId: 337,
    invoiceNumber: "INV-202512-0042",
    customerName: "Emirates Fabrication",
    timestamp: Date.now(),
    expiresAt: Date.now() + 86400000, // 24 hours
  },
};

export const mockExpiredDraft = {
  337: {
    data: {
      invoiceId: 337,
      manualCreditAmount: 500,
      items: [],
    },
    invoiceId: 337,
    invoiceNumber: "INV-202512-0042",
    customerName: "Emirates Fabrication",
    timestamp: Date.now() - 86400000, // Yesterday
    expiresAt: Date.now() - 3600000, // Expired 1 hour ago
  },
};

export const mockMultipleDrafts = {
  337: {
    data: { invoiceId: 337, manualCreditAmount: 500, items: [] },
    invoiceId: 337,
    invoiceNumber: "INV-202512-0042",
    customerName: "Emirates Fabrication",
    timestamp: Date.now(),
    expiresAt: Date.now() + 86400000,
  },
  338: {
    data: { invoiceId: 338, manualCreditAmount: 750, items: [] },
    invoiceId: 338,
    invoiceNumber: "INV-202512-0043",
    customerName: "Dubai Steel Works",
    timestamp: Date.now(),
    expiresAt: Date.now() + 86400000,
  },
};

// ============================================
// Factory Functions
// ============================================

/**
 * Create a mock credit note with custom fields
 */
export const createMockCreditNote = (overrides = {}) => ({
  ...mockCreditNote,
  ...overrides,
});

/**
 * Create a mock invoice with custom fields
 */
export const createMockInvoice = (overrides = {}) => ({
  ...mockInvoice,
  ...overrides,
});

/**
 * Create a mock draft with custom fields
 */
export const createMockDraft = (invoiceId, overrides = {}) => ({
  [invoiceId]: {
    data: {
      invoiceId,
      invoiceNumber: `INV-${invoiceId}`,
      creditNoteNumber: "CN-2025-0008",
      creditNoteDate: "2025-12-05",
      reasonForReturn: "goodwill_credit",
      creditNoteType: "ACCOUNTING_ONLY",
      manualCreditAmount: 500,
      items: [],
      ...overrides.data,
    },
    invoiceId,
    invoiceNumber: `INV-${invoiceId}`,
    customerName: "Test Customer",
    timestamp: Date.now(),
    expiresAt: Date.now() + 86400000,
    ...overrides,
  },
});

// ============================================
// Test Scenarios
// ============================================

/**
 * Scenario: User creates credit note with manual amount
 */
export const scenarioManualCreditAmount = {
  invoice: mockInvoice,
  creditNote: {
    ...mockCreditNote,
    manualCreditAmount: 500,
    reasonForReturn: "goodwill_credit",
    creditNoteType: "ACCOUNTING_ONLY",
    items: [], // No items selected
  },
  expectedDraft: {
    data: {
      manualCreditAmount: 500,
      items: [],
    },
  },
};

/**
 * Scenario: User creates credit note with item returns
 */
export const scenarioItemReturn = {
  invoice: mockInvoice,
  creditNote: mockCreditNoteWithItems,
  expectedDraft: {
    data: {
      items: [
        {
          selected: true,
          quantityReturned: 5,
        },
      ],
    },
  },
};

/**
 * Scenario: User resumes existing draft
 */
export const scenarioDraftResume = {
  existingDraft: mockDraft,
  invoice: mockInvoice,
  expectedRestored: {
    manualCreditAmount: 500,
    reasonForReturn: "goodwill_credit",
  },
};

/**
 * Scenario: Date format conversion
 */
export const scenarioDateFormat = {
  isoTimestamp: "2025-12-04T20:00:00.000Z",
  expectedInputFormat: "2025-12-05", // UAE timezone UTC+4
  expectedDisplayFormat: "12/5/2025", // or similar readable format
};

// ============================================
// API Response Mocks
// ============================================

export const mockApiResponses = {
  getNextCreditNoteNumber: {
    nextNumber: "CN-2025-0008",
  },
  createCreditNote: {
    ...mockCreditNote,
    id: 108,
    status: "draft",
  },
  updateCreditNote: {
    ...mockCreditNote,
    id: 107,
    status: "draft",
  },
  getCreditNote: mockCreditNote,
  getInvoice: mockInvoice,
  getCompany: mockCompany,
  searchForCreditNote: mockInvoiceSearchResults,
};

// ============================================
// Validation Test Cases
// ============================================

export const validationTestCases = {
  valid: {
    invoiceId: 337,
    creditNoteDate: "2025-12-05",
    reasonForReturn: "goodwill_credit",
    manualCreditAmount: 500,
  },
  missingReason: {
    invoiceId: 337,
    creditNoteDate: "2025-12-05",
    reasonForReturn: "", // Invalid
    manualCreditAmount: 500,
  },
  missingAmountAndItems: {
    invoiceId: 337,
    creditNoteDate: "2025-12-05",
    reasonForReturn: "goodwill_credit",
    manualCreditAmount: 0, // Invalid
    items: [], // No items either
  },
  physicalReturnWithoutItems: {
    invoiceId: 337,
    creditNoteDate: "2025-12-05",
    reasonForReturn: "defective", // Physical return
    creditNoteType: "RETURN_WITH_QC",
    items: [], // Invalid - must have items
  },
};

// ============================================
// Edge Cases
// ============================================

export const edgeCases = {
  invalidDate: "invalid-date-string",
  nullDate: null,
  undefinedDate: undefined,
  emptyString: "",
  zeroAmount: 0,
  negativeAmount: -100,
  veryLargeAmount: 999999999.99,
  invalidInvoiceId: "not-a-number",
  nullInvoiceId: null,
};

export default {
  mockCreditNote,
  mockCreditNoteWithManualAmount,
  mockCreditNoteWithItems,
  mockIssuedCreditNote,
  mockInvoice,
  mockInvoiceSearchResults,
  mockCompany,
  mockDraft,
  mockExpiredDraft,
  mockMultipleDrafts,
  createMockCreditNote,
  createMockInvoice,
  createMockDraft,
  scenarioManualCreditAmount,
  scenarioItemReturn,
  scenarioDraftResume,
  scenarioDateFormat,
  mockApiResponses,
  validationTestCases,
  edgeCases,
};
