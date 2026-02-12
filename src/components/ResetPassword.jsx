import { ArrowLeft, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";

export default function ResetPassword() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState("");

  // Redirect after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

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
            <p className="text-sm">Invalid reset link. The link may be malformed or missing.</p>
          </div>
          <Link
            to="/forgot-password"
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-teal-500 text-white hover:bg-teal-600"
            }`}
          >
            Request a New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStatus("submitting");
    try {
      await authService.resetPassword(token, password);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
      setStatus("error");
    }
  };

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
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {status === "success" ? "Password reset!" : "Create a new password"}
          </p>
        </div>

        {status === "success" ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${isDarkMode ? "bg-teal-900/20 border-teal-700 text-teal-300" : "bg-teal-50 border-teal-200 text-teal-800"}`}
            >
              <p className="text-sm">Your password has been reset successfully. Redirecting to login...</p>
            </div>
            <Link
              to="/login"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium transition-colors ${
                isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              <ArrowLeft size={18} />
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="new-password"
                className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
              >
                New Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                />
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirm-password"
                className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {error && (
              <div
                className={`p-3 rounded-lg border text-sm ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`}
              >
                {error}
                {status === "error" && (
                  <Link
                    to="/forgot-password"
                    className={`block mt-2 font-medium ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                  >
                    Request a new reset link
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "submitting" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <Link
              to="/login"
              className={`flex items-center justify-center gap-2 text-sm font-medium ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
