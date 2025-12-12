# Unified Document Form System

This directory contains the unified document form orchestrator and related components.

## Architecture

```
DocumentForm (Orchestrator)
├── Config (invoiceConfig, quotationConfig, etc.)
├── Adapter (invoiceAdapter, purchaseOrderAdapter, etc.)
├── Hooks
│   ├── useDocumentState (state management)
│   ├── useDocumentCalculator (calculations)
│   └── useDocumentValidation (validation)
└── Sections
    ├── PartySection
    ├── HeaderSection
    ├── LineItemsSection
    ├── ChargesTotalsSection
    ├── NotesSection
    └── ActionsBar
```

## Usage Examples

### 1. New Invoice Form

```jsx
import { DocumentForm } from './components/documents/DocumentForm';
import { invoiceConfig } from './config/documents';
import { invoiceAdapter } from './services/documents/adapters/invoiceAdapter';

function NewInvoicePage() {
  const handleSaveSuccess = (result) => {
    console.log('Invoice saved:', result);
    // Navigate to invoice detail or list
  };

  return (
    <DocumentForm
      config={invoiceConfig}
      adapter={invoiceAdapter}
      onSaveSuccess={handleSaveSuccess}
    />
  );
}
```

### 2. Edit Invoice Form

```jsx
import { useParams } from 'react-router-dom';
import { DocumentForm } from './components/documents/DocumentForm';
import { invoiceConfig } from './config/documents';
import { invoiceAdapter } from './services/documents/adapters/invoiceAdapter';

function EditInvoicePage() {
  const { id } = useParams();

  return (
    <DocumentForm
      config={invoiceConfig}
      adapter={invoiceAdapter}
      documentId={parseInt(id)}
    />
  );
}
```

### 3. Quotation Form

```jsx
import { DocumentForm } from './components/documents/DocumentForm';
import { quotationConfig } from './config/documents';
import { quotationAdapter } from './services/documents/adapters/quotationAdapter';

function NewQuotationPage() {
  return (
    <DocumentForm
      config={quotationConfig}
      adapter={quotationAdapter}
    />
  );
}
```

### 4. Purchase Order Form

```jsx
import { DocumentForm } from './components/documents/DocumentForm';
import { purchaseOrderConfig } from './config/documents';
import { purchaseOrderAdapter } from './services/documents/adapters/purchaseOrderAdapter';

function NewPurchaseOrderPage() {
  return (
    <DocumentForm
      config={purchaseOrderConfig}
      adapter={purchaseOrderAdapter}
    />
  );
}
```

### 5. Vendor Bill Form

```jsx
import { DocumentForm } from './components/documents/DocumentForm';
import { vendorBillConfig } from './config/documents';
import { vendorBillAdapter } from './services/documents/adapters/vendorBillAdapter';

function NewVendorBillPage() {
  return (
    <DocumentForm
      config={vendorBillConfig}
      adapter={vendorBillAdapter}
    />
  );
}
```

### 6. Convert Quotation to Invoice

```jsx
import { DocumentForm } from './components/documents/DocumentForm';
import { invoiceConfig } from './config/documents';
import { invoiceAdapter } from './services/documents/adapters/invoiceAdapter';

function ConvertQuotationToInvoice({ quotationData }) {
  // Transform quotation data to initial invoice state
  const initialData = {
    ...quotationData,
    header: {
      ...quotationData.header,
      docNumber: '', // Clear quotation number
    },
    meta: {
      ...quotationData.meta,
      id: undefined, // Clear ID for new invoice
      status: 'draft',
    },
  };

  return (
    <DocumentForm
      config={invoiceConfig}
      adapter={invoiceAdapter}
      initialData={initialData}
    />
  );
}
```

## Key Principles

1. **No Type Conditionals (Rule 3)**: DocumentForm has ZERO `if (documentType === ...)` checks
2. **Config-Driven (Rule 1)**: All behavior controlled by declarative config
3. **Adapter Pattern (Rule 9)**: Clean separation between form state and API shape
4. **Slot System (Rule 7)**: Escape hatches for document-specific UI
5. **Validated Configs (Rule 13)**: Config validation runs in dev mode

## Config Structure

Each document config defines:

- **Identity**: documentType, labels, number prefix, list route
- **Party**: partyType (customer/vendor), labels
- **Features**: Boolean flags for all features (Rule 8 - explicit)
- **Header Fields**: Field configs with labels, types, visibility, editability
- **Line Columns**: Column configs with widths, formats, alignment
- **Charge Types**: Available charge types with default VAT rates
- **Defaults**: Default values for hidden required fields (Rule 11)
- **Slots**: ComponentType<SlotProps> for escape hatches (Rule 7)
- **Overrides**: Custom validators, field/column overrides

## Adapter Structure

Each adapter implements:

```typescript
interface DocumentAdapter<TApiResponse, TApiPayload> {
  toForm(apiResponse: TApiResponse): DocumentState;
  fromForm(document: DocumentState): TApiPayload;
}
```

- **toForm**: Convert API response → canonical DocumentState
- **fromForm**: Convert DocumentState → API payload

## Available Configs

- **invoiceConfig**: Full feature set (all features enabled)
- **quotationConfig**: Simplified (no locking, no stock allocation)
- **purchaseOrderConfig**: Vendor-focused (no emirate, simplified charges)
- **vendorBillConfig**: VAT input document (no discounts, no charges)

## Development

### Adding a New Document Type

1. Create config in `/config/documents/[type]Config.ts`
2. Create adapter in `/services/documents/adapters/[type]Adapter.ts`
3. Export from barrel files
4. Use DocumentForm with new config + adapter

### Adding a Custom Slot Component

```jsx
// 1. Create slot component
const StockAllocationPanel = ({ document, config, setDocument }) => {
  return (
    <div>
      <h3>Stock Allocation</h3>
      {/* Custom UI */}
    </div>
  );
};

// 2. Add to config
export const invoiceConfig = {
  // ...other config
  slots: {
    afterLineItems: StockAllocationPanel,
  },
};
```

### Running Config Validation

Config validation runs automatically in development mode when DocumentForm mounts. To manually validate:

```typescript
import { validateAndLogConfig } from './config/documents/configValidator';

validateAndLogConfig('My Config', myConfig);
// Logs warnings/errors to console
// Throws error in dev if critical issues found
```

## Testing

See `/DOCUMENT_FORM_UNIFICATION_PLAN.md` for testing strategy.

## Migration

See `/DOCUMENT_FORM_UNIFICATION_PLAN.md` Section 8 for migration strategy from old InvoiceForm.
