import { api } from "./api.js";

export const countriesService = {
  // Get all countries
  async getCountries(params = {}) {
    try {
      const response = await api.get("/countries", { params });
      return response;
    } catch (error) {
      console.error("Error fetching countries:", error);
      throw error;
    }
  },

  // Get single country with ports
  async getCountry(id) {
    try {
      const response = await api.get(`/countries/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching country:", error);
      throw error;
    }
  },

  // Get countries by region
  async getCountriesByRegion(region) {
    try {
      const response = await api.get(`/countries/region/${region}`);
      return response;
    } catch (error) {
      console.error("Error fetching countries by region:", error);
      throw error;
    }
  },

  // Get exchange rates for country
  async getCountryExchangeRates(id, base_currency = "AED") {
    try {
      const response = await api.get(`/countries/${id}/exchange-rates`, {
        params: { base_currency },
      });
      return response;
    } catch (error) {
      console.error("Error fetching country exchange rates:", error);
      throw error;
    }
  },

  // Get available regions
  getRegions() {
    return [
      { value: "middle_east", label: "Middle East" },
      { value: "asia_pacific", label: "Asia Pacific" },
      { value: "europe", label: "Europe" },
      { value: "north_america", label: "North America" },
      { value: "africa", label: "Africa" },
    ];
  },

  // Format country display with flag emoji (if available)
  formatCountryDisplay(country) {
    const flagEmojis = {
      ARE: "🇦🇪",
      USA: "🇺🇸",
      CHN: "🇨🇳",
      IND: "🇮🇳",
      JPN: "🇯🇵",
      KOR: "🇰🇷",
      SGP: "🇸🇬",
      DEU: "🇩🇪",
      GBR: "🇬🇧",
      FRA: "🇫🇷",
      ITA: "🇮🇹",
      ESP: "🇪🇸",
      SAU: "🇸🇦",
      QAT: "🇶🇦",
      KWT: "🇰🇼",
    };

    const flag = flagEmojis[country.code] || "";
    return `${flag} ${country.name}`.trim();
  },

  // Get port types
  getPortTypes() {
    return [
      { value: "seaport", label: "Seaport" },
      { value: "airport", label: "Airport" },
      { value: "land_port", label: "Land Port" },
      { value: "dry_port", label: "Dry Port" },
      { value: "container_port", label: "Container Port" },
      { value: "bulk_port", label: "Bulk Port" },
    ];
  },
};

export default countriesService;
