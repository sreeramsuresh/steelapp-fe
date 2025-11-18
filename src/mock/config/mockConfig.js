/**
 * Mock Data Configuration
 * Controls whether to use mock data or real API
 */

// Check environment variable (set in .env file)
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Mock data scenario (for future use - different datasets)
export const MOCK_SCENARIO = import.meta.env.VITE_MOCK_SCENARIO || 'normal';

// Network delay simulation (in milliseconds)
export const MOCK_DELAY = parseInt(import.meta.env.VITE_MOCK_DELAY) || 500;

// Log mock mode status
if (USE_MOCK_DATA) {
  console.log('🎭 MOCK MODE ENABLED');
  console.log(`   Scenario: ${MOCK_SCENARIO}`);
  console.log(`   Network Delay: ${MOCK_DELAY}ms`);
  console.log('   Using local JSON data instead of API');
} else {
  console.log('🔌 REAL API MODE');
  console.log('   Using live backend at', import.meta.env.VITE_API_URL || 'http://localhost:3000');
}

export default {
  USE_MOCK_DATA,
  MOCK_SCENARIO,
  MOCK_DELAY
};
