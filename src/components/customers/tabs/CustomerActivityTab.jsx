/**
 * Customer Activity Tab
 *
 * Displays chronological activity timeline for a specific customer with comprehensive tracking:
 * - Timeline View: Reverse chronological order (newest first)
 * - Activity Types: Note, Call, Email, Follow-up, Promise to Pay, Dispute
 * - Filters: Activity type filter, search by content
 * - Add Activity: Form to create new activity entries (when backend ready)
 * - Visual Icons: Type-specific icons and color coding
 *
 * Performance Features:
 * - 5-minute data caching to reduce API calls
 * - Manual refresh button to force cache clear
 * - Loading states with spinner
 * - Error handling with retry capability
 *
 * Backend Integration Status:
 * - TODO: API not yet implemented
 * - Currently using mock data for UI development
 * - Expected Endpoint: GET /api/activities?customerId={customerId}&entityType=customer
 * - Expected POST Endpoint: POST /api/activities for creating new activities
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.customerId - Customer ID to fetch activities for
 * @returns {JSX.Element} Activity timeline with filters and add form
 */

import {
  AlertTriangle,
  Bell,
  Calendar,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import api from "../../../services/api";
import { formatDate } from "../../../utils/invoiceUtils";

export default function CustomerActivityTab({ customerId }) {
  const { isDarkMode } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Caching state
  const [cachedData, setCachedData] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New activity form
  const [newActivity, setNewActivity] = useState({
    type: "note",
    content: "",
    tags: "",
  });

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/activities?customerId=${customerId}&entityType=customer`);
      const activityData = response.data?.activities || response.data || [];

      setActivities(activityData);
      setFilteredActivities(activityData);
      setCachedData(activityData);
      setCacheTimestamp(Date.now());
    } catch (err) {
      console.warn("Activities API not available:", err.message);
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  /*
  // Mock data preserved for reference:
  const mockActivitiesRef = [
      {
        id: 1,
        type: "note",
        date: "2025-01-15T10:30:00Z",
        user: "John Doe",
        content: "Called customer regarding overdue invoice INV-2025-001. Customer promised payment by end of week.",
        tags: ["follow-up", "payment-issue"],
      },
      {
        id: 2,
        type: "call",
        date: "2025-01-10T14:20:00Z",
        user: "Sarah Smith",
        content: "Outbound call to discuss new product catalog. Customer expressed interest in stainless steel sheets.",
        tags: ["sales", "product-inquiry"],
      },
      {
        id: 3,
        type: "email",
        date: "2025-01-08T09:15:00Z",
        user: "Mike Johnson",
        content: "Sent monthly statement and aging report. Highlighted overdue amounts.",
        tags: ["statement", "ar-aging"],
      },
      {
        id: 4,
        type: "follow-up",
        date: "2025-01-05T16:45:00Z",
        user: "John Doe",
        content: "Follow-up on payment promise. Customer confirmed payment is being processed.",
        tags: ["follow-up", "payment-confirmation"],
      },
      {
        id: 5,
        type: "promise-to-pay",
        date: "2025-01-03T11:00:00Z",
        user: "Sarah Smith",
        content: "Customer committed to pay AED 50,000 by January 10th for invoices INV-2024-458 and INV-2024-461.",
        tags: ["payment-promise", "commitment"],
      },
      {
        id: 6,
        type: "dispute",
        date: "2024-12-28T13:30:00Z",
        user: "Mike Johnson",
        content:
          "Customer disputed invoice INV-2024-445 due to quality issue with delivered materials. Investigating with warehouse team.",
        tags: ["dispute", "quality-issue", "investigation"],
      },
    ],
  */

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cachedData || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  }, [cachedData, cacheTimestamp]);

  // Manual refresh - clears cache and refetches
  const handleRefresh = () => {
    setCachedData(null);
    setCacheTimestamp(null);
    fetchActivities();
  };

  useEffect(() => {
    if (customerId) {
      // Use cache if valid
      if (isCacheValid()) {
        setActivities(cachedData);
        setFilteredActivities(cachedData);
        setLoading(false);
        return;
      }

      // Otherwise fetch fresh data
      fetchActivities();
    }
  }, [customerId, cachedData, isCacheValid, fetchActivities]);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((activity) => activity.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.content.toLowerCase().includes(query) ||
          activity.user.toLowerCase().includes(query) ||
          activity.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredActivities(filtered);
  }, [activities, typeFilter, searchQuery]);

  // Activity type configuration
  const activityTypeConfig = {
    note: {
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: isDarkMode ? "bg-blue-900/30" : "bg-blue-100",
      label: "Note",
    },
    call: {
      icon: Phone,
      color: "text-green-500",
      bgColor: isDarkMode ? "bg-green-900/30" : "bg-green-100",
      label: "Call",
    },
    email: {
      icon: Mail,
      color: "text-purple-500",
      bgColor: isDarkMode ? "bg-purple-900/30" : "bg-purple-100",
      label: "Email",
    },
    "follow-up": {
      icon: Bell,
      color: "text-yellow-500",
      bgColor: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100",
      label: "Follow-up",
    },
    "promise-to-pay": {
      icon: DollarSign,
      color: "text-teal-500",
      bgColor: isDarkMode ? "bg-teal-900/30" : "bg-teal-100",
      label: "Promise to Pay",
    },
    dispute: {
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: isDarkMode ? "bg-red-900/30" : "bg-red-100",
      label: "Dispute",
    },
  };

  // Handle add activity
  const handleAddActivity = async (e) => {
    e.preventDefault();

    // TODO: Implement API call when backend is ready
    // try {
    //   const response = await apiClient.post('/activities', {
    //     customerId,
    //     entityType: 'customer',
    //     type: newActivity.type,
    //     content: newActivity.content,
    //     tags: newActivity.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    //   });
    //
    //   setActivities([response.activity, ...activities]);
    //   setIsAddingActivity(false);
    //   setNewActivity({ type: 'note', content: '', tags: '' });
    // } catch (err) {
    //   console.error('Failed to create activity:', err);
    //   alert('Failed to create activity. Please try again.');
    // }

    // Mock implementation for UI demonstration
    const mockNewActivity = {
      id: activities.length + 1,
      type: newActivity.type,
      date: new Date().toISOString(),
      user: "Current User", // TODO: Get from auth context
      content: newActivity.content,
      tags: newActivity.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    };

    setActivities([mockNewActivity, ...activities]);
    setIsAddingActivity(false);
    setNewActivity({ type: "note", content: "", tags: "" });
  };

  // Styling
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const primaryText = isDarkMode ? "text-gray-100" : "text-gray-900";
  const secondaryText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const mutedText = isDarkMode ? "text-gray-500" : "text-gray-400";
  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`p-6 rounded-lg ${isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"} border`}
      >
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-red-500" />
          <p className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>Error Loading Activities</p>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>{error}</p>
        <button
          type="button"
          onClick={fetchActivities}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${primaryText}`}>Customer Activity Timeline</h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
          }`}
          title="Refresh activity data"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* TODO: Backend Integration Notice */}
      <div
        className={`p-4 rounded-lg border ${isDarkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200"}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-500 mt-0.5" />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? "text-yellow-400" : "text-yellow-700"}`}>
              Development Mode - Mock Data
            </p>
            <p className={`text-xs ${isDarkMode ? "text-yellow-300" : "text-yellow-600"} mt-1`}>
              This tab is using mock data. Backend API integration needed at GET /api/activities and POST
              /api/activities
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Add Button */}
      <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="activity-type-filter" className={`block text-sm font-medium ${secondaryText} mb-2`}>
              Activity Type
            </label>
            <select
              id="activity-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Types</option>
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="follow-up">Follow-up</option>
              <option value="promise-to-pay">Promise to Pay</option>
              <option value="dispute">Dispute</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="activity-search" className={`block text-sm font-medium ${secondaryText} mb-2`}>
              Search Activities
            </label>
            <div className="relative">
              <Search size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mutedText}`} />
              <input
                id="activity-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content, user, or tags..."
                className={`w-full pl-10 pr-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Add Activity Button */}
          <div>
            <button
              type="button"
              onClick={() => setIsAddingActivity(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Add Activity
            </button>
          </div>
        </div>
      </div>

      {/* Add Activity Form */}
      {isAddingActivity && (
        <div className={`${cardBg} border ${borderColor} rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${primaryText}`}>Add New Activity</h3>
            <button type="button" onClick={() => setIsAddingActivity(false)} className={`p-1 rounded ${hoverBg}`}>
              <X size={20} className={secondaryText} />
            </button>
          </div>

          <form onSubmit={handleAddActivity} className="space-y-4">
            <div>
              <label htmlFor="new-activity-type" className={`block text-sm font-medium ${secondaryText} mb-2`}>
                Activity Type
              </label>
              <select
                id="new-activity-type"
                value={newActivity.type}
                onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="follow-up">Follow-up</option>
                <option value="promise-to-pay">Promise to Pay</option>
                <option value="dispute">Dispute</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-activity-content" className={`block text-sm font-medium ${secondaryText} mb-2`}>
                Content
              </label>
              <textarea
                id="new-activity-content"
                value={newActivity.content}
                onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
                placeholder="Describe the activity..."
                rows={4}
                className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
            </div>

            <div>
              <label htmlFor="new-activity-tags" className={`block text-sm font-medium ${secondaryText} mb-2`}>
                Tags (comma-separated)
              </label>
              <input
                id="new-activity-tags"
                type="text"
                value={newActivity.tags}
                onChange={(e) => setNewActivity({ ...newActivity, tags: e.target.value })}
                placeholder="follow-up, payment-issue, urgent"
                className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddingActivity(false)}
                className={`px-4 py-2 rounded-md border ${borderColor} ${primaryText} ${hoverBg} transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Timeline */}
      <div className={`${cardBg} border ${borderColor} rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold ${primaryText} mb-6`}>Activity Timeline</h3>

        {filteredActivities.length === 0 ? (
          <div className={`text-center py-12 ${secondaryText}`}>
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No activities found</p>
            {(typeFilter !== "all" || searchQuery) && <p className="text-sm mt-2">Try adjusting your filters</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((activity, index) => {
              const config = activityTypeConfig[activity.type] || activityTypeConfig.note;
              const Icon = config.icon;

              return (
                <div key={activity.id} className="relative">
                  {/* Timeline line */}
                  {index < filteredActivities.length - 1 && (
                    <div
                      className={`absolute left-6 top-12 bottom-0 w-0.5 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                    />
                  )}

                  {/* Activity card */}
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}
                    >
                      <Icon size={20} className={config.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                          <span className={`text-sm ${mutedText} ml-2`}>by {activity.user}</span>
                        </div>
                        <div className={`text-sm ${mutedText} flex items-center gap-1`}>
                          <Calendar size={14} />
                          {formatDate(activity.date)}
                        </div>
                      </div>

                      <p className={`text-sm ${primaryText} mb-2`}>{activity.content}</p>

                      {activity.tags && activity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {activity.tags.map((tag, _idx) => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 rounded text-xs ${
                                isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
