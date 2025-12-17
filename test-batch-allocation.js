#!/usr/bin/env node
/**
 * Batch Allocation Drawer Test
 * Tests the fix for stale reservation errors and Auto-FIFO validation
 */

import puppeteer from 'puppeteer';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 Starting Puppeteer test session...');
  console.log('⏳ Launching standalone Chrome (headless)...\n');

  // Launch Chrome - NO port 9222 needed!
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('✅ Chrome launched (PID:', browser.process()?.pid, ')');
  console.log('   Mode: Standalone - NO port 9222 needed!\n');

  try {
    // Navigate to invoice form
    console.log('\n📋 Step 1: Navigate to invoice form');
    await page.goto('http://localhost:5173/create-invoice', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');

    // Fill customer
    console.log('\n👤 Step 2: Select customer ABC Corporation');
    await page.waitForSelector('input[placeholder*="Search customers"]');
    await page.type('input[placeholder*="Search customers"]', 'ABC Corporation');
    await sleep(1000);

    // Click on customer option
    await page.evaluate(() => {
      const option = Array.from(document.querySelectorAll('[role="option"]')).find(el =>
        el.textContent.includes('Abc Corporation'),
      );
      if (option) option.click();
    });
    await sleep(1000);
    console.log('✓ Customer selected');

    // Select invoice status
    console.log('\n📝 Step 3: Set invoice status to Final Tax Invoice');
    await page.evaluate(() => {
      const select = document.querySelector('select[id*="select"]');
      if (select) {
        const options = Array.from(select.options);
        const finalTaxOption = options.find(opt => opt.textContent.includes('Final Tax Invoice'));
        if (finalTaxOption) {
          select.value = finalTaxOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await sleep(500);
    console.log('✓ Invoice status set');

    // Search for product in drawer
    console.log('\n🔍 Step 4: Search for product SS-304-Bar-BRIGHT-25mm-6000mm');
    await page.waitForSelector('#product-search');
    await page.type('#product-search', 'SS-304-Bar-BRIGHT');
    await sleep(1500);
    console.log('✓ Product search completed');

    // Select product
    console.log('\n✅ Step 5: Select product from dropdown');
    await page.evaluate(() => {
      const option = Array.from(document.querySelectorAll('[role="option"]')).find(el =>
        el.textContent.includes('SS-304-Bar-BRIGHT-25mm-6000mm'),
      );
      if (option) option.click();
    });
    await sleep(2000);
    console.log('✓ Product selected');

    // CHECK 1: Look for stale error after product selection
    console.log('\n🧪 TEST 1: Check for stale reservation error (should NOT appear)');
    const errorAfterFirstProduct = await page.evaluate(() => {
      const errorDivs = Array.from(document.querySelectorAll('.drawer-error, .panel-error, [class*="error"]'));
      const errors = errorDivs
        .map(div => div.textContent.trim())
        .filter(text => text.includes('required') || text.includes('Missing'));
      return errors.length > 0 ? errors : null;
    });

    if (errorAfterFirstProduct) {
      console.log('❌ FAIL: Stale error found after product selection:');
      console.log('   ', errorAfterFirstProduct);
    } else {
      console.log('✓ PASS: No stale error after product selection');
    }

    // Wait for warehouse availability to load
    await sleep(2000);

    // Change product to test error clearing
    console.log('\n🔄 Step 6: Change to a different product');
    await page.evaluate(() => {
      const input = document.querySelector('#product-search');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(500);
    await page.type('#product-search', 'SS-316L');
    await sleep(1500);

    await page.evaluate(() => {
      const option = Array.from(document.querySelectorAll('[role="option"]')).find(el =>
        el.textContent.includes('SS-316L'),
      );
      if (option) option.click();
    });
    await sleep(2000);
    console.log('✓ Product changed');

    // CHECK 2: Verify error is still cleared after product change
    console.log('\n🧪 TEST 2: Check for stale error after product change (should still be cleared)');
    const errorAfterProductChange = await page.evaluate(() => {
      const errorDivs = Array.from(document.querySelectorAll('.drawer-error, .panel-error, [class*="error"]'));
      const errors = errorDivs
        .map(div => div.textContent.trim())
        .filter(text => text.includes('required') || text.includes('Missing'));
      return errors.length > 0 ? errors : null;
    });

    if (errorAfterProductChange) {
      console.log('❌ FAIL: Stale error persists after product change:');
      console.log('   ', errorAfterProductChange);
    } else {
      console.log('✓ PASS: No stale error after product change');
    }

    // Go back to first product for Auto-FIFO test
    console.log('\n↩️  Step 7: Return to SS-304-Bar-BRIGHT-25mm-6000mm for Auto-FIFO test');
    await page.evaluate(() => {
      const input = document.querySelector('#product-search');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(500);
    await page.type('#product-search', 'SS-304-Bar-BRIGHT-25mm');
    await sleep(1500);

    await page.evaluate(() => {
      const option = Array.from(document.querySelectorAll('[role="option"]')).find(el =>
        el.textContent.includes('SS-304-Bar-BRIGHT-25mm-6000mm'),
      );
      if (option) option.click();
    });
    await sleep(2000);
    console.log('✓ Product selected for Auto-FIFO test');

    // Enter quantity
    console.log('\n🔢 Step 8: Enter quantity = 10');
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="text"][value=""]');
      if (qtyInput && qtyInput.placeholder === '') {
        qtyInput.value = '10';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(500);
    console.log('✓ Quantity entered');

    // TEST 3: Click Auto-FIFO without price to test validation
    console.log('\n🧪 TEST 3: Click Auto-Fill FIFO without unit price (should show validation)');
    const autoFifoButton = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Auto-Fill FIFO') || btn.textContent.includes('Auto-FIFO'),
      );
      if (button) {
        button.click();
        return true;
      }
      return false;
    });

    if (!autoFifoButton) {
      console.log('⚠️  WARNING: Auto-Fill FIFO button not found');
    } else {
      await sleep(1000);

      const validationMessage = await page.evaluate(() => {
        const errorDivs = Array.from(document.querySelectorAll('.drawer-error, .panel-error, [class*="error"]'));
        const errors = errorDivs.map(div => div.textContent.trim()).filter(t => t.length > 0);
        return errors.length > 0 ? errors[0] : null;
      });

      if (validationMessage) {
        console.log('✓ PASS: Validation message displayed:');
        console.log('   ', validationMessage.substring(0, 200));
      } else {
        console.log('❌ FAIL: No validation message shown');
      }
    }

    // Enter unit price
    console.log('\n💰 Step 9: Enter unit price = 100');
    await page.evaluate(() => {
      const priceInput = document.querySelector('input#unitPrice, input[type="text"]');
      if (priceInput) {
        priceInput.value = '100';
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        priceInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(500);
    console.log('✓ Unit price entered');

    // TEST 4: Click Auto-FIFO with all required fields
    console.log('\n🧪 TEST 4: Click Auto-Fill FIFO with all fields (should allocate)');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Auto-Fill FIFO') || btn.textContent.includes('Auto-FIFO'),
      );
      if (button) button.click();
    });
    await sleep(3000); // Wait for allocation to complete

    const allocationResult = await page.evaluate(() => {
      // Check for allocation success
      const allocatedRows = document.querySelectorAll('.allocated-row, tr.allocated-row');
      const allocationSummary = document.querySelector('.allocation-summary, .allocation-totals');
      const errorDiv = document.querySelector('.drawer-error, .panel-error');

      return {
        allocatedCount: allocatedRows.length,
        hasSummary: !!allocationSummary,
        summaryText: allocationSummary ? allocationSummary.textContent.trim() : null,
        error: errorDiv ? errorDiv.textContent.trim() : null,
      };
    });

    if (allocationResult.allocatedCount > 0 || allocationResult.hasSummary) {
      console.log('✓ PASS: Allocation succeeded');
      console.log('   Allocated batches:', allocationResult.allocatedCount);
      if (allocationResult.summaryText) {
        console.log('   Summary:', allocationResult.summaryText.substring(0, 150));
      }
    } else if (allocationResult.error) {
      console.log('⚠️  WARNING: Allocation error:', allocationResult.error.substring(0, 200));
    } else {
      console.log('❌ FAIL: Allocation did not complete');
    }

    // Take screenshot
    await page.screenshot({ path: '/mnt/d/Ultimate Steel/test-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved to test-result.png');

    // Final summary
    console.log(`\n${  '='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✓ Stale error fix: ', errorAfterFirstProduct ? 'FAILED' : 'PASSED');
    console.log('✓ Error clearing on product change: ', errorAfterProductChange ? 'FAILED' : 'PASSED');
    console.log('✓ Auto-FIFO validation: ', autoFifoButton ? 'TESTED' : 'NOT FOUND');
    console.log('✓ Auto-FIFO allocation: ', allocationResult.allocatedCount > 0 ? 'SUCCEEDED' : 'INCOMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    await page.screenshot({ path: '/mnt/d/Ultimate Steel/test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved to test-error.png');
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
  }
}

// Run the test
runTest().catch(console.error);
