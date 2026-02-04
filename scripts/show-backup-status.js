#!/usr/bin/env node

/**
 * show-backup-status.js
 *
 * Pre-start script for frontend dev server
 * Displays database backup status at startup
 *
 * Colors:
 * - 🟢 GREEN: Backup successful and recent
 * - 🔴 RED: Backup blocked (security or system issue)
 * - 🟠 ORANGE: Unknown status (not configured yet)
 *
 * Non-blocking: Continues even if backup API is unreachable
 */

import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_HOST = process.env.API_HOST || "localhost";
const API_PORT = process.env.API_PORT || 3000;
const API_URL = `http://${API_HOST}:${API_PORT}/api/ops/backup-status`;
const TIMEOUT_MS = 3000; // 3 second timeout

// Backup catch-up configuration
const BACKUP_INTERVAL_HOURS = 4; // Must match cron schedule
const BACKUP_INTERVAL_MS = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;
const BACKUP_ROOT = process.env.BACKUP_ROOT || "/mnt/d/DB Backup";
const BACKUP_GUARD_SCRIPT =
  process.env.BACKUP_GUARD_SCRIPT ||
  "/mnt/d/Ultimate Steel/steelapprnp/backup-system/scripts/backup_guard.sh";
const CATCHUP_LOG_FILE = path.join(BACKUP_ROOT, "logs", "backup_catchup.log");

/**
 * Format timestamp for display
 * Convert ISO 8601 to readable format with relative time
 */
function formatTime(isoTimestamp) {
  if (!isoTimestamp) return "never";

  try {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Format date
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Relative time
    let relativeTime = "";
    if (diffMins < 1) {
      relativeTime = "just now";
    } else if (diffMins < 60) {
      relativeTime = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}d ago`;
    } else {
      relativeTime = `${Math.floor(diffDays / 7)}w ago`;
    }

    return `${dateStr} ${timeStr} (${relativeTime})`;
  } catch (error) {
    return isoTimestamp;
  }
}

/**
 * Get JWT token from .env.local or environment
 */
function getAuthToken() {
  // Try to get from environment variable
  if (process.env.VITE_AUTH_TOKEN) {
    return process.env.VITE_AUTH_TOKEN;
  }

  // Try to read from .env.local if it exists
  try {
    const envPath = path.join(__dirname, "../.env.local");

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/VITE_AUTH_TOKEN\s*=\s*["']?([^"'\n]+)["']?/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (error) {
    // Silently fail - token may not be available
  }

  return null;
}

/**
 * Fetch backup status from API
 */
function fetchBackupStatus() {
  return new Promise((resolve) => {
    // Build request options
    const reqUrl = new URL(API_URL);
    const options = {
      hostname: reqUrl.hostname,
      port: reqUrl.port,
      path: reqUrl.pathname + reqUrl.search,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "show-backup-status/1.0",
      },
      timeout: TIMEOUT_MS,
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          resolve({
            status: "ERROR",
            message: "Failed to parse API response",
          });
        }
      });
    });

    req.on("error", (error) => {
      // API unreachable - return UNKNOWN
      resolve({
        status: "UNKNOWN",
        message: `API unreachable (${error.message})`,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        status: "UNKNOWN",
        message: "API timeout",
      });
    });

    req.end();
  });
}

/**
 * Calculate visual width accounting for emojis (which take 2 visual chars but 1 string char)
 */
function getVisualWidth(text) {
  let width = 0;
  for (const char of text) {
    // Emoji detection: check if character is outside ASCII range
    const code = char.charCodeAt(0);
    if (code > 127) {
      width += 2; // Emojis take 2 visual columns
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Display formatted backup status
 */
function displayStatus(status) {
  const BOX_WIDTH = 75; // Content width (excluding pipes and spaces)

  const line = (text) => {
    const visualWidth = getVisualWidth(text);
    const padding = BOX_WIDTH - visualWidth;
    return `│ ${text}${" ".repeat(Math.max(0, padding))} │`;
  };
  const topBorder = `┌${"─".repeat(BOX_WIDTH + 2)}┐`;
  const divider = `├${"─".repeat(BOX_WIDTH + 2)}┤`;
  const bottomBorder = `└${"─".repeat(BOX_WIDTH + 2)}┘`;

  console.log("");
  console.log(topBorder);

  switch (status.status) {
    case "SUCCESS": {
      console.log(line("🟢 DATABASE BACKUP STATUS: SUCCESS"));
      console.log(divider);
      const lastSuccess = formatTime(status.lastSuccessAt);
      console.log(line(`Last successful backup: ${lastSuccess}`));
      if (status.artifact) {
        const artifact =
          status.artifact.length > BOX_WIDTH - 10
            ? `${status.artifact.substring(0, BOX_WIDTH - 13)}...`
            : status.artifact;
        console.log(line(`Artifact: ${artifact}`));
      }
      if (status.durationSec) {
        console.log(line(`Duration: ${status.durationSec}s`));
      }
      if (status.environment) {
        console.log(line(`Environment: ${status.environment}`));
      }
      console.log(line(""));
      console.log(line("✅ Backup system is healthy and operational"));
      break;
    }

    case "BLOCKED": {
      console.log(line("🔴 DATABASE BACKUP STATUS: BLOCKED"));
      console.log(divider);
      console.log(line("Blocking Reason:"));
      if (status.blockedReason) {
        const reason =
          status.blockedReason.length > BOX_WIDTH - 4
            ? `${status.blockedReason.substring(0, BOX_WIDTH - 7)}...`
            : status.blockedReason;
        console.log(line(`  ${reason}`));
      }
      if (status.lastSuccessAt) {
        const lastSuccess = formatTime(status.lastSuccessAt);
        console.log(line(`Last success: ${lastSuccess}`));
      } else {
        console.log(line("Last success: never"));
      }
      console.log(line(""));
      console.log(line("⚠️  BACKUP SYSTEM IS BLOCKED - INVESTIGATE!"));
      break;
    }

    case "IN_PROGRESS": {
      console.log(line("🟡 DATABASE BACKUP STATUS: IN PROGRESS"));
      console.log(divider);
      const lastAttempt = formatTime(status.lastAttemptAt);
      console.log(line(`Backup started: ${lastAttempt}`));
      if (status.lastSuccessAt) {
        const lastSuccess = formatTime(status.lastSuccessAt);
        console.log(line(`Last success: ${lastSuccess}`));
      } else {
        console.log(line("Last success: never"));
      }
      console.log(line(""));
      console.log(line("⏳ Backup is currently running... check logs for progress"));
      break;
    }

    case "UNKNOWN":
    default: {
      console.log(line("🟠 DATABASE BACKUP STATUS: UNKNOWN"));
      console.log(divider);
      console.log(line("No backup status found"));
      console.log(line(""));
      console.log(line("ℹ️  Backup system not configured or not run yet"));
      break;
    }
  }

  console.log(bottomBorder);
  console.log("");
}

/**
 * Log catch-up event to file
 */
function logCatchup(message, data = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logLine = JSON.stringify({ timestamp, message, ...data });

    // Ensure logs directory exists
    const logDir = path.dirname(CATCHUP_LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append to log file
    fs.appendFileSync(CATCHUP_LOG_FILE, `${logLine}\n`);
  } catch (err) {
    // Silently fail - don't block startup
  }
}

/**
 * Check if backup should be caught up and execute if needed
 */
async function checkAndExecuteCatchup(status) {
  return new Promise((resolve) => {
    try {
      // If no status or status is unknown, skip catch-up
      if (!status || status.status === "UNKNOWN") {
        resolve(false);
        return;
      }

      // If backup is blocked, skip catch-up
      if (status.blocked) {
        logCatchup("Backup system is blocked - skipping catch-up", {
          blockedReason: status.blockedReason,
          lastSuccessAt: status.lastSuccessAt,
        });
        resolve(false);
        return;
      }

      // Check if catch-up is needed
      const lastSuccessAt = status.lastSuccessAt;
      if (!lastSuccessAt) {
        resolve(false);
        return;
      }

      const lastBackupTime = new Date(lastSuccessAt).getTime();
      const currentTime = Date.now();
      const elapsedMs = currentTime - lastBackupTime;

      // If backup was less than 4 hours ago, no catch-up needed
      if (elapsedMs < BACKUP_INTERVAL_MS) {
        resolve(false);
        return;
      }

      // Catch-up needed - backup should have happened but didn't
      logCatchup("CATCH-UP REQUIRED: Backup interval exceeded", {
        lastSuccessAt,
        intervalHours: BACKUP_INTERVAL_HOURS,
        elapsedHours: Math.round((elapsedMs / (60 * 60 * 1000)) * 10) / 10,
        currentTime: new Date().toISOString(),
      });

      // Verify backup guard script exists
      if (!fs.existsSync(BACKUP_GUARD_SCRIPT)) {
        logCatchup("ERROR: Backup guard script not found", {
          script: BACKUP_GUARD_SCRIPT,
        });
        resolve(false);
        return;
      }

      // Make backup guard executable (in case permissions were lost)
      try {
        fs.chmodSync(BACKUP_GUARD_SCRIPT, 0o755);
      } catch (err) {
        // Ignore chmod errors
      }

      // Spawn backup_guard.sh in background (non-blocking)
      const backupProcess = spawn("bash", [BACKUP_GUARD_SCRIPT], {
        detached: true,
        stdio: "ignore", // Don't inherit stdio
      });

      backupProcess.on("error", (err) => {
        logCatchup("ERROR: Failed to spawn backup process", {
          error: err.message,
        });
      });

      // Unref allows parent process to exit even if child is running
      backupProcess.unref();

      logCatchup("CATCH-UP INITIATED: Backup process spawned", {
        pid: backupProcess.pid,
        timestamp: new Date().toISOString(),
      });

      resolve(true);
    } catch (err) {
      logCatchup("EXCEPTION in backup catch-up check", {
        error: err.message,
      });
      resolve(false);
    }
  });
}

/**
 * Main function
 */
async function main() {
  try {
    // TEMPORARY: Skip backup status check due to stuck backup
    // TODO: Reset backup status in database to resolve the stuck "IN_PROGRESS" state
    // Restart this check once backup is fixed

    // Uncomment the lines below to re-enable backup status checks:
    /*
    const status = await fetchBackupStatus();
    displayStatus(status);

    const catchupTimeout = new Promise((resolve) => setTimeout(resolve, 100));
    const catchupPromise = checkAndExecuteCatchup(status);
    await Promise.race([catchupPromise, catchupTimeout]).catch(() => {
      // Silently ignore timeout or errors - don't block startup
    });
    */

    // Exit immediately - backup check disabled
    process.exit(0);
  } catch (error) {
    // Non-blocking - always exit 0
    process.exit(0);
  }
}

main();
