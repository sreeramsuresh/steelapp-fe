import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Package,
  Star,
  Filter,
  Download,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import pricelistService from '../services/pricelistService';
import { notificationService } from '../services/notificationService';

// Custom Button component matching SteelProducts pattern
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return isDarkMode
        ? `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-600 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-gray-800`
        : `bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-400 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-white`;
    } else if (variant === 'secondary') {
      return `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-gray-400 disabled:bg-gray-100`;
    } else if (variant === 'danger') {
      return isDarkMode
        ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
        : 'bg-red-500 hover:bg-red-400 text-white focus:ring-red-500';
    } else {
      // outline
      return `border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Status filter chips
const STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: Tag },
  { id: 'active', label: 'Active', icon: CheckCircle },
  { id: 'inactive', label: 'Inactive', icon: XCircle },
];

// Currency filter chips
const CURRENCY_FILTERS = [
  { id: 'all', label: 'All Currencies' },
  { id: 'AED', label: 'AED' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
];

export default function PriceListList() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [pricelists, setPricelists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPricelists();
  }, []);

  const fetchPricelists = async () => {
    try {
      setLoading(true);
      const response = await pricelistService.getAll({ includeItems: false });
      setPricelists(response.pricelists || []);
    } catch (error) {
      console.error('Error fetching pricelists:', error);
      notificationService.error('Failed to load price lists');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) {
      return;
    }

    try {
      await pricelistService.delete(id);
      notificationService.success('Price list deactivated');
      fetchPricelists();
    } catch (error) {
      console.error('Error deleting pricelist:', error);
      notificationService.error(
        error.response?.data?.message || 'Failed to deactivate price list',
      );
    }
  };

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigate(`/pricelists/new?copyFrom=${id}`);
  };

  // Filtered pricelists
  const filteredPricelists = useMemo(() => {
    return pricelists.filter((pl) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !pl.name?.toLowerCase().includes(search) &&
          !pl.description?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !pl.isActive) return false;
        if (statusFilter === 'inactive' && pl.isActive) return false;
      }
      // Currency filter
      if (currencyFilter !== 'all' && pl.currency !== currencyFilter) {
        return false;
      }
      return true;
    });
  }, [pricelists, searchTerm, statusFilter, currencyFilter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: pricelists.length,
      active: pricelists.filter((pl) => pl.isActive).length,
      inactive: pricelists.filter((pl) => !pl.isActive).length,
      default: pricelists.filter((pl) => pl.isDefault).length,
      totalProducts: pricelists.reduce(
        (sum, pl) => sum + (pl.productCount || 0),
        0,
      ),
    }),
    [pricelists],
  );

  // Status filter counts
  const statusCounts = useMemo(
    () => ({
      all: pricelists.length,
      active: pricelists.filter((pl) => pl.isActive).length,
      inactive: pricelists.filter((pl) => !pl.isActive).length,
    }),
    [pricelists],
  );

  if (loading) {
    return (
      <div
        className={`p-4 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={24} className="text-teal-600" />
            <h1
              className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              💰 Price Lists
            </h1>
          </div>
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Manage product pricing, create custom price lists, and apply bulk
            adjustments
          </p>
        </div>

        {/* Quick Filters Toggle */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-teal-500 text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            QUICK FILTERS
          </button>
          <div
            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
              showFilters
                ? 'bg-teal-500'
                : isDarkMode
                  ? 'bg-gray-600'
                  : 'bg-gray-300'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                showFilters ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="mb-4 space-y-3">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Status:
              </span>
              {STATUS_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = statusFilter === filter.id;
                const count = statusCounts[filter.id];
                return (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-teal-500 text-white border-teal-400'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{filter.label}</span>
                    <span
                      className={`px-1.5 rounded text-xs ${isActive ? 'bg-white/20' : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Currency Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Currency:
              </span>
              {CURRENCY_FILTERS.map((filter) => {
                const isActive = currencyFilter === filter.id;
                const count =
                  filter.id === 'all'
                    ? pricelists.length
                    : pricelists.filter((pl) => pl.currency === filter.id)
                      .length;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setCurrencyFilter(filter.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-teal-500 text-white border-teal-400'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`px-1.5 rounded text-xs ${isActive ? 'bg-white/20' : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div
          className={`flex flex-wrap items-center gap-4 py-2 mb-3 text-xs border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-1">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Showing:
            </span>
            <span
              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {filteredPricelists.length}
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              of {pricelists.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Active:
            </span>
            <span className="font-semibold text-green-500">{stats.active}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Default:
            </span>
            <span className="font-semibold text-yellow-500">
              {stats.default}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Total Products:
            </span>
            <span className="font-semibold text-blue-500">
              {stats.totalProducts}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search
              className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            />
            <input
              type="text"
              placeholder="Search price lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <Button onClick={() => navigate('/pricelists/new')} size="sm">
            <Plus size={16} />
            New Price List
          </Button>
        </div>

        {/* Price Lists Grid */}
        {filteredPricelists.length === 0 ? (
          <div
            className={`text-center py-12 rounded-lg border-2 border-dashed ${
              isDarkMode
                ? 'border-gray-700 text-gray-400'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            <Tag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No price lists found</p>
            <p className="text-sm mb-4">
              Create your first price list to manage product pricing
            </p>
            <Button onClick={() => navigate('/pricelists/new')}>
              <Plus size={16} />
              Create Price List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
            {filteredPricelists.map((pricelist) => (
              <div
                key={pricelist.id}
                onClick={() => navigate(`/pricelists/${pricelist.id}`)}
                className={`rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col ${
                  isDarkMode
                    ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-500'
                    : 'bg-white border-[#E0E0E0] hover:border-teal-500'
                }`}
              >
                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {pricelist.name}
                        </h3>
                        {pricelist.isDefault && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                              isDarkMode
                                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            <Star size={10} fill="currentColor" />
                            Default
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm mb-2 line-clamp-2 min-h-[2.5rem] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {pricelist.description || '\u00A0'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 min-h-[6.5rem]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/pricelists/${pricelist.id}/edit`);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-teal-400 hover:text-teal-300 hover:bg-gray-700'
                            : 'text-teal-600 hover:bg-gray-100'
                        }`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => handleCopy(pricelist.id, e)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                            : 'text-blue-600 hover:bg-gray-100'
                        }`}
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                      {!pricelist.isDefault ? (
                        <button
                          onClick={(e) =>
                            handleDelete(pricelist.id, pricelist.name, e)
                          }
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode
                              ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                              : 'text-red-600 hover:bg-gray-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div className="p-1.5 w-7 h-7" />
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium border ${
                        pricelist.isActive
                          ? isDarkMode
                            ? 'bg-green-900/30 text-green-300 border-green-700'
                            : 'bg-green-100 text-green-800 border-green-200'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-400 border-gray-600'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {pricelist.isActive ? (
                        <CheckCircle size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {pricelist.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium border ${
                        isDarkMode
                          ? 'bg-blue-900/30 text-blue-300 border-blue-700'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      <DollarSign size={12} />
                      {pricelist.currency || 'AED'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex justify-between text-sm">
                      <span
                        className={
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }
                      >
                        Products
                      </span>
                      <span
                        className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {pricelist.productCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span
                        className={
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }
                      >
                        Date Range
                      </span>
                      <span
                        className={`font-medium text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {pricelist.effectiveFrom || pricelist.effectiveTo
                          ? `${pricelist.effectiveFrom || '—'} to ${pricelist.effectiveTo || '—'}`
                          : 'No date range'}
                      </span>
                    </div>
                  </div>

                  {/* Products Progress Bar */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        Products Coverage
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                    >
                      <div
                        className="h-2 rounded-full bg-teal-500 transition-all duration-300"
                        style={{
                          width: `${Math.min((pricelist.productCount || 0) * 5, 100)}%`,
                        }}
                      />
                    </div>
                    <p
                      className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                    >
                      {pricelist.productCount || 0} products configured
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
