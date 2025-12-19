import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to settle
    await wait(2000);

    console.log('🖱️  Looking for "Add Container" button...');
    await page.waitForSelector('button', { timeout: 5000 });
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const buttonTexts = buttons.map(btn => btn.textContent.trim());
      const addButton = buttons.find(btn => btn.textContent.includes('Add Container'));
      if (addButton) {
        addButton.click();
        return { clicked: true, buttonTexts };
      }
      return { clicked: false, buttonTexts };
    });
    console.log('Button info:', JSON.stringify(buttonInfo, null, 2));

    // Wait for modal to appear or error to occur
    await wait(3000);

    // Capture current state
    const domState = await page.evaluate(() => {
      const root = document.getElementById('root');
      const text = document.body.textContent;
      const inputs = document.querySelectorAll('input, textarea, select');
      return {
        hasContent: text.length > 100,
        rootEmpty: root?.innerHTML.length || 0,
        allH2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent),
        allH3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent),
        allModals: Array.from(document.querySelectorAll('[role="dialog"], .modal')).length,
        bodyClasses: document.body.className,
        hasBlackScreen: root && root.children.length === 0,
        errorBoundary: text.includes('Something went wrong') || text.includes('Error'),
        containerListVisible: text.includes('Container List') || text.includes('Containers'),
        formInputsCount: inputs.length,
        hasOverlay: !!document.querySelector('.fixed.inset-0, [style*="position: fixed"]')
      };
    });
    console.log('DOM State:', JSON.stringify(domState, null, 2));

    // Check for errors
    if (errors.length > 0) {
      console.error('❌ ERRORS DETECTED:');
      errors.forEach(err => console.error('  -', err));
      await page.screenshot({ path: '/mnt/d/Ultimate Steel/containerform-error.png' });
      console.log('📸 Screenshot saved: containerform-error.png');
      return { success: false, errors };
    }

    // Check if form fields are present (modal might be open without h2)
    const presentFields = await page.evaluate(() => {
      const fields = ['containerType', 'containerSize', 'tareWeight', 'grossWeight', 'netWeight'];
      return fields.filter(name => document.querySelector(`input[name="${name}"], select[name="${name}"]`));
    });

    console.log('Container form fields found:', presentFields.length);

    if (presentFields.length === 0) {
      console.error('❌ ContainerForm fields not found - modal did not open');
      await page.screenshot({ path: '/mnt/d/Ultimate Steel/containerform-no-modal.png' });
      return { success: false, errors: ['Modal did not appear'] };
    }

    console.log('✅ ContainerForm detected! Fields:', presentFields.join(', '));

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
