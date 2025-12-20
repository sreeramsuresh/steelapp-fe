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

import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_URL = `http://${API_HOST}:${API_PORT}/api/ops/backup-status`;
const TIMEOUT_MS = 3000; // 3 second timeout

/**
 * Format timestamp for display
 * Convert ISO 8601 to readable format with relative time
 */
function formatTime(isoTimestamp) {
  if (!isoTimestamp) return 'never';

  try {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Format date
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Relative time
    let relativeTime = '';
    if (diffMins < 1) {
      relativeTime = 'just now';
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
    const envPath = path.join(__dirname, '../.env.local');

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
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
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'show-backup-status/1.0',
      },
      timeout: TIMEOUT_MS,
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          resolve({
            status: 'ERROR',
            message: 'Failed to parse API response',
          });
        }
      });
    });

    req.on('error', (error) => {
      // API unreachable - return UNKNOWN
      resolve({
        status: 'UNKNOWN',
        message: `API unreachable (${error.message})`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'UNKNOWN',
        message: 'API timeout',
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
    return `│ ${text}${' '.repeat(Math.max(0, padding))} │`;
  };
  const topBorder = `┌${'─'.repeat(BOX_WIDTH + 2)}┐`;
  const divider = `├${'─'.repeat(BOX_WIDTH + 2)}┤`;
  const bottomBorder = `└${'─'.repeat(BOX_WIDTH + 2)}┘`;

  console.log('');
  console.log(topBorder);

  switch (status.status) {
    case 'SUCCESS': {
      console.log(line('🟢 DATABASE BACKUP STATUS: SUCCESS'));
      console.log(divider);
      const lastSuccess = formatTime(status.lastSuccessAt);
      console.log(line(`Last successful backup: ${lastSuccess}`));
      if (status.artifact) {
        const artifact = status.artifact.length > BOX_WIDTH - 10
          ? status.artifact.substring(0, BOX_WIDTH - 13) + '...'
          : status.artifact;
        console.log(line(`Artifact: ${artifact}`));
      }
      if (status.durationSec) {
        console.log(line(`Duration: ${status.durationSec}s`));
      }
      if (status.environment) {
        console.log(line(`Environment: ${status.environment}`));
      }
      console.log(line(''));
      console.log(line('✅ Backup system is healthy and operational'));
      break;
    }

    case 'BLOCKED': {
      console.log(line('🔴 DATABASE BACKUP STATUS: BLOCKED'));
      console.log(divider);
      console.log(line('Blocking Reason:'));
      if (status.blockedReason) {
        const reason = status.blockedReason.length > BOX_WIDTH - 4
          ? status.blockedReason.substring(0, BOX_WIDTH - 7) + '...'
          : status.blockedReason;
        console.log(line(`  ${reason}`));
      }
      if (status.lastSuccessAt) {
        const lastSuccess = formatTime(status.lastSuccessAt);
        console.log(line(`Last success: ${lastSuccess}`));
      } else {
        console.log(line('Last success: never'));
      }
      console.log(line(''));
      console.log(line('⚠️  BACKUP SYSTEM IS BLOCKED - INVESTIGATE!'));
      break;
    }

    case 'UNKNOWN':
    default: {
      console.log(line('🟠 DATABASE BACKUP STATUS: UNKNOWN'));
      console.log(divider);
      console.log(line('No backup status found'));
      console.log(line(''));
      console.log(line('ℹ️  Backup system not configured or not run yet'));
      break;
    }
  }

  console.log(bottomBorder);
  console.log('');
}

/**
 * Main function
 */
async function main() {
  try {
    const status = await fetchBackupStatus();
    displayStatus(status);
  } catch (error) {
    console.error('Error fetching backup status:', error.message);
    // Non-blocking - always exit 0
    process.exit(0);
  }
}

main();
