import { KeyRound, Mail, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";

/**
 * Inline 2FA verification component rendered inside Login.jsx
 * when the server responds with requires2FA: true.
 *
 * @param {object} props
 * @param {string} props.twoFactorToken - Short-lived 2FA JWT
 * @param {string[]} props.methods - Available methods e.g. ['totp']
 * @param {function} props.onVerified - Called with full auth response on success
 * @param {function} props.onCancel - Return to login form
 */
export default function TwoFactorVerification({ twoFactorToken, methods, onVerified, onCancel }) {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState("");
  const [method, setMethod] = useState(methods?.[0] || "totp"); // totp | email | recovery
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailCooldown, setEmailCooldown] = useState(0);
  const inputRef = useRef(null);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Email OTP cooldown timer
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => setEmailCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  const handleSendEmailOTP = async () => {
    if (emailCooldown > 0) return;
    try {
      await authService.sendEmailOTP(twoFactorToken);
      setEmailCooldown(60);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to send email code");
    }
  };

  const handleVerify = async (verifyCode) => {
    const codeToVerify = verifyCode || code;
    if (!codeToVerify.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await authService.verify2FA(twoFactorToken, codeToVerify.trim(), method);
      onVerified(response);
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
      setCode("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\s/g, "");
    setCode(val);

    // Auto-submit when 6 digits entered (for totp/email methods)
    if (method !== "recovery" && val.length === 6) {
      handleVerify(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  const switchMethod = (newMethod) => {
    setMethod(newMethod);
    setCode("");
    setError("");
    if (newMethod === "email") {
      handleSendEmailOTP();
    }
  };

  const isRecovery = method === "recovery";
  const placeholder = isRecovery ? "Enter recovery code" : "Enter 6-digit code";
  const maxLength = isRecovery ? 8 : 6;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center mb-3">
          <Shield size={24} className="text-white" />
        </div>
        <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Two-Factor Authentication
        </h2>
        <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          {method === "totp" && "Enter the code from your authenticator app"}
          {method === "email" && "Enter the code sent to your email"}
          {method === "recovery" && "Enter one of your recovery codes"}
        </p>
      </div>

      {/* Code input */}
      <div>
        <input
          ref={inputRef}
          type="text"
          inputMode={isRecovery ? "text" : "numeric"}
          autoComplete="one-time-code"
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          disabled={loading}
          placeholder={placeholder}
          className={`w-full text-center text-2xl tracking-[0.3em] font-mono py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            isDarkMode
              ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-600"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
          }`}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className={`p-3 rounded-lg border text-sm ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {error}
        </div>
      )}

      {/* Verify button */}
      <button
        type="button"
        onClick={() => handleVerify()}
        disabled={loading || !code.trim()}
        className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Verifying...
          </>
        ) : (
          "Verify"
        )}
      </button>

      {/* Method switchers */}
      <div className={`flex flex-col gap-2 pt-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {method !== "totp" && methods?.includes("totp") && (
          <button
            type="button"
            onClick={() => switchMethod("totp")}
            className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
          >
            <KeyRound size={14} />
            Use authenticator app
          </button>
        )}
        {method !== "email" && (
          <button
            type="button"
            onClick={() => switchMethod("email")}
            className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
          >
            <Mail size={14} />
            {emailCooldown > 0 ? `Send email code (${emailCooldown}s)` : "Send code via email"}
          </button>
        )}
        {method === "email" && emailCooldown > 0 && (
          <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Resend available in {emailCooldown}s
          </p>
        )}
        {method !== "recovery" && (
          <button
            type="button"
            onClick={() => switchMethod("recovery")}
            className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
          >
            <Shield size={14} />
            Use a recovery code
          </button>
        )}
      </div>

      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        className={`w-full text-sm font-medium ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"} transition-colors`}
      >
        Use a different account
      </button>
    </div>
  );
}
