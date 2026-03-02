import { GitBranch, Shield } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ExpenseApprovalChainList from "./ExpenseApprovalChainList";
import ExpensePolicyList from "./ExpensePolicyList";

const tabs = [
  { id: "policies", label: "Policies", icon: Shield, component: ExpensePolicyList },
  { id: "approvals", label: "Approval Chains", icon: GitBranch, component: ExpenseApprovalChainList },
];

const ExpenseConfigHub = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("policies");

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Expense Config</h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Policies & approval chains</p>
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors ${
                    isActive
                      ? `border-blue-600 ${isDarkMode ? "bg-gray-700 text-blue-400" : "bg-gray-50 text-blue-600"}`
                      : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-1">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  );
};

export default ExpenseConfigHub;
