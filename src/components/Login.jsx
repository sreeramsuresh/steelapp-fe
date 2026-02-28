import { Eye, EyeOff, Fingerprint, Lock, LogIn, Mail, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { authService, tokenUtils } from "../services/axiosAuthService";
import TwoFactorVerification from "./TwoFactorVerification";

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
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 ${
        isDarkMode ? "disabled:bg-gray-600 focus:ring-offset-gray-800" : "disabled:bg-gray-400 focus:ring-offset-white"
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-all before:duration-500 hover:before:left-full`;
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
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? "cursor-not-allowed opacity-80" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
    </button>
  );
};

/**
 * DEV-ONLY: RBAC Quick Login Panel
 * Shows buttons for each role to quickly switch and test permissions.
 */
const RBACTestPanel = ({ onLoginSuccess, isDarkMode }) => {
  const [accounts, setAccounts] = useState([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(null);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);

  const ROLE_COLORS = {
    managing_director: "bg-purple-600",
    operations_manager: "bg-purple-500",
    finance_manager_predefined: "bg-purple-400",
    sales_manager: "bg-blue-600",
    sales_manager_predefined: "bg-blue-600",
    purchase_manager: "bg-orange-600",
    purchase_manager_predefined: "bg-orange-600",
    warehouse_manager: "bg-cyan-600",
    warehouse_manager_predefined: "bg-cyan-600",
    accounts_manager: "bg-green-600",
    sales_executive: "bg-blue-400",
    sales_executive_predefined: "bg-blue-400",
    purchase_executive: "bg-orange-400",
    purchase_executive_predefined: "bg-orange-400",
    stock_keeper: "bg-cyan-400",
    accounts_executive: "bg-green-400",
    logistics_coordinator: "bg-teal-500",
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/auth/dev/rbac-test-accounts");
      const data = await res.json();
      setAccounts(data.testAccounts || data.test_accounts || []);
    } catch {
      /* ignore */
    }
  };

  const setupAccounts = async () => {
    setSetupLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/dev/setup-rbac-test-users", { method: "POST" });
      const data = await res.json();
      setAccounts(data.accounts || []);
      setMessage(`Created ${data.accounts?.length || 0} test accounts`);
    } catch (err) {
      setMessage(`Setup failed: ${err.message}`);
    } finally {
      setSetupLoading(false);
    }
  };

  const quickLogin = async (email) => {
    setLoginLoading(email);
    setMessage("");
    try {
      const res = await fetch("/api/auth/dev/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Server sets HttpOnly cookies — store user data for UI
      if (data.user) {
        tokenUtils.setUser(data.user);
      }
      if (onLoginSuccess) onLoginSuccess(data.user);
      // Force navigate to /app (bypasses the ?rbac redirect prevention)
      window.location.href = "/app";
    } catch (err) {
      setMessage(`Login failed: ${err.message}`);
    } finally {
      setLoginLoading(null);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchAccounts is stable, only needed on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg shadow-lg hover:bg-amber-500 text-sm font-medium"
        >
          <Shield size={16} />
          RBAC Test
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-80 max-h-[70vh] overflow-auto rounded-xl border shadow-2xl p-4 ${
        isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-bold ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}>RBAC Test Login</h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={`p-1 rounded ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          <X size={14} />
        </button>
      </div>

      {message && (
        <div
          className={`text-xs mb-2 p-2 rounded ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-600"}`}
        >
          {message}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="space-y-2">
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            No test accounts found. Run migration 0054 first, then setup test users.
          </p>
          <button
            type="button"
            onClick={setupAccounts}
            disabled={setupLoading}
            className="w-full py-2 px-3 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-500 disabled:opacity-50"
          >
            {setupLoading ? "Setting up..." : "Setup Test Users"}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Admin quick login */}
          <button
            type="button"
            onClick={() => quickLogin("admin@ultimatesteel.ae")}
            disabled={loginLoading !== null}
            className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors`}
          >
            {loginLoading === "admin@ultimatesteel.ae" ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
            ) : (
              <Shield size={12} />
            )}
            Admin (full access)
          </button>

          {/* Role-based logins */}
          {accounts
            .filter(
              (a) =>
                a.email !== "norole@rbac-test.local" &&
                !a.email.includes("test_role_") &&
                !a.email.includes("role_with_perms_")
            )
            .map((acct) => {
              const roleName = acct.roleNames?.[0] || acct.role_names?.[0] || acct.role_name || "unknown";
              const colorClass = ROLE_COLORS[roleName] || "bg-gray-500";
              const displayName = roleName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <button
                  type="button"
                  key={acct.email}
                  onClick={() => quickLogin(acct.email)}
                  disabled={loginLoading !== null}
                  className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-white ${colorClass} hover:opacity-90 disabled:opacity-50 transition-colors`}
                >
                  {loginLoading === acct.email ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full bg-white/50`} />
                  )}
                  {displayName}
                </button>
              );
            })}

          {/* No-role test */}
          <button
            type="button"
            onClick={() => quickLogin("norole@rbac-test.local")}
            disabled={loginLoading !== null}
            className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium border ${
              isDarkMode
                ? "border-gray-600 text-gray-400 hover:bg-gray-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            } disabled:opacity-50 transition-colors`}
          >
            {loginLoading === "norole@rbac-test.local" ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            ) : (
              <X size={12} />
            )}
            No Role (should be blocked)
          </button>

          <button
            type="button"
            onClick={setupAccounts}
            disabled={setupLoading}
            className={`w-full py-1.5 text-xs ${isDarkMode ? "text-gray-500 hover:text-gray-400" : "text-gray-400 hover:text-gray-500"}`}
          >
            {setupLoading ? "Refreshing..." : "Refresh test accounts"}
          </button>
        </div>
      )}
    </div>
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
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [twoFactorMethods, setTwoFactorMethods] = useState([]);

  // Lockout OTP bypass state
  const [showLockoutOtp, setShowLockoutOtp] = useState(false);
  const [lockoutToken, setLockoutToken] = useState(null);
  const [lockoutOtpCode, setLockoutOtpCode] = useState("");
  const [lockoutOtpLoading, setLockoutOtpLoading] = useState(false);
  const [lockoutOtpError, setLockoutOtpError] = useState("");
  const [lockoutOtpSent, setLockoutOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const isPasskeySupported = typeof window !== "undefined" && window.PublicKeyCredential !== undefined;

  // Lockout countdown
  useEffect(() => {
    if (lockoutMinutes <= 0) return;
    const timer = setInterval(() => {
      setLockoutMinutes((m) => {
        if (m <= 1) {
          setError("");
          setShowLockoutOtp(false);
          return 0;
        }
        return m - 1;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [lockoutMinutes]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-login in development mode
  useEffect(() => {
    const autoLogin = async () => {
      const isProduction = import.meta.env.PROD;
      const autoLoginEnabled = import.meta.env.VITE_AUTO_LOGIN === "true";

      if (isProduction || !autoLoginEnabled) {
        return;
      }

      // Skip auto-login if ?rbac is in the URL (allows RBAC test panel usage)
      if (window.location.search.includes("rbac")) {
        return;
      }

      const devEmail = import.meta.env.VITE_DEV_EMAIL;
      const devPassword = import.meta.env.VITE_DEV_PASSWORD;

      if (!devEmail || !devPassword) {
        console.warn("Auto-login enabled but dev credentials not configured");
        return;
      }

      const user = tokenUtils.getUser();
      if (user) {
        return;
      }

      setLoading(true);

      try {
        const response = await authService.login(devEmail, devPassword);

        if (response.requires2FA) {
          setRequires2FA(true);
          setTwoFactorToken(response.twoFactorToken);
          setTwoFactorMethods(response.methods);
          return;
        }

        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
      } catch (autoLoginError) {
        console.error("Auto-login failed:", autoLoginError.message);
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

      // Handle 2FA challenge
      if (response.requires2FA) {
        setRequires2FA(true);
        setTwoFactorToken(response.twoFactorToken);
        setTwoFactorMethods(response.methods);
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }
    } catch (loginError) {
      if (loginError.code === "ACCOUNT_LOCKED") {
        setLockoutMinutes(loginError.remainingMinutes || 15);
        setError(
          `Account locked due to too many failed attempts. Try again in ${loginError.remainingMinutes || 15} minutes.`
        );
      } else {
        setError(loginError.message || "Authentication failed");
      }
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

  // Handle successful 2FA verification
  const handle2FAVerified = (response) => {
    if (onLoginSuccess && response.user) {
      onLoginSuccess(response.user);
    }
  };

  // Cancel 2FA — return to login form
  const handle2FACancel = () => {
    setRequires2FA(false);
    setTwoFactorToken(null);
    setTwoFactorMethods([]);
  };

  // ── Lockout OTP bypass handlers ──────────────────────────────────
  const maskEmail = (email) => {
    const [local, domain] = email.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  };

  const handleSendLockoutOtp = async () => {
    setLockoutOtpLoading(true);
    setLockoutOtpError("");
    try {
      const response = await authService.sendLockoutOtp(formData.email);
      setLockoutToken(response.lockoutToken);
      setLockoutOtpSent(true);
      setShowLockoutOtp(true);
      setResendCooldown(60);
    } catch (err) {
      setLockoutOtpError(err.message);
    } finally {
      setLockoutOtpLoading(false);
    }
  };

  const handleVerifyLockoutOtp = async (code) => {
    if (!code || code.length !== 6) return;
    setLockoutOtpLoading(true);
    setLockoutOtpError("");
    try {
      const response = await authService.verifyLockoutOtp(lockoutToken, code);
      if (onLoginSuccess && response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setLockoutOtpError(err.message);
      setLockoutOtpCode("");
    } finally {
      setLockoutOtpLoading(false);
    }
  };

  const handleLockoutOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setLockoutOtpCode(val);
    if (val.length === 6) {
      handleVerifyLockoutOtp(val);
    }
  };

  const handleCancelLockoutOtp = () => {
    setShowLockoutOtp(false);
    setLockoutOtpSent(false);
    setLockoutToken(null);
    setLockoutOtpCode("");
    setLockoutOtpError("");
  };

  // Handle passkey login
  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError("");
    try {
      const options = await authService.passkeyLoginStart();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const credential = await startAuthentication({ optionsJSON: options });
      const response = await authService.passkeyLoginFinish(credential);
      if (onLoginSuccess && response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        // User cancelled — don't show error
      } else {
        setError(err.message || "Passkey authentication failed");
      }
    } finally {
      setPasskeyLoading(false);
    }
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
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {requires2FA ? "Verify your identity" : "Sign in to your account"}
          </p>
        </div>

        {/* 2FA Verification Step */}
        {requires2FA ? (
          <TwoFactorVerification
            twoFactorToken={twoFactorToken}
            methods={twoFactorMethods}
            onVerified={handle2FAVerified}
            onCancel={handle2FACancel}
          />
        ) : (
          <>
            <form onSubmit={handleSubmit} method="post" className="space-y-4">
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
                    autoComplete="email"
                    maxLength={254}
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
                    autoComplete="current-password"
                    maxLength={128}
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className={`text-sm font-medium ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"} transition-colors`}
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Lockout Warning + OTP Bypass */}
              {lockoutMinutes > 0 && (
                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode
                      ? "bg-orange-900/20 border-orange-700 text-orange-400"
                      : "bg-orange-50 border-orange-200 text-orange-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="flex-shrink-0" />
                    <span className="text-sm">
                      Account locked. Try again in {lockoutMinutes} minute{lockoutMinutes !== 1 ? "s" : ""}.
                    </span>
                  </div>

                  {/* OTP Input View */}
                  {showLockoutOtp && lockoutOtpSent ? (
                    <div className="mt-3 space-y-2">
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        A 6-digit code has been sent to {maskEmail(formData.email)}
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={lockoutOtpCode}
                        onChange={handleLockoutOtpChange}
                        disabled={lockoutOtpLoading}
                        placeholder="Enter 6-digit code"
                        className={`w-full px-3 py-2 text-center text-lg tracking-widest border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode
                            ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                      {lockoutOtpError && <p className="text-xs text-red-500">{lockoutOtpError}</p>}
                      {lockoutOtpLoading && (
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          Verifying...
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleSendLockoutOtp}
                          disabled={resendCooldown > 0 || lockoutOtpLoading}
                          className={`text-xs font-medium ${
                            resendCooldown > 0 || lockoutOtpLoading
                              ? isDarkMode
                                ? "text-gray-600"
                                : "text-gray-400"
                              : isDarkMode
                                ? "text-teal-400 hover:text-teal-300"
                                : "text-teal-600 hover:text-teal-700"
                          }`}
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelLockoutOtp}
                          className={`text-xs font-medium ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          Back to Login
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Unlock Button */
                    <button
                      type="button"
                      onClick={handleSendLockoutOtp}
                      disabled={lockoutOtpLoading || !formData.email}
                      className={`mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode
                          ? "bg-teal-700/30 text-teal-300 hover:bg-teal-700/50 disabled:opacity-50"
                          : "bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                      }`}
                    >
                      {lockoutOtpLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <Mail size={16} />
                      )}
                      {lockoutOtpLoading ? "Sending..." : "Unlock via Email OTP"}
                    </button>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {error && !lockoutMinutes && (
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
                disabled={loading || lockoutMinutes > 0}
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

            {/* Passkey Login */}
            {isPasskeySupported && (
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-60"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60"
                  }`}
                >
                  {passkeyLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={18} />
                      Sign in with Passkey
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DEV-ONLY: RBAC Quick Login Panel */}
      {!import.meta.env.PROD && <RBACTestPanel onLoginSuccess={onLoginSuccess} isDarkMode={isDarkMode} />}
    </div>
  );
};

export default Login;
