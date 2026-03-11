import { AlertCircle, ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEARCH_GROUPS from "../config/searchGroups";
import { useTheme } from "../contexts/ThemeContext";
import globalSearchService from "../services/globalSearchService";

const SectionHeader = ({ icon: Icon, title, count, isDarkMode }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-teal-600" />
      <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300"}`}
      >
        {count}
      </span>
    </div>
  </div>
);

const SearchResults = () => {
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [grouped, setGrouped] = useState({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!q || q.length < 2) {
        setGrouped({});
        setTotal(0);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await globalSearchService.search(q, { limit: 100 });
        if (cancelled) return;
        setGrouped(data?.grouped || {});
        setTotal(data?.total || 0);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to search");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const groupsWithResults = SEARCH_GROUPS.filter((g) => grouped[g.key] && grouped[g.key].length > 0);

  return (
    <div className={`p-4 md:p-6 min-h-[calc(100vh-64px)] ${isDarkMode ? "bg-gray-900" : "bg-[#FAFAFA]"}`}>
      <div
        className={`rounded-xl border p-4 md:p-6 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="mb-4 md:mb-6 flex items-center gap-3">
          <Search size={22} className="text-teal-600" />
          <h1 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Search results
          </h1>
          {q && (
            <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              for &ldquo;{q}&rdquo; {!loading && `(${total} results)`}
            </span>
          )}
        </div>

        {error && (
          <div
            className={`mb-4 p-3 rounded border flex items-center gap-2 ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Searching…</span>
          </div>
        ) : groupsWithResults.length === 0 && q ? (
          <div className="py-10 text-center">
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              No results for &ldquo;{q}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {groupsWithResults.map((group) => {
              const items = grouped[group.key];
              const Icon = group.icon;
              return (
                <div
                  key={group.key}
                  className={`rounded-lg border p-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <SectionHeader icon={Icon} title={group.label} count={items.length} isDarkMode={isDarkMode} />
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <Link
                        to={group.path(item)}
                        key={item.id}
                        className={`flex items-center justify-between py-2 px-1 rounded ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-teal-600 truncate">{item.primaryText}</div>
                          <div className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {item.secondaryText}
                          </div>
                        </div>
                        <ArrowRight size={14} className="shrink-0 text-gray-400 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
