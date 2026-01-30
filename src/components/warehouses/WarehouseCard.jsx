/**
 * WarehouseCard Component
 * Displays a single warehouse in card format for the list grid
 */

import React from 'react';
import {
  MapPin,
  Package,
  Phone,
  User,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const WarehouseCard = ({ warehouse, onView, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const {
    name,
    code,
    city,
    state,
    country,
    contactPerson,
    phone,
    email: _email,
    capacity,
    capacityUnit = 'MT',
    isActive,
    inventoryCount = 0,
    utilizationPercent = 0,
  } = warehouse;

  // Calculate utilization color
  const getUtilizationColor = (percent) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const _getUtilizationBg = (percent) => {
    if (percent >= 90) return isDarkMode ? 'bg-red-900/30' : 'bg-red-100';
    if (percent >= 70) return isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100';
    return isDarkMode ? 'bg-green-900/30' : 'bg-green-100';
  };

  return (
    <div
      className={`rounded-lg border ${
        isDarkMode
          ? 'bg-[#1E2328] border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      } transition-all duration-200 overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-teal-900/30' : 'bg-teal-100'}`}
            >
              <MapPin
                className={`w-5 h-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
              />
            </div>
            <div>
              <h3
                className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {name}
              </h3>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
              >
                {code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? isDarkMode
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-green-100 text-green-700'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isActive ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {isActive ? 'Active' : 'Inactive'}
            </span>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                title="More actions"
                aria-label="More actions"
              >
                <MoreVertical
                  className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setMenuOpen(false);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Close menu"
                  />
                  <div
                    className={`absolute right-0 mt-1 w-40 rounded-lg shadow-lg z-20 ${
                      isDarkMode
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onView();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                        isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                        isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin
            className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
          />
          <span
            className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            {[city, state, country].filter(Boolean).join(', ') || 'No location'}
          </span>
        </div>

        {/* Contact */}
        {contactPerson && (
          <div className="flex items-center gap-2">
            <User
              className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span
              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {contactPerson}
            </span>
          </div>
        )}

        {phone && (
          <div className="flex items-center gap-2">
            <Phone
              className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span
              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {phone}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-2 border-t border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
          {/* Inventory Count */}
          <div className="flex items-center gap-2">
            <Package
              className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span
              className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {inventoryCount.toLocaleString()}
            </span>
            <span
              className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
            >
              items
            </span>
          </div>

          {/* Capacity */}
          {capacity > 0 && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {capacity.toLocaleString()} {capacityUnit}
              </span>
            </div>
          )}
        </div>

        {/* Utilization Bar */}
        {capacity > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Utilization
              </span>
              <span
                className={`text-xs font-medium min-w-fit ${getUtilizationColor(utilizationPercent)}`}
              >
                {utilizationPercent}%
              </span>
            </div>
            <div
              className={`h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  utilizationPercent >= 90
                    ? 'bg-red-500'
                    : utilizationPercent >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer - Quick Actions */}
      <div
        className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
      >
        <button
          onClick={onView}
          className={`w-full text-center text-sm font-medium ${
            isDarkMode
              ? 'text-teal-400 hover:text-teal-300'
              : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View Dashboard →
        </button>
      </div>
    </div>
  );
};

export default WarehouseCard;
