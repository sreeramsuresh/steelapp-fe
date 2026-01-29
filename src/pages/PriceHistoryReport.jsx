import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import pricelistService from '../services/pricelistService';
import { productService } from '../services/dataService';
import toast from 'react-hot-toast';
import { toUAETime } from '../utils/timezone';

export default function PriceHistoryReport() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [pricelists, setPricelists] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchPricelists();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchPricelists = async () => {
    try {
      const response = await pricelistService.getAll();
      setPricelists(response.data || []);
    } catch (error) {
      console.error('Error fetching pricelists:', error);
      toast.error('Failed to load price lists');
    }
  };

  const fetchPriceHistory = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    try {
      setLoading(true);
      const history = [];

      // Get price from each pricelist
      for (const pricelist of pricelists) {
        const items = await pricelistService.getItems(pricelist.id);
        const item = items.data?.find(
          (i) => i.productId === parseInt(selectedProduct),
        );

        if (item) {
          history.push({
            pricelistId: pricelist.id,
            pricelistName: pricelist.name,
            effectiveFrom: pricelist.effectiveFrom,
            effectiveTo: pricelist.effectiveTo,
            price: item.sellingPrice,
            isActive: pricelist.isActive,
            isDefault: pricelist.isDefault,
          });
        }
      }

      // Sort by effective date
      history.sort((a, b) => {
        if (!a.effectiveFrom) return 1;
        if (!b.effectiveFrom) return -1;
        return new Date(b.effectiveFrom) - new Date(a.effectiveFrom);
      });

      setPriceHistory(history);
    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const getPriceDiff = (index) => {
    if (index === priceHistory.length - 1) return null;

    const current = priceHistory[index].price;
    const previous = priceHistory[index + 1].price;

    const diff = current - previous;
    const diffPercent = ((diff / previous) * 100).toFixed(1);

    return { diff, diffPercent };
  };

  const selectedProductData = products.find(
    (p) => p.id === parseInt(selectedProduct),
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Price History Report</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 min-w-max">
            <label
              htmlFor="product-select"
              className="block text-sm font-medium mb-2"
            >
              Select Product
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white w-full sm:w-80"
            >
              <option value="">-- Select Product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.uniqueName || product.unique_name || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={fetchPriceHistory}
            disabled={loading || !selectedProduct}
            className="gap-2 mt-6 sm:mt-0"
          >
            <Search className="w-4 h-4" />
            View History
          </Button>
        </div>
      </div>

      {selectedProductData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Product Name
              </p>
              <p className="font-bold text-lg">
                {selectedProductData.displayName || selectedProductData.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Category
              </p>
              <p className="text-lg">{selectedProductData.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Grade
              </p>
              <p className="text-lg">{selectedProductData.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Current Price
              </p>
              <p className="font-bold text-lg text-blue-600">
                AED {selectedProductData.sellingPrice?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : priceHistory.length === 0 && selectedProduct ? (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg">
          No price history found for the selected product.
        </div>
      ) : priceHistory.length > 0 ? (
        <>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm font-medium">Price History Guide:</p>
            <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
              <li>
                Displays historical prices across all active price lists
              </li>
              <li>
                Effective Date shows when each price list became active
              </li>
              <li>
                Change column shows price increase/decrease from previous entry
              </li>
              <li>
                Default price list is marked for reference
              </li>
            </ul>
          </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Price List</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceHistory.map((row, index) => {
                  const priceDiff = getPriceDiff(index);

                  return (
                    <TableRow
                      key={row.pricelistId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{row.pricelistName}</span>
                          {row.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900 dark:text-blue-200">
                              Default
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {row.effectiveFrom
                            ? toUAETime(row.effectiveFrom, { format: 'date' })
                            : 'No date'}
                          {row.effectiveTo &&
                            ` - ${toUAETime(row.effectiveTo, { format: 'date' })}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold">
                          AED {row.price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {priceDiff ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              priceDiff.diff >= 0
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {priceDiff.diff >= 0 ? '+' : ''}
                            {priceDiff.diffPercent}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-200">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
