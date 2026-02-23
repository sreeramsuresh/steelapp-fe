#!/usr/bin/env node
// check-snake-case-access.js — static scanner for snake_case dot-access in JSX files
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = decodeURIComponent(new URL("../src", import.meta.url).pathname);
const SNAKE_DOT_RE = /\.\s*([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g;
const STRING_RE = /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g;

function walkJsx(dir, files = []) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walkJsx(full, files);
		else if (full.endsWith(".jsx")) files.push(full);
	}
	return files;
}

let violations = 0;

for (const file of walkJsx(ROOT)) {
	const lines = readFileSync(file, "utf8").split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Skip comment lines and snake-ok markers
		if (
			line.trim().startsWith("//") ||
			line.trim().startsWith("*") ||
			line.includes("// snake-ok")
		)
			continue;
		// Strip string literals to avoid false positives
		const stripped = line.replace(STRING_RE, (m) => " ".repeat(m.length));
		let match;
		SNAKE_DOT_RE.lastIndex = 0;
		while ((match = SNAKE_DOT_RE.exec(stripped)) !== null) {
			const col = match.index + 1;
			console.log(
				`${relative(process.cwd(), file)}:${i + 1}:${col} — .${match[1]}`,
			);
			violations++;
		}
	}
}

if (violations > 0) {
	console.error(`\n${violations} snake_case access violation(s) found.`);
	process.exit(1);
} else {
	console.log("0 snake_case access violations found.");
}
