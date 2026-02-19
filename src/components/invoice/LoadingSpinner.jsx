import { useTheme } from "../../contexts/ThemeContext";

const LoadingSpinner = ({ size = "md" }) => {
  const { isDarkMode } = useTheme();
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-blue-600 ${
        sizes[size]
      } ${isDarkMode ? "border-gray-300" : "border-gray-200"}`}
    ></div>
  );
};

export default LoadingSpinner;
