import { useTheme } from "../../contexts/ThemeContext";

const Card = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
        isDarkMode ? "bg-gray-800 border border-gray-600" : "bg-white border border-gray-200"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
