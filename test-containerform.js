import puppeteer from 'puppeteer';

async function testContainerForm() {
  console.log('🚀 Launching headless Chromium...');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.toString());
    });

    console.log('📄 Navigating to containers page...');
    await page.goto('http://localhost:5173/containers', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    console.log('🖱️  Clicking "Add Container" button...');
    await page.waitForSelector('button:has-text("Add Container")', { timeout: 5000 });
    await page.click('button:has-text("Add Container")');

    // Wait for modal to appear or error to occur
    await page.waitForTimeout(2000);

    // Check for errors
    if (errors.length > 0) {
      console.error('❌ ERRORS DETECTED:');
      errors.forEach(err => console.error('  -', err));
      await page.screenshot({ path: '/mnt/d/Ultimate Steel/containerform-error.png' });
      console.log('📸 Screenshot saved: containerform-error.png');
      return { success: false, errors };
    }

    // Check if modal opened successfully
    const modalExists = await page.$('[role="dialog"], .modal, h2');
    if (!modalExists) {
      console.error('❌ Modal did not open - component may have crashed');
      await page.screenshot({ path: '/mnt/d/Ultimate Steel/containerform-no-modal.png' });
      return { success: false, errors: ['Modal did not appear'] };
    }

    console.log('✅ Modal opened successfully!');

    // Check for Phase 2b fields
    const fieldsToCheck = [
      'containerType',
      'containerSize',
      'isHighCube',
      'carrierSealNumber',
      'tareWeight',
      'grossWeight',
      'netWeight',
      'customsClearanceStatus',
      'demurrageStartDate',
      'detentionStartDate'
    ];

    console.log('\n🔍 Checking Phase 2b fields...');
    const foundFields = [];

    for (const field of fieldsToCheck) {
      const input = await page.$(`input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`);
      if (input) {
        foundFields.push(field);
        console.log(`  ✓ ${field}`);
      } else {
        console.log(`  ✗ ${field} (not found)`);
      }
    }

    await page.screenshot({ path: '/mnt/d/Ultimate Steel/containerform-success.png' });
    console.log('\n📸 Screenshot saved: containerform-success.png');

    return {
      success: true,
      errors: [],
      foundFields: foundFields.length,
      totalFields: fieldsToCheck.length
    };

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false, errors: [error.message] };
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Run test
testContainerForm()
  .then(result => {
    console.log('\n📊 RESULTS:');
    console.log('  Success:', result.success);
    if (result.foundFields !== undefined) {
      console.log(`  Fields Found: ${result.foundFields}/${result.totalFields}`);
    }
    if (result.errors && result.errors.length > 0) {
      console.log('  Errors:', result.errors.length);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('💥 FATAL:', err);
    process.exit(1);
  });
