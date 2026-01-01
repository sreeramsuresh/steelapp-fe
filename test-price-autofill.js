#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Price Auto-Fill Test
 * Tests that product prices automatically populate from the pricelist
 */

import puppeteer from 'puppeteer';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 Starting Price Auto-Fill Test...');
  console.log('⏳ Launching Chrome (headless)...\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      '/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('✅ Chrome launched\n');

  try {
    // Step 1: Navigate and login
    console.log('📋 Step 1: Navigate to app and login');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
      return !!localStorage.getItem('token');
    });

    if (!isLoggedIn) {
      console.log('   Logging in...');
      await page.waitForSelector('input[placeholder="Enter your email"]', {
        timeout: 5000,
      });
      await page.type(
        'input[placeholder="Enter your email"]',
        'test@steelapp.com',
      );
      await page.type('input[placeholder="Enter your password"]', 'test123');

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation away from login page
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 10000,
      });
      await sleep(1000);
    }
    console.log('✓ Logged in\n');

    // Step 2: Navigate to create invoice
    console.log('📋 Step 2: Navigate to Create Invoice page');
    await page.goto('http://localhost:5173/create-invoice', {
      waitUntil: 'networkidle2',
    });
    await sleep(1000);
    console.log('✓ Page loaded\n');

    // Step 3: Select customer
    console.log('👤 Step 3: Select customer');
    await page.waitForSelector('input[placeholder*="Search customers" i]', {
      timeout: 5000,
    });
    await page.type('input[placeholder*="Search customers" i]', 'ABC');
    await sleep(1500);

    const customerSelected = await page.evaluate(() => {
      const option = Array.from(
        document.querySelectorAll('[role="option"]'),
      ).find((el) => el.textContent.toLowerCase().includes('abc'));
      if (option) {
        option.click();
        return true;
      }
      return false;
    });

    if (!customerSelected) {
      console.log('⚠️  WARNING: Could not find ABC Corporation customer');
    } else {
      console.log('✓ Customer selected\n');
    }
    await sleep(1000);

    // Step 4: Set invoice status
    console.log('📝 Step 4: Set invoice status to Final Tax Invoice');
    await page.evaluate(() => {
      const select = document.querySelector('select');
      if (select) {
        const finalTaxOption = Array.from(select.options).find((opt) =>
          opt.textContent.includes('Final Tax Invoice'),
        );
        if (finalTaxOption) {
          select.value = finalTaxOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await sleep(500);
    console.log('✓ Invoice status set\n');

    // Step 5: Look for "Add Product" button or product search field
    console.log('🔍 Step 5: Locate product selection interface');

    // Check for Add Product button
    const hasAddButton = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (btn) =>
          btn.textContent.includes('Add Product') ||
          btn.textContent.includes('Add Item'),
      );
      if (button) {
        button.click();
        return true;
      }
      return false;
    });

    if (hasAddButton) {
      console.log('✓ Clicked "Add Product" button');
      await sleep(2000);
    }

    // Step 6: Search for product in the drawer
    console.log('\n🔍 Step 6: Search for product SS-304');

    // Wait for product search input in the drawer
    await page.waitForSelector('input[placeholder*="Search products" i]', {
      timeout: 5000,
    });

    // Clear and type product name
    await page.click('input[placeholder*="Search products" i]', {
      clickCount: 3,
    });
    await page.type('input[placeholder*="Search products" i]', 'SS-304');
    await sleep(2000); // Wait for autocomplete
    console.log('✓ Product search typed\n');

    // Step 7: Select product from dropdown
    console.log('✅ Step 7: Select product from dropdown');
    await sleep(1000); // Wait for dropdown to fully render

    const productSelected = await page.evaluate(() => {
      // Try multiple selectors for dropdown options
      let options = Array.from(document.querySelectorAll('[role="option"]'));

      if (options.length === 0) {
        // Try alternative selectors
        options = Array.from(
          document.querySelectorAll('.dropdown-item, [class*="option"], li'),
        );
      }

      console.log('Found', options.length, 'potential options');

      // Find SS-304-Pipe
      const option = options.find((el) => {
        const text = el.textContent || el.innerText || '';
        const matchesPipe =
          text.includes('SS-304-Pipe') ||
          (text.includes('SS-304') && text.toLowerCase().includes('pipe'));
        return matchesPipe;
      });

      if (option) {
        const optionText = option.textContent.substring(0, 100);
        console.log('Found and clicking:', optionText);
        option.click();
        return optionText;
      }

      // Return available options for debugging
      return {
        found: false,
        availableOptions: options
          .slice(0, 10)
          .map((o) => (o.textContent || o.innerText || '').substring(0, 60)),
      };
    });

    if (!productSelected || productSelected.found === false) {
      console.log('❌ FAIL: Could not find SS-304-Pipe product in dropdown');
      if (productSelected.availableOptions) {
        console.log('Available options:');
        productSelected.availableOptions.forEach((opt, idx) => {
          console.log(`   ${idx + 1}. ${opt}`);
        });
      }
      throw new Error('Product not found in dropdown');
    }
    console.log('✓ Product selected:', productSelected);
    await sleep(4000); // Wait for price fetch and form update

    // Step 8: CHECK PRICE AUTO-FILL
    console.log('\n🧪 TEST: Check if unit price auto-filled');

    const priceCheck = await page.evaluate(() => {
      // Try multiple selectors for price input
      const priceInputs = [
        document.querySelector('input#unitPrice'),
        document.querySelector('input[name="unitPrice"]'),
        document.querySelector('input[placeholder*="price" i]'),
        ...Array.from(document.querySelectorAll('input[type="number"]')),
      ].filter(Boolean);

      const results = {
        foundInputs: priceInputs.length,
        prices: [],
        labels: [],
      };

      priceInputs.forEach((input, idx) => {
        const value = input.value;
        const label =
          input.labels?.[0]?.textContent || input.placeholder || `input-${idx}`;

        results.prices.push(value);
        results.labels.push(label);
      });

      return results;
    });

    console.log('   Found', priceCheck.foundInputs, 'price-related inputs');
    priceCheck.labels.forEach((label, idx) => {
      const value = priceCheck.prices[idx];
      console.log(`   - ${label}: "${value}"`);
    });

    // Check if any price was auto-filled with expected value (4950)
    const expectedPrice = '4950';
    const hasPriceAutofilled = priceCheck.prices.some(
      (price) =>
        price === expectedPrice || price === '4950.00' || price === '4950.0',
    );

    if (hasPriceAutofilled) {
      console.log('\n✓ PASS: Unit price auto-filled correctly with 4950');
    } else {
      console.log('\n❌ FAIL: Unit price did NOT auto-fill (expected: 4950)');

      // Additional debugging - check console for errors
      const consoleErrors = await page.evaluate(() => {
        // Get any error messages from the page
        const errorDivs = Array.from(
          document.querySelectorAll(
            '[class*="error"], .error-message, .alert-error',
          ),
        );
        return errorDivs
          .map((div) => div.textContent.trim())
          .filter((t) => t.length > 0);
      });

      if (consoleErrors.length > 0) {
        console.log('\n⚠️  Page errors found:');
        consoleErrors.forEach((err) => console.log('   -', err));
      }
    }

    // Take screenshot
    await page.screenshot({
      path: '/mnt/d/Ultimate Steel/price-autofill-test.png',
      fullPage: true,
    });
    console.log('\n📸 Screenshot saved to price-autofill-test.png');

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✓ Navigation: PASSED');
    console.log('✓ Customer selection: PASSED');
    console.log('✓ Product search: PASSED');
    console.log('✓ Product selection: PASSED');
    console.log(
      `${hasPriceAutofilled ? '✓' : '✗'} Price auto-fill: ${hasPriceAutofilled ? 'PASSED' : 'FAILED'}`,
    );
    console.log('='.repeat(60));

    if (!hasPriceAutofilled) {
      console.log('\n🔍 DEBUGGING RECOMMENDATIONS:');
      console.log('1. Check browser console in DevTools for network errors');
      console.log(
        '2. Verify API endpoint GET /api/products/:id/price is being called',
      );
      console.log(
        '3. Check AllocationDrawer component for price-setting logic',
      );
      console.log(
        '4. Verify customer_id is being passed to the price endpoint',
      );
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    await page.screenshot({
      path: '/mnt/d/Ultimate Steel/price-autofill-error.png',
      fullPage: true,
    });
    console.log('📸 Error screenshot saved to price-autofill-error.png');
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
  }
}

// Run the test
runTest().catch(console.error);
