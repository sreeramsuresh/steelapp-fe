import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileSearch,
  FileText,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { materialCertificateService } from "../../services/materialCertificateService";

const STATUS_CONFIG = {
  verified: { label: "Verified", icon: CheckCircle, cls: "text-green-600", bg: "bg-green-100 text-green-700" },
  pending: { label: "Pending", icon: Clock, cls: "text-yellow-600", bg: "bg-yellow-100 text-yellow-700" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-red-600", bg: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 90;
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function CertificateAuditReport() {
  const { isDarkMode } = useTheme();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await materialCertificateService.getMaterialCertificates({ limit: 500 });
      setCertificates(res.certificates || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Derived lists (API returns camelCase)
  const pending = certificates.filter((c) => c.verificationStatus === "pending");
  const rejected = certificates.filter((c) => c.verificationStatus === "rejected");
  const expiringSoon = certificates.filter((c) => isExpiringSoon(c.cooValidityDate || c.expiryDate));
  const expired = certificates.filter((c) => isExpired(c.cooValidityDate || c.expiryDate));

  // Missing mandatory fields detection (API returns camelCase)
  function getMissingFields(cert) {
    const missing = [];
    const type = cert.certificateType;
    if (!cert.certificateNumber) missing.push("certificate_number");
    if (!cert.issueDate && !cert.issuedDate) missing.push("issue_date");
    if (type === "Mill Test Certificate" || type === "mill_test_certificate") {
      if (!cert.heatNumber) missing.push("heat_number");
      if (!(cert.millName || cert.certificateIssuer)) missing.push("mill_name");
      if (!cert.standardSpecification) missing.push("standard_specification");
      if (!cert.en_10204Type) missing.push("en_10204_type");
    }
    if (type === "Certificate of Origin" || type === "certificate_of_origin") {
      if (!cert.countryOfOrigin) missing.push("country_of_origin");
      if (!(cert.certificateIssuer || cert.issuingAuthority)) missing.push("certificate_issuer");
    }
    if (type === "Certificate of Analysis" || type === "certificate_of_analysis") {
      if (!cert.heatNumber) missing.push("heat_number");
      if (!(cert.certificateIssuer || cert.millName)) missing.push("issuing_lab");
    }
    return missing;
  }

  const withMissingFields = certificates.filter((c) => getMissingFields(c).length > 0);

  const tabs = [
    { key: "all", label: "All Certificates", count: certificates.length },
    { key: "pending", label: "Unverified (Pending)", count: pending.length, warn: pending.length > 0 },
    { key: "rejected", label: "Rejected", count: rejected.length, danger: rejected.length > 0 },
    {
      key: "expiring",
      label: "Expiring / Expired",
      count: expiringSoon.length + expired.length,
      warn: expiringSoon.length + expired.length > 0,
    },
    { key: "missing", label: "Missing Fields", count: withMissingFields.length, danger: withMissingFields.length > 0 },
  ];

  const displayList =
    {
      all: certificates,
      pending,
      rejected,
      expiring: [...expired, ...expiringSoon],
      missing: withMissingFields,
    }[activeTab] || certificates;

  const card = `rounded-lg shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`;

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-teal-600" size={28} />
            Certificate Audit Trail
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Compliance overview: verification status, expiry alerts, and mandatory field gaps
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`${card} p-4`}>
          <div className="text-2xl font-bold text-green-600">
            {certificates.filter((c) => c.verificationStatus === "verified").length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Verified</div>
        </div>
        <div className={`${card} p-4`}>
          <div className="text-2xl font-bold text-yellow-600">{pending.length}</div>
          <div className="text-sm text-gray-500 mt-1">Pending Verification</div>
        </div>
        <div className={`${card} p-4`}>
          <div className="text-2xl font-bold text-red-600">{rejected.length}</div>
          <div className="text-sm text-gray-500 mt-1">Rejected</div>
        </div>
        <div className={`${card} p-4`}>
          <div className="text-2xl font-bold text-orange-600">{expiringSoon.length}</div>
          <div className="text-sm text-gray-500 mt-1">Expiring in 90 Days</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${card} mb-6`}>
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  tab.danger
                    ? "bg-red-100 text-red-700"
                    : tab.warn
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading certificates...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center">
            <FileSearch className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-500">No certificates in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cert #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mill / Issuer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heat No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Expiry / COO Validity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {activeTab === "missing" && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Fields</th>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {displayList.map((cert) => {
                  const expiryDate = cert.cooValidityDate || cert.expiryDate;
                  const missing = getMissingFields(cert);
                  return (
                    <tr key={cert.id} className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400 shrink-0" />
                          {cert.certificateNumber || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize">
                        {cert.certificateType?.replace(/_/g, " ") || "-"}
                      </td>
                      <td className="px-4 py-3">{cert.millName || cert.certificateIssuer || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{cert.heatNumber || "-"}</td>
                      <td className="px-4 py-3">{cert.grade || "-"}</td>
                      <td className="px-4 py-3">{formatDate(cert.issueDate || cert.issuedDate)}</td>
                      <td className="px-4 py-3">
                        {expiryDate ? (
                          <span
                            className={
                              isExpired(expiryDate)
                                ? "text-red-600 font-medium"
                                : isExpiringSoon(expiryDate)
                                  ? "text-orange-600 font-medium"
                                  : ""
                            }
                          >
                            {formatDate(expiryDate)}
                            {isExpired(expiryDate) && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                            {!isExpired(expiryDate) && isExpiringSoon(expiryDate) && (
                              <AlertTriangle size={12} className="inline ml-1 text-orange-500" />
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={cert.verificationStatus} />
                      </td>
                      {activeTab === "missing" && (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {missing.map((f) => (
                              <span key={f} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Retention Tracker */}
      {activeTab === "all" && (
        <div className={`${card} p-4`}>
          <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
            <Shield size={16} className="text-teal-600" />
            5-Year Retention Tracker (UAE VAT)
          </h3>
          <p className="text-xs text-gray-500">
            UAE VAT law requires original tax documents to be kept for 5 years. Certificates with a
            <code className="mx-1 px-1 bg-gray-100 dark:bg-gray-700 rounded">retention_expiry_date</code>
            set will appear here when approaching their retention deadline.
          </p>
          <div className="mt-3">
            {certificates.filter((c) => c.retentionExpiryDate && isExpiringSoon(c.retentionExpiryDate)).length === 0 ? (
              <p className="text-xs text-gray-400">No certificates approaching retention expiry in the next 90 days.</p>
            ) : (
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-2">Cert #</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-left pb-2">Retention Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates
                    .filter((c) => c.retentionExpiryDate && isExpiringSoon(c.retentionExpiryDate))
                    .map((c) => (
                      <tr key={c.id}>
                        <td className="py-1">{c.certificateNumber}</td>
                        <td className="py-1 text-gray-500">{c.certificateType?.replace(/_/g, " ")}</td>
                        <td className="py-1 text-orange-600 font-medium">{formatDate(c.retentionExpiryDate)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
