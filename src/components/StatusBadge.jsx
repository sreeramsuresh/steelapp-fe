import PropTypes from 'prop-types';

/**
 * Reusable status badge component with consistent styling
 * Used for invoice status, payment status, reminders, and promises
 */
const StatusBadge = ({ label, icon, config, isDarkMode, onClick, title }) => {
  const className = isDarkMode
    ? `${config.bgDark} ${config.textDark} ${config.borderDark}`
    : `${config.bgLight} ${config.textLight} ${config.borderLight}`;

  const badgeContent = (
    <span
      className={`inline-flex items-center ${icon ? 'gap-1' : ''} px-2 py-1 text-xs font-semibold rounded-full border ${className} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      onClick={onClick}
      title={title}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );

  return badgeContent;
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
};

export default StatusBadge;
