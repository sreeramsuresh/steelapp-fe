import { useTheme } from "../../contexts/ThemeContext";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 ${
        isDarkMode ? "disabled:bg-gray-600 focus:ring-offset-gray-800" : "disabled:bg-gray-400 focus:ring-offset-white"
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md`;
    } else if (variant === "secondary") {
      return `${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400 disabled:bg-gray-100 focus:ring-offset-white"
      }`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:bg-gray-50 focus:ring-offset-white"
      } focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? "cursor-not-allowed" : ""
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
