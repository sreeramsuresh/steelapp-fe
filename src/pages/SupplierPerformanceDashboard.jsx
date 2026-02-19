import { AlertCircle, TrendingUp } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Lazy-load chart components for better initial load performance
import { ChartSkeleton } from "../components/charts";
import { useTheme } from "../contexts/ThemeContext";
import { suppliersAPI } from "../services/api";

const LazyLineChart = lazy(() => import("../components/charts/LazyLineChart"));
/**
 * SupplierPerformanceDashboard - Phase 6 Analytics
 * Shows supplier rankings, OTD%, variance trends, at-risk suppliers
 */
function SupplierPerformanceDashboard() {
  const { isDarkMode } = useTheme();
  const [suppliers, setSuppliers] = useState([]);
  const [atRiskSuppliers, setAtRiskSuppliers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    otdPercent: 0,
    avgVariance: 0,
    consistencyScore: 0,
    overallRating: "N/A",
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await suppliersAPI.getAll({ limit: 100 });
      const allSuppliers = response?.suppliers || [];

      // Map suppliers to performance format using available fields
      const supplierData = allSuppliers.map((s) => ({
        id: s.id,
        name: s.name,
        onTimeDeliveryPct: s.onTimeDeliveryPct || 0,
        avgVarianceDays: s.avgDeliveryVarianceDays || 0,
        lateDeliveryCount: s.lateDeliveryCount || 0,
        score: s.supplierScore || 0,
        rating: s.supplierRating || "UNRATED",
      }));

      // Sort by score descending
      supplierData.sort((a, b) => b.score - a.score);

      // At-risk = score below 70
      const atRisk = supplierData
        .filter((s) => s.score > 0 && s.score < 70)
        .map((s) => ({ id: s.id, name: s.name, score: s.score, reason: `Score ${s.score} below threshold` }));

      setSuppliers(supplierData);
      setAtRiskSuppliers(atRisk);
      setTrends([]); // Trend data requires a dedicated endpoint

      if (supplierData.length > 0) {
        const scored = supplierData.filter((s) => s.score > 0);
        if (scored.length > 0) {
          const avgScore = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
          setKpis({
            otdPercent: (scored.reduce((sum, s) => sum + s.onTimeDeliveryPct, 0) / scored.length).toFixed(1),
            avgVariance: (scored.reduce((sum, s) => sum + s.avgVarianceDays, 0) / scored.length).toFixed(1),
            consistencyScore: Math.round(avgScore),
            overallRating: avgScore >= 85 ? "GOOD" : avgScore >= 70 ? "FAIR" : "POOR",
          });
        }
      }
    } catch (error) {
      console.warn("Error loading supplier performance:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getRatingColor = (rating) => {
    const colors = {
      CERTIFIED: "bg-green-100 text-green-800",
      PREFERRED: "bg-emerald-100 text-emerald-800",
      ACCEPTABLE: "bg-yellow-100 text-yellow-800",
      AT_RISK: "bg-red-100 text-red-800",
      PENDING: "bg-gray-100 text-gray-800",
      UNRATED: "bg-gray-100 text-gray-800",
    };
    return colors[rating] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading supplier performance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>Supplier Performance</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              On-Time Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.otdPercent}%</div>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Average across suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Avg Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgVariance} days</div>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Days from expected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Consistency Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.consistencyScore}/100</div>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Supplier reliability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-blue-100 text-blue-800">{kpis.overallRating}</Badge>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-2`}>
              Supplier portfolio health
            </p>
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
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-right">{supplier.score}/100</TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(supplier.rating)}>{supplier.rating}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{supplier.onTimeDeliveryPct}%</TableCell>
                    <TableCell className="text-right">{supplier.lateDeliveryCount}</TableCell>
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
            <Suspense fallback={<ChartSkeleton height={300} />}>
              <LazyLineChart
                data={trends}
                xAxisKey="week"
                height={300}
                lines={[
                  {
                    dataKey: "otd",
                    color: "#10b981",
                    name: "OTD %",
                  },
                ]}
              />
            </Suspense>
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
            <Suspense fallback={<ChartSkeleton height={300} />}>
              <LazyLineChart
                data={trends}
                xAxisKey="week"
                height={300}
                lines={[
                  {
                    dataKey: "variance",
                    color: "#f59e0b",
                    name: "Variance (days)",
                  },
                ]}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Suppliers Alert */}
      {atRiskSuppliers.length > 0 && (
        <Card className={isDarkMode ? "border-red-800 bg-red-900/30" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-red-300" : "text-red-900"}`}>
              <AlertCircle className="h-4 w-4" />
              At-Risk Suppliers Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`flex justify-between items-start p-3 rounded border ${isDarkMode ? "bg-gray-800 border-red-800" : "bg-white border-red-200"}`}
                >
                  <div>
                    <p className={`font-medium ${isDarkMode ? "text-red-300" : "text-red-900"}`}>{supplier.name}</p>
                    <p className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-700"}`}>{supplier.reason}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">Score: {supplier.score}</Badge>
                </div>
              ))}
              <p className={`text-sm font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>
                ⚠️ Recommendation: Consider finding alternative suppliers or schedule performance review meetings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SupplierPerformanceDashboard;
