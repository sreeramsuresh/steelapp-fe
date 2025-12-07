import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  FileText,
  Settings,
  Calculator,
} from 'lucide-react';
import { commissionService } from '../services/commissionService';
import { formatCurrency } from '../utils/invoiceUtils';
import { notificationService } from '../services/notificationService';
import SalesAgentsManagement from '../components/SalesAgentsManagement';
import CommissionTransactions from '../components/CommissionTransactions';
import CommissionPlans from '../components/CommissionPlans';

const CommissionDashboard = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [calculatingBatch, setCalculatingBatch] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await commissionService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCalculate = async () => {
    if (calculatingBatch) return;

    try {
      setCalculatingBatch(true);
      const response = await commissionService.batchCalculateCommissions();

      if (response.success) {
        notificationService.success(
          `Successfully calculated commissions for ${response.data.processed} invoices`,
        );
        // Reload dashboard to show new commission data
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error batch calculating commissions:', error);
      notificationService.error(error.message || 'Failed to calculate commissions');
    } finally {
      setCalculatingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading commission data...
          </p>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Commission Management
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track sales commissions, agents, and payments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchCalculate}
                disabled={calculatingBatch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calculatingBatch ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    <span>Batch Calculate All</span>
                  </>
                )}
              </button>
              <button
                onClick={loadDashboardData}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'agents', label: 'Sales Agents', icon: Users },
              { id: 'transactions', label: 'Transactions', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors ${
                    isActive
                      ? `border-green-600 ${isDarkMode ? 'bg-gray-700 text-green-400' : 'bg-gray-50 text-green-600'}`
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Agents */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sales Agents
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {summary.totalAgents || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Pending Commissions */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pending
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(parseFloat(summary.pendingAmount || 0))}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Approved Commissions */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Approved
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(parseFloat(summary.approvedAmount || 0))}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Paid Commissions */}
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Paid
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(parseFloat(summary.paidAmount || 0))}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Agents */}
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Award className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Top Performing Agents
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {(dashboardData?.topAgents || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className={`h-12 w-12 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No commission data available yet
                      </p>
                    </div>
                  ) : (
                    dashboardData.topAgents.slice(0, 5).map((agent, index) => (
                      <div
                        key={agent.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-600'
                              : index === 1
                                ? 'bg-gray-200 text-gray-600'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-600'
                                  : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {agent.fullName}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {agent.transactionCount} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(parseFloat(agent.totalCommission || 0))}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Sales: {formatCurrency(parseFloat(agent.totalSales || 0))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <FileText className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recent Transactions
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Agent
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Invoice
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Sale Amount
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Commission
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {(dashboardData?.recentTransactions || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center">
                          <FileText className={`h-12 w-12 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No transactions yet
                          </p>
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {transaction.agentName}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {transaction.invoiceNumber || '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formatCurrency(parseFloat(transaction.saleAmount || 0))}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formatCurrency(parseFloat(transaction.commissionAmount || 0))}
                            <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              ({transaction.commissionRate}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <SalesAgentsManagement />
        )}

        {activeTab === 'transactions' && (
          <CommissionTransactions />
        )}

        {activeTab === 'settings' && (
          <CommissionPlans />
        )}
      </div>
    </div>
  );
};

export default CommissionDashboard;
