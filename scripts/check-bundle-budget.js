#!/usr/bin/env node
/**
 * Bundle Size Budget Checker
 *
 * Reads Vite build output and checks chunk sizes against budget thresholds.
 * Run after `npm run build` to enforce size limits.
 *
 * Usage: node scripts/check-bundle-budget.js
 *
 * Budgets (gzipped):
 *   Entry chunk:       < 150 KB
 *   Lazy route chunk:  < 100 KB
 *   Total initial:     < 300 KB
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const DIST_DIR = join(import.meta.dirname, "../dist/assets");
const BUDGETS = {
  entryChunkGzip: 150 * 1024,       // 150 KB gzipped
  lazyChunkGzip: 100 * 1024,        // 100 KB gzipped per lazy chunk
  totalInitialGzip: 300 * 1024,     // 300 KB gzipped total initial
};

let violations = 0;

try {
  const files = readdirSync(DIST_DIR).filter((f) => f.endsWith(".js") || f.endsWith(".css"));

  let totalInitialGzip = 0;

  for (const file of files) {
    const filePath = join(DIST_DIR, file);
    const raw = readFileSync(filePath);
    const gzipped = gzipSync(raw);
    const gzipSize = gzipped.length;
    const isEntry = file.startsWith("index-") && file.endsWith(".js");

    if (isEntry) {
      totalInitialGzip += gzipSize;
      if (gzipSize > BUDGETS.entryChunkGzip) {
        console.error(`BUDGET EXCEEDED: Entry chunk "${file}" is ${(gzipSize / 1024).toFixed(1)} KB gzipped (limit: ${BUDGETS.entryChunkGzip / 1024} KB)`);
        violations++;
      }
    } else if (file.endsWith(".js")) {
      // Lazy chunks
      if (gzipSize > BUDGETS.lazyChunkGzip) {
        // Warn but don't fail for known large chunks (echarts, jspdf, recharts)
        const isKnownLarge = /echarts|jspdf|html2canvas|CartesianChart/i.test(file);
        if (isKnownLarge) {
          console.warn(`WARNING: Known large chunk "${file}" is ${(gzipSize / 1024).toFixed(1)} KB gzipped (limit: ${BUDGETS.lazyChunkGzip / 1024} KB)`);
        } else {
          console.error(`BUDGET EXCEEDED: Lazy chunk "${file}" is ${(gzipSize / 1024).toFixed(1)} KB gzipped (limit: ${BUDGETS.lazyChunkGzip / 1024} KB)`);
          violations++;
        }
      }
    }
  }

  if (totalInitialGzip > BUDGETS.totalInitialGzip) {
    console.error(`BUDGET EXCEEDED: Total initial JS is ${(totalInitialGzip / 1024).toFixed(1)} KB gzipped (limit: ${BUDGETS.totalInitialGzip / 1024} KB)`);
    violations++;
  }

  if (violations > 0) {
    console.error(`\n${violations} budget violation(s) found.`);
    process.exit(1);
  } else {
    console.log("Bundle budget check passed.");
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.error("dist/assets not found. Run `npm run build` first.");
    process.exit(1);
  }
  throw err;
}
