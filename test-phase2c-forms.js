import puppeteer from "puppeteer";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testPhase2cForms() {
  console.log("🚀 Launching headless Chromium for Phase 2c form testing...");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      "/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Listen for console errors
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.toString());
    });

    // Test 1: VendorBillForm
    console.log("\n📋 TEST 1: VendorBillForm");
    console.log("📄 Navigating to /purchases/vendor-bills/new...");
    await page.goto("http://localhost:5173/purchases/vendor-bills/new", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await wait(3000); // Wait for page to settle

    // Check Phase 2c fields
    const vendorBillFields = [
      "supplierInvoiceDate",
      "documentType",
      "approvalStatus",
      "costCenter",
      "department",
      "projectCode",
      "inspectionRequired",
      "retentionPercentage",
    ];

    console.log("🔍 Checking Phase 2c fields...");
    const foundVendorBillFields = [];
    for (const field of vendorBillFields) {
      const input = await page.$(
        `input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`,
      );
      if (input) {
        foundVendorBillFields.push(field);
        console.log(`  ✓ ${field}`);
      } else {
        console.log(`  ✗ ${field} (not found)`);
      }
    }

    await page.screenshot({
      path: "/mnt/d/Ultimate Steel/vendorbillform-phase2c.png",
    });
    console.log("📸 Screenshot: vendorbillform-phase2c.png");

    // Check for errors
    if (errors.length > 0) {
      console.error("❌ VendorBillForm ERRORS:");
      errors.forEach((err) => console.error("  -", err));
      return { success: false, errors, test: "VendorBillForm" };
    }

    console.log(
      `✅ VendorBillForm loaded successfully (${foundVendorBillFields.length}/${vendorBillFields.length} fields)`,
    );

    // Clear errors for next test
    errors.length = 0;

    // Test 2: AdvancePaymentForm
    console.log("\n💰 TEST 2: AdvancePaymentForm");
    console.log("📄 Navigating to /payments/advance-payments/new...");
    await page.goto("http://localhost:5173/payments/advance-payments/new", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await wait(3000);

    // Check Phase 2c fields
    const advancePaymentFields = [
      "currency",
      "exchangeRate",
      "bankName",
      "chequeNumber",
      "transactionId",
      "approvalStatus",
      "receiptNumberOfficial",
      "costCenter",
      "settlementType",
      "validUntil",
      "expiryAction",
    ];

    console.log("🔍 Checking Phase 2c fields...");
    const foundAdvancePaymentFields = [];
    for (const field of advancePaymentFields) {
      const input = await page.$(
        `input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`,
      );
      if (input) {
        foundAdvancePaymentFields.push(field);
        console.log(`  ✓ ${field}`);
      } else {
        console.log(`  ✗ ${field} (not found)`);
      }
    }

    await page.screenshot({
      path: "/mnt/d/Ultimate Steel/advancepaymentform-phase2c.png",
    });
    console.log("📸 Screenshot: advancepaymentform-phase2c.png");

    // Check for errors
    if (errors.length > 0) {
      console.error("❌ AdvancePaymentForm ERRORS:");
      errors.forEach((err) => console.error("  -", err));
      return { success: false, errors, test: "AdvancePaymentForm" };
    }

    console.log(
      `✅ AdvancePaymentForm loaded successfully (${foundAdvancePaymentFields.length}/${advancePaymentFields.length} fields)`,
    );

    return {
      success: true,
      errors: [],
      vendorBillFieldsFound: foundVendorBillFields.length,
      vendorBillFieldsTotal: vendorBillFields.length,
      advancePaymentFieldsFound: foundAdvancePaymentFields.length,
      advancePaymentFieldsTotal: advancePaymentFields.length,
    };
  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    return { success: false, errors: [error.message] };
  } finally {
    await browser.close();
    console.log("🔒 Browser closed");
  }
}

// Run test
testPhase2cForms()
  .then((result) => {
    console.log("\n📊 RESULTS:");
    console.log("  Success:", result.success);
    if (result.vendorBillFieldsFound !== undefined) {
      console.log(
        `  VendorBillForm: ${result.vendorBillFieldsFound}/${result.vendorBillFieldsTotal} fields`,
      );
      console.log(
        `  AdvancePaymentForm: ${result.advancePaymentFieldsFound}/${result.advancePaymentFieldsTotal} fields`,
      );
    }
    if (result.errors && result.errors.length > 0) {
      console.log("  Errors:", result.errors.length);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("💥 FATAL:", err);
    process.exit(1);
  });
