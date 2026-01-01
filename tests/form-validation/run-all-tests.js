/* eslint-disable no-console */
/**
 * Master Test Runner - Execute all form validation tests
 * Runs all 4 migrated form tests and generates a combined report
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TESTS = [
  { name: 'Account Statement Form', file: 'test-account-statement-form.js' },
  { name: 'Add Payment Form', file: 'test-add-payment-form.js' },
  { name: 'Reservation Form', file: 'test-reservation-form.js' },
  { name: 'Transfer Form', file: 'test-transfer-form.js' },
];

const RESULTS_DIR = join(__dirname, '../../test-results');

/**
 * Run a single test script
 */
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Running: ${testFile}`);
    console.log('='.repeat(70));

    const testPath = join(__dirname, testFile);
    const testProcess = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: __dirname,
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, testFile });
      } else {
        resolve({ success: false, testFile, exitCode: code });
      }
    });

    testProcess.on('error', (error) => {
      reject({ success: false, testFile, error: error.message });
    });
  });
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 ULTIMATE STEEL ERP - FORM VALIDATION TEST SUITE');
  console.log('='.repeat(70));
  console.log('Testing 4 migrated forms (Material-UI → Tailwind CSS)');
  console.log('='.repeat(70));

  const results = [];
  const startTime = Date.now();

  for (const test of TESTS) {
    try {
      const result = await runTest(test.file);
      results.push({
        name: test.name,
        ...result,
      });
    } catch (error) {
      results.push({
        name: test.name,
        success: false,
        error: error.message,
      });
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('FINAL SUMMARY - ALL FORM TESTS');
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n✓ Passed: ${passed}/${TESTS.length}`);
  results
    .filter((r) => r.success)
    .forEach((r) => {
      console.log(`  ✓ ${r.name}`);
    });

  if (failed > 0) {
    console.log(`\n✗ Failed: ${failed}/${TESTS.length}`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  ✗ ${r.name} (Exit code: ${r.exitCode || 'N/A'})`);
      });
  }

  console.log(`\n⏱ Total duration: ${duration}s`);
  console.log(`📁 Results directory: ${RESULTS_DIR}`);
  console.log('='.repeat(70));

  // Save results to JSON
  const reportPath = join(RESULTS_DIR, 'test-results.json');
  const report = {
    timestamp: new Date().toISOString(),
    duration: parseFloat(duration),
    total: TESTS.length,
    passed,
    failed,
    tests: results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}\n`);

  // Exit with error if any test failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch((error) => {
  console.error('Fatal error running test suite:', error);
  process.exit(1);
});
