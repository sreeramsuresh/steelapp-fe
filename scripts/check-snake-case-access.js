#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT          = join(__dirname, "..", "src");
const BASELINE_PATH = join(__dirname, "snake_case_baseline.json");
const UPDATE_BASELINE  = process.argv.includes("--update-baseline");
const ANNOTATIONS      = process.argv.includes("--annotations");   // emit ::error:: for GHA
const SUMMARY_ONLY     = process.argv.includes("--summary");        // counts only, no line-by-line
const SHOW_BASELINE    = process.argv.includes("--show-baseline");  // print all baseline lines too

// Layer 1: severity tiers
const ERROR_PATH_PREFIXES = ["src/pages/", "src/components/"];
const WARN_PATH_PREFIXES  = ["src/services/", "src/utils/"];
const SKIP_FILE_RE = /(\/__tests__\/|\.test\.(js|jsx|ts|tsx)$|\.spec\.(js|jsx|ts|tsx)$)/;

// Layer 2: API-context gate (tight regexes only)
const API_INDICATOR_RES = [
  /\bapi\.(get|post|put|patch|delete)\s*\(/,
  /\baxiosApi\./,
  /\bhttpClient\.(get|post|put|patch|delete)\s*\(/,
  /\b\w+Service\.(get|create|update|delete|list|search|fetch|load|save)\w*\s*\(/,
  /\buseQuery\s*\(/,
  /\bawait\s+\w+\.(get|post|put|patch|delete)\s*\(/,
];

// Layer 3: LHS capture + SAFE_LHS (keep small — never add data/item/row/record/result)
const SNAKE_DOT_RE = /\b([a-zA-Z_$][\w$]*)\s*\.\s*([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g;
const STRING_RE    = /(['"])(?:(?!\1)[^\\]|\\.)*\1/g; // single/double quotes only
const SAFE_LHS = new Set([
  "formData","form","newFormData","initialFormData","editFormData","defaultFormData","emptyForm",
  "filters","filterState","queryParams","searchParams","params",
  "errors","formErrors","validationErrors","fieldErrors",
  "styles","classes","cx","theme",
  "event","e","ev",
  "localStorage","sessionStorage",
  "payload","body","requestBody","updateData","updates","patch","patchData","newData","submitData","postData","requestData",
  "process","import","PropTypes",
  "options","config","settings",
]);

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkFiles(full, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(full)) files.push(full);
  }
  return files;
}

const errorFingerprints = new Set();
const warnings = [];

for (const file of walkFiles(ROOT)) {
  const rel = relative(process.cwd(), file).replace(/\\/g, "/");

  if (SKIP_FILE_RE.test(rel)) continue;

  const isError = ERROR_PATH_PREFIXES.some(p => rel.startsWith(p));
  const isWarn  = WARN_PATH_PREFIXES.some(p => rel.startsWith(p));
  if (!isError && !isWarn) continue; // outside tracked paths

  const text = readFileSync(file, "utf8");
  if (!API_INDICATOR_RES.some(re => re.test(text))) continue; // Layer 2 gate

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//") || line.trim().startsWith("*") || line.includes("// snake-ok")) continue;
    const stripped = line.replace(STRING_RE, m => " ".repeat(m.length));
    SNAKE_DOT_RE.lastIndex = 0;
    let match;
    while ((match = SNAKE_DOT_RE.exec(stripped)) !== null) {
      const [, lhs, field] = match;
      if (SAFE_LHS.has(lhs)) continue;
      const fingerprint = `${rel}::${lhs}.${field}`;
      const location = `${rel}:${i + 1}:${match.index + 1}`;
      if (isError) {
        errorFingerprints.add(fingerprint);
        if (SHOW_BASELINE) console.log(`[error] ${location} — ${lhs}.${field}`);
      } else {
        warnings.push(`[warn]  ${location} — ${lhs}.${field}`);
      }
    }
  }
}

if (!SUMMARY_ONLY && warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s) in services/utils (use // snake-ok: mapper to suppress):`);
  for (const w of warnings) console.log(w);
}

// Layer 4: fingerprint baseline diff
let baselineSet = new Set();
if (existsSync(BASELINE_PATH)) {
  baselineSet = new Set(JSON.parse(readFileSync(BASELINE_PATH, "utf8")).violations);
}

if (UPDATE_BASELINE) {
  writeFileSync(BASELINE_PATH, JSON.stringify({
    updatedAt: new Date().toISOString(),
    violations: [...errorFingerprints].sort(),
  }, null, 2));
  console.log(`\nBaseline updated: ${errorFingerprints.size} fingerprint(s) approved.`);
  process.exit(0);
}

const newViolations = [...errorFingerprints].filter(f => !baselineSet.has(f));
if (newViolations.length > 0) {
  if (SUMMARY_ONLY) {
    console.error(`NEW violations: ${newViolations.length} new fingerprint(s) not in baseline.`);
  } else {
    console.error("\nNEW violations not in baseline:");
    for (const v of newViolations) {
      console.error(`  ${v}`);
      if (ANNOTATIONS) {
        // Parse fingerprint: "src/components/Foo.jsx::item.invoice_number"
        const [file, access] = v.split("::");
        console.log(`::error file=${file}::snake_case access detected: ${access} — use camelCase or add // snake-ok`);
      }
    }
    console.error(`\n${newViolations.length} new fingerprint(s). Fix them or run --update-baseline to approve.`);
  }
  process.exit(1);
}

if (SUMMARY_ONLY) {
  console.log(`snake-case check OK (${errorFingerprints.size} baselined, ${warnings.length} warnings)`);
} else {
  console.log(`\n${errorFingerprints.size} error fingerprint(s) — all in baseline. OK.`);
}
