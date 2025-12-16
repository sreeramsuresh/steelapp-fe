# Puppeteer: Launch vs Connect Modes

## Quick Answer: NO, Port 9222 Is Optional

Puppeteer works in **TWO modes**:

---

## ✅ Mode 1: Launch (Recommended) - Standalone

**Puppeteer launches its own Chrome** - No existing Chrome needed!

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,  // true = invisible, false = visible window
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.goto('http://localhost:5173/create-invoice');
// ... your tests ...
await browser.close();  // Important: clean up
```

**When to use:**
- ✅ CI/CD pipelines
- ✅ Automated regression tests
- ✅ Clean isolated test environment
- ✅ Production test suites

**Requirements:**
- Chrome binary installed: `npx puppeteer browsers install chrome`
- That's it! No Chrome running needed.

---

## 🔌 Mode 2: Connect - Attach to Running Chrome

**Connects to Chrome that's already running** on port 9222:

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.connect({
  browserURL: 'http://localhost:9222'
});

const pages = await browser.pages();
const page = pages[0];
// ... your tests ...
// DON'T call browser.close() - would close your dev Chrome!
```

**When to use:**
- 🐛 Quick debugging (share state with dev browser)
- 🔍 Inspecting existing session
- ⚡ Faster iteration (no launch overhead)

**Requirements:**
- Chrome must be running with: `--remote-debugging-port=9222`

---

## 🎯 For Your Project: Use Launch Mode

### Setup Script: `package.json`

```json
{
  "scripts": {
    "test:ui": "node test-batch-allocation.js",
    "test:ui:watch": "nodemon test-batch-allocation.js"
  },
  "devDependencies": {
    "puppeteer": "^latest"
  }
}
```

### Install Chrome Binary (One-time)

```bash
npx puppeteer browsers install chrome
```

This installs Chrome to: `~/.cache/puppeteer/chrome/`

---

## 💡 Platform-Specific Chrome Paths

If you need to use system Chrome (not Puppeteer's bundled Chrome):

```javascript
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/google-chrome'  // Linux
});
```

**WSL2 Special Case:**
```javascript
executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe'
```

---

## 🚀 Recommended Test Structure

```javascript
// test-batch-allocation.js
import puppeteer from 'puppeteer';

async function runTest() {
  const browser = await puppeteer.launch({
    headless: process.env.CI ? true : false,  // Headless in CI, visible locally
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/create-invoice');

    // Your test code...

  } finally {
    await browser.close();  // Always clean up
  }
}

runTest().catch(console.error);
```

---

## 📊 Performance Comparison

| Aspect | Launch Mode | Connect Mode |
|--------|-------------|--------------|
| **Setup** | ~2 seconds | Instant |
| **Isolation** | ✅ Clean | ⚠️ Shared state |
| **CI/CD** | ✅ Works | ❌ Needs Chrome running |
| **Debugging** | ⚠️ Less convenient | ✅ Easy |
| **Cleanup** | ✅ Auto | ⚠️ Manual |

---

## ✨ Best Practice: Use Launch Mode

```bash
# Run tests
npm run test:ui

# Debug with visible browser
headless: false  # in your script
```

**Bottom Line:** You don't need Chrome running on port 9222. Puppeteer can launch its own Chrome instance independently.
