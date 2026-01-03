import { useState, useEffect } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  stockMovementService,
  MOVEMENT_TYPES,
} from '../services/stockMovementService';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/dataService';
import toast from 'react-hot-toast';
import { toUAETime } from '../utils/timezone';

const PROCUREMENT_CHANNELS = [
  { value: 'ALL', label: 'All Channels' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'IMPORTED', label: 'Imported' },
];

export default function StockMovementReport() {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMovementTypes, setSelectedMovementTypes] = useState([]);
  const [procurementChannel, setProcurementChannel] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  // Summary
  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netMovement: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getAll();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchMovements = async (pageNum = 1) => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);

      const filters = {
        page: pageNum,
        limit,
        dateFrom,
        dateTo,
        warehouseId: selectedWarehouse || undefined,
        productId: selectedProduct || undefined,
        movementType:
          selectedMovementTypes.length > 0
            ? selectedMovementTypes.join(',')
            : undefined,
      };

      const response = await stockMovementService.getAll(filters);

      let filteredMovements = response.data || [];

      // Apply procurement channel filter if needed (client-side for now)
      if (procurementChannel !== 'ALL') {
        filteredMovements = filteredMovements.filter(() => {
          // This would require product procurement info - placeholder logic
          // In reality, you'd add this to the backend filter
          return true;
        });
      }

      setMovements(filteredMovements);
      setPage(pageNum);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalRecords(response.pagination?.totalRecords || 0);

      // Calculate summary
      calculateSummary(filteredMovements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    data.forEach((movement) => {
      const qty = movement.quantity || 0;
      const cost = movement.totalCost || 0;

      if (
        movement.movementType === 'IN' ||
        movement.movementType === 'TRANSFER_IN'
      ) {
        totalIn += qty;
      } else if (
        movement.movementType === 'OUT' ||
        movement.movementType === 'TRANSFER_OUT'
      ) {
        totalOut += qty;
      }

      totalValue += cost;
    });

    setSummary({
      totalIn,
      totalOut,
      netMovement: totalIn - totalOut,
      totalValue,
    });
  };

  const handleSearch = () => {
    setPage(1);
    fetchMovements(1);
  };

  const handlePageChange = (event, value) => {
    fetchMovements(value);
  };

  const handleExportCSV = () => {
    if (movements.length === 0) {
      toast.warning('No data to export');
      return;
    }

    try {
      // CSV Headers
      const headers = [
        'Date',
        'Product',
        'SKU',
        'Batch #',
        'Type',
        'Quantity',
        'UOM',
        'Unit Cost',
        'Total Cost',
        'Reference',
        'Warehouse',
        'Notes',
      ];

      // CSV Rows
      const rows = movements.map((m) => [
        toUAETime(m.movementDate || m.createdAt, { format: 'datetime' }),
        m.productName || m.productDisplayName || '',
        m.productSku || '',
        m.batchNumber || '',
        MOVEMENT_TYPES[m.movementType]?.label || m.movementType,
        m.quantity?.toFixed(2) || '0.00',
        m.unit || 'KG',
        m.unitCost?.toFixed(2) || '0.00',
        m.totalCost?.toFixed(2) || '0.00',
        m.referenceNumber || '',
        m.warehouseName || '',
        m.notes || '',
      ]);

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `stock-movements-${dateFrom}-to-${dateTo}.csv`,
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = () => {
    toast.info('PDF export coming soon');
    // Placeholder for PDF export functionality
  };

  const getMovementTypeColor = (type) => {
    return MOVEMENT_TYPES[type]?.color || 'default';
  };

  const getMovementTypeLabel = (type) => {
    return MOVEMENT_TYPES[type]?.label || type;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Stock Movement Report</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="stock-movement-start-date"
              className="block text-sm font-medium mb-2"
            >
              Start Date
            </label>
            <input
              id="stock-movement-start-date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="stock-movement-end-date"
              className="block text-sm font-medium mb-2"
            >
              End Date
            </label>
            <input
              id="stock-movement-end-date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="stock-movement-warehouse"
              className="block text-sm font-medium mb-2"
            >
              Warehouse
            </label>
            <select
              id="stock-movement-warehouse"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="stock-movement-product"
              className="block text-sm font-medium mb-2"
            >
              Product
            </label>
            <select
              id="stock-movement-product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.uniqueName ||
                    product.displayName ||
                    product.name ||
                    'N/A'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="stock-movement-type"
              className="block text-sm font-medium mb-2"
            >
              Movement Type
            </label>
            <select
              id="stock-movement-type"
              multiple
              value={selectedMovementTypes}
              onChange={(e) =>
                setSelectedMovementTypes(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              {Object.entries(MOVEMENT_TYPES).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedMovementTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedMovementTypes.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-xs font-medium"
                  >
                    {getMovementTypeLabel(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="stock-movement-procurement-channel"
              className="block text-sm font-medium mb-2"
            >
              Procurement Channel
            </label>
            <select
              id="stock-movement-procurement-channel"
              value={procurementChannel}
              onChange={(e) => setProcurementChannel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              {PROCUREMENT_CHANNELS.map((channel) => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 lg:col-span-1">
            <Button
              onClick={handleSearch}
              disabled={loading || !dateFrom || !dateTo}
              className="flex-1 gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={movements.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={movements.length === 0}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {movements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total In
            </p>
            <p className="text-2xl font-bold text-green-600">
              {summary.totalIn.toFixed(2)} KG
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Out
            </p>
            <p className="text-2xl font-bold text-red-600">
              {summary.totalOut.toFixed(2)} KG
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Net Movement
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary.netMovement >= 0 ? '+' : ''}
              {summary.netMovement.toFixed(2)} KG
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Value
            </p>
            <p className="text-2xl font-bold text-blue-600">
              AED {summary.totalValue.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : movements.length === 0 && dateFrom && dateTo ? (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg">
          No stock movements found for the selected criteria.
        </div>
      ) : movements.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Stock Movements</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {movements.length} of {totalRecords} records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost/PCS</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Warehouse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow
                    key={movement.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell>
                      <div className="text-sm">
                        {toUAETime(
                          movement.movementDate || movement.createdAt,
                          {
                            format: 'date',
                          },
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {toUAETime(
                          movement.movementDate || movement.createdAt,
                          {
                            format: 'time',
                          },
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {movement.productName ||
                          movement.productDisplayName ||
                          'N/A'}
                      </div>
                      {movement.productSku && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          SKU: {movement.productSku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.batchNumber || '-'}
                      </div>
                      {movement.coilNumber && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Coil: {movement.coilNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          getMovementTypeColor(movement.movementType) ===
                          'success'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {getMovementTypeLabel(movement.movementType)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-sm">
                        {movement.quantity?.toFixed(2) || '0.00'}{' '}
                        {movement.unit || 'KG'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        {movement.unitCost
                          ? `AED ${movement.unitCost.toFixed(2)}`
                          : '-'}
                      </div>
                      {movement.totalCost && movement.totalCost > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Total: AED {movement.totalCost.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.referenceNumber || '-'}
                      </div>
                      {movement.referenceType && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {movement.referenceType}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.warehouseName || 'N/A'}
                      </div>
                      {movement.destinationWarehouseName && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          → {movement.destinationWarehouseName}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(null, 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  First
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  return pageNum <= totalPages ? (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(null, pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() => handlePageChange(null, totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
