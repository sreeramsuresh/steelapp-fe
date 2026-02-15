import { TableProperties, Users } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const UserManagementTab = lazy(() => import("../components/settings/UserManagementTab"));
const PermissionsMatrix = lazy(() => import("./PermissionsMatrix"));

const tabs = [
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "permissions", label: "Permissions Matrix", icon: TableProperties },
];

const LoadingSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`animate-pulse rounded-xl p-6 ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}>
      <div className={`h-6 w-48 rounded mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <div className={`h-4 w-full rounded mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <div className={`h-4 w-3/4 rounded mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <div className={`h-4 w-1/2 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
    </div>
  );
};

const UserManagementPage = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [mountedTabs, setMountedTabs] = useState({ users: true });
  const { isDarkMode } = useTheme();

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMountedTabs((prev) => ({ ...prev, [tabId]: true }));
  };

  return (
    <div
      className={`p-4 md:p-6 lg:p-8 min-h-screen w-full overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      {/* Header */}
      <div
        className={`mb-6 rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"} shadow-sm`}
      >
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Users size={28} className={isDarkMode ? "text-gray-300" : "text-gray-700"} />
            <div>
              <h1 className={`text-2xl font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                User Management
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage users, roles, and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className={`${isDarkMode ? "bg-gray-800 border-y border-[#37474F]" : "bg-white border-y border-gray-200"}`}
        >
          <div className={`flex flex-wrap gap-2 p-2 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors duration-200 ${
                    isDarkMode
                      ? isActive
                        ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                        : "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : isActive
                        ? "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                        : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content — mount on first visit, hide via CSS to preserve state */}
      <div className="mt-6">
        <div className={activeTab === "users" ? "" : "hidden"}>
          {mountedTabs.users && (
            <Suspense fallback={<LoadingSkeleton />}>
              <UserManagementTab />
            </Suspense>
          )}
        </div>
        <div className={activeTab === "permissions" ? "" : "hidden"}>
          {mountedTabs.permissions && (
            <Suspense fallback={<LoadingSkeleton />}>
              <PermissionsMatrix />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
