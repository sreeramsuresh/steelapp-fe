import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { apiService } from "../services/axiosApi";

export default function AcceptInvite() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState("");

  // Redirect after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setStatus("submitting");
      await apiService.post("/auth/accept-invite", {
        token,
        username: username.trim(),
        password,
        name: name.trim() || undefined,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      const msg = err.response?.data?.error || err.message || "Failed to create account";
      setError(msg);
    }
  };

  // No token
  if (!token) {
    return (
      <div
        className={`min-h-screen w-screen fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-0 m-0 ${isDarkMode ? "bg-[#121418]" : "bg-gray-100"}`}
      >
        <div
          className={`w-full max-w-md min-w-80 mx-4 rounded-2xl border shadow-xl p-6 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-teal-600 to-teal-700 bg-clip-text text-transparent">
              ULTIMATE STEELS
            </h1>
          </div>
          <div
            className={`p-4 rounded-lg border mb-4 ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} />
              <span className="font-medium">Invalid Invitation Link</span>
            </div>
            <p className="text-sm">The invitation link is missing or malformed. Please contact your administrator.</p>
          </div>
          <Link
            to="/login"
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium transition-colors ${
              isDarkMode ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-teal-500 text-white hover:bg-teal-600"
            }`}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div
        className={`min-h-screen w-screen fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-0 m-0 ${isDarkMode ? "bg-[#121418]" : "bg-gray-100"}`}
      >
        <div
          className={`w-full max-w-md min-w-80 mx-4 rounded-2xl border shadow-xl p-6 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-teal-600 to-teal-700 bg-clip-text text-transparent">
              ULTIMATE STEELS
            </h1>
          </div>
          <div
            className={`p-4 rounded-lg border mb-4 ${isDarkMode ? "bg-green-900/20 border-green-700 text-green-400" : "bg-green-50 border-green-200 text-green-800"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} />
              <span className="font-medium">Account Created!</span>
            </div>
            <p className="text-sm">Your account has been set up successfully. Redirecting to login...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div
      className={`min-h-screen w-screen fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-0 m-0 ${isDarkMode ? "bg-[#121418]" : "bg-gray-100"}`}
    >
      <div
        className={`w-full max-w-md min-w-80 mx-4 rounded-2xl border shadow-xl ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        {/* Header */}
        <div className="p-6 pb-0 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-teal-600 to-teal-700 bg-clip-text text-transparent">
            ULTIMATE STEELS
          </h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Set up your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className={`p-3 rounded-lg border text-sm ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="accept-username" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Username
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                <Mail size={16} />
              </div>
              <input
                id="accept-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-[#121418] border-[#37474F] text-white placeholder-gray-500 focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                required
                minLength={3}
              />
            </div>
          </div>

          {/* Full Name (optional) */}
          <div>
            <label htmlFor="accept-fullname" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Full Name <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>(optional)</span>
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                <User size={16} />
              </div>
              <input
                id="accept-fullname"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Override the name set by your admin"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-[#121418] border-[#37474F] text-white placeholder-gray-500 focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                } focus:outline-none focus:ring-1 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="accept-password" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Password
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                <Lock size={16} />
              </div>
              <input
                id="accept-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-[#121418] border-[#37474F] text-white placeholder-gray-500 focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="accept-confirm-password" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Confirm Password
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                <Lock size={16} />
              </div>
              <input
                id="accept-confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  isDarkMode
                    ? "bg-[#121418] border-[#37474F] text-white placeholder-gray-500 focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-300 ${
              status === "submitting"
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            }`}
          >
            {status === "submitting" ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Help text */}
          <p className={`text-center text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Already have an account?{" "}
            <Link to="/login" className="text-teal-500 hover:text-teal-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
