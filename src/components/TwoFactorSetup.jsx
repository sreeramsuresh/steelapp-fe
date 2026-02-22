import { Check, ClipboardCopy, Download, KeyRound, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";

/**
 * Step wizard for enabling two-factor authentication.
 * Step 1: Start setup
 * Step 2: Scan QR code + verify code
 * Step 3: Show recovery codes
 *
 * @param {object} props
 * @param {function} props.onComplete - Called when setup is finished
 * @param {function} props.onCancel - Called to close the wizard
 */
export default function TwoFactorSetup({ onComplete, onCancel }) {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupData, setSetupData] = useState(null); // { secret, otpauthUrl }
  const [verifyCode, setVerifyCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1 → 2: Start setup
  const handleStartSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to start 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → 3: Verify TOTP code
  const handleVerifySetup = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const data = await authService.verifySetup2FA(verifyCode, setupData.secret);
      setRecoveryCodes(data.recoveryCodes || []);
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
      setVerifyCode("");
    } finally {
      setLoading(false);
    }
  };

  // Copy recovery codes
  const handleCopy = () => {
    const text = recoveryCodes.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download recovery codes
  const handleDownload = () => {
    const text = `Ultimate Steels — Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${recoveryCodes.join("\n")}\n\nEach code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ultimate-steels-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardClass = `rounded-2xl border shadow-lg p-6 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`;
  const labelClass = `block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`;
  const btnPrimary =
    "w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const btnSecondary = `w-full py-2 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`;

  // ── Step 1: Introduction ─────────────────────────
  if (step === 1) {
    return (
      <div className={cardClass}>
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Enable Two-Factor Authentication
          </h3>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Add an extra layer of security to your account using an authenticator app like Google Authenticator, Authy,
            or 1Password.
          </p>
        </div>

        {error && (
          <div
            className={`p-3 rounded-lg border text-sm mb-4 ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`}
          >
            {error}
          </div>
        )}

        <button type="button" onClick={handleStartSetup} disabled={loading} className={btnPrimary}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Setting up...
            </>
          ) : (
            <>
              <KeyRound size={18} />
              Begin Setup
            </>
          )}
        </button>

        <button type="button" onClick={onCancel} className={`${btnSecondary} mt-3`}>
          Cancel
        </button>
      </div>
    );
  }

  // ── Step 2: QR Code + Verify ─────────────────────
  if (step === 2) {
    const QRComponent = QRCodeSVG;

    return (
      <div className={cardClass}>
        <div className="text-center mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Scan QR Code</h3>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Scan this code with your authenticator app
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-lg">
            {QRComponent && setupData?.otpauthUrl ? (
              <QRComponent value={setupData.otpauthUrl} size={200} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-500 text-sm">
                QR code unavailable
              </div>
            )}
          </div>
        </div>

        {/* Manual entry */}
        {setupData?.secret && (
          <div
            className={`p-3 rounded-lg border mb-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
          >
            <p className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Or enter this key manually:
            </p>
            <code className={`text-sm font-mono break-all ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
              {setupData.secret}
            </code>
          </div>
        )}

        {/* Verify code */}
        <div className="mb-4">
          <label htmlFor="totp-verify" className={labelClass}>
            Enter verification code
          </label>
          <input
            id="totp-verify"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            placeholder="000000"
            className={`w-full text-center text-2xl tracking-[0.3em] font-mono py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? "bg-[#1E2328] border-gray-600 text-white placeholder-gray-600"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            }`}
          />
        </div>

        {error && (
          <div
            className={`p-3 rounded-lg border text-sm mb-4 ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-200 text-red-800"}`}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifySetup}
          disabled={loading || verifyCode.length !== 6}
          className={btnPrimary}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Verifying...
            </>
          ) : (
            <>
              <Check size={18} />
              Verify & Enable
            </>
          )}
        </button>

        <button type="button" onClick={onCancel} className={`${btnSecondary} mt-3`}>
          Cancel
        </button>
      </div>
    );
  }

  // ── Step 3: Recovery Codes ───────────────────────
  return (
    <div className={cardClass}>
      <div className="text-center mb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-3">
          <Check size={24} className="text-white" />
        </div>
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Two-Factor Authentication Enabled
        </h3>
        <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Save these recovery codes in a secure location. Each code can only be used once.
        </p>
      </div>

      <div
        className={`grid grid-cols-2 gap-2 p-4 rounded-lg border mb-4 font-mono text-sm ${
          isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"
        }`}
      >
        {recoveryCodes.map((code) => (
          <div key={code} className="text-center py-1">
            {code}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
          }`}
        >
          <ClipboardCopy size={14} />
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
          }`}
        >
          <Download size={14} />
          Download
        </button>
      </div>

      <label
        className={`flex items-center gap-2 text-sm mb-4 cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
      >
        <input
          type="checkbox"
          checked={savedConfirmed}
          onChange={(e) => setSavedConfirmed(e.target.checked)}
          className="rounded border-gray-400"
        />
        I've saved these recovery codes
      </label>

      <button type="button" onClick={onComplete} disabled={!savedConfirmed} className={btnPrimary}>
        Done
      </button>
    </div>
  );
}
