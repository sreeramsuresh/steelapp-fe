import { Building2, Edit, Factory, Globe, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { suppliersAPI } from "../services/api";

/**
 * SupplierList Component - Phase 4 Procurement
 * Displays suppliers with performance metrics and procurement classification
 * Includes: supplierLocation, isMill, primaryCountry, typicalLeadTimeDays
 */
export function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filterLocation, setFilterLocation] = useState("ALL");
  const [filterMill, setFilterMill] = useState("ALL");
  const itemsPerPage = 20;

  useEffect(() => {
    loadSuppliers();
  }, [page]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await suppliersAPI.getAll();
      setSuppliers(response?.suppliers || []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      setError(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case "CERTIFIED":
        return "bg-green-100 text-green-800";
      case "PREFERRED":
        return "bg-emerald-100 text-emerald-800";
      case "ACCEPTABLE":
        return "bg-yellow-100 text-yellow-800";
      case "AT_RISK":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-emerald-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getLocationBadge = (location) => {
    const loc = location || "UAE_LOCAL";
    if (loc === "OVERSEAS") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
          <Globe size={12} className="mr-1" />
          Overseas
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Building2 size={12} className="mr-1" />
        UAE Local
      </Badge>
    );
  };

  // Filter suppliers based on selected filters
  const filteredSuppliers = suppliers.filter((supplier) => {
    const location = supplier.supplierLocation || supplier.supplier_location || "UAE_LOCAL";
    const isMill = supplier.isMill ?? supplier.is_mill ?? false;

    if (filterLocation !== "ALL" && location !== filterLocation) {
      return false;
    }
    if (filterMill === "MILL" && !isMill) {
      return false;
    }
    if (filterMill === "TRADER" && isMill) {
      return false;
    }
    return true;
  });

  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Suppliers</CardTitle>
          <Button onClick={() => navigate("/suppliers/new")} className="flex items-center gap-2">
            <Plus size={16} />
            Add Supplier
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Location:</span>
              <select
                value={filterLocation}
                onChange={(e) => {
                  setFilterLocation(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="ALL">All Locations</option>
                <option value="UAE_LOCAL">UAE Local</option>
                <option value="OVERSEAS">Overseas</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Type:</span>
              <select
                value={filterMill}
                onChange={(e) => {
                  setFilterMill(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="MILL">Mills Only</option>
                <option value="TRADER">Traders Only</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 ml-auto">
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded">
              {error}
              <Button onClick={loadSuppliers} className="ml-4" variant="outline">
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
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Lead Time</TableHead>
                    <TableHead className="text-right">OTD %</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSuppliers.map((supplier) => {
                    const location = supplier.supplierLocation || supplier.supplier_location || "UAE_LOCAL";
                    const isMill = supplier.isMill ?? supplier.is_mill ?? false;
                    const primaryCountry = supplier.primaryCountry || supplier.primary_country || "UAE";
                    const leadTime = supplier.typicalLeadTimeDays ?? supplier.typical_lead_time_days ?? "-";

                    return (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getLocationBadge(location)}</TableCell>
                        <TableCell>
                          {isMill ? (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              <Factory size={12} className="mr-1" />
                              Mill
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Trader
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{primaryCountry}</span>
                        </TableCell>
                        <TableCell className="text-right">{leadTime !== "-" ? `${leadTime} days` : "-"}</TableCell>
                        <TableCell className="text-right">
                          {supplier.on_time_delivery_pct?.toFixed(1) || "N/A"}%
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={getScoreColor(supplier.supplier_score)}>
                            {supplier.supplier_score || 0}/100
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRatingColor(supplier.supplier_rating)}>
                            {supplier.supplier_rating || "UNRATED"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
                              title="Edit supplier"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/suppliers/${supplier.id}/scorecard`)}
                            >
                              Scorecard
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredSuppliers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">No suppliers found matching the current filters</div>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredSuppliers.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredSuppliers.length)} of{" "}
                {filteredSuppliers.length}
              </span>
              <div className="space-x-2">
                <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="outline">
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(Math.min(Math.ceil(filteredSuppliers.length / itemsPerPage), page + 1))}
                  disabled={page * itemsPerPage >= filteredSuppliers.length}
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

export default SupplierList;
