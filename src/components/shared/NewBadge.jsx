/**
 * NewBadge Component
 * Displays a "NEW" badge for records created within a specified time threshold.
 * Part of the unified Preview/Download system.
 */
import React from "react";
import PropTypes from "prop-types";

/**
 * Utility function to check if a record is "new" based on creation timestamp.
 * Handles various timestamp formats including ISO strings and Firestore-style objects.
 *
 * @param {string|Date|Object} createdAt - The creation timestamp
 * @param {number} hoursThreshold - Number of hours to consider "new" (default: 2)
 * @returns {boolean} - True if record is within the threshold
 */
export const isNewRecord = (createdAt, hoursThreshold = 2) => {
  if (!createdAt) return false;

  let timeMs;

  // Handle Firestore-style timestamp objects { seconds: number, nanos: number }
  if (typeof createdAt === "object" && createdAt.seconds) {
    timeMs = createdAt.seconds * 1000;
  } else if (createdAt instanceof Date) {
    timeMs = createdAt.getTime();
  } else {
    // Handle ISO string or other parseable formats
    timeMs = new Date(createdAt).getTime();
  }

  // Validate the timestamp
  if (isNaN(timeMs)) return false;

  const now = Date.now();
  const thresholdMs = hoursThreshold * 60 * 60 * 1000;

  return now - timeMs < thresholdMs;
};

/**
 * NewBadge Component
 * Renders a small teal "NEW" text indicator if the record was created within the threshold.
 * Styled as simple dark text without background - clean and minimal.
 *
 * @param {Object} props
 * @param {string|Date|Object} props.createdAt - The creation timestamp
 * @param {number} props.hoursThreshold - Hours to consider "new" (default: 2)
 * @param {string} props.className - Additional CSS classes
 */
const NewBadge = ({ createdAt, hoursThreshold = 2, className = "" }) => {
  if (!isNewRecord(createdAt, hoursThreshold)) {
    return null;
  }

  return (
    <span
      className={`
        ml-1.5
        text-[0.625rem] font-semibold uppercase tracking-wide
        text-teal-700
        dark:text-teal-400
        ${className}
      `.trim()}
    >
      NEW
    </span>
  );
};

NewBadge.propTypes = {
  createdAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.shape({
      seconds: PropTypes.number,
      nanos: PropTypes.number,
    }),
  ]),
  hoursThreshold: PropTypes.number,
  className: PropTypes.string,
};

NewBadge.defaultProps = {
  hoursThreshold: 2,
  className: "",
};

export default NewBadge;
