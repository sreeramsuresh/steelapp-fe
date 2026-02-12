import { Check, Fingerprint, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import { notificationService } from "../services/notificationService";

/**
 * Passkey management panel for UserProfile.
 * Lists, registers, renames, and deletes WebAuthn passkeys.
 */
export default function PasskeyManagement() {
  const { isDarkMode } = useTheme();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const isSupported = typeof window !== "undefined" && window.PublicKeyCredential !== undefined;

  useEffect(() => {
    if (isSupported) loadCredentials();
    else setLoading(false);
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await authService.listPasskeys();
      setCredentials(data || []);
    } catch (err) {
      console.error("Failed to load passkeys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      // Step 1: Get registration options from server
      const options = await authService.passkeyRegisterStart();

      // Step 2: Create credential via browser
      const { startRegistration } = await import("@simplewebauthn/browser");
      const credential = await startRegistration(options);

      // Step 3: Send to server for verification
      await authService.passkeyRegisterFinish(credential);
      notificationService.success("Passkey registered successfully");
      await loadCredentials();
    } catch (err) {
      if (err.name === "NotAllowedError") {
        notificationService.warning("Passkey registration was cancelled");
      } else {
        notificationService.error(err.message || "Failed to register passkey");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleRename = async (id) => {
    if (!editLabel.trim()) return;
    try {
      await authService.renamePasskey(id, editLabel.trim());
      setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, device_label: editLabel.trim() } : c)));
      setEditingId(null);
      notificationService.success("Passkey renamed");
    } catch (err) {
      notificationService.error(err.message || "Failed to rename passkey");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authService.deletePasskey(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
      notificationService.success("Passkey removed");
    } catch (err) {
      notificationService.error(err.message || "Failed to remove passkey");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isSupported) {
    return null; // Hide entirely if browser doesn't support WebAuthn
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Passkeys</h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Sign in quickly and securely with biometrics or a security key
          </p>
        </div>
        <button
          type="button"
          onClick={handleRegister}
          disabled={registering}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-teal-500 text-white hover:bg-teal-600"
          } disabled:opacity-60`}
        >
          {registering ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Registering...
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Passkey
            </>
          )}
        </button>
      </div>

      {loading ? (
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading passkeys...</p>
      ) : credentials.length === 0 ? (
        <div
          className={`text-center py-8 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}
        >
          <Fingerprint size={40} className={`mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            No passkeys registered yet. Add one to enable passwordless sign-in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Fingerprint
                  size={20}
                  className={isDarkMode ? "text-teal-400" : "text-teal-600"}
                />
                <div>
                  {editingId === cred.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(cred.id)}
                        className={`px-2 py-1 rounded border text-sm ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                        autoFocus
                      />
                      <button type="button" onClick={() => handleRename(cred.id)}>
                        <Check size={16} className="text-green-500" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        <X size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                      </button>
                    </div>
                  ) : (
                    <p className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {cred.device_label || "Passkey"}
                    </p>
                  )}
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Added {formatDate(cred.created_at)}
                    {cred.last_used_at && ` · Last used ${formatDate(cred.last_used_at)}`}
                  </p>
                </div>
              </div>

              {editingId !== cred.id && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(cred.id);
                      setEditLabel(cred.device_label || "Passkey");
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
                    }`}
                    title="Rename"
                  >
                    <Pencil size={14} />
                  </button>

                  {deletingId === cred.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(cred.id)}
                        className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className={`px-2 py-1 text-xs rounded ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(cred.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
                      }`}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
