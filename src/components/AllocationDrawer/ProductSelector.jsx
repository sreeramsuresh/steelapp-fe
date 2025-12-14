import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { productsAPI } from '../../services/api';

/**
 * ProductSelector Component
 *
 * Autocomplete search for products with debounced API calls.
 * Displays product name in standard format with grade, form, and dimensions.
 */
const ProductSelector = ({ companyId: _companyId, selectedProduct, onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Search products with debounce
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const response = await productsAPI.search(query);
      // Handle different response formats
      const productList =
        response?.data ||
        response?.products ||
        (Array.isArray(response) ? response : []);
      setProducts(productList.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error('Failed to search products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setShowDropdown(true);
      setHighlightedIndex(-1);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        searchProducts(value);
      }, 300);
    },
    [searchProducts],
  );

  // Handle product selection
  const handleSelect = useCallback(
    (product) => {
      onSelectProduct(product);
      setSearchTerm(
        product.displayName || product.uniqueName || product.name || '',
      );
      setShowDropdown(false);
      setProducts([]);
    },
    [onSelectProduct],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!showDropdown || products.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < products.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : products.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && products[highlightedIndex]) {
            handleSelect(products[highlightedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          break;
        default:
          break;
      }
    },
    [showDropdown, products, highlightedIndex, handleSelect],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search term with selected product
  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(
        selectedProduct.displayName ||
          selectedProduct.uniqueName ||
          selectedProduct.name ||
          '',
      );
    } else {
      setSearchTerm('');
    }
  }, [selectedProduct]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Format product display name
  const formatProductDisplay = (product) => {
    // Use display_name or unique_name if available
    if (product.displayName || product.display_name) {
      return product.displayName || product.display_name;
    }
    if (product.uniqueName || product.unique_name) {
      return product.uniqueName || product.unique_name;
    }
    return product.name || 'Unknown Product';
  };

  // Format product details for dropdown
  const formatProductDetails = (product) => {
    const details = [];
    if (product.grade) details.push(`Grade: ${product.grade}`);
    if (product.form) details.push(`Form: ${product.form}`);
    if (product.width && product.thickness) {
      details.push(`${product.width}x${product.thickness}mm`);
    }
    return details.join(' | ');
  };

  return (
    <div className="product-selector">
      <label htmlFor="product-search">
        Product <span className="required">*</span>
      </label>
      <div className="product-search-container">
        <input
          ref={inputRef}
          id="product-search"
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {loading && <span className="search-loading">...</span>}
      </div>

      {showDropdown && products.length > 0 && (
        <div ref={dropdownRef} className="product-dropdown">
          {products.map((product, index) => (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              className={`product-option ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(product)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(product);
                }
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="product-name">
                {formatProductDisplay(product)}
              </div>
              <div className="product-details">
                {formatProductDetails(product)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown &&
        searchTerm.length >= 2 &&
        products.length === 0 &&
        !loading && (
        <div ref={dropdownRef} className="product-dropdown empty">
          <div className="product-option disabled">No products found</div>
        </div>
      )}
    </div>
  );
};

ProductSelector.propTypes = {
  companyId: PropTypes.number,
  selectedProduct: PropTypes.object,
  onSelectProduct: PropTypes.func.isRequired,
};

export default ProductSelector;
