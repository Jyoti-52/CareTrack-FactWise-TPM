import { createContext, useContext, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("caretrack-user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  async function login(email, password) {
    setLoading(true);
    try {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("caretrack-token", result.token);
      localStorage.setItem("caretrack-user", JSON.stringify(result.user));
      setUser(result.user);
      return result.user;
    } finally { setLoading(false); }
  }
  function logout() {
    localStorage.removeItem("caretrack-token");
    localStorage.removeItem("caretrack-user");
    setUser(null);
  }
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
