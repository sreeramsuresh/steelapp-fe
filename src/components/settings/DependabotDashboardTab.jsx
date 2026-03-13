import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  LogOut,
  Package,
  RefreshCw,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import devService from "../../services/devService";

const BUMP_COLORS = {
  security: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", label: "security" },
  major: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", label: "major" },
  minor: { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30", label: "minor" },
  patch: { bg: "bg-gray-500/12", text: "text-gray-400", border: "border-gray-500/20", label: "patch" },
};

const ECOSYSTEM_STYLES = {
  backend: { bg: "bg-emerald-600", label: "BE" },
  frontend: { bg: "bg-blue-600", label: "FE" },
  deploy: { bg: "bg-purple-600", label: "CI" },
};

function getEcosystemKey(repoLabel) {
  if (repoLabel?.includes("Backend")) return "backend";
  if (repoLabel?.includes("Frontend")) return "frontend";
  return "deploy";
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function DependabotDashboardTab() {
  const { isDarkMode } = useTheme();
  const [githubUser, setGithubUser] = useState(null); // { login, avatarUrl } or null
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  // Check GitHub connection status on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await devService.getGitHubStatus();
        const status = res.data || res;
        if (status.connected) {
          setGithubUser({ login: status.login, avatarUrl: status.avatarUrl });
        }
      } catch {
        // Not connected — that's fine
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await devService.getDependabotPrs();
      setData(res.data || res);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.error === "github_not_connected") {
        setGithubUser(null);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when connected
  useEffect(() => {
    if (githubUser) fetchData();
  }, [githubUser, fetchData]);

  const handleConnect = () => {
    window.location.href = `${API_BASE}/api/dev/github/connect`;
  };

  const handleDisconnect = async () => {
    try {
      await devService.disconnectGitHub();
      setGithubUser(null);
      setData(null);
    } catch {
      // Ignore
    }
  };

  const handleDismiss = async (prNumber, repo) => {
    if (!window.confirm(`Close PR #${prNumber} without merging?`)) return;
    setDismissing(prNumber);
    try {
      await devService.dismissPr(prNumber, repo);
      fetchData();
    } catch (err) {
      alert(`Failed to close PR: ${err.message}`);
    } finally {
      setDismissing(null);
    }
  };

  const cardBg = isDarkMode ? "bg-[#161b22]" : "bg-white";
  const cardBorder = isDarkMode ? "border-[#30363d]" : "border-gray-200";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const textMuted = isDarkMode ? "text-gray-500" : "text-gray-400";
  const tableBg = isDarkMode ? "bg-[#161b22]" : "bg-white";
  const tableHeaderBg = isDarkMode ? "bg-[#1c2128]" : "bg-gray-50";
  const tableRowHover = isDarkMode ? "hover:bg-[#1c2128]" : "hover:bg-gray-50";
  const tableBorderColor = isDarkMode ? "border-[#21262d]" : "border-gray-100";

  // ── Loading auth check ───────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className={`rounded-2xl border p-8 ${cardBg} ${cardBorder}`}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-500" />
          <span className={textSecondary}>Checking GitHub connection...</span>
        </div>
      </div>
    );
  }

  // ── Not connected — show connect prompt ──────────────────────
  if (!githubUser) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${cardBg} ${cardBorder}`}>
        <Github className={`w-12 h-12 mx-auto mb-4 ${textMuted}`} />
        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Connect GitHub</h3>
        <p className={`text-sm mb-6 max-w-md mx-auto ${textSecondary}`}>
          Authorize with GitHub to view Dependabot pull requests across all project repositories. Your token is stored
          securely in an encrypted cookie.
        </p>
        <button
          type="button"
          onClick={handleConnect}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#238636] text-white text-sm font-medium hover:bg-[#2ea043] transition-colors"
        >
          <Github className="w-4 h-4" />
          Connect GitHub Account
        </button>
      </div>
    );
  }

  // ── Connected — show dashboard ───────────────────────────────

  if (loading && !data) {
    return (
      <div className={`rounded-2xl border p-8 ${cardBg} ${cardBorder}`}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-500" />
          <span className={textSecondary}>Fetching Dependabot PRs from GitHub...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border p-8 ${cardBg} ${cardBorder}`}>
        <div className="flex items-center gap-3 text-red-400">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="mt-4 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { repos = [], summary = {}, fetchedAt } = data || {};
  const hasNoPrs = summary.total === 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header with GitHub user + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Dependabot Updates</h2>
          <div className="flex items-center gap-3 mt-1">
            {githubUser.avatarUrl && <img src={githubUser.avatarUrl} alt="" className="w-5 h-5 rounded-full" />}
            <span className={`text-xs ${textMuted}`}>
              Connected as <span className="font-medium">{githubUser.login}</span>
            </span>
            {fetchedAt && (
              <span className={`text-xs ${textMuted}`}>
                &middot; Last checked: {new Date(fetchedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isDarkMode
                ? "bg-[#21262d] border-[#30363d] text-gray-200 hover:bg-[#30363d]"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
              isDarkMode
                ? "border-[#30363d] text-gray-400 hover:text-red-400 hover:border-red-800/50"
                : "border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200"
            }`}
            title="Disconnect GitHub"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Open PRs", value: summary.total, color: "text-blue-400", sub: `across ${repos.length} repos` },
          { label: "Security", value: summary.security, color: "text-red-400", sub: "vulnerabilities" },
          { label: "Major", value: summary.major, color: "text-amber-400", sub: "breaking changes" },
          { label: "Minor", value: summary.minor, color: "text-green-400", sub: "new features" },
          { label: "Patch", value: summary.patch, color: "text-gray-400", sub: "bug fixes" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${cardBg} ${cardBorder}`}>
            <p className={`text-xs uppercase tracking-wide mb-1 ${textMuted}`}>{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value ?? 0}</p>
            <p className={`text-[11px] mt-1 ${textMuted}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {hasNoPrs && (
        <div className={`rounded-2xl border p-12 text-center ${cardBg} ${cardBorder}`}>
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className={`text-lg font-medium ${textPrimary}`}>All dependencies are up to date</p>
          <p className={`text-sm mt-1 ${textSecondary}`}>No open Dependabot pull requests</p>
        </div>
      )}

      {/* Repo sections */}
      {repos
        .filter((r) => r.prs?.length > 0)
        .map((repoData) => {
          const ecoKey = getEcosystemKey(repoData.label);
          const eco = ECOSYSTEM_STYLES[ecoKey];

          return (
            <div key={repoData.repo} className="space-y-3">
              {/* Section header */}
              <div className={`flex items-center gap-3 pb-2 border-b ${tableBorderColor}`}>
                <span
                  className={`${eco.bg} text-white text-[11px] font-bold w-6 h-6 rounded flex items-center justify-center`}
                >
                  {eco.label}
                </span>
                <span className={`text-sm font-semibold ${textPrimary}`}>
                  {repoData.label} — {repoData.repo}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDarkMode ? "bg-[#21262d] text-gray-400" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {repoData.prs.length} update{repoData.prs.length !== 1 ? "s" : ""}
                </span>
                {repoData.error && <span className="text-xs text-red-400 ml-auto">{repoData.error}</span>}
              </div>

              {/* Table */}
              <div className={`rounded-xl border overflow-hidden ${cardBorder}`}>
                <table className={`w-full ${tableBg}`}>
                  <thead>
                    <tr className={tableHeaderBg}>
                      <th
                        className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${textMuted} border-b ${tableBorderColor}`}
                      >
                        Package
                      </th>
                      <th
                        className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${textMuted} border-b ${tableBorderColor}`}
                      >
                        Version
                      </th>
                      <th
                        className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${textMuted} border-b ${tableBorderColor}`}
                      >
                        Type
                      </th>
                      <th
                        className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${textMuted} border-b ${tableBorderColor}`}
                      >
                        PR
                      </th>
                      <th
                        className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${textMuted} border-b ${tableBorderColor}`}
                      >
                        Age
                      </th>
                      <th
                        className={`text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${textMuted} border-b ${tableBorderColor}`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {repoData.prs.map((pr) => {
                      const bump = BUMP_COLORS[pr.bumpType] || BUMP_COLORS.patch;
                      const age = timeAgo(pr.createdAt);
                      const ageDays = Math.floor((Date.now() - new Date(pr.createdAt).getTime()) / 86400000);

                      return (
                        <tr
                          key={pr.number}
                          className={`${tableRowHover} transition-colors border-b ${tableBorderColor} last:border-b-0`}
                        >
                          {/* Package */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className={`w-4 h-4 ${textMuted}`} />
                              <span className={`text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                                {pr.packageName}
                              </span>
                            </div>
                          </td>

                          {/* Version */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">
                              <span className={textMuted}>{pr.versionFrom}</span>
                              {pr.versionFrom && (
                                <>
                                  <span className={`mx-1.5 ${textMuted}`}>&rarr;</span>
                                  <span className="text-green-400">{pr.versionTo}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Type badge */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${bump.bg} ${bump.text} ${bump.border}`}
                            >
                              {pr.bumpType === "security" && <Shield className="w-3 h-3" />}
                              {pr.bumpType === "major" && <AlertTriangle className="w-3 h-3" />}
                              {bump.label}
                            </span>
                          </td>

                          {/* PR link */}
                          <td className="px-4 py-3">
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 text-xs ${
                                isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                              }`}
                            >
                              #{pr.number}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>

                          {/* Age */}
                          <td className="px-4 py-3">
                            <span
                              className={`flex items-center gap-1 text-xs ${ageDays > 7 ? "text-amber-400" : textMuted}`}
                            >
                              <Clock className="w-3 h-3" />
                              {age}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={pr.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                  isDarkMode
                                    ? "bg-[#21262d] border-[#30363d] text-gray-300 hover:bg-[#30363d]"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                View
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDismiss(pr.number, repoData.repo)}
                                disabled={dismissing === pr.number}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                  isDarkMode
                                    ? "border-red-800/50 text-red-400 hover:bg-red-900/30"
                                    : "border-red-200 text-red-500 hover:bg-red-50"
                                }`}
                              >
                                <X className="w-3 h-3" />
                                {dismissing === pr.number ? "..." : "Dismiss"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
}
