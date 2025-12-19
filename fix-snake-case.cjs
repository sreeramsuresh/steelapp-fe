#!/usr/bin/env node
/**
 * Automated Snake_case to camelCase Fixer
 * Fixes all snake_case property access in frontend code
 */

const fs = require("fs");
const path = require("path");

// Convert snake_case to camelCase
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  let changeCount = 0;

  // Pattern 1: Member access - obj.snake_case or obj?.snake_case
  const memberPattern = /(\.|\.?\?)([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g;

  content = content.replace(memberPattern, (match, accessor, propName) => {
    // Skip if it's a special property
    if (propName.startsWith("__") || propName === "UNSAFE_") {
      return match;
    }

    const camelCase = snakeToCamel(propName);
    modified = true;
    changeCount++;
    return accessor + camelCase;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed ${changeCount} occurrences in ${filePath}`);
    return changeCount;
  }

  return 0;
}

// Walk directory recursively
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (
        file !== "node_modules" &&
        file !== ".git" &&
        file !== "dist" &&
        file !== "build"
      ) {
        walkDir(filePath, callback);
      }
    } else if (stat.isFile()) {
      if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        callback(filePath);
      }
    }
  });
}

// Main execution
console.log("🔧 Starting automated snake_case → camelCase conversion...\n");

const srcDir = path.join(__dirname, "src");
let totalChanges = 0;
let filesModified = 0;

walkDir(srcDir, (filePath) => {
  const changes = processFile(filePath);
  if (changes > 0) {
    totalChanges += changes;
    filesModified++;
  }
});

console.log(`\n✨ Conversion complete!`);
console.log(`📊 Files modified: ${filesModified}`);
console.log(`📊 Total changes: ${totalChanges}`);
console.log(`\n🔍 Run 'npm run lint' to verify fixes`);
