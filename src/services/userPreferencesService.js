import { userAdminAPI } from "./userAdminApi";

const STORAGE_KEYS = {
  HOME_SECTION_ORDER: "steelapp_home_section_order",
};

export const userPreferencesService = {
  getCurrentUser() {
    try {
      const currentUser = localStorage.getItem("currentUser");
      return currentUser ? JSON.parse(currentUser) : null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  },

  async updatePermissions(userId, permissionsUpdate) {
    const user = await userAdminAPI.update(userId, {
      permissions: permissionsUpdate,
    });

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, permissions: user.permissions };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    }

    return user;
  },

  getHomeSectionOrder() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOME_SECTION_ORDER);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load section order from localStorage:", error);
      return null;
    }
  },

  setHomeSectionOrder(order) {
    try {
      localStorage.setItem(STORAGE_KEYS.HOME_SECTION_ORDER, JSON.stringify(order));
    } catch (error) {
      console.warn("Failed to save section order to localStorage:", error);
    }
  },
};
