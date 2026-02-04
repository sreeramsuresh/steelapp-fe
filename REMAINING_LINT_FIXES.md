# Remaining Biome Linting Fixes

Current state: **617 errors + 42 warnings = 659 total issues**

## Summary of Progress

**Original:** 2,021 errors + 102 warnings = 2,123 total  
**Current:** 617 errors + 42 warnings = 659 total  
**Fixed:** 1,464 issues (69% reduction)

---

## Remaining Issues by Category

### 1. Exhaustive Dependencies (143 errors) - REQUIRES MANUAL REVIEW

**Issue:** Functions/values change on every render and shouldn't be in hook dependency arrays.

**Solution:** Wrap in `useCallback()` or `useMemo()` with appropriate dependencies.

**Example Fix:**
```javascript
// Before
const loadData = async () => {
  // ... fetch logic
};

useEffect(() => {
  loadData();
}, [loadData]); // ❌ loadData changes every render

// After
const loadData = useCallback(async () => {
  // ... fetch logic  
}, []); // ✅ Stable reference

useEffect(() => {
  loadData();
}, [loadData]);
```

**Files Affected:**
- `src/components/AllocationDrawer/index.jsx` (10 errors)
- `src/components/AnalyticsSidebar.jsx` (2 errors)
- `src/components/CommissionPlans.jsx` (1 error)
- `src/components/CommissionTransactions.jsx` (1 error)
- Many other component files

**Why Manual:** Incorrect dependencies can cause infinite loops or stale closures.

---

### 2. Semantic Elements (92 errors) - CAN BE PARTIALLY AUTOMATED

**Issue:** Using `<div role="button">` instead of semantic `<button>` elements.

**Solution:** Replace with `<button type="button">` and remove `role="button"`, `tabIndex={0}`.

**Example Fix:**
```jsx
// Before
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
  Click me
</div>

// After  
<button
  type="button"
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
  Click me
</button>
```

**Caution:** Some `role` attributes serve different purposes (checkbox, radio, etc.).

---

### 3. Invalid Use Before Declaration (82 errors) - SAFE TO FIX

**Issue:** Variables/functions used before they're declared (hoisting issues).

**Solution:** Move function declarations before their first use.

**Example Fix:**
```javascript
// Before
useEffect(() => {
  loadData(); // ❌ Used here
}, [loadData]);

const loadData = async () => { // ❌ Declared here
  // ...
};

// After
const loadData = useCallback(async () => { // ✅ Declare first
  // ...
}, []);

useEffect(() => {
  loadData(); // ✅ Use after
}, [loadData]);
```

**Note:** Often overlaps with exhaustive dependencies - fix both together.

---

### 4. Explicit Any (32 warnings) - TYPE SAFETY

**Issue:** Using `any` type instead of specific types.

**Solution:** Replace with proper TypeScript types.

**Common Replacements:**
- `any` → `unknown` (when type is truly unknown)
- `any` → `Record<string, unknown>` (for objects)
- `any` → specific interface/type
- Function parameters: remove type annotation if it can be inferred

**Remaining Locations:**
- `src/utils/*Normalizer.ts` - function signatures (24 warnings)
- Other utility files (8 warnings)

---

### 5. Iterable Callback Return (28 errors) - LOGIC ERRORS

**Issue:** Using `forEach` where `map` is intended, or returning values from `forEach`.

**Solution:** Use correct array method.

**Example Fix:**
```javascript
// Before
items.forEach(item => {
  return item.id; // ❌ forEach doesn't return
});

// After - Option 1: Use map
const ids = items.map(item => item.id);

// After - Option 2: Remove return
items.forEach(item => {
  processItem(item); // Just side effects
});
```

---

### 6. Label Without Control (21 errors) - ACCESSIBILITY

**Issue:** `<label>` elements not associated with form inputs.

**Solution:** Add `htmlFor` attribute or nest input inside label.

**Example Fix:**
```jsx
// Before
<label>Name</label>
<input id="name" />

// After - Option 1: htmlFor
<label htmlFor="name">Name</label>
<input id="name" />

// After - Option 2: Nesting
<label>
  Name
  <input />
</label>
```

---

### 7. Key With Click Events (19 errors) - ACCESSIBILITY

**Issue:** Click handlers without keyboard equivalents.

**Solution:** Add `onKeyDown` handler for Enter/Space keys.

**Example Fix:**
```jsx
// Before
<div onClick={handleClick}>
  Click me
</div>

// After
<div
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
>
  Click me
</div>

// Better: Use a button instead!
<button type="button" onClick={handleClick}>
  Click me
</button>
```

---

### 8. Array Index Keys (11 errors) - REACT BEST PRACTICE

**Issue:** Using array index as React `key` prop.

**Solution:** Use stable unique identifier.

**Example Fix:**
```jsx
// Before
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// After
{items.map((item) => (
  <div key={item.id || item.name}>{item.name}</div>
))}
```

---

### 9. Static Element Interactions (12 errors) - ACCESSIBILITY

**Issue:** Interactive elements without proper role.

**Solution:** Add appropriate `role` attribute or use semantic element.

---

### 10. SVG Without Title (7 errors) - ACCESSIBILITY

**Issue:** SVG elements missing alternative text.

**Solution:** Add `<title>` element inside SVG or `aria-label` attribute.

**Example Fix:**
```jsx
// Before
<svg viewBox="0 0 24 24">
  <path d="..." />
</svg>

// After - Option 1: Title element
<svg viewBox="0 0 24 24">
  <title>Icon description</title>
  <path d="..." />
</svg>

// After - Option 2: aria-label
<svg aria-label="Icon description" viewBox="0 0 24 24">
  <path d="..." />
</svg>
```

---

### 11. Button Type (4 errors) - BEST PRACTICE

**Issue:** `<button>` elements without explicit `type` attribute.

**Solution:** Add `type="button"`, `type="submit"`, or `type="reset"`.

---

### 12. Minor Issues (< 5 errors each)

- **useAriaPropsSupportedByRole** (2 errors): ARIA props on unsupported roles
- **noAssignInExpressions** (4 errors): Assignments in expressions
- **noDocumentCookie** (4 warnings): Direct cookie access (security)
- **noUnusedVariables** (2 warnings): Unused variables
- **noUnusedFunctionParameters** (4 warnings): Unused parameters

---

## Recommended Fix Order

1. **Button types** (4 errors) - Quick automated fix
2. **Array index keys** (11 errors) - Already mostly fixed, finish remaining
3. **SVG titles** (7 errors) - Quick accessibility wins
4. **Label without control** (21 errors) - Straightforward
5. **Iterable callback return** (28 errors) - Logic improvements
6. **Key with click events** (19 errors) - Add keyboard handlers
7. **Semantic elements** (92 errors) - Replace divs with buttons
8. **Invalid use before declaration** (82 errors) - Reorder declarations
9. **Exhaustive dependencies** (143 errors) - LAST, most complex

---

## Automated Fix Scripts

See commit history for Python scripts that partially automate:
- Button type additions
- Array index key replacements
- Explicit any → unknown conversions
- SVG title additions

**Warning:** Always review automated changes before committing.

---

## Testing After Fixes

After each category of fixes:

```bash
# Run Biome check
npx biome check src --write --unsafe --vcs-enabled=false

# Run type check
npm run typecheck

# Run tests
npm test

# Start dev server and manually test affected components
npm run dev
```

---

Last updated: 2026-02-04
