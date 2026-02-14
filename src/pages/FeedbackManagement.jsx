/**
 * FeedbackManagement.jsx
 * Admin page for viewing and managing user feedback
 */
import { Download, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/axiosApi";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  reviewed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const NEXT_STATUS = {
  new: ["reviewed"],
  reviewed: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};

const FeedbackManagement = () => {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({ new: 0, reviewed: 0, resolved: 0, dismissed: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (activeFilter) params.set("status", activeFilter);
      const res = await api.get(`/feedback?${params}`);
      setData(res.data.data);
      setCounts(res.data.counts);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/feedback/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchFeedback();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleExport = async () => {
    try {
      const params = activeFilter ? `?status=${activeFilter}` : "";
      const res = await api.get(`/feedback/export${params}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-export-${new Date().toISOString().split("T")[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Failed to export feedback");
    }
  };

  const totalPages = Math.ceil(total / 20);

  const filterTabs = [
    { key: "", label: "All", count: counts.new + counts.reviewed + counts.resolved + counts.dismissed },
    { key: "new", label: "New", count: counts.new },
    { key: "reviewed", label: "Reviewed", count: counts.reviewed },
    { key: "resolved", label: "Resolved", count: counts.resolved },
    { key: "dismissed", label: "Dismissed", count: counts.dismissed },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-teal-600" size={24} />
          <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>User Feedback</h1>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          <Download size={16} />
          Download for Claude
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveFilter(tab.key); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === tab.key
                ? "bg-teal-600 text-white"
                : isDarkMode
                  ? "bg-[#2A2F35] text-gray-300 hover:bg-[#37474F]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={isDarkMode ? "bg-[#2A2F35] text-gray-400" : "bg-gray-50 text-gray-600"}>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Message</th>
              <th className="text-left px-4 py-3 font-medium">Reported By</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  No feedback found
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const browserInfo = item.browserInfo || {};
                const isExpanded = expandedId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`border-t ${isDarkMode ? "border-[#37474F] hover:bg-[#2A2F35]" : "border-gray-100 hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {item.routeLabel || "—"}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {item.routePath}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {isExpanded ? item.message : item.message.length > 80 ? `${item.message.slice(0, 80)}...` : item.message}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{item.userName}</div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{item.userEmail}</div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(item.createdAt).toLocaleDateString()}
                      <div className="text-xs">
                        {browserInfo.screenWidth && `${browserInfo.screenWidth}x${browserInfo.screenHeight}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {NEXT_STATUS[item.status]?.length > 0 ? (
                        <div className="flex gap-1">
                          {NEXT_STATUS[item.status].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleStatusChange(item.id, s)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                isDarkMode ? "bg-[#2A2F35] text-gray-300 hover:bg-[#37474F]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Page {page} of {totalPages} ({total} items)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className={`px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 ${
                isDarkMode ? "bg-[#2A2F35] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className={`px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 ${
                isDarkMode ? "bg-[#2A2F35] text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
