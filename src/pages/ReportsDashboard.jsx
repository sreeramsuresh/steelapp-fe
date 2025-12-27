import { useState, lazy, Suspense } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart3,
  TrendingUp,
  FileText,
  PieChart,
  Receipt,
  Loader2,
} from 'lucide-react';

// Lazy-load tab components for better initial load performance
const SalesAnalytics = lazy(() => import('../components/SalesAnalytics'));
const RevenueTrends = lazy(() => import('../components/RevenueTrends'));
const VATReturnReport = lazy(() => import('../components/VATReturnReport'));

// Tab loading fallback
const TabLoadingFallback = ({ isDarkMode }) => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
  </div>
);

const ReportsDashboard = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    {
      id: 'analytics',
      label: 'Sales Analytics',
      icon: BarChart3,
      component: SalesAnalytics,
    },
    {
      id: 'trends',
      label: 'Revenue Trends',
      icon: TrendingUp,
      component: RevenueTrends,
    },
    {
      id: 'vat-return',
      label: 'VAT Return (Form 201)',
      icon: Receipt,
      component: VATReturnReport,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Header */}
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                📊 Reports & Analytics
              </h1>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Business insights and performance analytics
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors ${
                    isActive
                      ? `border-purple-600 ${isDarkMode ? 'bg-gray-700 text-purple-400' : 'bg-gray-50 text-purple-600'}`
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
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

      {/* Tab Content - Lazy loaded with Suspense */}
      <div className="flex-1">
        <Suspense fallback={<TabLoadingFallback isDarkMode={isDarkMode} />}>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </div>
    </div>
  );
};

export default ReportsDashboard;
