import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import { notificationService } from "../services/notificationService";
import { userAdminAPI } from "../services/userAdminApi";

export default function UserProfile() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Load current user on mount
  useEffect(() => {
    (async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        setEditData({
          name: user.name || "",
          email: user.email || "",
        });
      } catch (error) {
        console.error("Failed to load user:", error);
        notificationService.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await userAdminAPI.update(currentUser.id, {
        name: editData.name,
        email: editData.email,
      });
      setCurrentUser((prev) => ({
        ...prev,
        name: editData.name,
        email: editData.email,
      }));
      setEditMode(false);
      notificationService.success("Profile updated successfully");
    } catch (error) {
      notificationService.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChange.newPassword) {
      notificationService.warning("Please enter a new password");
      return;
    }

    if (passwordChange.newPassword.length < 8) {
      notificationService.warning("Password must be at least 8 characters");
      return;
    }

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      notificationService.warning("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await userAdminAPI.changePassword(currentUser.id, {
        current_password: passwordChange.currentPassword,
        new_password: passwordChange.newPassword,
      });
      setPasswordChange({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);
      notificationService.success("Password changed successfully");
    } catch (error) {
      notificationService.error(error?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
      notificationService.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if logout fails
      navigate("/login");
    }
  };

  if (loading && !currentUser) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Failed to load profile. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>My Profile</h1>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className={`rounded-2xl shadow-lg p-8 mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl ${
                  isDarkMode ? "bg-teal-600" : "bg-teal-500"
                }`}
              >
                {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {currentUser.name || "User"}
                </h2>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{currentUser.email}</p>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mt-1 ${
                    isDarkMode
                      ? "text-teal-400 border-teal-600 bg-teal-900/20"
                      : "text-teal-600 border-teal-300 bg-teal-50"
                  }`}
                >
                  {currentUser.role || "Administrator"}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
            >
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Edit Mode */}
          {editMode && (
            <div className="space-y-4 border-t pt-6">
              <div>
                <label
                  htmlFor="user-name-input"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Full Name
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-teal-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600"
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label
                  htmlFor="user-email-input"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Email
                </label>
                <input
                  id="user-email-input"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-teal-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600"
                  } focus:outline-none`}
                />
              </div>

              <button type="button" onClick={handleSaveProfile}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-700"
                    : "bg-teal-500 text-white hover:bg-teal-600 disabled:bg-gray-300"
                }`}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* View Mode */}
          {!editMode && (
            <div className="grid grid-cols-2 gap-6 border-t pt-6">
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Full Name</p>
                <p className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {currentUser.name || "Not set"}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Email</p>
                <p className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Card */}
        <div className={`rounded-2xl shadow-lg p-8 mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Security</h3>
            {!showPasswordChange && (
              <button type="button" onClick={() => setShowPasswordChange(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                Change Password
              </button>
            )}
          </div>

          {showPasswordChange && (
            <div className="space-y-4 border-t pt-6">
              <div>
                <label
                  htmlFor="current-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordChange.currentPassword}
                  onChange={(e) =>
                    setPasswordChange((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-teal-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600"
                  } focus:outline-none`}
                  placeholder="Enter current password"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordChange.newPassword}
                  onChange={(e) =>
                    setPasswordChange((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-teal-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600"
                  } focus:outline-none`}
                  placeholder="Enter new password (min 8 chars)"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordChange.confirmPassword}
                  onChange={(e) =>
                    setPasswordChange((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-teal-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-600"
                  } focus:outline-none`}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordChange({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleChangePassword}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-700"
                      : "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-300"
                  }`}
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Card */}
        <div className={`rounded-2xl shadow-lg p-8 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <button type="button" onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
