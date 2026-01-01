/**
 * Test Logger Utility
 *
 * Provides structured logging for integration tests.
 * Uses process.stdout/stderr which are allowed by ESLint,
 * wrapped in a proper logging interface.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'info' unless TEST_LOG_LEVEL is set
const currentLogLevel: LogLevel = (process.env.TEST_LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `${prefix} ${entry.message}${dataStr}\n`;
}

/**
 * Test Logger
 *
 * Usage:
 * ```ts
 * import { testLogger } from './utils/testLogger';
 *
 * testLogger.info('Test started');
 * testLogger.debug('Detailed info', { customerId: '123' });
 * testLogger.warn('Something unexpected');
 * testLogger.error('Test failed', { error: err.message });
 * ```
 */
export const testLogger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      const entry: LogEntry = { timestamp: formatTimestamp(), level: 'debug', message, data };
      process.stdout.write(formatMessage(entry));
    }
  },

  info(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      const entry: LogEntry = { timestamp: formatTimestamp(), level: 'info', message, data };
      process.stdout.write(formatMessage(entry));
    }
  },

  warn(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      const entry: LogEntry = { timestamp: formatTimestamp(), level: 'warn', message, data };
      process.stdout.write(formatMessage(entry));
    }
  },

  error(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const entry: LogEntry = { timestamp: formatTimestamp(), level: 'error', message, data };
      process.stderr.write(formatMessage(entry));
    }
  },

  /** Log test step completion with checkmark */
  success(message: string): void {
    if (shouldLog('info')) {
      const entry: LogEntry = { timestamp: formatTimestamp(), level: 'info', message: `✓ ${message}` };
      process.stdout.write(formatMessage(entry));
    }
  },

  /** Log test step warning */
  step(message: string): void {
    if (shouldLog('info')) {
      const entry: LogEntry = { timestamp: formatTimestamp(), level: 'info', message: `→ ${message}` };
      process.stdout.write(formatMessage(entry));
    }
  },
};

export default testLogger;
