import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';

/**
 * SupplierPerformanceDashboard - Phase 6 Analytics
 * Shows supplier rankings, OTD%, variance trends, at-risk suppliers
 */
export function SupplierPerformanceDashboard() {
  const [suppliers, setSuppliers] = useState([]);
  const [atRiskSuppliers, setAtRiskSuppliers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    otdPercent: 0,
    avgVariance: 0,
    consistencyScore: 0,
    overallRating: 'N/A',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load suppliers from existing API or mock
      const mockSuppliers = [
        {
          id: 1,
          name: 'Premium Steel Inc',
          onTimeDeliveryPct: 96.5,
          avgVarianceDays: 1.2,
          lateDeliveryCount: 2,
          score: 94,
          rating: 'CERTIFIED',
        },
        {
          id: 2,
          name: 'Global Trading Co',
          onTimeDeliveryPct: 87.3,
          avgVarianceDays: 3.8,
          lateDeliveryCount: 8,
          score: 82,
          rating: 'PREFERRED',
        },
        {
          id: 3,
          name: 'Standard Metals Ltd',
          onTimeDeliveryPct: 75.2,
          avgVarianceDays: 5.6,
          lateDeliveryCount: 15,
          score: 72,
          rating: 'ACCEPTABLE',
        },
      ];

      const mockTrends = [
        { week: 'Week 1', otd: 92, variance: 2.1 },
        { week: 'Week 2', otd: 93, variance: 2.0 },
        { week: 'Week 3', otd: 94, variance: 1.8 },
        { week: 'Week 4', otd: 95, variance: 1.5 },
      ];

      const mockAtRisk = [
        {
          id: 4,
          name: 'Budget Supplier LLC',
          score: 58,
          reason: 'Low OTD% and high variance',
        },
      ];

      setSuppliers(mockSuppliers);
      setAtRiskSuppliers(mockAtRisk);
      setTrends(mockTrends);

      const avgScore =
        mockSuppliers.reduce((sum, s) => sum + s.score, 0) /
        mockSuppliers.length;
      setKpis({
        otdPercent: (
          mockSuppliers.reduce((sum, s) => sum + s.onTimeDeliveryPct, 0) /
          mockSuppliers.length
        ).toFixed(1),
        avgVariance: (
          mockSuppliers.reduce((sum, s) => sum + s.avgVarianceDays, 0) /
          mockSuppliers.length
        ).toFixed(1),
        consistencyScore: Math.round(avgScore),
        overallRating: 'GOOD',
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    const colors = {
      CERTIFIED: 'bg-green-100 text-green-800',
      PREFERRED: 'bg-emerald-100 text-emerald-800',
      ACCEPTABLE: 'bg-yellow-100 text-yellow-800',
      AT_RISK: 'bg-red-100 text-red-800',
    };
    return colors[rating] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              On-Time Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.otdPercent}%</div>
            <p className="text-xs text-gray-500">Average across suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgVariance} days</div>
            <p className="text-xs text-gray-500">Days from expected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Consistency Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.consistencyScore}/100</div>
            <p className="text-xs text-gray-500">Supplier reliability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-blue-100 text-blue-800">
              {kpis.overallRating}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Supplier portfolio health</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Suppliers by Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">OTD %</TableHead>
                <TableHead className="text-right">Late Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((supplier, idx) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-bold">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {supplier.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.score}/100
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(supplier.rating)}>
                        {supplier.rating}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.onTimeDeliveryPct}%
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.lateDeliveryCount}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              On-Time Delivery Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="otd"
                  stroke="#10b981"
                  name="OTD %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Variance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="variance"
                  stroke="#f59e0b"
                  name="Variance (days)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Suppliers Alert */}
      {atRiskSuppliers.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-4 w-4" />
              At-Risk Suppliers Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex justify-between items-start p-3 bg-white rounded border border-red-200"
                >
                  <div>
                    <p className="font-medium text-red-900">{supplier.name}</p>
                    <p className="text-sm text-red-700">{supplier.reason}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    Score: {supplier.score}
                  </Badge>
                </div>
              ))}
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Recommendation: Consider finding alternative suppliers or
                schedule performance review meetings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}