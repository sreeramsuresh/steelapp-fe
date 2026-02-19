import { createContext, useContext } from "react";

export const AuthContext = createContext();

/**
 * Auth Context Provider
 * Provides user information from App.jsx to child components
 */
export function AuthProvider({ children, user }) {
  const value = {
    user,
    isAuthenticated: !!user,
    userId: user?.id,
    companyId: user?.companyId,
    companyName: user?.companyName,
    role: user?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Returns user and authentication state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
