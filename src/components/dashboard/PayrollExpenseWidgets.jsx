import { Banknote, DollarSign, PieChart, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { costCenterReportService } from "../../services/costCenterReportService";
import { expenseAnalyticsService } from "../../services/expenseAnalyticsService";
import { payrollReportService } from "../../services/payrollReportService";
import BaseWidget, { MetricValue, WidgetEmptyState, WidgetListItem } from "./widgets/BaseWidget";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PayrollExpenseWidgets = () => {
  const { isDarkMode } = useTheme();
  const [costTrend, setCostTrend] = useState({ data: [], loading: true, error: null });
  const [expenseTrend, setExpenseTrend] = useState({ data: [], loading: true, error: null });
  const [topCategories, setTopCategories] = useState({ data: [], loading: true, error: null });
  const [budgetUtil, setBudgetUtil] = useState({ data: [], loading: true, error: null });

  const fetchCostTrend = useCallback(async () => {
    try {
      setCostTrend((s) => ({ ...s, loading: true, error: null }));
      const res = await payrollReportService.getCostTrend();
      setCostTrend({ data: res.data?.data || [], loading: false, error: null });
    } catch (err) {
      setCostTrend({ data: [], loading: false, error: err.message || "Failed to load" });
    }
  }, []);

  const fetchExpenseTrend = useCallback(async () => {
    try {
      setExpenseTrend((s) => ({ ...s, loading: true, error: null }));
      const res = await expenseAnalyticsService.getTrend(6);
      setExpenseTrend({ data: res.data?.data || [], loading: false, error: null });
    } catch (err) {
      setExpenseTrend({ data: [], loading: false, error: err.message || "Failed to load" });
    }
  }, []);

  const fetchTopCategories = useCallback(async () => {
    try {
      setTopCategories((s) => ({ ...s, loading: true, error: null }));
      const res = await expenseAnalyticsService.getTopCategories(5);
      setTopCategories({ data: res.data?.data || [], loading: false, error: null });
    } catch (err) {
      setTopCategories({ data: [], loading: false, error: err.message || "Failed to load" });
    }
  }, []);

  const fetchBudgetUtil = useCallback(async () => {
    try {
      setBudgetUtil((s) => ({ ...s, loading: true, error: null }));
      const year = new Date().getFullYear();
      const res = await costCenterReportService.getBudgetVsActual(year);
      setBudgetUtil({ data: res.data?.data || [], loading: false, error: null });
    } catch (err) {
      setBudgetUtil({ data: [], loading: false, error: err.message || "Failed to load" });
    }
  }, []);

  useEffect(() => {
    fetchCostTrend();
    fetchExpenseTrend();
    fetchTopCategories();
    fetchBudgetUtil();
  }, [fetchCostTrend, fetchExpenseTrend, fetchTopCategories, fetchBudgetUtil]);

  // Compute latest payroll summary
  const latestPayroll = costTrend.data.length > 0 ? costTrend.data[costTrend.data.length - 1] : null;
  const prevPayroll = costTrend.data.length > 1 ? costTrend.data[costTrend.data.length - 2] : null;
  const payrollChange =
    latestPayroll && prevPayroll && prevPayroll.totalGross > 0
      ? ((latestPayroll.totalGross - prevPayroll.totalGross) / prevPayroll.totalGross) * 100
      : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Top row: Payroll cost card + Expense trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Payroll Cost */}
        <BaseWidget
          title="Monthly Payroll Cost"
          description="Latest payroll run summary"
          icon={DollarSign}
          iconColor="from-teal-600 to-teal-700"
          loading={costTrend.loading}
          error={costTrend.error}
          onRefresh={fetchCostTrend}
          size="md"
        >
          {latestPayroll ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <MetricValue
                  value={`${Number(latestPayroll.totalGross).toLocaleString()}`}
                  label="Gross payroll"
                  change={payrollChange}
                  changeLabel="vs prev month"
                />
                <div className="text-right">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {MONTHS[(latestPayroll.month || 1) - 1]} {latestPayroll.year}
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {latestPayroll.employeeCount} employees
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Gross" value={latestPayroll.totalGross} isDarkMode={isDarkMode} />
                <StatBox label="Net" value={latestPayroll.totalNet} isDarkMode={isDarkMode} />
                <StatBox label="Employer Cost" value={latestPayroll.totalEmployerCost} isDarkMode={isDarkMode} />
              </div>
            </div>
          ) : (
            <WidgetEmptyState icon={DollarSign} title="No payroll data" description="Run a payroll to see cost data" />
          )}
        </BaseWidget>

        {/* Expense Trend */}
        <BaseWidget
          title="Expense Trend"
          description="Monthly expense totals (last 6 months)"
          icon={TrendingUp}
          iconColor="from-blue-600 to-blue-700"
          loading={expenseTrend.loading}
          error={expenseTrend.error}
          onRefresh={fetchExpenseTrend}
          size="md"
        >
          {expenseTrend.data.length > 0 ? (
            <div className="space-y-2">
              {expenseTrend.data.map((item) => (
                <div
                  key={`${item.year}-${item.month}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"
                  }`}
                >
                  <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {MONTHS[(item.month || 1) - 1]} {item.year}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {item.count || 0} expenses
                    </span>
                    <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {Number(item.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <WidgetEmptyState icon={TrendingUp} title="No expense data" description="Submit expenses to see trends" />
          )}
        </BaseWidget>
      </div>

      {/* Bottom row: Top categories + Budget utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expense Categories */}
        <BaseWidget
          title="Top Expense Categories"
          description="Highest spend categories"
          icon={PieChart}
          iconColor="from-purple-600 to-purple-700"
          loading={topCategories.loading}
          error={topCategories.error}
          onRefresh={fetchTopCategories}
          size="md"
        >
          {topCategories.data.length > 0 ? (
            <div>
              {topCategories.data.map((cat, i) => (
                <WidgetListItem
                  key={cat.categoryId || i}
                  rank={i + 1}
                  title={cat.categoryName || "Uncategorized"}
                  subtitle={`${cat.count || 0} expenses`}
                  value={Number(cat.totalAmount || 0).toLocaleString()}
                />
              ))}
            </div>
          ) : (
            <WidgetEmptyState
              icon={PieChart}
              title="No category data"
              description="Expenses will appear grouped by category"
            />
          )}
        </BaseWidget>

        {/* Budget Utilization */}
        <BaseWidget
          title="Budget Utilization"
          description={`FY ${new Date().getFullYear()} cost center budgets`}
          icon={Banknote}
          iconColor="from-amber-600 to-amber-700"
          loading={budgetUtil.loading}
          error={budgetUtil.error}
          onRefresh={fetchBudgetUtil}
          size="md"
        >
          {budgetUtil.data.length > 0 ? (
            <div className="space-y-3">
              {budgetUtil.data.slice(0, 5).map((cc) => {
                const pct = cc.budgetAmount > 0 ? Math.round((cc.actualSpend / cc.budgetAmount) * 100) : 0;
                const isOver = pct > 100;
                return (
                  <div key={cc.costCenterId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {cc.costCenterName}
                      </span>
                      <span
                        className={`text-xs font-semibold ${isOver ? "text-red-500" : isDarkMode ? "text-teal-400" : "text-teal-600"}`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                      <div
                        className={`h-2 rounded-full transition-all ${isOver ? "bg-red-500" : "bg-teal-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <WidgetEmptyState
              icon={Banknote}
              title="No budget data"
              description="Set up cost center budgets to track utilization"
            />
          )}
        </BaseWidget>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, isDarkMode }) => (
  <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
    <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
      {Number(value || 0).toLocaleString()}
    </p>
  </div>
);

export default PayrollExpenseWidgets;
