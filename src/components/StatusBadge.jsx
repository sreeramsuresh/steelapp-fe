import PropTypes from "prop-types";

/**
 * Reusable status badge component with consistent styling
 * Used for invoice status, payment status, reminders, and promises
 */
const StatusBadge = ({
  label,
  icon,
  config,
  isDarkMode,
  onClick,
  title,
  size = "default",
  fullWidth = false,
}) => {
  const className = isDarkMode
    ? `${config.bgDark} ${config.textDark} ${config.borderDark}`
    : `${config.bgLight} ${config.textLight} ${config.borderLight}`;

  // Size variants for padding and text
  const sizeClasses =
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  const widthClasses = fullWidth ? "w-full justify-center" : "";

  const sharedClasses = `inline-flex items-center ${icon ? "gap-1" : ""} ${sizeClasses} ${widthClasses} font-semibold rounded-full border ${className}`;

  // If clickable, render as button for accessibility
  if (onClick) {
    return (
      <button
        type="button"
        className={`${sharedClasses} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={onClick}
        title={title}
      >
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </button>
    );
  }

  // Otherwise, render as span (non-interactive)
  return (
    <span className={sharedClasses} title={title}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  config: PropTypes.shape({
    bgLight: PropTypes.string.isRequired,
    bgDark: PropTypes.string.isRequired,
    textLight: PropTypes.string.isRequired,
    textDark: PropTypes.string.isRequired,
    borderLight: PropTypes.string.isRequired,
    borderDark: PropTypes.string.isRequired,
  }).isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  title: PropTypes.string,
  size: PropTypes.oneOf(["default", "sm"]),
  fullWidth: PropTypes.bool,
};

export default StatusBadge;
