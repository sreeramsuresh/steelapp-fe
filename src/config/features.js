/**
 * Feature Flags Configuration
 *
 * Control which features are enabled/disabled in the application.
 * These can be overridden by environment variables.
 */

const features = {
  // Audit Logs - Track all user activities
  // Enable this in production after deployment
  AUDIT_LOGS: import.meta.env.VITE_ENABLE_AUDIT_LOGS === "true" || false,

  // Add more feature flags here as needed
  // Example:
  // ADVANCED_ANALYTICS: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true' || false,
};

export default features;

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature
 * @returns {boolean} - True if feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  return features[featureName] === true;
};
