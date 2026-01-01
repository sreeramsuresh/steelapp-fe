/**
 * AnalyticsDashboard.jsx
 * Landing page for Analytics Hub (/analytics)
 * Provides overview and quick navigation to all analytics sections
 */
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  PieChart,
  Package,
  Truck,
  Star,
  FileText,
  LineChart,
  Coins,
  ArrowRight,
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const { isDarkMode } = useTheme();

  const analyticsCards = [
    {
      section: 'Executive',
      items: [
        {
          name: 'Executive Dashboard',
          description: 'Key performance indicators and business metrics',
          path: '/analytics/dashboard',
          icon: TrendingUp,
          color: 'from-blue-500 to-blue-600',
        },
      ],
    },
    {
      section: 'Sales Analytics',
      items: [
        {
          name: 'Profit Analysis',
          description:
            'Profit breakdown and margin analysis by product/customer',
          path: '/analytics/profit-analysis',
          icon: DollarSign,
          color: 'from-green-500 to-green-600',
        },
        {
          name: 'Price History',
          description: 'Historical price trends and analysis',
          path: '/analytics/price-history',
          icon: LineChart,
          color: 'from-emerald-500 to-emerald-600',
        },
      ],
    },
    {
      section: 'Finance Dashboards',
      items: [
        {
          name: 'AR Aging Report',
          description: 'Accounts receivable aging analysis by customer',
          path: '/analytics/ar-aging',
          icon: Clock,
          color: 'from-orange-500 to-orange-600',
        },
        {
          name: 'Commission Dashboard',
          description: 'Sales commission tracking and analytics',
          path: '/analytics/commission-dashboard',
          icon: Coins,
          color: 'from-yellow-500 to-yellow-600',
        },
      ],
    },
    {
      section: 'Inventory Analytics',
      items: [
        {
          name: 'Batch Analytics',
          description: 'Track and analyze inventory batch performance',
          path: '/analytics/batch-analytics',
          icon: PieChart,
          color: 'from-purple-500 to-purple-600',
        },
        {
          name: 'Stock Movement Report',
          description: 'Stock movement history and trends',
          path: '/analytics/stock-movement-report',
          icon: Package,
          color: 'from-violet-500 to-violet-600',
        },
      ],
    },
    {
      section: 'Purchase Analytics',
      items: [
        {
          name: 'Delivery Performance',
          description: 'Supplier delivery variance and performance metrics',
          path: '/analytics/delivery-performance',
          icon: Truck,
          color: 'from-cyan-500 to-cyan-600',
        },
        {
          name: 'Supplier Performance',
          description: 'Supplier KPI analytics and ratings',
          path: '/analytics/supplier-performance',
          icon: Star,
          color: 'from-teal-500 to-teal-600',
        },
      ],
    },
    {
      section: 'Reports',
      items: [
        {
          name: 'Reports Hub',
          description: 'Sales analytics, revenue trends, and VAT returns',
          path: '/analytics/reports',
          icon: FileText,
          color: 'from-indigo-500 to-indigo-600',
        },
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      {/* Header */}
      <div
        className={`${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} border-b ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}
      >
        <div className="px-6 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Analytics Hub
              </h1>
              <p
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Business insights, performance metrics, and reports
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {analyticsCards.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                {section.section}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      className={`group block p-5 rounded-xl border transition-all duration-200 no-underline ${
                        isDarkMode
                          ? 'bg-[#1E2328] border-[#37474F] hover:border-indigo-500 hover:bg-[#252a30]'
                          : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {item.name}
                            </h3>
                            <ArrowRight
                              size={16}
                              className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                                isDarkMode
                                  ? 'text-indigo-400'
                                  : 'text-indigo-600'
                              }`}
                            />
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
