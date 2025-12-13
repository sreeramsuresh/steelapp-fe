/**
 * DesignatedZoneWidget.jsx
 *
 * UAE Designated Zones Transaction Tracking Widget
 * Displays transactions with FTA Designated Zones (Free Zones)
 *
 * UAE VAT Compliance - Designated Zones:
 * - JAFZA (Jebel Ali Free Zone Authority)
 * - DAFZA (Dubai Airport Free Zone)
 * - SAIF Zone (Sharjah Airport International Free Zone)
 * - KIZAD (Khalifa Industrial Zone Abu Dhabi)
 * - RAK FTZ (Ras Al Khaimah Free Trade Zone)
 *
 * Zero-rating conditions:
 * - Goods must remain within Designated Zone
 * - Proper documentation required
 * - Goods physically located in the zone at time of supply
 */

import { useState, useEffect } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Building2,
} from "lucide-react";
// UAE Designated Zones list
const DESIGNATED_ZONES = [
  { code: "JAFZA", name: "Jebel Ali Free Zone", emirate: "Dubai" },
  { code: "DAFZA", name: "Dubai Airport Free Zone", emirate: "Dubai" },
  {
    code: "SAIF",
    name: "Sharjah Airport International Free Zone",
    emirate: "Sharjah",
  },
  { code: "KIZAD", name: "Khalifa Industrial Zone", emirate: "Abu Dhabi" },
  { code: "RAKFTZ", name: "RAK Free Trade Zone", emirate: "Ras Al Khaimah" },
  { code: "AFZA", name: "Ajman Free Zone", emirate: "Ajman" },
  { code: "HFZA", name: "Hamriyah Free Zone", emirate: "Sharjah" },
];

// Mock data for designated zone transactions
const mockZoneData = {
  summary: {
    totalTransactions: 28,
    totalValue: 1250000.0,
    zeroRatedValue: 1125000.0,
    compliantTransactions: 24,
    pendingDocuments: 4,
  },
  zoneBreakdown: [
    {
      zone: "JAFZA",
      zoneName: "Jebel Ali Free Zone",
      transactions: 15,
      value: 750000.0,
      compliant: 14,
      pending: 1,
    },
    {
      zone: "DAFZA",
      zoneName: "Dubai Airport Free Zone",
      transactions: 8,
      value: 320000.0,
      compliant: 7,
      pending: 1,
    },
    {
      zone: "KIZAD",
      zoneName: "Khalifa Industrial Zone",
      transactions: 5,
      value: 180000.0,
      compliant: 3,
      pending: 2,
    },
  ],
  recentTransactions: [
    {
      id: 1,
      invoiceNumber: "INV-2024-0245",
      zone: "JAFZA",
      customer: "Steel Trading FZE",
      amount: 85000.0,
      date: "2024-12-26",
      status: "compliant",
      documents: { delivery: true, zoneEntry: true, customs: true },
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-0243",
      zone: "DAFZA",
      customer: "Metal Supplies LLC",
      amount: 42500.0,
      date: "2024-12-24",
      status: "pending",
      documents: { delivery: true, zoneEntry: true, customs: false },
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-0240",
      zone: "KIZAD",
      customer: "Industrial Steel FZC",
      amount: 67800.0,
      date: "2024-12-22",
      status: "compliant",
      documents: { delivery: true, zoneEntry: true, customs: true },
    },
  ],
  documentChecklist: [
    { name: "Delivery Note", required: true },
    { name: "Zone Entry Certificate", required: true },
    { name: "Customs Declaration", required: true },
    { name: "Bill of Lading", required: false },
  ],
};

const DesignatedZoneWidget = ({
  data = null,
  onViewTransaction = null,
  onUploadDocument = null,
  onViewAll = null,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [zoneData, setZoneData] = useState(data || mockZoneData);
  const [selectedView, setSelectedView] = useState("summary");

  useEffect(() => {
    if (data) {
      setZoneData(data);
    }
  }, [data]);

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(safeAmount);
  };

  const getComplianceRate = () => {
    if (!zoneData.summary.totalTransactions) return 100;
    return Math.round(
      (zoneData.summary.compliantTransactions /
        zoneData.summary.totalTransactions) *
        100,
    );
  };

  const getDocumentStatus = (documents) => {
    const total = Object.keys(documents).length;
    const complete = Object.values(documents).filter(Boolean).length;
    return {
      complete,
      total,
      percentage: Math.round((complete / total) * 100),
    };
  };

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? "bg-[#1E2328] border-[#37474F] hover:border-teal-600"
          : "bg-white border-[#E0E0E0] hover:border-teal-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Designated Zones
              <span className="relative group">
                <Info
                  size={14}
                  className="cursor-help opacity-50 hover:opacity-100"
                />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  Zero-rated supplies to UAE Free Zones
                </span>
              </span>
            </h3>
            <p
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Free Zone Transactions
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div
          className={`flex rounded-lg p-0.5 ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-100"}`}
        >
          <button
            onClick={() => setSelectedView("summary")}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              selectedView === "summary"
                ? "bg-teal-500 text-white"
                : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-600"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setSelectedView("zones")}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              selectedView === "zones"
                ? "bg-teal-500 text-white"
                : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-600"
            }`}
          >
            By Zone
          </button>
        </div>
      </div>

      {/* Summary View */}
      {selectedView === "summary" && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}
            >
              <p
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Total Zero-Rated
              </p>
              <p
                className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(zoneData.summary.zeroRatedValue)}
              </p>
              <p
                className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {zoneData.summary.totalTransactions} transactions
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}
            >
              <p
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Compliance Rate
              </p>
              <p
                className={`text-lg font-bold ${
                  getComplianceRate() >= 90
                    ? "text-green-500"
                    : getComplianceRate() >= 70
                      ? "text-yellow-500"
                      : "text-red-500"
                }`}
              >
                {getComplianceRate()}%
              </p>
              <p
                className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {zoneData.summary.pendingDocuments} pending docs
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-2">
            <p
              className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Recent Transactions
            </p>
            {zoneData.recentTransactions.slice(0, 3).map((tx) => {
              const docStatus = getDocumentStatus(tx.documents);
              return (
                <div
                  key={tx.id}
                  onClick={() => onViewTransaction && onViewTransaction(tx)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                    isDarkMode
                      ? "bg-[#2E3B4E] border-[#37474F] hover:border-teal-600"
                      : "bg-white border-gray-200 hover:border-teal-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          isDarkMode
                            ? "bg-purple-900/30 text-purple-400"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {tx.zone}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          {tx.invoiceNumber}
                        </p>
                        <p
                          className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {tx.customer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {formatCurrency(tx.amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        {tx.status === "compliant" ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <AlertTriangle
                            size={12}
                            className="text-yellow-500"
                          />
                        )}
                        <span
                          className={`text-xs ${
                            tx.status === "compliant"
                              ? "text-green-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {docStatus.complete}/{docStatus.total} docs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Zone Breakdown View */}
      {selectedView === "zones" && (
        <div className="space-y-2">
          {zoneData.zoneBreakdown.map((zone) => (
            <div
              key={zone.zone}
              className={`p-3 rounded-lg border ${
                isDarkMode
                  ? "bg-[#2E3B4E] border-[#37474F]"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-purple-500" />
                  <span
                    className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {zone.zone}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {formatCurrency(zone.value)}
                </span>
              </div>
              <p
                className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {zone.zoneName}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={isDarkMode ? "text-gray-400" : "text-gray-500"}
                >
                  {zone.transactions} transactions
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">
                    {zone.compliant} compliant
                  </span>
                  {zone.pending > 0 && (
                    <span className="text-yellow-500">
                      {zone.pending} pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Checklist */}
      <div
        className={`mt-4 pt-3 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
      >
        <p
          className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Required Documentation
        </p>
        <div className="flex flex-wrap gap-1">
          {zoneData.documentChecklist
            .filter((d) => d.required)
            .map((doc, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isDarkMode
                    ? "bg-[#2E3B4E] text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {doc.name}
              </span>
            ))}
        </div>
      </div>

      {/* Action Button */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
            isDarkMode
              ? "bg-purple-600 hover:bg-purple-500 text-white"
              : "bg-purple-500 hover:bg-purple-600 text-white"
          }`}
        >
          View All Zone Transactions
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

export default DesignatedZoneWidget;
