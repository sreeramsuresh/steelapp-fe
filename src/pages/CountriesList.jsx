import { ChevronDown, ChevronUp, Globe, MapPin, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { countriesService } from "../services/countriesService";

const CountriesList = () => {
  const { isDarkMode } = useTheme();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [countryPorts, setCountryPorts] = useState({});

  const regions = countriesService.getRegions();
  const portTypes = countriesService.getPortTypes();

  const loadCountries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (regionFilter) params.region = regionFilter;
      const response = await countriesService.getCountries(params);
      setCountries(response.countries || response.data || response || []);
    } catch (err) {
      setError(err.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, [search, regionFilter]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const toggleExpand = async (countryId) => {
    if (expandedCountry === countryId) {
      setExpandedCountry(null);
      return;
    }
    setExpandedCountry(countryId);
    if (!countryPorts[countryId]) {
      try {
        const detail = await countriesService.getCountry(countryId);
        const countryData = detail.country || detail;
        setCountryPorts((prev) => ({
          ...prev,
          [countryId]: countryData.ports || [],
        }));
      } catch {
        setCountryPorts((prev) => ({ ...prev, [countryId]: [] }));
      }
    }
  };

  const getRegionLabel = (value) => regions.find((r) => r.value === value)?.label || value || "—";
  const getPortTypeLabel = (value) => portTypes.find((t) => t.value === value)?.label || value || "—";

  const cardClass = isDarkMode ? "bg-gray-800" : "bg-white";
  const inputClass = `w-full px-3 py-2 border rounded-lg ${
    isDarkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 placeholder-gray-500"
  }`;

  return (
    <div className={`p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="text-teal-600" size={24} />
          Countries &amp; Ports
        </h1>
        <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Reference data for countries, regions, and port information
        </p>
      </div>

      {/* Filters */}
      <div className={`${cardClass} rounded-lg p-4 mb-6 shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className={inputClass}>
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Table */}
      <div className={`${cardClass} rounded-lg shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
            <p className="mt-2 text-gray-500">Loading countries...</p>
          </div>
        ) : countries.length === 0 ? (
          <div className="p-8 text-center">
            <Globe size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No countries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10" />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ports
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {countries.map((country) => {
                  const isExpanded = expandedCountry === country.id;
                  const ports = countryPorts[country.id] || [];
                  return (
                    <React.Fragment key={country.id}>
                      <tr
                        className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} cursor-pointer`}
                        onClick={() => toggleExpand(country.id)}
                      >
                        <td className="px-6 py-4">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{countriesService.formatCountryDisplay(country)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-mono px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                          >
                            {country.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getRegionLabel(country.region)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{country.currency || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          {country.portsCount ?? country.ports_count ?? "—"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className={`px-6 py-4 ${isDarkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                            {ports.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">
                                No ports available for this country
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {ports.map((port) => (
                                  <div
                                    key={port.id || port.code}
                                    className={`flex items-start gap-2 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-sm`}
                                  >
                                    <MapPin size={16} className="text-teal-600 mt-0.5 shrink-0" />
                                    <div>
                                      <div className="text-sm font-medium">{port.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {port.code && <span className="font-mono mr-2">{port.code}</span>}
                                        {getPortTypeLabel(port.port_type || port.portType)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountriesList;
