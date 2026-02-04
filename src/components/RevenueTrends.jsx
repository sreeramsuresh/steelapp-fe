import { addMonths, format, subMonths } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Download,
  Flower2,
  Leaf,
  LineChart,
  Minus,
  RefreshCw,
  Snowflake,
  Sun,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useApiData } from "../hooks/useApi";
import { analyticsService } from "../services/analyticsService";

const RevenueTrends = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("trends");
  const [timeRange, setTimeRange] = useState("12months");
  const [viewType, setViewType] = useState("monthly");
  const [showPredictions, setShowPredictions] = useState(true);

  // Calculate date parameters for API calls
  const dateParams = useMemo(() => {
    const now = new Date();
    const monthsBack = timeRange === "6months" ? 6 : 12;
    const startDate = format(subMonths(now, monthsBack), "yyyy-MM-dd");
    const endDate = format(now, "yyyy-MM-dd");
    return { startDate, endDate };
  }, [timeRange]);

  // Fetch real sales trends data
  const {
    data: salesTrendsData,
    loading: loadingTrends,
    refetch: refetchTrends,
  } = useApiData(
    () =>
      analyticsService.getSalesTrends({
        period: "month",
        start_date: dateParams.startDate,
        end_date: dateParams.endDate,
      }),
    [dateParams]
  );

  // Process real data and generate forecasting
  const processedData = useMemo(() => {
    // Handle both array format and nested { data: [...] } format from API
    const trendsArray = Array.isArray(salesTrendsData) ? salesTrendsData : salesTrendsData?.data || [];

    if (!trendsArray || trendsArray.length === 0) {
      return { revenueData: [], forecastData: [], analytics: {} };
    }

    // Sort data by period (oldest first for trend analysis)
    const sortedData = [...trendsArray].sort((a, b) => new Date(a.period) - new Date(b.period));

    // Convert API data to chart format
    const revenueData = sortedData.map((item) => ({
      month: format(new Date(item.period), "MMM yyyy"),
      revenue: parseFloat(item.revenue) || 0,
      invoiceCount: parseInt(item.invoiceCount, 10) || 0,
      avgOrderValue: parseFloat(item.averageOrderValue) || 0,
      uniqueCustomers: parseInt(item.uniqueCustomers, 10) || 0,
      period: new Date(item.period),
    }));

    // Generate forecasting based on real historical data
    const generateForecast = (historicalData) => {
      if (historicalData.length < 2) return [];

      // Calculate average growth rate from historical data
      let totalGrowthRate = 0;
      let growthCount = 0;

      for (let i = 1; i < historicalData.length; i++) {
        const currentRevenue = historicalData[i].revenue;
        const previousRevenue = historicalData[i - 1].revenue;

        if (previousRevenue > 0) {
          const growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
          totalGrowthRate += growthRate;
          growthCount++;
        }
      }

      const avgGrowthRate = growthCount > 0 ? totalGrowthRate / growthCount : 5; // Default 5% growth
      const lastDataPoint = historicalData[historicalData.length - 1];

      // Seasonal factors for construction industry
      const seasonalFactors = {
        0: 0.85, // January
        1: 0.9, // February
        2: 1.05, // March
        3: 1.15, // April
        4: 1.2, // May
        5: 1.18, // June
        6: 1.1, // July
        7: 1.12, // August
        8: 1.08, // September
        9: 1.0, // October
        10: 0.95, // November
        11: 0.8, // December
      };

      const forecast = [];
      let lastRevenue = lastDataPoint.revenue;

      // Generate 6 months of forecast
      for (let i = 1; i <= 6; i++) {
        const futureDate = addMonths(lastDataPoint.period, i);
        const month = futureDate.getMonth();

        // Apply growth trend
        const trendMultiplier = 1 + avgGrowthRate / 100;

        // Apply seasonal factor
        const seasonalMultiplier = seasonalFactors[month];

        // Calculate forecasted revenue
        const forecastedRevenue = Math.round(lastRevenue * trendMultiplier * seasonalMultiplier);

        // Confidence interval (±20% for simple forecasting)
        const confidenceRange = forecastedRevenue * 0.2;

        forecast.push({
          month: format(futureDate, "MMM yyyy"),
          revenue: forecastedRevenue,
          period: futureDate,
          confidence: {
            high: forecastedRevenue + confidenceRange,
            low: Math.max(0, forecastedRevenue - confidenceRange),
          },
          type: "forecast",
        });

        lastRevenue = forecastedRevenue;
      }

      return forecast;
    };

    // Calculate analytics from real data
    const analytics = {
      totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
      avgMonthlyRevenue:
        revenueData.length > 0 ? revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length : 0,
      totalInvoices: revenueData.reduce((sum, item) => sum + item.invoiceCount, 0),
      avgOrderValue:
        revenueData.length > 0
          ? revenueData.reduce((sum, item) => sum + item.avgOrderValue, 0) / revenueData.length
          : 0,
      growthRate:
        revenueData.length >= 2
          ? ((revenueData[revenueData.length - 1].revenue - revenueData[0].revenue) / revenueData[0].revenue) * 100
          : 0,
    };

    const forecastData = generateForecast(revenueData);

    return { revenueData, forecastData, analytics };
  }, [salesTrendsData]);

  // Extract processed data
  const { revenueData, forecastData, analytics } = processedData;

  const getSeason = (month) => {
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Autumn";
    return "Winter";
  };

  const formatCurrency = (amount) => {
    const safeAmount = Number.isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatGrowth = (growth) => {
    const safeGrowth = Number.isNaN(growth) || growth === null || growth === undefined ? 0 : growth;
    const absGrowth = Math.abs(safeGrowth);
    const sign = safeGrowth > 0 ? "+" : safeGrowth < 0 ? "" : "";
    return `${sign}${absGrowth.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <ArrowUp size={16} className="text-green-600" />;
    if (growth < 0) return <ArrowDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getSeasonIcon = (season) => {
    switch (season) {
      case "Spring":
        return <Flower2 size={20} className="text-green-500" />;
      case "Summer":
        return <Sun size={20} className="text-yellow-500" />;
      case "Autumn":
        return <Leaf size={20} className="text-orange-500" />;
      case "Winter":
        return <Snowflake size={20} className="text-blue-500" />;
      default:
        return <Calendar size={20} />;
    }
  };

  const renderTrends = () => (
    <div>
      {/* Trends Controls */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`min-w-[150px] px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="24months">Last 24 Months</option>
            </select>
          </div>
          <div className="relative">
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className={`min-w-[140px] px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="monthly">Monthly View</option>
              <option value="quarterly">Quarterly View</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={(e) => setShowPredictions(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Show Predictions
            </span>
          </label>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={refetchTrends}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {/* eslint-disable-next-line local-rules/no-dead-button */}
          <button
            type="button"
            onClick={() => {
              // TODO: Implement export functionality
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div
          className={`border rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp size={24} className="text-green-500" />
            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Growth Rate</span>
          </div>
          <div className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatGrowth(analytics.growthRate || 0)}
          </div>
          <div className="flex items-center justify-center gap-1">
            {getGrowthIcon(analytics.growthRate || 0)}
            <span
              className={`text-sm font-medium ${
                analytics.growthRate > 0
                  ? "text-green-600"
                  : analytics.growthRate < 0
                    ? "text-red-600"
                    : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
              }`}
            >
              overall trend
            </span>
          </div>
        </div>

        <div
          className={`border rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <BarChart3 size={24} className="text-blue-500" />
            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Revenue</span>
          </div>
          <div className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatCurrency(analytics.totalRevenue || 0)}
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {revenueData.length} months
            </span>
          </div>
        </div>

        <div
          className={`border rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target size={24} className="text-purple-500" />
            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Avg Monthly</span>
          </div>
          <div className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatCurrency(analytics.avgMonthlyRevenue || 0)}
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              average revenue
            </span>
          </div>
        </div>

        <div
          className={`border rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity size={24} className="text-amber-500" />
            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Invoices</span>
          </div>
          <div className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {analytics.totalInvoices || 0}
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              invoices created
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div
          className={`border rounded-xl p-6 mb-6 ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Revenue Trend Analysis
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Historical Data</span>
              </div>
              {showPredictions && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-red-500 opacity-70"></div>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Forecast</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {revenueData.slice(-6).map((item, index) => (
              <div
                key={item.id || item.name || `item-${index}`}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div>
                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.month}</span>
                  <span className={`ml-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {item.invoiceCount} invoices
                  </span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {formatCurrency(item.avgOrderValue)} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderForecasting = () => (
    <div>
      <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        Revenue Forecasting (Next 6 Months)
      </h3>
      <p className={`mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        AI-powered predictions based on historical data, seasonal trends, and growth patterns
      </p>

      {/* Show forecast data if available */}
      {forecastData && forecastData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forecastData.map((forecast, index) => (
            <div
              key={forecast.id || forecast.name || `forecast-${index}`}
              className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{forecast.month}</h4>
                <Target size={20} className="text-teal-600" />
              </div>
              <div className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(forecast.revenue)}
              </div>
              <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Range: {formatCurrency(forecast.confidence?.low || 0)} -{" "}
                {formatCurrency(forecast.confidence?.high || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Zap size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
          <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Forecasting Dashboard
          </h4>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Need more historical data for accurate forecasting
          </p>
        </div>
      )}
    </div>
  );

  const renderSeasonalAnalysis = () => {
    // Group revenue data by season
    const seasonalData = revenueData.reduce((acc, item) => {
      const season = getSeason(item.period.getMonth());
      if (!acc[season]) acc[season] = { revenue: 0, count: 0 };
      acc[season].revenue += item.revenue;
      acc[season].count += 1;
      return acc;
    }, {});

    const seasons = Object.keys(seasonalData).map((season) => ({
      name: season,
      revenue: seasonalData[season].revenue,
      avgRevenue: seasonalData[season].revenue / seasonalData[season].count,
      months: seasonalData[season].count,
    }));

    return (
      <div>
        <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Seasonal Revenue Analysis
        </h3>
        <p className={`mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Understand how seasons and months affect your business performance
        </p>

        {seasons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasons.map((season, index) => (
              <div
                key={season.id || season.name || `season-${index}`}
                className={`border rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg ${
                  isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  {getSeasonIcon(season.name)}
                  <h4 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{season.name}</h4>
                </div>
                <div className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(season.revenue)}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Avg: {formatCurrency(season.avgRevenue)}
                </div>
                <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {season.months} months
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
            <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Seasonal Analysis
            </h4>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Need more data across different seasons</p>
          </div>
        )}
      </div>
    );
  };

  const renderGrowthMetrics = () => {
    const growthMetrics = [
      {
        title: "Total Revenue",
        value: formatCurrency(analytics.totalRevenue),
        icon: <TrendingUp size={24} className="text-green-500" />,
        description: `Generated from ${analytics.totalInvoices} invoices`,
      },
      {
        title: "Average Order Value",
        value: formatCurrency(analytics.avgOrderValue),
        icon: <BarChart3 size={24} className="text-blue-500" />,
        description: "Per invoice average",
      },
      {
        title: "Growth Rate",
        value: formatGrowth(analytics.growthRate),
        icon: getGrowthIcon(analytics.growthRate),
        description: "Overall period growth",
      },
      {
        title: "Monthly Average",
        value: formatCurrency(analytics.avgMonthlyRevenue),
        icon: <Calendar size={24} className="text-purple-500" />,
        description: "Average revenue per month",
      },
    ];

    return (
      <div>
        <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Growth Performance Metrics
        </h3>
        <p className={`mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Detailed analysis of growth patterns, velocity, and performance indicators
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {growthMetrics.map((metric, index) => (
            <div
              key={metric.id || metric.name || `metric-${index}`}
              className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                {metric.icon}
                <div>
                  <h4 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{metric.title}</h4>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{metric.description}</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Revenue trend over time */}
        {revenueData.length > 0 && (
          <div
            className={`border rounded-xl p-6 ${
              isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
            }`}
          >
            <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Monthly Revenue Breakdown
            </h4>
            <div className="space-y-3">
              {revenueData.slice(-6).map((item, index) => (
                <div
                  key={item.id || item.name || `item-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div>
                    <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.month}</span>
                    <span className={`ml-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {item.invoiceCount} invoices
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatCurrency(item.avgOrderValue)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loadingTrends) {
    return (
      <div className={`p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Loading revenue trends...
          </h3>
        </div>
      </div>
    );
  }

  // Handle both array format and nested { data: [...] } format for empty check
  const hasTrendsData = Array.isArray(salesTrendsData) ? salesTrendsData.length > 0 : salesTrendsData?.data?.length > 0;

  if (!hasTrendsData) {
    return (
      <div className={`p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div
          className={`flex flex-col items-center justify-center min-h-96 p-8 text-center rounded-xl border ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <AlertCircle size={48} className="text-gray-400 mb-4" />
          <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            No Revenue Data Available
          </h2>
          <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            No sales data found for the selected period. Create some invoices to see revenue trends.
          </p>
          <button
            type="button"
            onClick={refetchTrends}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
          >
            <RefreshCw size={20} />
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div
        className={`border rounded-xl overflow-hidden shadow-lg ${
          isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <TrendingUp size={28} className="text-teal-600" />
              <h1 className={`text-3xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                📈 Revenue Trends
              </h1>
            </div>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Advanced revenue analysis, forecasting, and growth insights based on real data
            </p>
          </div>

          {/* Tabs - Pill style */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("trends")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "trends"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <LineChart size={18} />
                Trend Analysis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("forecasting")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "forecasting"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Target size={18} />
                Forecasting
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("seasonal")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "seasonal"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Calendar size={18} />
                Seasonal Analysis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("metrics")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "metrics"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Activity size={18} />
                Growth Metrics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "trends" && renderTrends()}
            {activeTab === "forecasting" && renderForecasting()}
            {activeTab === "seasonal" && renderSeasonalAnalysis()}
            {activeTab === "metrics" && renderGrowthMetrics()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTrends;
