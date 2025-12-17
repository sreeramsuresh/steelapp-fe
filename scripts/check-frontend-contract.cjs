#!/usr/bin/env node
/**
 * Frontend-Proto Contract Pre-Flight Check
 *
 * Runs the backend contract test BEFORE starting Vite dev server.
 * Ensures frontend doesn't reference fields that don't exist in proto.
 *
 * Usage: node scripts/check-frontend-contract.js
 * Exit codes:
 *   0 = Contract valid, safe to start Vite
 *   1 = Contract violations found, Vite startup blocked
 */

const { execSync } = require('child_process');
const path = require('path');

const BACKEND_PATH = path.resolve(__dirname, '../../steelapprnp');
const CONTRACT_TEST = 'grpc/__tests__/frontend-backend-contract/quick-contract-test.js';
const CONTRACT_TEST_FALLBACK = 'grpc/__tests__/frontend-backend-contract/frontend-contract.test.js';

console.log('\n🔍 Checking Frontend-Proto Contract...\n');
console.log('━'.repeat(70));

// Check which test to use (quick test preferred, fallback to Jest)
const fs = require('fs');
const testToUse = fs.existsSync(path.join(BACKEND_PATH, CONTRACT_TEST))
  ? CONTRACT_TEST
  : CONTRACT_TEST_FALLBACK;

const isJestTest = testToUse.includes('.test.js');

try {
  // Run the contract test
  execSync(
    isJestTest
      ? `npx jest ${testToUse} --forceExit --verbose=false --silent=false`
      : `node ${testToUse}`,
    {
      cwd: BACKEND_PATH,
      stdio: 'inherit', // Show output in terminal
      timeout: isJestTest ? 60000 : 15000, // Jest needs more time
    }
  );

  console.log('━'.repeat(70));
  console.log('✅ Contract validation PASSED');
  console.log('🚀 Starting Vite dev server...\n');
  process.exit(0);
} catch (error) {
  console.log('━'.repeat(70));
  console.error('\n❌ Contract validation FAILED\n');
  console.error('Frontend references fields that are not defined in proto files.');
  console.error('\nTo debug:');
  console.error(`  cd ${BACKEND_PATH}`);
  console.error(`  npm run test:contract\n`);
  console.error('Common fixes:');
  console.error('  1. Add missing field to proto definition');
  console.error('  2. Add field to UI_ONLY_FIELDS if it\'s computed/derived');
  console.error('  3. Check field name mapping (camelCase vs snake_case)\n');
  console.error('Vite startup BLOCKED to prevent broken UI.\n');
  process.exit(1);
}
