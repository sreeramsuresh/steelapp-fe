/**
 * Timezone Utility for Steel App
 *
 * SYSTEM ARCHITECTURE:
 * - Backend/Database: Store ALL timestamps in UTC
 * - Frontend: Display ALL timestamps in UAE timezone (UTC+4)
 *
 * This utility provides consistent timezone handling across the entire frontend.
 * All date/time displays should use these functions.
 */

const UAE_TIMEZONE = "Asia/Dubai";
const UAE_OFFSET_HOURS = 4;

/**
 * Convert UTC date to UAE timezone for display
 * @param {string|Date|number|object} utcDate - UTC date (string, Date, timestamp seconds, or proto Timestamp object)
 * @param {object} options - Formatting options
 * @param {string} options.format - Output format: 'date', 'time', 'datetime', 'short', 'long', 'input'
 * @param {boolean} options.showTimezone - Whether to append "(UAE)" to output
 * @returns {string} Formatted date in UAE timezone
 */
export const toUAETime = (utcDate, options = {}) => {
  if (!utcDate) return "";

  // Handle proto Timestamp objects { seconds: number, nanos?: number }
  let date;
  if (typeof utcDate === "object" && utcDate.seconds !== undefined) {
    date = new Date(utcDate.seconds * 1000);
  } else {
    date = new Date(utcDate);
  }

  if (isNaN(date.getTime())) return "";

  const { format = "datetime", showTimezone = false } = options;

  // Format options for different use cases
  const dateOptions = {
    timeZone: UAE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const dateOptionsLong = {
    timeZone: UAE_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const timeOptions = {
    timeZone: UAE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const dateTimeOptions = {
    timeZone: UAE_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  let result;
  switch (format) {
    case "date":
      // DD/MM/YYYY format
      result = date.toLocaleDateString("en-GB", {
        ...dateOptions,
        timeZone: UAE_TIMEZONE,
      });
      break;

    case "long":
      // "January 15, 2025" format
      result = date.toLocaleDateString("en-AE", {
        ...dateOptionsLong,
        timeZone: UAE_TIMEZONE,
      });
      break;

    case "time":
      // "02:30 PM" format
      result = date.toLocaleTimeString("en-AE", {
        ...timeOptions,
        timeZone: UAE_TIMEZONE,
      });
      break;

    case "datetime":
      // "Jan 15, 2025, 02:30 PM" format
      result = date.toLocaleString("en-AE", {
        ...dateTimeOptions,
        timeZone: UAE_TIMEZONE,
      });
      break;

    case "short": {
      // "15/01/2025" format (DD/MM/YYYY)
      const dd = String(
        date.toLocaleString("en-GB", {
          day: "2-digit",
          timeZone: UAE_TIMEZONE,
        }),
      );
      const mm = String(
        date.toLocaleString("en-GB", {
          month: "2-digit",
          timeZone: UAE_TIMEZONE,
        }),
      );
      const yyyy = date.toLocaleString("en-GB", {
        year: "numeric",
        timeZone: UAE_TIMEZONE,
      });
      result = `${dd}/${mm}/${yyyy}`;
      break;
    }

    case "input":
      // YYYY-MM-DD format for HTML date inputs
      // This converts UTC to UAE local date for display in input fields
      result = toUAEDateForInput(date);
      break;

    case "iso": {
      // ISO format with UAE offset: 2025-01-15T14:30:00+04:00
      const uaeDate = new Date(
        date.getTime() + UAE_OFFSET_HOURS * 60 * 60 * 1000,
      );
      result = uaeDate.toISOString().replace("Z", "+04:00");
      break;
    }

    default:
      result = date.toLocaleString("en-AE", { timeZone: UAE_TIMEZONE });
  }

  if (showTimezone && format !== "iso" && format !== "input") {
    result += " (UAE)";
  }

  return result;
};

/**
 * Convert UTC date to YYYY-MM-DD format in UAE timezone for HTML date inputs
 * @param {string|Date|object} utcDate - UTC date
 * @returns {string} Date in YYYY-MM-DD format (UAE local date)
 */
export const toUAEDateForInput = (utcDate) => {
  if (!utcDate) return "";

  // Handle proto Timestamp objects
  let date;
  if (typeof utcDate === "object" && utcDate.seconds !== undefined) {
    date = new Date(utcDate.seconds * 1000);
  } else {
    date = new Date(utcDate);
  }

  if (isNaN(date.getTime())) return "";

  // Use en-CA locale which naturally produces YYYY-MM-DD format
  return date.toLocaleDateString("en-CA", { timeZone: UAE_TIMEZONE });
};

/**
 * Convert UAE local date/time input to UTC for API submission
 * When a user enters a date in a form, they enter it as UAE local time.
 * This function converts that to UTC for storage.
 *
 * @param {string} uaeDateString - Date string from input (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
 * @param {string} type - 'date' for date-only, 'datetime' for date+time
 * @returns {string} ISO string in UTC
 */
export const toUTC = (uaeDateString, type = "date") => {
  if (!uaeDateString) return null;

  // For date-only inputs, assume start of day in UAE (00:00:00 UAE = 20:00:00 previous day UTC)
  if (type === "date" && !uaeDateString.includes("T")) {
    // Parse as UAE local date, then convert to UTC
    // Creating a date with explicit time ensures consistent behavior
    const [year, month, day] = uaeDateString.split("-").map(Number);

    // Create date at midnight UAE time (which is 4 hours ahead of UTC)
    // So midnight UAE = previous day 20:00 UTC
    const uaeDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    // Subtract 4 hours to convert from UAE to UTC
    const utcDate = new Date(
      uaeDate.getTime() - UAE_OFFSET_HOURS * 60 * 60 * 1000,
    );

    return utcDate.toISOString();
  }

  // For datetime inputs
  const date = new Date(uaeDateString);
  if (isNaN(date.getTime())) return null;

  // Subtract UAE offset to get UTC
  return new Date(
    date.getTime() - UAE_OFFSET_HOURS * 60 * 60 * 1000,
  ).toISOString();
};

/**
 * Convert a date to proto Timestamp format
 * @param {string|Date} date - Date to convert
 * @returns {object} Proto Timestamp { seconds: number, nanos: 0 }
 */
export const toProtoTimestamp = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return { seconds: Math.floor(d.getTime() / 1000), nanos: 0 };
};

/**
 * Get current time in UAE timezone (formatted string)
 * @param {string} format - Output format
 * @returns {string} Current UAE time
 */
export const nowUAE = (format = "datetime") => {
  return toUAETime(new Date(), { format });
};

/**
 * Get current UTC time as ISO string
 * @returns {string} Current UTC time in ISO format
 */
export const nowUTC = () => {
  return new Date().toISOString();
};

/**
 * Check if a date is overdue (past due date in UAE timezone)
 * @param {string|Date|object} dueDate - Due date to check
 * @returns {boolean} True if overdue
 */
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;

  let date;
  if (typeof dueDate === "object" && dueDate.seconds !== undefined) {
    date = new Date(dueDate.seconds * 1000);
  } else {
    date = new Date(dueDate);
  }

  if (isNaN(date.getTime())) return false;

  // Compare in UAE timezone
  const now = new Date();
  const currentUAE = new Date(
    now.toLocaleString("en-US", { timeZone: UAE_TIMEZONE }),
  );
  const dueDateUAE = new Date(
    date.toLocaleString("en-US", { timeZone: UAE_TIMEZONE }),
  );

  // Set both to start of day for date-only comparison
  currentUAE.setHours(0, 0, 0, 0);
  dueDateUAE.setHours(0, 0, 0, 0);

  return currentUAE > dueDateUAE;
};

/**
 * Calculate hours since a timestamp (for 24-hour edit window calculations)
 * @param {string|Date|object} timestamp - The timestamp to check
 * @returns {number} Hours elapsed since the timestamp
 */
export const hoursSince = (timestamp) => {
  if (!timestamp) return Infinity;

  let date;
  if (typeof timestamp === "object" && timestamp.seconds !== undefined) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return Infinity;

  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
};

/**
 * Check if within 24-hour edit window (for invoice revisions)
 * @param {string|Date|object} issuedAt - When the invoice was issued
 * @returns {boolean} True if within 24-hour window
 */
export const isWithinEditWindow = (issuedAt) => {
  return hoursSince(issuedAt) < 24;
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date|object} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return "";

  let d;
  if (typeof date === "object" && date.seconds !== undefined) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  // For older dates, show the actual date
  return toUAETime(d, { format: "date" });
};

// Export constants for reference
export const TIMEZONE_CONFIG = {
  UAE_TIMEZONE,
  UAE_OFFSET_HOURS,
  UTC_OFFSET: 0,
};

// ============================================================================
// PROFESSIONAL PDF/DOCUMENT FORMATS
// For business documents (invoices, quotations, POs, etc.)
// These formats are designed for international business use
// ============================================================================

/**
 * Professional date format for business documents (date-only fields)
 * Example: "26 November 2025"
 *
 * Use for: Invoice Date, Due Date, Order Date, Delivery Date
 *
 * @param {string|Date|object} utcDate - UTC date (string, Date, timestamp, or proto Timestamp)
 * @returns {string} Formatted date like "26 November 2025"
 */
export const toUAEDateProfessional = (utcDate) => {
  if (!utcDate) return "";

  // Handle proto Timestamp objects { seconds: number, nanos?: number }
  let date;
  if (typeof utcDate === "object" && utcDate.seconds !== undefined) {
    date = new Date(utcDate.seconds * 1000);
  } else {
    date = new Date(utcDate);
  }

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    timeZone: UAE_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Professional datetime format for business documents (timestamp fields)
 * Example: "26 November 2025, 10:14 AM GST (UTC+4)"
 *
 * Use for: Created timestamps, Updated timestamps, Payment timestamps
 *
 * @param {string|Date|object} utcDate - UTC date (string, Date, timestamp, or proto Timestamp)
 * @returns {string} Formatted datetime like "26 November 2025, 10:14 AM GST (UTC+4)"
 */
export const toUAEDateTimeProfessional = (utcDate) => {
  if (!utcDate) return "";

  // Handle proto Timestamp objects
  let date;
  if (typeof utcDate === "object" && utcDate.seconds !== undefined) {
    date = new Date(utcDate.seconds * 1000);
  } else {
    date = new Date(utcDate);
  }

  if (isNaN(date.getTime())) return "";

  const dateStr = date.toLocaleDateString("en-GB", {
    timeZone: UAE_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = date
    .toLocaleTimeString("en-GB", {
      timeZone: UAE_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase(); // Ensure AM/PM is uppercase

  return `${dateStr}, ${timeStr} GST (UTC+4)`;
};

/**
 * Short professional date format for tables and compact displays
 * Example: "26/11/2025"
 *
 * @param {string|Date|object} utcDate - UTC date
 * @returns {string} Date in DD/MM/YYYY format
 */
export const toUAEDateShort = (utcDate) => {
  if (!utcDate) return "";

  // Handle proto Timestamp objects
  let date;
  if (typeof utcDate === "object" && utcDate.seconds !== undefined) {
    date = new Date(utcDate.seconds * 1000);
  } else {
    date = new Date(utcDate);
  }

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    timeZone: UAE_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Timezone disclaimer for document footers
 * Use in PDF footers to clarify timezone for international customers
 */
export const TIMEZONE_DISCLAIMER =
  "All dates and times are in Gulf Standard Time (GST, UTC+4)";

/**
 * Short timezone label for inline use
 */
export const TIMEZONE_LABEL = "GST (UTC+4)";

/**
 * Professional format specifically for payment history entries
 * Example: "26 Nov 2025, 2:30 PM GST"
 *
 * @param {string|Date|object} utcDate - UTC date
 * @returns {string} Compact datetime format
 */
export const toUAEPaymentDateTime = (utcDate) => {
  if (!utcDate) return "";

  // Handle proto Timestamp objects
  let date;
  if (typeof utcDate === "object" && utcDate.seconds !== undefined) {
    date = new Date(utcDate.seconds * 1000);
  } else {
    date = new Date(utcDate);
  }

  if (isNaN(date.getTime())) return "";

  const dateStr = date.toLocaleDateString("en-GB", {
    timeZone: UAE_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeStr = date
    .toLocaleTimeString("en-GB", {
      timeZone: UAE_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

  return `${dateStr}, ${timeStr} GST`;
};

// Default export for convenience
export default {
  toUAETime,
  toUAEDateForInput,
  toUTC,
  toProtoTimestamp,
  nowUAE,
  nowUTC,
  isOverdue,
  hoursSince,
  isWithinEditWindow,
  formatRelativeTime,
  TIMEZONE_CONFIG,
  // Professional PDF formats
  toUAEDateProfessional,
  toUAEDateTimeProfessional,
  toUAEDateShort,
  toUAEPaymentDateTime,
  TIMEZONE_DISCLAIMER,
  TIMEZONE_LABEL,
};
