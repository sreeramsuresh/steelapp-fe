# Form Validation Rules & Standards

## 📋 Overview

This document defines the **mandatory validation standards** for all forms in the Ultimate Steels application. These rules ensure consistent user experience, reduce errors, and provide clear feedback when required fields are missing or invalid.

---

## 🎯 When to Apply These Rules

**MANDATORY** for all forms that have:
- ✅ Save / Submit / Create / Update / Finalize buttons
- ✅ Required fields (user input that must be validated)
- ✅ Data persistence to database
- ✅ Business-critical operations (invoices, orders, customers, etc.)

**EXAMPLES:**
- Invoice Form ✅
- Purchase Order Form ✅
- Quotation Form ✅
- Delivery Note Form ✅
- Customer Management Form ✅
- Product Management Form ✅
- Payment Modals ✅
- Any form that creates/updates records ✅

---

## 🔧 Required Implementation Components

### 1. **State Variables** (Required)

Every form MUST have these state variables:

```javascript
// Validation state - MANDATORY for all forms
const [validationErrors, setValidationErrors] = useState([]);
const [invalidFields, setInvalidFields] = useState(new Set());
```

**Purpose:**
- `validationErrors` - Array of error messages to display to user
- `invalidFields` - Set of field identifiers to highlight with red borders

---

### 2. **Validation Function** (Required)

Every form MUST validate before saving:

```javascript
const handleSave = async () => {
  // STEP 1: Validate all required fields
  const errors = [];
  const invalidFieldsSet = new Set();

  // Example validations:
  if (!formData.name || formData.name.trim() === '') {
    errors.push('Name is required');
    invalidFieldsSet.add('name');
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push('Valid email is required');
    invalidFieldsSet.add('email');
  }

  // If errors exist, show them and STOP
  if (errors.length > 0) {
    setValidationErrors(errors);
    setInvalidFields(invalidFieldsSet);

    // Auto-scroll to error alert
    setTimeout(() => {
      const errorAlert = document.getElementById('validation-errors-alert');
      if (errorAlert) {
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    return; // STOP - do not proceed with save
  }

  // STEP 2: Clear any previous errors
  setValidationErrors([]);
  setInvalidFields(new Set());

  // STEP 3: Proceed with save operation
  try {
    await saveData(formData);
    // Success handling...
  } catch (error) {
    // Error handling...
  }
};
```

---

### 3. **Persistent Error Alert** (Required)

Every form MUST display validation errors in a persistent alert box:

```jsx
{/* Validation Errors Alert - MANDATORY */}
{validationErrors.length > 0 && (
  <div
    id="validation-errors-alert"
    className={`mt-6 p-4 rounded-lg border-2 ${
      isDarkMode
        ? "bg-red-900/20 border-red-600 text-red-200"
        : "bg-red-50 border-red-500 text-red-800"
    }`}
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`} size={24} />
      <div className="flex-1">
        <h4 className="font-bold text-lg mb-2">
          Please fix the following errors:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        <button
          onClick={() => {
            setValidationErrors([]);
            setInvalidFields(new Set());
          }}
          className={`mt-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            isDarkMode
              ? "bg-red-800 hover:bg-red-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
)}
```

**Position:** Place IMMEDIATELY after Save/Submit button, BEFORE any other content

---

### 4. **Field-Level Error Highlighting** (Required)

Every input field MUST support error highlighting:

```jsx
{/* Text Input Example */}
<Input
  label="Customer Name"
  value={formData.name}
  onChange={(e) => setFormData({...formData, name: e.target.value})}
  error={invalidFields.has('name')}  // REQUIRED - red border if invalid
/>

{/* Select/Dropdown Example */}
<Select
  label="Status"
  value={formData.status}
  onChange={(e) => setFormData({...formData, status: e.target.value})}
  error={invalidFields.has('status')}  // REQUIRED
>
  <option value="">Select status</option>
  <option value="active">Active</option>
</Select>

{/* Array Items Example (multiple items in list) */}
{items.map((item, index) => (
  <Input
    label="Item Name"
    value={item.name}
    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
    error={invalidFields.has(`item.${index}.name`)}  // REQUIRED - use index
  />
))}
```

**Field Naming Convention for Arrays:**
- Single fields: `'fieldName'` (e.g., `'name'`, `'email'`)
- Array items: `'item.{index}.fieldName'` (e.g., `'item.0.quantity'`, `'item.2.rate'`)
- Nested objects: `'object.fieldName'` (e.g., `'customer.name'`, `'address.city'`)

---

### 5. **Error Message Standards** (Required)

Error messages MUST be:
- ✅ **Specific** - Include field name
- ✅ **Clear** - User understands what's wrong
- ✅ **Actionable** - User knows how to fix it

**Examples:**

❌ **Bad:**
```javascript
errors.push('Please fill required fields');
errors.push('Invalid input');
errors.push('Error');
```

✅ **Good:**
```javascript
errors.push('Customer name is required');
errors.push('Email must be a valid email address');
errors.push('Quantity must be greater than 0');
errors.push('Item 3: Rate must be greater than 0');
errors.push('Due date must be after invoice date');
```

---

## 📐 Component Requirements

### Input Component Requirements

All input components (Input, Select, Autocomplete, etc.) MUST accept an `error` prop:

```javascript
const Input = ({ label, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${
          isDarkMode ? "text-gray-400" : "text-gray-700"
        }`}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-lg ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white"
            : "border-gray-300 bg-white text-gray-900"
        } ${error ? "border-red-500" : ""} ${className}`}  // REQUIRED
        {...props}
      />
      {error && (
        <p className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
          {error}
        </p>
      )}
    </div>
  );
};
```

**Key Requirements:**
- Accept `error` prop (boolean or string)
- Add `border-red-500` class when error is truthy
- Optionally display error message if error is a string

---

## 🎨 Visual Requirements

### Color Scheme (Required)

**Error Alert Box:**
- Light mode: `bg-red-50 border-red-500 text-red-800`
- Dark mode: `bg-red-900/20 border-red-600 text-red-200`

**Invalid Field Borders:**
- All modes: `border-red-500`

**Error Text:**
- Light mode: `text-red-600`
- Dark mode: `text-red-400`

**Alert Icon:**
- Use `AlertTriangle` from lucide-react
- Size: 24px
- Color: red-400 (dark) / red-600 (light)

---

## 📝 Validation Rules by Field Type

### Text Fields (Required)
```javascript
// Check if empty or whitespace only
if (!value || value.trim() === '') {
  errors.push('Field name is required');
  invalidFieldsSet.add('fieldName');
}
```

### Email Fields
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!value || !emailRegex.test(value)) {
  errors.push('Valid email is required');
  invalidFieldsSet.add('email');
}
```

### Number Fields (Amount, Quantity, Rate)
```javascript
if (!value || value <= 0) {
  errors.push('Quantity must be greater than 0');
  invalidFieldsSet.add('quantity');
}
```

### Date Fields
```javascript
if (!value) {
  errors.push('Date is required');
  invalidFieldsSet.add('date');
}

// Date range validation
if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  errors.push('Start date must be before end date');
  invalidFieldsSet.add('startDate');
  invalidFieldsSet.add('endDate');
}
```

### Array/List Fields (Items)
```javascript
if (!items || items.length === 0) {
  errors.push('At least one item is required');
}

items.forEach((item, index) => {
  if (!item.name || item.name.trim() === '') {
    errors.push(`Item ${index + 1}: Product name is required`);
    invalidFieldsSet.add(`item.${index}.name`);
  }
  if (!item.quantity || item.quantity <= 0) {
    errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    invalidFieldsSet.add(`item.${index}.quantity`);
  }
});
```

### Select/Dropdown Fields
```javascript
if (!value || value === '' || value === 'null' || value === 'undefined') {
  errors.push('Please select a valid option');
  invalidFieldsSet.add('selectField');
}
```

### File Upload Fields
```javascript
if (!file) {
  errors.push('Please select a file to upload');
  invalidFieldsSet.add('file');
}

const maxSize = 5 * 1024 * 1024; // 5MB
if (file && file.size > maxSize) {
  errors.push('File size must be less than 5MB');
  invalidFieldsSet.add('file');
}

const allowedTypes = ['application/vnd.ms-excel', 'text/csv'];
if (file && !allowedTypes.includes(file.type)) {
  errors.push('File must be Excel or CSV format');
  invalidFieldsSet.add('file');
}
```

---

## ✅ Complete Implementation Checklist

When creating a new form, ensure ALL of these are implemented:

- [ ] 1. Add `validationErrors` state variable
- [ ] 2. Add `invalidFields` state variable
- [ ] 3. Create validation function in save handler
- [ ] 4. Validate ALL required fields before save
- [ ] 5. Set validation errors and invalid fields if validation fails
- [ ] 6. Return early (don't save) if validation fails
- [ ] 7. Add persistent error alert after Save button
- [ ] 8. Add auto-scroll to error alert
- [ ] 9. Add Dismiss button to clear errors
- [ ] 10. Add `error` prop to all input components
- [ ] 11. Use specific, clear error messages
- [ ] 12. Test with missing required fields
- [ ] 13. Test with invalid field values
- [ ] 14. Test error dismissal
- [ ] 15. Test field highlighting (red borders)

---

## 📚 Reference Implementation

See **Invoice Form** (`/src/pages/InvoiceForm.jsx`) for complete reference implementation:
- Lines 633-640: State variables
- Lines 1281-1333: Validation function
- Lines 1716-1753: Persistent error alert
- Lines 1947, 1818, 1826, 2256, 2287, 2342: Field error props

---

## 🚫 Common Mistakes to Avoid

### ❌ DON'T:
```javascript
// Don't use toast/temporary notifications for validation errors
notificationService.error('Please fill required fields'); // BAD

// Don't use generic error messages
errors.push('Invalid input'); // BAD

// Don't forget to clear errors on success
await saveData(); // Missing: setValidationErrors([])

// Don't allow save when validation fails
if (errors.length > 0) {
  setValidationErrors(errors);
  // Missing: return statement
}
await saveData(); // WRONG - will still save even with errors
```

### ✅ DO:
```javascript
// Use persistent error alert
setValidationErrors(['Customer name is required']); // GOOD

// Use specific error messages
errors.push('Item 2: Quantity must be greater than 0'); // GOOD

// Clear errors on successful save
setValidationErrors([]);
setInvalidFields(new Set());

// Return early when validation fails
if (errors.length > 0) {
  setValidationErrors(errors);
  setInvalidFields(invalidFieldsSet);
  return; // GOOD - stops execution
}
```

---

## 🔄 Validation Flow Diagram

```
User clicks "Save" button
         ↓
Run validation function
         ↓
Check all required fields
         ↓
   [Any errors?]
    ↙        ↘
  YES        NO
   ↓          ↓
Set errors   Clear errors
   ↓          ↓
Show alert   Save data
   ↓          ↓
Highlight    Show success
fields       ↓
   ↓       Navigate away
Return
(STOP)
```

---

## 📞 Support & Questions

If you have questions about implementing validation for a specific form:
1. Review this document
2. Check reference implementation (InvoiceForm.jsx)
3. Follow the validation pattern consistently
4. Test thoroughly before deployment

---

## 📝 Version History

- **v1.0** (2025-01-07): Initial validation standards document
  - Defined mandatory validation requirements
  - Established error display patterns
  - Created validation rule templates
  - Added reference implementation links

---

## 🎯 Summary

**Every form MUST have:**
1. ✅ Validation state variables (`validationErrors`, `invalidFields`)
2. ✅ Pre-save validation function
3. ✅ Persistent error alert with dismiss button
4. ✅ Red border highlighting on invalid fields
5. ✅ Specific, actionable error messages
6. ✅ Auto-scroll to error alert
7. ✅ Early return on validation failure (prevent save)

**This is NOT optional** - it's a mandatory standard for all forms in the Ultimate Steels application.

---

*Last Updated: January 7, 2025*
