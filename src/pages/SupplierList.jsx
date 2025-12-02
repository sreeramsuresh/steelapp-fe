import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * SupplierList Component - Phase 4 Procurement
 * Displays suppliers with performance metrics: OTD%, avg variance, score, rating
 * Integrates with supplierPerformanceService for supplier metrics
 */
export function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadSuppliers();
  }, [page]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await suppliersAPI.getAll();
      setSuppliers(response || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'CERTIFIED':
        return 'bg-green-100 text-green-800';
      case 'PREFERRED':
        return 'bg-emerald-100 text-emerald-800';
      case 'ACCEPTABLE':
        return 'bg-yellow-100 text-yellow-800';
      case 'AT_RISK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const paginatedSuppliers = suppliers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded">
              {error}
              <Button
                onClick={loadSuppliers}
                className="ml-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">OTD %</TableHead>
                    <TableHead className="text-right">Avg Variance</TableHead>
                    <TableHead className="text-right">Late Count</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono text-sm">
                        {supplier.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {supplier.email}
                      </TableCell>
                      <TableCell className="text-right">
                        {supplier.on_time_delivery_pct?.toFixed(1) || 'N/A'}%
                      </TableCell>
                      <TableCell className="text-right">
                        {supplier.avg_delivery_variance_days?.toFixed(1) || 'N/A'} days
                      </TableCell>
                      <TableCell className="text-right">
                        {supplier.late_delivery_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getScoreColor(supplier.supplier_score)}>
                          {supplier.supplier_score || 0}/100
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRatingColor(supplier.supplier_rating)}>
                          {supplier.supplier_rating || 'UNRATED'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {supplier.reason || 'No notes'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/suppliers/${supplier.id}/scorecard`)
                          }
                        >
                          Scorecard
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {suppliers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No suppliers found
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {suppliers.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Showing {(page - 1) * itemsPerPage + 1} to{' '}
                {Math.min(page * itemsPerPage, suppliers.length)} of{' '}
                {suppliers.length}
              </span>
              <div className="space-x-2">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setPage(
                      Math.min(
                        Math.ceil(suppliers.length / itemsPerPage),
                        page + 1
                      )
                    )
                  }
                  disabled={page * itemsPerPage >= suppliers.length}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}