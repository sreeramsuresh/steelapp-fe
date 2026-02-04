import { Eye, EyeOff, Lock, LogIn, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";

// Custom Tailwind Components
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  startIcon,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${isDarkMode ? "bg-gray-600" : "bg-gray-400"} disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${isDarkMode ? "gray-800" : "white"} before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-all before:duration-500 hover:before:left-full`;
    } else {
      // outline
      return `border ${isDarkMode ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"} focus:ring-teal-500 disabled:${isDarkMode ? "bg-gray-800" : "bg-gray-50"} focus:ring-offset-${isDarkMode ? "gray-800" : "white"}`;
    }
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button type="button" className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? "cursor-not-allowed opacity-80" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
    </button>
  );
};

const Login = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // 🚀 HYBRID AUTH: Auto-login in development mode
  useEffect(() => {
    const autoLogin = async () => {
      // Only in development mode AND when VITE_AUTO_LOGIN is explicitly enabled
      const isProduction = import.meta.env.PROD;
      const autoLoginEnabled = import.meta.env.VITE_AUTO_LOGIN === "true";

      if (isProduction || !autoLoginEnabled) {
        return; // Skip auto-login in production or when disabled
      }

      const devEmail = import.meta.env.VITE_DEV_EMAIL;
      const devPassword = import.meta.env.VITE_DEV_PASSWORD;

      if (!devEmail || !devPassword) {
        console.warn("⚠️  Auto-login enabled but dev credentials not configured");
        return;
      }

      // Check if already logged in (has valid token)
      const token = localStorage.getItem("token");
      if (token) {
        return;
      }

      setLoading(true);

      try {
        const response = await authService.login(devEmail, devPassword);

        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
      } catch (autoLoginError) {
        console.error("❌ Auto-login failed:", autoLoginError.message);
        // Don't show error to user, just let them login manually
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, [onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(formData.email, formData.password);

      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }
    } catch (loginError) {
      setError(loginError.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const { isDarkMode } = useTheme();

  return (
    <div
      className={`min-h-screen w-screen fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-0 m-0 ${isDarkMode ? "bg-[#121418]" : "bg-gray-100"}`}
    >
      <div
        className={`w-full max-w-md min-w-80 mx-4 rounded-2xl border shadow-xl p-6 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className={`text-3xl font-bold mb-2 bg-gradient-to-br from-teal-600 to-teal-700 bg-clip-text text-transparent`}
          >
            ULTIMATE STEELS
          </h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1">
            <label
              htmlFor="email-input"
              className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                id="email-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-500 autofill:shadow-[inset_0_0_0_1000px_#1E2328] autofill:[-webkit-text-fill-color:white]"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 autofill:shadow-[inset_0_0_0_1000px_white] autofill:[-webkit-text-fill-color:black]"
                } hover:border-gray-400 focus:border-teal-500`}
                placeholder="Enter your email"
                style={{
                  WebkitBoxShadow: isDarkMode ? "0 0 0 1000px #1E2328 inset" : "0 0 0 1000px white inset",
                  WebkitTextFillColor: isDarkMode ? "white" : "black",
                  transition: "background-color 5000s ease-in-out 0s",
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label
              htmlFor="password-input"
              className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 pr-12 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-500 autofill:shadow-[inset_0_0_0_1000px_#1E2328] autofill:[-webkit-text-fill-color:white]"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 autofill:shadow-[inset_0_0_0_1000px_white] autofill:[-webkit-text-fill-color:black]"
                } hover:border-gray-400 focus:border-teal-500`}
                placeholder="Enter your password"
                style={{
                  WebkitBoxShadow: isDarkMode ? "0 0 0 1000px #1E2328 inset" : "0 0 0 1000px white inset",
                  WebkitTextFillColor: isDarkMode ? "white" : "black",
                  transition: "background-color 5000s ease-in-out 0s",
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-all duration-300 hover:scale-110 ${
                  isDarkMode
                    ? "text-gray-500 hover:text-white hover:bg-teal-600/10"
                    : "text-gray-400 hover:text-gray-900 hover:bg-teal-50"
                }`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className={`p-3 rounded-lg border animate-pulse ${
                isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <X size={16} className="flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className={`w-full mt-6 font-semibold ${loading ? "loading" : ""}`}
            startIcon={
              loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <LogIn size={18} />
              )
            }
          >
            {loading ? "Please wait..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
