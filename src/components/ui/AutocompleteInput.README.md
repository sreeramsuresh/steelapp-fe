# AutocompleteInput Component

Reusable autocomplete/combobox component with debounced search, keyboard navigation, and dark mode support.

## Features

- ✅ Debounced search (configurable delay)
- ✅ Dropdown with filtered results
- ✅ Click outside to close
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Custom item rendering
- ✅ Loading and empty states
- ✅ Dark mode support
- ✅ Async and sync filtering
- ✅ Custom display formatting

## Basic Usage

```jsx
import AutocompleteInput from './components/ui/AutocompleteInput';

function MyForm() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);

  return (
    <AutocompleteInput
      value={selectedProduct ? selectedProduct.name : ''}
      items={products}
      placeholder="Search products..."
      onSelect={(product) => setSelectedProduct(product)}
      getItemLabel={(product) => product.name}
      getItemKey={(product) => product.id}
    />
  );
}
```

## Advanced Usage - Async Search

```jsx
function ProductSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchTerm) => {
    if (!searchTerm) return;

    setLoading(true);
    try {
      const results = await productService.search({ query: searchTerm });
      setSearchResults(results.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AutocompleteInput
      items={searchResults}
      onSearch={handleSearch}
      onSelect={(product) => console.log('Selected:', product)}
      loading={loading}
      debounceMs={500}
      minSearchLength={2}
      placeholder="Type to search..."
      getItemLabel={(p) => `${p.name} (${p.sku})`}
    />
  );
}
```

## Custom Item Rendering

```jsx
<AutocompleteInput
  items={products}
  onSelect={setSelectedProduct}
  renderItem={(product, isSelected, isHighlighted) => (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{product.name}</div>
        <div className="text-sm text-gray-500">{product.sku}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">${product.price}</div>
        <div className="text-xs text-gray-400">{product.stock} in stock</div>
      </div>
    </div>
  )}
/>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Current input value |
| `items` | `Array` | `[]` | Items to display in dropdown |
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `displayValue` | `(item) => string` | `null` | Function to get display text from selected item |
| `onSearch` | `(searchTerm) => void` | `null` | Called on debounced search (for async) |
| `onSelect` | `(item) => void` | `null` | Called when item is selected |
| `onChange` | `(searchTerm) => void` | `null` | Called on immediate input change |
| `filterFn` | `(item, searchTerm) => boolean` | Default label filter | Custom filter function for sync filtering |
| `renderItem` | `(item, isSelected, isHighlighted) => ReactNode` | Default renderer | Custom item rendering |
| `getItemKey` | `(item) => any` | `item => item.id` | Get unique key for item |
| `getItemLabel` | `(item) => string` | `item => item.name \|\| item.label` | Get display label for item |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `minSearchLength` | `number` | `0` | Minimum characters before search |
| `maxResults` | `number` | `20` | Maximum results to display |
| `clearOnSelect` | `boolean` | `false` | Clear input after selection |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `string` | `null` | Error message to display |
| `disabled` | `boolean` | `false` | Disable input |
| `className` | `string` | `''` | Container CSS classes |
| `inputClassName` | `string` | `''` | Input CSS classes |
| `dropdownClassName` | `string` | `''` | Dropdown CSS classes |

## Keyboard Navigation

- **Arrow Down**: Move to next item
- **Arrow Up**: Move to previous item
- **Enter**: Select highlighted item
- **Escape**: Close dropdown and blur input

## Sync vs Async Filtering

### Sync Filtering (Local)
Use when you have all items loaded:

```jsx
<AutocompleteInput
  items={allProducts}
  onSelect={handleSelect}
  // Component handles filtering internally
/>
```

### Async Filtering (Server-side)
Use with `onSearch` for server-side filtering:

```jsx
<AutocompleteInput
  items={searchResults}
  onSearch={handleServerSearch}
  onSelect={handleSelect}
  loading={isSearching}
  // Component delegates filtering to your onSearch handler
/>
```

## Migration from Existing Forms

### Before (TransferForm pattern):
```jsx
const [activeItemId, setActiveItemId] = useState(null);
const [productSearchTerms, setProductSearchTerms] = useState({});
const [filteredProductsMap, setFilteredProductsMap] = useState({});

useEffect(() => {
  // Complex filtering logic...
}, [productSearchTerms, products, items]);

<input
  type="text"
  value={productSearchTerms[item.id] || ''}
  onChange={(e) => setProductSearchTerms({...productSearchTerms, [item.id]: e.target.value})}
/>
```

### After (AutocompleteInput):
```jsx
<AutocompleteInput
  value={item.productName || ''}
  items={products}
  onSelect={(product) => handleItemChange(item.id, 'product', product)}
  getItemLabel={(p) => p.name}
/>
```

## Dark Mode

The component automatically adapts to dark mode using the `useTheme()` hook. No additional configuration needed.
