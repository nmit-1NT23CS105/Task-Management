import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("taskflow_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((currentUser) => {
        setUser(currentUser);
        localStorage.setItem("taskflow_user", JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem("taskflow_token");
        localStorage.removeItem("taskflow_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(payload) {
    const data = await authApi.login(payload);
    localStorage.setItem("taskflow_token", data.access_token);
    localStorage.setItem("taskflow_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const data = await authApi.signup(payload);
    localStorage.setItem("taskflow_token", data.access_token);
    localStorage.setItem("taskflow_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("taskflow_token");
      localStorage.removeItem("taskflow_user");
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
