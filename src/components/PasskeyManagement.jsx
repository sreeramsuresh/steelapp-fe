import { Check, Cloud, Fingerprint, Key, Monitor, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import { notificationService } from "../services/notificationService";
import { toUAEDateMedium } from "../utils/timezone";

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
  const [naming, setNaming] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");

  const isSupported = typeof window !== "undefined" && window.PublicKeyCredential !== undefined;
  const editInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const loadCredentials = useCallback(async () => {
    try {
      const data = await authService.listPasskeys();
      setCredentials(data || []);
    } catch (err) {
      console.error("Failed to load passkeys:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupported) loadCredentials();
    else setLoading(false);
  }, [isSupported, loadCredentials]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const startNaming = async () => {
    // Pre-check: if passkeys exist, verify this device doesn't already have one
    // by attempting a silent credential lookup against existing IDs
    if (credentials.length > 0) {
      try {
        const existingIds = credentials.map((c) => ({
          id: Uint8Array.from(atob(c.credentialId.replace(/-/g, "+").replace(/_/g, "/")), (ch) => ch.charCodeAt(0)),
          type: "public-key",
          transports: ["internal"],
        }));
        const result = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: existingIds,
            userVerification: "discouraged",
            timeout: 5000,
          },
          mediation: "silent",
        });
        if (result) {
          notificationService.warning("This device already has a passkey registered for your account");
          return;
        }
      } catch {
        // Silent check failed — no matching credential on this device, proceed normally
      }
    }
    setNewDeviceName("");
    setNaming(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const cancelNaming = () => {
    setNaming(false);
    setNewDeviceName("");
  };

  const handleRegister = async (deviceLabel) => {
    if (!deviceLabel?.trim()) return;
    setNaming(false);
    setRegistering(true);
    try {
      // Step 1: Get registration options + ceremonyId from server
      const startResponse = await authService.passkeyRegisterStart();
      const { ceremonyId, ...optionsJSON } = startResponse;

      // Step 2: Create credential via browser (platform-first, fallback to any authenticator)
      const { startRegistration } = await import("@simplewebauthn/browser");
      let credential;
      try {
        credential = await startRegistration({ optionsJSON });
      } catch (platformErr) {
        if (platformErr.name === "InvalidStateError") {
          notificationService.warning("This device already has a passkey registered for your account");
          return;
        }
        if (platformErr.name === "NotSupportedError" || platformErr.message?.includes("no authenticator")) {
          // No platform authenticator — retry without the constraint (shows OS chooser dialog)
          delete optionsJSON.authenticatorSelection?.authenticatorAttachment;
          credential = await startRegistration({ optionsJSON });
        } else {
          throw platformErr;
        }
      }

      // Step 3: Send to server for verification with ceremonyId + device label
      await authService.passkeyRegisterFinish(credential, ceremonyId, deviceLabel.trim());
      notificationService.success("Passkey registered successfully");
      setNewDeviceName("");
      await loadCredentials();
    } catch (err) {
      if (err.name === "InvalidStateError") {
        notificationService.warning("This device already has a passkey registered for your account");
      } else if (err.name === "NotAllowedError") {
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
      setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, deviceLabel: editLabel.trim() } : c)));
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
    return toUAEDateMedium(dateStr) || "Never";
  };

  const getDeviceIcon = (deviceType) => {
    if (deviceType === "singleDevice" || deviceType === "platform") return Monitor;
    if (deviceType === "multiDevice" || deviceType === "cross-platform") return Key;
    return Fingerprint;
  };

  if (!isSupported) {
    return null; // Hide entirely if browser doesn't support WebAuthn
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Passkeys</h3>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Sign in quickly and securely with biometrics or a security key
          </p>
        </div>
        <button
          type="button"
          onClick={startNaming}
          disabled={registering || naming}
          className={`flex items-center justify-center gap-2 min-w-[160px] h-10 px-4 text-sm rounded-lg font-medium transition-colors ${
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

      {naming && (
        <div
          className={`flex items-center gap-2 mb-4 p-3 rounded-lg border ${
            isDarkMode ? "border-teal-700 bg-teal-900/20" : "border-teal-200 bg-teal-50"
          }`}
        >
          <input
            ref={nameInputRef}
            type="text"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister(newDeviceName)}
            placeholder='e.g. "Office Laptop", "My iPhone"'
            maxLength={100}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:outline-hidden focus:ring-1 focus:ring-teal-500`}
          />
          <button
            type="button"
            onClick={() => handleRegister(newDeviceName)}
            disabled={!newDeviceName.trim()}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              isDarkMode ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-teal-500 text-white hover:bg-teal-600"
            } disabled:opacity-40`}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={cancelNaming}
            className={`px-3 py-2 text-sm rounded-lg ${isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"}`}
          >
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading passkeys...</p>
      ) : credentials.length === 0 ? (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}
        >
          <Fingerprint size={20} className={`shrink-0 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
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
                {(() => {
                  const DeviceIcon = getDeviceIcon(cred.deviceType);
                  return <DeviceIcon size={20} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />;
                })()}
                <div>
                  {editingId === cred.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        ref={editInputRef}
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(cred.id)}
                        className={`px-2 py-1 rounded border text-sm ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-hidden focus:ring-1 focus:ring-teal-500`}
                      />
                      <button type="button" onClick={() => handleRename(cred.id)}>
                        <Check size={16} className="text-green-500" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        <X size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {cred.deviceLabel || "Passkey"}
                      </p>
                      {cred.backedUp && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isDarkMode ? "bg-sky-900/50 text-sky-300" : "bg-sky-100 text-sky-700"
                          }`}
                          title="This passkey is synced to the cloud and available on your other devices"
                        >
                          <Cloud size={10} />
                          Synced
                        </span>
                      )}
                    </div>
                  )}
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Added {formatDate(cred.createdAt)}
                    {cred.lastUsedAt && ` · Last used ${formatDate(cred.lastUsedAt)}`}
                  </p>
                </div>
              </div>

              {editingId !== cred.id && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(cred.id);
                      setEditLabel(cred.deviceLabel || "Passkey");
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
