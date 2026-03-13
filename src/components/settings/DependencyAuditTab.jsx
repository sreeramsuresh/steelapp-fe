import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Github,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import devService from "../../services/devService";

const BUMP_COLORS = {
  major: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", label: "Major" },
  minor: { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30", label: "Minor" },
  patch: { bg: "bg-gray-500/12", text: "text-gray-400", border: "border-gray-500/20", label: "Patch" },
  current: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", label: "Current" },
  unknown: { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500/20", label: "?" },
};

const SEVERITY_COLORS = {
  critical: { bg: "bg-red-600/20", text: "text-red-400", border: "border-red-600/40", label: "Critical" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", label: "High" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", label: "Medium" },
  low: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", label: "Low" },
  unknown: { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500/20", label: "Unknown" },
};

const REPO_STYLES = {
  backend: { bg: "bg-emerald-600", label: "BE" },
  frontend: { bg: "bg-blue-600", label: "FE" },
  deploy: { bg: "bg-purple-600", label: "CI" },
};

function getRepoKey(label) {
  if (label?.includes("Backend")) return "backend";
  if (label?.includes("Frontend")) return "frontend";
  return "deploy";
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function DependencyAuditTab() {
  const { isDarkMode } = useTheme();
  const [githubUser, setGithubUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("outdated"); // "outdated" | "vulnerabilities"
  const [searchTerm, setSearchTerm] = useState("");
  const [repoFilter, setRepoFilter] = useState("all"); // "all" | "backend" | "frontend" | "deploy"
  const [showDevDeps, setShowDevDeps] = useState(false);

  // Check GitHub connection
  useEffect(() => {
    (async () => {
      try {
        const res = await devService.getGitHubStatus();
        const status = res.data || res;
        if (status.connected) {
          setGithubUser({ login: status.login, avatarUrl: status.avatarUrl });
        }
      } catch {
        // not connected
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await devService.getDependencyAudit();
      setData(res.data || res);
    } catch (err) {
      if (err.response?.data?.error === "github_not_connected") {
        setGithubUser(null);
      } else {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when connected
  useEffect(() => {
    if (githubUser && !data && !loading) fetchData();
  }, [githubUser, data, loading, fetchData]);

  const summary = data?.summary;

  const filteredPackages = useMemo(() => {
    if (!data?.repos) return [];
    const packages = [];
    for (const repo of data.repos) {
      const repoKey = getRepoKey(repo.label);
      if (repoFilter !== "all" && repoKey !== repoFilter) continue;
      for (const pkg of repo.packages || []) {
        if (!showDevDeps && pkg.isDev) continue;
        if (activeView === "outdated" && !pkg.outdated) continue;
        if (searchTerm && !pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) continue;
        packages.push({ ...pkg, repoLabel: repo.label, repoKey });
      }
    }
    const order = { major: 0, minor: 1, patch: 2, unknown: 3, current: 4 };
    packages.sort((a, b) => (order[a.bump] ?? 5) - (order[b.bump] ?? 5));
    return packages;
  }, [data, repoFilter, showDevDeps, activeView, searchTerm]);

  const filteredVulns = useMemo(() => {
    if (!data?.repos) return [];
    const vulns = [];
    for (const repo of data.repos) {
      const repoKey = getRepoKey(repo.label);
      if (repoFilter !== "all" && repoKey !== repoFilter) continue;
      for (const v of repo.vulnerabilities || []) {
        if (
          searchTerm &&
          !v.package.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !v.summary.toLowerCase().includes(searchTerm.toLowerCase())
        )
          continue;
        vulns.push({ ...v, repoLabel: repo.label, repoKey });
      }
    }
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
    vulns.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));
    return vulns;
  }, [data, repoFilter, searchTerm]);

  // ── Not connected ──
  if (checkingAuth) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Checking GitHub connection...</span>
        </div>
      </div>
    );
  }

  if (!githubUser) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
            Dependency Audit
          </h2>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Audit all package versions and security vulnerabilities across repos
          </p>
        </div>
        <div
          className={`flex flex-col items-center gap-4 rounded-lg border p-8 ${
            isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
          }`}
        >
          <Github className={`h-12 w-12 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Connect your GitHub account to audit dependencies
          </p>
          <a
            href={`${API_BASE}/api/dev/github/connect`}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <Github className="h-4 w-4" />
            Connect to GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
            Dependency Audit
          </h2>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Package versions and security vulnerabilities across all repos
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:opacity-50`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Scanning dependencies across all repos...</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            This may take 20-30 seconds (checking npm registry for each package)
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryCard
              isDarkMode={isDarkMode}
              label="Total"
              value={summary?.totalPackages ?? 0}
              icon={<Package className="h-4 w-4" />}
              color="blue"
            />
            <SummaryCard
              isDarkMode={isDarkMode}
              label="Outdated"
              value={summary?.outdated ?? 0}
              icon={<ArrowUpRight className="h-4 w-4" />}
              color="amber"
            />
            <SummaryCard
              isDarkMode={isDarkMode}
              label="Major"
              value={summary?.major ?? 0}
              icon={<AlertTriangle className="h-4 w-4" />}
              color="orange"
            />
            <SummaryCard
              isDarkMode={isDarkMode}
              label="Minor"
              value={summary?.minor ?? 0}
              icon={<ArrowUpRight className="h-4 w-4" />}
              color="green"
            />
            <SummaryCard
              isDarkMode={isDarkMode}
              label="Patch"
              value={summary?.patch ?? 0}
              icon={<CheckCircle2 className="h-4 w-4" />}
              color="gray"
            />
            <SummaryCard
              isDarkMode={isDarkMode}
              label="Vulnerabilities"
              value={summary?.vulnerabilities?.total ?? 0}
              icon={<ShieldAlert className="h-4 w-4" />}
              color={summary?.vulnerabilities?.total > 0 ? "red" : "emerald"}
            />
          </div>

          {/* View Toggle + Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View toggle */}
            <div className={`inline-flex rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <button
                type="button"
                onClick={() => setActiveView("outdated")}
                className={`inline-flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeView === "outdated"
                    ? isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                Outdated ({summary?.outdated ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveView("vulnerabilities")}
                className={`inline-flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeView === "vulnerabilities"
                    ? isDarkMode
                      ? "bg-red-600 text-white"
                      : "bg-red-500 text-white"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Vulnerabilities ({summary?.vulnerabilities?.total ?? 0})
              </button>
            </div>

            {/* Repo filter toggle buttons */}
            <div className={`inline-flex rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              {[
                { value: "all", label: "All" },
                { value: "backend", label: "Backend" },
                { value: "frontend", label: "Frontend" },
                { value: "deploy", label: "Deploy" },
              ].map((opt, i, arr) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepoFilter(opt.value)}
                  className={`inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition-colors ${
                    i === 0 ? "rounded-l-lg" : ""
                  } ${i === arr.length - 1 ? "rounded-r-lg" : ""} ${
                    repoFilter === opt.value
                      ? isDarkMode
                        ? "bg-gray-600 text-white"
                        : "bg-gray-700 text-white"
                      : isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[120px]">
              <Search
                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search packages..."
                className={`w-full rounded-lg border py-1.5 pl-9 pr-3 text-sm ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800 text-gray-200 placeholder:text-gray-500"
                    : "border-gray-200 bg-white text-gray-700 placeholder:text-gray-400"
                }`}
              />
            </div>

            {/* Dev deps toggle (only for outdated view) */}
            {activeView === "outdated" && (
              <label
                className={`inline-flex items-center gap-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <input
                  type="checkbox"
                  checked={showDevDeps}
                  onChange={(e) => setShowDevDeps(e.target.checked)}
                  className="rounded"
                />
                Dev deps
              </label>
            )}
          </div>

          {/* Content */}
          {activeView === "outdated" ? (
            <OutdatedTable packages={filteredPackages} isDarkMode={isDarkMode} />
          ) : (
            <VulnerabilitiesTable vulns={filteredVulns} isDarkMode={isDarkMode} />
          )}

          {/* Footer */}
          {data.fetchedAt && (
            <p className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
              Last scanned: {new Date(data.fetchedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ isDarkMode, label, value, icon, color }) {
  const colorMap = {
    blue: isDarkMode ? "text-blue-400" : "text-blue-600",
    amber: isDarkMode ? "text-amber-400" : "text-amber-600",
    orange: isDarkMode ? "text-orange-400" : "text-orange-600",
    green: isDarkMode ? "text-green-400" : "text-green-600",
    gray: isDarkMode ? "text-gray-400" : "text-gray-500",
    red: isDarkMode ? "text-red-400" : "text-red-600",
    emerald: isDarkMode ? "text-emerald-400" : "text-emerald-600",
  };

  return (
    <div
      className={`rounded-lg border p-3 ${
        isDarkMode ? "border-gray-700/50 bg-gray-800/40" : "border-gray-200 bg-white"
      }`}
    >
      <div className={`flex items-center gap-1.5 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
        <span className={colorMap[color]}>{icon}</span>
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${colorMap[color]}`}>{value}</div>
    </div>
  );
}

function OutdatedTable({ packages, isDarkMode }) {
  if (packages.length === 0) {
    return (
      <div
        className={`flex flex-col items-center gap-2 rounded-lg border py-12 ${
          isDarkMode ? "border-gray-700/50 bg-gray-800/30" : "border-gray-200 bg-gray-50"
        }`}
      >
        <CheckCircle2 className={`h-8 w-8 ${isDarkMode ? "text-emerald-500" : "text-emerald-600"}`} />
        <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>All packages are up to date</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border ${isDarkMode ? "border-gray-700/50" : "border-gray-200"}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className={isDarkMode ? "bg-gray-800/60" : "bg-gray-50"}>
            <th className={`px-4 py-2.5 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Package
            </th>
            <th className={`px-4 py-2.5 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Repo
            </th>
            <th className={`px-4 py-2.5 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Current
            </th>
            <th className={`px-4 py-2.5 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Latest
            </th>
            <th className={`px-4 py-2.5 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Bump
            </th>
            <th className={`px-4 py-2.5 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Type
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? "divide-gray-700/50" : "divide-gray-100"}`}>
          {packages.map((pkg) => {
            const bump = BUMP_COLORS[pkg.bump] || BUMP_COLORS.unknown;
            const repo = REPO_STYLES[pkg.repoKey] || REPO_STYLES.deploy;
            return (
              <tr
                key={`${pkg.repoKey}-${pkg.name}`}
                className={isDarkMode ? "bg-gray-800/30 hover:bg-gray-800/50" : "bg-white hover:bg-gray-50"}
              >
                <td className="px-4 py-2.5">
                  <a
                    href={`https://www.npmjs.com/package/${pkg.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 font-medium hover:underline ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {pkg.name}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white ${repo.bg}`}
                  >
                    {repo.label}
                  </span>
                </td>
                <td className={`px-4 py-2.5 font-mono text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {pkg.current}
                </td>
                <td
                  className={`px-4 py-2.5 font-mono text-xs font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {pkg.latest}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${bump.bg} ${bump.text} ${bump.border}`}
                  >
                    {bump.label}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {pkg.isDev ? "dev" : "prod"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VulnerabilitiesTable({ vulns, isDarkMode }) {
  if (vulns.length === 0) {
    return (
      <div
        className={`flex flex-col items-center gap-2 rounded-lg border py-12 ${
          isDarkMode ? "border-gray-700/50 bg-gray-800/30" : "border-gray-200 bg-gray-50"
        }`}
      >
        <Shield className={`h-8 w-8 ${isDarkMode ? "text-emerald-500" : "text-emerald-600"}`} />
        <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>No known vulnerabilities</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vulns.map((v, i) => {
        const sev = SEVERITY_COLORS[v.severity] || SEVERITY_COLORS.unknown;
        const repo = REPO_STYLES[v.repoKey] || REPO_STYLES.deploy;
        return (
          <div
            key={`${v.repoKey}-${v.ghsaId || i}`}
            className={`rounded-lg border p-4 ${
              isDarkMode ? "border-gray-700/50 bg-gray-800/30" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${sev.bg} ${sev.text} ${sev.border}`}
                  >
                    {sev.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white ${repo.bg}`}
                  >
                    {repo.label}
                  </span>
                  <span className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{v.package}</span>
                  {v.cve && (
                    <span className={`text-xs font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {v.cve}
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{v.summary}</p>
                <div
                  className={`mt-2 flex flex-wrap items-center gap-4 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  {v.vulnerableRange && (
                    <span>
                      Affected: <code className="font-mono">{v.vulnerableRange}</code>
                    </span>
                  )}
                  {v.patchedVersion && (
                    <span>
                      Fix:{" "}
                      <code className={`font-mono font-medium ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                        {v.patchedVersion}
                      </code>
                    </span>
                  )}
                </div>
              </div>
              {v.url && (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`shrink-0 rounded-lg p-2 transition-colors ${
                    isDarkMode
                      ? "text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
